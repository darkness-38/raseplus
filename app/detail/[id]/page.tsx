'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
    getItem, getSeasons, getEpisodes, getSimilarItems,
    getImageUrl, ticksToTime, BaseItem
} from '@/lib/jellyfin';
import ContentRow from '@/components/ContentRow';

export default function DetailPage() {
    const { jellyfinAuth } = useAuth();
    const params = useParams();
    const itemId = params.id as string;

    const [item, setItem] = useState<BaseItem | null>(null);
    const [seasons, setSeasons] = useState<BaseItem[]>([]);
    const [episodes, setEpisodes] = useState<BaseItem[]>([]);
    const [selectedSeason, setSelectedSeason] = useState<string>('');
    const [similar, setSimilar] = useState<BaseItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!jellyfinAuth || !itemId) return;
        const { User, AccessToken } = jellyfinAuth;

        const fetchItem = async () => {
            setLoading(true);
            try {
                const data = await getItem(User.Id, itemId, AccessToken);
                setItem(data);

                if (data.Type === 'Series') {
                    const seasonsResult = await getSeasons(itemId, User.Id, AccessToken);
                    setSeasons(seasonsResult.Items || []);
                    if (seasonsResult.Items && seasonsResult.Items.length > 0) {
                        const firstSeason = seasonsResult.Items[0];
                        setSelectedSeason(firstSeason.Id);
                        const epsResult = await getEpisodes(itemId, firstSeason.Id, User.Id, AccessToken);
                        setEpisodes(epsResult.Items || []);
                    }
                }

                const similarResult = await getSimilarItems(itemId, User.Id, AccessToken);
                setSimilar(similarResult.Items || []);
            } catch (err) {
                console.error('Failed to fetch item:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchItem();
    }, [jellyfinAuth, itemId]);

    const handleSeasonChange = async (seasonId: string) => {
        if (!jellyfinAuth || !itemId) return;
        setSelectedSeason(seasonId);
        try {
            const epsResult = await getEpisodes(itemId, seasonId, jellyfinAuth.User.Id, jellyfinAuth.AccessToken);
            setEpisodes(epsResult.Items || []);
        } catch (err) {
            console.error('Failed to fetch episodes:', err);
        }
    };

    if (loading || !item) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
    }

    const hasBackdrop = item.BackdropImageTags && item.BackdropImageTags.length > 0;
    const backdropUrl = hasBackdrop ? getImageUrl(item.Id, 'Backdrop', { maxWidth: 1920, quality: 85 }) : null;
    const hasLogo = item.ImageTags && item.ImageTags.Logo;
    const logoUrl = hasLogo ? getImageUrl(item.Id, 'Logo', { maxWidth: 500, quality: 90 }) : null;

    return (
        <div style={{ position: 'relative', minHeight: '100vh', paddingBottom: '60px' }}>
            {/* Backdrop */}
            <div className="detail-backdrop">
                <div
                    className="detail-backdrop-img"
                    style={backdropUrl ? { backgroundImage: `url(${backdropUrl})` } : { backgroundColor: '#1a1d29' }}
                />
            </div>

            <div className="detail-container">
                <div className="detail-content">
                    {/* Logo or Title */}
                    {logoUrl ? (
                        <img src={logoUrl} alt={item.Name} className="detail-logo" />
                    ) : (
                        <h1 className="detail-title">{item.Name}</h1>
                    )}

                    <div className="detail-meta">
                        {item.ProductionYear && <span>{item.ProductionYear}</span>}
                        {item.RunTimeTicks && <span>• {ticksToTime(item.RunTimeTicks)}</span>}
                        {item.Genres && <span>• {item.Genres.join(', ')}</span>}
                        {item.OfficialRating && (
                            <span style={{ border: '1px solid #999', padding: '0 4px', borderRadius: '4px', fontSize: '12px' }}>
                                {item.OfficialRating}
                            </span>
                        )}
                        {item.CommunityRating && <span style={{ color: '#f6c700' }}>★ {item.CommunityRating.toFixed(1)}</span>}
                    </div>

                    <div className="detail-actions">
                        <Link
                            href={item.Type === 'Movie' ? `/watch/${item.Id}` : (episodes.length > 0 ? `/watch/${episodes[0].Id}` : '#')}
                            className="hero__btn hero__btn--play"
                            style={{ textDecoration: 'none', color: '#000' }}
                        >
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                            <span>PLAY</span>
                        </Link>
                        {/* Trailer button could go here */}
                    </div>

                    <p className="detail-overview">{item.Overview}</p>

                    {/* Series Episodes */}
                    {item.Type === 'Series' && seasons.length > 0 && (
                        <div style={{ marginTop: '40px', maxWidth: '800px' }}>
                            <div className="content-row__header" style={{ marginBottom: '20px' }}>
                                <h2 className="content-row__title">Episodes</h2>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                                    {seasons.map((season) => (
                                        <button
                                            key={season.Id}
                                            onClick={() => handleSeasonChange(season.Id)}
                                            style={{
                                                background: selectedSeason === season.Id ? '#fff' : 'rgba(255,255,255,0.1)',
                                                color: selectedSeason === season.Id ? '#000' : '#fff',
                                                border: 'none',
                                                padding: '8px 16px',
                                                borderRadius: '20px',
                                                fontWeight: 'bold',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {season.Name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {episodes.map((ep) => {
                                    const epImg = ep.ImageTags?.Primary ? getImageUrl(ep.Id, 'Primary', { maxWidth: 300 }) : null;
                                    return (
                                        <Link href={`/watch/${ep.Id}`} key={ep.Id}
                                            style={{
                                                display: 'flex',
                                                gap: '20px',
                                                padding: '16px',
                                                background: 'rgba(255,255,255,0.05)',
                                                borderRadius: '8px',
                                                textDecoration: 'none',
                                                color: '#fff',
                                                alignItems: 'center'
                                            }}
                                            className="episode-item"
                                        >
                                            <div style={{ width: '160px', aspectRatio: '16/9', flexShrink: 0, borderRadius: '4px', overflow: 'hidden', background: '#000' }}>
                                                {epImg && <img src={epImg} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>{ep.IndexNumber}. {ep.Name}</div>
                                                <div style={{ fontSize: '13px', color: '#999', marginBottom: '8px' }}>{ep.RunTimeTicks ? ticksToTime(ep.RunTimeTicks) : ''}</div>
                                                <p style={{ fontSize: '14px', color: '#ccc', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>
                                                    {ep.Overview}
                                                </p>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Similar Items */}
                    {similar.length > 0 && (
                        <div style={{ marginTop: '60px' }}>
                            <ContentRow title="Suggested" items={similar} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Add hover effect via simple inline style wrapper or css module?
// CSS in globals.css is generally cleaner, but we added "episode-item" class so we can style it in globals.css if we want.
// For now inline is fine for structure, hover effect is a nice to have.
