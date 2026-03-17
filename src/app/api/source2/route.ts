import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

const MAIN_URL = "https://www.fullhdfilmizlesene.de";

const HEADERS = {
    "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
    Referer: `${MAIN_URL}/`,
};

/** ROT13 cipher */
function rot13(s: string): string {
    return s.replace(/[a-zA-Z]/g, (c) => {
        const base = c <= "Z" ? 65 : 97;
        return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
    });
}

/** Base64 decode */
function atob(s: string): string {
    return Buffer.from(s, "base64").toString("utf-8");
}

/** Decode an encoded video link */
function decodeLink(encoded: string): string {
    return atob(rot13(encoded));
}

interface SCXEntry {
    sx?: { t?: unknown };
}

interface SCXData {
    atom?: SCXEntry;
    advid?: SCXEntry;
    advidprox?: SCXEntry;
    proton?: SCXEntry;
    fast?: SCXEntry;
    fastly?: SCXEntry;
    tr?: SCXEntry;
    en?: SCXEntry;
}

const SCX_KEYS = ["atom", "advid", "advidprox", "proton", "fast", "fastly", "tr", "en"] as const;

/** Labels for UI */
const KEY_LABELS: Record<string, string> = {
    tr: "Turkish Dub",
    en: "English",
    atom: "Atom",
    advid: "Advid",
    advidprox: "Advid ProX",
    proton: "Proton",
    fast: "Fast",
    fastly: "Fastly",
};

export interface VideoSource {
    label: string;
    url: string;
    lang: string;
}

async function fetchHtml(url: string): Promise<string> {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
    return res.text();
}

/** Search for the movie and return its page URL */
async function searchMovie(title: string): Promise<string | null> {
    const searchUrl = `${MAIN_URL}/arama/${encodeURIComponent(title)}`;
    const html = await fetchHtml(searchUrl);
    const $ = cheerio.load(html);
    const firstResult = $("li.film a").first().attr("href");
    return firstResult || null;
}

/** Extract SCX video links from a movie page */
function extractVideoLinks(html: string): VideoSource[] {
    const $ = cheerio.load(html);

    // Find the first non-empty script tag
    let scriptContent = "";
    $("script").each((_i, el) => {
        const data = $(el).html() || "";
        if (data.includes("scx =")) {
            scriptContent = data.trim();
            return false; // break
        }
    });

    if (!scriptContent) return [];

    // Extract scx = {...};
    const scxMatch = scriptContent.match(/scx\s*=\s*(\{[\s\S]*?\});/);
    if (!scxMatch) return [];

    let scxData: SCXData;
    try {
        scxData = JSON.parse(scxMatch[1]);
    } catch {
        return [];
    }

    const sources: VideoSource[] = [];

    for (const key of SCX_KEYS) {
        const entry = scxData[key];
        if (!entry?.sx?.t) continue;

        const t = entry.sx.t;
        const label = KEY_LABELS[key] || key;

        if (Array.isArray(t)) {
            // Array of base64+rot13 encoded strings
            for (const encodedLink of t) {
                if (typeof encodedLink === "string") {
                    try {
                        const url = decodeLink(encodedLink);
                        if (url.startsWith("http")) {
                            sources.push({ label, url, lang: key === "tr" ? "tr" : key === "en" ? "en" : "other" });
                        }
                    } catch { /* skip malformed */ }
                }
            }
        } else if (typeof t === "object" && t !== null) {
            // Map of quality -> encoded link
            for (const [subKey, value] of Object.entries(t as Record<string, unknown>)) {
                if (typeof value === "string") {
                    try {
                        const url = decodeLink(value);
                        if (url.startsWith("http")) {
                            sources.push({
                                label: `${label} (${subKey})`,
                                url,
                                lang: key === "tr" ? "tr" : key === "en" ? "en" : "other",
                            });
                        }
                    } catch { /* skip */ }
                }
            }
        }
    }

    return sources;
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get("title");

    if (!title) {
        return NextResponse.json({ error: "Missing title parameter" }, { status: 400 });
    }

    try {
        // Step 1: Search for the movie
        const movieUrl = await searchMovie(title);
        if (!movieUrl) {
            return NextResponse.json({ error: "No results found", sources: [] }, { status: 404 });
        }

        // Step 2: Load movie page and extract links
        const movieHtml = await fetchHtml(movieUrl);
        const sources = extractVideoLinks(movieHtml);

        if (sources.length === 0) {
            return NextResponse.json({ error: "No video links found", sources: [] }, { status: 404 });
        }

        return NextResponse.json({ sources, movieUrl });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[source2] Error:", message);
        return NextResponse.json({ error: message, sources: [] }, { status: 500 });
    }
}
