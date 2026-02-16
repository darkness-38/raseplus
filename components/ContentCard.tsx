'use client';
import Link from 'next/link';
import { BaseItem, getImageUrl } from '@/lib/jellyfin';

interface ContentCardProps {
    item: BaseItem;
    showYear?: boolean;
    variant?: 'portrait' | 'landscape'; // 'portrait' for grids, 'landscape' for home rows
}

export default function ContentCard({ item, showYear = true, variant = 'landscape' }: ContentCardProps) {
    const hasPoster = item.ImageTags && item.ImageTags.Primary;
    const hasBackdrop = item.BackdropImageTags && item.BackdropImageTags.length > 0;

    // Determine image URL based on variant
    let imageUrl = null;
    if (variant === 'landscape') {
        // Landscape favors backdrop, falls back to poster
        imageUrl = hasBackdrop
            ? getImageUrl(item.Id, 'Backdrop', { maxWidth: 600, quality: 85 })
            : (hasPoster ? getImageUrl(item.Id, 'Primary', { maxWidth: 400, quality: 90 }) : null);
    } else {
        // Portrait favors poster
        imageUrl = hasPoster
            ? getImageUrl(item.Id, 'Primary', { maxWidth: 400, quality: 90 })
            : null;
    }

    const linkHref = item.Type === 'Episode'
        ? `/watch/${item.Id}`
        : `/detail/${item.Id}`;

    return (
        <Link
            href={linkHref}
            className={`content-card ${variant === 'landscape' ? 'content-card--landscape' : 'content-card--portrait'}`}
        >
            {imageUrl ? (
                <img src={imageUrl} alt={item.Name} className="content-card__img" loading="lazy" />
            ) : (
                <div className="card-placeholder" style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#1a1d29'
                }}>
                    <span style={{ fontSize: '24px', opacity: 0.5 }}>
                        {item.Name.charAt(0)}
                    </span>
                </div>
            )}

            <div className="content-card__overlay">
                <div className="content-card__title">{item.Name}</div>
                {(showYear && item.ProductionYear) && (
                    <div className="content-card__meta">{item.ProductionYear}</div>
                )}
            </div>
        </Link>
    );
}
