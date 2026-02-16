'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getItems, BaseItem } from '@/lib/jellyfin';
import ContentCard from '@/components/ContentCard';

const ANIME_LIBRARY_ID = '0c41907140d802bb58430fed7e2cd79e';

export default function AnimePage() {
    const { jellyfinAuth } = useAuth();
    const [items, setItems] = useState<BaseItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!jellyfinAuth) return;
        const { User, AccessToken } = jellyfinAuth;

        const fetchAnime = async () => {
            setLoading(true);
            try {
                const result = await getItems(User.Id, AccessToken, {
                    parentId: ANIME_LIBRARY_ID,
                    sortBy: 'DateCreated',
                    sortOrder: 'Descending',
                    recursive: true,
                    fields: 'Overview,Genres,CommunityRating,ProductionYear,ImageTags',
                    limit: 100,
                    includeItemTypes: 'Series,Movie'
                });
                setItems(result.Items || []);
            } catch (err) {
                console.error('Failed to fetch anime:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnime();
    }, [jellyfinAuth]);

    return (
        <div className="container" style={{ paddingTop: '20px' }}>
            <div className="page-header">
                <h1 className="page-title">Anime</h1>
            </div>

            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading...</div>
            ) : items.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>No anime found.</div>
            ) : (
                <div className="content-grid">
                    {items.map((item) => (
                        <ContentCard key={item.Id} item={item} variant="portrait" />
                    ))}
                </div>
            )}
        </div>
    );
}
