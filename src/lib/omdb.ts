const OMDB_API_KEY = process.env.NEXT_PUBLIC_OMDB_API_KEY || "";
const OMDB_BASE_URL = "https://www.omdbapi.com/";

export interface OMDBResponse {
    Title: string;
    Year: string;
    Rated: string;
    Released: string;
    Runtime: string;
    Genre: string;
    Director: string;
    Writer: string;
    Actors: string;
    Plot: string;
    Language: string;
    Country: string;
    Awards: string;
    Poster: string;
    Ratings: Array<{ Source: string; Value: string }>;
    Metascore: string;
    imdbRating: string;
    imdbVotes: string;
    imdbID: string;
    Type: string;
    DVD?: string;
    BoxOffice?: string;
    Production?: string;
    Website?: string;
    Response: "True" | "False";
    Error?: string;
}

class OMDBService {
    private async fetch<T>(params: Record<string, string>): Promise<T> {
        const url = new URL(OMDB_BASE_URL);
        url.searchParams.append("apikey", OMDB_API_KEY);
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });

        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`OMDb API error: ${response.statusText}`);
        }
        return response.json();
    }

    /**
     * Get the rating for a movie/show by title and optional year
     */
    async getRating(title: string, year?: string): Promise<string> {
        try {
            const params: Record<string, string> = { t: title };
            if (year) {
                // TMDB dates are YYYY-MM-DD, OMDb expects YYYY
                const yearOnly = year.split("-")[0];
                params.y = yearOnly;
            }

            const data = await this.fetch<OMDBResponse>(params);
            
            if (data.Response === "False") {
                if (data.Error === "Request limit reached!" || data.Error === "Daily request limit reached!") {
                    throw new Error("OMDB_LIMIT_REACHED");
                }
                // If not found with year, try without year
                if (year) {
                    const fallbackData = await this.fetch<OMDBResponse>({ t: title });
                    if (fallbackData.Response === "False" && 
                        (fallbackData.Error === "Request limit reached!" || fallbackData.Error === "Daily request limit reached!")) {
                        throw new Error("OMDB_LIMIT_REACHED");
                    }
                    return fallbackData.Rated || "N/A";
                }
                return "N/A";
            }

            return data.Rated || "N/A";
        } catch (error: any) {
            if (error.message === "OMDB_LIMIT_REACHED") throw error;
            console.error("OMDb fetch error:", error);
            return "N/A";
        }
    }
}

export const omdb = new OMDBService();
