import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

const MAIN_URL = "https://www.fullhdfilmizlesene.live";

const BASE_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
    "Referer": MAIN_URL + "/",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "same-origin",
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

function decodeAjaxData(id: string, no: string): string {
    try {
        const keyString = no + "ajax";
        const e = 255 & (keyString.charCodeAt(0) ^ keyString.length);
        let f = id.split("").reverse().join("");
        f = ((b) => b + "===".slice((b.length + 3) % 4))(f).replace(/-/g, "+").replace(/_/g, "/");
        
        const decoded = Buffer.from(f, "base64");
        const bytes = new Uint8Array(decoded.length);
        for (let i = 0; i < decoded.length; i++) {
            bytes[i] = decoded[i] ^ e;
        }
        return Buffer.from(bytes).toString("utf-8");
    } catch (err) {
        console.error("Decoding error:", err);
        return "";
    }
}

async function searchMovie(query: string): Promise<{ url: string | null; status?: number }> {
    try {
        const searchUrl = `${MAIN_URL}/arama/${encodeURIComponent(query)}`;
        const res = await fetch(searchUrl, {
            headers: BASE_HEADERS,
            redirect: "follow"
        });
        
        const finalUrl = res.url;
        const html = await res.text();
        
        if (res.status === 403) {
            console.error("[source2] Blocked by Cloudflare (403)");
            return { url: null, status: 403 };
        }

        console.log(`[source2] Search URL: ${searchUrl}, Final URL: ${finalUrl}, Status: ${res.status}`);
        
        // CASE 1: Redirected to a movie page
        if (!finalUrl.includes("/arama/")) {
            return { url: finalUrl, status: res.status };
        }

        // CASE 2: Is the search page actually the movie page (happens without redirect sometimes)
        if (html.includes("scx = {")) {
            return { url: finalUrl, status: res.status };
        }

        const $ = cheerio.load(html);
        let firstMovieUrl: string | null = null;

        // CASE 3: Decode .ajax-data results (Modern search results)
        $(".ajax-data").each((_, el) => {
            if (firstMovieUrl) return;
            const id = $(el).attr("data-id");
            const no = $(el).attr("data-no");
            if (id && no) {
                const decodedHtml = decodeAjaxData(id, no);
                if (decodedHtml) {
                    const $decoded = cheerio.load(decodedHtml);
                    const href = $decoded("a").first().attr("href");
                    if (href) {
                        firstMovieUrl = href.startsWith("http") ? href : `${MAIN_URL}${href}`;
                    }
                }
            }
        });

        if (firstMovieUrl) return { url: firstMovieUrl, status: res.status };

        // CASE 4: Standard li.film selector (Classic search results)
        const firstResult = $("li.film a").first();
        if (firstResult.length) {
            const href = firstResult.attr("href");
            if (href) {
                const url = href.startsWith("http") ? href : `${MAIN_URL}${href}`;
                return { url, status: res.status };
            }
        }
    } catch (err) {
        console.error("Search error (source2):", err);
    }
    return { url: null };
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

    const { url: movieUrl, status: searchStatus } = await searchMovie(title);
    if (!movieUrl) {
        return NextResponse.json({ 
            error: "No results found", 
            sources: [],
            debug: process.env.NODE_ENV === "development" ? `Search status: ${searchStatus}` : undefined
        }, { status: 404 });
    }

    const sources = await extractVideoLinks(movieUrl);

    if (sources.length === 0) {
        return NextResponse.json({ 
            error: "No sources found", 
            sources: [],
            debug: process.env.NODE_ENV === "development" ? { movieUrl } : undefined
        }, { status: 404 });
    }

    return NextResponse.json({ sources });
}
