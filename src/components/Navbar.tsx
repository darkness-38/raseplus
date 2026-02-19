"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/store/useStore";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Image from "next/image";
import { emojiToUrl } from "@/lib/profiles";
import { useSiteConfig } from "@/lib/siteConfig";

const navLinks = [
    { href: "/browse", label: "Home" },
    { href: "/browse/series", label: "Series" },
    { href: "/browse/anime", label: "Anime" },
    { href: "/browse/movies", label: "Movies" },

];

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();
    const activeProfile = useStore((s) => s.activeProfile);
    const setMobileMenuOpen = useStore((s) => s.setMobileMenuOpen);

    const [scrolled, setScrolled] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const { config: cfg } = useSiteConfig();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleLogout = async () => {
        await logout();
        router.push("/login");
    };

    const handleSwitchProfile = () => {
        useStore.getState().clearActiveProfile();
        router.push("/profiles");
    };

    // Hide navbar on some pages
    if (pathname === "/login" || pathname === "/register" || pathname === "/profiles") return null;

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-black/80 backdrop-blur-md py-3 shadow-xl" : "bg-gradient-to-b from-black/80 to-transparent py-5"
                }`}
        >
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-8 lg:gap-12">
                        {/* Logo */}
                        <Link href="/browse" className="flex items-center gap-2 group">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="relative h-8 w-24 sm:h-9 sm:w-28"
                            >
                                <Image
                                    src={cfg.logoUrl}
                                    alt={cfg.siteName}
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </motion.div>
                        </Link>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center gap-6 lg:gap-8">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`relative text-sm font-semibold tracking-wide transition-all duration-300 hover:text-white ${pathname === link.href ? "text-white" : "text-white/60"
                                        }`}
                                >
                                    {link.label}
                                    {pathname === link.href && (
                                        <motion.div
                                            layoutId="nav-underline"
                                            className="absolute -bottom-1 left-0 right-0 h-0.5"
                                            style={{ backgroundColor: "#0DD6E8" }}
                                        />
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4 lg:gap-6">
                        {/* Search Link */}
                        <Link
                            href="/browse/search"
                            className={`p-2 rounded-full transition-all duration-300 ${pathname === "/browse/search" ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                            </svg>
                        </Link>

                        {/* Right Side */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* Profile Avatar Trigger */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all overflow-hidden"
                                    style={{
                                        backgroundColor: activeProfile?.isKids
                                            ? "rgba(13,214,232,0.15)"
                                            : "rgba(255,255,255,0.08)",
                                        border: "2px solid rgba(255,255,255,0.1)",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = "#0DD6E8";
                                        e.currentTarget.style.boxShadow = "0 0 20px rgba(13,214,232,0.3)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                                        e.currentTarget.style.boxShadow = "none";
                                    }}
                                >
                                    {activeProfile ? (
                                        <Image
                                            src={emojiToUrl(activeProfile.avatar)}
                                            alt="avatar"
                                            width={28}
                                            height={28}
                                            className="w-7 h-7 select-none object-contain"
                                            unoptimized
                                        />
                                    ) : (
                                        user?.email?.[0]?.toUpperCase() ?? "U"
                                    )}
                                </button>

                                <AnimatePresence>
                                    {showUserMenu && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute right-0 mt-2 w-56 rounded-xl overflow-hidden shadow-2xl"
                                            style={{
                                                backgroundColor: "rgba(0,6,26,0.95)",
                                                backdropFilter: "blur(40px)",
                                                border: "1px solid rgba(255,255,255,0.08)",
                                            }}
                                        >
                                            {activeProfile && (
                                                <div className="px-4 py-4 flex items-center gap-3 bg-white/5 border-b border-white/5">
                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 overflow-hidden">
                                                        <Image
                                                            src={emojiToUrl(activeProfile.avatar)}
                                                            alt="avatar"
                                                            width={32}
                                                            height={32}
                                                            className="w-8 h-8 select-none object-contain"
                                                            unoptimized
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white leading-tight">{activeProfile.name}</p>
                                                        {activeProfile.isKids && (
                                                            <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: "#0DD6E8" }}>Kids</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="py-1">
                                                <button
                                                    onClick={handleSwitchProfile}
                                                    className="w-full text-left px-4 py-3 text-sm text-white/70 transition-all hover:bg-white/10 hover:text-white flex items-center gap-3"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5L22 10.5M22 10.5L19 13.5M22 10.5H10.5M5 16.5L2 13.5M2 13.5L5 10.5M2 13.5H13.5" />
                                                    </svg>
                                                    Switch Profile
                                                </button>
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full text-left px-4 py-3 text-sm text-red-400/70 transition-all hover:bg-white/10 hover:text-red-400 flex items-center gap-3 border-t border-white/5"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3H6.75A2.25 2.25 0 0 0 4.5 5.25v13.5A2.25 2.25 0 0 0 6.75 21h6.75a2.25 2.25 0 0 0 2.25-2.25V15m-3-3l3-3m0 0l3 3m-3-3H21" />
                                                    </svg>
                                                    Sign Out
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Mobile Menu Toggle */}
                            <button
                                onClick={() => setMobileMenuOpen(true)}
                                className="md:hidden p-2 text-white/70 hover:text-white"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
