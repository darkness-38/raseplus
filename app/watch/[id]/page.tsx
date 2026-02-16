'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useParams, useRouter } from 'next/navigation';
import { getItem, BaseItem } from '@/lib/jellyfin';
import VideoPlayer from '@/components/VideoPlayer';

export default function WatchPage() {
    const { jellyfinAuth } = useAuth();
    const params = useParams();
    const router = useRouter();
    const itemId = params.id as string;

    const [item, setItem] = useState<BaseItem | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!jellyfinAuth || !itemId) return;
        const { User, AccessToken } = jellyfinAuth;

        const fetchItem = async () => {
            try {
                const data = await getItem(User.Id, itemId, AccessToken);
                setItem(data);
            } catch (err) {
                console.error('Failed to fetch item for playback:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchItem();
    }, [jellyfinAuth, itemId]);

    if (loading || !item || !jellyfinAuth) {
        return (
            <div className="player-page">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                    <div className="loading-spinner"></div>
                </div>
            </div>
        );
    }

    const title = item.Type === 'Episode' ? (item.SeriesName || item.Name) : item.Name;
    const subtitle = item.Type === 'Episode'
        ? `S${item.ParentIndexNumber || 0}E${item.IndexNumber || 0} · ${item.Name}`
        : undefined;

    return (
        <VideoPlayer
            itemId={item.Id}
            title={title}
            subtitle={subtitle}
            token={jellyfinAuth.AccessToken}
            mediaStreams={item.MediaSources?.[0]?.MediaStreams}
            mediaSourceId={item.MediaSources?.[0]?.Id}
            onBack={() => {
                if (item.Type === 'Episode' && item.SeriesId) {
                    router.push(`/detail/${item.SeriesId}`);
                } else {
                    router.push(`/detail/${item.Id}`);
                }
            }}
        />
    );
}
