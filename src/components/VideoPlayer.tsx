"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Hls from "hls.js";
import { jellyfin } from "@/lib/jellyfin";
import { useStore } from "@/store/useStore";

export default function VideoPlayer() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const hideTimeoutRef = useRef<NodeJS.Timeout>(undefined);

    const {
        playerItemId,
        playerTitle,
        closePlayer,
        nextEpisodeId,
        nextEpisodeTitle,
        openPlayer,
        setNextEpisode,
    } = useStore();

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [buffered, setBuffered] = useState(0);
    const [showNextPrompt, setShowNextPrompt] = useState(false);
    const [introData, setIntroData] = useState<{
        IntroStart?: number;
        IntroEnd?: number;
    } | null>(null);
    const [showSkipIntro, setShowSkipIntro] = useState(false);
    const [quality, setQuality] = useState(-1); // -1 = auto
    const [showQualityMenu, setShowQualityMenu] = useState(false);
    const [qualities, setQualities] = useState<{ height: number; index: number }[]>([]);

    // Initialize HLS stream
    useEffect(() => {
        if (!playerItemId || !videoRef.current) return;

        const video = videoRef.current;
        const streamUrl = jellyfin.getStreamUrl(playerItemId);

        if (Hls.isSupported()) {
            const hls = new Hls({
                maxBufferLength: 30,
                maxMaxBufferLength: 60,
                startLevel: -1,
            });
            hlsRef.current = hls;
            hls.loadSource(streamUrl);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
                const q = data.levels.map((level, index) => ({
                    height: level.height,
                    index,
                }));
                setQualities(q);
                video.play().catch(() => { });
            });

            hls.on(Hls.Events.ERROR, (_, data) => {
                if (data.fatal) {
                    console.error("HLS Fatal Error:", data);
                    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                        hls.startLoad();
                    } else {
                        // Fallback to direct stream
                        video.src = jellyfin.getDirectStreamUrl(playerItemId);
                        video.play().catch(() => { });
                    }
                }
            });

            return () => {
                hls.destroy();
                hlsRef.current = null;
            };
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = streamUrl;
            video.play().catch(() => { });
        } else {
            video.src = jellyfin.getDirectStreamUrl(playerItemId);
            video.play().catch(() => { });
        }
    }, [playerItemId]);

    // Fetch intro timestamps
    useEffect(() => {
        if (!playerItemId) return;
        jellyfin.getIntroTimestamps(playerItemId).then(setIntroData);
    }, [playerItemId]);

    // Skip intro logic
    useEffect(() => {
        if (!introData?.IntroStart || !introData?.IntroEnd) return;
        setShowSkipIntro(
            currentTime >= introData.IntroStart && currentTime < introData.IntroEnd
        );
    }, [currentTime, introData]);

    // Auto-next prompt (10s before end)
    useEffect(() => {
        if (!nextEpisodeId || duration <= 0) return;
        setShowNextPrompt(currentTime >= duration - 10 && currentTime < duration);
    }, [currentTime, duration, nextEpisodeId]);

    // Hide controls on idle
    const resetHideTimer = useCallback(() => {
        setShowControls(true);
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = setTimeout(() => {
            if (isPlaying) setShowControls(false);
        }, 3000);
    }, [isPlaying]);

    useEffect(() => {
        return () => {
            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        };
    }, []);

    // Video event handlers
    const onTimeUpdate = () => {
        if (!videoRef.current) return;
        setCurrentTime(videoRef.current.currentTime);
        if (videoRef.current.buffered.length > 0) {
            setBuffered(videoRef.current.buffered.end(videoRef.current.buffered.length - 1));
        }
    };

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play();
        } else {
            videoRef.current.pause();
        }
    };

    const seek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!videoRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        videoRef.current.currentTime = ratio * duration;
    };

    const changeVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        if (videoRef.current) {
            videoRef.current.volume = val;
            setIsMuted(val === 0);
        }
    };

    const toggleMute = () => {
        if (!videoRef.current) return;
        videoRef.current.muted = !videoRef.current.muted;
        setIsMuted(videoRef.current.muted);
    };

    const toggleFullscreen = async () => {
        if (!containerRef.current) return;
        if (document.fullscreenElement) {
            await document.exitFullscreen();
            setIsFullscreen(false);
        } else {
            await containerRef.current.requestFullscreen();
            setIsFullscreen(true);
        }
    };

    const setQualityLevel = (index: number) => {
        if (hlsRef.current) {
            hlsRef.current.currentLevel = index;
            setQuality(index);
        }
        setShowQualityMenu(false);
    };

    const skipIntro = () => {
        if (videoRef.current && introData?.IntroEnd) {
            videoRef.current.currentTime = introData.IntroEnd;
        }
    };

    const playNext = () => {
        if (nextEpisodeId && nextEpisodeTitle) {
            openPlayer(nextEpisodeId, nextEpisodeTitle);
            setNextEpisode(null, null);
        }
    };

    const formatTime = (s: number) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = Math.floor(s % 60);
        if (h > 0)
            return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
        return `${m}:${sec.toString().padStart(2, "0")}`;
    };

    return (
        <motion.div
            ref={containerRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
            onMouseMove={resetHideTimer}
            onClick={resetHideTimer}
        >
            {/* Video */}
            <video
                ref={videoRef}
                onTimeUpdate={onTimeUpdate}
                onDurationChange={() =>
                    setDuration(videoRef.current?.duration ?? 0)
                }
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={playNext}
                onClick={togglePlay}
                className="w-full h-full object-contain cursor-pointer"
                playsInline
            />

            {/* Controls Overlay */}
            <motion.div
                initial={false}
                animate={{ opacity: showControls ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className={`absolute inset-0 player-overlay pointer-events-none ${showControls ? "pointer-events-auto" : ""
                    }`}
            >
                {/* Top Bar */}
                <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 lg:p-6">
                    <button
                        onClick={closePlayer}
                        className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="text-sm font-medium hidden sm:block">Back</span>
                    </button>
                    <h3 className="text-white font-medium text-sm lg:text-base truncate max-w-md">
                        {playerTitle}
                    </h3>
                    <div className="w-20" />
                </div>

                {/* Center Play Button */}
                {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <button
                            onClick={togglePlay}
                            className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-all hover:scale-110"
                        >
                            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Skip Intro Button */}
                {showSkipIntro && (
                    <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        onClick={skipIntro}
                        className="absolute bottom-28 right-6 px-6 py-3 bg-white/20 backdrop-blur-md border border-white/30 text-white font-semibold rounded-lg hover:bg-white/30 transition-all"
                    >
                        Skip Intro ▸
                    </motion.button>
                )}

                {/* Auto-Next Prompt */}
                {showNextPrompt && nextEpisodeTitle && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-28 right-6 glass-strong rounded-xl p-4 max-w-xs"
                    >
                        <p className="text-xs text-muted mb-1">Up Next</p>
                        <p className="text-sm text-white font-medium mb-3 truncate">
                            {nextEpisodeTitle}
                        </p>
                        <button
                            onClick={playNext}
                            className="w-full py-2 bg-white text-black font-bold rounded-lg text-sm hover:bg-white/90 transition-all"
                        >
                            Play Next Episode
                        </button>
                    </motion.div>
                )}

                {/* Bottom Controls */}
                <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
                    {/* Progress Bar */}
                    <div className="relative h-1.5 group cursor-pointer mb-4" onClick={seek}>
                        <div className="absolute inset-0 bg-white/20 rounded-full overflow-hidden">
                            {/* Buffered */}
                            <div
                                className="absolute h-full bg-white/30 rounded-full"
                                style={{ width: `${(buffered / duration) * 100}%` }}
                            />
                            {/* Progress */}
                            <div
                                className="absolute h-full bg-accent rounded-full"
                                style={{ width: `${(currentTime / duration) * 100}%` }}
                            />
                        </div>
                        {/* Thumb */}
                        <div
                            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-accent rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ left: `calc(${(currentTime / duration) * 100}% - 8px)` }}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* Play/Pause */}
                            <button onClick={togglePlay} className="text-white hover:text-accent transition-colors">
                                {isPlaying ? (
                                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                                    </svg>
                                ) : (
                                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                )}
                            </button>

                            {/* Volume */}
                            <div className="flex items-center gap-2 group/vol">
                                <button onClick={toggleMute} className="text-white hover:text-accent transition-colors">
                                    {isMuted || volume === 0 ? (
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                        </svg>
                                    ) : (
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                        </svg>
                                    )}
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={isMuted ? 0 : volume}
                                    onChange={changeVolume}
                                    className="w-0 group-hover/vol:w-20 transition-all opacity-0 group-hover/vol:opacity-100 accent-accent h-1"
                                />
                            </div>

                            {/* Time */}
                            <span className="text-sm text-white/70 tabular-nums">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Quality */}
                            {qualities.length > 0 && (
                                <div className="relative">
                                    <button
                                        onClick={() => setShowQualityMenu(!showQualityMenu)}
                                        className="text-white hover:text-accent transition-colors text-sm font-medium px-2 py-1"
                                    >
                                        {quality === -1
                                            ? "Auto"
                                            : `${qualities.find((q) => q.index === quality)?.height ?? ""}p`}
                                    </button>
                                    {showQualityMenu && (
                                        <div className="absolute bottom-full right-0 mb-2 glass-strong rounded-xl overflow-hidden min-w-[120px] shadow-2xl">
                                            <button
                                                onClick={() => setQualityLevel(-1)}
                                                className={`w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors ${quality === -1 ? "text-accent" : "text-white"
                                                    }`}
                                            >
                                                Auto
                                            </button>
                                            {qualities
                                                .sort((a, b) => b.height - a.height)
                                                .map((q) => (
                                                    <button
                                                        key={q.index}
                                                        onClick={() => setQualityLevel(q.index)}
                                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors ${quality === q.index ? "text-accent" : "text-white"
                                                            }`}
                                                    >
                                                        {q.height}p
                                                    </button>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Fullscreen */}
                            <button
                                onClick={toggleFullscreen}
                                className="text-white hover:text-accent transition-colors"
                            >
                                {isFullscreen ? (
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
