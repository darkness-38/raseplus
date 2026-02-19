"use client";

import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { useSiteConfig } from "@/lib/siteConfig";

/* ─────────────────── DESIGN TOKENS ─────────────────── */
const COLORS = {
  bg: "#00061a",
  darkBlue: "rgb(1, 61, 203)",
  cyan: "rgb(13, 214, 232)",
  cyanGlow: "rgba(194, 255, 255, 1)",
  white: "#ffffff",
  white70: "rgba(255,255,255,0.7)",
  white50: "rgba(255,255,255,0.5)",
  white10: "rgba(255,255,255,0.1)",
  white05: "rgba(255,255,255,0.05)",
  textDark: "rgba(0, 6, 26, 1)",
};

/* ─────────────────── DATA ─────────────────── */
const navLinks = ["Home", "Benefits", "Plans", "Movies", "FAQ"];

const brands = [
  { name: "Disney", logo: "https://framerusercontent.com/images/vn6jHDAc8dRDjB3fUUZHLIfXNQ.png" },
  { name: "Pixar", logo: "https://framerusercontent.com/images/LsPeqIaeSrjU3tenNqnVjol394.png" },
  { name: "Marvel", logo: "https://framerusercontent.com/images/DRLpYLBGHGXael44ykJBHXFngE.png" },
  { name: "Star Wars", logo: "https://framerusercontent.com/images/0xc7XtKKCfJqpmjaGSjNLxPqjsg.png" },
  { name: "Nat Geo", logo: "https://framerusercontent.com/images/IB3d86wzmk5O3aC3CDE1jnq9cHo.png" },
  { name: "Star", logo: "https://framerusercontent.com/images/m8gS7OzE09ESlqhR2sMmjjmMXqw.png" },
];

const benefits = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-2.625 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0 1 18 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0 1 18 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 0 1 6 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-1.5c0-.621.504-1.125 1.125-1.125m-1.125 2.625c0 .621.504 1.125 1.125 1.125M6 13.125v1.5c0 .621.504 1.125 1.125 1.125m0 0h9.75m-9.75 0a1.125 1.125 0 0 1-1.125 1.125M7.125 15.75c-.621 0-1.125.504-1.125 1.125m10.875 0c0-.621-.504-1.125-1.125-1.125m1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 13.125v1.5c0 .621-.504 1.125-1.125 1.125" />
      </svg>
    ),
    title: "4K Quality",
    desc: "Experience the best entertainment in 4K Ultra HD. Cinema directly to your screen.",
    img: "https://framerusercontent.com/images/7PLkf6GJiuwLsXGQ3tdfipnTc.webp",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
    title: "Family Profiles",
    desc: "Create up to 7 distinct profiles and ensure everyone has their own recommendations and history.",
    img: "https://framerusercontent.com/images/i4lXYNYiZxCuPqCaeW3x2SlZzE.webp",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
      </svg>
    ),
    title: "Exclusive Content",
    desc: "Stay up to date with the latest news with exclusive releases and regular updates.",
    img: "https://framerusercontent.com/images/E0u4E9AqJlhMsmnXPjB3ld3fX3E.webp",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    ),
    title: "Download & Watch Offline",
    desc: "Take your favorite movies and series wherever you go. Watch offline, no internet connection needed.",
    img: "https://framerusercontent.com/images/aB8J3cFu4mf1sK2OJJgnBJls.webp",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5h3m-6.75 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-15a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 4.5v15a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
    title: "Everything at your fingertips!",
    desc: "Watch on any device — TV, tablet, phone, or laptop. Seamlessly switch between them.",
    img: "https://framerusercontent.com/images/E0u4E9AqJlhMsmnXPjB3ld3fX3E.webp",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
    title: "Available Worldwide",
    desc: "Access your favorite content from anywhere in the world with our global streaming platform.",
    img: "https://framerusercontent.com/images/7PLkf6GJiuwLsXGQ3tdfipnTc.webp",
  },
];

const faqs = [
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
];

const moviePosters = [
  "https://framerusercontent.com/images/01F0ojHYY7yfP5mEQcBEtXImI4U.png",
  "https://framerusercontent.com/images/XL2iMXlJvKBp6aGjnFkXIYvRjAQ.png",
  "https://framerusercontent.com/images/VXG3dTY369P2sO1iNdHFH1C4BU.png",
  "https://framerusercontent.com/images/q7U8kpwb5lplE0XtfCRwNVCVkA.png",
  "https://framerusercontent.com/images/XL2iMXlJvKBp6aGjnFkXIYvRjAQ.png",
  "https://framerusercontent.com/images/01F0ojHYY7yfP5mEQcBEtXImI4U.png",
  "https://framerusercontent.com/images/VXG3dTY369P2sO1iNdHFH1C4BU.png",
  "https://framerusercontent.com/images/q7U8kpwb5lplE0XtfCRwNVCVkA.png",
];

const moviePostersRow2 = [
  "https://framerusercontent.com/images/VXG3dTY369P2sO1iNdHFH1C4BU.png",
  "https://framerusercontent.com/images/q7U8kpwb5lplE0XtfCRwNVCVkA.png",
  "https://framerusercontent.com/images/01F0ojHYY7yfP5mEQcBEtXImI4U.png",
  "https://framerusercontent.com/images/XL2iMXlJvKBp6aGjnFkXIYvRjAQ.png",
  "https://framerusercontent.com/images/q7U8kpwb5lplE0XtfCRwNVCVkA.png",
  "https://framerusercontent.com/images/VXG3dTY369P2sO1iNdHFH1C4BU.png",
  "https://framerusercontent.com/images/01F0ojHYY7yfP5mEQcBEtXImI4U.png",
  "https://framerusercontent.com/images/XL2iMXlJvKBp6aGjnFkXIYvRjAQ.png",
];

/* ─────────────────── SMALL COMPONENTS ─────────────────── */
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.cyan} strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

/* ─────────────────── MARQUEE COMPONENT ─────────────────── */
function PosterMarquee({ posters, direction = "left", speed = 30 }: { posters: string[]; direction?: string; speed?: number }) {
  const doubled = [...posters, ...posters];
  return (
    <div className="overflow-hidden" style={{ maskImage: "linear-gradient(to right, transparent 0%, black 12.5%, black 87.5%, transparent 100%)" }}>
      <motion.div
        className="flex gap-3"
        animate={{ x: direction === "left" ? [0, -posters.length * 200] : [-posters.length * 200, 0] }}
        transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((poster, i) => (
          <div key={i} className="flex-shrink-0 w-[180px] h-[267px] rounded-xl overflow-hidden">
            <img src={poster} alt="" className="w-full h-full object-cover" loading="lazy" />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/* ─────────────────── MAIN PAGE ─────────────────── */
export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const { config: cfg } = useSiteConfig();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const ctaStyle: React.CSSProperties = {
    backgroundColor: COLORS.cyan,
    boxShadow: `inset 0px 4px 16px 0px ${COLORS.cyanGlow}`,
    borderRadius: 100,
    color: COLORS.textDark,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    border: "none",
    cursor: "pointer",
  };

  return (
    <div
      className="min-h-screen text-white overflow-x-hidden"
      style={{ backgroundColor: COLORS.bg }}
    >
      {/* ═══════════════════════ NAVBAR ═══════════════════════ */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-10 transition-all duration-300"
        style={{
          height: 72,
          backgroundColor: scrolled ? "rgba(0,6,26,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
        }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-0.5">
          <div className="relative h-8 w-24 sm:h-9 sm:w-28">
            <Image
              src={cfg.logoUrl}
              alt={cfg.siteName}
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>

        {/* Center Nav Links – pill container */}
        <div
          className="hidden md:flex items-center gap-0 rounded-full px-1 py-1"
          style={{
            border: `1px solid ${COLORS.white10}`,
            backgroundColor: COLORS.white05,
            backdropFilter: "blur(2px)",
          }}
        >
          {navLinks.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase()}`}
              className="px-4 py-2 rounded-full text-sm transition-colors hover:bg-white/10"
              style={{ fontFamily: "'Google Sans Flex', system-ui, sans-serif", letterSpacing: "-0.02em", color: "white" }}
            >
              {link}
            </a>
          ))}
        </div>

        {/* Right Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all hover:bg-white/10"
            style={{
              border: `1px solid ${COLORS.white10}`,
              backdropFilter: "blur(5px)",
              letterSpacing: "-0.02em",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            Login
          </Link>
          <Link
            href="/register"
            className="text-sm px-5 py-2.5"
            style={ctaStyle}
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ═══════════════════════ HERO SECTION ═══════════════════════ */}
      <section ref={heroRef} id="home" className="relative min-h-[100vh] flex flex-col items-center justify-center overflow-hidden">
        {/* Hero Background Image with radial mask */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 w-full h-full"
          >
            <img
              src="https://framerusercontent.com/images/t4f5xYCMGAy0IWkXyZw55QaEqOA.webp"
              alt=""
              className="w-full h-full object-cover"
              style={{
                maskImage: "radial-gradient(64% 129% at 50% 1.4%, rgb(0,0,0) 0%, rgba(0,0,0,0) 100%)",
                WebkitMaskImage: "radial-gradient(64% 129% at 50% 1.4%, rgb(0,0,0) 0%, rgba(0,0,0,0) 100%)",
              }}
            />
          </div>
          {/* Bottom glow */}
          <div
            className="absolute bottom-[-400px] left-[-160px] right-[-160px] h-[1377px]"
            style={{
              background: "radial-gradient(49% 54% at 49% 50%, rgba(4,199,244,0.18) 0%, transparent 100%)",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Hero Content */}
        <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="relative z-10 flex flex-col items-center text-center px-6 max-w-[750px]">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col items-center gap-6"
          >
            <h1
              className="text-4xl sm:text-5xl lg:text-[72px] font-black leading-[1.05] tracking-tight"
              style={{ fontFamily: "'Google Sans Flex', system-ui, sans-serif" }}
            >
              {cfg.landing.heroTitle}
            </h1>

            <p
              className="text-base sm:text-lg lg:text-2xl leading-[1.4] max-w-[600px]"
              style={{ color: COLORS.white70, letterSpacing: "-0.01em" }}
            >
              {cfg.landing.heroSubtitle}
            </p>

            <div className="flex items-center gap-4 mt-2">
              <Link
                href="/register"
                className="group flex items-center gap-2 px-8 py-4 text-base transition-all hover:scale-105 active:scale-95"
                style={ctaStyle}
              >
                {cfg.landing.ctaText}
                <ArrowIcon />
              </Link>
              <a
                href="#plans"
                className="px-8 py-4 rounded-full text-base font-semibold hover:bg-white/10 transition-all"
                style={{
                  border: `1px solid ${COLORS.white10}`,
                  backgroundColor: COLORS.white05,
                  color: COLORS.white70,
                  letterSpacing: "-0.02em",
                }}
              >
                {cfg.landing.secondaryCtaText}
              </a>
            </div>
          </motion.div>
        </motion.div>

        {/* Rotating concentric circles with cursor dot */}
        <motion.div
          initial={{ opacity: 0, rotate: -93 }}
          animate={{ opacity: 1, rotate: 14 }}
          transition={{ type: "spring", bounce: 0.2, delay: 0.25, duration: 1.5 }}
          className="absolute bottom-[-30%] left-1/2 -translate-x-1/2 w-[99%] max-w-[1247px] aspect-square pointer-events-none"
        >
          <div className="absolute inset-0 rounded-full border border-white/[0.06]" />
          <div className="absolute inset-[3%] rounded-full border border-white/[0.04]" />
          <div className="absolute inset-[6%] rounded-full border border-white/[0.02]" />
          <div className="absolute top-[4%] left-[69%] -translate-x-1/2 -translate-y-1/2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: COLORS.cyan, boxShadow: `0 0 20px ${COLORS.cyan}` }}
            >
              <svg width="16" height="20" viewBox="0 0 25 33" fill={COLORS.textDark}>
                <path d="M0 32.873V0l24.148 23.85H10.02l-.856.254L0 32.873z" />
              </svg>
            </div>
          </div>
        </motion.div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#00061a] to-transparent" />
      </section>

      {/* ═══════════════════════ PARTNERS / BRAND LOGOS ═══════════════════════ */}
      <section className="relative z-10 py-10">
        <div className="max-w-6xl mx-auto px-6">
          <p
            className="text-center text-xs mb-8 font-medium tracking-widest uppercase"
            style={{ color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}
          >
            Your favorite movies and series, all in one place
          </p>
          <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
            {brands.map((b) => (
              <motion.div
                key={b.name}
                whileHover={{ scale: 1.05, borderColor: "rgba(255,255,255,0.15)" }}
                className="flex items-center justify-center rounded-2xl overflow-hidden transition-all"
                style={{
                  width: 148,
                  height: 80,
                  border: `1px solid ${COLORS.white10}`,
                  backgroundColor: COLORS.white05,
                }}
              >
                <img src={b.logo} alt={b.name} className="h-8 w-auto object-contain opacity-70" loading="lazy" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ BENEFITS ═══════════════════════ */}
      <section id="benefits" className="relative z-10 py-24 lg:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-xl mx-auto mb-16"
          >
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 leading-tight"
              style={{ fontFamily: "'Google Sans Flex', system-ui, sans-serif" }}
            >
              {cfg.landing.benefitsTitle}{" "}
              <span style={{ color: COLORS.cyan }}>{cfg.landing.benefitsHighlight}</span>{" "}
              experience
            </h2>
            <p className="text-sm sm:text-base leading-relaxed" style={{ color: COLORS.white50 }}>
              {cfg.landing.benefitsSubtitle}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/[0.12]"
                style={{
                  border: `1px solid rgba(255,255,255,0.06)`,
                  backgroundColor: "rgba(255,255,255,0.02)",
                }}
              >
                {/* Card image at top */}
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={b.img}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,6,26,1)] via-[rgba(0,6,26,0.5)] to-transparent" />
                </div>
                {/* Card content */}
                <div className="relative p-6 pt-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{
                      border: `1px solid ${COLORS.white10}`,
                      backgroundColor: "rgba(4,199,244,0.1)",
                      color: COLORS.cyan,
                    }}
                  >
                    {b.icon}
                  </div>
                  <h3
                    className="text-lg font-bold mb-2"
                    style={{ fontFamily: "'Google Sans Flex', system-ui, sans-serif" }}
                  >
                    {b.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: COLORS.white50 }}>
                    {b.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ PRICING ═══════════════════════ */}
      <section id="plans" className="relative z-10 py-24 lg:py-32">
        {/* Background glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(1,61,203,0.12) 0%, transparent 60%)", pointerEvents: "none" }}
        />
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-xl mx-auto mb-16"
          >
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 leading-tight"
              style={{ fontFamily: "'Google Sans Flex', system-ui, sans-serif" }}
            >
              {cfg.landing.plansTitle}{" "}
              <span style={{ color: COLORS.cyan }}>{cfg.landing.plansHighlight}</span>
            </h2>
            <p className="text-sm sm:text-base leading-relaxed" style={{ color: COLORS.white50 }}>
              {cfg.landing.plansSubtitle}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(cfg.landing.plans || []).map((plan, pi) => (
              <motion.div
                key={pi}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: pi * 0.1 }}
                className="relative p-8 rounded-3xl"
                style={plan.highlighted ? {
                  border: `1px solid rgba(13,214,232,0.2)`,
                  background: `linear-gradient(180deg, rgba(1,61,203,0.12) 0%, transparent 60%)`,
                } : {
                  border: `1px solid rgba(255,255,255,0.08)`,
                  backgroundColor: "rgba(255,255,255,0.02)",
                }}
              >
                {plan.badge && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold whitespace-nowrap"
                    style={{ ...ctaStyle, fontSize: 12 }}
                  >
                    {plan.badge}
                  </div>
                )}

                <p className="text-sm font-semibold mb-2" style={{ color: plan.highlighted ? COLORS.cyan : COLORS.white50, fontFamily: "'Google Sans Flex', system-ui, sans-serif" }}>
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-black" style={{ fontFamily: "'Google Sans Flex', system-ui, sans-serif" }}>{plan.price}</span>
                  <span className="text-sm" style={{ color: COLORS.white50 }}>/mo</span>
                </div>
                <p className="text-xs mb-6" style={{ color: "rgba(255,255,255,0.3)" }}>{plan.period}</p>

                <ul className="space-y-3 mb-8">
                  {(plan.features || []).map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: COLORS.white70 }}>
                      <span className="mt-0.5"><CheckIcon /></span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className="block w-full text-center py-3.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={plan.highlighted ? {
                    ...ctaStyle,
                    display: "block",
                    textAlign: "center",
                    textDecoration: "none",
                  } : {
                    border: `1px solid ${COLORS.white10}`,
                    backgroundColor: COLORS.white05,
                    color: "white",
                  }}
                >
                  {cfg.landing.ctaText}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FAQ ═══════════════════════ */}
      <section id="faq" className="relative z-10 py-24 lg:py-32">
        <div className="max-w-2xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4"
              style={{ fontFamily: "'Google Sans Flex', system-ui, sans-serif" }}
            >
              {cfg.landing.faqTitle}{" "}
              <span style={{ color: COLORS.cyan }}>{cfg.landing.faqHighlight}</span>
            </h2>
          </motion.div>

          {/* Chat-style FAQ */}
          <div className="space-y-5">
            {faqs.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
              >
                {/* Timestamp */}
                <div className="flex items-center gap-2 mb-2 px-2">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-red-500 flex items-center justify-center text-[8px] font-bold">
                    M
                  </div>
                  <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                    sent by Mickey, 9:41 AM
                  </span>
                </div>

                {/* Question bubble (grey) */}
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 rounded-2xl transition-all text-left group"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <span className="text-sm font-semibold pr-4" style={{ color: COLORS.white70 }}>{f.q}</span>
                  <svg
                    className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-45" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>

                {/* Answer bubble (blue) */}
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div
                        className="mt-2 p-5 rounded-2xl"
                        style={{
                          backgroundColor: "rgba(1,61,203,0.15)",
                          border: "1px solid rgba(4,199,244,0.1)",
                        }}
                      >
                        <p className="text-sm leading-relaxed" style={{ color: COLORS.white70 }}>
                          {f.a}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ MOVIES / CONTENT ═══════════════════════ */}
      <section id="movies" className="relative z-10 py-24 lg:py-32 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-xl mx-auto"
          >
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4"
              style={{ fontFamily: "'Google Sans Flex', system-ui, sans-serif" }}
            >
              {cfg.landing.moviesTitle}{" "}
              <span style={{ color: COLORS.cyan }}>{cfg.landing.moviesHighlight}</span>
            </h2>
            <p className="text-sm sm:text-base leading-relaxed" style={{ color: COLORS.white50 }}>
              {cfg.landing.moviesSubtitle}
            </p>
          </motion.div>
        </div>

        {/* iPad perspective wrapper */}
        <div
          className="relative mx-auto max-w-[1100px]"
          style={{
            perspective: "1200px",
          }}
        >
          <div
            className="rounded-3xl overflow-hidden p-6"
            style={{
              border: `1px solid rgba(255,255,255,0.08)`,
              backgroundColor: "rgba(255,255,255,0.02)",
              transform: "rotateX(4deg)",
              transformOrigin: "center bottom",
            }}
          >
            {/* Row 1 */}
            <div className="mb-4">
              <PosterMarquee posters={moviePosters} direction="left" speed={40} />
            </div>
            {/* Row 2 */}
            <div>
              <PosterMarquee posters={moviePostersRow2} direction="right" speed={45} />
            </div>
          </div>
        </div>

        {/* CTA below movies */}
        <div className="text-center mt-12">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 text-sm font-bold transition-all hover:scale-105 active:scale-95"
            style={{
              ...ctaStyle,
              boxShadow: `inset 0px 4px 16px 0px ${COLORS.cyanGlow}, 0 0 30px rgba(13,214,232,0.2)`,
            }}
          >
            {cfg.landing.moviesCta}
            <ArrowIcon />
          </Link>
        </div>
      </section>

      {/* ═══════════════════════ FOOTER ═══════════════════════ */}
      <footer className="relative z-10 pt-16 pb-8" style={{ borderTop: `1px solid rgba(255,255,255,0.06)` }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            {/* Col 1: Brand */}
            <div className="md:col-span-1">
              <Link href="/" className="mb-4 block">
                <div className="relative h-10 w-32">
                  <Image
                    src={cfg.logoUrl}
                    alt={cfg.siteName}
                    fill
                    className="object-contain"
                  />
                </div>
              </Link>
              <p className="text-sm leading-relaxed" style={{ color: COLORS.white50 }}>
                {cfg.footer.description}
              </p>
            </div>

            {/* Dynamic Footer Columns */}
            {(cfg.footer.columns || []).map((col, ci) => (
              <div key={ci}>
                <h4 className="text-sm font-bold mb-4" style={{ fontFamily: "'Google Sans Flex', system-ui, sans-serif", color: COLORS.white70 }}>
                  {col.title}
                </h4>
                <div className="flex flex-col gap-2.5">
                  {(col.links || []).map((link) => (
                    <a key={link.label} href={link.href} className="text-sm transition-colors hover:text-white" style={{ color: COLORS.white50 }}>
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}

            {/* Social Links */}
            <div>
              <h4 className="text-sm font-bold mb-4" style={{ fontFamily: "'Google Sans Flex', system-ui, sans-serif", color: COLORS.white70 }}>
                Follow Us
              </h4>
              <div className="flex flex-col gap-2.5">
                {(cfg.footer.socials || []).map((social) => (
                  <a key={social.platform} href={social.url || "#"} className="flex items-center gap-2 text-sm transition-colors hover:text-white" style={{ color: COLORS.white50 }}>
                    {social.handle}
                  </a>
                ))}
              </div>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-sm font-bold mb-4" style={{ fontFamily: "'Google Sans Flex', system-ui, sans-serif", color: COLORS.white70 }}>
                Need Help?
              </h4>
              <a
                href="#"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:bg-white/10"
                style={{
                  border: `1px solid ${COLORS.white10}`,
                  backgroundColor: COLORS.white05,
                  color: "white",
                }}
              >
                {cfg.footer.supportButtonText || "Support"}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                </svg>
              </a>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-6" style={{ borderTop: `1px solid rgba(255,255,255,0.06)` }}>
            <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.2)" }}>
              {cfg.footer.copyright}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
