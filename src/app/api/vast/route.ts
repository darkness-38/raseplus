
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const response = await fetch("https://s.magsrv.com/v1/vast.php?idzone=5857078", {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            },
            next: { revalidate: 0 } // Ensure we don't cache empty responses indefinitely if it's dynamic
        });

        const data = await response.text();

        return new NextResponse(data, {
            status: 200,
            headers: {
                "Content-Type": "application/xml",
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch (error) {
        console.error("VAST Proxy Error:", error);
        return new NextResponse("Error fetching VAST tag", { status: 500 });
    }
}
