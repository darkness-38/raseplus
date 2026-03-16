"use client";

import { useEffect, useState, use } from "react";
import { jellyfin } from "@/lib/jellyfin";
import { tmdb } from "@/lib/tmdb";
import { useStore, StreamSource } from "@/store/useStore";
import { motion, AnimatePresence } from "framer-motion";
import { MediaItem } from "@/types/media";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function ItemDetailPage({ params }: PageProps) {
    const { id } = use(params);
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialSource = (searchParams.get("source") as StreamSource) || "tmdb";

    const isReady = useStore((s) => s.isJellyfinReady);
    const { openPlayer, setNextEpisode } = useStore();

    const [item, setItem] = useState<MediaItem | null>(null);
    const [source, setSource] = useState<StreamSource>(initialSource);
    const [localItem, setLocalItem] = useState<any | null>(null);
    
    const [seasons, setSeasons] = useState<any[]>([]);
    const [episodes, setEpisodes] = useState<any[]>([]);
    const [selectedSeason, setSelectedSeason] = useState<number>(1);
    const [similar, setSimilar] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        const fetchItem = async () => {
            setLoading(true);
            try {
                if (source === "tmdb") {
                    const tmdbData = await tmdb.getDetails(id, "movie"); // Default to movie, check tv later
                    // If it fails as movie, it might be tv
                    let type: "movie" | "tv" = "movie";
                    let data = tmdbData;
                    
                    if (!data.title && !data.name) {
                        data = await tmdb.getDetails(id, "tv");
                        type = "tv";
                    } else if (data.name && !data.title) {
                        type = "tv";
                    }

                    const mapped = tmdb.mapToMediaItem({ ...data, media_type: type });
                    setItem(mapped);

                    if (type === "tv") {
                        setSeasons(data.seasons || []);
                        if (data.seasons?.length > 0) {
                            setSelectedSeason(data.seasons[0].season_number);
                        }
                    }

                    if (data.similar?.results) {
                        setSimilar(data.similar.results.map((s: any) => tmdb.mapToMediaItem({ ...s, media_type: type })));
                    }

                    // Check if exists in Jellyfin
                    if (isReady) {
                        const local = await jellyfin.findItemByTmdbId(id);
                        setLocalItem(local);
                    }
                } else {
                    // Jellyfin source
                    const data = await jellyfin.getItem(id);
                    const mapped = jellyfin.mapToMediaItem(data);
                    setItem(mapped);
                    setLocalItem(data);

                    if (data.Type === "Series") {
                        const s = await jellyfin.getSeasons(id);
                        setSeasons(s);
                        if (s.length > 0) {
                            setSelectedSeason(1); // Jellyfin uses IDs for seasons, but we can manage
                        }
                    }

                    const sim = await jellyfin.getSimilarItems(id, 12);
                    setSimilar(sim.map(s => jellyfin.mapToMediaItem(s)));
                }
            } catch (e) {
                console.error("Failed to fetch item:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchItem();
    }, [id, source, isReady]);

    useEffect(() => {
        if (!item || item.type !== "tv") return;
        
        const fetchEpisodes = async () => {
            if (source === "tmdb") {
                const data = await tmdb.getSeasonDetails(item.id, selectedSeason);
                setEpisodes(data.episodes || []);
            } else if (localItem) {
                // For Jellyfin, we need the season ID. 
                // We'll assume the season number matches or just fetch the first available for now to keep it simple
                const jellySeasons = await jellyfin.getSeasons(localItem.Id);
                const season = jellySeasons.find(s => s.IndexNumber === selectedSeason) || jellySeasons[0];
                if (season) {
                    const eps = await jellyfin.getEpisodes(localItem.Id, season.Id);
                    setEpisodes(eps);
                }
            }
        };
        fetchEpisodes();
    }, [selectedSeason, item, source, localItem]);

    const handlePlay = () => {
        if (!item) return;
        openPlayer({
            itemId: source === "jellyfin" ? item.id : localItem?.Id,
            tmdbId: item.tmdbId || item.id,
            title: item.title,
            type: item.type as "movie" | "tv",
            source: source,
            season: item.type === "tv" ? selectedSeason : undefined,
            episode: item.type === "tv" ? 1 : undefined,
        });
    };

    const handlePlayEpisode = (ep: any, index: number) => {
        if (!item) return;
        openPlayer({
            itemId: source === "jellyfin" ? ep.Id : undefined,
            tmdbId: item.tmdbId || item.id,
            title: `${item.title} - ${ep.name || ep.Name}`,
            type: "tv",
            source: source,
            season: selectedSeason,
            episode: ep.episode_number || ep.IndexNumber,
        });
    };

    const toggleSource = () => {
        const newSource = source === "tmdb" ? "jellyfin" : "tmdb";
        setSource(newSource);
        router.push(`/item/${id}?source=${newSource}`);
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

    return (
        <div className="min-h-screen pb-20">
            {/* Backdrop */}
            <div className="relative w-full h-[50vh] sm:h-[65vh] lg:h-[80vh]">
                {!imageError && item.backdropPath ? (
                    <Image
                        src={item.backdropPath}
                        alt={item.title}
                        fill
                        priority
                        className="object-cover"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="w-full h-full" style={{ backgroundColor: "#000d2e" }} />
                )}
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #00061a 0%, transparent 70%)" }} />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to right, #00061a 0%, transparent 50%)" }} />
            </div>

            {/* Content */}
            <div className="relative z-10 -mt-48 sm:-mt-64 lg:-mt-80 px-4 sm:px-6 lg:px-16 max-w-7xl">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black text-white mb-4 sm:mb-6 drop-shadow-2xl font-heading">
                        {item.title}
                    </h1>

                    {/* Meta Row */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6 text-xs sm:text-sm">
                        {item.year && (
                            <span className="text-white/80 font-medium">{item.year}</span>
                        )}
                        {item.rating > 0 && (
                            <span className="font-bold flex items-center gap-1" style={{ color: "#0DD6E8" }}>
                                ★ {item.rating.toFixed(1)}
                            </span>
                        )}
                        <span className="px-2 py-0.5 border border-white/30 rounded text-[10px] sm:text-xs font-bold text-white/80 uppercase">
                            {item.type}
                        </span>
                        <span className="px-2 py-0.5 bg-white/10 rounded text-[10px] sm:text-xs font-bold text-cyan-400 uppercase">
                            {source === "jellyfin" ? "Yerel Kitaplık" : "Global Stream"}
                        </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6 sm:mb-8">
                        <button
                            onClick={handlePlay}
                            className="px-8 py-4 bg-[#0DD6E8] text-black rounded-xl flex items-center justify-center gap-3 text-lg font-black hover:bg-cyan-400 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-cyan-500/20"
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                            ŞİMDİ İZLE
                        </button>

                        {(localItem || source === "jellyfin") && (
                            <button
                                onClick={toggleSource}
                                className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center justify-center gap-2 font-bold transition-all border border-white/10"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                                {source === "tmdb" ? "Yerel Sunucuya Geç" : "Global Yayına Geç"}
                            </button>
                        )}
                    </div>

                    {/* Overview */}
                    <p className="text-sm sm:text-base lg:text-lg leading-relaxed max-w-3xl mb-8 sm:mb-10 font-body text-white/60">
                        {item.overview}
                    </p>

                    {/* Seasons & Episodes */}
                    {item.type === "tv" && seasons.length > 0 && (
                        <div className="mb-10 sm:mb-12">
                            <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto hide-scrollbar pb-2">
                                {seasons.map((season) => (
                                    <button
                                        key={season.id || season.Id}
                                        onClick={() => setSelectedSeason(season.season_number || season.IndexNumber)}
                                        className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                                            selectedSeason === (season.season_number || season.IndexNumber)
                                                ? "bg-[#0DD6E8] text-black shadow-lg shadow-cyan-500/20"
                                                : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
                                        }`}
                                    >
                                        {season.name || season.Name}
                                    </button>
                                ))}
                            </div>

                            <div className="grid gap-3">
                                {episodes.map((ep, i) => (
                                    <div
                                        key={ep.id || ep.Id}
                                        onClick={() => handlePlayEpisode(ep, i)}
                                        className="flex items-center gap-4 p-3 rounded-xl cursor-pointer group hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
                                    >
                                        <div className="w-8 text-center text-lg font-black text-white/20 group-hover:text-[#0DD6E8]">
                                            {ep.episode_number || ep.IndexNumber}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-white group-hover:text-[#0DD6E8] transition-colors">
                                                {ep.name || ep.Name}
                                            </h4>
                                            <p className="text-xs text-white/40 line-clamp-1">{ep.overview || ep.Overview}</p>
                                        </div>
                                        <div className="hidden sm:block text-xs text-white/20 font-medium tabular-nums">
                                            {ep.air_date || ep.PremiereDate ? new Date(ep.air_date || ep.PremiereDate).getFullYear() : ""}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Similar */}
                    {similar.length > 0 && (
                        <div>
                            <h3 className="text-xl font-black text-white mb-6 font-heading uppercase tracking-wider">Benzer İçerikler</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {similar.slice(0, 6).map((sim) => (
                                    <div
                                        key={sim.id}
                                        onClick={() => router.push(`/item/${sim.id}?source=${sim.source}`)}
                                        className="cursor-pointer group"
                                    >
                                        <div className="aspect-[2/3] relative rounded-xl overflow-hidden border border-white/5 group-hover:border-[#0DD6E8]/40 transition-all">
                                            <Image
                                                src={sim.posterPath}
                                                alt={sim.title}
                                                fill
                                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        </div>
                                        <p className="mt-2 text-xs font-bold text-white/80 group-hover:text-[#0DD6E8] truncate transition-colors">
                                            {sim.title}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
