'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { searchItems, BaseItem } from '@/lib/jellyfin';
import ContentCard from '@/components/ContentCard';

export default function SearchPage() {
    const { jellyfinAuth } = useAuth();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<BaseItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const performSearch = useCallback(async (searchQuery: string) => {
        if (!jellyfinAuth || !searchQuery.trim()) {
            setResults([]);
            setHasSearched(false);
            return;
        }

        setLoading(true);
        setHasSearched(true);
        try {
            const result = await searchItems(jellyfinAuth.User.Id, jellyfinAuth.AccessToken, searchQuery);
            setResults(result.Items || []);
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setLoading(false);
        }
    }, [jellyfinAuth]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query) performSearch(query);
        }, 500);
        return () => clearTimeout(timer);
    }, [query, performSearch]);

    return (
        <div className="container" style={{ paddingTop: '40px', minHeight: '80vh' }}>
            <input
                type="text"
                className="search-input-lg"
                placeholder="Search by title, character, or genre"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                style={{
                    width: '100%',
                    background: '#31343e',
                    border: 'none',
                    fontSize: '28px',
                    fontWeight: 600,
                    color: '#fff',
                    padding: '24px 32px',
                    borderRadius: '8px',
                    marginBottom: '40px',
                    outline: 'none',
                    transition: 'background 0.2s',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                }}
            />

            {loading ? (
                <div style={{ textAlign: 'center', opacity: 0.5 }}>Searching...</div>
            ) : hasSearched && results.length === 0 ? (
                <div style={{ textAlign: 'center', opacity: 0.5 }}>No results found for "{query}"</div>
            ) : hasSearched && results.length > 0 ? (
                <div className="content-grid">
                    {results.map((item) => (
                        <ContentCard key={item.Id} item={item} variant="landscape" />
                    ))}
                </div>
            ) : (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '20px', marginBottom: '20px', color: '#fff' }}>Explore Collections</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                        {['Action', 'Comedy', 'Drama', 'Sci-Fi'].map(g => (
                            <div key={g}
                                onClick={() => setQuery(g)}
                                style={{
                                    background: '#1e2330',
                                    height: '100px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '18px',
                                    border: '2px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                {g}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
