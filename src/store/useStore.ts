import { create } from "zustand";
import type { Profile } from "@/lib/profiles";

export type StreamSource = "tmdb"; // Now fully TMDB integrated

interface AppState {
    isMobileMenuOpen: boolean;
    setMobileMenuOpen: (open: boolean) => void;

    // Active profile
    activeProfile: Profile | null;
    setActiveProfile: (profile: Profile | null) => void;
    clearActiveProfile: () => void;

    // Player state
    isPlayerOpen: boolean;
    playerItemId: string | null;
    playerTmdbId: string | null;
    playerTitle: string;
    playerType: "movie" | "tv";
    playerSeason?: number;
    playerEpisode?: number;
    
    openPlayer: (options: {
        tmdbId?: string;
        title: string;
        type: "movie" | "tv";
        season?: number;
        episode?: number;
    }) => void;
    closePlayer: () => void;
    setPlayerEpisode: (season: number, episode: number) => void;


    // Next episode
    nextEpisodeId: string | null;
    nextEpisodeTitle: string | null;
    setNextEpisode: (id: string | null, title: string | null) => void;
}

// Load persisted profile from localStorage
function loadPersistedProfile(): Profile | null {
    if (typeof window === "undefined") return null;
    try {
        const stored = localStorage.getItem("rase-active-profile");
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
}

function persistProfile(profile: Profile | null) {
    if (typeof window === "undefined") return;
    if (profile) {
        localStorage.setItem("rase-active-profile", JSON.stringify(profile));
    } else {
        localStorage.removeItem("rase-active-profile");
    }
}

export const useStore = create<AppState>((set) => ({
    isMobileMenuOpen: false,
    setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),

    // Active profile
    activeProfile: loadPersistedProfile(),
    setActiveProfile: (profile) => {
        persistProfile(profile);
        set({ activeProfile: profile });
    },
    clearActiveProfile: () => {
        persistProfile(null);
        set({ activeProfile: null });
    },

    isPlayerOpen: false,
    playerItemId: null,
    playerTmdbId: null,
    playerTitle: "",
    playerType: "movie",
    playerSeason: 1,
    playerEpisode: 1,

    openPlayer: (opts) =>
        set({
            isPlayerOpen: true,
            playerTmdbId: opts.tmdbId || null,
            playerTitle: opts.title,
            playerType: opts.type,
            playerSeason: opts.season || 1,
            playerEpisode: opts.episode || 1,
        }),
    closePlayer: () =>
        set({
            isPlayerOpen: false,
            playerTmdbId: null,
            playerTitle: "",
            nextEpisodeId: null,
            nextEpisodeTitle: null,
        }),
    setPlayerEpisode: (season, episode) => set({ playerSeason: season, playerEpisode: episode }),


    nextEpisodeId: null,
    nextEpisodeTitle: null,
    setNextEpisode: (id, title) =>
        set({ nextEpisodeId: id, nextEpisodeTitle: title }),
}));
