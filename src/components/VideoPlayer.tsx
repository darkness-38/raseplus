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

const SourceIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="mr-2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-16.5-3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3m-19.5 0a4.5 4.5 0 0 1 .9-2.7L5.737 5.1a3.375 3.375 0 0 1 2.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 0 1 .9 2.7m0 0a3 3 0 0 1-3 3m0 3h.008v.008h-.008v-.008Z" />
    </svg>
);

const DownloadIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-white">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

type SourceType = "superembed" | "autoembed" | "2embed";

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
    const [activeSource, setActiveSource] = useState<SourceType>("superembed");
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
        switch (activeSource) {
            case "superembed":
                return playerType === "movie"
                    ? `https://multiembed.mov/?video_id=${playerTmdbId}&tmdb=1`
                    : `https://multiembed.mov/?video_id=${playerTmdbId}&tmdb=1&s=${playerSeason}&e=${playerEpisode}`;
            case "autoembed":
                return playerType === "movie"
                    ? `https://player.autoembed.cc/embed/movie/${playerTmdbId}`
                    : `https://player.autoembed.cc/embed/tv/${playerTmdbId}/${playerSeason}/${playerEpisode}`;
            case "2embed":
                return playerType === "movie"
                    ? `https://www.2embed.cc/embed/${playerTmdbId}`
                    : `https://www.2embed.cc/embedtv/${playerTmdbId}&s=${playerSeason}&e=${playerEpisode}`;
            default:
                return "";
        }
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
                    allowFullScreen
                    // @ts-ignore
                    webkitAllowFullScreen
                    mozAllowFullScreen
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
                            className="absolute top-0 left-0 right-0 p-4 sm:p-8 flex flex-col sm:flex-row items-center justify-between z-20 pointer-events-none gap-4"
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
                            
                            {/* Download Button */}
                            <div className="flex items-center mt-2 sm:mt-0 pointer-events-auto w-full sm:w-auto justify-end sm:justify-start">
                                <button
                                    onClick={() => alert('Download functionality needs to be implemented. Please connect your download service API.')}
                                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-semibold text-sm sm:text-base flex items-center transition-all border border-white/10 hover:border-white/20 shadow-lg"
                                >
                                    <DownloadIcon />
                                    <span className="ml-2">İndir</span>
                                </button>
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
                            className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 flex flex-col items-center justify-end z-[60] pointer-events-none gap-4"
                            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)" }}
                        >
                            {/* Source Selection Marquee */}
                            <div className="flex flex-wrap justify-center gap-2 pointer-events-auto bg-black/40 p-2 rounded-2xl backdrop-blur-md border border-white/5">
                                <button 
                                    onClick={() => setActiveSource("superembed")}
                                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center ${activeSource === "superembed" ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(255,255,255,0.3)]" : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"}`}
                                >
                                    <SourceIcon />
                                    Source 1 (Most Stable)
                                </button>
                                <button 
                                    onClick={() => setActiveSource("autoembed")}
                                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center ${activeSource === "autoembed" ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(255,255,255,0.3)]" : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"}`}
                                >
                                    <SourceIcon />
                                    Source 2 (Fallback)
                                </button>
                                <button 
                                    onClick={() => setActiveSource("2embed")}
                                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center ${activeSource === "2embed" ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(255,255,255,0.3)]" : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"}`}
                                >
                                    <SourceIcon />
                                    Source 3 (Fallback)
                                </button>
                            </div>

                            <p className="text-white/60 text-xs sm:text-sm text-center drop-shadow-md pb-2 max-w-lg">
                                If the stream doesn't load or buffers, please try the different sources above.
                                {playerType === "tv" && " If watching Anime, click the CC icon on Source 1 to select subtitles."}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
