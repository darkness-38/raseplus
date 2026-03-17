import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

const MAIN_URL = "https://www.hdfilmcehennemi.nl";

const BASE_HEADERS = {
    "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
};

function base64Decode(s: string): string {
    return Buffer.from(s.trim(), "base64").toString("utf-8");
}

/**
 * Minimal eval(function(p,a,c,k,e,d){...}) unpacker
 */
function jsUnpack(packed: string): string {
    try {
        const match = packed.match(
            /eval\(function\(p,a,c,k,e,[dr]\)\{[\s\S]+?\}\('([\s\S]+?)',(\d+),(\d+),'([\s\S]+?)'\.split/
        );
        if (!match) return packed;

        const [, p, aStr, , kStr] = match;
        const a = parseInt(aStr, 10);
        const k = kStr.split("|");

        return p.replace(/\b(\w+)\b/g, (word) => {
            const idx = parseInt(word, a);
            if (!isNaN(idx) && idx < k.length && k[idx]) return k[idx];
            return word;
        });
    } catch {
        return packed;
    }
}

export interface VideoSource {
    label: string;
    url: string;
    lang: string;
}

interface SearchResults {
    results: string[];
}

async function fetchHtml(
    url: string,
    extraHeaders: Record<string, string> = {}
): Promise<{ html: string; status: number; finalUrl: string }> {
    const res = await fetch(url, {
        headers: { ...BASE_HEADERS, ...extraHeaders },
        redirect: "follow",
        cache: "no-store",
    });
    const html = await res.text();
    return { html, status: res.status, finalUrl: res.url };
}

/** Build search URL variants to try */
function buildSearchUrls(title: string): string[] {
    return [
        // Primary: JSON API with + separated words
        `${MAIN_URL}/search?q=${title.replace(/\s+/g, "+")}`,
        // encodeURIComponent variant
        `${MAIN_URL}/search?q=${encodeURIComponent(title)}`,
        // First word only
        `${MAIN_URL}/search?q=${title.split(" ")[0]}`,
    ];
}

async function searchMovie(title: string): Promise<{ movieUrl: string; debug: string[] } | null> {
    const urls = buildSearchUrls(title);
    const debugLog: string[] = [];

    for (const searchUrl of urls) {
        try {
            debugLog.push(`Trying search: ${searchUrl}`);
            const res = await fetch(searchUrl, {
                headers: {
                    ...BASE_HEADERS,
                    "X-Requested-With": "fetch",
                    Accept: "application/json, text/html, */*",
                },
                redirect: "follow",
                cache: "no-store",
            });

            debugLog.push(`  → status=${res.status}, content-type=${res.headers.get("content-type")}`);

            const text = await res.text();

            // Try parsing as JSON first (expected format)
            let data: SearchResults | null = null;
            try {
                data = JSON.parse(text);
            } catch {
                debugLog.push(`  ✗ Not JSON, trying HTML parse`);
            }

            if (data?.results?.length) {
                const firstHtml = data.results[0];
                const $ = cheerio.load(firstHtml);

                // Try multiple selectors for the link
                const selectors = ["a", "h4 + a", ".title a"];
                for (const sel of selectors) {
                    const href = $(sel).first().attr("href");
                    if (href) {
                        const fullUrl = href.startsWith("http") ? href : `${MAIN_URL}${href}`;
                        debugLog.push(`  ✓ JSON result, selector="${sel}", url=${fullUrl}`);
                        return { movieUrl: fullUrl, debug: debugLog };
                    }
                }
                debugLog.push(`  ✗ JSON result but no href found. HTML snippet: ${firstHtml.slice(0, 200)}`);
                continue;
            }

            // Fallback: parse as HTML page
            if (text.includes("<html")) {
                const $ = cheerio.load(text);
                const pageSelectors = [
                    "div.section-content a.poster",
                    "a.poster",
                    ".search-result a",
                    "h2.entry-title a",
                    "article a[rel='bookmark']",
                ];
                for (const sel of pageSelectors) {
                    const href = $(sel).first().attr("href");
                    if (href) {
                        const fullUrl = href.startsWith("http") ? href : `${MAIN_URL}${href}`;
                        debugLog.push(`  ✓ HTML page result, selector="${sel}", url=${fullUrl}`);
                        return { movieUrl: fullUrl, debug: debugLog };
                    }
                }
                const bodySnippet = $("body").text().slice(0, 300).replace(/\s+/g, " ").trim();
                debugLog.push(`  ✗ HTML but no match. Body: ${bodySnippet}`);
            }

        } catch (err) {
            debugLog.push(`  ✗ Error: ${err instanceof Error ? err.message : String(err)}`);
        }
    }

    return null;
}

async function extractVideoUrl(iframeUrl: string, referer: string): Promise<string | null> {
    try {
        const { html } = await fetchHtml(iframeUrl, { Referer: referer });
        const $ = cheerio.load(html);

        let scriptContent = "";
        $("script").each((_i, el) => {
            const data = $(el).html() || "";
            if (data.includes("sources:") || data.includes("file_link") || data.includes("file:")) {
                scriptContent = data.trim();
                return false;
            }
        });

        if (!scriptContent) return null;

        let unpacked = scriptContent;
        if (scriptContent.includes("eval(function(p,a,c,k")) {
            const evalMatch = scriptContent.match(/(eval\(function\(p,a,c,k[\s\S]+?\)\))/);
            if (evalMatch) unpacked = jsUnpack(evalMatch[1]);
        }

        // file_link="<base64>"
        const fileLinkMatch = unpacked.match(/file_link\s*[=:]\s*["']([A-Za-z0-9+/=]{20,})["']/);
        if (fileLinkMatch) {
            const decoded = base64Decode(fileLinkMatch[1]);
            if (decoded.startsWith("http")) return decoded;
        }

        // Direct file URL
        const fileMatch = unpacked.match(/(?:file|src)\s*:\s*["'](https?:\/\/[^"']+\.(?:m3u8|mp4)[^"']*)["']/);
        if (fileMatch) return fileMatch[1];

        return null;
    } catch {
        return null;
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get("title");
    const directUrl = searchParams.get("url"); // bypass search
    const showDebug = searchParams.get("debug") === "1";

    if (!title && !directUrl) {
        return NextResponse.json({ error: "Missing title or url parameter" }, { status: 400 });
    }

    try {
        let movieUrl: string;
        let debugInfo: string[] = [];

        if (directUrl) {
            movieUrl = directUrl;
            debugInfo.push(`Direct URL mode: ${directUrl}`);
        } else {
            const result = await searchMovie(title!);
            debugInfo = result?.debug ?? [`No results for: "${title}"`];

            if (!result) {
                console.error("[source3] Search failed:", debugInfo);
                return NextResponse.json({
                    error: "No results found",
                    sources: [],
                    ...(showDebug ? { debugLog: debugInfo } : {}),
                }, { status: 404 });
            }
            movieUrl = result.movieUrl;
        }

        const { html: movieHtml, status } = await fetchHtml(movieUrl, { Referer: `${MAIN_URL}/` });
        debugInfo.push(`Movie page: ${movieUrl} → status=${status}`);

        const $ = cheerio.load(movieHtml);
        const sources: VideoSource[] = [];
        const tasks: Promise<void>[] = [];

        let altLinksFound = 0;
        $("div.alternative-links").each((_i, el) => {
            const lang = $(el).attr("data-lang")?.toUpperCase() || "TR";
            const langLabel = lang === "TR" ? "Türkçe Dublaj" : lang === "EN" ? "English" : lang;
            const langCode = lang === "TR" ? "tr" : lang === "EN" ? "en" : "other";

            $(el).find("button.alternative-link").each((_j, btn) => {
                const sourceName = $(btn).text().replace("(HDrip Xbet)", "").trim();
                const videoId = $(btn).attr("data-video");
                if (!videoId) return;
                altLinksFound++;

                const task = (async () => {
                    try {
                        const apiUrl = `${MAIN_URL}/video/${videoId}/`;
                        const { html: apiHtml } = await fetchHtml(apiUrl, {
                            "Content-Type": "application/json",
                            "X-Requested-With": "fetch",
                            Referer: movieUrl,
                        });

                        // data-src can be escaped or not
                        const iframeMatch = apiHtml.match(/data-src=\\?"([^"\\]+)\\?"/);
                        if (!iframeMatch) return;

                        let iframeSrc = iframeMatch[1].replace(/\\/g, "");
                        if (iframeSrc.includes("?rapidrame_id=")) {
                            iframeSrc = `${MAIN_URL}/playerr/` + iframeSrc.split("?rapidrame_id=")[1];
                        }

                        const videoUrl = await extractVideoUrl(iframeSrc, `${MAIN_URL}/`);
                        if (videoUrl) {
                            sources.push({ label: `${sourceName} ${langLabel}`, url: videoUrl, lang: langCode });
                        }
                    } catch (err) {
                        console.warn(`[source3] Video id=${videoId} failed:`, err);
                    }
                })();

                tasks.push(task);
            });
        });

        debugInfo.push(`Alternative link buttons found: ${altLinksFound}`);
        await Promise.all(tasks);
        debugInfo.push(`Sources extracted: ${sources.length}`);

        if (sources.length === 0) {
            // If we found the page but no alt-links, return debug info
            if (altLinksFound === 0) {
                const bodySnippet = $("body").text().slice(0, 500).replace(/\s+/g, " ").trim();
                debugInfo.push(`Body snippet: ${bodySnippet}`);
            }

            return NextResponse.json({
                error: altLinksFound === 0
                    ? "Movie page found but no video buttons detected"
                    : "Video buttons found but URL extraction failed",
                sources: [],
                movieUrl,
                ...(showDebug ? { debugLog: debugInfo } : {}),
            }, { status: 404 });
        }

        return NextResponse.json({
            sources,
            movieUrl,
            ...(showDebug ? { debugLog: debugInfo } : {}),
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[source3] Error:", message);
        return NextResponse.json({ error: message, sources: [] }, { status: 500 });
    }
}
