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
                    background-color: #040714;
                    font-family: 'Inter', sans-serif;
                }

                /* Layer 1: Deep Blue Gradient */
                .auth-background-layer-1 {
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle at 50% 0%, #1b2845 0%, #040714 80%);
                    z-index: 0;
                }

                /* Layer 2: Subtle Starfield Effect (optional, using CSS for now) */
                .auth-background-layer-2 {
                    position: absolute;
                    inset: 0;
                    background-image: 
                        radial-gradient(white, rgba(255,255,255,.2) 2px, transparent 3px),
                        radial-gradient(white, rgba(255,255,255,.15) 1px, transparent 2px),
                        radial-gradient(white, rgba(255,255,255,.1) 2px, transparent 3px);
                    background-size: 550px 550px, 350px 350px, 250px 250px;
                    background-position: 0 0, 40px 60px, 130px 270px;
                    opacity: 0.3;
                    z-index: 1;
                    animation: starMove 100s linear infinite;
                }

                @keyframes starMove {
                    from { transform: translateY(0); }
                    to { transform: translateY(-550px); }
                }

                .auth-content {
                    position: relative;
                    z-index: 10;
                    width: 100%;
                    max-width: 400px;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .auth-logo-container {
                    margin-bottom: 32px;
                    width: 100%;
                    display: flex;
                    justify-content: center;
                }

                .auth-logo {
                    max-width: 180px;
                    height: auto;
                    filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5));
                }

                .auth-card {
                    width: 100%;
                    background: rgba(14, 17, 27, 0.6);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 40px 32px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
                    transition: transform 0.3s ease;
                }

                .auth-card:hover {
                    border-color: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
}
