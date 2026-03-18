import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

const MAIN_URL = "https://www.fullhdfilmizlesene.live";

const BASE_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
    "Cache-Control": "max-age=0",
    "Sec-Ch-Ua": "\"Chromium\";v=\"122\", \"Not(A:Browser\";v=\"24\", \"Google Chrome\";v=\"122\"",
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": "\"Windows\"",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1"
};

function rot13(s: string): string {
    return s.replace(/[a-zA-Z]/g, (c) => {
        const base = c <= "Z" ? 65 : 97;
        return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
    });
}

function atob(s: string): string {
    return Buffer.from(s, "base64").toString("utf-8");
}

function decodeScx(s: string): string {
    try {
        return atob(rot13(s));
    } catch {
        return "";
    }
}

async function searchMovie(query: string): Promise<string | null> {
    try {
        const searchUrl = `${MAIN_URL}/arama/${encodeURIComponent(query)}`;
        const res = await fetch(searchUrl, { headers: BASE_HEADERS });
        const html = await res.text();
        const $ = cheerio.load(html);

        const firstResult = $("li.film a").first();
        if (firstResult.length) {
            const href = firstResult.attr("href");
            if (href) {
                return href.startsWith("http") ? href : `${MAIN_URL}${href}`;
            }
        }
    } catch (err) {
        console.error("Search error (source2):", err);
    }
    return null;
}

async function extractVideoLinks(movieUrl: string): Promise<any[]> {
    try {
        const res = await fetch(movieUrl, { headers: BASE_HEADERS });
        const html = await res.text();
        const $ = cheerio.load(html);

        let scxData: any = null;
        $("script").each((_, el) => {
            const scriptContent = $(el).html() || "";
            const match = scriptContent.match(/scx = (.*?);/);
            if (match) {
                try {
                    scxData = JSON.parse(match[1]);
                } catch (e) {
                    console.error("Failed to parse scx data", e);
                }
            }
        });

        if (!scxData) return [];

        const sources: any[] = [];
        const keys = Object.keys(scxData);

        for (const key of keys) {
            const t = scxData[key]?.sx?.t;
            if (!t) continue;

            const lang = key === "tr" ? "tr" : key === "en" ? "en" : "tr"; // Default to TR if unknown for now
            const labelPrefix = key.toUpperCase();

            if (Array.isArray(t)) {
                for (const encoded of t) {
                    const decoded = decodeScx(encoded);
                    if (decoded) {
                        sources.push({ label: `${labelPrefix} Source`, url: decoded, lang });
                    }
                }
            } else if (typeof t === "object") {
                for (const [subKey, encoded] of Object.entries(t)) {
                    const decoded = decodeScx(encoded as string);
                    if (decoded) {
                        sources.push({ label: `${labelPrefix} - ${subKey}`, url: decoded, lang });
                    }
                }
            }
        }

        return sources;
    } catch (err) {
        console.error("Extraction error:", err);
        return [];
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get("title");

    if (!title) {
        return NextResponse.json({ error: "Missing title" }, { status: 400 });
    }

    const movieUrl = await searchMovie(title);
    if (!movieUrl) {
        return NextResponse.json({ error: "No results found", sources: [] }, { status: 404 });
    }

    const sources = await extractVideoLinks(movieUrl);

    if (sources.length === 0) {
        return NextResponse.json({ error: "No sources found", sources: [] }, { status: 404 });
    }

    return NextResponse.json({ sources });
}
