"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { jellyfin } from "@/lib/jellyfin";
import { useStore } from "@/store/useStore";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    jellyfinError: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    retryJellyfin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    jellyfinError: false,
    signIn: async () => { },
    signUp: async () => { },
    logout: async () => { },
    retryJellyfin: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [jellyfinError, setJellyfinError] = useState(false);
    const setJellyfinReady = useStore((s) => s.setJellyfinReady);
    const clearActiveProfile = useStore((s) => s.clearActiveProfile);

    const initJellyfin = async () => {
        if (jellyfin.isAuthenticated()) {
            setJellyfinReady(true);
            return;
        }
        setJellyfinError(false);
        try {
            const ok = await jellyfin.authenticate();
            setJellyfinReady(ok);
            if (!ok) setJellyfinError(true);
        } catch {
            setJellyfinError(true);
            setJellyfinReady(false);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                await initJellyfin();
            }
            setLoading(false);
        });
        return () => unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const signIn = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signUp = async (email: string, password: string) => {
        await createUserWithEmailAndPassword(auth, email, password);
    };

    const logout = async () => {
        clearActiveProfile();
        await signOut(auth);
        setJellyfinReady(false);
        setJellyfinError(false);
    };

    const retryJellyfin = async () => {
        await initJellyfin();
    };

    return (
        <AuthContext.Provider
            value={{ user, loading, jellyfinError, signIn, signUp, logout, retryJellyfin }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
