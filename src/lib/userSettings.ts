import { db } from "./firebase";
import { ref, get, set } from "firebase/database";

function settingsRef(uid: string) {
    return ref(db, `users/${uid}/settings`);
}

export interface UserSettings {
    miningConsent: boolean;
}

export async function getUserSettings(uid: string): Promise<UserSettings> {
    const snapshot = await get(settingsRef(uid));
    if (!snapshot.exists()) {
        return { miningConsent: false };
    }
    const data = snapshot.val();
    return {
        miningConsent: data.miningConsent ?? false,
    };
}

export async function setMiningConsent(uid: string, value: boolean): Promise<void> {
    const snapshot = await get(settingsRef(uid));
    const existing = snapshot.exists() ? snapshot.val() : {};
    await set(settingsRef(uid), {
        ...existing,
        miningConsent: value,
    });
}
