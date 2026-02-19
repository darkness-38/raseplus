"use client";

import { useState } from "react";
import { useAdminAuth } from "@/lib/adminAuth";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function AdminLoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAdminAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const success = await login(username, password);
            if (success) {
                router.push("/admin");
            } else {
                setError("Invalid credentials.");
            }
        } catch {
            setError("Login failed. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4"
            style={{ backgroundColor: "#00061a" }}
        >
            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div
                    className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[400px] rounded-full blur-[160px]"
                    style={{ backgroundColor: "rgba(139,92,246,0.08)" }}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-sm"
            >
                {/* Admin icon */}
                <div className="flex justify-center mb-6">
                    <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                        style={{
                            backgroundColor: "rgba(139,92,246,0.15)",
                            border: "1px solid rgba(139,92,246,0.25)",
                        }}
                    >
                        ⚙
                    </div>
                </div>

                <div
                    className="rounded-2xl p-6 sm:p-8 shadow-2xl"
                    style={{
                        backgroundColor: "rgba(0,6,26,0.88)",
                        backdropFilter: "blur(40px)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        boxShadow: "0 0 60px rgba(139,92,246,0.06)",
                    }}
                >
                    <h1
                        className="text-xl font-bold text-white mb-1 text-center"
                        style={{ fontFamily: "'Google Sans Flex', system-ui, sans-serif" }}
                    >
                        Admin Panel
                    </h1>
                    <p className="text-sm mb-6 text-center" style={{ color: "rgba(255,255,255,0.35)" }}>
                        Sign in with admin credentials
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
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
                            <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                autoComplete="username"
                                className="w-full px-4 py-3 rounded-xl text-sm text-white transition-all focus:outline-none"
                                placeholder="admin"
                                style={{
                                    backgroundColor: "rgba(255,255,255,0.05)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = "rgba(139,92,246,0.4)";
                                    e.target.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.1)";
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = "rgba(255,255,255,0.08)";
                                    e.target.style.boxShadow = "none";
                                }}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                className="w-full px-4 py-3 rounded-xl text-sm text-white transition-all focus:outline-none"
                                placeholder="••••••••"
                                style={{
                                    backgroundColor: "rgba(255,255,255,0.05)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = "rgba(139,92,246,0.4)";
                                    e.target.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.1)";
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
                            className="w-full py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                            style={{
                                backgroundColor: "#8B5CF6",
                                color: "white",
                                boxShadow: "0 0 20px rgba(139,92,246,0.3)",
                            }}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Signing in...
                                </span>
                            ) : "Sign In"}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
