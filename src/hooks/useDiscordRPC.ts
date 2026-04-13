"use client";

import { useEffect, useRef } from "react";

const API_URL = "https://127.0.0.1:3020/update";

export default function useDiscordRPC() {
    useEffect(() => {
        let presenceInterval: NodeJS.Timeout | null = null;

        /**
         * Saniyeyi HH:MM:SS formatına çevirir
         */
        const formatTime = (seconds: number): string => {
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = Math.floor(seconds % 60);

            if (h > 0) {
                return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            }
            return `${m}:${s.toString().padStart(2, '0')}`;
        };

        /**
         * RPC verisini yerel sunucuya gönderir
         */
        const sendPresence = () => {
            const video = document.querySelector('video');

            // Video yoksa veya duraklatılmışsa işlem yapma
            if (!video || video.paused) return;

            const rawTitle = document.title;
            const cleanTitle = rawTitle.replace(/ - RasePlus$/, '').trim();

            const remainingSeconds = Math.floor(video.duration - video.currentTime);
            const endTime = Math.floor(Date.now() / 1000) + remainingSeconds;

            const state = `İzleniyor · ${formatTime(remainingSeconds)} kaldı`;

            const payload = {
                title: cleanTitle,
                state: state,
                end_time: endTime
            };

            fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(() => {
                // Sessiz hata yönetimi
            });
        };

        /**
         * Video durdurulduğunda RPC'yi sıfırlar
         */
        const clearPresence = () => {
            fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: "",
                    state: "Duraklatıldı",
                    end_time: 0
                })
            }).catch(() => {});
        };

        const handlePlay = () => {
            if (!presenceInterval) {
                sendPresence(); // Hemen gönder
                presenceInterval = setInterval(sendPresence, 15000);
            }
        };

        const handlePause = () => {
            if (presenceInterval) {
                clearInterval(presenceInterval);
                presenceInterval = null;
                clearPresence();
            }
        };

        const video = document.querySelector('video');
        if (video) {
            video.addEventListener('play', handlePlay);
            video.addEventListener('pause', handlePause);

            // Başlangıç durumu
            if (!video.paused) {
                handlePlay();
            }
        }

        // Cleanup
        return () => {
            if (video) {
                video.removeEventListener('play', handlePlay);
                video.removeEventListener('pause', handlePause);
            }
            if (presenceInterval) {
                clearInterval(presenceInterval);
            }
        };
    }, []);
}
