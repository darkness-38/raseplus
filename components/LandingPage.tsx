'use client';
import Link from 'next/link';

export default function LandingPage() {
    return (
        <div className="landing-container">
            {/* Navbar / Header */}
            <nav className="landing-nav">
                <div className="nav-logo">
                    <img src="/assets/logo.png" alt="Rase+" className="brand-logo" />
                </div>
                <div className="nav-actions">
                    <Link href="/login" className="nav-btn-login">LOG IN</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="hero-section">
                <div className="hero-content">
                    <div className="hero-logo-large">
                        <img src="/assets/logo.png" alt="Rase+" />
                    </div>

                    <h1 className="hero-title">The World's Favorite Stories</h1>

                    <p className="hero-subtitle">
                        Immerse yourself in a universe of stories. From epic adventures to heartwarming tales, find your next favorite.
                    </p>

                    <Link href="/register" className="cta-button">
                        GET RASE+
                    </Link>

                    <p className="hero-disclaimer">
                        Start watching today. Cancel anytime.
                    </p>
                </div>
            </main>

            {/* Background Layers */}
            <div className="background-glow"></div>
            <div className="background-stars"></div>

            <style jsx global>{`
                .landing-container {
                    position: relative;
                    min-height: 100vh;
                    width: 100%;
                    overflow: hidden;
                    background-color: #040714;
                    font-family: 'Inter', sans-serif;
                    display: flex;
                    flex-direction: column;
                }

                .landing-nav {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 24px 48px;
                    z-index: 50;
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    background: linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%);
                }

                .brand-logo {
                    height: 48px;
                    width: auto;
                }

                .nav-btn-login {
                    color: white;
                    text-decoration: none;
                    text-transform: uppercase;
                    font-weight: 600;
                    font-size: 16px;
                    letter-spacing: 1px;
                    padding: 10px 24px;
                    border: 1px solid rgba(255,255,255,0.4);
                    border-radius: 4px;
                    transition: all 0.2s ease;
                    background: rgba(0,0,0,0.3);
                }

                .nav-btn-login:hover {
                    background: white;
                    color: #040714;
                    border-color: white;
                }

                .hero-section {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    z-index: 10;
                    padding: 0 24px;
                    text-align: center;
                    margin-top: 60px; /* Offset for fixed nav */
                }

                .hero-content {
                    max-width: 800px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    animation: fadeInUp 1s ease-out;
                }

                .hero-logo-large img {
                    max-width: 320px;
                    width: 100%;
                    height: auto;
                    margin-bottom: 32px;
                    filter: drop-shadow(0 0 24px rgba(0,100,255,0.3));
                }

                .hero-title {
                    font-size: 56px;
                    font-weight: 700;
                    color: white;
                    margin-bottom: 24px;
                    line-height: 1.1;
                    letter-spacing: -1px;
                }

                .hero-subtitle {
                    font-size: 24px;
                    color: #cbd5e1;
                    margin-bottom: 48px;
                    line-height: 1.5;
                    max-width: 640px;
                }

                .cta-button {
                    background: #0063e5;
                    color: white;
                    font-size: 20px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    padding: 20px 80px;
                    border-radius: 4px;
                    text-decoration: none;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 24px rgba(0, 99, 229, 0.4);
                }

                .cta-button:hover {
                    background: #0483ee;
                    transform: scale(1.02);
                    box-shadow: 0 6px 32px rgba(0, 99, 229, 0.6);
                }

                .hero-disclaimer {
                    margin-top: 24px;
                    color: #64748b;
                    font-size: 14px;
                }

                /* Background Effects */
                .background-glow {
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle at 50% 30%, #1e3a8a 0%, #0f172a 40%, #020617 80%);
                    opacity: 0.8;
                    z-index: 1;
                }

                .background-stars {
                    position: absolute;
                    inset: 0;
                    background-image: 
                        radial-gradient(white, rgba(255,255,255,.2) 2px, transparent 3px),
                        radial-gradient(white, rgba(255,255,255,.15) 1px, transparent 2px),
                        radial-gradient(white, rgba(255,255,255,.1) 2px, transparent 3px);
                    background-size: 550px 550px, 350px 350px, 250px 250px;
                    background-position: 0 0, 40px 60px, 130px 270px;
                    opacity: 0.4;
                    z-index: 2;
                    animation: starMove 120s linear infinite;
                }

                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes starMove {
                    from { transform: translateY(0); }
                    to { transform: translateY(-550px); }
                }

                @media (max-width: 768px) {
                    .hero-title {
                        font-size: 36px;
                    }
                    .hero-subtitle {
                        font-size: 18px;
                    }
                    .cta-button {
                        width: 100%;
                        padding: 16px 0;
                    }
                    .nav-logo img {
                        height: 32px;
                    }
                    .landing-nav {
                        padding: 16px 24px;
                    }
                }
            `}</style>
        </div>
    );
}
