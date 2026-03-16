"use client";

import { useEffect, useState } from "react";
import { tmdb } from "@/lib/tmdb";
import { useStore } from "@/store/useStore";
import HeroBanner from "@/components/HeroBanner";
import ContentRow from "@/components/ContentRow";
import { useSiteConfig } from "@/lib/siteConfig";
import { MediaItem } from "@/types/media";

export default function BrowsePage() {
    const activeProfile = useStore((s) => s.activeProfile);
    const { config: cfg } = useSiteConfig();
    const isKids = activeProfile?.isKids ?? false;

    const [heroItems, setHeroItems] = useState<MediaItem[]>([]);
    const [trendingDaily, setTrendingDaily] = useState<MediaItem[]>([]);
    const [trendingWeekly, setTrendingWeekly] = useState<MediaItem[]>([]);
    const [animeItems, setAnimeItems] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [daily, weekly, anime] = await Promise.all([
                    tmdb.getTrending("all", "day"),
                    tmdb.getTrending("all", "week"),
                    tmdb.getAnime(),
                ]);

                setTrendingDaily(daily.slice(0, 20));
                setTrendingWeekly(weekly.slice(0, 20));
                setAnimeItems(anime.slice(0, 20));

                // Hero picks from daily trending
                setHeroItems(daily.slice(0, 8));
            } catch (e) {
                console.error("Failed to fetch browse data:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, [isKids]);

    if (loading) {
        return (
            <div className="min-h-screen pt-20">
                <div className="w-full h-[75vh] skeleton" />
                <div className="px-6 lg:px-12 mt-8">
                    <div className="h-6 w-40 skeleton rounded-lg mb-4" />
                    <div className="flex gap-4 overflow-hidden">
                        {[1, 2, 3, 4].map((j) => (
                            <div key={j} className="flex-shrink-0 w-[240px] sm:w-[320px] aspect-[16/9] skeleton rounded-xl" />
                        ))}
                    </div>
                </div>
                <div className="px-6 lg:px-12 mt-12">
                    <div className="h-6 w-40 skeleton rounded-lg mb-4" />
                    <div className="flex gap-4 overflow-hidden">
                        {[1, 2, 3, 4, 5, 6].map((j) => (
                            <div key={j} className="flex-shrink-0 w-[140px] sm:w-[180px] aspect-[2/3] skeleton rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <HeroBanner items={heroItems} />
            <div className="relative z-10 -mt-20 space-y-10 pb-20">
                <ContentRow title="Trending Today" items={trendingDaily} variant="horizontal" />
                <ContentRow title="Top Watched This Week" items={trendingWeekly} variant="vertical" />
                <ContentRow title="🎌 Popular Anime" items={animeItems} variant="horizontal" />
            </div>
        </div>
    );
}
