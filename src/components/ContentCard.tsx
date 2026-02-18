"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { jellyfin, JellyfinItem } from "@/lib/jellyfin";
import { useState } from "react";

interface ContentCardProps {
    item: JellyfinItem;
    index?: number;
    variant?: "vertical" | "horizontal";
}

export default function ContentCard({ item, index = 0, variant = "vertical" }: ContentCardProps) {
    const router = useRouter();
    const [imageError, setImageError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const isHorizontal = variant === "horizontal";

    const posterUrl = jellyfin.getImageUrl(item.Id, "Primary", { maxWidth: isHorizontal ? 600 : 400 });
    const backdropUrl = item.BackdropImageTags?.length
        ? jellyfin.getImageUrl(item.Id, "Backdrop", { maxWidth: 800 })
        : null;

    // For horizontal cards, we prefer backdrop. For vertical, we prefer primary (poster).
    const displayImageUrl = isHorizontal ? (backdropUrl || posterUrl) : posterUrl;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.04 }}
            onClick={() => router.push(`/item/${item.Id}`)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`group relative flex-shrink-0 cursor-pointer snap-start transition-all duration-300 ${isHorizontal
                ? "w-[240px] sm:w-[280px] md:w-[320px] lg:w-[360px]"
                : "w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px]"
                }`}
        >
            {/* Image Container */}
            <div
                className={`relative rounded-xl overflow-hidden card-shine transition-all duration-300 ${isHorizontal ? "aspect-[16/9]" : "aspect-[2/3]"
                    }`}
                style={{
                    border: isHovered ? "1px solid rgba(13,214,232,0.4)" : "1px solid rgba(255,255,255,0.05)",
                    boxShadow: isHovered ? "0 0 30px rgba(13,214,232,0.15)" : "none",
                }}
            >
                {!imageError ? (
                    <motion.img
                        src={displayImageUrl}
                        alt={item.Name}
                        className="w-full h-full object-cover"
                        animate={{ scale: isHovered ? 1.08 : 1 }}
                        transition={{ duration: 0.4 }}
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20" style={{ backgroundColor: "#000d2e" }}>
                        <svg className="w-10 h-10 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                    </div>
                )}

                {/* Hover Overlay */}
                <motion.div
                    initial={false}
                    animate={{ opacity: isHovered ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 flex flex-col justify-end p-3 sm:p-4"
                    style={{ background: "linear-gradient(to top, rgba(0,6,26,0.9) 0%, rgba(0,6,26,0.3) 50%, transparent 100%)" }}
                >
                    <p className={`text-white/80 line-clamp-3 leading-tight ${isHorizontal ? "text-xs sm:text-sm" : "text-[10px] sm:text-xs"
                        }`}>
                        {item.Overview ?? ""}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                        {item.CommunityRating && (
                            <span className="text-[10px] sm:text-xs font-bold flex items-center gap-0.5" style={{ color: "#0DD6E8" }}>
                                ★ {item.CommunityRating.toFixed(1)}
                            </span>
                        )}
                        {item.ProductionYear && (
                            <span className="text-[10px] sm:text-xs text-white/50">{item.ProductionYear}</span>
                        )}
                    </div>
                </motion.div>

                {/* Type Badge */}
                <div className="absolute top-2 left-2 z-10">
                    <span
                        className="px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase rounded-md text-white backdrop-blur-md"
                        style={{ backgroundColor: "rgba(13,214,232,0.8)" }}
                    >
                        {item.Type === "Series" ? "TV" : item.Type}
                    </span>
                </div>
            </div>

            {/* Title */}
            <div className="mt-2.5 px-0.5">
                <p className={`font-medium text-white truncate transition-colors ${isHorizontal ? "text-sm sm:text-base" : "text-xs sm:text-sm"
                    }`} style={{ color: isHovered ? "#0DD6E8" : "white" }}>
                    {item.Name}
                </p>
                <p className="text-[10px] sm:text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {item.ProductionYear ? `${item.ProductionYear} • ` : ""}{item.Type}
                </p>
            </div>
        </motion.div>
    );
}
