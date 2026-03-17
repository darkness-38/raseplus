"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { useAuth } from "@/context/AuthContext";
import { tmdb } from "@/lib/tmdb";
import { saveContinueWatching } from "@/lib/profiles";
import { motion, AnimatePresence } from "framer-motion";

const BackIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-white">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
);

const FullscreenIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-white">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9m5.25 11.25v-4.5m0 4.5h-4.5m4.5 0L15 15" />
    </svg>
);

const FullscreenExitIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-white">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75v4.5m0 0H4.5M9 8.25L3.75 3.75M9 15.75v4.5m0-4.5H4.5M9 15.75l-5.25 5.25M15 3.75v4.5m0 0h4.5m-4.5-4.5l5.25 5.25M15 15.75v4.5m0-4.5h4.5m-4.5 0l5.25-5.25" />
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
    const { user } = useAuth();
    const activeProfile = useStore((s) => s.activeProfile);
    
    const [isControlsVisible, setIsControlsVisible] = useState(true);
    const controlTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const playerContainerRef = useRef<HTMLDivElement>(null);
    const [isCam, setIsCam] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

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

                    // Save to Continue Watching
                    if (user && activeProfile) {
                        saveContinueWatching(user.uid, activeProfile.id, {
                            id: playerTmdbId,
                            title: playerTitle,
                            type: playerType === "movie" ? "movie" : "tv",
                            posterPath: details.poster_path,
                            season: playerSeason,
                            episode: playerEpisode,
                        });
                    }
                } catch (e) {
                    console.error("Failed to fetch details for HDF API check", e);
                }
            }
        };
        checkCamStatus();
    }, [playerTmdbId, playerType, user, activeProfile, playerTitle, playerSeason, playerEpisode]);

    const getEmbedUrl = useCallback(() => {
        return playerType === "movie"
            ? `https://multiembed.mov/?video_id=${playerTmdbId}&tmdb=1`
            : `https://multiembed.mov/?video_id=${playerTmdbId}&tmdb=1&s=${playerSeason}&e=${playerEpisode}`;
    }, [playerType, playerTmdbId, playerSeason, playerEpisode]);

    const embedUrl = getEmbedUrl();

    const toggleFullscreen = useCallback(() => {
        if (!playerContainerRef.current) return;

        if (!document.fullscreenElement) {
            playerContainerRef.current.requestFullscreen().catch((err) => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);

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
            ref={playerContainerRef}
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

                            <button
                                onClick={toggleFullscreen}
                                className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all pointer-events-auto group flex-shrink-0"
                            >
                                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                            </button>
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
