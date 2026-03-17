import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

const MAIN_URL = "https://www.hdfilmcehennemi.nl";

const BASE_HEADERS = {
    "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
};

/** Base64 decode */
function base64Decode(s: string): string {
    return Buffer.from(s.trim(), "base64").toString("utf-8");
}

/**
 * Minimal JsUnpacker / p,a,c,k,e,d deobfuscator
 * Ported from the standard JavaScript unpacker algorithm.
 */
function jsUnpack(packed: string): string {
    // Match: eval(function(p,a,c,k,e,{d|r}) {...}('...',N,N,'...'...))
    const packedMatch = packed.match(
        /eval\(function\(p,a,c,k,e,[dr]\)\{[\s\S]+?\}\('([\s\S]+?)',(\d+),(\d+),'([\s\S]+?)'\.split/
    );
    if (!packedMatch) return packed;

    const [, p, aStr, , kStr] = packedMatch;
    const a = parseInt(aStr, 10);
    const k = kStr.split("|");

    function decode(base: number, n: number): string {
        const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let result = "";
        while (n > 0) {
            result = chars[n % base] + result;
            n = Math.floor(n / base);
        }
        return result || "0";
    }

    const result = p.replace(/\b(\w+)\b/g, (word) => {
        const num = parseInt(word, 36);
        if (!isNaN(num) && num < k.length && k[num]) {
            return k[num];
        }
        // For higher bases: convert word from base a
        const idx = parseInt(word, a);
        if (!isNaN(idx) && idx < k.length && k[idx]) {
            return k[idx];
        }
        void decode; // suppress unused warning
        return word;
    });

    return result;
}

export interface VideoSource {
    label: string;
    url: string;
    lang: string;
}

interface SearchResults {
    results: string[];
}

async function fetchHtml(url: string, extraHeaders: Record<string, string> = {}): Promise<string> {
    const res = await fetch(url, {
        headers: { ...BASE_HEADERS, ...extraHeaders },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
    return res.text();
}

/** Search for the movie; returns its page URL */
async function searchMovie(title: string): Promise<string | null> {
    const searchUrl = `${MAIN_URL}/search?q=${encodeURIComponent(title)}`;
    const res = await fetch(searchUrl, {
        headers: {
            ...BASE_HEADERS,
            "X-Requested-With": "fetch",
            Accept: "application/json",
        },
    });

    if (!res.ok) return null;

    // The API returns { results: string[] } where each string is an HTML snippet
    let data: SearchResults;
    try {
        data = await res.json();
    } catch {
        return null;
    }

    if (!data.results?.length) return null;

    // Parse first result HTML snippet
    const firstHtml = data.results[0];
    const $ = cheerio.load(firstHtml);
    const href = $("a").first().attr("href");
    if (!href) return null;

    return href.startsWith("http") ? href : `${MAIN_URL}${href}`;
}

/**
 * Given an iframe player URL, fetch and extract the HLS video URL.
 * The script contains packed JS with file_link="<base64_url>"
 */
async function extractVideoUrl(iframeUrl: string, referer: string): Promise<string | null> {
    try {
        const html = await fetchHtml(iframeUrl, { Referer: referer });
        const $ = cheerio.load(html);

        let scriptContent = "";
        $("script").each((_i, el) => {
            const data = $(el).html() || "";
            if (data.includes("sources:") || data.includes("file_link")) {
                scriptContent = data.trim();
                return false; // break
            }
        });

        if (!scriptContent) return null;

        // Try to unpack if it's packed JS
        let unpacked = scriptContent;
        if (scriptContent.includes("eval(function(p,a,c,k")) {
            // Extract just the eval(...) part
            const evalMatch = scriptContent.match(/(eval\(function\(p,a,c,k[\s\S]+?\)\))/);
            if (evalMatch) {
                unpacked = jsUnpack(evalMatch[1]);
            }
        }

        // Extract file_link="<base64>"
        const fileLinkMatch = unpacked.match(/file_link\s*[=:]\s*["']([A-Za-z0-9+/=]+)["']/);
        if (fileLinkMatch) {
            return base64Decode(fileLinkMatch[1]);
        }

        // Fallback: look for a direct file URL
        const fileMatch = unpacked.match(/file\s*:\s*["'](https?:\/\/[^"']+)["']/);
        if (fileMatch) return fileMatch[1];

        return null;
    } catch (err) {
        console.error("[source3] extractVideoUrl error:", err);
        return null;
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get("title");
    const type = searchParams.get("type") || "movie"; // "movie" | "tv"
    void type; // might be used for logic later

    if (!title) {
        return NextResponse.json({ error: "Missing title parameter" }, { status: 400 });
    }

    try {
        // Step 1: Search for the movie/series
        const movieUrl = await searchMovie(title);
        if (!movieUrl) {
            return NextResponse.json({ error: "No results found", sources: [] }, { status: 404 });
        }

        // Step 2: Load movie page
        const movieHtml = await fetchHtml(movieUrl, { Referer: `${MAIN_URL}/` });
        const $ = cheerio.load(movieHtml);

        // Step 3: Find all alternative-link buttons
        const sources: VideoSource[] = [];

        const altLinks = $("div.alternative-links");
        if (!altLinks.length) {
            return NextResponse.json({ error: "No alternative links found", sources: [] }, { status: 404 });
        }

        // Process all buttons (with Promise.all for parallelism)
        const tasks: Promise<void>[] = [];

        altLinks.each((_i, el) => {
            const lang = $(el).attr("data-lang")?.toUpperCase() || "TR";
            const langLabel = lang === "TR" ? "Türkçe Dublaj" : lang === "EN" ? "English" : lang;
            const langCode = lang === "TR" ? "tr" : lang === "EN" ? "en" : "other";

            $(el).find("button.alternative-link").each((_j, btn) => {
                const sourceName = $(btn).text().replace("(HDrip Xbet)", "").trim();
                const videoId = $(btn).attr("data-video");
                if (!videoId) return;

                const task = (async () => {
                    try {
                        // Step 4: Fetch the video ID to get the iframe URL
                        const apiUrl = `${MAIN_URL}/video/${videoId}/`;
                        const apiHtml = await fetchHtml(apiUrl, {
                            "Content-Type": "application/json",
                            "X-Requested-With": "fetch",
                            Referer: movieUrl,
                        });

                        // Extract iframe data-src
                        const iframeMatch = apiHtml.match(/data-src=\\?"([^"\\]+)\\?"/);
                        if (!iframeMatch) return;

                        let iframeSrc = iframeMatch[1].replace(/\\/g, "");

                        // Handle rapidrame redirect
                        if (iframeSrc.includes("?rapidrame_id=")) {
                            iframeSrc = `${MAIN_URL}/playerr/` + iframeSrc.split("?rapidrame_id=")[1];
                        }

                        // Step 5: Extract the actual video URL from the iframe player
                        const videoUrl = await extractVideoUrl(iframeSrc, `${MAIN_URL}/`);
                        if (videoUrl) {
                            sources.push({
                                label: `${sourceName} ${langLabel}`,
                                url: videoUrl,
                                lang: langCode,
                            });
                        }
                    } catch (err) {
                        console.warn(`[source3] Failed to fetch video for id=${videoId}:`, err);
                    }
                })();

                tasks.push(task);
            });
        });

        // Run all tasks in parallel (with a reasonable concurrency limit isn't needed at this scale)
        await Promise.all(tasks);

        if (sources.length === 0) {
            return NextResponse.json({ error: "No video links could be extracted", sources: [] }, { status: 404 });
        }

        return NextResponse.json({ sources, movieUrl });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[source3] Error:", message);
        return NextResponse.json({ error: message, sources: [] }, { status: 500 });
    }
}
