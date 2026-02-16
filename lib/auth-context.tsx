'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth'; // We'll mock this or just use the type
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
    isAuthenticated: true,
    firebaseUser: null,
    user: null,
    jellyfinAuth: null,
    login: async () => ({ success: true }),
    register: async () => ({ success: true }),
    loginWithGoogle: async () => ({ success: true }),
    logout: async () => { },
    isLoading: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
    // Mock user to bypass checks
    const mockUser = { uid: 'guest', email: 'guest@raseplus.com' } as unknown as FirebaseUser;

    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(mockUser);
    const [jellyfinAuth, setJellyfinAuth] = useState<JellyfinAuth | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    // Connect to Jellyfin on mount
    useEffect(() => {
        const connect = async () => {
            // Check cache first
            const cached = localStorage.getItem('raseplus_jellyfin');
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    setJellyfinAuth(parsed);
                    setIsLoading(false);
                    return;
                } catch {
                    localStorage.removeItem('raseplus_jellyfin');
                }
            }

            try {
                const jfAuth = await authenticateByName(JELLYFIN_USER, JELLYFIN_PASS);
                setJellyfinAuth(jfAuth);
                localStorage.setItem('raseplus_jellyfin', JSON.stringify(jfAuth));
            } catch (err) {
                console.error('Jellyfin connection failed:', err);
            } finally {
                setIsLoading(false);
            }
        };

        connect();
    }, []);

    // Mock functions
    const login = async () => ({ success: true });
    const register = async () => ({ success: true });
    const loginWithGoogle = async () => ({ success: true });
    const logout = async () => { };

    return (
        <AuthContext.Provider value={{
            isAuthenticated: true,
            firebaseUser: mockUser,
            user: mockUser,
            jellyfinAuth,
            login,
            register,
            loginWithGoogle,
            logout,
            isLoading
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
