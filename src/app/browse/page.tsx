"use client";

import { useEffect, useState } from "react";
import { jellyfin } from "@/lib/jellyfin";
import { tmdb } from "@/lib/tmdb";
import { useStore } from "@/store/useStore";
import { filterForKids, filterAdultContent } from "@/lib/profiles";
import HeroBanner from "@/components/HeroBanner";
import ContentRow from "@/components/ContentRow";
import { useSiteConfig } from "@/lib/siteConfig";
import { MediaItem } from "@/types/media";

export default function BrowsePage() {
    const isReady = useStore((s) => s.isJellyfinReady);
    const activeProfile = useStore((s) => s.activeProfile);
    const { config: cfg } = useSiteConfig();
    const isKids = activeProfile?.isKids ?? false;
    const allowAdult = activeProfile?.allowAdultContent ?? false;

    const [heroItems, setHeroItems] = useState<MediaItem[]>([]);
    const [trendingAll, setTrendingAll] = useState<MediaItem[]>([]);
    const [popularMovies, setPopularMovies] = useState<MediaItem[]>([]);
    const [trendingTV, setTrendingTV] = useState<MediaItem[]>([]);
    const [resumeItems, setResumeItems] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // We don't necessarily need Jellyfin to be ready for TMDB, but we do for resumeItems
        const fetchAll = async () => {
            try {
                const [trending, movies, tv, resume] = await Promise.all([
                    tmdb.getTrending("all"),
                    tmdb.getMovies("popular"),
                    tmdb.getTVShows("popular"),
                    isReady ? jellyfin.getResumable(20) : Promise.resolve([]),
                ]);

                let trendingItems = trending;
                let movieItems = movies;
                let tvItems = tv;
                let resumeMapped = Array.isArray(resume) ? resume.map(item => jellyfin.mapToMediaItem(item)) : [];

                // Filter logic
                if (isKids) {
                    // TMDB doesn't have a simple "isKids" flag in these lists, but we could filter by genres if needed
                    // For now, let's assume TMDB items are processed similarly if we had the metadata
                }

                setTrendingAll(trendingItems.slice(0, 20));
                setPopularMovies(movieItems.slice(0, 20));
                setTrendingTV(tvItems.slice(0, 20));
                setResumeItems(resumeMapped.slice(0, 12));

                // Hero picks from trending
                setHeroItems(trendingItems.slice(0, 8));
            } catch (e) {
                console.error("Failed to fetch browse data:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, [isReady, isKids]);

    if (loading) {
        return (
            <div className="min-h-screen pt-20">
                <div className="w-full h-[75vh] skeleton" />
                {/* Horizontal row skeleton */}
                <div className="px-6 lg:px-12 mt-8">
                    <div className="h-6 w-40 skeleton rounded-lg mb-4" />
                    <div className="flex gap-4 overflow-hidden">
                        {[1, 2, 3, 4].map((j) => (
                            <div key={j} className="flex-shrink-0 w-[240px] sm:w-[320px] aspect-[16/9] skeleton rounded-xl" />
                        ))}
                    </div>
                </div>
                {/* Vertical row skeleton */}
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
                {resumeItems.length > 0 && (
                    <ContentRow title={cfg.browse.continueWatchingTitle} items={resumeItems} variant="horizontal" />
                )}
                <ContentRow title="Haftanın Trendleri" items={trendingAll} variant="vertical" />
                <ContentRow title={cfg.browse.popularMoviesTitle} items={popularMovies} variant="horizontal" />
                <ContentRow title="Popüler Diziler" items={trendingTV} variant="horizontal" />
            </div>
        </div>
    );
}
