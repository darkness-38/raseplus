"use client";

import { useEffect, useState, use } from "react";
import { jellyfin, JellyfinItem } from "@/lib/jellyfin";
import { useStore } from "@/store/useStore";
import { motion, AnimatePresence } from "framer-motion";

interface PageProps {
    params: Promise<{ id: string }>;
}

function formatRuntime(ticks?: number): string {
    if (!ticks) return "";
    const minutes = Math.round(ticks / 600000000);
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function ItemDetailPage({ params }: PageProps) {
    const { id } = use(params);
    const isReady = useStore((s) => s.isJellyfinReady);
    const { openPlayer, setNextEpisode } = useStore();

    const [item, setItem] = useState<JellyfinItem | null>(null);
    const [seasons, setSeasons] = useState<JellyfinItem[]>([]);
    const [episodes, setEpisodes] = useState<JellyfinItem[]>([]);
    const [selectedSeason, setSelectedSeason] = useState<string>("");
    const [similar, setSimilar] = useState<JellyfinItem[]>([]);
    const [nextUp, setNextUp] = useState<JellyfinItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    const isSeries = item?.Type === "Series";
    const isMovie = item?.Type === "Movie";

    useEffect(() => {
        if (!isReady || !id) return;
        const fetchItem = async () => {
            try {
                const data = await jellyfin.getItem(id);
                setItem(data);

                if (data.Type === "Series") {
                    const [s, nu] = await Promise.all([
                        jellyfin.getSeasons(id),
                        jellyfin.getNextUp(id),
                    ]);
                    setSeasons(s);
                    setNextUp(nu);
                    if (s.length > 0) {
                        setSelectedSeason(s[0].Id);
                    }
                }

                const sim = await jellyfin.getSimilarItems(id, 12);
                setSimilar(sim);
            } catch (e) {
                console.error("Failed to fetch item:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchItem();
    }, [isReady, id]);

    useEffect(() => {
        if (!selectedSeason || !item || item.Type !== "Series") return;
        const fetchEpisodes = async () => {
            const eps = await jellyfin.getEpisodes(item.Id, selectedSeason);
            setEpisodes(eps);
        };
        fetchEpisodes();
    }, [selectedSeason, item]);

    const handlePlayEpisode = (episode: JellyfinItem, index: number) => {
        openPlayer(episode.Id, `${item?.Name} - ${episode.Name}`);
        const nextEp = episodes[index + 1];
        if (nextEp) {
            setNextEpisode(nextEp.Id, `${item?.Name} - ${nextEp.Name}`);
        } else {
            setNextEpisode(null, null);
        }
    };

    if (loading || !item) {
        return (
            <div className="min-h-screen">
                <div className="w-full h-[50vh] sm:h-[65vh] lg:h-[70vh] skeleton" />
                <div className="px-4 sm:px-6 lg:px-16 -mt-32 sm:-mt-40 relative z-10">
                    <div className="h-10 sm:h-12 w-64 sm:w-96 skeleton rounded-xl mb-4" />
                    <div className="h-4 w-48 sm:w-64 skeleton rounded-lg mb-8" />
                    <div className="h-16 sm:h-20 w-full max-w-2xl skeleton rounded-xl" />
                </div>
            </div>
        );
    }

    const backdropUrl =
        item.BackdropImageTags?.length
            ? jellyfin.getImageUrl(item.Id, "Backdrop", { maxWidth: 1920, quality: 90 })
            : item.ParentBackdropItemId && item.ParentBackdropImageTags?.length
                ? jellyfin.getImageUrl(item.ParentBackdropItemId, "Backdrop", { maxWidth: 1920, quality: 90 })
                : jellyfin.getImageUrl(item.Id, "Primary", { maxWidth: 1920 });

    const logoUrl = item.ImageTags?.Logo
        ? jellyfin.getImageUrl(item.Id, "Logo", { maxWidth: 500 })
        : null;

    const cast = item.People?.filter((p) => p.Type === "Actor")?.slice(0, 10) ?? [];

    return (
        <div className="min-h-screen pb-20">
            {/* Backdrop */}
            <div className="relative w-full h-[50vh] sm:h-[65vh] lg:h-[80vh]">
                {!imageError ? (
                    <motion.img
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        src={backdropUrl}
                        alt={item.Name}
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="w-full h-full" style={{ backgroundColor: "#000d2e" }} />
                )}
                <div className="absolute inset-0 backdrop-gradient" />
                <div className="absolute inset-0 hero-gradient-left" />
            </div>

            {/* Content */}
            <div className="relative z-10 -mt-48 sm:-mt-64 lg:-mt-80 px-4 sm:px-6 lg:px-16 max-w-7xl">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Logo or Title */}
                    {logoUrl ? (
                        <img
                            src={logoUrl}
                            alt={item.Name}
                            className="h-16 sm:h-20 lg:h-32 object-contain mb-4 sm:mb-6 drop-shadow-2xl"
                        />
                    ) : (
                        <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black text-white mb-4 sm:mb-6 drop-shadow-2xl font-heading">
                            {item.Name}
                        </h1>
                    )}

                    {/* Meta Row */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6 text-xs sm:text-sm">
                        {item.ProductionYear && (
                            <span className="text-white/80 font-medium">
                                {item.ProductionYear}
                            </span>
                        )}
                        {item.OfficialRating && (
                            <span className="px-2 py-0.5 border border-white/30 rounded text-[10px] sm:text-xs font-bold text-white/80">
                                {item.OfficialRating}
                            </span>
                        )}
                        {item.CommunityRating && (
                            <span className="font-bold flex items-center gap-1" style={{ color: "#0DD6E8" }}>
                                ★ {item.CommunityRating.toFixed(1)}
                            </span>
                        )}
                        {item.RunTimeTicks && (
                            <span className="text-white/60">{formatRuntime(item.RunTimeTicks)}</span>
                        )}
                        {item.Genres?.slice(0, 3).map((g) => (
                            <span
                                key={g}
                                className="hidden sm:inline px-3 py-1 rounded-full text-xs text-white/70"
                                style={{
                                    backgroundColor: "rgba(255,255,255,0.05)",
                                    border: "1px solid rgba(255,255,255,0.06)",
                                }}
                            >
                                {g}
                            </span>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6 sm:mb-8">
                        {isMovie && (
                            <button
                                onClick={() => openPlayer(item.Id, item.Name)}
                                className="btn-primary flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-lg font-bold relative overflow-hidden"
                            >
                                {/* Progress bar on movie button */}
                                {item.UserData?.PlayedPercentage != null && item.UserData.PlayedPercentage > 0 && item.UserData.PlayedPercentage < 100 && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                                        <div
                                            className="h-full rounded-r-full"
                                            style={{
                                                width: `${item.UserData.PlayedPercentage}%`,
                                                background: "linear-gradient(90deg, #0DD6E8, #0ABDC9)",
                                            }}
                                        />
                                    </div>
                                )}
                                <svg className="w-5 sm:w-6 h-5 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                                {item.UserData?.PlayedPercentage != null && item.UserData.PlayedPercentage > 0 && item.UserData.PlayedPercentage < 100
                                    ? "Resume"
                                    : "Play"
                                }
                            </button>
                        )}
                        {isMovie && (
                            <button
                                onClick={() => {
                                    const encodedUrl = encodeURIComponent(jellyfin.getDownloadUrl(item.Id));
                                    const filename = encodeURIComponent(`${item.Name}.mp4`);
                                    window.open(`/api/download?url=${encodedUrl}&filename=${filename}`, "_blank");
                                }}
                                className="btn-secondary flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-lg font-bold relative overflow-hidden bg-white/10 hover:bg-white/20 transition-colors rounded-lg"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 9.75l-3 3m0 0l3 3m-3-3l3-3M3 13.5l6-3 6 3" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v13.5" />
                                </svg>
                                Download
                            </button>
                        )}
                        {isSeries && (
                            <button
                                onClick={() => {
                                    if (nextUp) {
                                        openPlayer(nextUp.Id, `${item.Name} - ${nextUp.Name}`);
                                    } else if (episodes.length > 0) {
                                        handlePlayEpisode(episodes[0], 0);
                                    }
                                }}
                                className="btn-primary flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-lg font-bold relative overflow-hidden"
                            >
                                {/* Progress bar on series play button */}
                                {nextUp?.UserData?.PlayedPercentage != null && nextUp.UserData.PlayedPercentage > 0 && nextUp.UserData.PlayedPercentage < 100 && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                                        <div
                                            className="h-full rounded-r-full"
                                            style={{
                                                width: `${nextUp.UserData.PlayedPercentage}%`,
                                                background: "linear-gradient(90deg, #0DD6E8, #0ABDC9)",
                                            }}
                                        />
                                    </div>
                                )}
                                <svg className="w-5 sm:w-6 h-5 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                                {nextUp
                                    ? `Resume S${nextUp.ParentIndexNumber ?? 1}:E${nextUp.IndexNumber ?? 1}`
                                    : "Play S1:E1"
                                }
                            </button>
                        )}
                    </div>

                    {/* Overview */}
                    <p className="text-sm sm:text-base lg:text-lg leading-relaxed max-w-3xl mb-8 sm:mb-10 font-body" style={{ color: "rgba(255,255,255,0.6)" }}>
                        {item.Overview}
                    </p>

                    {/* Studios */}
                    {item.Studios && item.Studios.length > 0 && (
                        <div className="mb-6 sm:mb-8">
                            <span className="text-xs sm:text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>Studio: </span>
                            <span className="text-xs sm:text-sm text-white">
                                {item.Studios.map((s) => s.Name).join(", ")}
                            </span>
                        </div>
                    )}

                    {/* Cast */}
                    {cast.length > 0 && (
                        <div className="mb-10 sm:mb-12">
                            <h3 className="text-base sm:text-lg font-bold text-white mb-4 font-heading">Cast</h3>
                            <div className="flex gap-3 sm:gap-4 overflow-x-auto hide-scrollbar pb-2">
                                {cast.map((person) => (
                                    <div
                                        key={person.Id}
                                        className="flex flex-col items-center flex-shrink-0 w-16 sm:w-20"
                                    >
                                        <div
                                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden mb-2"
                                            style={{
                                                backgroundColor: "#000d2e",
                                                border: "2px solid rgba(255,255,255,0.08)",
                                            }}
                                        >
                                            {person.PrimaryImageTag ? (
                                                <img
                                                    src={jellyfin.getPersonImageUrl(
                                                        person.Id,
                                                        person.PrimaryImageTag
                                                    )}
                                                    alt={person.Name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xl" style={{ color: "rgba(255,255,255,0.2)" }}>
                                                    👤
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-[10px] sm:text-xs text-white text-center truncate w-full">
                                            {person.Name}
                                        </p>
                                        {person.Role && (
                                            <p className="text-[9px] sm:text-[10px] text-center truncate w-full" style={{ color: "rgba(255,255,255,0.3)" }}>
                                                {person.Role}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Seasons & Episodes */}
                    {isSeries && seasons.length > 0 && (
                        <div className="mb-10 sm:mb-12">
                            {/* Season Tabs */}
                            <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto hide-scrollbar pb-2">
                                {seasons.map((season) => (
                                    <button
                                        key={season.Id}
                                        onClick={() => setSelectedSeason(season.Id)}
                                        className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all min-h-[40px]"
                                        style={{
                                            backgroundColor: selectedSeason === season.Id ? "#0DD6E8" : "rgba(255,255,255,0.05)",
                                            color: selectedSeason === season.Id ? "#00061a" : "rgba(255,255,255,0.5)",
                                            border: selectedSeason === season.Id ? "none" : "1px solid rgba(255,255,255,0.06)",
                                            boxShadow: selectedSeason === season.Id ? "0 0 20px rgba(13,214,232,0.25)" : "none",
                                            fontWeight: selectedSeason === season.Id ? 700 : 500,
                                        }}
                                    >
                                        {season.Name}
                                    </button>
                                ))}
                            </div>

                            {/* Episode List */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={selectedSeason}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-2 sm:space-y-3"
                                >
                                    {episodes.map((ep, i) => (
                                        <motion.div
                                            key={ep.Id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            onClick={() => handlePlayEpisode(ep, i)}
                                            className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 rounded-xl cursor-pointer group transition-all hover:bg-white/5"
                                        >
                                            {/* Episode Number + Thumbnail (mobile: side by side) */}
                                            <div className="flex items-start gap-3 sm:gap-4">
                                                {/* Episode Number */}
                                                <div className="flex-shrink-0 w-6 sm:w-8 text-center pt-1 sm:pt-2">
                                                    <span className="text-lg sm:text-xl font-bold transition-colors" style={{ color: "rgba(255,255,255,0.2)" }}>
                                                        {ep.IndexNumber ?? i + 1}
                                                    </span>
                                                </div>

                                                {/* Thumbnail */}
                                                <div className="flex-shrink-0 w-28 sm:w-40 aspect-video rounded-lg overflow-hidden relative" style={{ backgroundColor: "#000d2e" }}>
                                                    <img
                                                        src={jellyfin.getImageUrl(ep.Id, "Primary", {
                                                            maxWidth: 300,
                                                        })}
                                                        alt={ep.Name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = "none";
                                                        }}
                                                    />
                                                    {/* Play overlay */}
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)" }}>
                                                            <svg
                                                                className="w-4 h-4 sm:w-5 sm:h-5 text-white ml-0.5"
                                                                fill="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path d="M8 5v14l11-7z" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    {/* Episode progress bar */}
                                                    {ep.UserData?.PlayedPercentage != null && ep.UserData.PlayedPercentage > 0 && (
                                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                                                            <div
                                                                className="h-full rounded-r-full"
                                                                style={{
                                                                    width: `${Math.min(ep.UserData.PlayedPercentage, 100)}%`,
                                                                    background: "linear-gradient(90deg, #0DD6E8, #0ABDC9)",
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0 py-0 sm:py-1 pl-9 sm:pl-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="text-xs sm:text-sm font-semibold text-white truncate transition-colors group-hover:text-[#0DD6E8]">
                                                        {ep.Name}
                                                    </h4>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const encodedUrl = encodeURIComponent(jellyfin.getDownloadUrl(ep.Id));
                                                                const filename = encodeURIComponent(`${item.Name} - S${ep.ParentIndexNumber ?? 1}E${ep.IndexNumber ?? 1} - ${ep.Name}.mp4`);
                                                                window.open(`/api/download?url=${encodedUrl}&filename=${filename}`, "_blank");
                                                            }}
                                                            className="p-1.5 rounded-full hover:bg-white/20 text-white/60 hover:text-white transition-colors"
                                                            title="Download Episode"
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 9.75l-3 3m0 0l3 3m-3-3l3-3M3 13.5l6-3 6 3" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v13.5" />
                                                            </svg>
                                                        </button>
                                                        {ep.RunTimeTicks && (
                                                            <span className="text-[10px] sm:text-xs text-white/30 whitespace-nowrap">
                                                                {formatRuntime(ep.RunTimeTicks)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-[11px] sm:text-xs line-clamp-2 leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                                                    {ep.Overview ?? "No description available."}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Similar Content */}
                    {similar.length > 0 && (
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-white mb-4 font-heading">
                                More Like This
                            </h3>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                                {similar.map((sim) => (
                                    <motion.a
                                        key={sim.Id}
                                        href={`/item/${sim.Id}`}
                                        whileHover={{ scale: 1.05 }}
                                        className="block"
                                    >
                                        <div
                                            className="aspect-[2/3] rounded-xl overflow-hidden"
                                            style={{
                                                backgroundColor: "#000d2e",
                                                border: "1px solid rgba(255,255,255,0.05)",
                                            }}
                                        >
                                            <img
                                                src={jellyfin.getImageUrl(sim.Id, "Primary", {
                                                    maxWidth: 300,
                                                })}
                                                alt={sim.Name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = "none";
                                                }}
                                            />
                                        </div>
                                        <p className="text-xs sm:text-sm text-white mt-2 truncate">
                                            {sim.Name}
                                        </p>
                                    </motion.a>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
