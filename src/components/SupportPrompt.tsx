"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { getUserSettings, setMiningConsent } from "@/lib/userSettings";

export default function SupportPrompt() {
    const { user } = useAuth();
    const pathname = usePathname();
    const [visible, setVisible] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!user) return;

        let cancelled = false;
        getUserSettings(user.uid).then((settings) => {
            if (!cancelled && !settings.miningConsent) {
                setVisible(true);
            }
        });

        return () => { cancelled = true; };
    }, [user]);

    const handleEnable = async () => {
        if (!user) return;
        setSaving(true);
        try {
            await setMiningConsent(user.uid, true);
        } catch { /* silent */ }
        setSaving(false);
        setVisible(false);
    };

    const handleDismiss = () => {
        setVisible(false);
    };

    const isAllowedPath = pathname?.startsWith("/browse") || pathname?.startsWith("/watch");
    if (!isAllowedPath) return null;

    return (
        <AnimatePresence>
            {visible && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="fixed inset-0 z-[9998]"
                        style={{ backgroundColor: "rgba(0,6,26,0.7)", backdropFilter: "blur(6px)" }}
                    />

                    {/* Modal */}
                    <motion.div
                        key="modal"
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.97 }}
                        transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-sm"
                    >
                        <div
                            className="relative rounded-2xl p-6 shadow-2xl overflow-hidden"
                            style={{
                                backgroundColor: "rgba(0,6,26,0.95)",
                                border: "1px solid rgba(13,214,232,0.18)",
                                boxShadow: "0 0 60px rgba(13,214,232,0.08), 0 24px 48px rgba(0,0,0,0.5)",
                            }}
                        >
                            {/* Glow accent */}
                            <div
                                className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full pointer-events-none"
                                style={{ background: "radial-gradient(circle, rgba(13,214,232,0.12) 0%, transparent 70%)" }}
                            />

                            {/* Icon */}
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                                style={{
                                    backgroundColor: "rgba(13,214,232,0.1)",
                                    border: "1px solid rgba(13,214,232,0.2)",
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(13,214,232)" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                                </svg>
                            </div>

                            {/* Text */}
                            <h3
                                className="text-base font-bold text-white mb-2"
                                style={{ fontFamily: "'Google Sans Flex', system-ui, sans-serif" }}
                            >
                                Keep Rase+ Free
                            </h3>
                            <p className="text-sm leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.55)" }}>
                                Support the site at zero cost — just let Rase+ use a tiny slice of your
                                device&apos;s power while you watch. No ads, no subscriptions, no charges.
                            </p>

                            {/* Buttons */}
                            <div className="flex items-center gap-2.5">
                                <button
                                    onClick={handleEnable}
                                    disabled={saving}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                                    style={{
                                        backgroundColor: "rgb(13,214,232)",
                                        boxShadow: "inset 0px 4px 16px 0px rgba(194,255,255,1)",
                                        color: "#00061a",
                                    }}
                                >
                                    {saving ? "Enabling…" : "Enable — I'll help! ❤️"}
                                </button>
                                <button
                                    onClick={handleDismiss}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-white/10"
                                    style={{
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        color: "rgba(255,255,255,0.5)",
                                    }}
                                >
                                    No thanks
                                </button>
                            </div>

                            {/* Fine print */}
                            <p className="text-center text-[10px] mt-3" style={{ color: "rgba(255,255,255,0.2)" }}>
                                You can change this anytime in Account Settings.
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
