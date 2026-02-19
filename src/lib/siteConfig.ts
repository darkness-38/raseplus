import { db } from "@/lib/firebase";
import { ref, onValue, update, get } from "firebase/database";
import { useState, useEffect } from "react";

/* ─── Schema ─── */

export interface BenefitItem {
    title: string;
    desc: string;
    img: string;
}

export interface PlanItem {
    name: string;
    price: string;
    period: string;
    features: string[];
    highlighted: boolean;
    badge?: string;
}

export interface FaqItem {
    q: string;
    a: string;
}

export interface NavLink {
    label: string;
    href: string;
}

export interface SocialLink {
    platform: string;
    handle: string;
    url: string;
}

export interface FooterColumn {
    title: string;
    links: { label: string; href: string }[];
}

export interface SiteConfig {
    siteName: string;
    logoUrl: string;
    accentColor: string;

    /* ─── Theme Colors ─── */
    theme: {
        bgColor: string;
        surfaceColor: string;
        textPrimary: string;
        textSecondary: string;
        textMuted: string;
    };

    /* ─── Navbar ─── */
    navbar: {
        links: NavLink[];
        loginButtonText: string;
        registerButtonText: string;
    };

    /* ─── Landing Page ─── */
    landing: {
        heroTitle: string;
        heroSubtitle: string;
        heroImage: string;
        ctaText: string;
        secondaryCtaText: string;

        partnersLabel: string;

        benefitsTitle: string;
        benefitsHighlight: string;
        benefitsSubtitle: string;
        benefits: BenefitItem[];

        plansTitle: string;
        plansHighlight: string;
        plansSubtitle: string;
        plans: PlanItem[];

        faqTitle: string;
        faqHighlight: string;
        faqs: FaqItem[];

        moviesTitle: string;
        moviesHighlight: string;
        moviesSubtitle: string;
        moviesCta: string;
    };

    /* ─── Auth Pages ─── */
    auth: {
        loginTitle: string;
        loginSubtitle: string;
        registerTitle: string;
        registerSubtitle: string;
    };

    /* ─── Profiles Page ─── */
    profiles: {
        title: string;
        addButtonText: string;
    };

    /* ─── Browse Pages (post-login) ─── */
    browse: {
        loadingText: string;
        /* Home page content rows */
        continueWatchingTitle: string;
        trendingAnimeTitle: string;
        popularMoviesTitle: string;
        latestSeriesTitle: string;
        /* Anime page */
        animePageTitle: string;
        animePageSubtitle: string;
        topRatedAnimeTitle: string;
        allAnimeTitle: string;
        /* Movies page */
        moviesPageTitle: string;
        moviesPageSubtitle: string;
        topRatedMoviesTitle: string;
        allMoviesTitle: string;
        /* Series page */
        seriesPageTitle: string;
        seriesPageSubtitle: string;
        topRatedSeriesTitle: string;
        allSeriesTitle: string;
    };

    /* ─── Footer ─── */
    footer: {
        description: string;
        copyright: string;
        columns: FooterColumn[];
        socials: SocialLink[];
        supportButtonText: string;
    };
}

/* ─── Defaults (current hardcoded content) ─── */

export const DEFAULT_CONFIG: SiteConfig = {
    siteName: "Rase+",
    logoUrl: "/logo.png",
    accentColor: "#0DD6E8",

    theme: {
        bgColor: "#00061a",
        surfaceColor: "rgba(255,255,255,0.02)",
        textPrimary: "#ffffff",
        textSecondary: "rgba(255,255,255,0.7)",
        textMuted: "rgba(255,255,255,0.5)",
    },

    navbar: {
        links: [
            { label: "Home", href: "/browse" },
            { label: "Series", href: "/browse/series" },
            { label: "Anime", href: "/browse/anime" },
            { label: "Movies", href: "/browse/movies" },
        ],
        loginButtonText: "Sign In",
        registerButtonText: "Start Free Trial",
    },

    landing: {
        heroTitle: "Discover the magic that never ends",
        heroSubtitle:
            "Dive into a universe of enchanting stories and unforgettable characters, where the magic of Rase+ is always at your fingertips.",
        heroImage:
            "https://framerusercontent.com/images/t4f5xYCMGAy0IWkXyZw55QaEqOA.webp",
        ctaText: "Get Started",
        secondaryCtaText: "View Plans",

        partnersLabel: "Your favorite movies and series, all in one place",

        benefitsTitle: "Live the",
        benefitsHighlight: "complete",
        benefitsSubtitle:
            "Watch wherever you want, whenever you want, with impeccable quality and exclusive features to transform each session into an unforgettable event.",
        benefits: [
            {
                title: "4K Quality",
                desc: "Experience the best entertainment in 4K Ultra HD. Cinema directly to your screen.",
                img: "https://framerusercontent.com/images/7PLkf6GJiuwLsXGQ3tdfipnTc.webp",
            },
            {
                title: "Family Profiles",
                desc: "Create up to 7 distinct profiles and ensure everyone has their own recommendations and history.",
                img: "https://framerusercontent.com/images/i4lXYNYiZxCuPqCaeW3x2SlZzE.webp",
            },
            {
                title: "Exclusive Content",
                desc: "Stay up to date with the latest news with exclusive releases and regular updates.",
                img: "https://framerusercontent.com/images/E0u4E9AqJlhMsmnXPjB3ld3fX3E.webp",
            },
            {
                title: "Download & Watch Offline",
                desc: "Take your favorite movies and series wherever you go. Watch offline, no internet connection needed.",
                img: "https://framerusercontent.com/images/aB8J3cFu4mf1sK2OJJgnBJls.webp",
            },
            {
                title: "Everything at your fingertips!",
                desc: "Watch on any device — TV, tablet, phone, or laptop. Seamlessly switch between them.",
                img: "https://framerusercontent.com/images/E0u4E9AqJlhMsmnXPjB3ld3fX3E.webp",
            },
            {
                title: "Available Worldwide",
                desc: "Access your favorite content from anywhere in the world with our global streaming platform.",
                img: "https://framerusercontent.com/images/7PLkf6GJiuwLsXGQ3tdfipnTc.webp",
            },
        ],

        plansTitle: "Choose your",
        plansHighlight: "plan",
        plansSubtitle:
            "We offer personalized plans for you to enjoy Rase+ your way. Explore our options and see which one is perfect for you.",
        plans: [
            {
                name: "Standard",
                price: "$8.99",
                period: "Billed monthly",
                highlighted: false,
                features: [
                    "Movies, original series and classics",
                    "Disney, Pixar, Marvel, Star Wars & more",
                    "2 Simultaneous devices",
                    "Downloads for offline viewing",
                ],
            },
            {
                name: "Premium",
                price: "$13.99",
                period: "Billed monthly",
                highlighted: true,
                badge: "Most Popular",
                features: [
                    "Everything in Standard",
                    "Video up to 4K UHD/HDR & Dolby Atmos",
                    "4 Simultaneous devices",
                    "Sports with ESPN",
                    "Downloads for offline viewing",
                ],
            },
        ],

        faqTitle: "Have questions?",
        faqHighlight: "We have answers.",
        faqs: [
            {
                q: "Can I watch content offline?",
                a: "Yes! You can download your favorite movies and series to watch offline, without needing an internet connection.",
            },
            {
                q: "How many devices can access at the same time?",
                a: "You can watch on up to four devices simultaneously with the same account, without interruptions.",
            },
            {
                q: "Does Rase+ offer 4K content?",
                a: "Yes, many movies and series are available in 4K UHD with HDR and Dolby Atmos sound for an immersive experience.",
            },
            {
                q: "Can I create separate profiles for each family member?",
                a: "Yes, you can create up to 7 personalized profiles, ensuring specific recommendations and controls for each user.",
            },
        ],

        moviesTitle: "A whole universe",
        moviesHighlight: "to explore",
        moviesSubtitle:
            "Endless entertainment at your fingertips \u2014 from timeless classics to the latest releases.",
        moviesCta: "Start Watching Now",
    },

    auth: {
        loginTitle: "Welcome back",
        loginSubtitle: "Sign in to continue watching",
        registerTitle: "Create your account",
        registerSubtitle: "Start streaming in seconds",
    },

    profiles: {
        title: "Who's watching?",
        addButtonText: "Add Profile",
    },

    browse: {
        loadingText: "Loading Rase+...",
        continueWatchingTitle: "Continue Watching",
        trendingAnimeTitle: "Trending Anime",
        popularMoviesTitle: "Popular Movies",
        latestSeriesTitle: "Latest Series",
        animePageTitle: "Anime",
        animePageSubtitle: "Discover the best anime series and movies",
        topRatedAnimeTitle: "Top Rated Anime",
        allAnimeTitle: "All Anime",
        moviesPageTitle: "Movies",
        moviesPageSubtitle: "Explore blockbusters and hidden gems",
        topRatedMoviesTitle: "Top Rated Movies",
        allMoviesTitle: "All Movies",
        seriesPageTitle: "Series",
        seriesPageSubtitle: "Binge-worthy TV shows and originals",
        topRatedSeriesTitle: "Top Rated Series",
        allSeriesTitle: "All TV Series",
    },

    footer: {
        description:
            "The best of entertainment. Discover unlimited movies, series, and exclusive content.",
        copyright: "Copyright \u00a9 2024 Rase+. All rights reserved.",
        columns: [
            {
                title: "Explore",
                links: [
                    { label: "Resources", href: "#" },
                    { label: "Lessons", href: "#" },
                    { label: "Blog", href: "#" },
                ],
            },
        ],
        socials: [
            { platform: "X (Twitter)", handle: "@raseplusbr", url: "#" },
            { platform: "YouTube", handle: "@raseplusbr", url: "#" },
            { platform: "Instagram", handle: "@raseplusbr", url: "#" },
        ],
        supportButtonText: "Support",
    },
};

/* ─── Firebase CRUD ─── */

const CONFIG_REF = "siteConfig";

export async function getSiteConfig(): Promise<SiteConfig> {
    const snapshot = await get(ref(db, CONFIG_REF));
    if (snapshot.exists()) {
        return deepMerge(DEFAULT_CONFIG, snapshot.val()) as SiteConfig;
    }
    return DEFAULT_CONFIG;
}

export async function updateSiteConfig(
    partial: Partial<SiteConfig>
): Promise<void> {
    // Flatten nested objects for Firebase update
    const flat = flattenObject(partial);
    await update(ref(db, CONFIG_REF), flat);
}

/* ─── React Hook (real-time) ─── */

export function useSiteConfig(): { config: SiteConfig; loading: boolean } {
    const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onValue(ref(db, CONFIG_REF), (snapshot) => {
            if (snapshot.exists()) {
                setConfig(
                    deepMerge(DEFAULT_CONFIG, snapshot.val()) as SiteConfig
                );
            } else {
                setConfig(DEFAULT_CONFIG);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    return { config, loading };
}

/* ─── Helpers ─── */

function deepMerge(target: unknown, source: unknown): unknown {
    if (
        typeof target !== "object" ||
        typeof source !== "object" ||
        target === null ||
        source === null
    ) {
        return source;
    }

    if (Array.isArray(source)) {
        return source;
    }

    const result: Record<string, unknown> = {
        ...(target as Record<string, unknown>),
    };
    for (const key of Object.keys(source as Record<string, unknown>)) {
        result[key] = deepMerge(
            (target as Record<string, unknown>)[key],
            (source as Record<string, unknown>)[key]
        );
    }
    return result;
}

function flattenObject(
    obj: Record<string, unknown>,
    prefix = ""
): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
        const path = prefix ? `${prefix}/${key}` : key;
        if (
            value !== null &&
            typeof value === "object" &&
            !Array.isArray(value)
        ) {
            Object.assign(
                result,
                flattenObject(value as Record<string, unknown>, path)
            );
        } else {
            result[path] = value;
        }
    }
    return result;
}
