"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { jellyfin, JellyfinItem, LIBRARY_IDS } from "@/lib/jellyfin";
import { useStore } from "@/store/useStore";
import { filterForKids, filterAdultContent } from "@/lib/profiles";
import ContentCard from "@/components/ContentCard";
import { motion, AnimatePresence } from "framer-motion";

export default function SearchPage() {
    const isReady = useStore((s) => s.isJellyfinReady);
    const activeProfile = useStore((s) => s.activeProfile);
    const isKids = activeProfile?.isKids ?? false;
    const allowAdult = activeProfile?.allowAdultContent ?? false;

    const [query, setQuery] = useState("");
    const [results, setResults] = useState<JellyfinItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Explore suggestions — actual content from libraries
    const [suggestedMovies, setSuggestedMovies] = useState<JellyfinItem[]>([]);
    const [suggestedAnime, setSuggestedAnime] = useState<JellyfinItem[]>([]);
    const [suggestedSeries, setSuggestedSeries] = useState<JellyfinItem[]>([]);
    const [exploreLoading, setExploreLoading] = useState(true);

    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-focus on mount
    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 300);
    }, []);

    // Fetch explore content — random/suggested items
    useEffect(() => {
        if (!isReady) return;
        const fetchExplore = async () => {
            try {
                const [movies, anime, series] = await Promise.all([
                    jellyfin.getLibraryItems(LIBRARY_IDS.movies, {
                        limit: 18,
                        sortBy: "Random",
                        sortOrder: "Ascending",
                    }),
                    jellyfin.getLibraryItems(LIBRARY_IDS.anime, {
                        limit: 12,
                        sortBy: "Random",
                        sortOrder: "Ascending",
                    }),
                    jellyfin.getLibraryItems(LIBRARY_IDS.series, {
                        limit: 12,
                        sortBy: "Random",
                        sortOrder: "Ascending",
                    }),
                ]);

                const m = isKids ? filterForKids(movies.Items) : movies.Items;
                const a = isKids ? filterForKids(anime.Items) : anime.Items;
                const s = isKids ? filterForKids(series.Items) : series.Items;

                setSuggestedMovies(filterAdultContent(m, allowAdult));
                setSuggestedAnime(filterAdultContent(a, allowAdult));
                setSuggestedSeries(filterAdultContent(s, allowAdult));
            } catch (e) {
                console.error("Failed to fetch explore content:", e);
            } finally {
                setExploreLoading(false);
            }
        };
        fetchExplore();
    }, [isReady, isKids]);

    const performSearch = useCallback(
        async (searchQuery: string) => {
            if (!isReady || !searchQuery.trim()) {
                setResults([]);
                setHasSearched(false);
                return;
            }

            setLoading(true);
            setHasSearched(true);
            try {
                const items = await jellyfin.searchItems(searchQuery, 50);
                let filtered = isKids ? filterForKids(items) : items;
                filtered = filterAdultContent(filtered, allowAdult);
                setResults(filtered);
            } catch (e) {
                console.error("Search failed:", e);
                setResults([]);
            } finally {
                setLoading(false);
            }
        },
        [isReady, isKids]
    );

    const handleInputChange = (value: string) => {
        setQuery(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            performSearch(value);
        }, 400);
    };

    const handleClear = () => {
        setQuery("");
        setResults([]);
        setHasSearched(false);
        inputRef.current?.focus();
    };

    const getVariant = (item: JellyfinItem): "vertical" | "horizontal" => {
        if (item.Type === "Book") return "vertical";
        // If it's a series, check if it's anime (this is a heuristic, but works for most setups)
        if (item.Type === "Series") {
            const genres = item.Genres?.map(g => g.toLowerCase()) || [];
            if (genres.includes("anime") || genres.includes("animation")) return "vertical";
        }
        // Movies and other Series are horizontal
        return (item.Type === "Movie" || item.Type === "Series") ? "horizontal" : "vertical";
    };

    return (
        <div className="min-h-screen pt-16 sm:pt-[72px]">
            {/* Full-width Search Bar — Disney+ style */}
            <div
                className="sticky top-16 sm:top-[72px] z-30 px-4 sm:px-6 lg:px-12 py-4"
                style={{
                    backgroundColor: "rgba(0,6,26,0.92)",
                    backdropFilter: "blur(20px)",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
            >
                <div className="relative max-w-full">
                    {/* Search Icon */}
                    <div className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke={query ? "#0DD6E8" : "rgba(255,255,255,0.25)"}
                            strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                        </svg>
                    </div>

                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => handleInputChange(e.target.value)}
                        placeholder="Search by title, character, or genre"
                        className="w-full pl-12 sm:pl-14 pr-12 py-3.5 sm:py-4 rounded-lg text-white text-sm sm:text-base focus:outline-none transition-all font-body"
                        style={{
                            backgroundColor: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            letterSpacing: "0.01em",
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = "rgba(13,214,232,0.3)";
                            e.target.style.backgroundColor = "rgba(255,255,255,0.08)";
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = "rgba(255,255,255,0.06)";
                            e.target.style.backgroundColor = "rgba(255,255,255,0.06)";
                        }}
                    />

                    {/* Clear button */}
                    <AnimatePresence>
                        {query && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                onClick={handleClear}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
                                style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                            >
                                <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Content Area */}
            <div className="px-4 sm:px-6 lg:px-12 py-6 sm:py-8">
                {/* Loading search */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div
                            className="w-8 h-8 rounded-full animate-spin"
                            style={{ border: "3px solid rgba(13,214,232,0.2)", borderTopColor: "#0DD6E8" }}
                        />
                    </div>
                )}

                {/* No results */}
                {!loading && hasSearched && results.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-20"
                    >
                        <div
                            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                            style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                        >
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.15)" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                            </svg>
                        </div>
                        <p className="text-base font-medium text-white/50 mb-1">No results for &quot;{query}&quot;</p>
                        <p className="text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>
                            Try different keywords
                        </p>
                    </motion.div>
                )}

                {/* Search Results */}
                {!loading && hasSearched && results.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <p className="text-xs font-medium uppercase tracking-wider mb-5" style={{ color: "rgba(255,255,255,0.3)" }}>
                            {results.length} result{results.length !== 1 ? "s" : ""}
                        </p>
                        <div className={`grid gap-3 sm:gap-4 ${results.some(r => getVariant(r) === "horizontal")
                            ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                            : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7"
                            }`}>
                            {results.map((item, i) => (
                                <ContentCard key={item.Id} item={item} index={i} variant={getVariant(item)} />
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Explore — recommended content from libraries (shown when not searching) */}
                {!loading && !hasSearched && !exploreLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-10"
                    >
                        {/* Suggested Movies */}
                        {suggestedMovies.length > 0 && (
                            <div>
                                <h2 className="text-base sm:text-lg font-bold text-white/80 mb-4 tracking-wide">
                                    You Might Like
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
                                    {suggestedMovies.map((item, i) => (
                                        <ContentCard key={item.Id} item={item} index={i} variant="horizontal" />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Suggested Anime */}
                        {suggestedAnime.length > 0 && (
                            <div>
                                <h2 className="text-base sm:text-lg font-bold text-white/80 mb-4 tracking-wide">
                                    Discover Anime
                                </h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4">
                                    {suggestedAnime.map((item, i) => (
                                        <ContentCard key={item.Id} item={item} index={i} variant="vertical" />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Suggested Series */}
                        {suggestedSeries.length > 0 && (
                            <div>
                                <h2 className="text-base sm:text-lg font-bold text-white/80 mb-4 tracking-wide">
                                    Explore Series
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
                                    {suggestedSeries.map((item, i) => (
                                        <ContentCard key={item.Id} item={item} index={i} variant="horizontal" />
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Explore loading skeleton */}
                {!loading && !hasSearched && exploreLoading && (
                    <div className="space-y-10">
                        {/* Horizontal Skeleton */}
                        <div>
                            <div className="h-5 w-32 skeleton rounded-md mb-4" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="aspect-[16/9] skeleton rounded-xl" />
                                ))}
                            </div>
                        </div>
                        {/* Vertical Skeleton */}
                        <div>
                            <div className="h-5 w-32 skeleton rounded-md mb-4" />
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="aspect-[2/3] skeleton rounded-xl" />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
