"use client";

import { useEffect, useState } from "react";
import { jellyfin, JellyfinItem, LIBRARY_IDS } from "@/lib/jellyfin";
import { useStore } from "@/store/useStore";
import { filterForKids } from "@/lib/profiles";
import ContentCard from "@/components/ContentCard";
import { motion } from "framer-motion";

export default function MangaPage() {
    const isReady = useStore((s) => s.isJellyfinReady);
    const activeProfile = useStore((s) => s.activeProfile);
    const isKids = activeProfile?.isKids ?? false;

    const [items, setItems] = useState<JellyfinItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isReady) return;
        const fetch = async () => {
            try {
                const data = await jellyfin.getLibraryItems(LIBRARY_IDS.manga, {
                    limit: 100,
                    sortBy: "SortName",
                    sortOrder: "Ascending",
                });
                const filtered = isKids ? filterForKids(data.Items) : data.Items;
                setItems(filtered);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [isReady, isKids]);

    if (loading || !isReady) {
        return (
            <div className="min-h-screen pt-24 px-4 sm:px-6 lg:px-12">
                <div className="h-8 w-48 skeleton rounded-lg mb-8" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
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
                className="px-4 sm:px-6 lg:px-12"
            >
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-1 sm:mb-2 font-heading">
                    Manga
                </h1>
                <p className="text-sm sm:text-base mb-8 sm:mb-10" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Browse your manga collection
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4">
                    {items.map((item, i) => (
                        <ContentCard key={item.Id} item={item} index={i} variant="vertical" />
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
