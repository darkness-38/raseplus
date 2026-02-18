"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { jellyfin, JellyfinItem } from "@/lib/jellyfin";
import { useState, useEffect, useCallback } from "react";

interface HeroBannerProps {
    items: JellyfinItem[];
}

export default function HeroBanner({ items }: HeroBannerProps) {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [imageError, setImageError] = useState(false);

    const featured = items[currentIndex];

    const next = useCallback(() => {
        setCurrentIndex((i) => (i + 1) % items.length);
        setImageError(false);
    }, [items.length]);

    useEffect(() => {
        if (items.length <= 1) return;
        const timer = setInterval(next, 8000);
        return () => clearInterval(timer);
    }, [items.length, next]);

    if (!items.length) return null;

    const backdropUrl =
        featured.BackdropImageTags?.length
            ? jellyfin.getImageUrl(featured.Id, "Backdrop", { maxWidth: 1920, quality: 85 })
            : jellyfin.getImageUrl(featured.Id, "Primary", { maxWidth: 1920, quality: 85 });

    const logoUrl = featured.ImageTags?.Logo
        ? jellyfin.getImageUrl(featured.Id, "Logo", { maxWidth: 500 })
        : null;

    return (
        <div className="relative w-full h-[60vh] sm:h-[70vh] lg:h-[85vh] overflow-hidden">
            {/* Backdrop */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={featured.Id}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0"
                >
                    {!imageError ? (
                        <img
                            src={backdropUrl}
                            alt={featured.Name}
                            className="w-full h-full object-cover"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <div className="w-full h-full bg-surface-light" />
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Gradient overlays */}
            <div className="absolute inset-0 hero-gradient" />
            <div className="absolute inset-0 hero-gradient-left" />

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 lg:p-16 pb-14 sm:pb-16 lg:pb-24">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={featured.Id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.6 }}
                        className="max-w-2xl"
                    >
                        {/* Logo or Title */}
                        {logoUrl ? (
                            <img
                                src={logoUrl}
                                alt={featured.Name}
                                className="h-12 sm:h-20 lg:h-28 object-contain mb-3 sm:mb-4 drop-shadow-2xl"
                            />
                        ) : (
                            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black text-white mb-3 sm:mb-4 drop-shadow-2xl leading-tight font-heading">
                                {featured.Name}
                            </h1>
                        )}

                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4 text-xs sm:text-sm text-white/70">
                            {featured.ProductionYear && (
                                <span className="font-medium">{featured.ProductionYear}</span>
                            )}
                            {featured.OfficialRating && (
                                <span className="px-2 py-0.5 border border-white/30 rounded text-[10px] sm:text-xs font-bold">
                                    {featured.OfficialRating}
                                </span>
                            )}
                            {featured.CommunityRating && (
                                <span className="font-bold flex items-center gap-1" style={{ color: "#0DD6E8" }}>
                                    ★ {featured.CommunityRating.toFixed(1)}
                                </span>
                            )}
                            {featured.Genres?.slice(0, 2).map((g) => (
                                <span key={g} className="hidden sm:inline text-white/50">
                                    {g}
                                </span>
                            ))}
                        </div>

                        {/* Overview */}
                        <p className="text-sm sm:text-base text-white/70 line-clamp-2 sm:line-clamp-3 mb-4 sm:mb-6 leading-relaxed max-w-xl font-body">
                            {featured.Overview}
                        </p>

                        {/* Buttons */}
                        <div className="flex flex-col xs:flex-row items-stretch sm:items-center gap-3 sm:flex-row">
                            <button
                                onClick={() => router.push(`/item/${featured.Id}`)}
                                className="btn-primary flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-bold"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                                Play
                            </button>
                            <button
                                onClick={() => router.push(`/item/${featured.Id}`)}
                                className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-full text-sm sm:text-base font-semibold text-white/70 hover:bg-white/10 transition-all"
                                style={{
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    backgroundColor: "rgba(255,255,255,0.05)",
                                }}
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                More Info
                            </button>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Dot indicators */}
                {items.length > 1 && (
                    <div className="flex items-center gap-2 mt-6 sm:mt-8">
                        {items.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    setCurrentIndex(i);
                                    setImageError(false);
                                }}
                                className="h-1 rounded-full transition-all duration-300 min-h-[8px]"
                                style={{
                                    width: i === currentIndex ? 32 : 12,
                                    backgroundColor: i === currentIndex ? "#0DD6E8" : "rgba(255,255,255,0.3)",
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
