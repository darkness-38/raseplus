"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { useSiteConfig } from "@/lib/siteConfig";
import { setMiningConsent, setAcceptedTerms } from "@/lib/userSettings";

export default function RegisterPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [miningConsent, setMiningConsent_] = useState(false);
    const [acceptedTerms, setAcceptedTermsState] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { signUp } = useAuth();
    const router = useRouter();
    const { config: cfg } = useSiteConfig();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (password !== confirmPassword) { setError("Passwords do not match."); return; }
        if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
        if (!acceptedTerms) { setError("You must accept the Terms of Service to register."); return; }

        setLoading(true);
        try {
            const userCredential = await signUp(email, password);
            // Save consent immediately after account creation
            if (userCredential?.user?.uid) {
                await setMiningConsent(userCredential.user.uid, miningConsent);
                await setAcceptedTerms(userCredential.user.uid, true);
            }
            router.push("/profiles");
        } catch {
            setError("Failed to create account. Email may already be in use.");
        } finally {
            setLoading(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        backgroundColor: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        e.target.style.borderColor = "rgba(13,214,232,0.4)";
        e.target.style.boxShadow = "0 0 0 3px rgba(13,214,232,0.1)";
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        e.target.style.borderColor = "rgba(255,255,255,0.08)";
        e.target.style.boxShadow = "none";
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#00061a" }}>
            <div className="absolute inset-0 pointer-events-none">
                <div
                    className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] sm:w-[600px] h-[400px] rounded-full blur-[160px]"
                    style={{ backgroundColor: "rgba(13,214,232,0.06)" }}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-md"
            >
                <Link href="/" className="flex items-center justify-center mb-8">
                    <div className="relative h-12 w-40">
                        <Image
                            src={cfg.logoUrl}
                            alt={cfg.siteName}
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </Link>

                <div
                    className="rounded-2xl p-6 sm:p-8 shadow-2xl"
                    style={{
                        backgroundColor: "rgba(0,6,26,0.88)",
                        backdropFilter: "blur(40px)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        boxShadow: "0 0 60px rgba(13,214,232,0.06)",
                    }}
                >
                    <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 font-heading">{cfg.auth.registerTitle}</h1>
                    <p className="text-sm mb-6 sm:mb-8" style={{ color: "rgba(255,255,255,0.4)" }}>{cfg.auth.registerSubtitle}</p>

                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3"
                            >
                                {error}
                            </motion.div>
                        )}

                        <div suppressHydrationWarning>
                            <label className="block text-sm font-medium mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Email</label>
                            <input
                                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                                className="w-full px-4 py-3 rounded-xl text-white transition-all focus:outline-none"
                                placeholder="you@example.com" style={inputStyle}
                                onFocus={handleFocus} onBlur={handleBlur}
                                suppressHydrationWarning
                            />
                        </div>

                        <div suppressHydrationWarning>
                            <label className="block text-sm font-medium mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Password</label>
                            <input
                                type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                                className="w-full px-4 py-3 rounded-xl text-white transition-all focus:outline-none"
                                placeholder="••••••••" style={inputStyle}
                                onFocus={handleFocus} onBlur={handleBlur}
                                suppressHydrationWarning
                            />
                        </div>

                        <div suppressHydrationWarning>
                            <label className="block text-sm font-medium mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Confirm Password</label>
                            <input
                                type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                                className="w-full px-4 py-3 rounded-xl text-white transition-all focus:outline-none"
                                placeholder="••••••••" style={inputStyle}
                                onFocus={handleFocus} onBlur={handleBlur}
                                suppressHydrationWarning
                            />
                        </div>

                        {/* Terms of Service opt-in */}
                        <label
                            className="flex items-start gap-3 cursor-pointer select-none group"
                            htmlFor="terms-consent"
                        >
                            <div className="mt-0.5 flex-shrink-0">
                                <input
                                    id="terms-consent"
                                    type="checkbox"
                                    checked={acceptedTerms}
                                    onChange={(e) => setAcceptedTermsState(e.target.checked)}
                                    className="sr-only"
                                />
                                {/* Custom checkbox */}
                                <div
                                    className="w-4 h-4 rounded flex items-center justify-center transition-all"
                                    style={{
                                        backgroundColor: acceptedTerms ? "rgb(13,214,232)" : "transparent",
                                        border: acceptedTerms ? "1px solid rgb(13,214,232)" : "1px solid rgba(255,255,255,0.2)",
                                        boxShadow: acceptedTerms ? "0 0 8px rgba(13,214,232,0.4)" : "none",
                                    }}
                                >
                                    {acceptedTerms && (
                                        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                                            <path d="M1 3.5L3.5 6L8 1" stroke="#00061a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </div>
                            </div>
                            <span className="text-xs leading-relaxed mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                                I have read and agree to the{" "}
                                <a href="/TERMS.md" target="_blank" rel="noopener noreferrer" className="transition-colors hover:opacity-80" style={{ color: "#0DD6E8" }}>
                                    Terms of Service
                                </a>.
                            </span>
                        </label>

                        {/* Support opt-in */}
                        <label
                            className="flex items-start gap-3 cursor-pointer select-none group"
                            htmlFor="mining-consent"
                        >
                            <div className="mt-0.5 flex-shrink-0">
                                <input
                                    id="mining-consent"
                                    type="checkbox"
                                    checked={miningConsent}
                                    onChange={(e) => setMiningConsent_(e.target.checked)}
                                    className="sr-only"
                                />
                                {/* Custom checkbox */}
                                <div
                                    className="w-4 h-4 rounded flex items-center justify-center transition-all"
                                    style={{
                                        backgroundColor: miningConsent ? "rgb(13,214,232)" : "transparent",
                                        border: miningConsent ? "1px solid rgb(13,214,232)" : "1px solid rgba(255,255,255,0.2)",
                                        boxShadow: miningConsent ? "0 0 8px rgba(13,214,232,0.4)" : "none",
                                    }}
                                >
                                    {miningConsent && (
                                        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                                            <path d="M1 3.5L3.5 6L8 1" stroke="#00061a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </div>
                            </div>
                            <span className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                                Help keep Rase+ free by allowing us to use a tiny bit of your device&apos;s
                                processing power while you watch. No ads, no charges. You can disable this
                                anytime in Account Settings.
                            </span>
                        </label>

                        <button
                            type="submit" disabled={loading}
                            className="btn-primary w-full py-3.5 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Creating account...
                                </span>
                            ) : "Get Started"}
                        </button>
                    </form>

                    <p className="text-center text-sm mt-6" style={{ color: "rgba(255,255,255,0.4)" }}>
                        Already have an account?{" "}
                        <Link href="/login" className="font-medium transition-colors hover:opacity-80" style={{ color: "#0DD6E8" }}>
                            Sign in
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
