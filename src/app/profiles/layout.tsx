"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfilesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#00061a" }}>
                <div className="flex flex-col items-center gap-4">
                    <div
                        className="w-12 h-12 rounded-full animate-spin"
                        style={{ border: "4px solid rgba(13,214,232,0.2)", borderTopColor: "#0DD6E8" }}
                    />
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen" style={{ backgroundColor: "#00061a" }}>
            {children}
        </div>
    );
}
