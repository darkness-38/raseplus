"use client";

import { useEffect, useState } from "react";
import { tmdb } from "@/lib/tmdb";
import { useStore } from "@/store/useStore";
import ContentRow from "@/components/ContentRow";
import ContentCard from "@/components/ContentCard";
import { motion } from "framer-motion";
import { MediaItem } from "@/types/media";

export default function AnimePage() {
    const [popular, setPopular] = useState<MediaItem[]>([]);
    const [trending, setTrending] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                // trending anime isn't a direct TMDB endpoint, we use discover
                const [pop, trend] = await Promise.all([
                    tmdb.getAnime(1),
                    tmdb.getAnime(2),
                ]);
                setPopular(pop);
                setTrending(trend);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen pt-24 px-4 sm:px-6 lg:px-12">
                <div className="h-8 w-48 skeleton rounded-lg mb-8" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {Array.from({ length: 18 }).map((_, i) => (
                        <div key={i} className="aspect-[2/3] skeleton rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-20 sm:pt-24 pb-20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 sm:px-6 lg:px-12 mb-8 sm:mb-10"
            >
                <h1 className="text-3xl sm:text-5xl font-black text-white mb-2 font-heading uppercase tracking-tighter">
                    ANIME
                </h1>
                <p className="text-sm sm:text-base text-white/40 max-w-2xl">
                    Discover the latest Japanese animations. Action, adventure, drama, and more are here in the highest quality.
                </p>
            </motion.div>

            <ContentRow title="Trending Anime" items={trending} variant="vertical" />
            
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-12 px-4 sm:px-6 lg:px-12"
            >
                <h2 className="text-xl font-black text-white mb-6 font-heading uppercase">All Anime</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                    {popular.map((item, i) => (
                        <ContentCard key={item.id} item={item} index={i} variant="vertical" />
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
