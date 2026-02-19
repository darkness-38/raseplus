import { db } from "@/lib/firebase";
import { ref, get, set as fbSet } from "firebase/database";
import { useState, useEffect, useCallback } from "react";

/*
 * Admin auth is COMPLETELY separate from Rase+ user accounts.
 * Credentials are stored in Firebase RTDB at /adminAuth.
 * Session is tracked via localStorage with a separate key.
 */

const ADMIN_REF = "adminAuth";
const SESSION_KEY = "rase-admin-session";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export interface AdminCredentials {
    username: string;
    password: string; // stored as-is in RTDB (simple approach)
}

/* ─── Default admin account (created on first use) ─── */
const DEFAULT_ADMIN: AdminCredentials = {
    username: "admin",
    password: "admin123",
};

/* ─── Check if admin credentials exist, create if not ─── */
async function ensureAdminExists(): Promise<void> {
    const snapshot = await get(ref(db, ADMIN_REF));
    if (!snapshot.exists()) {
        await fbSet(ref(db, ADMIN_REF), DEFAULT_ADMIN);
    }
}

/* ─── Login ─── */
export async function adminLogin(
    username: string,
    password: string
): Promise<boolean> {
    await ensureAdminExists();
    const snapshot = await get(ref(db, ADMIN_REF));
    if (!snapshot.exists()) return false;

    const creds = snapshot.val() as AdminCredentials;
    if (creds.username === username && creds.password === password) {
        // Store session in localStorage
        const session = {
            authenticated: true,
            expiresAt: Date.now() + SESSION_DURATION,
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return true;
    }
    return false;
}

/* ─── Logout ─── */
export function adminLogout(): void {
    localStorage.removeItem(SESSION_KEY);
}

/* ─── Check session ─── */
export function isAdminAuthenticated(): boolean {
    if (typeof window === "undefined") return false;
    try {
        const stored = localStorage.getItem(SESSION_KEY);
        if (!stored) return false;
        const session = JSON.parse(stored);
        if (session.authenticated && session.expiresAt > Date.now()) {
            return true;
        }
        // Session expired
        localStorage.removeItem(SESSION_KEY);
        return false;
    } catch {
        return false;
    }
}

/* ─── Update admin credentials ─── */
export async function updateAdminCredentials(
    newUsername: string,
    newPassword: string
): Promise<void> {
    await fbSet(ref(db, ADMIN_REF), {
        username: newUsername,
        password: newPassword,
    });
}

/* ─── React Hook ─── */
export function useAdminAuth() {
    const [authenticated, setAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setAuthenticated(isAdminAuthenticated());
        setLoading(false);
    }, []);

    const login = useCallback(async (username: string, password: string) => {
        const success = await adminLogin(username, password);
        if (success) setAuthenticated(true);
        return success;
    }, []);

    const logout = useCallback(() => {
        adminLogout();
        setAuthenticated(false);
    }, []);

    return { authenticated, loading, login, logout };
}
