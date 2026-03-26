"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useSiteConfig } from "@/lib/siteConfig";
import { getUserSettings, setMiningConsent } from "@/lib/userSettings";

export default function AccountSettingsPage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const { config: cfg } = useSiteConfig();

    const [consent, setConsent] = useState(false);
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/login");
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (!user) return;
        getUserSettings(user.uid).then((s) => {
            setConsent(s.miningConsent);
            setLoadingSettings(false);
        });
    }, [user]);

    const handleToggle = async () => {
        if (!user) return;
        const newValue = !consent;
        setConsent(newValue);
        setSaving(true);
        setSaved(false);
        try {
            await setMiningConsent(user.uid, newValue);
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch {
            setConsent(!newValue); // revert on error
        }
        setSaving(false);
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#00061a" }}>
                <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "rgba(13,214,232,0.4)", borderTopColor: "transparent" }} />
            </div>
        );
    }

    return (
        <div className="relative min-h-screen px-4 py-12" style={{ backgroundColor: "#00061a" }}>
            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div
                    className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[400px] rounded-full blur-[180px]"
                    style={{ backgroundColor: "rgba(13,214,232,0.05)" }}
                />
            </div>

            <div className="relative z-10 max-w-xl mx-auto">
                {/* Header */}
                <Link href="/browse" className="flex items-center justify-center mb-8">
                    <div className="relative h-10 w-32">
                        <Image src={cfg.logoUrl} alt={cfg.siteName} fill className="object-contain" priority />
                    </div>
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                >
                    {/* Page title */}
                    <h1
                        className="text-2xl font-bold text-white mb-1"
                        style={{ fontFamily: "'Google Sans Flex', system-ui, sans-serif" }}
                    >
                        Account Settings
                    </h1>
                    <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {user.email}
                    </p>

                    {/* Card */}
                    <div
                        className="rounded-2xl p-6"
                        style={{
                            backgroundColor: "rgba(0,6,26,0.88)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            boxShadow: "0 0 60px rgba(13,214,232,0.05)",
                            backdropFilter: "blur(40px)",
                        }}
                    >
                        <h2
                            className="text-sm font-semibold uppercase tracking-widest mb-5"
                            style={{ color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}
                        >
                            Platform Support
                        </h2>

                        {loadingSettings ? (
                            <div className="flex items-center gap-3 py-4">
                                <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "rgba(13,214,232,0.3)", borderTopColor: "transparent" }} />
                                <span className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>Loading…</span>
                            </div>
                        ) : (
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-white mb-1">Support Rase+</p>
                                    <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                                        Help keep the site running by allowing Rase+ to use a small amount of your
                                        device&apos;s processing power while you watch. Free, invisible, and can be
                                        disabled here anytime.
                                    </p>
                                </div>

                                {/* Toggle */}
                                <button
                                    onClick={handleToggle}
                                    disabled={saving}
                                    className="mt-0.5 flex-shrink-0 relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none disabled:opacity-50"
                                    style={{
                                        backgroundColor: consent ? "rgb(13,214,232)" : "rgba(255,255,255,0.1)",
                                        boxShadow: consent ? "0 0 12px rgba(13,214,232,0.4)" : "none",
                                    }}
                                    aria-label={consent ? "Disable support" : "Enable support"}
                                >
                                    <span
                                        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-300 shadow-sm"
                                        style={{ transform: consent ? "translateX(24px)" : "translateX(0)" }}
                                    />
                                </button>
                            </div>
                        )}

                        {/* Saved confirmation */}
                        <AnimatePresence>
                            {saved && (
                                <motion.p
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="text-xs mt-4"
                                    style={{ color: "rgb(13,214,232)" }}
                                >
                                    ✓ Saved
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Sign out */}
                    <div className="mt-6 flex justify-between items-center">
                        <Link
                            href="/browse"
                            className="text-sm transition-colors hover:opacity-80"
                            style={{ color: "rgba(255,255,255,0.35)" }}
                        >
                            ← Back to Browse
                        </Link>
                        <button
                            onClick={async () => { await logout(); router.push("/"); }}
                            className="text-sm transition-colors hover:opacity-80"
                            style={{ color: "rgba(255,100,100,0.6)" }}
                        >
                            Sign out
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
