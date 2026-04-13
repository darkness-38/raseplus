(function () {
    let presenceInterval = null;
    const API_URL = "http://127.0.0.1:3020/update";

    /**
     * Saniyeyi HH:MM:SS formatına çevirir
     */
    function formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        
        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    /**
     * RPC verisini yerel sunucuya gönderir
     */
    function sendPresence() {
        const video = document.querySelector('video');
        
        // Video yoksa veya duraklatılmışsa işlem yapma (play/pause eventleri zaten yönetiyor)
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
    }

    /**
     * Video durdurulduğunda RPC'yi sıfırlar
     */
    function clearPresence() {
        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: "",
                state: "Duraklatıldı",
                end_time: 0
            })
        }).catch(() => {});
    }

    /**
     * Event listener'ları ve interval'i başlatır
     */
    function init() {
        const video = document.querySelector('video');
        if (!video) {
            // Video henüz yüklenmemiş olabilir, bir süre sonra tekrar dene
            setTimeout(init, 2000);
            return;
        }

        video.addEventListener('play', () => {
            if (!presenceInterval) {
                sendPresence(); // Hemen gönder
                presenceInterval = setInterval(sendPresence, 15000);
            }
        });

        video.addEventListener('pause', () => {
            if (presenceInterval) {
                clearInterval(presenceInterval);
                presenceInterval = null;
                clearPresence();
            }
        });

        // Sayfa yüklendiğinde video zaten oynuyorsa başlat
        if (!video.paused) {
            sendPresence();
            presenceInterval = setInterval(sendPresence, 15000);
        }
    }

    // Başlat
    if (document.readyState === 'complete') {
        init();
    } else {
        window.addEventListener('load', init);
    }
})();
