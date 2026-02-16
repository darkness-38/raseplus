'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const navItems = [
    { href: '/', label: 'Home', icon: 'home' },
    { href: '/search', label: 'Search', icon: 'search' },
    { href: '/movies', label: 'Movies', icon: 'movie' },
    { href: '/series', label: 'Series', icon: 'tv' },
    { href: '/anime', label: 'Anime', icon: 'smart_display' },
];

export default function Navbar() {
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = useState(false);

    // Scroll effect for transparent -> solid background
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 10) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`navbar ${isScrolled ? 'navbar--scrolled' : ''}`}>
            <div className="navbar__inner">
                {/* Logo */}
                <Link href="/" className="navbar__logo">
                    <img
                        src="/rase-plus-logo.png"
                        alt="Rase+"
                        className="navbar__logo-img"
                        onError={(e) => {
                            // Fallback if image fails (using text)
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerHTML = '<span style="font-weight: 800; font-size: 24px;">RASE+</span>';
                        }}
                    />
                </Link>

                {/* Navigation Links */}
                <div className="navbar__links">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`navbar__link ${isActive ? 'navbar__link--active' : ''}`}
                            >
                                {/* Minimal SVG icons or just text. Disney+ often uses just text with icons for Search/Home */}
                                {/* We'll use just text as per core design, maybe icon for Home/Search if needed */}
                                {item.icon === 'home' && (
                                    <svg className="navbar__icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L4 9v12h5v-7h6v7h5V9l-8-6z" /></svg>
                                )}
                                {item.icon === 'search' && (
                                    <svg className="navbar__icon" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
                                )}
                                {item.icon !== 'home' && item.icon !== 'search' && (
                                    // Spacing for non-icon items
                                    <span>{item.label}</span>
                                )}
                                {(item.icon === 'home' || item.icon === 'search') && (
                                    <span style={{ marginLeft: 4 }}>{item.label}</span>
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Profile / Logout */}
                {/* Profile / Logout removed as per "no accounts" request */}
                {/* <div className="navbar__profile" onClick={() => logout()}>
                    <div className="navbar__avatar" title={user?.displayName || 'User'}>
                        {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                </div> */}
            </div>
        </nav>
    );
}
