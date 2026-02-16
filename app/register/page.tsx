'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthLayout from '@/components/AuthLayout';

import LiquidInput from '@/components/ui/LiquidInput';
import NeonButton from '@/components/ui/NeonButton';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register, loginWithGoogle } = useAuth();
    const router = useRouter();

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await loginWithGoogle();
            if (res.success) {
                router.push('/');
            } else {
                setError(res.error || 'Google login failed');
            }
        } catch (err) {
            setError('An error occurred with Google login');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await register(email, password);
            if (res.success) {
                router.push('/');
            } else {
                setError(res.error || 'Registration failed');
            }
        } catch (err: any) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <AuthLayout>
                <h3 style={{
                    color: '#fff',
                    marginBottom: '40px',
                    fontSize: '32px',
                    fontWeight: 800,
                    textAlign: 'center',
                    letterSpacing: '-1px',
                    textShadow: '0 0 20px rgba(0,255,255,0.4)'
                }}>
                    JOIN THE NETWORK
                </h3>

                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                    <LiquidInput
                        label="EMAIL DESTINATION"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <LiquidInput
                        label="SECURE KEY"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                    />

                    {error && (
                        <div style={{
                            color: '#ff0055',
                            fontSize: '14px',
                            textAlign: 'center',
                            marginBottom: '20px',
                            background: 'rgba(255,0,85,0.1)',
                            padding: '10px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,0,85,0.3)'
                        }}>
                            {error}
                        </div>
                    )}

                    <NeonButton type="submit" disabled={loading}>
                        {loading ? 'PROCESSING...' : 'INITIATE UPLINK'}
                    </NeonButton>

                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.5', marginTop: '16px', textAlign: 'center' }}>
                        By clicking INITIATE UPLINK, you agree to our Digital Subscriber Agreement.
                    </div>
                </form>

                <div className="divider" style={{ margin: '32px 0' }}>
                    <span style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '2px', fontSize: '10px' }}>OR AUTHENTICATE WITH</span>
                </div>

                <div className="social-login">
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="glass-social-btn"
                        disabled={loading}
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="24" height="24" />
                        <span>Google Graph</span>
                    </button>
                </div>

                <div style={{ marginTop: '40px', color: 'rgba(255,255,255,0.5)', fontSize: '12px', textAlign: 'center', letterSpacing: '1px' }}>
                    ALREADY CONNECTED? <Link href="/login" style={{ color: '#00ffff', textDecoration: 'none', fontWeight: 600, textShadow: '0 0 10px rgba(0,255,255,0.5)' }}>RESUME SESSION</Link>
                </div>
            </AuthLayout>

            <style jsx>{`
                .glass-social-btn {
                    width: 100%;
                    height: 56px;
                    background: rgba(255, 255, 255, 0.05);
                    color: #fff;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 50px;
                    font-size: 14px;
                    font-weight: 600;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    backdrop-filter: blur(10px);
                }

                .glass-social-btn:hover {
                    background: rgba(255, 255, 255, 0.15);
                    border-color: #fff;
                    box-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
                    transform: translateY(-2px);
                }

                .divider {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }
                
                .divider::before,
                .divider::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                }

                .divider span {
                    padding: 0 16px;
                }
            `}</style>
        </>
    );
}
