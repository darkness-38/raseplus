"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { jellyfin } from "@/lib/jellyfin";
import { useStore } from "@/store/useStore";

type ReadingMode = "webtoon" | "manga";

export default function MangaReader() {
    const { readerItemId, readerTitle, closeReader } = useStore();
    const [pageCount, setPageCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [mode, setMode] = useState<ReadingMode>("webtoon");
    const [showControls, setShowControls] = useState(true);
    const [loading, setLoading] = useState(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const hideTimeoutRef = useRef<NodeJS.Timeout>(undefined);

    useEffect(() => {
        if (!readerItemId) return;
        const fetchPages = async () => {
            setLoading(true);
            const count = await jellyfin.getPages(readerItemId);
            // If the API doesn't give a count, default to a reasonable number
            setPageCount(count > 0 ? count : 50);
            setLoading(false);
        };
        fetchPages();
    }, [readerItemId]);

    const toggleControls = useCallback(() => {
        setShowControls((prev) => !prev);
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = setTimeout(() => setShowControls(false), 4000);
    }, []);

    // Keyboard navigation
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                if (mode === "manga") {
                    setCurrentPage((p) => Math.max(0, p - 1));
                } else {
                    setCurrentPage((p) => Math.min(pageCount - 1, p + 1));
                }
            } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                if (mode === "manga") {
                    setCurrentPage((p) => Math.min(pageCount - 1, p + 1));
                } else {
                    setCurrentPage((p) => Math.max(0, p - 1));
                }
            } else if (e.key === "Escape") {
                closeReader();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [mode, pageCount, closeReader]);

    if (!readerItemId) return null;

    const pages = Array.from({ length: pageCount }, (_, i) =>
        jellyfin.getPageImageUrl(readerItemId, i)
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black"
        >
            {/* Webtoon Mode: Vertical Scroll */}
            {mode === "webtoon" && (
                <div
                    ref={scrollContainerRef}
                    className="h-full overflow-y-auto hide-scrollbar"
                    onClick={toggleControls}
                >
                    <div className="max-w-3xl mx-auto">
                        {pages.map((url, i) => (
                            <img
                                key={i}
                                src={url}
                                alt={`Page ${i + 1}`}
                                className="w-full"
                                loading={i < 5 ? "eager" : "lazy"}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Manga Mode: RTL Pagination */}
            {mode === "manga" && (
                <div
                    className="h-full flex items-center justify-center relative"
                    onClick={toggleControls}
                >
                    <AnimatePresence mode="wait">
                        <motion.img
                            key={currentPage}
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            transition={{ duration: 0.2 }}
                            src={pages[currentPage]}
                            alt={`Page ${currentPage + 1}`}
                            className="max-h-full max-w-full object-contain"
                        />
                    </AnimatePresence>

                    {/* Click zones for RTL navigation */}
                    <div
                        className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            setCurrentPage((p) => Math.min(pageCount - 1, p + 1));
                        }}
                    />
                    <div
                        className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            setCurrentPage((p) => Math.max(0, p - 1));
                        }}
                    />
                </div>
            )}

            {/* Controls Overlay */}
            <AnimatePresence>
                {showControls && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 pointer-events-none"
                    >
                        {/* Top Bar */}
                        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between pointer-events-auto">
                            <button
                                onClick={closeReader}
                                className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                            >
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M15 19l-7-7 7-7"
                                    />
                                </svg>
                                <span className="text-sm font-medium">Back</span>
                            </button>

                            <h3 className="text-white font-medium text-sm truncate max-w-xs">
                                {readerTitle}
                            </h3>

                            {/* Mode Toggle */}
                            <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
                                <button
                                    onClick={() => setMode("webtoon")}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${mode === "webtoon"
                                        ? "bg-accent text-white"
                                        : "text-white/60 hover:text-white"
                                        }`}
                                >
                                    Webtoon
                                </button>
                                <button
                                    onClick={() => setMode("manga")}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${mode === "manga"
                                        ? "bg-accent text-white"
                                        : "text-white/60 hover:text-white"
                                        }`}
                                >
                                    Manga
                                </button>
                            </div>
                        </div>

                        {/* Bottom Bar (Manga mode) */}
                        {mode === "manga" && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pointer-events-auto">
                                <div className="flex items-center justify-center gap-4">
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                                        className="text-white hover:text-accent transition-colors"
                                        disabled={currentPage <= 0}
                                    >
                                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>

                                    <span className="text-white font-medium tabular-nums text-sm">
                                        {currentPage + 1} / {pageCount}
                                    </span>

                                    <button
                                        onClick={() =>
                                            setCurrentPage((p) =>
                                                Math.min(pageCount - 1, p + 1)
                                            )
                                        }
                                        className="text-white hover:text-accent transition-colors"
                                        disabled={currentPage >= pageCount - 1}
                                    >
                                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Page slider */}
                                <input
                                    type="range"
                                    min="0"
                                    max={pageCount - 1}
                                    value={currentPage}
                                    onChange={(e) => setCurrentPage(parseInt(e.target.value))}
                                    className="w-full mt-2 accent-accent h-1"
                                    style={{ direction: "rtl" }}
                                />
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loading */}
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
                        <span className="text-white/60 text-sm">Loading manga...</span>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
