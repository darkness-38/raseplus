import { create } from "zustand";
import type { Profile } from "@/lib/profiles";

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
    playerTitle: string;
    openPlayer: (itemId: string, title: string) => void;
    closePlayer: () => void;

    // Reader state
    isReaderOpen: boolean;
    readerItemId: string | null;
    readerTitle: string;
    openReader: (itemId: string, title: string) => void;
    closeReader: () => void;

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
    playerTitle: "",
    openPlayer: (itemId, title) =>
        set({ isPlayerOpen: true, playerItemId: itemId, playerTitle: title }),
    closePlayer: () =>
        set({
            isPlayerOpen: false,
            playerItemId: null,
            playerTitle: "",
            nextEpisodeId: null,
            nextEpisodeTitle: null,
        }),

    isReaderOpen: false,
    readerItemId: null,
    readerTitle: "",
    openReader: (itemId, title) =>
        set({ isReaderOpen: true, readerItemId: itemId, readerTitle: title }),
    closeReader: () =>
        set({ isReaderOpen: false, readerItemId: null, readerTitle: "" }),

    nextEpisodeId: null,
    nextEpisodeTitle: null,
    setNextEpisode: (id, title) =>
        set({ nextEpisodeId: id, nextEpisodeTitle: title }),
}));
