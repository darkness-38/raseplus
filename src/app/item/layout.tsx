"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import VideoPlayer from "@/components/VideoPlayer";
import { useStore } from "@/store/useStore";
import { AnimatePresence } from "framer-motion";

export default function ItemLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const isPlayerOpen = useStore((s) => s.isPlayerOpen);
    const activeProfile = useStore((s) => s.activeProfile);

    const [isClient, setIsClient] = useState(false);
    
    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient) return;
        if (!loading && !user) {
            router.push("/login");
        } else if (!loading && user && !activeProfile) {
            router.push("/profiles");
        }
    }, [user, loading, router, activeProfile, isClient]);

    if (loading || !user) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            {children}
            <AnimatePresence>{isPlayerOpen && <VideoPlayer />}</AnimatePresence>
        </div>
    );
}
