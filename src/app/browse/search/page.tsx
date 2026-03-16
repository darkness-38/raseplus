"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { tmdb } from "@/lib/tmdb";
import { useStore } from "@/store/useStore";
import ContentCard from "@/components/ContentCard";
import { motion, AnimatePresence } from "framer-motion";
import { MediaItem } from "@/types/media";

export default function SearchPage() {
    const activeProfile = useStore((s) => s.activeProfile);
    const isKids = activeProfile?.isKids ?? false;

    const [query, setQuery] = useState("");
    const [results, setResults] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Explore suggestions from TMDB
    const [suggestedMovies, setSuggestedMovies] = useState<MediaItem[]>([]);
    const [suggestedTV, setSuggestedTV] = useState<MediaItem[]>([]);
    const [exploreLoading, setExploreLoading] = useState(true);

    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-focus on mount
    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 300);
    }, []);

    // Fetch explore content
    useEffect(() => {
        const fetchExplore = async () => {
            try {
                const [trending, popularMovies, popularTV] = await Promise.all([
                    tmdb.getTrending("all"),
                    tmdb.getMovies("popular"),
                    tmdb.getTVShows("popular"),
                ]);

                setSuggestedMovies(popularMovies.slice(0, 12));
                setSuggestedTV(popularTV.slice(0, 12));
            } catch (e) {
                console.error("Failed to fetch explore content:", e);
            } finally {
                setExploreLoading(false);
            }
        };
        fetchExplore();
    }, []);

    const performSearch = useCallback(
        async (searchQuery: string) => {
            if (!searchQuery.trim()) {
                setResults([]);
                setHasSearched(false);
                return;
            }

            setLoading(true);
            setHasSearched(true);
            try {
                const items = await tmdb.search(searchQuery);
                setResults(items);
            } catch (e) {
                console.error("Search failed:", e);
                setResults([]);
            } finally {
                setLoading(false);
            }
        },
        []
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

    return (
        <div className="min-h-screen pt-16 sm:pt-[72px]">
            {/* Full-width Search Bar */}
            <div
                className="sticky top-16 sm:top-[72px] z-30 px-4 sm:px-6 lg:px-12 py-4"
                style={{
                    backgroundColor: "rgba(0,6,26,0.92)",
                    backdropFilter: "blur(20px)",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
            >
                <div className="relative max-w-full">
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
                        placeholder="Film, dizi veya oyuncu ara..."
                        className="w-full pl-12 sm:pl-14 pr-12 py-3.5 sm:py-4 rounded-lg text-white text-sm sm:text-base focus:outline-none transition-all font-body bg-white/5 border border-white/5 focus:border-cyan-500/30 focus:bg-white/10"
                    />

                    {/* Clear button */}
                    <AnimatePresence>
                        {query && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                onClick={handleClear}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20"
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
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {!loading && hasSearched && results.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-20"
                    >
                        <p className="text-base font-medium text-white/50">&quot;{query}&quot; için sonuç bulunamadı.</p>
                    </motion.div>
                )}

                {/* Search Results */}
                {!loading && hasSearched && results.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                            {results.map((item, i) => (
                                <ContentCard key={item.id} item={item} index={i} variant="vertical" />
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Explore */}
                {!loading && !hasSearched && !exploreLoading && (
                    <div className="space-y-10">
                        {suggestedMovies.length > 0 && (
                            <div>
                                <h2 className="text-lg font-black text-white mb-4 uppercase tracking-widest">Popular Movies</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                    {suggestedMovies.slice(0, 8).map((item, i) => (
                                        <ContentCard key={item.id} item={item} index={i} variant="horizontal" />
                                    ))}
                                </div>
                            </div>
                        )}

                        {suggestedTV.length > 0 && (
                            <div>
                                <h2 className="text-lg font-black text-white mb-4 uppercase tracking-widest">Popular Series</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                                    {suggestedTV.map((item, i) => (
                                        <ContentCard key={item.id} item={item} index={i} variant="vertical" />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
