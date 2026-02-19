"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import VideoPlayer from "@/components/VideoPlayer";
import { useStore } from "@/store/useStore";
import { AnimatePresence } from "framer-motion";
import { useSiteConfig } from "@/lib/siteConfig";

export default function BrowseLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading, jellyfinError, retryJellyfin } = useAuth();
    const router = useRouter();
    const { isPlayerOpen, isJellyfinReady, activeProfile } = useStore();
    const { config: cfg } = useSiteConfig();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    // Redirect to profile selection if no active profile
    useEffect(() => {
        if (!loading && user && !activeProfile) {
            router.push("/profiles");
        }
    }, [user, loading, activeProfile, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#00061a" }}>
                <div className="flex flex-col items-center gap-4">
                    <div
                        className="w-12 h-12 rounded-full animate-spin"
                        style={{ border: "4px solid rgba(13,214,232,0.2)", borderTopColor: "#0DD6E8" }}
                    />
                    <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>{cfg.browse.loadingText}</span>
                </div>
            </div>
        );
    }

    if (!user) return null;

    // Waiting for profile selection
    if (!activeProfile) return null;

    return (
        <div className="min-h-screen" style={{ backgroundColor: "#00061a" }}>
            <Navbar />

            {/* Jellyfin connection error overlay */}
            {jellyfinError && !isJellyfinReady && (
                <div className="min-h-screen flex items-center justify-center px-4 sm:px-6">
                    <div
                        className="rounded-2xl p-6 sm:p-8 max-w-md text-center"
                        style={{
                            backgroundColor: "rgba(0,6,26,0.88)",
                            backdropFilter: "blur(40px)",
                            border: "1px solid rgba(255,255,255,0.08)",
                        }}
                    >
                        <div
                            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: "rgba(13,214,232,0.1)" }}
                        >
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#0DD6E8" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2 font-heading">
                            Server Connection Failed
                        </h2>
                        <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
                            Could not connect to the media server. Make sure Jellyfin is running.
                        </p>
                        <button
                            onClick={retryJellyfin}
                            className="btn-primary px-6 py-3 text-sm font-bold"
                        >
                            Retry Connection
                        </button>
                    </div>
                </div>
            )}

            {/* Main content */}
            {(!jellyfinError || isJellyfinReady) && (
                <AnimatePresence mode="wait">
                    <main key="browse-content">
                        {children}
                    </main>
                </AnimatePresence>
            )}

            <AnimatePresence>{isPlayerOpen && <VideoPlayer />}</AnimatePresence>
        </div>
    );
}
