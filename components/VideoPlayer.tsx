'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Hls from 'hls.js';
import { getStreamUrl, getHlsStreamUrl, getSubtitleUrl, formatDuration, MediaStream as JFMediaStream } from '@/lib/jellyfin';

interface VideoPlayerProps {
    itemId: string;
    title: string;
    token: string;
    subtitle?: string;
    mediaStreams?: JFMediaStream[];
    mediaSourceId?: string;
    onBack?: () => void;
}

interface QualityLevel {
    index: number;
    label: string;
    height: number;
}

type SettingsTab = 'main' | 'quality' | 'audio' | 'subtitles';

export default function VideoPlayer({ itemId, title, token, subtitle, mediaStreams, mediaSourceId, onBack }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [controlsVisible, setControlsVisible] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Settings panel state
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [settingsTab, setSettingsTab] = useState<SettingsTab>('main');

    // Track states
    const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([]);
    const [currentQuality, setCurrentQuality] = useState(-1); // -1 = auto
    const [audioTracks, setAudioTracks] = useState<JFMediaStream[]>([]);
    const [selectedAudioIndex, setSelectedAudioIndex] = useState<number | undefined>(undefined);
    const [subtitleTracks, setSubtitleTracks] = useState<JFMediaStream[]>([]);
    const [selectedSubtitleIndex, setSelectedSubtitleIndex] = useState<number | undefined>(undefined);

    // Hover preview
    const [hoverProgress, setHoverProgress] = useState<number | null>(null);

    // Parse media streams on mount
    useEffect(() => {
        if (mediaStreams) {
            setAudioTracks(mediaStreams.filter(s => s.Type === 'Audio'));
            setSubtitleTracks(mediaStreams.filter(s => s.Type === 'Subtitle'));
            const defaultAudio = mediaStreams.find(s => s.Type === 'Audio' && s.IsDefault);
            if (defaultAudio) setSelectedAudioIndex(defaultAudio.Index);
        }
    }, [mediaStreams]);

    // Initialize video source
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const directUrl = getStreamUrl(itemId, token);
        const hlsUrl = getHlsStreamUrl(itemId, token, {
            audioStreamIndex: selectedAudioIndex,
        });

        if (Hls.isSupported()) {
            const hls = new Hls({
                startLevel: -1,
                maxBufferLength: 30,
                maxMaxBufferLength: 60,
            });
            hls.loadSource(hlsUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
                setIsLoading(false);
                // Extract quality levels
                const levels: QualityLevel[] = data.levels.map((level, i) => ({
                    index: i,
                    label: `${level.height}p`,
                    height: level.height,
                }));
                // Sort descending by height, remove duplicates
                const unique = levels.filter((l, i, arr) =>
                    arr.findIndex(x => x.height === l.height) === i
                ).sort((a, b) => b.height - a.height);
                setQualityLevels(unique);
                video.play().catch(() => { });
            });
            hls.on(Hls.Events.ERROR, (_, data) => {
                if (data.fatal) {
                    hls.destroy();
                    video.src = directUrl;
                    video.load();
                    setIsLoading(false);
                }
            });
            hlsRef.current = hls;
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = hlsUrl;
            video.addEventListener('loadedmetadata', () => {
                setIsLoading(false);
                video.play().catch(() => { });
            });
        } else {
            video.src = directUrl;
            video.load();
            setIsLoading(false);
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itemId, token, selectedAudioIndex]);

    // Load subtitles as <track> elements
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Remove existing tracks
        const existing = video.querySelectorAll('track');
        existing.forEach(t => t.remove());

        if (selectedSubtitleIndex !== undefined && mediaSourceId) {
            const track = document.createElement('track');
            track.kind = 'subtitles';
            track.src = getSubtitleUrl(itemId, mediaSourceId || itemId, selectedSubtitleIndex, token);
            track.default = true;
            track.label = subtitleTracks.find(s => s.Index === selectedSubtitleIndex)?.DisplayTitle || 'Subtitle';
            video.appendChild(track);
            // Enable the track
            setTimeout(() => {
                if (video.textTracks.length > 0) {
                    video.textTracks[0].mode = 'showing';
                }
            }, 100);
        }
    }, [selectedSubtitleIndex, itemId, token, mediaSourceId, subtitleTracks]);

    // Video event listeners
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const onTimeUpdate = () => setCurrentTime(video.currentTime);
        const onDurationChange = () => setDuration(video.duration);
        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onWaiting = () => setIsLoading(true);
        const onCanPlay = () => setIsLoading(false);

        video.addEventListener('timeupdate', onTimeUpdate);
        video.addEventListener('durationchange', onDurationChange);
        video.addEventListener('play', onPlay);
        video.addEventListener('pause', onPause);
        video.addEventListener('waiting', onWaiting);
        video.addEventListener('canplay', onCanPlay);

        return () => {
            video.removeEventListener('timeupdate', onTimeUpdate);
            video.removeEventListener('durationchange', onDurationChange);
            video.removeEventListener('play', onPlay);
            video.removeEventListener('pause', onPause);
            video.removeEventListener('waiting', onWaiting);
            video.removeEventListener('canplay', onCanPlay);
        };
    }, []);

    // Auto-hide controls
    const showControls = useCallback(() => {
        setControlsVisible(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => {
            if (isPlaying) {
                setControlsVisible(false);
                setSettingsOpen(false);
            }
        }, 3000);
    }, [isPlaying]);

    useEffect(() => {
        showControls();
    }, [isPlaying, showControls]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const video = videoRef.current;
            if (!video) return;

            switch (e.key) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    video.paused ? video.play() : video.pause();
                    showControls();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    video.currentTime = Math.max(0, video.currentTime - 10);
                    showControls();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    video.currentTime = Math.min(video.duration, video.currentTime + 10);
                    showControls();
                    break;
                case 'f':
                    e.preventDefault();
                    toggleFullscreen();
                    break;
                case 'm':
                    e.preventDefault();
                    toggleMute();
                    showControls();
                    break;
                case 'Escape':
                    if (settingsOpen) {
                        setSettingsOpen(false);
                    } else if (onBack) {
                        onBack();
                    } else {
                        router.back();
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showControls, router, onBack, settingsOpen]);

    const togglePlay = () => {
        const video = videoRef.current;
        if (!video) return;
        video.paused ? video.play() : video.pause();
    };

    const toggleMute = () => {
        const video = videoRef.current;
        if (!video) return;
        video.muted = !video.muted;
        setIsMuted(video.muted);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const video = videoRef.current;
        if (!video) return;
        const val = parseFloat(e.target.value);
        video.volume = val;
        setVolume(val);
        if (val === 0) {
            video.muted = true;
            setIsMuted(true);
        } else if (video.muted) {
            video.muted = false;
            setIsMuted(false);
        }
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        const video = videoRef.current;
        if (!video || !duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        video.currentTime = percent * duration;
    };

    const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        setHoverProgress(Math.max(0, Math.min(1, percent)));
    };

    const toggleFullscreen = () => {
        const container = containerRef.current;
        if (!container) return;
        if (!document.fullscreenElement) {
            container.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const handleBack = () => {
        if (onBack) onBack();
        else router.back();
    };

    // Quality change
    const handleQualityChange = (levelIndex: number) => {
        if (hlsRef.current) {
            hlsRef.current.currentLevel = levelIndex;
            setCurrentQuality(levelIndex);
        }
        setSettingsOpen(false);
        setSettingsTab('main');
    };

    // Audio track change
    const handleAudioChange = (streamIndex: number) => {
        setSelectedAudioIndex(streamIndex);
        setSettingsOpen(false);
        setSettingsTab('main');
    };

    // Subtitle change
    const handleSubtitleChange = (streamIndex: number | undefined) => {
        setSelectedSubtitleIndex(streamIndex);
        if (streamIndex === undefined) {
            // Turn off subtitles
            const video = videoRef.current;
            if (video && video.textTracks.length > 0) {
                video.textTracks[0].mode = 'hidden';
            }
        }
        setSettingsOpen(false);
        setSettingsTab('main');
    };

    const toggleSettings = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSettingsOpen(!settingsOpen);
        setSettingsTab('main');
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    const getQualityLabel = () => {
        if (currentQuality === -1) return 'Auto';
        const level = qualityLevels.find(l => l.index === currentQuality);
        return level ? level.label : 'Auto';
    };

    return (
        <div className="player-page" ref={containerRef}>
            <div
                className="player-video-container"
                onMouseMove={showControls}
                onClick={togglePlay}
                style={{ cursor: controlsVisible ? 'default' : 'none' }}
            >
                <video ref={videoRef} playsInline crossOrigin="anonymous" />

                {isLoading && (
                    <div className="player-loading">
                        <div className="player-spinner">
                            <svg viewBox="0 0 50 50">
                                <circle cx="25" cy="25" r="20" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeDasharray="90, 150" strokeDashoffset="0">
                                    <animateTransform attributeName="transform" type="rotate" dur="1s" repeatCount="indefinite" values="0 25 25;360 25 25" />
                                </circle>
                            </svg>
                        </div>
                    </div>
                )}

                {/* Top bar */}
                <div className={`player-top-bar ${controlsVisible ? 'visible' : ''}`}>
                    <button className="player-back-btn" onClick={(e) => { e.stopPropagation(); handleBack(); }}>
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="player-title-group">
                        <div className="player-title">{title}</div>
                        {subtitle && <div className="player-subtitle">{subtitle}</div>}
                    </div>
                </div>

                {/* Bottom controls */}
                <div
                    className={`player-controls ${controlsVisible ? 'visible' : ''}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Progress Bar */}
                    <div
                        className="progress-bar-container"
                        ref={progressRef}
                        onClick={handleSeek}
                        onMouseMove={handleProgressHover}
                        onMouseLeave={() => setHoverProgress(null)}
                    >
                        {hoverProgress !== null && (
                            <div className="progress-hover-time" style={{ left: `${hoverProgress * 100}%` }}>
                                {formatDuration(hoverProgress * duration)}
                            </div>
                        )}
                        <div className="progress-bar-bg">
                            {hoverProgress !== null && (
                                <div className="progress-bar-hover" style={{ width: `${hoverProgress * 100}%` }}></div>
                            )}
                            <div className="progress-bar-fill" style={{ width: `${progress}%` }}>
                                <div className="progress-bar-thumb"></div>
                            </div>
                        </div>
                    </div>

                    <div className="player-buttons">
                        <div className="player-buttons-left">
                            <button className="player-btn" onClick={togglePlay}>
                                <span className="material-symbols-outlined" style={{ fontSize: '2rem' }}>
                                    {isPlaying ? 'pause' : 'play_arrow'}
                                </span>
                            </button>
                            <button className="player-btn" onClick={() => { const v = videoRef.current; if (v) v.currentTime = Math.max(0, v.currentTime - 10); }}>
                                <span className="material-symbols-outlined">replay_10</span>
                            </button>
                            <button className="player-btn" onClick={() => { const v = videoRef.current; if (v) v.currentTime += 10; }}>
                                <span className="material-symbols-outlined">forward_10</span>
                            </button>

                            <div className="player-volume-group">
                                <button className="player-btn" onClick={toggleMute}>
                                    <span className="material-symbols-outlined">
                                        {isMuted || volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'}
                                    </span>
                                </button>
                                <div className="volume-slider-container">
                                    <input
                                        type="range"
                                        className="volume-slider"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={isMuted ? 0 : volume}
                                        onChange={handleVolumeChange}
                                    />
                                </div>
                            </div>

                            <span className="player-time">
                                {formatDuration(currentTime)} / {formatDuration(duration)}
                            </span>
                        </div>

                        <div className="player-buttons-right">
                            {/* Subtitles quick toggle */}
                            {subtitleTracks.length > 0 && (
                                <button
                                    className={`player-btn ${selectedSubtitleIndex !== undefined ? 'active' : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSettingsOpen(true);
                                        setSettingsTab('subtitles');
                                    }}
                                    title="Subtitles"
                                >
                                    <span className="material-symbols-outlined">subtitles</span>
                                </button>
                            )}

                            {/* Settings gear */}
                            <button
                                className={`player-btn ${settingsOpen ? 'active' : ''}`}
                                onClick={toggleSettings}
                                title="Settings"
                            >
                                <span className="material-symbols-outlined">settings</span>
                            </button>

                            <button className="player-btn" onClick={toggleFullscreen}>
                                <span className="material-symbols-outlined">
                                    {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Settings Panel */}
                {settingsOpen && (
                    <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
                        {settingsTab === 'main' && (
                            <div className="settings-menu">
                                {qualityLevels.length > 0 && (
                                    <button className="settings-row" onClick={() => setSettingsTab('quality')}>
                                        <span className="material-symbols-outlined settings-row-icon">tune</span>
                                        <span className="settings-row-label">Quality</span>
                                        <span className="settings-row-value">{getQualityLabel()}</span>
                                        <span className="material-symbols-outlined settings-row-arrow">chevron_right</span>
                                    </button>
                                )}
                                {audioTracks.length > 1 && (
                                    <button className="settings-row" onClick={() => setSettingsTab('audio')}>
                                        <span className="material-symbols-outlined settings-row-icon">volume_up</span>
                                        <span className="settings-row-label">Audio</span>
                                        <span className="settings-row-value">
                                            {audioTracks.find(t => t.Index === selectedAudioIndex)?.DisplayTitle || 'Default'}
                                        </span>
                                        <span className="material-symbols-outlined settings-row-arrow">chevron_right</span>
                                    </button>
                                )}
                                {subtitleTracks.length > 0 && (
                                    <button className="settings-row" onClick={() => setSettingsTab('subtitles')}>
                                        <span className="material-symbols-outlined settings-row-icon">subtitles</span>
                                        <span className="settings-row-label">Subtitles</span>
                                        <span className="settings-row-value">
                                            {selectedSubtitleIndex !== undefined
                                                ? subtitleTracks.find(t => t.Index === selectedSubtitleIndex)?.DisplayTitle || 'On'
                                                : 'Off'}
                                        </span>
                                        <span className="material-symbols-outlined settings-row-arrow">chevron_right</span>
                                    </button>
                                )}
                            </div>
                        )}

                        {settingsTab === 'quality' && (
                            <div className="settings-submenu">
                                <button className="settings-back" onClick={() => setSettingsTab('main')}>
                                    <span className="material-symbols-outlined">chevron_left</span>
                                    Quality
                                </button>
                                <div className="settings-options">
                                    <button
                                        className={`settings-option ${currentQuality === -1 ? 'active' : ''}`}
                                        onClick={() => handleQualityChange(-1)}
                                    >
                                        <span className="settings-option-label">Auto</span>
                                        {currentQuality === -1 && <span className="material-symbols-outlined settings-check">check</span>}
                                    </button>
                                    {qualityLevels.map(level => (
                                        <button
                                            key={level.index}
                                            className={`settings-option ${currentQuality === level.index ? 'active' : ''}`}
                                            onClick={() => handleQualityChange(level.index)}
                                        >
                                            <span className="settings-option-label">{level.label}</span>
                                            {currentQuality === level.index && <span className="material-symbols-outlined settings-check">check</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {settingsTab === 'audio' && (
                            <div className="settings-submenu">
                                <button className="settings-back" onClick={() => setSettingsTab('main')}>
                                    <span className="material-symbols-outlined">chevron_left</span>
                                    Audio
                                </button>
                                <div className="settings-options">
                                    {audioTracks.map(track => (
                                        <button
                                            key={track.Index}
                                            className={`settings-option ${selectedAudioIndex === track.Index ? 'active' : ''}`}
                                            onClick={() => handleAudioChange(track.Index)}
                                        >
                                            <span className="settings-option-label">
                                                {track.DisplayTitle || track.Language || `Track ${track.Index}`}
                                            </span>
                                            {selectedAudioIndex === track.Index && <span className="material-symbols-outlined settings-check">check</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {settingsTab === 'subtitles' && (
                            <div className="settings-submenu">
                                <button className="settings-back" onClick={() => setSettingsTab('main')}>
                                    <span className="material-symbols-outlined">chevron_left</span>
                                    Subtitles
                                </button>
                                <div className="settings-options">
                                    <button
                                        className={`settings-option ${selectedSubtitleIndex === undefined ? 'active' : ''}`}
                                        onClick={() => handleSubtitleChange(undefined)}
                                    >
                                        <span className="settings-option-label">Off</span>
                                        {selectedSubtitleIndex === undefined && <span className="material-symbols-outlined settings-check">check</span>}
                                    </button>
                                    {subtitleTracks.map(track => (
                                        <button
                                            key={track.Index}
                                            className={`settings-option ${selectedSubtitleIndex === track.Index ? 'active' : ''}`}
                                            onClick={() => handleSubtitleChange(track.Index)}
                                        >
                                            <span className="settings-option-label">
                                                {track.DisplayTitle || track.Language || `Subtitle ${track.Index}`}
                                            </span>
                                            {selectedSubtitleIndex === track.Index && <span className="material-symbols-outlined settings-check">check</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
