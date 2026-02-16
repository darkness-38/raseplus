'use client';

import { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';

// Dynamically import Three.js scene to avoid SSR issues
const BackgroundScene = dynamic(() => import('@/components/3d/BackgroundScene'), { ssr: false });

interface AuthLayoutProps {
    children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className="auth-container">
            <BackgroundScene />

            {/* Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    className="auth-content"
                    initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
                    animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                    exit={{ opacity: 0, scale: 0.9, rotateX: -10 }}
                    transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
                >
                    <div className="auth-logo-container">
                        <img src="/assets/logo.png" alt="Rase+" className="auth-logo" />
                    </div>

                    <div className="auth-card">
                        {children}
                    </div>
                </motion.div>
            </AnimatePresence>

            <style jsx global>{`
                .auth-container {
                    position: relative;
                    min-height: 100vh;
                    width: 100%;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: #000;
                    font-family: 'Inter', sans-serif;
                    perspective: 1200px; /* Crucial for 3D flip */
                }

                .auth-content {
                    position: relative;
                    z-index: 10;
                    width: 100%;
                    max-width: 480px;
                    padding: 40px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    /* Glass Card Container Style */
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(20px) saturate(180%);
                    -webkit-backdrop-filter: blur(20px) saturate(180%);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 24px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5), inset 0 0 20px rgba(255,255,255,0.05);
                    transform-style: preserve-3d;
                }

                .auth-logo-container {
                    margin-bottom: 40px;
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    transform: translateZ(50px); /* Parallax depth */
                }

                .auth-logo {
                    max-width: 200px;
                    height: auto;
                    filter: drop-shadow(0 0 15px rgba(0, 255, 255, 0.5));
                }

                .auth-card {
                    width: 100%;
                    transform: translateZ(20px);
                }

                @media (max-width: 768px) {
                    .auth-content {
                        padding: 24px;
                        margin: 20px;
                        max-width: 100%;
                    }
                }
            `}</style>
        </div>
    );
}

