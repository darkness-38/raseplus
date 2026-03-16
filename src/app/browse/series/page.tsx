"use client";

import { useEffect, useState } from "react";
import { tmdb } from "@/lib/tmdb";
import { useStore } from "@/store/useStore";
import ContentRow from "@/components/ContentRow";
import ContentCard from "@/components/ContentCard";
import { motion } from "framer-motion";
import { MediaItem } from "@/types/media";

export default function SeriesPage() {
    const [popular, setPopular] = useState<MediaItem[]>([]);
    const [topRated, setTopRated] = useState<MediaItem[]>([]);
    const [onTheAir, setOnTheAir] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const [pop, top, air] = await Promise.all([
                    tmdb.getTVShows("popular"),
                    tmdb.getTVShows("top_rated"),
                    tmdb.getTVShows("on_the_air"),
                ]);
                setPopular(pop);
                setTopRated(top);
                setOnTheAir(air);
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
                    SERIES
                </h1>
                <p className="text-sm sm:text-base text-white/40 max-w-2xl">
                    Discover the most watched and latest series. Follow all seasons from local and global sources.
                </p>
            </motion.div>

            <ContentRow title="Top Rated Series" items={topRated} variant="horizontal" />
            
            <div className="mt-10 space-y-12">
                <ContentRow title="On The Air" items={onTheAir} variant="horizontal" />
                
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="px-4 sm:px-6 lg:px-12"
                >
                    <h2 className="text-xl font-black text-white mb-6 font-heading uppercase">Popular Series</h2>
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
