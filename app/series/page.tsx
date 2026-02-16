'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getItems, BaseItem } from '@/lib/jellyfin';
import ContentCard from '@/components/ContentCard';

const SERIES_LIBRARY_ID = '3148cf0701708325a446ec1751b2b64e';

export default function SeriesPage() {
    const { jellyfinAuth } = useAuth();
    const [series, setSeries] = useState<BaseItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!jellyfinAuth) return;
        const { User, AccessToken } = jellyfinAuth;

        const fetchSeries = async () => {
            setLoading(true);
            try {
                const result = await getItems(User.Id, AccessToken, {
                    parentId: SERIES_LIBRARY_ID,
                    sortBy: 'DateCreated',
                    sortOrder: 'Descending',
                    recursive: true,
                    fields: 'Overview,Genres,CommunityRating,ProductionYear,ImageTags',
                    limit: 100,
                    includeItemTypes: 'Series'
                });
                setSeries(result.Items || []);
            } catch (err) {
                console.error('Failed to fetch series:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSeries();
    }, [jellyfinAuth]);

    return (
        <div className="container" style={{ paddingTop: '20px' }}>
            <div className="page-header">
                <h1 className="page-title">Series</h1>
            </div>

            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading...</div>
            ) : series.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>No series found.</div>
            ) : (
                <div className="content-grid">
                    {series.map((item) => (
                        <ContentCard key={item.Id} item={item} variant="portrait" />
                    ))}
                </div>
            )}
        </div>
    );
}
