"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/store/useStore";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getProfiles, createProfile, deleteProfile, Profile, AVATARS, MAX_PROFILES, emojiToUrl } from "@/lib/profiles";
import ProfileModal from "@/components/ProfileModal";
import Image from "next/image";
import { useSiteConfig } from "@/lib/siteConfig";

export default function ProfilesPage() {
    const { user } = useAuth();
    const { setActiveProfile } = useStore();
    const router = useRouter();
    const { config: cfg } = useSiteConfig();

    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingProfile, setEditingProfile] = useState<Profile | null>(null);

    const loadProfiles = async () => {
        if (!user) return;
        try {
            const p = await getProfiles(user.uid);
            setProfiles(p);
        } catch (e) {
            console.error("Failed to load profiles:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfiles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handleSelectProfile = (profile: Profile) => {
        if (editMode) {
            setEditingProfile(profile);
            setModalOpen(true);
            return;
        }
        setActiveProfile(profile);
        router.push("/browse");
    };

    const handleAddProfile = () => {
        setEditingProfile(null);
        setModalOpen(true);
    };

    const handleDeleteProfile = async (profileId: string) => {
        if (!user) return;
        try {
            await deleteProfile(user.uid, profileId);
            await loadProfiles();
        } catch (e) {
            console.error("Failed to delete profile:", e);
        }
    };

    const handleModalSave = async () => {
        setModalOpen(false);
        setEditingProfile(null);
        await loadProfiles();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div
                    className="w-12 h-12 rounded-full animate-spin"
                    style={{ border: "4px solid rgba(13,214,232,0.2)", borderTopColor: "#0DD6E8" }}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative">
            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div
                    className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[200px]"
                    style={{ backgroundColor: "rgba(13,214,232,0.04)" }}
                />
            </div>

            {/* Edit Profiles toggle */}
            <div className="absolute top-6 right-6 sm:top-8 sm:right-8 z-10">
                <button
                    onClick={() => setEditMode(!editMode)}
                    className="text-xs sm:text-sm font-medium transition-all duration-200 px-5 py-2.5 rounded-full"
                    style={{
                        color: editMode ? "#0DD6E8" : "rgba(255,255,255,0.5)",
                        border: editMode ? "1px solid rgba(13,214,232,0.3)" : "1px solid rgba(255,255,255,0.1)",
                        backgroundColor: editMode ? "rgba(13,214,232,0.08)" : "rgba(255,255,255,0.03)",
                    }}
                >
                    {editMode ? "Done" : "Edit Profiles"}
                </button>
            </div>

            {/* Logo */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="relative h-12 w-40">
                    <Image
                        src={cfg.logoUrl}
                        alt={cfg.siteName}
                        fill
                        className="object-contain"
                        priority
                    />
                </div>
            </motion.div>

            {/* Title */}
            <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-10 sm:mb-14 font-heading text-center"
            >
                Who&apos;s Watching?
            </motion.h1>

            {/* Profile Grid — centered */}
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-10 lg:gap-12 max-w-4xl mx-auto">
                {profiles.map((profile, i) => (
                    <motion.div
                        key={profile.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            rotate: editMode ? [0, -1.5, 1.5, -1.5, 0] : 0,
                        }}
                        transition={{
                            delay: i * 0.08,
                            rotate: editMode ? { repeat: Infinity, duration: 0.5, ease: "easeInOut" } : {},
                        }}
                        className="flex flex-col items-center gap-3 cursor-pointer group relative"
                        onClick={() => handleSelectProfile(profile)}
                    >
                        {/* Delete button in edit mode */}
                        {editMode && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteProfile(profile.id);
                                }}
                                className="absolute -top-1 -right-1 z-10 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg"
                                style={{ backgroundColor: "#ff3b3b", boxShadow: "0 2px 12px rgba(255,59,59,0.4)" }}
                            >
                                ✕
                            </motion.button>
                        )}

                        {/* Avatar Circle */}
                        <div
                            className="w-24 h-24 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-full flex items-center justify-center transition-all duration-300 relative overflow-hidden"
                            style={{
                                background: profile.isKids
                                    ? "linear-gradient(135deg, rgba(13,214,232,0.15) 0%, rgba(13,214,232,0.05) 100%)"
                                    : "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
                                border: "3px solid rgba(255,255,255,0.08)",
                                boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = "#0DD6E8";
                                e.currentTarget.style.boxShadow = "0 0 40px rgba(13,214,232,0.25), 0 4px 24px rgba(0,0,0,0.3)";
                                e.currentTarget.style.transform = "scale(1.05)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                                e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.3)";
                                e.currentTarget.style.transform = "scale(1)";
                            }}
                        >
                            <Image
                                src={emojiToUrl(profile.avatar)}
                                alt={profile.name}
                                width={72}
                                height={72}
                                className="w-12 h-12 sm:w-16 sm:h-16 lg:w-[72px] lg:h-[72px] drop-shadow-lg select-none"
                                unoptimized
                            />
                        </div>

                        {/* Name */}
                        <span className="text-sm sm:text-base font-semibold text-white/60 group-hover:text-white transition-colors duration-200 tracking-wide">
                            {profile.name}
                        </span>

                        {/* Kids Badge */}
                        {profile.isKids && (
                            <span
                                className="text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full tracking-wider"
                                style={{ backgroundColor: "rgba(13,214,232,0.15)", color: "#0DD6E8", border: "1px solid rgba(13,214,232,0.2)" }}
                            >
                                KIDS
                            </span>
                        )}
                    </motion.div>
                ))}

                {/* Add Profile Button */}
                {profiles.length < MAX_PROFILES && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: profiles.length * 0.08 }}
                        className="flex flex-col items-center gap-3 cursor-pointer group"
                        onClick={handleAddProfile}
                    >
                        <div
                            className="w-24 h-24 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-full flex items-center justify-center transition-all duration-300"
                            style={{
                                border: "3px dashed rgba(255,255,255,0.1)",
                                background: "rgba(255,255,255,0.02)",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = "rgba(13,214,232,0.4)";
                                e.currentTarget.style.boxShadow = "0 0 40px rgba(13,214,232,0.1)";
                                e.currentTarget.style.background = "rgba(13,214,232,0.04)";
                                e.currentTarget.style.transform = "scale(1.05)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                                e.currentTarget.style.boxShadow = "none";
                                e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                                e.currentTarget.style.transform = "scale(1)";
                            }}
                        >
                            <svg className="w-9 h-9 sm:w-11 sm:h-11 transition-colors group-hover:stroke-[#0DD6E8]" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                        </div>
                        <span className="text-sm sm:text-base font-semibold tracking-wide transition-colors group-hover:text-white/50" style={{ color: "rgba(255,255,255,0.25)" }}>
                            Add Profile
                        </span>
                    </motion.div>
                )}
            </div>

            {/* Profile Modal */}
            <AnimatePresence>
                {modalOpen && (
                    <ProfileModal
                        profile={editingProfile}
                        onSave={handleModalSave}
                        onClose={() => { setModalOpen(false); setEditingProfile(null); }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
