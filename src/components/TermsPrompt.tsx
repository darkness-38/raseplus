"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserSettings, setAcceptedTerms } from "@/lib/userSettings";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function TermsPrompt() {
    const { user, loading: authLoading, logout } = useAuth();
    const [needsAcceptance, setNeedsAcceptance] = useState(false);
    const [loading, setLoading] = useState(true);
    const pathname = usePathname();

    useEffect(() => {
        if (authLoading) return;
        
        if (!user) {
            setNeedsAcceptance(false);
            setLoading(false);
            return;
        }

        async function checkTerms() {
            if (!user?.uid) return;
            const settings = await getUserSettings(user.uid);
            if (!settings.acceptedTerms) {
                setNeedsAcceptance(true);
            } else {
                setNeedsAcceptance(false);
            }
            setLoading(false);
        }

        checkTerms();
    }, [user, authLoading]);

    const isProtectedPath = pathname.startsWith("/browse") || pathname.startsWith("/item") || pathname.startsWith("/watch");
    
    if (!isProtectedPath || !user || loading || !needsAcceptance) return null;

    const handleAccept = async () => {
        if (!user) return;
        await setAcceptedTerms(user.uid, true);
        setNeedsAcceptance(false);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-md p-8 rounded-2xl shadow-2xl text-center z-10"
                    style={{
                        backgroundColor: "rgba(0,6,26,0.95)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        boxShadow: "0 0 60px rgba(13,214,232,0.1)",
                    }}
                >
                    <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-6" style={{ backgroundColor: "rgba(13,214,232,0.1)" }}>
                        <svg className="w-8 h-8" style={{ color: "rgb(13,214,232)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-white mb-3">Updated Terms of Service</h2>
                    <p className="text-white/60 text-sm mb-8 leading-relaxed px-4">
                        We have updated our Terms of Service. To continue using Rase+, you must read and accept the{" "}
                        <a href="https://github.com/darkness-38/raseplus/blob/master/TERMS.md" target="_blank" rel="noopener noreferrer" className="transition-colors hover:opacity-80 underline" style={{ color: "#0DD6E8" }}>
                            new terms
                        </a>.
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={handleAccept}
                            className="w-full btn-primary py-3.5 font-medium text-sm sm:text-base transition-all object-cover hover:shadow-[0_0_20px_rgba(13,214,232,0.4)]"
                        >
                            I Accept the Terms
                        </button>
                        <button
                            onClick={() => logout()}
                            className="w-full py-3.5 text-sm font-medium text-white/50 hover:text-white transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
