"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { tmdb } from "@/lib/tmdb";
import { motion, AnimatePresence } from "framer-motion";

const BackIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-white">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
);

// SourceIcon removed

// DownloadIcon removed

// SourceType removed

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
    const [isCam, setIsCam] = useState(false);

    const [imdbId, setImdbId] = useState<string | null>(null);

    useEffect(() => {
        const checkCamStatus = async () => {
            if (playerTmdbId) {
                try {
                    const details = await tmdb.getDetails(playerTmdbId, playerType);
                    
                    // Save IMDB ID for HDF APIs
                    if (details?.imdb_id) {
                        setImdbId(details.imdb_id);
                    }

                    // Check for CAM version (movies released in 2026)
                    if (playerType === "movie" && details?.release_date?.startsWith("2026")) {
                        setIsCam(true);
                    } else {
                        setIsCam(false);
                    }
                } catch (e) {
                    console.error("Failed to fetch details for HDF API check", e);
                }
            }
        };
        checkCamStatus();
    }, [playerTmdbId, playerType]);

    const getEmbedUrl = () => {
        return playerType === "movie"
            ? `https://multiembed.mov/?video_id=${playerTmdbId}&tmdb=1`
            : `https://multiembed.mov/?video_id=${playerTmdbId}&tmdb=1&s=${playerSeason}&e=${playerEpisode}`;
    };

    const embedUrl = getEmbedUrl();

    const showControls = useCallback(() => {
        setIsControlsVisible(true);
        if (controlTimeoutRef.current) clearTimeout(controlTimeoutRef.current);
        controlTimeoutRef.current = setTimeout(() => {
            setIsControlsVisible(false);
        }, 4000);
    }, []);

    // Also hide controls after initial mount
    useEffect(() => {
        showControls();
        return () => {
            if (controlTimeoutRef.current) clearTimeout(controlTimeoutRef.current);
        };
    }, [showControls]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-0 sm:p-4"
            onMouseMove={showControls}
            onTouchStart={showControls}
        >
            <div className="relative w-full h-full max-w-[1920px] rounded-0 sm:rounded-xl overflow-hidden shadow-2xl bg-black/90">
                <iframe
                    key={embedUrl}
                    src={embedUrl}
                    className="w-full h-full border-0 relative z-50 bg-black"
                    allowFullScreen={true}
                    // @ts-ignore
                    webkitallowfullscreen="true"
                    mozallowfullscreen="true"
                    allow="autoplay; fullscreen; encrypted-media; picture-in-picture; web-share; clipboard-write"
                    referrerPolicy="origin"
                    loading="lazy"
                />
                
                {/* Header Controls */}
                <AnimatePresence>
                    {isControlsVisible && (
                        <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-0 left-0 right-0 p-4 sm:p-8 flex flex-col sm:flex-row items-center justify-between z-[200] pointer-events-none gap-4"
                            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)" }}
                        >
                            <div className="flex items-center w-full sm:w-auto">
                                <button
                                    onClick={closePlayer}
                                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all pointer-events-auto group flex-shrink-0"
                                >
                                    <BackIcon />
                                </button>
                                <div className="ml-4 truncate">
                                    <h2 className="text-white font-bold text-lg sm:text-xl drop-shadow-md truncate">{playerTitle}</h2>
                                    {playerType === "tv" && (
                                        <p className="text-white/70 text-sm font-medium">Season {playerSeason}, Episode {playerEpisode}</p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer Controls & Sources */}
                <AnimatePresence>
                    {isControlsVisible && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 flex flex-col items-center justify-end z-[200] pointer-events-none gap-4"
                            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)" }}
                        >
                            <p className="text-white/60 text-xs sm:text-sm text-center drop-shadow-md pb-2 max-w-lg">
                                You can choose different servers from the button on the top left.
                                {playerType === "tv" && " If watching Anime, click the CC icon to select subtitles."}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
