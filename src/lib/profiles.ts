import { db } from "./firebase";
import { ref, get, set, remove, push } from "firebase/database";

export interface Profile {
    id: string;
    name: string;
    avatar: string;
    isKids: boolean;
    createdAt: number;
}

// Custom emoji avatar files in /public/avatars/
export const AVATARS = [
    "fox_1f98a.png",
    "cat-face_1f431.png",
    "dog-face_1f436.png",
    "lion_1f981.png",
    "panda_1f43c.png",
    "unicorn_1f984.png",
    "monkey-face_1f435.png",
    "pig-face_1f437.png",
    "frog_1f438.png",
    "dolphin_1f42c.png",
    "spouting-whale_1f433.png",
    "fire_1f525.png",
];

/**
 * Get the URL for a profile avatar
 */
export function emojiToUrl(avatar: string): string {
    return `/avatars/${avatar}`;
}

// Kids-allowed ratings
export const KIDS_ALLOWED_RATINGS = [
    "G", "PG", "TV-G", "TV-Y", "TV-Y7", "TV-Y7-FV", "TV-PG",
    "NR",
];

export const MAX_PROFILES = 7;

function profilesRef(uid: string) {
    return ref(db, `users/${uid}/profiles`);
}

function profileRef(uid: string, profileId: string) {
    return ref(db, `users/${uid}/profiles/${profileId}`);
}

export async function getProfiles(uid: string): Promise<Profile[]> {
    const snapshot = await get(profilesRef(uid));
    if (!snapshot.exists()) return [];

    const data = snapshot.val() as Record<string, Omit<Profile, "id">>;
    return Object.entries(data).map(([id, profile]) => ({
        id,
        ...profile,
    }));
}

export async function createProfile(
    uid: string,
    data: { name: string; avatar: string; isKids: boolean }
): Promise<Profile> {
    const existing = await getProfiles(uid);
    if (existing.length >= MAX_PROFILES) {
        throw new Error(`Maximum ${MAX_PROFILES} profiles allowed.`);
    }

    const newRef = push(profilesRef(uid));
    const profile: Omit<Profile, "id"> = {
        name: data.name,
        avatar: data.avatar,
        isKids: data.isKids,
        createdAt: Date.now(),
    };

    await set(newRef, profile);
    return { id: newRef.key!, ...profile };
}

export async function updateProfile(
    uid: string,
    profileId: string,
    data: { name: string; avatar: string; isKids: boolean }
): Promise<void> {
    const snapshot = await get(profileRef(uid, profileId));
    if (!snapshot.exists()) throw new Error("Profile not found.");

    const existing = snapshot.val();
    await set(profileRef(uid, profileId), {
        ...existing,
        name: data.name,
        avatar: data.avatar,
        isKids: data.isKids,
    });
}

export async function deleteProfile(
    uid: string,
    profileId: string
): Promise<void> {
    await remove(profileRef(uid, profileId));
}

/**
 * Filter items for Kids profile.
 */
export function filterForKids<T extends { OfficialRating?: string }>(
    items: T[]
): T[] {
    return items.filter((item) => {
        if (!item.OfficialRating) return true;
        return KIDS_ALLOWED_RATINGS.includes(item.OfficialRating);
    });
}
