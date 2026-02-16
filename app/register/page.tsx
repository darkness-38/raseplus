'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthLayout from '@/components/AuthLayout';

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
                    marginBottom: '24px',
                    fontSize: '24px',
                    fontWeight: 600,
                    textAlign: 'center'
                }}>
                    Create an account
                </h3>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    <div className="input-group">
                        <input
                            type="email"
                            className="register-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="Type"
                        />
                        <label className="input-label" style={{ display: email ? 'none' : 'block' }}>Email</label>
                    </div>

                    <div className="input-group">
                        <input
                            type="password"
                            className="register-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Type"
                            minLength={6}
                        />
                        <label className="input-label" style={{ display: password ? 'none' : 'block' }}>Password</label>
                    </div>

                    {error && (
                        <div style={{ color: '#ff4d4f', fontSize: '14px', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="register-btn"
                        disabled={loading}
                    >
                        {loading ? 'CREATING ACCOUNT...' : 'AGREE & CONTINUE'}
                    </button>

                    <div style={{ fontSize: '11px', color: '#cacaca', lineHeight: '1.5', marginTop: '8px' }}>
                        By clicking Agree & Continue, you agree to our Subscriber Agreement and acknowledge that you have read our Privacy Policy.
                    </div>
                </form>

                <div className="divider">
                    <span>OR</span>
                </div>

                <div className="social-login">
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="social-btn"
                        disabled={loading}
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20" height="20" />
                        <span>Sign up with Google</span>
                    </button>
                </div>

                <div style={{ marginTop: '24px', color: '#cacaca', fontSize: '14px', textAlign: 'center' }}>
                    Already have an account? <Link href="/login" style={{ color: '#fff', textDecoration: 'none', fontWeight: 600 }}>Log In.</Link>
                </div>
            </AuthLayout>

            <style jsx>{`
                .input-group {
                    position: relative;
                    width: 100%;
                }
                
                .register-input {
                    width: 100%;
                    height: 52px;
                    background: #31343e;
                    border: 1px solid transparent;
                    border-radius: 4px;
                    padding: 0 16px;
                    color: white;
                    font-size: 16px;
                    outline: none;
                    transition: all 0.2s;
                }

                .register-input:focus {
                    background: #4a4d56;
                    border-bottom: 2px solid #fff;
                }

                .input-label {
                    position: absolute;
                    top: 50%;
                    left: 16px;
                    transform: translateY(-50%);
                    color: #8f9296;
                    pointer-events: none;
                    transition: all 0.2s;
                }
                
                .register-input:focus + .input-label,
                .register-input:not(:placeholder-shown) + .input-label {
                    display: none;
                }

                .register-btn {
                    width: 100%;
                    height: 52px;
                    background: #0063e5;
                    color: #f9f9f9;
                    border: none;
                    border-radius: 4px;
                    font-size: 16px;
                    font-weight: 700;
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: background 0.2s;
                    margin-top: 8px;
                }

                .register-btn:hover {
                    background: #0483ee;
                }

                .register-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .divider {
                    margin: 24px 0;
                    display: flex;
                    align-items: center;
                    color: #8f9296;
                    font-size: 12px;
                }
                
                .divider::before,
                .divider::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: #31343e;
                }

                .divider span {
                    padding: 0 12px;
                }

                .social-login {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .social-btn {
                    width: 100%;
                    height: 52px;
                    background: white;
                    color: black;
                    border: none;
                    border-radius: 4px;
                    font-size: 16px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .social-btn:hover {
                    background: #e6e6e6;
                }
            `}</style>
        </>
    );
}
