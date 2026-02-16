'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getItems, getLatestItems, getResumeItems, BaseItem } from '@/lib/jellyfin';
import HeroBanner from '@/components/HeroBanner';
import ContentRow from '@/components/ContentRow';
import BrandTiles from '@/components/BrandTiles';

const ANIME_LIBRARY_ID = '0c41907140d802bb58430fed7e2cd79e';
const SERIES_LIBRARY_ID = '3148cf0701708325a446ec1751b2b64e';

export default function HomePage() {
  const { jellyfinAuth } = useAuth();
  const [heroItems, setHeroItems] = useState<BaseItem[]>([]);
  const [latestMovies, setLatestMovies] = useState<BaseItem[]>([]);
  const [latestAnime, setLatestAnime] = useState<BaseItem[]>([]);
  const [latestSeries, setLatestSeries] = useState<BaseItem[]>([]);
  const [resumeItems, setResumeItems] = useState<BaseItem[]>([]);
  const [randomMovies, setRandomMovies] = useState<BaseItem[]>([]);
  const [randomAnime, setRandomAnime] = useState<BaseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jellyfinAuth) return;
    const { User, AccessToken } = jellyfinAuth;
    const userId = User.Id;
    const token = AccessToken;

    const fetchData = async () => {
      try {
        const [latestM, latestA, latestS, resume, moviesRandom, animeRandom] = await Promise.all([
          getLatestItems(userId, token, { includeItemTypes: 'Movie', limit: 16 }),
          getItems(userId, token, {
            parentId: ANIME_LIBRARY_ID,
            sortBy: 'DateCreated',
            sortOrder: 'Descending',
            recursive: true,
            fields: 'Overview,Genres,CommunityRating,OfficialRating,ProductionYear',
            includeItemTypes: 'Series,Movie',
            limit: 16,
          }),
          getItems(userId, token, {
            parentId: SERIES_LIBRARY_ID,
            sortBy: 'DateCreated',
            sortOrder: 'Descending',
            recursive: true,
            fields: 'Overview,Genres,CommunityRating,OfficialRating,ProductionYear',
            includeItemTypes: 'Series',
            limit: 16,
          }),
          getResumeItems(userId, token).catch(() => ({ Items: [] })),
          getItems(userId, token, {
            includeItemTypes: 'Movie',
            sortBy: 'Random',
            limit: 16,
            recursive: true,
            fields: 'Overview,Genres,CommunityRating,OfficialRating,ProductionYear',
          }),
          getItems(userId, token, {
            parentId: ANIME_LIBRARY_ID,
            sortBy: 'Random',
            limit: 16,
            recursive: true,
            fields: 'Overview,Genres,CommunityRating,OfficialRating,ProductionYear',
            includeItemTypes: 'Series,Movie',
          }),
        ]);

        setLatestMovies(latestM);
        setLatestAnime(latestA.Items || []);
        setLatestSeries(latestS.Items || []);
        setResumeItems(resume.Items || []);
        setRandomMovies(moviesRandom.Items || []);
        setRandomAnime(animeRandom.Items || []);

        // Pick top 5 hero items from latest movies, anime or series (prefer ones with backdrop)
        const allLatest = [...latestM, ...(latestA.Items || []), ...(latestS.Items || [])];
        const heroPool = allLatest.filter(
          (item) => item.BackdropImageTags && item.BackdropImageTags.length > 0
        );

        // Shuffle array to get random selection each refresh, then take 5
        const shuffled = heroPool.sort(() => 0.5 - Math.random());
        setHeroItems(shuffled.slice(0, 5));
      } catch (err) {
        console.error('Failed to fetch home data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [jellyfinAuth]);

  if (loading) {
    return (
      <div className="loading-state" style={{ minHeight: '100vh' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <HeroBanner items={heroItems} />

      <div style={{ position: 'relative', zIndex: 2, marginTop: '-20px' }}>
        <BrandTiles />

        {resumeItems.length > 0 && (
          <ContentRow title="Continue Watching" items={resumeItems} showYear={false} />
        )}
        <ContentRow title="Latest Movies" items={latestMovies} />
        <ContentRow title="Latest Anime" items={latestAnime} />
        <ContentRow title="Latest Series" items={latestSeries} />
        <ContentRow title="Recommended for You" items={randomMovies} />
        <ContentRow title="Anime Recommendations" items={randomAnime} />
      </div>
    </div>
  );
}
