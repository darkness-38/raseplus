import { MediaItem, MediaType } from "@/types/media";
import { omdb } from "./omdb";
import { KIDS_ALLOWED_RATINGS, ADULT_RATINGS } from "./profiles";

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
    adult?: boolean;
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

    async getTrending(
        type: "all" | "movie" | "tv" = "all",
        timeWindow: "day" | "week" = "day",
        options?: { isKids?: boolean; allowAdultContent?: boolean }
    ): Promise<MediaItem[]> {
        const { isKids = false, allowAdultContent = false } = options || {};

        if (isKids || !allowAdultContent) {
            // We cannot use /trending with certification filters, must use /discover
            return this.getDiscoverContent({ type, isKids, allowAdultContent, sortBy: "popularity.desc" });
        }

        const data = await this.fetch<TMDBResponse<TMDBMovie>>(`/trending/${type}/${timeWindow}`);
        return data.results
            .filter(item => (item.media_type === "movie" || item.media_type === "tv") && item.poster_path && item.vote_average > 0)
            .map(item => this.mapToMediaItem(item));
    }

    async search(
        query: string,
        page = 1,
        options?: { isKids?: boolean; allowAdultContent?: boolean }
    ): Promise<MediaItem[]> {
        const { isKids = false, allowAdultContent = false } = options || {};
        
        const data = await this.fetch<TMDBResponse<TMDBMovie>>("/search/multi", {
            query,
            page: String(page),
            include_adult: (!isKids && allowAdultContent) ? "true" : "false",
        });

        let results = data.results.filter(
            item => (item.media_type === "movie" || item.media_type === "tv") && 
                   item.poster_path && 
                   item.vote_average > 0 &&
                   !item.adult
        );

        // Perform OMDb validation if restrictions are active
        if (isKids || !allowAdultContent) {
            const validatedResults = await Promise.all(
                results.map(async (item) => {
                    const title = item.title || item.name || "";
                    const year = item.release_date || item.first_air_date || "";
                    const rating = await omdb.getRating(title, year);

                    if (isKids) {
                        // Strict Kids Filter
                        if (!KIDS_ALLOWED_RATINGS.includes(rating)) {
                            // Check if it has at least one safe genre
                            const KIDS_GENRES = new Set([16, 10751, 10762, 35, 12, 14, 10402, 878]);
                            const genreIds = item.genre_ids || [];
                            const adultLeaningGenres = [27, 53, 80, 10749, 10752];
                            
                            const hasSafeGenre = genreIds.some(id => KIDS_GENRES.has(id));
                            const hasAdultGenre = genreIds.some(id => adultLeaningGenres.includes(id));
                            
                            // If OMDb says it's not kid-safe, and TMDB genres are risky, hide it
                            if (rating === "R" || rating === "TV-MA" || rating === "NC-17" || hasAdultGenre || !hasSafeGenre) {
                                return null;
                            }
                        }
                    } else if (!allowAdultContent) {
                        // Standard Restricted Filter
                        if (ADULT_RATINGS.includes(rating) || rating === "R" || rating === "TV-MA") {
                            return null;
                        }
                    }
                    return item;
                })
            );
            results = validatedResults.filter((item): item is TMDBMovie => item !== null);
        }

        return results.map(item => this.mapToMediaItem(item));
    }

    async getMovies(
        type: "popular" | "top_rated" | "upcoming" | "now_playing" = "popular",
        page = 1,
        options?: { isKids?: boolean; allowAdultContent?: boolean }
    ): Promise<MediaItem[]> {
        const { isKids = false, allowAdultContent = false } = options || {};

        if (isKids || !allowAdultContent) {
            return this.getDiscoverContent({ type: "movie", isKids, allowAdultContent, page, sortBy: type === "top_rated" ? "vote_average.desc" : "popularity.desc" });
        }

        const data = await this.fetch<TMDBResponse<TMDBMovie>>(`/movie/${type}`, {
            page: String(page),
        });
        return data.results
            .filter(item => item.poster_path && item.vote_average > 0)
            .map(m => this.mapToMediaItem({ ...m, media_type: "movie" }));
    }

    async getTVShows(
        type: "popular" | "top_rated" | "on_the_air" = "popular",
        page = 1,
        options?: { isKids?: boolean; allowAdultContent?: boolean }
    ): Promise<MediaItem[]> {
        const { isKids = false, allowAdultContent = false } = options || {};

        if (isKids || !allowAdultContent) {
            return this.getDiscoverContent({ type: "tv", isKids, allowAdultContent, page, sortBy: type === "top_rated" ? "vote_average.desc" : "popularity.desc" });
        }

        const data = await this.fetch<TMDBResponse<TMDBMovie>>(`/tv/${type}`, {
            page: String(page),
        });
        return data.results
            .filter(item => item.poster_path && item.vote_average > 0)
            .map(s => this.mapToMediaItem({ ...s, media_type: "tv" }));
    }

    private async getDiscoverContent({
        type,
        isKids,
        allowAdultContent,
        page = 1,
        sortBy = "popularity.desc",
    }: {
        type: "all" | "movie" | "tv";
        isKids: boolean;
        allowAdultContent: boolean;
        page?: number;
        sortBy?: string;
    }): Promise<MediaItem[]> {
        const results: MediaItem[] = [];

        const fetchType = async (mediaType: "movie" | "tv") => {
            const params: Record<string, string> = {
                page: String(page),
                sort_by: sortBy,
                include_adult: (!isKids && allowAdultContent) ? "true" : "false",
                watch_region: "US", // Important for accurate certifications
                with_original_language: "en",
            };

            if (isKids) {
                params.certification_country = "US";
                if (mediaType === "movie") {
                    params["certification.lte"] = "PG";
                    params.with_genres = "10751,16"; // Family, Animation
                    params.without_genres = "27,53,80,18,10749"; // Block Horror, Thriller, Crime, Drama, Romance (adult-leaning)
                } else {
                    params["certification.lte"] = "TV-PG";
                    params.with_genres = "10762,16"; // Kids, Animation
                    params.without_genres = "27,80,9648,10763"; // Block Horror, Crime, Mystery, News
                }
            } else if (!allowAdultContent) {
                // Only apply certification-based filter for adult-disabled profiles
                params.certification_country = "US";
                if (mediaType === "movie") {
                    params["certification.lte"] = "PG-13";
                } else {
                    params["certification.lte"] = "TV-14";
                }
            }

            const data = await this.fetch<TMDBResponse<TMDBMovie>>(`/discover/${mediaType}`, params);
            return data.results
                .filter(item => item.poster_path && item.vote_average > 0)
                .map(item => this.mapToMediaItem({ ...item, media_type: mediaType }));
        };

        if (type === "all") {
            const [movies, tv] = await Promise.all([fetchType("movie"), fetchType("tv")]);
            // Interleave results roughly
            const maxLen = Math.max(movies.length, tv.length);
            for (let i = 0; i < maxLen; i++) {
                if (movies[i]) results.push(movies[i]);
                if (tv[i]) results.push(tv[i]);
            }
        } else {
            results.push(...(await fetchType(type)));
        }

        return results;
    }

    async getAnime(
        page = 1,
        options?: { isKids?: boolean; allowAdultContent?: boolean }
    ): Promise<MediaItem[]> {
        const { isKids = false, allowAdultContent = false } = options || {};

        const params: Record<string, string> = {
            with_genres: "16", // Animation
            with_original_language: "ja", // Japanese
            page: String(page),
            sort_by: "popularity.desc",
            include_adult: (!isKids && allowAdultContent) ? "true" : "false",
        };

        if (isKids) {
            params.certification_country = "US";
            params["certification.lte"] = "TV-PG";
            // Also enforce Kids genre alongside animation if strictly kids
            params.with_genres = "16,10762"; 
        } else if (!allowAdultContent) {
            params.certification_country = "US";
            params["certification.lte"] = "TV-14";
        }

        const data = await this.fetch<TMDBResponse<TMDBMovie>>(`/discover/tv`, params);
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
