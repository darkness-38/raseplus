"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await signIn(email, password);
            router.push("/profiles");
        } catch {
            setError("Invalid email or password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#00061a" }}>
            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div
                    className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] sm:w-[600px] h-[400px] rounded-full blur-[160px]"
                    style={{ backgroundColor: "rgba(13,214,232,0.08)" }}
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
                            src="/logo.png"
                            alt="Rase+"
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
                    <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 font-heading">Welcome back</h1>
                    <p className="text-sm mb-6 sm:mb-8" style={{ color: "rgba(255,255,255,0.4)" }}>Sign in to continue watching</p>

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

                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-xl text-white transition-all focus:outline-none"
                                placeholder="you@example.com"
                                style={{
                                    backgroundColor: "rgba(255,255,255,0.05)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = "rgba(13,214,232,0.4)";
                                    e.target.style.boxShadow = "0 0 0 3px rgba(13,214,232,0.1)";
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = "rgba(255,255,255,0.08)";
                                    e.target.style.boxShadow = "none";
                                }}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-xl text-white transition-all focus:outline-none"
                                placeholder="••••••••"
                                style={{
                                    backgroundColor: "rgba(255,255,255,0.05)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = "rgba(13,214,232,0.4)";
                                    e.target.style.boxShadow = "0 0 0 3px rgba(13,214,232,0.1)";
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = "rgba(255,255,255,0.08)";
                                    e.target.style.boxShadow = "none";
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-3.5 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Signing in...
                                </span>
                            ) : "Sign In"}
                        </button>
                    </form>

                    <p className="text-center text-sm mt-6" style={{ color: "rgba(255,255,255,0.4)" }}>
                        New to Rase+?{" "}
                        <Link href="/register" className="font-medium transition-colors hover:opacity-80" style={{ color: "#0DD6E8" }}>
                            Create an account
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
