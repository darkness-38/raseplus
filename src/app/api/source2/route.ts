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

const KEY_LABELS: Record<string, string> = {
    tr: "Türkçe Dublaj",
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

async function fetchHtml(url: string): Promise<{ html: string; status: number; finalUrl: string }> {
    const res = await fetch(url, {
        headers: HEADERS,
        redirect: "follow",
        cache: "no-store",
    });
    const html = await res.text();
    return { html, status: res.status, finalUrl: res.url };
}

/** Slugify a title the way Turkish sites typically do */
function slugify(title: string): string {
    return title
        .toLowerCase()
        .replace(/[çÇ]/g, "c")
        .replace(/[şŞ]/g, "s")
        .replace(/[ğĞ]/g, "g")
        .replace(/[üÜ]/g, "u")
        .replace(/[öÖ]/g, "o")
        .replace(/[ıİ]/g, "i")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

/** Search variants to try */
function buildSearchUrls(title: string): string[] {
    return [
        // Raw title (space encoded as +)
        `${MAIN_URL}/arama/${title.replace(/\s+/g, "+")}`,
        // Raw encodeURIComponent
        `${MAIN_URL}/arama/${encodeURIComponent(title)}`,
        // Slugified with dashes
        `${MAIN_URL}/arama/${slugify(title)}`,
        // First word only
        `${MAIN_URL}/arama/${title.split(" ")[0]}`,
    ];
}

/** Try multiple search URL variants, return first hit */
async function searchMovie(title: string): Promise<{ movieUrl: string; searchUrl: string; debug: string[] } | null> {
    const urls = buildSearchUrls(title);
    const debugLog: string[] = [];

    for (const searchUrl of urls) {
        try {
            debugLog.push(`Trying: ${searchUrl}`);
            const { html, status, finalUrl } = await fetchHtml(searchUrl);
            debugLog.push(`  → status=${status}, finalUrl=${finalUrl}`);

            const $ = cheerio.load(html);

            // Try multiple selectors because site structure might vary
            const selectors = [
                "li.film a",
                "ul.film-list li a",
                "div.film-list a",
                ".post-title a",
                "article a",
                "h2 a",
            ];

            for (const sel of selectors) {
                const href = $(sel).first().attr("href");
                if (href) {
                    const fullUrl = href.startsWith("http") ? href : `${MAIN_URL}${href}`;
                    debugLog.push(`  ✓ Found with selector "${sel}": ${fullUrl}`);
                    return { movieUrl: fullUrl, searchUrl, debug: debugLog };
                }
            }

            // Log a snippet of the HTML to help diagnose selector mismatches
            const bodyText = $("body").text().slice(0, 200).replace(/\s+/g, " ").trim();
            debugLog.push(`  ✗ No match. Body snippet: ${bodyText}`);
        } catch (err) {
            debugLog.push(`  ✗ Fetch error: ${err instanceof Error ? err.message : String(err)}`);
        }
    }

    return null;
}

/** Extract SCX video links from a movie page */
function extractVideoLinks(html: string): VideoSource[] {
    const $ = cheerio.load(html);

    let scriptContent = "";
    $("script").each((_i, el) => {
        const data = $(el).html() || "";
        if (data.includes("scx =") || data.includes("scx=")) {
            scriptContent = data.trim();
            return false;
        }
    });

    if (!scriptContent) return [];

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
            for (const encodedLink of t) {
                if (typeof encodedLink === "string") {
                    try {
                        const url = decodeLink(encodedLink);
                        if (url.startsWith("http")) {
                            sources.push({ label, url, lang: key === "tr" ? "tr" : key === "en" ? "en" : "other" });
                        }
                    } catch { /* skip */ }
                }
            }
        } else if (typeof t === "object" && t !== null) {
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
    const directUrl = searchParams.get("url"); // bypass search — pass movie page URL directly
    const debug = searchParams.get("debug") === "1";

    if (!title && !directUrl) {
        return NextResponse.json({ error: "Missing title or url parameter" }, { status: 400 });
    }

    try {
        let movieUrl: string;
        let debugInfo: string[] = [];

        if (directUrl) {
            // Direct URL mode — skip search
            movieUrl = directUrl;
            debugInfo.push(`Direct URL mode: ${directUrl}`);
        } else {
            const result = await searchMovie(title!);
            debugInfo = result?.debug ?? [`No results for title: "${title}"`];

            if (!result) {
                console.error("[source2] Search failed:", debugInfo);
                return NextResponse.json({
                    error: "No results found",
                    sources: [],
                    ...(debug ? { debugLog: debugInfo } : {}),
                }, { status: 404 });
            }
            movieUrl = result.movieUrl;
        }

        const { html: movieHtml, status } = await fetchHtml(movieUrl);
        debugInfo.push(`Movie page status: ${status}`);

        const sources = extractVideoLinks(movieHtml);
        debugInfo.push(`Sources found: ${sources.length}`);

        if (sources.length === 0) {
            console.error("[source2] No video links found at:", movieUrl);
            return NextResponse.json({
                error: "Movie found but no video links extracted",
                sources: [],
                movieUrl,
                ...(debug ? { debugLog: debugInfo } : {}),
            }, { status: 404 });
        }

        return NextResponse.json({
            sources,
            movieUrl,
            ...(debug ? { debugLog: debugInfo } : {}),
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[source2] Error:", message);
        return NextResponse.json({ error: message, sources: [] }, { status: 500 });
    }
}
