"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useStore } from "@/store/useStore";
import { useAuth } from "@/context/AuthContext";
import { getContinueWatching, ContinueWatchingItem } from "@/lib/profiles";

export default function ContinueWatching() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [items, setItems] = useState<ContinueWatchingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const { user } = useAuth();
    const activeProfile = useStore((s) => s.activeProfile);
    const openPlayer = useStore((s) => s.openPlayer);

    useEffect(() => {
        const fetchItems = async () => {
            if (user && activeProfile) {
                try {
                    const data = await getContinueWatching(user.uid, activeProfile.id);
                    setItems(data);
                } catch (e) {
                    console.error("Failed to fetch continue watching:", e);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        fetchItems();
    }, [user, activeProfile]);

    const checkScroll = () => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setCanScrollLeft(scrollLeft > 10);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    };

    const scroll = (direction: "left" | "right") => {
        if (!scrollRef.current) return;
        const amount = scrollRef.current.clientWidth * 0.75;
        const targetPosition = scrollRef.current.scrollLeft + (direction === "left" ? -amount : amount);
        scrollRef.current.scrollTo({
            left: targetPosition,
            behavior: "smooth",
        });
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener("resize", checkScroll);
        return () => window.removeEventListener("resize", checkScroll);
    }, [items]);

    if (loading || items.length === 0) return null;

    return (
        <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative group/row"
        >
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-3 sm:mb-4 px-4 sm:px-6 lg:px-12 font-heading">
                Continue Watching
            </h2>

            <div className="relative">
                {/* Left Arrow */}
                {canScrollLeft && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            scroll("left");
                        }}
                        className="absolute left-0 top-0 bottom-0 z-40 w-10 sm:w-14 opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center cursor-pointer disabled:opacity-0"
                        style={{ background: "linear-gradient(to right, #00061a 20%, transparent)" }}
                    >
                        <div
                            className="pointer-events-none w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white transition-colors hover:bg-white/20"
                            style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                        >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        </div>
                    </button>
                )}

                {/* Scrollable Row */}
                <div
                    ref={scrollRef}
                    onScroll={checkScroll}
                    className="flex gap-2.5 sm:gap-3 md:gap-4 overflow-x-auto hide-scrollbar px-4 sm:px-6 lg:px-12 pb-2 scroll-smooth"
                >
                    {items.map((item, i) => (
                        <div
                            key={item.id}
                            onClick={() => openPlayer({
                                tmdbId: item.id,
                                title: item.title,
                                type: item.type,
                                season: item.season,
                                episode: item.episode
                            })}
                            className="group relative flex-shrink-0 cursor-pointer snap-start transition-all duration-300 w-[240px] sm:w-[280px] md:w-[320px] lg:w-[360px]"
                        >
                            <div className="relative rounded-xl overflow-hidden aspect-[16/9] border border-white/5 group-hover:border-[#0DD6E8]/40 transition-all duration-300">
                                <Image
                                    src={`https://image.tmdb.org/t/p/w500${item.posterPath}`}
                                    alt={item.title}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale(1.08)"
                                />
                                {/* Play Icon Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white fill-current" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-2.5 px-0.5">
                                <p className="font-medium text-white truncate group-hover:text-[#0DD6E8] text-sm sm:text-base transition-colors">
                                    {item.title}
                                </p>
                                {item.type === "tv" && item.season && item.episode && (
                                    <p className="text-[10px] sm:text-xs mt-0.5 text-white/50">
                                        S{item.season} E{item.episode}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right Arrow */}
                {canScrollRight && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            scroll("right");
                        }}
                        className="absolute right-0 top-0 bottom-0 z-40 w-10 sm:w-14 opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center cursor-pointer disabled:opacity-0"
                        style={{ background: "linear-gradient(to left, #00061a 20%, transparent)" }}
                    >
                        <div
                            className="pointer-events-none w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white transition-colors hover:bg-white/20"
                            style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                        >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </button>
                )}
            </div>
        </motion.section>
    );
}
