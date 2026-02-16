'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getItems, BaseItem } from '@/lib/jellyfin';
import ContentCard from '@/components/ContentCard';

const SORT_OPTIONS = [
    { value: 'SortName', label: 'A-Z' },
    { value: 'DateCreated', label: 'Newest' },
    { value: 'CommunityRating', label: 'Top Rated' },
    { value: 'ProductionYear', label: 'Year' },
];

export default function MoviesPage() {
    const { jellyfinAuth } = useAuth();
    const [movies, setMovies] = useState<BaseItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('DateCreated');

    useEffect(() => {
        if (!jellyfinAuth) return;
        const { User, AccessToken } = jellyfinAuth;

        const fetchMovies = async () => {
            setLoading(true);
            try {
                const result = await getItems(User.Id, AccessToken, {
                    includeItemTypes: 'Movie',
                    sortBy: sortBy,
                    sortOrder: sortBy === 'SortName' ? 'Ascending' : 'Descending',
                    recursive: true,
                    fields: 'Overview,Genres,CommunityRating,ProductionYear,ImageTags',
                    limit: 100,
                });
                setMovies(result.Items || []);
            } catch (err) {
                console.error('Failed to fetch movies:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchMovies();
    }, [jellyfinAuth, sortBy]);

    return (
        <div className="container" style={{ paddingTop: '20px' }}>
            <div className="page-header">
                <h1 className="page-title">Movies</h1>

                {/* Filters - Simple Row */}
                <div style={{ display: 'flex', gap: '12px' }}>
                    {SORT_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setSortBy(opt.value)}
                            style={{
                                color: sortBy === opt.value ? '#fff' : 'rgba(255,255,255,0.5)',
                                fontWeight: 700,
                                fontSize: '14px',
                                textTransform: 'uppercase',
                                borderBottom: sortBy === opt.value ? '2px solid #fff' : '2px solid transparent',
                                paddingBottom: '4px'
                            }}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading...</div>
            ) : movies.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>No movies found.</div>
            ) : (
                <div className="content-grid">
                    {movies.map((movie) => (
                        <ContentCard key={movie.Id} item={movie} variant="portrait" />
                    ))}
                </div>
            )}
        </div>
    );
}
