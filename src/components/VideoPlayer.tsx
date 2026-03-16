"use client";

import { useRef, useState, useCallback } from "react";
import { useStore } from "@/store/useStore";
import { motion, AnimatePresence } from "framer-motion";

const BackIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-white">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
);

export default function VideoPlayer() {
    const { 
        playerTmdbId,
        playerTitle, 
        playerType,
        playerSeason,
        playerEpisode,
        closePlayer, 
    } = useStore();
    
    const [isControlsVisible, setIsControlsVisible] = useState(true);
    const controlTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const embedUrl = playerType === "movie"
        ? `https://vidsrc.to/embed/movie/${playerTmdbId}`
        : `https://vidsrc.to/embed/tv/${playerTmdbId}/${playerSeason}/${playerEpisode}`;

    const showControls = useCallback(() => {
        setIsControlsVisible(true);
        if (controlTimeoutRef.current) clearTimeout(controlTimeoutRef.current);
        controlTimeoutRef.current = setTimeout(() => {
            setIsControlsVisible(false);
        }, 3000);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="w-full relative group mt-8 sm:mt-12"
        >
            {/* Ambient Glow Effects */}
            <div className="absolute -inset-1 sm:-inset-2 rounded-2xl sm:rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500" style={{ backgroundColor: "#0DD6E8" }} />
            <div className="absolute -inset-4 sm:-inset-6 rounded-2xl sm:rounded-3xl blur-[60px] opacity-20 group-hover:opacity-30 transition-opacity duration-700" style={{ backgroundColor: "#013DCB" }} />

            {/* Inner Container */}
            <div 
                className="relative w-full aspect-video rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl z-10"
                style={{
                    border: "1px solid rgba(13,214,232,0.3)",
                    backgroundColor: "#00061a",
                }}
                onMouseMove={showControls}
            >
                {/* Header Controls Overlay */}
                <AnimatePresence>
                    {isControlsVisible && (
                        <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-0 left-0 right-0 p-4 sm:p-6 lg:p-8 flex items-start justify-between z-20 pointer-events-none"
                            style={{ background: "linear-gradient(to bottom, rgba(0,6,26,0.95) 0%, transparent 100%)" }}
                        >
                            <button
                                onClick={closePlayer}
                                className="p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all pointer-events-auto hover:bg-[#0DD6E8] hover:text-black group flex items-center justify-center shadow-lg"
                                style={{ 
                                    backgroundColor: "rgba(255,255,255,0.05)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    backdropFilter: "blur(10px)"
                                }}
                            >
                                <BackIcon />
                            </button>
                            
                            <div className="flex-1 px-4 sm:px-6">
                                <h2 className="text-white font-black text-lg sm:text-2xl drop-shadow-md tracking-tight truncate font-heading">{playerTitle}</h2>
                                {playerType === "tv" && (
                                    <p className="text-white/60 text-xs sm:text-sm font-bold tracking-wide uppercase mt-1">Sezon {playerSeason} • Bölüm {playerEpisode}</p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* The Video Source */}
                <iframe
                    src={embedUrl}
                    className="w-full h-full border-0 relative z-10 pointer-events-auto"
                    allowFullScreen
                    sandbox="allow-forms allow-scripts allow-same-origin allow-presentation"
                    loading="lazy"
                    title={playerTitle}
                />
            </div>
            
            <div className="flex items-center gap-2 mt-4 px-2 opacity-60">
                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-xs text-white/80">Harici kaynaktan oynatılıyor. Reklam içerikleri Rase+ kontrolünde değildir.</p>
            </div>
        </motion.div>
    );
}
