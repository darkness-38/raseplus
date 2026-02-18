"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { JellyfinItem } from "@/lib/jellyfin";
import ContentCard from "./ContentCard";

interface ContentRowProps {
    title: string;
    items: JellyfinItem[];
    variant?: "vertical" | "horizontal";
}

export default function ContentRow({ title, items, variant = "vertical" }: ContentRowProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setCanScrollLeft(scrollLeft > 10);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    };

    const scroll = (direction: "left" | "right") => {
        if (!scrollRef.current) return;
        const amount = scrollRef.current.clientWidth * 0.75;
        scrollRef.current.scrollBy({
            left: direction === "left" ? -amount : amount,
            behavior: "smooth",
        });
    };

    if (!items.length) return null;

    return (
        <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative group/row"
        >
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-3 sm:mb-4 px-4 sm:px-6 lg:px-12 font-heading">
                {title}
            </h2>

            <div className="relative">
                {/* Left Arrow */}
                {canScrollLeft && (
                    <button
                        onClick={() => scroll("left")}
                        className="absolute left-0 top-0 bottom-0 z-10 w-10 sm:w-12 opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center"
                        style={{ background: "linear-gradient(to right, #00061a, transparent)" }}
                    >
                        <div
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white transition-colors"
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
                    className="flex gap-2.5 sm:gap-3 md:gap-4 overflow-x-auto hide-scrollbar px-4 sm:px-6 lg:px-12 pb-2 snap-x"
                >
                    {items.map((item, i) => (
                        <ContentCard key={item.Id} item={item} index={i} variant={variant} />
                    ))}
                </div>

                {/* Right Arrow */}
                {canScrollRight && (
                    <button
                        onClick={() => scroll("right")}
                        className="absolute right-0 top-0 bottom-0 z-10 w-10 sm:w-12 opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center"
                        style={{ background: "linear-gradient(to left, #00061a, transparent)" }}
                    >
                        <div
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white transition-colors"
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
