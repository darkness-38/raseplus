"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { useStore } from "@/store/useStore";
import { jellyfin } from "@/lib/jellyfin";
import { motion, AnimatePresence } from "framer-motion";

export default function VideoPlayer() {
    const { playerItemId, playerTitle, closePlayer, nextEpisodeId, nextEpisodeTitle, openPlayer } = useStore();
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const hlsRef = useRef<Hls | null>(null);

    // State
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isControlsVisible, setIsControlsVisible] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [activeTab, setActiveTab] = useState<"quality" | "audio" | "subtitles">("quality");

    // Track state (Metadata)
    const [qualities, setQualities] = useState<{ index: number; height: number; bitrate: number }[]>([]);
    const [currentQuality, setCurrentQuality] = useState(-1); // -1 = auto
    const [audioTracks, setAudioTracks] = useState<{ index: number; name: string; lang?: string }[]>([]);
    const [currentAudio, setCurrentAudio] = useState<number | undefined>(undefined);
    const [subtitles, setSubtitles] = useState<{ index: number; name: string; lang?: string }[]>([]);
    const [currentSubtitle, setCurrentSubtitle] = useState<number | undefined>(undefined);

    const [mediaSourceId, setMediaSourceId] = useState<string | null>(null);
    // Removed persistent playSessionId state

    const controlTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastTimeRef = useRef<number>(0);

    // 1. Fetch Metadata & Setup Tracks
    useEffect(() => {
        if (!playerItemId) return;

        const fetchMetadata = async () => {
            try {
                setIsLoading(true);
                const item = await jellyfin.getItem(playerItemId);
                console.log("[VideoPlayer] Metadata loaded:", item);

                const source = item.MediaSources?.[0];
                const sourceId = source?.Id ?? playerItemId;
                setMediaSourceId(sourceId);

                console.log("[VideoPlayer] MediaStreams:", source?.MediaStreams);

                if (source?.MediaStreams) {
                    const audio = source.MediaStreams.filter(s => s.Type === "Audio").map(s => ({
                        index: s.Index,
                        name: s.DisplayTitle || s.Title || s.Language || `Audio ${s.Index}`,
                        lang: s.Language
                    }));
                    setAudioTracks(audio);

                    const defaultAudio = source.MediaStreams.find(s => s.Type === "Audio" && s.IsDefault);
                    if (defaultAudio) setCurrentAudio(defaultAudio.Index);
                    else if (audio.length > 0) setCurrentAudio(audio[0].index);

                    const subs = source.MediaStreams.filter(s => s.Type === "Subtitle").map(s => ({
                        index: s.Index,
                        name: s.DisplayTitle || s.Title || s.Language || `Subtitle ${s.Index}`,
                        lang: s.Language
                    }));
                    setSubtitles(subs);

                    const defaultSub = source.MediaStreams.find(s => s.Type === "Subtitle" && s.IsDefault);
                    if (defaultSub) setCurrentSubtitle(defaultSub.Index);
                    else setCurrentSubtitle(undefined);
                }

                jellyfin.startPlayback(playerItemId, sourceId);
            } catch (e) {
                console.error("Error fetching metadata:", e);
            }
        };

        fetchMetadata();
    }, [playerItemId]);

    // 2. Load/Reload Stream when Source or Tracks change
    useEffect(() => {
        if (!playerItemId || !mediaSourceId || !videoRef.current) return;

        // Don't load stream until we have determined initial audio/subs (to avoid double load)
        // We can check if audioTracks is populated if we expect them, but simpler is just to depend on state.
        // However, we need to handle the case where we just loaded metadata and are setting state.

        const loadStream = () => {
            // 1. Capture current time using REF (reliable across re-renders/cleanups where videoRef might be reset)
            const savedTime = lastTimeRef.current;
            const currentTicks = Math.floor(savedTime * 10000000);

            console.log("[VideoPlayer] Reloading stream. Saved Time:", savedTime, "s (", currentTicks, "ticks)");

            setIsLoading(true);
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }

            // Generate a fresh session ID for every stream load to force server to respect new track selection
            const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);

            const streamUrl = jellyfin.getStreamUrl(playerItemId, mediaSourceId, sessionId, {
                audioStreamIndex: currentAudio,
                subtitleStreamIndex: currentSubtitle,
                startTimeTicks: currentTicks
            });

            console.log("[VideoPlayer] Loading stream with SessionId:", sessionId);
            console.log("[VideoPlayer] URL:", streamUrl);

            if (Hls.isSupported()) {
                const hls = new Hls({
                    capLevelToPlayerSize: true,
                    autoStartLoad: true,
                    startPosition: savedTime
                });
                hlsRef.current = hls;

                hls.loadSource(streamUrl);
                hls.attachMedia(videoRef.current!);

                hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
                    setIsLoading(false);
                    console.log("[VideoPlayer] Manifest Parsed. Resuming at:", savedTime);

                    // Force client-side seek if server didn't start at the right time
                    if (savedTime > 0 && videoRef.current) {
                        videoRef.current.currentTime = savedTime;
                    }

                    videoRef.current?.play().catch(e => console.error("Play failed:", e));

                    // Get Quality Levels (Client side from HLS manifest)
                    const levels = hls.levels.map((l, i) => ({
                        index: i,
                        height: l.height,
                        bitrate: l.bitrate
                    })).sort((a, b) => b.height - a.height);
                    setQualities(levels);

                    // NOTE: We do NOT overwrite audio/subs from HLS manifest anymore
                    // as we are managing them server-side via query params.
                });

                hls.on(Hls.Events.ERROR, (_, data) => {
                    if (data.fatal) {
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                hls.startLoad();
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                hls.recoverMediaError();
                                break;
                            default:
                                hls.destroy();
                                break;
                        }
                    }
                });

            } else if (videoRef.current?.canPlayType("application/vnd.apple.mpegurl")) {
                videoRef.current.src = streamUrl;
                videoRef.current.addEventListener("loadedmetadata", () => {
                    setIsLoading(false);
                    videoRef.current?.play();
                });
            }
        };

        loadStream();

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };

    }, [playerItemId, mediaSourceId, currentAudio, currentSubtitle]);

    // Cleanup reporting
    useEffect(() => {
        return () => {
            if (playerItemId && mediaSourceId && videoRef.current) {
                jellyfin.stopPlayback(playerItemId, mediaSourceId, videoRef.current.currentTime * 10000000);
            }
        };
    }, [playerItemId, mediaSourceId]);

    // Handle Controls Visibility
    const showControls = () => {
        setIsControlsVisible(true);
        if (controlTimeoutRef.current) clearTimeout(controlTimeoutRef.current);
        controlTimeoutRef.current = setTimeout(() => {
            if (!showSettings && playing) setIsControlsVisible(false);
        }, 3000);
    };

    useEffect(() => {
        const handleMouseMove = () => showControls();
        const handleKeyDown = (e: KeyboardEvent) => {
            showControls();
            if (e.key === "ArrowRight") seek(10);
            if (e.key === "ArrowLeft") seek(-10);
            if (e.key === " ") togglePlay();
            if (e.key === "Escape") closePlayer();
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("keydown", handleKeyDown);
            if (controlTimeoutRef.current) clearTimeout(controlTimeoutRef.current);
        };
    }, [playing, showSettings]);

    // Video Events
    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const time = videoRef.current.currentTime;
            setCurrentTime(time);
            lastTimeRef.current = time;
            setDuration(videoRef.current.duration || 0);
        }
    };

    const handlePlayPause = () => {
        setPlaying(!videoRef.current?.paused);
    };

    // Actions
    const togglePlay = () => {
        if (videoRef.current?.paused) {
            videoRef.current.play();
        } else {
            videoRef.current?.pause();
            if (videoRef.current && playerItemId && mediaSourceId) {
                jellyfin.onPlaybackProgress(playerItemId, mediaSourceId, videoRef.current.currentTime * 10000000);
            }
        }
    };

    const seek = (seconds: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime = Math.min(Math.max(videoRef.current.currentTime + seconds, 0), duration);
        }
    };

    const seekTo = (time: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime = time;
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleVolumeChange = (v: number) => {
        if (videoRef.current) {
            videoRef.current.volume = v;
            setVolume(v);
            setIsMuted(v === 0);
        }
    };

    const changeQuality = (index: number) => {
        if (hlsRef.current) {
            hlsRef.current.currentLevel = index;
            setCurrentQuality(index);
        }
    };

    const changeAudio = (index: number) => {
        console.log("[VideoPlayer] Changing Audio to:", index);
        setCurrentAudio(index);
    };

    const changeSubtitle = (index: number) => {
        console.log("[VideoPlayer] Changing Subtitle to:", index);
        setCurrentSubtitle(index);
    };

    const handleNextEpisode = () => {
        if (nextEpisodeId && nextEpisodeTitle) {
            openPlayer(nextEpisodeId, nextEpisodeTitle);
        }
    };

    // Helper format
    const formatTime = (time: number) => {
        const h = Math.floor(time / 3600);
        const m = Math.floor((time % 3600) / 60);
        const s = Math.floor(time % 60);
        if (h > 0) return `${h}:${m < 10 ? "0" + m : m}:${s < 10 ? "0" + s : s}`;
        return `${m}:${s < 10 ? "0" + s : s}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center font-sans"
            ref={containerRef}
            onMouseMove={showControls}
            onClick={() => { if (showSettings) setShowSettings(false); }}
        >
            <video
                ref={videoRef}
                className="w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onPlay={handlePlayPause}
                onPause={handlePlayPause}
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            />

            {/* Loading Spinner */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {/* Controls Overlay */}
            <AnimatePresence>
                {isControlsVisible && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col justify-between p-6 sm:p-10 bg-gradient-to-b from-black/60 via-transparent to-black/80"
                        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.8) 100%)" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Top Bar */}
                        <div className="flex items-start justify-between">
                            <button
                                onClick={closePlayer}
                                className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all group"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-white group-hover:scale-110 transition-transform">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                                </svg>
                            </button>
                            <div className="text-center">
                                <h2 className="text-white/90 font-bold text-lg sm:text-2xl drop-shadow-md">{playerTitle}</h2>
                            </div>
                            <div className="w-12" /> {/* Spacer */}
                        </div>

                        {/* Center Play Button (Large) */}
                        {!playing && !isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="w-20 h-20 rounded-full bg-cyan-500/20 backdrop-blur-sm flex items-center justify-center pointer-events-auto cursor-pointer hover:bg-cyan-500/40 transition-colors"
                                    onClick={togglePlay}
                                >
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-white ml-1">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </motion.div>
                            </div>
                        )}

                        {/* Bottom Bar */}
                        <div className="flex flex-col gap-4">
                            {/* Progress Bar */}
                            <div className="group relative h-1.5 bg-white/20 rounded-full cursor-pointer hover:h-2.5 transition-all"
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const pct = (e.clientX - rect.left) / rect.width;
                                    seekTo(pct * duration);
                                }}
                            >
                                <div
                                    className="absolute top-0 left-0 h-full bg-cyan-400 rounded-full relative"
                                    style={{ width: `${(currentTime / duration) * 100}%` }}
                                >
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full scale-0 group-hover:scale-100 transition-transform shadow-lg" />
                                </div>
                            </div>

                            {/* Controls Row */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 sm:gap-6">
                                    <button onClick={togglePlay} className="text-white hover:text-cyan-400 transition-colors">
                                        {playing ? (
                                            <svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                                        ) : (
                                            <svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                        )}
                                    </button>

                                    {/* Seek Buttons */}
                                    <button onClick={() => seek(-10)} className="text-white/80 hover:text-white transition-colors flex flex-col items-center gap-0.5 group">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="group-hover:-translate-x-0.5 transition-transform"><path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-6 6m0 0l-6-6m6 6V9a6 6 0 0112 0v3" /></svg>
                                        <span className="text-[10px] font-bold">-10s</span>
                                    </button>
                                    <button onClick={() => seek(10)} className="text-white/80 hover:text-white transition-colors flex flex-col items-center gap-0.5 group">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="group-hover:translate-x-0.5 transition-transform"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15l6 6m0 0l6-6m-6 6V9a6 6 0 00-12 0v3" /></svg>
                                        <span className="text-[10px] font-bold">+10s</span>
                                    </button>

                                    {/* Volume */}
                                    <div className="flex items-center gap-2 group/vol">
                                        <button onClick={toggleMute} className="text-white hover:text-cyan-400">
                                            {isMuted || volume === 0 ? (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 17.25l-5.25-5.25m0 0L6.75 6.75M12 12l2.25-2.25m-2.25 2.25l-2.25 2.25M3 3l18 18" /></svg>
                                            ) : (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>
                                            )}
                                        </button>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.05"
                                            value={isMuted ? 0 : volume}
                                            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                                            className="w-0 overflow-hidden group-hover/vol:w-20 transition-all accent-cyan-400 h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
                                        />
                                    </div>

                                    <div className="text-xs sm:text-sm font-medium text-white/70">
                                        {formatTime(currentTime)} / {formatTime(duration)}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {/* Next Episode Button */}
                                    {nextEpisodeId && (
                                        <button
                                            onClick={handleNextEpisode}
                                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-cyan-500/20 hover:text-cyan-400 transition-all text-sm font-bold border border-white/10"
                                        >
                                            Next Episode
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                            </svg>
                                        </button>
                                    )}

                                    {/* Settings Toggle */}
                                    <div className="relative">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
                                            className={`p-2 rounded-full transition-colors ${showSettings ? 'text-cyan-400 bg-white/10' : 'text-white hover:text-cyan-400'}`}
                                        >
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.43.816 1.035.816 1.73 0 .695-.32 1.3-.816 1.73m0-3.46a24.347 24.347 0 010 3.46" />
                                            </svg>
                                        </button>

                                        {/* Settings Menu */}
                                        <AnimatePresence>
                                            {showSettings && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    className="absolute bottom-12 right-0 w-72 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 text-sm"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div className="flex border-b border-white/10">
                                                        <button
                                                            onClick={() => setActiveTab("quality")}
                                                            className={`flex-1 py-3 font-semibold transition-colors ${activeTab === "quality" ? "text-cyan-400 bg-white/5" : "text-white/60 hover:text-white"}`}
                                                        >
                                                            Quality
                                                        </button>
                                                        <button
                                                            onClick={() => setActiveTab("audio")}
                                                            className={`flex-1 py-3 font-semibold transition-colors ${activeTab === "audio" ? "text-cyan-400 bg-white/5" : "text-white/60 hover:text-white"}`}
                                                        >
                                                            Audio
                                                        </button>
                                                        <button
                                                            onClick={() => setActiveTab("subtitles")}
                                                            className={`flex-1 py-3 font-semibold transition-colors ${activeTab === "subtitles" ? "text-cyan-400 bg-white/5" : "text-white/60 hover:text-white"}`}
                                                        >
                                                            Subs
                                                        </button>
                                                    </div>

                                                    <div className="max-h-60 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/20">
                                                        {activeTab === "quality" && (
                                                            <div className="flex flex-col gap-1">
                                                                <button
                                                                    onClick={() => changeQuality(-1)}
                                                                    className={`px-3 py-2 rounded-lg text-left hover:bg-white/10 flex items-center justify-between ${currentQuality === -1 ? "text-cyan-400" : "text-white/80"}`}
                                                                >
                                                                    <span>Auto</span>
                                                                    {currentQuality === -1 && <CheckIcon />}
                                                                </button>
                                                                {qualities.map((q) => (
                                                                    <button
                                                                        key={q.index}
                                                                        onClick={() => changeQuality(q.index)}
                                                                        className={`px-3 py-2 rounded-lg text-left hover:bg-white/10 flex items-center justify-between ${currentQuality === q.index ? "text-cyan-400" : "text-white/80"}`}
                                                                    >
                                                                        <span>{q.height}p <span className="text-xs opacity-50">({Math.round(q.bitrate / 1000)}k)</span></span>
                                                                        {currentQuality === q.index && <CheckIcon />}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {activeTab === "audio" && (
                                                            <div className="flex flex-col gap-1">
                                                                {audioTracks.map((t) => (
                                                                    <button
                                                                        key={t.index}
                                                                        onClick={() => changeAudio(t.index)}
                                                                        className={`px-3 py-2 rounded-lg text-left hover:bg-white/10 flex items-center justify-between ${currentAudio === t.index ? "text-cyan-400" : "text-white/80"}`}
                                                                    >
                                                                        <span>{t.name}</span>
                                                                        <span className="text-xs opacity-50 uppercase">{t.lang}</span>
                                                                        {currentAudio === t.index && <CheckIcon />}
                                                                    </button>
                                                                ))}
                                                                {audioTracks.length === 0 && <div className="p-4 text-center text-white/40">No alternate audio tracks</div>}
                                                            </div>
                                                        )}

                                                        {activeTab === "subtitles" && (
                                                            <div className="flex flex-col gap-1">
                                                                <button
                                                                    onClick={() => changeSubtitle(-1)}
                                                                    className={`px-3 py-2 rounded-lg text-left hover:bg-white/10 flex items-center justify-between ${currentSubtitle === -1 || currentSubtitle === undefined ? "text-cyan-400" : "text-white/80"}`}
                                                                >
                                                                    <span>Off</span>
                                                                    {(currentSubtitle === -1 || currentSubtitle === undefined) && <CheckIcon />}
                                                                </button>
                                                                {subtitles.map((t) => (
                                                                    <button
                                                                        key={t.index}
                                                                        onClick={() => changeSubtitle(t.index)}
                                                                        className={`px-3 py-2 rounded-lg text-left hover:bg-white/10 flex items-center justify-between ${currentSubtitle === t.index ? "text-cyan-400" : "text-white/80"}`}
                                                                    >
                                                                        <span>{t.name}</span>
                                                                        <span className="text-xs opacity-50 uppercase">{t.lang}</span>
                                                                        {currentSubtitle === t.index && <CheckIcon />}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Fullscreen Toggle (Simple implementation) */}
                                    <button onClick={() => {
                                        if (!document.fullscreenElement) {
                                            containerRef.current?.requestFullscreen();
                                        } else {
                                            document.exitFullscreen();
                                        }
                                    }} className="text-white hover:text-cyan-400 transition-colors">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);
