"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { useAuth } from "@/context/AuthContext";
import { tmdb } from "@/lib/tmdb";
import { saveContinueWatching } from "@/lib/profiles";
import { motion, AnimatePresence } from "framer-motion";
import Hls from "hls.js";

// ─── Icons ───────────────────────────────────────────────────────────────────

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

// ─── Types ────────────────────────────────────────────────────────────────────

type SourceId = "1";

interface ExternalVideoSource {
    label: string;
    url: string;
    lang: string;
}

interface ExternalSourceState {
    loading: boolean;
    error: string | null;
    sources: ExternalVideoSource[];
    activeIdx: number;
}

const INITIAL_EXTERNAL: ExternalSourceState = {
    loading: false,
    error: null,
    sources: [],
    activeIdx: 0,
};

// ─── HLS Video Player ─────────────────────────────────────────────────────────

function HlsVideoPlayer({ url, referer }: { url: string; referer?: string }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    void referer;

    useEffect(() => {
        if (!videoRef.current || !url) return;
        const video = videoRef.current;

        if (url.includes(".m3u8") && Hls.isSupported()) {
            const hls = new Hls({
                enableWorker: true,
                xhrSetup: (xhr) => {
                    // Some servers need a referer — best effort
                    xhr.setRequestHeader("Origin", window.location.origin);
                },
            });
            hls.loadSource(url);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play().catch(() => {});
            });
            return () => hls.destroy();
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            // Safari native HLS
            video.src = url;
            video.play().catch(() => {});
        } else {
            // Direct MP4 or other
            video.src = url;
            video.play().catch(() => {});
        }
    }, [url]);

    return (
        <video
            ref={videoRef}
            className="w-full h-full bg-black"
            controls
            playsInline
            autoPlay
        />
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VideoPlayer() {
    const {
        playerTmdbId,
        playerTitle,
        playerType,
        playerSeason,
        playerEpisode,
        closePlayer,
    } = useStore();
    const router = useRouter();
    const { user } = useAuth();
    const activeProfile = useStore((s) => s.activeProfile);

    const [isControlsVisible, setIsControlsVisible] = useState(true);
    const controlTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const playerContainerRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const [imdbId, setImdbId] = useState<string | null>(null);

    // ── Source state ──────────────────────────────────────────────────────────
    const [activeSource, setActiveSource] = useState<SourceId>("1");

    // ── TMDB details & continue-watching ─────────────────────────────────────
    useEffect(() => {
        const checkCamStatus = async () => {
            if (playerTmdbId) {
                try {
                    const details = await tmdb.getDetails(playerTmdbId, playerType);
                    if (details?.imdb_id) setImdbId(details.imdb_id);

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
                    console.error("Failed to fetch TMDB details", e);
                }
            }
        };
        checkCamStatus();
    }, [playerTmdbId, playerType, user, activeProfile, playerTitle, playerSeason, playerEpisode]);

    void imdbId;

    // ── Embed URL (Source 1) ──────────────────────────────────────────────────
    const getEmbedUrl = useCallback(() => {
        return playerType === "movie"
            ? `https://multiembed.mov/?video_id=${playerTmdbId}&tmdb=1`
            : `https://multiembed.mov/?video_id=${playerTmdbId}&tmdb=1&s=${playerSeason}&e=${playerEpisode}`;
    }, [playerType, playerTmdbId, playerSeason, playerEpisode]);

    const embedUrl = getEmbedUrl();


    // ── Fullscreen ────────────────────────────────────────────────────────────
    const toggleFullscreen = useCallback(() => {
        if (!playerContainerRef.current) return;
        if (!document.fullscreenElement) {
            playerContainerRef.current.requestFullscreen().catch(console.error);
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
            if (e.key.toLowerCase() === "f") { e.preventDefault(); toggleFullscreen(); }
            else if (e.key === " " || e.code === "Space") {
                e.preventDefault();
                const iframe = document.querySelector("iframe");
                if (iframe) iframe.focus();
            }
        };
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [toggleFullscreen]);

    // ── Controls visibility ───────────────────────────────────────────────────
    const showControls = useCallback(() => {
        setIsControlsVisible(true);
        if (controlTimeoutRef.current) clearTimeout(controlTimeoutRef.current);
        controlTimeoutRef.current = setTimeout(() => setIsControlsVisible(false), 4000);
    }, []);

    useEffect(() => {
        showControls();
        return () => { if (controlTimeoutRef.current) clearTimeout(controlTimeoutRef.current); };
    }, [showControls]);

    // ── Source config ─────────────────────────────────────────────────────────
    const sources: { id: SourceId; label: string }[] = [
        { id: "1", label: "Source 1" },
    ];

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

                {/* ── Player area ── */}
                {activeSource === "1" && (
                    <iframe
                        key={embedUrl}
                        src={embedUrl}
                        className="w-full h-full border-0 relative z-50 bg-black"
                        allowFullScreen
                        // @ts-ignore
                        webkitallowfullscreen="true"
                        mozallowfullscreen="true"
                        allow="autoplay; fullscreen; picture-in-picture; encrypted-media; web-share"
                        referrerPolicy="no-referrer-when-downgrade"
                    />
                )}

                {/* ── Header Controls ── */}
                <AnimatePresence>
                    {isControlsVisible && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-0 left-0 right-0 p-4 sm:p-8 flex flex-col sm:flex-row items-center justify-between z-[200] pointer-events-none gap-4"
                            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%)" }}
                        >
                            <div className="flex items-center w-full sm:w-auto">
                                <button
                                    onClick={() => { closePlayer(); router.push("/browse"); }}
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

                            <div className="flex items-center gap-3 pointer-events-auto">
                                {/* ── Source Switcher ── */}
                                <div className="flex items-center bg-black/40 backdrop-blur-md rounded-full p-1 gap-1 border border-white/10">
                                    {sources.map((src) => (
                                        <button
                                            key={src.id}
                                            onClick={() => setActiveSource(src.id)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                                activeSource === src.id
                                                    ? "bg-white text-black shadow-md"
                                                    : "text-white/70 hover:text-white hover:bg-white/10"
                                            }`}
                                        >
                                            {src.label}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={toggleFullscreen}
                                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all group flex-shrink-0"
                                >
                                    {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Footer hint ── */}
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
                                {activeSource === "1"
                                    ? "Switch between Sources from the top bar."
                                    : "Source loaded."}
                                {playerType === "tv" && " If watching Anime, click the CC icon for subtitles."}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
