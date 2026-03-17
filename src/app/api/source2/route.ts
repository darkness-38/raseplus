import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

const MAIN_URL = "https://www.hdfilmcehennemi.nl";

const BASE_HEADERS = {
    "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
};

function base64Decode(s: string): string {
    return Buffer.from(s.trim(), "base64").toString("binary");
}

function rot13(s: string): string {
    return s.replace(/[a-zA-Z]/g, (c) => {
        const base = c <= "Z" ? 65 : 97;
        return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
    });
}

function jsUnpack(packed: string): string {
    try {
        const match = packed.match(
            /eval\(function\(p,a,c,k,e,[dr]\)\{[\s\S]+?\}\('([\s\S]+?)',(\d+),(\d+),'([\s\S]+?)'\.split/
        );
        if (!match) return packed;
        const [, p, aStr, cStr, kStr] = match;
        const a = parseInt(aStr, 10);
        const c = parseInt(cStr, 10);
        const k = kStr.split("|");

        const e = function(num: number): string {
            const first = num < a ? '' : e(Math.floor(num / a));
            const rem = num % a;
            const second = rem > 35 ? String.fromCharCode(rem + 29) : rem.toString(36);
            return first + second;
        };

        const dict: Record<string, string> = {};
        for (let i = 0; i < c; i++) {
            dict[e(i)] = k[i] || e(i);
        }

        return p.replace(/\b(\w+)\b/g, (word) => {
            return dict[word] !== undefined ? dict[word] : word;
        });
    } catch { return packed; }
}

export interface VideoSource { label: string; url: string; lang: string; }
interface SearchResults { results: string[]; }

async function fetchText(url: string, extraHeaders: Record<string, string> = {}): Promise<{ text: string; status: number }> {
    const res = await fetch(url, {
        headers: { ...BASE_HEADERS, ...extraHeaders },
        redirect: "follow",
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
    });
    return { text: await res.text(), status: res.status };
}

async function searchMovie(title: string, debugLog: string[]): Promise<string | null> {
    const variants = [
        title.replace(/\s+/g, "+"),
        encodeURIComponent(title),
        title.split(" ").slice(0, 3).join("+"),
        title.split(" ")[0],
    ];

    for (const q of variants) {
        const searchUrl = `${MAIN_URL}/search?q=${q}`;
        try {
            debugLog.push(`Searching: ${searchUrl}`);
            const res = await fetch(searchUrl, {
                headers: {
                    ...BASE_HEADERS,
                    "X-Requested-With": "fetch",
                    Accept: "application/json, text/html, */*",
                },
                redirect: "follow",
                cache: "no-store",
                signal: AbortSignal.timeout(8000),
            });
            const text = await res.text();
            debugLog.push(`  → status=${res.status}, ct=${res.headers.get("content-type")?.split(";")[0]}`);

            // Try JSON first
            try {
                const data: SearchResults = JSON.parse(text);
                if (data.results?.length) {
                    const $ = cheerio.load(data.results[0]);
                    const href = $("a").first().attr("href");
                    if (href) {
                        const full = href.startsWith("http") ? href : `${MAIN_URL}${href}`;
                        debugLog.push(`  ✓ JSON → ${full}`);
                        return full;
                    }
                }
            } catch { /* not JSON */ }

            // Fallback: HTML search results page
            if (text.includes("<html") || text.includes("<!DOCTYPE")) {
                const $ = cheerio.load(text);
                const selectors = ["div.section-content a.poster", "a.poster", ".search-result a", "h2 a"];
                for (const sel of selectors) {
                    const href = $(sel).first().attr("href");
                    if (href) {
                        const full = href.startsWith("http") ? href : `${MAIN_URL}${href}`;
                        debugLog.push(`  ✓ HTML sel="${sel}" → ${full}`);
                        return full;
                    }
                }
                debugLog.push(`  ✗ No match in HTML. Snippet: ${$("body").text().slice(0, 150).replace(/\s+/g, " ")}`);
            }
        } catch (err) {
            debugLog.push(`  ✗ ${err instanceof Error ? err.message : String(err)}`);
        }
    }
    return null;
}

/**
 * Extracts the iframe URL from the /video/<id>/ endpoint.
 * The endpoint may return:
 *   - JSON with escaped HTML:  {"html":"...<div data-src=\"url\">..."}
 *   - Raw HTML with data-src="url"
 *   - Or just a URL in the text
 */
function extractIframeSrc(rawText: string, debugLog: string[]): string | null {
    debugLog.push(`  video endpoint response length: ${rawText.length}`);
    debugLog.push(`  snippet: ${rawText.slice(0, 300).replace(/\s+/g, " ")}`);

    // Try parsing as JSON first (based on user debug log: {"success":true,"data":{"html":"..."}})
    try {
        const data = JSON.parse(rawText);
        if (data && data.data && data.data.html) {
            debugLog.push(`  Parsed JSON successfully. HTML snippet: ${data.data.html.slice(0, 100)}`);
            const $ = cheerio.load(data.data.html);
            const iframeSrc = $("iframe").attr("data-src") || $("iframe").attr("src");
            if (iframeSrc) {
                debugLog.push(`  Extracted from JSON HTML: ${iframeSrc}`);
                return iframeSrc;
            }
        }
    } catch {
        debugLog.push(`  Failed to parse video endpoint response as JSON, falling back to regex.`);
    }

    // Pattern 1: JSON-escaped data-src=\"url\"
    const p1 = rawText.match(/data-src=\\"(https?:[^"\\]+)\\"/);
    if (p1) { debugLog.push(`  data-src via pattern1 (escaped): ${p1[1]}`); return p1[1].replace(/\\\//g, '/'); }

    // Pattern 2: Normal HTML  data-src="url"
    const p2 = rawText.match(/data-src="(https?:[^"]+)"/);
    if (p2) { debugLog.push(`  data-src via pattern2 (normal): ${p2[1]}`); return p2[1]; }

    // Pattern 3: src inside escaped iframe tag
    const p3 = rawText.match(/iframe[^>]+src=\\"(https?:[^"\\]+)\\"/i);
    if (p3) { debugLog.push(`  src via pattern3 (iframe escaped): ${p3[1]}`); return p3[1].replace(/\\\//g, '/'); }

    // Pattern 4: any http URL in the response
    const p5 = rawText.match(/https?:(?:\/|\\\/){2}[^"'\s\\]+(?:embed|player|watch|video|rplayer)[^"'\s\\]*/i);
    if (p5) {
        const clean = p5[0].replace(/\\\//g, '/');
        debugLog.push(`  URL via pattern4 (heuristic): ${clean}`);
        return clean;
    }

    debugLog.push(`  ✗ No iframe src found`);
    return null;
}

export function extractFromObfuscated(unpacked: string): string | null {
    const magicMatch = unpacked.match(/charCode\s*=\s*\(\s*charCode\s*-\s*\(\s*(\d+)\s*%/);
    if (!magicMatch) return null;
    const magicNumber = parseInt(magicMatch[1], 10);

    const arrayMatch = unpacked.match(/var\s+[a-zA-Z0-9_]+\s*=\s*[a-zA-Z0-9_]+\s*\(\s*\[(.*?)\]\s*\)/);
    if (!arrayMatch) return null;

    const arrayElements = arrayMatch[1].match(/"([^"]+)"|'([^']+)'/g);
    if (!arrayElements) return null;

    let joined = arrayElements.map(el => el.replace(/["']/g, '')).join('');
    joined = joined.split('').reverse().join('');
    joined = rot13(joined);
    
    try {
        joined = base64Decode(joined);
    } catch { return null; }

    let unmix = '';
    for (let i = 0; i < joined.length; i++) {
        let charCode = joined.charCodeAt(i);
        charCode = (charCode - (magicNumber % (i + 5)) + 256) % 256;
        unmix += String.fromCharCode(charCode);
    }
    return unmix;
}

async function extractVideoUrl(req: NextRequest, iframeUrl: string, debugLog: string[]): Promise<string | null> {
    try {
        const { text } = await fetchText(iframeUrl, { Referer: MAIN_URL + "/" });
        
        let extracted: string | null = null;
        // Check for mp4/m3u8 directly
        let m = text.match(/https?:[^"']+(?:\.mp4|\.m3u8)[^"']*/i);
        if (m) extracted = m[0].replace(/\\\//g, "/");

        if (!extracted) {
            // Check for packed JS
            const packedMatches = text.match(/eval\(function\(p,a,c,k,e,[dr]\)[\s\S]+?split\('\|'\).*?\)/g) || [];
            for (const script of packedMatches) {
                const unpacked = jsUnpack(script);
                if (unpacked !== script) {
                    const ext = extractFromObfuscated(unpacked);
                    if (ext && (ext.includes('.mp4') || ext.includes('.m3u8'))) {
                        extracted = ext;
                        break;
                    }
                }
            }
        }
        
        if (!extracted) {
            // Check for JSON configurations containing files
            const fileMatches = text.match(/"file"\s*:\s*"([^"]+)"/g) || [];
            for (const fm of fileMatches) {
                const src = fm.match(/"file"\s*:\s*"([^"]+)"/);
                if (src && src[1] && (src[1].includes('.mp4') || src[1].includes('.m3u8'))) {
                    extracted = src[1].replace(/\\\//g, "/");
                    break;
                }
            }
        }

        if (extracted) {
            // Wrap in proxy
            const baseUrl = new URL(req.url).origin;
            const b64Url = Buffer.from(extracted).toString("base64");
            const b64Referer = Buffer.from("https://www.hdfilmcehennemi.nl/").toString("base64");
            // Add a dummy extension to help player detection
            return `${baseUrl}/api/proxy?url=${b64Url}&referer=${b64Referer}&v=.m3u8`;
        }
    } catch (err) {
        debugLog.push(`  ⚠ extractVideoUrl error: ${err instanceof Error ? err.message : String(err)}`);
    }
    return null;
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get("title");
    const type = searchParams.get("type") || "movie";
    const season = searchParams.get("season");
    const episode = searchParams.get("episode");
    const directUrl = searchParams.get("url");
    const showDebug = searchParams.get("debug") === "1";

    if (!title && !directUrl) {
        return NextResponse.json({ error: "Missing title or url parameter" }, { status: 400 });
    }

    const debugLog: string[] = [];

    try {
        let movieUrl: string;

        if (directUrl) {
            movieUrl = directUrl;
            debugLog.push(`Direct URL: ${directUrl}`);
        } else {
            const found = await searchMovie(title!, debugLog);
            if (!found) {
                return NextResponse.json({
                    error: "No results found",
                    sources: [],
                    ...(showDebug ? { debugLog } : {}),
                }, { status: 404 });
            }
            movieUrl = found;
        }

        // Handle TV Series episode URL construction
        if (type === "tv" && season && episode) {
            // Ensure movieUrl ends with /
            const base = movieUrl.endsWith("/") ? movieUrl : `${movieUrl}/`;
            movieUrl = `${base}sezon-${season}/bolum-${episode}/`;
            debugLog.push(`Constructed TV URL: ${movieUrl}`);
        }

        const { text: movieHtml, status } = await fetchText(movieUrl, { Referer: `${MAIN_URL}/` });
        debugLog.push(`Movie page: ${movieUrl} → status=${status}`);

        const $ = cheerio.load(movieHtml);
        const sources: VideoSource[] = [];
        const tasks: Promise<void>[] = [];
        let buttonsFound = 0;

        $("div.alternative-links").each((_i, el) => {
            const lang = $(el).attr("data-lang")?.toUpperCase() || "TR";
            const langLabel = lang === "TR" ? "Türkçe Dublaj" : lang === "EN" ? "English" : lang;
            const langCode = lang === "TR" ? "tr" : lang === "EN" ? "en" : "other";

            $(el).find("button.alternative-link").each((_j, btn) => {
                const sourceName = $(btn).text().replace("(HDrip Xbet)", "").trim();
                const videoId = $(btn).attr("data-video");
                if (!videoId) return;
                buttonsFound++;

                const btnDebug: string[] = [`Button: id="${videoId}" lang="${lang}" name="${sourceName}"`];

                const task = (async () => {
                    try {
                        // 1. Fetch /video/<id>/ to get iframe src
                        const apiUrl = `${MAIN_URL}/video/${videoId}/`;
                        const { text: apiText } = await fetchText(apiUrl, {
                            "Content-Type": "application/json",
                            "X-Requested-With": "fetch",
                            Referer: movieUrl,
                        });

                        const iframeSrc = extractIframeSrc(apiText, btnDebug);
                        if (!iframeSrc) { debugLog.push(...btnDebug); return; }

                        // Handle rapidrame redirect
                        let resolvedSrc = iframeSrc;
                        if (resolvedSrc.includes("rapidrame_id=")) {
                            resolvedSrc = `${MAIN_URL}/playerr/` + resolvedSrc.split("rapidrame_id=")[1].replace(/&.*$/, "");
                            btnDebug.push(`  rapidrame → ${resolvedSrc}`);
                        } else if (resolvedSrc.startsWith("//")) {
                            resolvedSrc = "https:" + resolvedSrc;
                        } else if (resolvedSrc.startsWith("/")) {
                            resolvedSrc = MAIN_URL + resolvedSrc;
                        }

                        // Extract actual video URL to bypass iframe restrictions
                        const finalVideoUrl = await extractVideoUrl(req, resolvedSrc, btnDebug);
                        if (finalVideoUrl) {
                            sources.push({ label: `${sourceName} ${langLabel}`, url: finalVideoUrl, lang: langCode });
                            btnDebug.push(`  ✓ Player Video URL: ${finalVideoUrl.slice(0, 80)}`);
                        } else {
                            // Fallback to iframe if we couldn't extract
                            sources.push({ label: `${sourceName} ${langLabel} (Iframe)`, url: resolvedSrc, lang: langCode });
                            btnDebug.push(`  ⚠ Fallback Iframe URL: ${resolvedSrc.slice(0, 80)}`);
                        }
                    } catch (err) {
                        btnDebug.push(`  ✗ ${err instanceof Error ? err.message : String(err)}`);
                    } finally {
                        debugLog.push(...btnDebug);
                    }
                })();

                tasks.push(task);
            });
        });

        debugLog.push(`Buttons found: ${buttonsFound}`);
        await Promise.all(tasks);
        debugLog.push(`Sources extracted: ${sources.length}`);

        if (sources.length === 0) {
            return NextResponse.json({
                error: buttonsFound === 0
                    ? "Movie page found but no video buttons detected"
                    : "Video buttons found but URL extraction failed — see debugLog for details",
                sources: [],
                movieUrl,
                ...(showDebug ? { debugLog } : {}),
            }, { status: 404 });
        }

        return NextResponse.json({ sources, movieUrl, ...(showDebug ? { debugLog } : {}) });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[source3] Error:", message);
        debugLog.push(`Fatal: ${message}`);
        return NextResponse.json({ error: message, sources: [], ...(showDebug ? { debugLog } : {}) }, { status: 500 });
    }
}
