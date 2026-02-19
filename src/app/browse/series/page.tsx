"use client";

import { useEffect, useState } from "react";
import { jellyfin, JellyfinItem, LIBRARY_IDS } from "@/lib/jellyfin";
import { useStore } from "@/store/useStore";
import { filterForKids, filterAdultContent } from "@/lib/profiles";
import ContentRow from "@/components/ContentRow";
import ContentCard from "@/components/ContentCard";
import { motion } from "framer-motion";
import { useSiteConfig } from "@/lib/siteConfig";

export default function SeriesPage() {
    const isReady = useStore((s) => s.isJellyfinReady);
    const activeProfile = useStore((s) => s.activeProfile);
    const isKids = activeProfile?.isKids ?? false;
    const allowAdult = activeProfile?.allowAdultContent ?? false;

    const [items, setItems] = useState<JellyfinItem[]>([]);
    const [topRated, setTopRated] = useState<JellyfinItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { config: cfg } = useSiteConfig();

    useEffect(() => {
        if (!isReady) return;
        const fetch = async () => {
            try {
                const [all, top] = await Promise.all([
                    jellyfin.getLibraryItems(LIBRARY_IDS.series, {
                        limit: 60,
                        sortBy: "DateCreated",
                        sortOrder: "Descending",
                    }),
                    jellyfin.getLibraryItems(LIBRARY_IDS.series, {
                        limit: 30,
                        sortBy: "CommunityRating",
                        sortOrder: "Descending",
                    }),
                ]);
                let allItems = isKids ? filterForKids(all.Items) : all.Items;
                let topItems = isKids ? filterForKids(top.Items) : top.Items;
                allItems = filterAdultContent(allItems, allowAdult);
                topItems = filterAdultContent(topItems, allowAdult);
                setItems(allItems.slice(0, 50));
                setTopRated(topItems.slice(0, 20));
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
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
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-1 sm:mb-2 font-heading">
                    {cfg.browse.seriesPageTitle}
                </h1>
                <p className="text-sm sm:text-base" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {cfg.browse.seriesPageSubtitle}
                </p>
            </motion.div>

            <ContentRow title={cfg.browse.topRatedSeriesTitle} items={topRated} variant="horizontal" />

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-10 sm:mt-12 px-4 sm:px-6 lg:px-12"
            >
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-4 sm:mb-6 font-heading">
                    {cfg.browse.allSeriesTitle}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
                    {items.map((item, i) => (
                        <ContentCard key={item.Id} item={item} index={i} variant="horizontal" />
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
