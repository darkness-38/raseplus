'use client';
import Link from 'next/link';
import { BaseItem, getImageUrl, ticksToTime } from '@/lib/jellyfin';
import { useState, useEffect } from 'react';

interface HeroBannerProps {
    items: BaseItem[];
}

export default function HeroBanner({ items }: HeroBannerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Auto-rotate every 10 seconds
    useEffect(() => {
        if (!items || items.length === 0) return;

        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
        }, 10000);

        return () => clearInterval(interval);
    }, [items]);

    const handleDotClick = (index: number) => {
        setCurrentIndex(index);
    };

    if (!items || items.length === 0) {
        return (
            <div className="hero">
                <div className="hero__backdrop" style={{ background: 'linear-gradient(135deg, #0a0a12, #08080d)' }}></div>
            </div>
        );
    }

    // Determine current item to show
    // We render all items stacked absolute, managing opacity
    return (
        <div className="hero">
            {items.map((item, index) => {
                const isActive = index === currentIndex;
                const hasBackdrop = item.BackdropImageTags && item.BackdropImageTags.length > 0;
                const backdropUrl = hasBackdrop
                    ? getImageUrl(item.Id, 'Backdrop', { maxWidth: 1920, quality: 90 })
                    : null;
                const hasLogo = item.ImageTags && item.ImageTags.Logo;
                const logoUrl = hasLogo ? getImageUrl(item.Id, 'Logo', { maxWidth: 500, quality: 90 }) : null;

                return (
                    <div
                        key={item.Id}
                        className={`hero-slide ${isActive ? 'hero-slide--active' : ''}`}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            opacity: isActive ? 1 : 0,
                            transition: 'opacity 1s ease-in-out',
                            zIndex: isActive ? 2 : 1,
                            pointerEvents: isActive ? 'auto' : 'none'
                        }}
                    >
                        <div className="hero__backdrop">
                            {backdropUrl && (
                                <img
                                    src={backdropUrl}
                                    alt={item.Name}
                                    className="hero__backdrop-img"
                                />
                            )}
                            <div className="hero__gradient"></div>
                        </div>

                        <div className="hero__content">
                            <div className="hero__content-inner">
                                {logoUrl ? (
                                    <img
                                        src={logoUrl}
                                        alt={item.Name}
                                        className="hero__logo"
                                    />
                                ) : (
                                    <h1 className="hero__title">{item.Name}</h1>
                                )}

                                <div className="hero__meta">
                                    {item.ProductionYear && <span>{item.ProductionYear}</span>}
                                    {item.RunTimeTicks && (
                                        <>
                                            <span>•</span>
                                            <span>{ticksToTime(item.RunTimeTicks)}</span>
                                        </>
                                    )}
                                    {item.Genres && item.Genres.length > 0 && (
                                        <>
                                            <span>•</span>
                                            <span>{item.Genres[0]}</span>
                                        </>
                                    )}
                                    {item.OfficialRating && (
                                        <span style={{
                                            border: '1px solid rgba(255,255,255,0.4)',
                                            padding: '0 4px',
                                            borderRadius: '2px',
                                            marginLeft: '8px',
                                            fontSize: '12px'
                                        }}>
                                            {item.OfficialRating}
                                        </span>
                                    )}
                                    {item.CommunityRating && (
                                        <span style={{ marginLeft: '8px', color: '#f6c700' }}>
                                            ★ {item.CommunityRating.toFixed(1)}
                                        </span>
                                    )}
                                </div>

                                {item.Overview && (
                                    <p className="hero__desc">{item.Overview}</p>
                                )}

                                <div className="hero__actions">
                                    <Link
                                        href={item.Type === 'Movie' ? `/watch/${item.Id}` : `/detail/${item.Id}`}
                                        className="hero__btn hero__btn--play"
                                    >
                                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                        <span>Oynat</span>
                                    </Link>

                                    <Link
                                        href={`/detail/${item.Id}`}
                                        className="hero__btn hero__btn--secondary"
                                    >
                                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                                        </svg>
                                        <span>Detaylar</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Dots Indicator */}
            <div className="hero-dots" style={{
                position: 'absolute',
                bottom: '20px',
                right: '40px', // Right side as requested (or "sağ altta")
                zIndex: 10,
                display: 'flex',
                gap: '10px'
            }}>
                {items.map((_, index) => (
                    <div
                        key={index}
                        onClick={() => handleDotClick(index)}
                        style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: index === currentIndex ? '#fff' : 'rgba(255,255,255,0.3)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            transform: index === currentIndex ? 'scale(1.2)' : 'scale(1)'
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
