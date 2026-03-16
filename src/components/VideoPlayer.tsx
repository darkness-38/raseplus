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

    console.log("Oynatılan URL:", embedUrl);

    const showControls = useCallback(() => {
        setIsControlsVisible(true);
        if (controlTimeoutRef.current) clearTimeout(controlTimeoutRef.current);
        controlTimeoutRef.current = setTimeout(() => {
            setIsControlsVisible(false);
        }, 3000);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
            onMouseMove={showControls}
        >
            <div className="relative w-full h-full">
                <iframe
                    src={embedUrl}
                    className="w-full h-full border-0 relative z-50"
                    allowFullScreen
                    allow="autoplay; fullscreen"
                    referrerPolicy="origin"
                    sandbox="allow-forms allow-scripts allow-same-origin allow-presentation"
                    loading="lazy"
                />
                
                {/* Header Controls */}
                <AnimatePresence>
                    {isControlsVisible && (
                        <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-0 left-0 right-0 p-6 sm:p-10 flex items-center justify-between z-20 pointer-events-none"
                            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)" }}
                        >
                            <button
                                onClick={closePlayer}
                                className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all pointer-events-auto group"
                            >
                                <BackIcon />
                            </button>
                            <div className="text-center flex-1 mx-4">
                                <h2 className="text-white font-bold text-lg sm:text-2xl drop-shadow-md truncate">{playerTitle}</h2>
                                {playerType === "tv" && (
                                    <p className="text-white/60 text-xs sm:text-sm font-medium">Sezon {playerSeason}, Bölüm {playerEpisode}</p>
                                )}
                            </div>
                            <div className="w-12" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer Warnings */}
                <AnimatePresence>
                    {isControlsVisible && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 flex flex-col items-center justify-end z-[60] pointer-events-none"
                            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)" }}
                        >
                            <p className="text-white/80 text-xs sm:text-sm text-center drop-shadow-md bg-black/40 px-4 py-2 rounded-full backdrop-blur-md">
                                Videoyu başlatmak veya sesi açmak için ekrana tıklayın.
                                {playerType === "tv" && " Anime izliyorsanız İngilizce altyazı için CC butonunu kullanın."}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
