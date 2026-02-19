"use client";

import { useEffect, useState } from "react";
import { jellyfin, JellyfinItem, LIBRARY_IDS } from "@/lib/jellyfin";
import { useStore } from "@/store/useStore";
import { filterForKids, filterAdultContent } from "@/lib/profiles";
import HeroBanner from "@/components/HeroBanner";
import ContentRow from "@/components/ContentRow";
import { useSiteConfig } from "@/lib/siteConfig";

export default function BrowsePage() {
    const isReady = useStore((s) => s.isJellyfinReady);
    const activeProfile = useStore((s) => s.activeProfile);
    const { config: cfg } = useSiteConfig();
    const isKids = activeProfile?.isKids ?? false;
    const allowAdult = activeProfile?.allowAdultContent ?? false;

    const [heroItems, setHeroItems] = useState<JellyfinItem[]>([]);
    const [trendingAnime, setTrendingAnime] = useState<JellyfinItem[]>([]);
    const [popularMovies, setPopularMovies] = useState<JellyfinItem[]>([]);
    const [latestSeries, setLatestSeries] = useState<JellyfinItem[]>([]);
    const [resumeItems, setResumeItems] = useState<JellyfinItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isReady) return;

        const fetchAll = async () => {
            try {
                const [anime, movies, series, resume] = await Promise.all([
                    jellyfin.getLibraryItems(LIBRARY_IDS.anime, {
                        limit: 30,
                        sortBy: "CommunityRating",
                        sortOrder: "Descending",
                    }),
                    jellyfin.getLibraryItems(LIBRARY_IDS.movies, {
                        limit: 30,
                        sortBy: "CommunityRating",
                        sortOrder: "Descending",
                    }),
                    jellyfin.getLatestItems(LIBRARY_IDS.series, 30),
                    jellyfin.getResumable(20),
                ]);

                let animeItems = isKids ? filterForKids(anime.Items) : anime.Items;
                let movieItems = isKids ? filterForKids(movies.Items) : movies.Items;
                let seriesItems = isKids ? filterForKids(series) : series;
                let resumeFiltered = isKids ? filterForKids(resume) : resume;

                // Adult content filter
                animeItems = filterAdultContent(animeItems, allowAdult);
                movieItems = filterAdultContent(movieItems, allowAdult);
                seriesItems = filterAdultContent(seriesItems, allowAdult);
                resumeFiltered = filterAdultContent(resumeFiltered, allowAdult);

                setTrendingAnime(animeItems.slice(0, 20));
                setPopularMovies(movieItems.slice(0, 20));
                setLatestSeries(seriesItems.slice(0, 20));
                setResumeItems(resumeFiltered.slice(0, 12));

                // Hero picks
                const heroPool = [
                    ...animeItems.slice(0, 3),
                    ...movieItems.slice(0, 3),
                    ...seriesItems.slice(0, 2),
                ].filter((item) => item.BackdropImageTags?.length);
                setHeroItems(heroPool.length ? heroPool : animeItems.slice(0, 5));
            } catch (e) {
                console.error("Failed to fetch browse data:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, [isReady, isKids]);

    if (loading || !isReady) {
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
                <ContentRow title={cfg.browse.trendingAnimeTitle} items={trendingAnime} variant="vertical" />
                <ContentRow title={cfg.browse.popularMoviesTitle} items={popularMovies} variant="horizontal" />
                <ContentRow title={cfg.browse.latestSeriesTitle} items={latestSeries} variant="horizontal" />
            </div>
        </div>
    );
}
