'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const backgrounds = [
    "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070&auto=format&fit=crop", // Movie theater/Customer experience
    "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025&auto=format&fit=crop", // Cinema screen
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop", // Cinema projector
    "https://images.unsplash.com/photo-1574267432553-4b4628081c31?q=80&w=2031&auto=format&fit=crop"  // Abstract vibrant
];

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    const [currentBg, setCurrentBg] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentBg((prev) => (prev + 1) % backgrounds.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="min-h-screen w-full relative overflow-hidden flex items-center">
            {/* Background Slider */}
            <div className="absolute inset-0 w-full h-full z-0">
                <AnimatePresence mode='popLayout'>
                    <motion.img
                        key={currentBg}
                        src={backgrounds[currentBg]}
                        alt="Background"
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5 }}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                </AnimatePresence>
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent z-10" />
            </div>

            {/* Content Container - Left Aligned */}
            <div className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16">
                <div className="max-w-md w-full">
                    <div className="mb-8">
                        <h1 className="text-5xl font-bold text-white mb-4 tracking-tight drop-shadow-lg">
                            {title}
                        </h1>
                        <p className="text-lg text-gray-300 drop-shadow-md">
                            {subtitle}
                        </p>
                    </div>

                    <div className="backdrop-blur-md bg-black/40 border border-white/10 p-8 rounded-2xl shadow-2xl ring-1 ring-white/10">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
