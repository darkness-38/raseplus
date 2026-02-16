'use client';
import { ReactNode } from 'react';

interface AuthLayoutProps {
    children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className="auth-container">
            {/* Background Layers */}
            <div className="auth-background-layer-1"></div>
            <div className="auth-background-layer-2"></div>

            {/* Content */}
            <div className="auth-content">
                <div className="auth-logo-container">
                    <img src="/assets/logo.png" alt="Rase+" className="auth-logo" />
                </div>

                <div className="auth-card">
                    {children}
                </div>
            </div>

            <style jsx global>{`
                .auth-container {
                    position: relative;
                    min-height: 100vh;
                    width: 100%;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: #1a1d29;
                    font-family: 'Inter', sans-serif;
                }

                /* Layer 1: Subtle Vignette/Gradient (Optional, keeps it depth but clean) */
                .auth-background-layer-1 {
                    display: none;
                }

                /* Layer 2: Removed Starfield */
                .auth-background-layer-2 {
                    display: none;
                }

                .auth-content {
                    position: relative;
                    z-index: 10;
                    width: 100%;
                    max-width: 374px; /* Disney+ specific width */
                    padding: 0 24px;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start; /* Left aligned often */
                }

                .auth-logo-container {
                    margin-bottom: 24px;
                    width: 100%;
                    display: flex;
                    justify-content: center;
                }

                .auth-logo {
                    width: 172px;
                    height: auto;
                    object-fit: contain;
                }

                .auth-card {
                    width: 100%;
                    background: transparent; /* Disney+ login is often directly on background or very subtle */
                    border: none;
                    box-shadow: none;
                    padding: 0;
                }

                /* Mobile responsive adjustments if needed */
                @media (min-width: 768px) {
                    .auth-content {
                        align-items: center;
                    }
                }
            `}</style>
        </div>
    );
}
