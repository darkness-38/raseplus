import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const encodedUrl = searchParams.get("url");
    const encodedReferer = searchParams.get("referer");

    if (!encodedUrl) {
        return new NextResponse("Missing url parameter", { status: 400 });
    }

    try {
        const targetUrl = Buffer.from(encodedUrl, "base64").toString("utf-8");
        const referer = encodedReferer ? Buffer.from(encodedReferer, "base64").toString("utf-8") : "";

        const headers: Record<string, string> = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        };
        if (referer) {
            headers["Referer"] = referer;
            headers["Origin"] = new URL(referer).origin;
        }

        const response = await fetch(targetUrl, {
            headers,
            redirect: "follow",
        });

        if (!response.ok) {
            return new NextResponse(`Proxy failed: ${response.statusText}`, { status: response.status });
        }

        const contentType = response.headers.get("content-type") || "";
        
        // Handle M3U8 rewriting
        if (targetUrl.includes(".m3u8") || contentType.includes("mpegurl") || contentType.includes("application/x-mpegURL")) {
            let text = await response.text();
            const urlObj = new URL(targetUrl);
            const baseUrl = urlObj.origin + urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf("/") + 1);

            // Rewrite relative and absolute URLs in the manifest
            const lines = text.split("\n");
            const rewrittenLines = lines.map(line => {
                line = line.trim();
                if (!line || line.startsWith("#")) {
                    // Handle URI attributes in tags like #EXT-X-KEY or #EXT-X-MAP
                    return line.replace(/URI="([^"]+)"/g, (match, uri) => {
                        const absoluteUri = uri.startsWith("http") ? uri : new URL(uri, baseUrl).href;
                        const isManifest = uri.includes(".m3u8") || uri.includes(".urlset");
                        const extensionHint = isManifest ? "&v=.m3u8" : "";
                        const proxyUrl = `${new URL(req.url).origin}/api/proxy?url=${Buffer.from(absoluteUri).toString("base64")}&referer=${encodedReferer}${extensionHint}`;
                        return `URI="${proxyUrl}"`;
                    });
                }

                const absoluteLineUrl = line.startsWith("http") ? line : new URL(line, baseUrl).href;
                const isManifest = line.endsWith(".m3u8") || line.includes(".urlset");
                const extensionHint = isManifest ? "&v=.m3u8" : "";
                return `${new URL(req.url).origin}/api/proxy?url=${Buffer.from(absoluteLineUrl).toString("base64")}&referer=${encodedReferer}${extensionHint}`;
            });

            return new NextResponse(rewrittenLines.join("\n"), {
                headers: {
                    "Content-Type": contentType || "application/vnd.apple.mpegurl",
                    "Access-Control-Allow-Origin": "*",
                },
            });
        }

        // Handle binary segments (TS)
        const data = await response.arrayBuffer();
        return new NextResponse(data, {
            headers: {
                "Content-Type": contentType || "video/MP2T",
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "public, max-age=3600",
            },
        });

    } catch (error) {
        console.error("Proxy error:", error);
        return new NextResponse("Internal Proxy Error", { status: 500 });
    }
}
