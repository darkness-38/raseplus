
export type MediaType = "movie" | "tv" | "anime" | "collection";

export interface MediaItem {
    id: string; // TMDB ID
    title: string;
    overview: string;
    posterPath: string;
    backdropPath: string;
    rating: number;
    year: string;
    type: MediaType;
    source: "tmdb";
    genres?: string[];
}

export interface Season {
    id: string;
    seasonNumber: number;
    name: string;
    overview: string;
    airDate: string;
    posterPath: string;
    episodeCount: number;
}

export interface Episode {
    id: string;
    episodeNumber: number;
    seasonNumber: number;
    name: string;
    overview: string;
    airDate: string;
    stillPath: string;
}
