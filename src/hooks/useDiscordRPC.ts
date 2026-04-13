"use client";

import { useEffect, useRef } from "react";

type Action = 
    | { action: "izliyor"; movieName: string; type: string; season?: string | number; episode?: string | number; currentTime?: number; duration?: number } 
    | { action: "durdu" };

export function useDiscordRPC() {
    const rpcWsUrl = process.env.NEXT_PUBLIC_RPC_WS_URL || "ws://127.0.0.1:8080";
    const wsRef = useRef<WebSocket | null>(null);
    const lastActionRef = useRef<Action | null>(null);
    const reconnectTimerRef = useRef<number | null>(null);
    const reconnectAttemptRef = useRef(0);
    const isUnmountingRef = useRef(false);

    const clearReconnectTimer = () => {
        if (reconnectTimerRef.current !== null && typeof window !== "undefined") {
            window.clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
    };

    const scheduleReconnect = () => {
        if (isUnmountingRef.current || typeof window === "undefined") return;
        clearReconnectTimer();
        const attempt = reconnectAttemptRef.current;
        const delay = Math.min(10000, 1000 * Math.pow(2, attempt));
        reconnectAttemptRef.current += 1;
        reconnectTimerRef.current = window.setTimeout(() => {
            connect();
        }, delay);
    };

    const flushLastAction = (ws: WebSocket) => {
        if (lastActionRef.current && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(lastActionRef.current));
        }
    };

    const connect = () => {
        if (typeof window === "undefined" || isUnmountingRef.current) return;
        if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
            return;
        }

        try {
            const ws = new WebSocket(rpcWsUrl);

            ws.onopen = () => {
                reconnectAttemptRef.current = 0;
                flushLastAction(ws);
            };

            ws.onerror = () => {
                scheduleReconnect();
            };

            ws.onclose = () => {
                if (wsRef.current === ws) {
                    wsRef.current = null;
                }
                scheduleReconnect();
            };

            wsRef.current = ws;
        } catch {
            scheduleReconnect();
        }
    };

    const sendOrQueue = (payload: Action) => {
        lastActionRef.current = payload;
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(payload));
            return;
        }
        connect();
    };

    useEffect(() => {
        isUnmountingRef.current = false;
        connect();

        return () => {
            isUnmountingRef.current = true;
            clearReconnectTimer();
            if (wsRef.current) {
                if (wsRef.current.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({ action: "durdu" }));
                }
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, []);

    const sendPlay = (movieName: string, type: string, season?: string | number, episode?: string | number, currentTime?: number, duration?: number) => {
        const payload: Action = { action: "izliyor", movieName, type, season, episode, currentTime, duration };
        sendOrQueue(payload);
    };

    const sendStop = () => {
        const payload: Action = { action: "durdu" };
        sendOrQueue(payload);
    };

    return { onPlay: sendPlay, onPause: sendStop, onEnded: sendStop, sendStop };
}
