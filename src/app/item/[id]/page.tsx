"use client";

import { useEffect, useState, use } from "react";
import { tmdb } from "@/lib/tmdb";
import { useStore } from "@/store/useStore";
import { motion } from "framer-motion";
import { MediaItem } from "@/types/media";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function ItemDetailPage({ params, searchParams }: PageProps) {
    const { id } = use(params);
    const resolvedParams = use(searchParams);
    const urlType = resolvedParams?.type as string | undefined;
    const router = useRouter();

    const { openPlayer } = useStore();

    const [item, setItem] = useState<MediaItem | null>(null);
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
                let data;
                let type: "movie" | "tv";

                // Use the type from the URL query to avoid TMDB ID collisions
                if (urlType === "tv" || urlType === "anime") {
                    data = await tmdb.getDetails(id, "tv");
                    type = "tv";
                } else if (urlType === "movie") {
                    data = await tmdb.getDetails(id, "movie");
                    type = "movie";
                } else {
                    // Fallback just in case
                    data = await tmdb.getDetails(id, "movie");
                    type = "movie";
                    
                    if (!data.title && !data.name) {
                        data = await tmdb.getDetails(id, "tv");
                        type = "tv";
                    } else if (data.name && !data.title) {
                        type = "tv";
                    }
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
            } catch (e) {
                console.error("Failed to fetch item:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchItem();
    }, [id]);

    useEffect(() => {
        if (!item || item.type !== "tv") return;
        
        const fetchEpisodes = async () => {
            try {
                const data = await tmdb.getSeasonDetails(item.id, selectedSeason);
                setEpisodes(data.episodes || []);
            } catch (e) {
                console.error(e);
            }
        };
        fetchEpisodes();
    }, [selectedSeason, item]);

    const handlePlay = () => {
        if (!item) return;
        openPlayer({
            tmdbId: item.id,
            title: item.title,
            type: item.type as "movie" | "tv",
            season: item.type === "tv" ? selectedSeason : undefined,
            episode: item.type === "tv" ? 1 : undefined,
        });
    };

    const handlePlayEpisode = (ep: any) => {
        if (!item) return;
        openPlayer({
            tmdbId: item.id,
            title: `${item.title} - ${ep.name}`,
            type: "tv",
            season: selectedSeason,
            episode: ep.episode_number,
        });
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

            <div className="relative z-10 -mt-48 sm:-mt-64 lg:-mt-80 px-4 sm:px-6 lg:px-16 max-w-7xl">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black text-white mb-4 sm:mb-6 drop-shadow-2xl font-heading">
                        {item.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6 text-xs sm:text-sm">
                        {item.year && <span className="text-white/80 font-medium">{item.year}</span>}
                        {item.rating > 0 && (
                            <span className="font-bold flex items-center gap-1" style={{ color: "#0DD6E8" }}>
                                ★ {item.rating.toFixed(1)}
                            </span>
                        )}
                        <span className="px-2 py-0.5 border border-white/30 rounded text-[10px] sm:text-xs font-bold text-white/80 uppercase">
                            {item.type}
                        </span>
                    </div>

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
                    </div>

                    <p className="text-sm sm:text-base lg:text-lg leading-relaxed max-w-3xl mb-8 sm:mb-10 font-body text-white/60">
                        {item.overview}
                    </p>

                    {item.type === "tv" && seasons.length > 0 && (
                        <div className="mb-10 sm:mb-12">
                            <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto hide-scrollbar pb-2">
                                {seasons.map((season) => (
                                    <button
                                        key={season.id}
                                        onClick={() => setSelectedSeason(season.season_number)}
                                        className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                                            selectedSeason === season.season_number
                                                ? "bg-[#0DD6E8] text-black shadow-lg shadow-cyan-500/20"
                                                : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
                                        }`}
                                    >
                                        {season.name}
                                    </button>
                                ))}
                            </div>

                            <div className="grid gap-3">
                                {episodes.map((ep) => (
                                    <div
                                        key={ep.id}
                                        onClick={() => handlePlayEpisode(ep)}
                                        className="flex items-center gap-4 p-3 rounded-xl cursor-pointer group hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
                                    >
                                        <div className="w-8 text-center text-lg font-black text-white/20 group-hover:text-[#0DD6E8]">
                                            {ep.episode_number}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-white group-hover:text-[#0DD6E8] transition-colors">
                                                {ep.name}
                                            </h4>
                                            <p className="text-xs text-white/40 line-clamp-1">{ep.overview}</p>
                                        </div>
                                        <div className="hidden sm:block text-xs text-white/20 font-medium tabular-nums">
                                            {ep.air_date ? new Date(ep.air_date).getFullYear() : ""}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {similar.length > 0 && (
                        <div>
                            <h3 className="text-xl font-black text-white mb-6 font-heading uppercase tracking-wider">Benzer İçerikler</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {similar.slice(0, 6).map((sim) => (
                                    <div
                                        key={sim.id}
                                        onClick={() => router.push(`/item/${sim.id}`)}
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
