import { MediaItem, MediaType } from "@/types/media";

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || "";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

const MOVIE_GENRES: { [key: number]: string } = {
    28: "Action",
    12: "Adventure",
    16: "Animation",
    35: "Comedy",
    80: "Crime",
    99: "Documentary",
    18: "Drama",
    10751: "Family",
    14: "Fantasy",
    36: "History",
    27: "Horror",
    10402: "Music",
    9648: "Mystery",
    10749: "Romance",
    878: "Science Fiction",
    10770: "TV Movie",
    53: "Thriller",
    10752: "War",
    37: "Western",
};

const TV_GENRES: { [key: number]: string } = {
    10759: "Action & Adventure",
    16: "Animation",
    35: "Comedy",
    80: "Crime",
    99: "Documentary",
    18: "Drama",
    37: "Western",
    10751: "Family",
    10762: "Kids",
    9648: "Mystery",
    10763: "News",
    10764: "Reality",
    10765: "Sci-Fi & Fantasy",
    10766: "Soap",
    10767: "Talk",
    10768: "War & Politics",
};

export interface TMDBMovie {
    id: number;
    title?: string;
    name?: string; // TV
    overview: string;
    poster_path: string;
    backdrop_path: string;
    release_date?: string;
    first_air_date?: string; // TV
    vote_average: number;
    genre_ids: number[];
    media_type?: "movie" | "tv";
}

export interface TMDBResponse<T> {
    page: number;
    results: T[];
    total_pages: number;
    total_results: number;
}

class TMDBService {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    private async fetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
        const queryParams = new URLSearchParams({
            api_key: this.apiKey,
            language: "en-US",
            region: "US",
            ...params,
        });

        const response = await fetch(`${TMDB_BASE_URL}${endpoint}?${queryParams}`, {
            next: { revalidate: 3600 }, // Cache for 1 hour
        });

        if (!response.ok) {
            throw new Error(`TMDB API Error: ${response.statusText}`);
        }

        return response.json();
    }

    public mapToMediaItem(item: TMDBMovie): MediaItem {
        const isTV = item.media_type === "tv";
        const genreMap = isTV ? TV_GENRES : MOVIE_GENRES;

        return {
            id: String(item.id),
            title: item.title || item.name || "Unknown",
            overview: item.overview || "",
            posterPath: this.getImageUrl(item.poster_path, "original"),
            backdropPath: this.getImageUrl(item.backdrop_path, "original"),
            rating: item.vote_average || 0,
            year: (item.release_date || item.first_air_date || "").split("-")[0] || "Unknown",
            type: (item.media_type === "tv" ? "tv" : "movie") as MediaType,
            source: "tmdb",
            genres: item.genre_ids?.map(id => genreMap[id]).filter(Boolean) as string[] || [],
        };
    }

    async getTrending(type: "all" | "movie" | "tv" = "all", timeWindow: "day" | "week" = "day"): Promise<MediaItem[]> {
        const data = await this.fetch<TMDBResponse<TMDBMovie>>(`/trending/${type}/${timeWindow}`);
        return data.results
            .filter(item => (item.media_type === "movie" || item.media_type === "tv") && item.poster_path && item.vote_average > 0)
            .map(item => this.mapToMediaItem(item));
    }

    async search(query: string, page = 1): Promise<MediaItem[]> {
        const data = await this.fetch<TMDBResponse<TMDBMovie>>("/search/multi", {
            query,
            page: String(page),
        });
        return data.results
            .filter(item => (item.media_type === "movie" || item.media_type === "tv") && item.poster_path && item.vote_average > 0)
            .map(item => this.mapToMediaItem(item));
    }

    async getMovies(type: "popular" | "top_rated" | "upcoming" | "now_playing" = "popular", page = 1): Promise<MediaItem[]> {
        const data = await this.fetch<TMDBResponse<TMDBMovie>>(`/movie/${type}`, {
            page: String(page),
        });
        return data.results
            .filter(item => item.poster_path && item.vote_average > 0)
            .map(m => this.mapToMediaItem({ ...m, media_type: "movie" }));
    }

    async getTVShows(type: "popular" | "top_rated" | "on_the_air" = "popular", page = 1): Promise<MediaItem[]> {
        const data = await this.fetch<TMDBResponse<TMDBMovie>>(`/tv/${type}`, {
            page: String(page),
        });
        return data.results
            .filter(item => item.poster_path && item.vote_average > 0)
            .map(s => this.mapToMediaItem({ ...s, media_type: "tv" }));
    }

    async getAnime(page = 1): Promise<MediaItem[]> {
        const data = await this.fetch<TMDBResponse<TMDBMovie>>(`/discover/tv`, {
            with_genres: "16", // Animation
            with_original_language: "ja", // Japanese
            page: String(page),
            sort_by: "popularity.desc",
        });
        return data.results
            .filter(item => item.poster_path && item.vote_average > 4)
            .map(s => this.mapToMediaItem({ ...s, media_type: "tv" }));
    }

    async getDetails(id: string, type: "movie" | "tv"): Promise<any> {
        return this.fetch(`/${type}/${id}`, {
            append_to_response: "videos,credits,similar,recommendations",
        });
    }

    async getSeasonDetails(tvId: string, seasonNumber: number): Promise<any> {
        return this.fetch(`/tv/${tvId}/season/${seasonNumber}`);
    }

    getImageUrl(path: string, size: "original" | "w500" | "w780" | "w342" = "w500"): string {
        if (!path) return "";
        return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
    }
}

export const tmdb = new TMDBService(TMDB_API_KEY);
