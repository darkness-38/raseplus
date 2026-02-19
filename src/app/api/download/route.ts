
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");
    const filename = searchParams.get("filename");

    if (!url) {
        return new NextResponse("Missing url parameter", { status: 400 });
    }

    try {
        const response = await fetch(url);

        if (!response.body) {
            return new NextResponse("No content", { status: 404 });
        }

        const headers = new Headers();
        headers.set("Content-Disposition", `attachment; filename="${filename || "download.mp4"}"`);
        if (response.headers.get("Content-Type")) {
            headers.set("Content-Type", response.headers.get("Content-Type")!);
        }
        if (response.headers.get("Content-Length")) {
            headers.set("Content-Length", response.headers.get("Content-Length")!);
        }

        return new NextResponse(response.body as any, {
            status: response.status,
            statusText: response.statusText,
            headers,
        });

    } catch (error) {
        console.error("Proxy error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
