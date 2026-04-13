import { useEffect } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';

export default function useDiscordRPC() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const updatePresence = async () => {
      const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
      if (!apiKey) return;

      const videoId = searchParams.get('video_id') || pathname.split('/').pop();
      const season = searchParams.get('s');
      const episode = searchParams.get('e');

      if (!videoId || videoId === 'watch') return;

      let rpcTitle = "Browsing RasePlus";
      let rpcState = "Waiting for Video";

      try {
        if (season && episode) {
          // Dizi / Anime mantığı (İngilizce)
          const tvRes = await fetch(`https://api.themoviedb.org/3/tv/${videoId}?api_key=${apiKey}&language=en-US`);
          const tvData = await tvRes.json();
          
          if (tvData.name) {
            rpcTitle = tvData.name;
            rpcState = `Season ${season} Episode ${episode}`;
          }
        } else {
          // Film mantığı (İngilizce)
          const movieRes = await fetch(`https://api.themoviedb.org/3/movie/${videoId}?api_key=${apiKey}&language=en-US`);
          const movieData = await movieRes.json();

          if (movieData.title) {
            rpcTitle = movieData.title;
            rpcState = `Movie`;
          }
        }

        // Python sunucusuna istek (end_time: 0 göndererek sayacı kapatıyoruz)
        await fetch("https://127.0.0.1:3020/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: rpcTitle,
            state: rpcState,
            end_time: 0 
          })
        }).catch(() => {}); 

      } catch (error) {
        // Hata durumunda sessiz kal
      }
    };

    updatePresence();
    interval = setInterval(updatePresence, 60000);

    return () => clearInterval(interval);
  }, [pathname, searchParams]);
}
