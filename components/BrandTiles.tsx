'use client';
import Link from 'next/link';

// We can map these to search queries or specific pages
const brands = [
    { id: 'disney', label: 'Disney', video: '/videos/disney-hover.mp4', img: '/images/viewers-disney.png', bg: 'linear-gradient(135deg, #0a1030 0%, #1a2a5c 50%, #0a1a40 100%)' },
    { id: 'pixar', label: 'Pixar', video: '/videos/pixar-hover.mp4', img: '/images/viewers-pixar.png', bg: 'linear-gradient(135deg, #0a1a2e 0%, #1a3a5c 50%, #0a2a4e 100%)' },
    { id: 'marvel', label: 'Marvel', video: '/videos/marvel-hover.mp4', img: '/images/viewers-marvel.png', bg: 'linear-gradient(135deg, #1a0a0a 0%, #3d0c0c 50%, #5a1010 100%)' },
    { id: 'starwars', label: 'Star Wars', video: '/videos/star-wars-hover.mp4', img: '/images/viewers-starwars.png', bg: 'linear-gradient(135deg, #0c0d14 0%, #1c1f2e 50%, #2a1f3d 100%)' },
    { id: 'natgeo', label: 'National Geographic', video: '/videos/national-geographic-hover.mp4', img: '/images/viewers-nationalGeographic.png', bg: 'linear-gradient(135deg, #081404 0%, #1a2e10 50%, #0c2008 100%)' },
];

export default function BrandTiles() {
    return (
        <div className="brands">
            {brands.map((brand) => (
                <Link
                    href={`/search?q=${brand.label}`} // Simple linking to search for now, or could link to collection pages if we had them
                    key={brand.id}
                    className="brand-tile"
                    style={{ background: brand.bg }}
                >
                    {/* Video would go here if we had the assets, using empty div for hover effect placeholder from CSS */}
                    <div className="brand-tile__video" style={{ background: 'rgba(255,255,255,0.1)' }}></div>

                    {/* Logo Placeholder (Text for now since we don't have the assets uploaded yet) */}
                    <span
                        className="brand-tile__logo"
                        style={{
                            color: '#fff',
                            fontSize: '18px',
                            fontWeight: 800,
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                            textAlign: 'center'
                        }}
                    >
                        {brand.label}
                    </span>
                </Link>
            ))}
        </div>
    );
}
