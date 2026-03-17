"use client";

import { useParams, useSearchParams } from "next/navigation";
import VideoPlayer from "@/components/VideoPlayer";
import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";

export default function WatchPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const id = params.id as string;
    const type = searchParams.get("type") as "movie" | "tv";
    const season = searchParams.get("s") ? parseInt(searchParams.get("s")!) : 1;
    const episode = searchParams.get("e") ? parseInt(searchParams.get("e")!) : 1;
    const title = searchParams.get("title") || "";

    const openPlayer = useStore((s) => s.openPlayer);

    useEffect(() => {
        if (id && type) {
            openPlayer({
                tmdbId: id,
                type,
                season,
                episode,
                title
            });
        }
    }, [id, type, season, episode, title, openPlayer]);

    return (
        <div className="fixed inset-0 bg-black z-[100]">
            <VideoPlayer />
        </div>
    );
}
