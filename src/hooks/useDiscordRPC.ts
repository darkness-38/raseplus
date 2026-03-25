"use client";

import { useEffect, useRef, useCallback } from "react";

type Action = { action: "izliyor"; movieName: string } | { action: "durdu" };

export function useDiscordRPC() {
    const wsRef = useRef<WebSocket | null>(null);
    const lastActionRef = useRef<Action | null>(null);

    useEffect(() => {
        const connect = () => {
            try {
                const ws = new WebSocket("ws://127.0.0.1:8080");
                
                // Silent handlers for missing connection/desktop app
                ws.onerror = () => { /* silent */ };
                ws.onclose = () => { /* silent */ };
                
                ws.onopen = () => {
                    // If an action was requested before connection opened, send it now
                    if (lastActionRef.current) {
                        ws.send(JSON.stringify(lastActionRef.current));
                    }
                };
                
                wsRef.current = ws;
            } catch (e) {
                // silent
            }
        };

        if (typeof window !== "undefined") {
            connect();
        }

        return () => {
            if (wsRef.current) {
                if (wsRef.current.readyState === WebSocket.OPEN) {
                    // Automatically send a stop event when unmounting
                    wsRef.current.send(JSON.stringify({ action: "durdu" }));
                }
                wsRef.current.close();
            }
        };
    }, []);

    const sendPlay = useCallback((movieName: string) => {
        const payload: Action = { action: "izliyor", movieName };
        lastActionRef.current = payload;
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(payload));
        }
    }, []);

    const sendStop = useCallback(() => {
        const payload: Action = { action: "durdu" };
        lastActionRef.current = payload;
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(payload));
        }
    }, []);

    return { onPlay: sendPlay, onPause: sendStop, onEnded: sendStop, sendStop };
}
