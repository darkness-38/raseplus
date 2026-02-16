'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    User as FirebaseUser,
} from 'firebase/auth';

const googleProvider = new GoogleAuthProvider();
import { auth } from '@/lib/firebase';
import { authenticateByName, JellyfinAuth } from '@/lib/jellyfin';

// Jellyfin credentials — hardcoded, used behind the scenes to fetch content
const JELLYFIN_USER = 'guest';
const JELLYFIN_PASS = 'guest';

interface AuthContextType {
    isAuthenticated: boolean;
    firebaseUser: FirebaseUser | null;
    user: FirebaseUser | null;
    jellyfinAuth: JellyfinAuth | null;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    firebaseUser: null,
    user: null,
    jellyfinAuth: null,
    login: async () => ({ success: false }),
    register: async () => ({ success: false }),
    loginWithGoogle: async () => ({ success: false }),
    logout: async () => { },
    isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [jellyfinAuth, setJellyfinAuth] = useState<JellyfinAuth | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Connect to Jellyfin (called after Firebase login succeeds)
    const connectJellyfin = async () => {
        // Check if we have a cached Jellyfin token
        const cached = localStorage.getItem('raseplus_jellyfin');
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                setJellyfinAuth(parsed);
                return;
            } catch {
                localStorage.removeItem('raseplus_jellyfin');
            }
        }

        // Authenticate with Jellyfin
        try {
            const jfAuth = await authenticateByName(JELLYFIN_USER, JELLYFIN_PASS);
            setJellyfinAuth(jfAuth);
            localStorage.setItem('raseplus_jellyfin', JSON.stringify(jfAuth));
        } catch (err) {
            console.error('Jellyfin connection failed:', err);
        }
    };

    // Listen to Firebase auth state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setFirebaseUser(user);
            if (user) {
                setIsAuthenticated(true);
                await connectJellyfin();
            } else {
                setIsAuthenticated(false);
                setJellyfinAuth(null);
                localStorage.removeItem('raseplus_jellyfin');
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return { success: true };
        } catch (err: unknown) {
            const error = err as { code?: string };
            let message = 'Login failed. Please try again.';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                message = 'Invalid email or password.';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Invalid email address.';
            } else if (error.code === 'auth/too-many-requests') {
                message = 'Too many attempts. Please try again later.';
            }
            return { success: false, error: message };
        }
    };

    const register = async (email: string, password: string) => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            return { success: true };
        } catch (err: unknown) {
            const error = err as { code?: string };
            let message = 'Registration failed. Please try again.';
            if (error.code === 'auth/email-already-in-use') {
                message = 'This email is already registered.';
            } else if (error.code === 'auth/weak-password') {
                message = 'Password must be at least 6 characters.';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Invalid email address.';
            }
            return { success: false, error: message };
        }
    };

    const loginWithGoogle = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            return { success: true };
        } catch (err: unknown) {
            const error = err as { code?: string };
            let message = 'Google sign-in failed.';
            if (error.code === 'auth/popup-closed-by-user') {
                message = 'Sign-in cancelled.';
            } else if (error.code === 'auth/popup-blocked') {
                message = 'Popup blocked. Please allow popups.';
            }
            return { success: false, error: message };
        }
    };

    const logout = async () => {
        await signOut(auth);
        setJellyfinAuth(null);
        setIsAuthenticated(false);
        localStorage.removeItem('raseplus_jellyfin');
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, firebaseUser, user: firebaseUser, jellyfinAuth, login, register, loginWithGoogle, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
