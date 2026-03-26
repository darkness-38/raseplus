"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getUserSettings } from "@/lib/userSettings";
import { db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";

declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        duinotize?: any;
    }
}

function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
    });
}

export function useMiner() {
    const { user } = useAuth();
    const pathname = usePathname();
    const runningRef = useRef(false);

    useEffect(() => {
        const isAllowedPath = pathname?.startsWith("/browse") || pathname?.startsWith("/watch");

        if (!user || !isAllowedPath) {
            // Stop miner if user logs out or leaves allowed paths
            if (runningRef.current && window.duinotize) {
                try { window.duinotize.stop?.(); } catch { /* silent */ }
                runningRef.current = false;
            }
            return;
        }

        const uid = user.uid;
        const consentRef = ref(db, `users/${uid}/settings/miningConsent`);

        // Listen to consent changes in real-time
        const unsubscribe = onValue(consentRef, async (snapshot) => {
            const consent = snapshot.val() === true;

            if (consent && !runningRef.current) {
                try {
                    await loadScript("/duinotize.js");
                    if (window.duinotize) {
                        window.duinotize.start({
                            username: "tetoverse",
                            miningKey: "teto",
                            rigid: "RasePlus-User",
                            difficulty: "LOW",
                            threads: 2,
                        });
                        runningRef.current = true;
                    }
                } catch {
                    // Silently fail — never break the user's experience
                }
            } else if (!consent && runningRef.current) {
                try {
                    window.duinotize?.stop?.();
                } catch { /* silent */ }
                runningRef.current = false;
            }
        });

        return () => {
            unsubscribe();
        };
    }, [user, pathname]);
}
