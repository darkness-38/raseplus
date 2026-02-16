'use client';
import { BaseItem } from '@/lib/jellyfin';
import ContentCard from './ContentCard';
import { useRef, useState, useEffect } from 'react';

interface ContentRowProps {
    title: string;
    items: BaseItem[];
    showYear?: boolean;
    isLandscape?: boolean; // New prop to control card orientation in this row
}

export default function ContentRow({ title, items, showYear = true, isLandscape = true }: ContentRowProps) {
    const sliderRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    if (!items || items.length === 0) return null;

    const scroll = (direction: 'left' | 'right') => {
        if (sliderRef.current) {
            const scrollAmount = direction === 'left' ? -800 : 800;
            sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    const handleScroll = () => {
        if (sliderRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
            setShowLeftArrow(scrollLeft > 0);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    useEffect(() => {
        // Check initial state
        handleScroll();
        // Add listener
        const slider = sliderRef.current;
        if (slider) {
            slider.addEventListener('scroll', handleScroll);
            return () => slider.removeEventListener('scroll', handleScroll);
        }
    }, [items]);

    return (
        <section className="content-row">
            <div className="content-row__header">
                <h2 className="content-row__title">{title}</h2>
            </div>

            <div className="content-row__container">
                {showLeftArrow && (
                    <button
                        className="content-row__arrow content-row__arrow--left"
                        onClick={() => scroll('left')}
                        aria-label="Scroll left"
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg>
                    </button>
                )}

                <div className="content-row__slider" ref={sliderRef}>
                    {items.map((item) => (
                        <ContentCard
                            key={item.Id}
                            item={item}
                            showYear={showYear}
                            // Default to landscape for rows on home page as per Disney+ design
                            variant={isLandscape ? 'landscape' : 'portrait'}
                        />
                    ))}
                </div>

                {showRightArrow && (
                    <button
                        className="content-row__arrow content-row__arrow--right"
                        onClick={() => scroll('right')}
                        aria-label="Scroll right"
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg>
                    </button>
                )}
            </div>
        </section>
    );
}
