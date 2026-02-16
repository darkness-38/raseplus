'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
    { href: '/', icon: 'home', label: 'Home' },
    { href: '/movies', icon: 'movie', label: 'Movies' },
    { href: '/series', icon: 'tv', label: 'Series' },
    { href: '/search', icon: 'search', label: 'Search' },
];

export default function MobileNav() {
    const pathname = usePathname();

    return (
        <nav style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: '#090b13',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            justifyContent: 'space-around',
            padding: '8px 0',
            zIndex: 100,
            // Hide on large screens if desired, but for now we rely on user agent or CSS media queries if we added them
            // In globals.css we might want to add a media query to hide this on desktop
        }} className="mobile-nav-container">
            {/* We can use a class and safe-guard it in CSS media queries later if needed */}

            {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                            fontSize: '10px',
                            gap: '4px',
                            textDecoration: 'none'
                        }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                            {item.icon}
                        </span>
                        <span>{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
