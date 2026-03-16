import { create } from "zustand";
import type { Profile } from "@/lib/profiles";

export type StreamSource = "jellyfin" | "tmdb";

interface AppState {
    isJellyfinReady: boolean;
    setJellyfinReady: (ready: boolean) => void;

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
    playerSource: StreamSource;
    playerSeason: number;
    playerEpisode: number;
    
    openPlayer: (options: {
        itemId?: string;
        tmdbId?: string;
        title: string;
        type: "movie" | "tv";
        source?: StreamSource;
        season?: number;
        episode?: number;
    }) => void;
    closePlayer: () => void;
    setPlayerSource: (source: StreamSource) => void;
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
    isJellyfinReady: false,
    setJellyfinReady: (ready) => set({ isJellyfinReady: ready }),

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
    playerSource: "jellyfin",
    playerSeason: 1,
    playerEpisode: 1,

    openPlayer: (opts) =>
        set({
            isPlayerOpen: true,
            playerItemId: opts.itemId || null,
            playerTmdbId: opts.tmdbId || null,
            playerTitle: opts.title,
            playerType: opts.type,
            playerSource: opts.source || "jellyfin",
            playerSeason: opts.season || 1,
            playerEpisode: opts.episode || 1,
        }),
    closePlayer: () =>
        set({
            isPlayerOpen: false,
            playerItemId: null,
            playerTmdbId: null,
            playerTitle: "",
            nextEpisodeId: null,
            nextEpisodeTitle: null,
        }),
    setPlayerSource: (source) => set({ playerSource: source }),
    setPlayerEpisode: (season, episode) => set({ playerSeason: season, playerEpisode: episode }),


    nextEpisodeId: null,
    nextEpisodeTitle: null,
    setNextEpisode: (id, title) =>
        set({ nextEpisodeId: id, nextEpisodeTitle: title }),
}));
