"use client";

import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen" style={{ backgroundColor: "#00061a" }}>
            {/* Admin top bar */}
            <div
                className="sticky top-0 z-50 flex items-center justify-between px-6 h-14"
                style={{
                    backgroundColor: "rgba(0,6,26,0.92)",
                    backdropFilter: "blur(20px)",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                        style={{ backgroundColor: "rgba(13,214,232,0.15)", color: "#0DD6E8" }}
                    >
                        ⚙
                    </div>
                    <span className="text-sm font-semibold text-white" style={{ fontFamily: "'Google Sans Flex', system-ui, sans-serif" }}>
                        Admin Panel
                    </span>
                </div>
                <Link
                    href="/browse"
                    className="text-xs px-4 py-2 rounded-full font-medium transition-all hover:bg-white/10"
                    style={{
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "rgba(255,255,255,0.6)",
                    }}
                >
                    ← Back to Site
                </Link>
            </div>
            {children}
        </div>
    );
}
