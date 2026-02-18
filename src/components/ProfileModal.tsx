"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { createProfile, updateProfile, Profile, AVATARS, emojiToUrl } from "@/lib/profiles";
import Image from "next/image";

interface ProfileModalProps {
    profile: Profile | null;
    onSave: () => void;
    onClose: () => void;
}

export default function ProfileModal({ profile, onSave, onClose }: ProfileModalProps) {
    const { user } = useAuth();
    const [name, setName] = useState(profile?.name ?? "");
    const [avatar, setAvatar] = useState(profile?.avatar ?? AVATARS[0]);
    const [isKids, setIsKids] = useState(profile?.isKids ?? false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const isEditing = !!profile;

    const handleSave = async () => {
        if (!user) return;
        if (!name.trim()) {
            setError("Please enter a name.");
            return;
        }

        setSaving(true);
        setError("");
        try {
            if (isEditing) {
                await updateProfile(user.uid, profile.id, { name: name.trim(), avatar, isKids });
            } else {
                await createProfile(user.uid, { name: name.trim(), avatar, isKids });
            }
            onSave();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Something went wrong.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ backgroundColor: "rgba(0,6,26,0.95)", backdropFilter: "blur(20px)" }}
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-lg rounded-2xl p-6 sm:p-8"
                style={{
                    backgroundColor: "rgba(0,13,46,0.95)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 0 80px rgba(13,214,232,0.08), 0 24px 80px rgba(0,0,0,0.5)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with selected avatar */}
                <div className="flex items-center gap-4 mb-6">
                    <div
                        className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                            background: "linear-gradient(135deg, rgba(13,214,232,0.15) 0%, rgba(13,214,232,0.05) 100%)",
                            border: "2px solid rgba(13,214,232,0.2)",
                        }}
                    >
                        <Image
                            src={emojiToUrl(avatar)}
                            alt="avatar"
                            width={36}
                            height={36}
                            className="w-9 h-9 select-none"
                            unoptimized
                        />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white font-heading">
                            {isEditing ? "Edit Profile" : "Add Profile"}
                        </h2>
                        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                            {isEditing ? "Update your profile details" : "Create a new profile"}
                        </p>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
                        {error}
                    </div>
                )}

                {/* Name Input */}
                <div className="mb-6">
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                        Profile Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={20}
                        className="w-full px-4 py-3.5 rounded-xl text-white transition-all focus:outline-none text-sm sm:text-base"
                        placeholder="Enter name..."
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

                {/* Avatar Picker */}
                <div className="mb-6">
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>
                        Choose Avatar
                    </label>
                    <div className="grid grid-cols-8 gap-2">
                        {AVATARS.map((a) => (
                            <button
                                key={a}
                                onClick={() => setAvatar(a)}
                                className="aspect-square rounded-xl flex items-center justify-center transition-all duration-200 relative"
                                style={{
                                    backgroundColor: avatar === a ? "rgba(13,214,232,0.15)" : "rgba(255,255,255,0.04)",
                                    border: avatar === a ? "2px solid #0DD6E8" : "2px solid transparent",
                                    boxShadow: avatar === a ? "0 0 20px rgba(13,214,232,0.15)" : "none",
                                }}
                            >
                                <Image
                                    src={emojiToUrl(a)}
                                    alt={a}
                                    width={28}
                                    height={28}
                                    className="w-6 h-6 sm:w-7 sm:h-7 select-none"
                                    unoptimized
                                />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Kids Toggle */}
                <div className="mb-8">
                    <button
                        onClick={() => setIsKids(!isKids)}
                        className="flex items-center gap-4 w-full p-4 rounded-xl transition-all duration-200"
                        style={{
                            backgroundColor: isKids ? "rgba(13,214,232,0.06)" : "rgba(255,255,255,0.02)",
                            border: isKids ? "1px solid rgba(13,214,232,0.15)" : "1px solid rgba(255,255,255,0.06)",
                        }}
                    >
                        {/* Toggle */}
                        <div
                            className="relative w-12 h-7 rounded-full transition-colors duration-200 flex-shrink-0"
                            style={{ backgroundColor: isKids ? "#0DD6E8" : "rgba(255,255,255,0.12)" }}
                        >
                            <motion.div
                                className="absolute top-1 w-5 h-5 rounded-full shadow-md"
                                style={{ backgroundColor: "white" }}
                                animate={{ left: isKids ? 24 : 4 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        </div>

                        <div className="text-left">
                            <p className="text-sm font-semibold text-white">Kids Profile</p>
                            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                                Only shows kid-friendly content (G, PG rated)
                            </p>
                        </div>
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3.5 rounded-full text-sm font-semibold transition-all hover:bg-white/5"
                        style={{
                            color: "rgba(255,255,255,0.5)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            backgroundColor: "rgba(255,255,255,0.02)",
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !name.trim()}
                        className="btn-primary flex-1 py-3.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Profile"}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
