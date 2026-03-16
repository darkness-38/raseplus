"use client";

import { useEffect, useState } from "react";
import { tmdb } from "@/lib/tmdb";
import { useStore } from "@/store/useStore";
import ContentRow from "@/components/ContentRow";
import ContentCard from "@/components/ContentCard";
import { motion } from "framer-motion";
import { MediaItem } from "@/types/media";

export default function MoviesPage() {
    const [popular, setPopular] = useState<MediaItem[]>([]);
    const [topRated, setTopRated] = useState<MediaItem[]>([]);
    const [upcoming, setUpcoming] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const [pop, top, up] = await Promise.all([
                    tmdb.getMovies("popular"),
                    tmdb.getMovies("top_rated"),
                    tmdb.getMovies("upcoming"),
                ]);
                setPopular(pop);
                setTopRated(top);
                setUpcoming(up);
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="aspect-[16/9] skeleton rounded-xl" />
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
                    FİLMLER
                </h1>
                <p className="text-sm sm:text-base text-white/40 max-w-2xl">
                    Discover the world's most popular and newest movies. Watch in the best quality from local and global sources.
                </p>
            </motion.div>

            <ContentRow title="En Çok Oy Alanlar" items={topRated} variant="horizontal" />
            
            <div className="mt-10 space-y-12">
                <ContentRow title="Yakında Gelecekler" items={upcoming} variant="horizontal" />
                
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="px-4 sm:px-6 lg:px-12"
                >
                    <h2 className="text-xl font-black text-white mb-6 font-heading uppercase">Popular Movies</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                        {popular.map((item, i) => (
                            <ContentCard key={item.id} item={item} index={i} variant="horizontal" />
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
