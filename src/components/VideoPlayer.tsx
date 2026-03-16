"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import { useStore } from "@/store/useStore";
import { jellyfin } from "@/lib/jellyfin";
import { motion, AnimatePresence } from "framer-motion";

async function fetchVastAdUrl(): Promise<string | null> {
    try {
        const response = await fetch("/api/vast");
        const text = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");
        const mediaFiles = xmlDoc.getElementsByTagName("MediaFile");
        for (let i = 0; i < mediaFiles.length; i++) {
            const type = mediaFiles[i].getAttribute("type");
            if (type === "video/mp4") {
                return mediaFiles[i].textContent?.trim() || null;
            }
        }
        // Fallback or empty
        return null;
    } catch (e) {
        console.error("Error fetching VAST ad:", e);
        return null;
    }
}

function getAdSchedule(durationSeconds: number): number[] {
    // Returns 3 sections as requested: 25%, 50%, 75%
    if (durationSeconds <= 0) return [];
    return [
        Math.floor(durationSeconds * 0.25),
        Math.floor(durationSeconds * 0.50),
        Math.floor(durationSeconds * 0.75)
    ];
}

// ─── Icons ───
const PlayIcon = ({ size = 36 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z" />
    </svg>
);

const PauseIcon = ({ size = 36 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
);

const Replay10Icon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="drop-shadow-md">
        <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
        <text x="10" y="16.5" fontSize="7.5" fontWeight="bold" textAnchor="middle" fill="currentColor" fontFamily="system-ui">10</text>
    </svg>
);

const Forward10Icon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="drop-shadow-md">
        <path d="M18 13c0 3.31-2.69 6-6 6s-6-2.69-6-6 2.69-6 6-6v4l5-5-5-5v4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8h-2z" />
        <text x="13" y="16.5" fontSize="7.5" fontWeight="bold" textAnchor="middle" fill="currentColor" fontFamily="system-ui">10</text>
    </svg>
);

const FullscreenIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
    </svg>
);

const ExitFullscreenIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V3.75M9 9H3.75M9 9L3.75 3.75M9 15v5.25M9 15H3.75M9 15l-5.25 5.25M15 9h5.25M15 9V3.75M15 9l5.25-5.25M15 15h5.25M15 15v5.25M15 15l5.25 5.25" />
    </svg>
);

const VolumeHighIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
);

const VolumeLowIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
);

const VolumeMutedIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
);

const BackIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-white group-hover:scale-110 transition-transform">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
);

const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);

const SettingsIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const NextIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
);

// ─── Main Component ───
export default function VideoPlayer() {
    const { 
        playerItemId, 
        playerTmdbId,
        playerTitle, 
        playerType,
        playerSource,
        playerSeason,
        playerEpisode,
        closePlayer, 
        nextEpisodeId, 
        nextEpisodeTitle, 
        openPlayer 
    } = useStore();
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const adVideoRef = useRef<HTMLVideoElement>(null);
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
    const [isFullscreen, setIsFullscreen] = useState(false);

    // ─── 1. Hybrid Source Logic ───
    const isGlobal = playerSource === "global";
    const embedUrl = isGlobal 
        ? playerType === "movie"
            ? `https://vidsrc.to/embed/movie/${playerTmdbId}`
            : `https://vidsrc.to/embed/tv/${playerTmdbId}/${playerSeason}/${playerEpisode}`
        : null;

    // ... (rest of metadata & setup tracks)
    const [qualities, setQualities] = useState<{ index: number; height: number; bitrate: number }[]>([]);
    const [currentQuality, setCurrentQuality] = useState(-1);
    const [audioTracks, setAudioTracks] = useState<{ index: number; name: string; lang?: string }[]>([]);
    const [currentAudio, setCurrentAudio] = useState<number | undefined>(undefined);
    const [subtitles, setSubtitles] = useState<{ index: number; name: string; lang?: string }[]>([]);
    const [currentSubtitle, setCurrentSubtitle] = useState<number | undefined>(undefined);

    const [mediaSourceId, setMediaSourceId] = useState<string | null>(null);

    // Skip flash effect
    const [skipFlash, setSkipFlash] = useState<'left' | 'right' | null>(null);
    const skipFlashTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Pause animation
    const [showPauseIndicator, setShowPauseIndicator] = useState(false);

    // Ad system state
    const [isAdPlaying, setIsAdPlaying] = useState(false);
    const [adCurrentTime, setAdCurrentTime] = useState(0);
    const [adDuration, setAdDuration] = useState(0);
    const [adCuePoints, setAdCuePoints] = useState<number[]>([]);
    const [consumedCuePoints, setConsumedCuePoints] = useState<Set<number>>(new Set());
    const [preRollDone, setPreRollDone] = useState(false);
    const [savedVideoTime, setSavedVideoTime] = useState(0);
    const adStartedRef = useRef(false);

    const controlTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastTimeRef = useRef<number>(0);

    // ─── 1. Fetch Metadata & Setup Tracks ───
    useEffect(() => {
        if (!playerItemId) return;

        // Reset ad state for new video
        setPreRollDone(false);
        setAdCuePoints([]);
        setConsumedCuePoints(new Set());
        setIsAdPlaying(false);
        adStartedRef.current = false;

        const fetchMetadata = async () => {
            try {
                setIsLoading(true);
                const item = await jellyfin.getItem(playerItemId);

                const source = item.MediaSources?.[0];
                const sourceId = source?.Id ?? playerItemId;
                setMediaSourceId(sourceId);

                if (source?.MediaStreams) {
                    const audio = source.MediaStreams.filter((s: any) => s.Type === "Audio").map((s: any) => ({
                        index: s.Index,
                        name: s.DisplayTitle || s.Title || s.Language || `Audio ${s.Index}`,
                        lang: s.Language
                    }));
                    setAudioTracks(audio);

                    const defaultAudio = source.MediaStreams.find((s: any) => s.Type === "Audio" && s.IsDefault);
                    if (defaultAudio) setCurrentAudio(defaultAudio.Index);
                    else if (audio.length > 0) setCurrentAudio(audio[0].index);

                    const subs = source.MediaStreams.filter((s: any) => s.Type === "Subtitle").map((s: any) => ({
                        index: s.Index,
                        name: s.DisplayTitle || s.Title || s.Language || `Subtitle ${s.Index}`,
                        lang: s.Language
                    }));
                    setSubtitles(subs);

                    const defaultSub = source.MediaStreams.find((s: any) => s.Type === "Subtitle" && s.IsDefault);
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

    // ─── 2. Load/Reload Stream ───
    useEffect(() => {
        if (!playerItemId || !mediaSourceId || !videoRef.current) return;

        const loadStream = () => {
            const savedTime = lastTimeRef.current;
            const currentTicks = Math.floor(savedTime * 10000000);

            setIsLoading(true);
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }

            const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);

            const streamUrl = jellyfin.getStreamUrl(playerItemId, mediaSourceId, sessionId, {
                audioStreamIndex: currentAudio,
                subtitleStreamIndex: currentSubtitle,
                startTimeTicks: currentTicks
            });

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

                    if (savedTime > 0 && videoRef.current) {
                        videoRef.current.currentTime = savedTime;
                    }

                    // Don't auto-play if we need pre-roll
                    if (!preRollDone && !adStartedRef.current) {
                        // Start pre-roll ad
                        adStartedRef.current = true;
                        startAd().catch(e => console.error("Initial ad failed:", e));
                    } else {
                        setPlaying(true);
                    }

                    const levels = hls.levels.map((l, i) => ({
                        index: i,
                        height: l.height,
                        bitrate: l.bitrate
                    })).sort((a, b) => b.height - a.height);
                    setQualities(levels);
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
                    if (!preRollDone && !adStartedRef.current) {
                        adStartedRef.current = true;
                        startAd();
                    } else {
                        setPlaying(true);
                    }
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

    // ─── Fullscreen change listener ───
    useEffect(() => {
        const handleFSChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener("fullscreenchange", handleFSChange);
        return () => document.removeEventListener("fullscreenchange", handleFSChange);
    }, []);

    // ─── Controls Visibility ───
    const showControls = useCallback(() => {
        setIsControlsVisible(true);
        if (controlTimeoutRef.current) clearTimeout(controlTimeoutRef.current);
        controlTimeoutRef.current = setTimeout(() => {
            if (!showSettings && playing && !isAdPlaying) setIsControlsVisible(false);
        }, 3000);
    }, [showSettings, playing, isAdPlaying]);

    // ─── Skip Flash ───
    const triggerSkipFlash = useCallback((direction: 'left' | 'right') => {
        if (skipFlashTimeoutRef.current) clearTimeout(skipFlashTimeoutRef.current);
        setSkipFlash(direction);
        skipFlashTimeoutRef.current = setTimeout(() => setSkipFlash(null), 600);
    }, []);

    // ─── Keyboard Controls ───
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Block all controls during ads
            if (isAdPlaying) {
                e.preventDefault();
                return;
            }

            showControls();

            if (e.key === "ArrowRight") {
                e.preventDefault();
                if (videoRef.current) {
                    const vid = videoRef.current;
                    vid.currentTime = Math.min(vid.currentTime + 10, vid.duration || Infinity);
                    triggerSkipFlash('right');
                }
            }
            if (e.key === "ArrowLeft") {
                e.preventDefault();
                if (videoRef.current) {
                    videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0);
                    triggerSkipFlash('left');
                }
            }
            if (e.key === " ") {
                e.preventDefault();
                togglePlay();
            }
            if (e.key === "f" || e.key === "F") {
                e.preventDefault();
                if (!document.fullscreenElement) {
                    containerRef.current?.requestFullscreen();
                } else {
                    document.exitFullscreen();
                }
            }
            if (e.key === "m" || e.key === "M") {
                e.preventDefault();
                toggleMute();
            }
            if (e.key === "Escape") closePlayer();
        };

        const handleMouseMove = () => showControls();

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("keydown", handleKeyDown);
            if (controlTimeoutRef.current) clearTimeout(controlTimeoutRef.current);
        };
    }, [playing, showSettings, isAdPlaying, showControls, triggerSkipFlash, closePlayer]);

    // ─── Sync main video play/pause with state ───
    useEffect(() => {
        if (!videoRef.current || isAdPlaying) return;

        if (playing) {
            if (videoRef.current.paused) {
                videoRef.current.play().catch(e => {
                    if (e.name !== "AbortError") console.error("Sync play failed:", e);
                    setPlaying(false);
                });
            }
        } else {
            if (!videoRef.current.paused) {
                videoRef.current.pause();
            }
        }
    }, [playing, isAdPlaying]);

    // ─── Video Events ───
    const handleTimeUpdate = () => {
        if (videoRef.current && !isAdPlaying) {
            const time = videoRef.current.currentTime;
            setCurrentTime(time);
            lastTimeRef.current = time;
            setDuration(videoRef.current.duration || 0);

            // Check for mid-roll ad cue points
            if (preRollDone && adCuePoints.length > 0) {
                for (const cue of adCuePoints) {
                    if (!consumedCuePoints.has(cue) && time >= cue && time < cue + 2) {
                        // Trigger mid-roll
                        setConsumedCuePoints(prev => new Set([...prev, cue]));
                        setSavedVideoTime(time);
                        videoRef.current.pause();
                        startAd();
                        break;
                    }
                }
            }
        }
    };

    // When duration is first known, calculate ad cue points
    useEffect(() => {
        if (duration > 0 && adCuePoints.length === 0 && preRollDone) {
            const cues = getAdSchedule(duration);
            setAdCuePoints(cues);
        }
    }, [duration, preRollDone]);

    const handlePlayPause = () => {
        const isPaused = videoRef.current?.paused ?? true;
        setPlaying(!isPaused);
        setShowPauseIndicator(isPaused);
    };

    // ─── Ad System ───
    const startAd = useCallback(async () => {
        setIsLoading(true); // Show loading while fetching VAST
        const adUrl = await fetchVastAdUrl();
        setIsLoading(false);

        if (!adUrl) {
            console.log("No VAST ad available, skipping.");
            // If no ad, ensure main video starts
            if (!preRollDone) setPreRollDone(true);
            setPlaying(true);
            return;
        }

        setIsAdPlaying(true);
        setAdCurrentTime(0);
        setAdDuration(0);
        setIsControlsVisible(false);

        // Save current video time
        if (videoRef.current) {
            setSavedVideoTime(videoRef.current.currentTime);
            videoRef.current.pause();
        }

        // Load ad video
        if (adVideoRef.current) {
            adVideoRef.current.src = adUrl;
            adVideoRef.current.load();
            adVideoRef.current.play().catch(e => {
                console.error("Ad play failed:", e);
                handleAdEnded(); // Skip the ad if it fails
            });
        }
    }, [preRollDone]);

    const handleAdTimeUpdate = () => {
        if (adVideoRef.current) {
            setAdCurrentTime(adVideoRef.current.currentTime);
            setAdDuration(adVideoRef.current.duration || 0);
        }
    };

    const handleAdEnded = useCallback(() => {
        setIsAdPlaying(false);
        setAdCurrentTime(0);
        setAdDuration(0);

        if (!preRollDone) {
            setPreRollDone(true);
            // Start main video from beginning
            if (videoRef.current) {
                videoRef.current.currentTime = 0;
            }
            setPlaying(true);
        } else {
            // Resume from saved position (mid-roll)
            if (videoRef.current) {
                videoRef.current.currentTime = savedVideoTime;
            }
            setPlaying(true);
        }

        showControls();
    }, [preRollDone, savedVideoTime, showControls]);

    // ─── Actions ───
    const togglePlay = useCallback(() => {
        if (isAdPlaying) return;
        if (videoRef.current?.paused) {
            // User requested: "when clicked play or resume, ad wil play"
            // We trigger an ad on every resume/play if pre-roll is done.
            // (Pre-roll is handled by the initial load useEffect)
            if (preRollDone) {
                startAd().catch(e => console.error("Resume ad failed:", e));
            } else {
                setPlaying(true);
            }
        } else {
            setPlaying(false);
            if (videoRef.current && playerItemId && mediaSourceId) {
                jellyfin.onPlaybackProgress(playerItemId, mediaSourceId, videoRef.current.currentTime * 10000000);
            }
        }
    }, [isAdPlaying, playerItemId, mediaSourceId, preRollDone, startAd]);

    const seekWithFlash = useCallback((seconds: number) => {
        if (isAdPlaying) return;
        if (videoRef.current) {
            videoRef.current.currentTime = Math.min(Math.max(videoRef.current.currentTime + seconds, 0), videoRef.current.duration || Infinity);
            triggerSkipFlash(seconds > 0 ? 'right' : 'left');
        }
    }, [isAdPlaying, triggerSkipFlash]);

    const seekTo = useCallback((time: number) => {
        if (isAdPlaying) return;
        if (videoRef.current) {
            videoRef.current.currentTime = time;
        }
    }, [isAdPlaying]);

    const toggleMute = useCallback(() => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    }, [isMuted]);

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
        setCurrentAudio(index);
    };

    const changeSubtitle = (index: number) => {
        setCurrentSubtitle(index);
    };

    const handleNextEpisode = () => {
        if (nextEpisodeId && nextEpisodeTitle) {
            openPlayer(nextEpisodeId, nextEpisodeTitle);
        }
    };

    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }, []);

    // Helper format
    const formatTime = (time: number) => {
        if (!isFinite(time) || isNaN(time)) return "0:00";
        const h = Math.floor(time / 3600);
        const m = Math.floor((time % 3600) / 60);
        const s = Math.floor(time % 60);
        if (h > 0) return `${h}:${m < 10 ? "0" + m : m}:${s < 10 ? "0" + s : s}`;
        return `${m}:${s < 10 ? "0" + s : s}`;
    };

    const volumePercent = isMuted ? 0 : Math.round(volume * 100);

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
            {isGlobal ? (
                <div className="relative w-full h-full">
                    <iframe
                        src={embedUrl!}
                        className="w-full h-full border-0"
                        allowFullScreen
                        sandbox="allow-forms allow-scripts allow-same-origin"
                        loading="lazy"
                    />
                    {/* Transparent overlay to intercept some clicks/popups */}
                    <div className="absolute inset-0 pointer-events-none z-10" style={{ background: "transparent" }} />
                    
                    {/* Close button for global player since controls are in iframe */}
                    {!isControlsVisible && (
                        <button
                            onClick={closePlayer}
                            className="absolute top-6 left-6 p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md transition-all z-20"
                        >
                            <BackIcon />
                        </button>
                    )}
                </div>
            ) : (
                <>
                    {/* Main Video */}
                    <video
                        ref={videoRef}
                        className="w-full h-full object-contain"
                        onTimeUpdate={handleTimeUpdate}
                        onPlay={handlePlayPause}
                        onPause={handlePlayPause}
                        onClick={(e) => { e.stopPropagation(); if (!isAdPlaying) togglePlay(); }}
                        style={{ display: isAdPlaying ? 'none' : 'block' }}
                    />

                    {/* Ad Video (overlay) */}
                    <video
                        ref={adVideoRef}
                        className="w-full h-full object-contain absolute inset-0"
                        onTimeUpdate={handleAdTimeUpdate}
                        onEnded={handleAdEnded}
                        style={{ display: isAdPlaying ? 'block' : 'none' }}
                    />
                </>
            )}

            {/* Loading Spinner */}
            {isLoading && !isAdPlaying && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {/* ─── Skip Flash Effect ─── */}
            <AnimatePresence>
                {skipFlash === 'left' && (
                    <motion.div
                        key="flash-left"
                        initial={{ opacity: 0.9 }}
                        animate={{ opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="absolute inset-y-0 left-0 w-[30%] pointer-events-none z-[101]"
                        style={{
                            background: "linear-gradient(to right, rgba(13, 214, 232, 0.35), rgba(13, 214, 232, 0.08), transparent)"
                        }}
                    >
                        <div className="absolute inset-0 flex items-center justify-center">
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0.8 }}
                                animate={{ scale: 1.5, opacity: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <Replay10Icon />
                            </motion.div>
                        </div>
                    </motion.div>
                )}
                {skipFlash === 'right' && (
                    <motion.div
                        key="flash-right"
                        initial={{ opacity: 0.9 }}
                        animate={{ opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="absolute inset-y-0 right-0 w-[30%] pointer-events-none z-[101]"
                        style={{
                            background: "linear-gradient(to left, rgba(13, 214, 232, 0.35), rgba(13, 214, 232, 0.08), transparent)"
                        }}
                    >
                        <div className="absolute inset-0 flex items-center justify-center">
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0.8 }}
                                animate={{ scale: 1.5, opacity: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <Forward10Icon />
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Disney+ Style Pause Indicator ─── */}
            <AnimatePresence>
                {showPauseIndicator && !isLoading && !isAdPlaying && (
                    <motion.div
                        key="pause-indicator"
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.2, opacity: 0 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none z-[102]"
                    >
                        {/* Outer glow ring */}
                        <motion.div
                            className="absolute w-28 h-28 rounded-full"
                            style={{
                                background: "radial-gradient(circle, rgba(13, 214, 232, 0.15) 0%, transparent 70%)",
                            }}
                            animate={{
                                scale: [1, 1.3, 1],
                                opacity: [0.5, 0.2, 0.5],
                            }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        />
                        {/* Glass button */}
                        <div
                            className="w-20 h-20 rounded-full flex items-center justify-center cursor-pointer pointer-events-auto"
                            style={{
                                background: "rgba(255, 255, 255, 0.08)",
                                backdropFilter: "blur(20px)",
                                WebkitBackdropFilter: "blur(20px)",
                                border: "1px solid rgba(255, 255, 255, 0.12)",
                                boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 40px rgba(13, 214, 232, 0.1)"
                            }}
                            onClick={togglePlay}
                        >
                            <PlayIcon size={36} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Ad UI ─── */}
            {isAdPlaying && (
                <div className="absolute inset-0 z-[105] flex flex-col justify-end pointer-events-none">
                    {/* Ad badge */}
                    <div className="absolute top-8 left-8 pointer-events-none group">
                        <div
                            className="px-5 py-2 rounded-xl text-xs font-black tracking-[0.15em] flex items-center gap-3 transition-all duration-500"
                            style={{
                                background: "rgba(13, 214, 232, 0.12)",
                                backdropFilter: "blur(24px) saturate(180%)",
                                WebkitBackdropFilter: "blur(24px) saturate(180%)",
                                border: "1px solid rgba(255, 255, 255, 0.15)",
                                boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.05)",
                                color: "#fff",
                                textShadow: "0 0 20px rgba(13, 214, 232, 0.5)"
                            }}
                        >
                            <span className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(13,214,232,0.8)]" />
                                AD
                            </span>
                            <span className="w-px h-3 bg-white/20" />
                            <span className="font-mono text-[13px] opacity-90 tabular-nums">
                                {formatTime(Math.max(0, adDuration - adCurrentTime))}
                            </span>
                        </div>
                    </div>

                    {/* Ad progress bar */}
                    <div className="w-full px-0 pb-0">
                        <div className="w-full h-1.5 bg-white/5 backdrop-blur-md">
                            <motion.div
                                className="h-full shadow-[0_0_15px_rgba(13,214,232,0.6)]"
                                style={{
                                    width: adDuration > 0 ? `${(adCurrentTime / adDuration) * 100}%` : '0%',
                                    background: "linear-gradient(90deg, #0DD6E8, #04C7F4, #00B4D8)",
                                }}
                                transition={{ duration: 0.1 }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Controls Overlay ─── */}
            <AnimatePresence>
                {isControlsVisible && !isAdPlaying && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 flex flex-col justify-between"
                        style={{
                            background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 20%, transparent 75%, rgba(0,0,0,0.85) 100%)"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Top Bar */}
                        <div className="flex items-start justify-between p-6 sm:p-10">
                            <button
                                onClick={closePlayer}
                                className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all group"
                            >
                                <BackIcon />
                            </button>
                            <div className="text-center flex-1 mx-4">
                                <h2 className="text-white/90 font-bold text-lg sm:text-2xl drop-shadow-md truncate">{playerTitle}</h2>
                            </div>
                            <div className="w-12" />
                        </div>

                        {/* Center Play/Pause (click area — but smaller, more subtle) */}
                        <div className="flex-1" onClick={togglePlay} />

                        {/* Bottom Controls */}
                        <div className="flex flex-col gap-3 px-6 sm:px-10 pb-6 sm:pb-10">
                            {/* Progress Bar */}
                            <div
                                className="group relative h-1 bg-white/20 rounded-full cursor-pointer hover:h-2 transition-all"
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const pct = (e.clientX - rect.left) / rect.width;
                                    seekTo(pct * duration);
                                }}
                            >
                                {/* Buffered / filled */}
                                <div
                                    className="absolute top-0 left-0 h-full bg-cyan-400 rounded-full"
                                    style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
                                >
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full scale-0 group-hover:scale-100 transition-transform shadow-lg ring-2 ring-cyan-400/50" />
                                </div>
                            </div>

                            {/* Controls Row */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 sm:gap-5">
                                    {/* Play/Pause */}
                                    <button onClick={togglePlay} className="text-white hover:text-cyan-400 transition-colors p-1">
                                        {playing ? <PauseIcon size={28} /> : <PlayIcon size={28} />}
                                    </button>

                                    {/* Seek Backward */}
                                    <button
                                        onClick={() => seekWithFlash(-10)}
                                        className="text-white/80 hover:text-white transition-all hover:scale-110 p-1"
                                    >
                                        <Replay10Icon />
                                    </button>

                                    {/* Seek Forward */}
                                    <button
                                        onClick={() => seekWithFlash(10)}
                                        className="text-white/80 hover:text-white transition-all hover:scale-110 p-1"
                                    >
                                        <Forward10Icon />
                                    </button>

                                    {/* Volume */}
                                    <div className="flex items-center gap-2 group/vol">
                                        <button onClick={toggleMute} className="text-white hover:text-cyan-400 transition-colors p-1">
                                            {isMuted || volume === 0 ? (
                                                <VolumeMutedIcon />
                                            ) : volume < 0.5 ? (
                                                <VolumeLowIcon />
                                            ) : (
                                                <VolumeHighIcon />
                                            )}
                                        </button>
                                        <div className="flex items-center gap-2 w-0 overflow-hidden group-hover/vol:w-28 transition-all duration-300">
                                            <div className="relative w-24 h-6 flex items-center">
                                                <div className="absolute w-full h-1 bg-white/15 rounded-full" />
                                                <div
                                                    className="absolute h-1 rounded-full"
                                                    style={{
                                                        width: `${volumePercent}%`,
                                                        background: "linear-gradient(90deg, #0DD6E8, #04C7F4)"
                                                    }}
                                                />
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="1"
                                                    step="0.02"
                                                    value={isMuted ? 0 : volume}
                                                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                                                    className="volume-slider absolute w-full h-6 opacity-0 cursor-pointer"
                                                />
                                                <div
                                                    className="absolute w-3 h-3 bg-white rounded-full shadow-md pointer-events-none ring-2 ring-cyan-400/30"
                                                    style={{ left: `calc(${volumePercent}% - 6px)` }}
                                                />
                                            </div>
                                            <span className="text-[11px] font-medium text-white/50 min-w-[24px] tabular-nums">{volumePercent}</span>
                                        </div>
                                    </div>

                                    {/* Time */}
                                    <div className="text-xs sm:text-sm font-medium text-white/60 tabular-nums">
                                        {formatTime(currentTime)} / {formatTime(duration)}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Next Episode */}
                                    {nextEpisodeId && (
                                        <button
                                            onClick={handleNextEpisode}
                                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-cyan-500/20 hover:text-cyan-400 transition-all text-sm font-bold border border-white/10"
                                        >
                                            Next Episode
                                            <NextIcon />
                                        </button>
                                    )}

                                    {/* Settings */}
                                    <div className="relative">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
                                            className={`p-2 rounded-full transition-all ${showSettings ? 'text-cyan-400 bg-white/10 rotate-45' : 'text-white hover:text-cyan-400 rotate-0'}`}
                                            style={{ transition: 'all 0.3s ease' }}
                                        >
                                            <SettingsIcon />
                                        </button>

                                        {/* Settings Menu */}
                                        <AnimatePresence>
                                            {showSettings && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="absolute bottom-12 right-0 w-72 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 text-sm"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div className="flex border-b border-white/10">
                                                        {(["quality", "audio", "subtitles"] as const).map(tab => (
                                                            <button
                                                                key={tab}
                                                                onClick={() => setActiveTab(tab)}
                                                                className={`flex-1 py-3 font-semibold transition-colors ${activeTab === tab ? "text-cyan-400 bg-white/5" : "text-white/60 hover:text-white"}`}
                                                            >
                                                                {tab === "quality" ? "Quality" : tab === "audio" ? "Audio" : "Subs"}
                                                            </button>
                                                        ))}
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

                                    {/* Fullscreen */}
                                    <button onClick={toggleFullscreen} className="text-white hover:text-cyan-400 transition-colors p-1">
                                        {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
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
