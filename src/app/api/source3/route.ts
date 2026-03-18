import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

const MAIN_URL = "https://www.hdfilmcehennemi.nl";

const BASE_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
};

async function searchMovie(query: string): Promise<string | null> {
    try {
        const searchUrl = `${MAIN_URL}/search/?q=${encodeURIComponent(query)}`;
        const res = await fetch(searchUrl, {
            headers: {
                ...BASE_HEADERS,
                "X-Requested-With": "fetch",
            },
        });
        const data = await res.json();
        if (data.results && data.results.length > 0) {
            const $ = cheerio.load(data.results[0]);
            const href = $("a").first().attr("href");
            if (href) {
                return href.startsWith("http") ? href : `${MAIN_URL}${href}`;
            }
        }
    } catch (err) {
        console.error("Search error (source3):", err);
    }
    return null;
}

async function extractVideoLinks(movieUrl: string): Promise<any[]> {
    try {
        const res = await fetch(movieUrl, { headers: BASE_HEADERS });
        const html = await res.text();
        const $ = cheerio.load(html);

        const sources: any[] = [];
        const tasks: Promise<void>[] = [];

        $("div.alternative-links").each((_, el) => {
            const langCode = $(el).attr("data-lang")?.toLowerCase() || "tr";
            const langLabel = langCode === "tr" ? "Türkçe Dublaj" : "Türkçe Altyazı";

            $(el).find("button.alternative-link").each((_, btn) => {
                const sourceName = $(btn).text().replace("(HDrip Xbet)", "").trim();
                const videoId = $(btn).attr("data-video");
                if (!videoId) return;

                const task = (async () => {
                    try {
                        const apiUrl = `${MAIN_URL}/video/${videoId}/`;
                        const apiRes = await fetch(apiUrl, {
                            headers: {
                                ...BASE_HEADERS,
                                "X-Requested-With": "fetch",
                                "Referer": movieUrl,
                            },
                        });
                        const apiData = await apiRes.json();
                        const apiHtml = apiData.data?.html || "";
                        const $api = cheerio.load(apiHtml);
                        
                        let iframeSrc = $api("iframe").attr("data-src") || $api("iframe").attr("src");
                        if (!iframeSrc) {
                            // Fallback regex for data-src in JSON or raw HTML
                            const match = apiHtml.match(/data-src="(.*?)"/);
                            if (match) iframeSrc = match[1];
                        }

                        if (iframeSrc) {
                            if (iframeSrc.includes("rapidrame_id=")) {
                                const id = iframeSrc.split("rapidrame_id=")[1].split("&")[0];
                                iframeSrc = `${MAIN_URL}/playerr/${id}`;
                            } else if (iframeSrc.startsWith("//")) {
                                iframeSrc = `https:${iframeSrc}`;
                            } else if (iframeSrc.startsWith("/")) {
                                iframeSrc = `${MAIN_URL}${iframeSrc}`;
                            }

                            const lang = langCode === "tr" ? "tr" : langCode === "en" ? "en" : "other";
                            sources.push({
                                label: `${sourceName} (${langLabel})`,
                                url: iframeSrc,
                                lang: lang,
                            });
                        }
                    } catch (e) {
                        console.error(`Failed to fetch video ${videoId}`, e);
                    }
                })();
                tasks.push(task);
            });
        });

        await Promise.all(tasks);
        return sources;
    } catch (err) {
        console.error("Extraction error (source3):", err);
        return [];
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get("title");
    const type = searchParams.get("type") || "movie";
    const season = searchParams.get("season");
    const episode = searchParams.get("episode");

    if (!title) {
        return NextResponse.json({ error: "Missing title" }, { status: 400 });
    }

    let movieUrl = await searchMovie(title);
    if (!movieUrl) {
        return NextResponse.json({ error: "No results found", sources: [] }, { status: 404 });
    }

    if (type === "tv" && season && episode) {
        movieUrl = movieUrl.endsWith("/") ? movieUrl : `${movieUrl}/`;
        movieUrl = `${movieUrl}sezon-${season}/bolum-${episode}/`;
    }

    const sources = await extractVideoLinks(movieUrl);

    if (sources.length === 0) {
        return NextResponse.json({ error: "No sources found", sources: [] }, { status: 404 });
    }

    return NextResponse.json({ sources });
}
