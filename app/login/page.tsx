'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(username, password);
            router.push('/');
        } catch (err: any) {
            setError('Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-box">
                <img
                    src="/rase-plus-logo.png"
                    alt="Rase+"
                    className="login-logo"
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.insertAdjacentHTML('afterbegin', '<h1 style="color:white; font-size:32px; margin-bottom:24px;">RASE+</h1>');
                    }}
                />

                <h3 style={{ color: '#fff', marginBottom: '24px', fontSize: '18px' }}>Log in with your credentials</h3>

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Username"
                        className="login-input"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="login-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    {error && (
                        <div style={{ color: '#ff4d4f', marginBottom: '16px', fontSize: '14px' }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="login-btn"
                        disabled={loading}
                        style={{ opacity: loading ? 0.7 : 1 }}
                    >
                        {loading ? 'LOGGING IN...' : 'LOG IN'}
                    </button>

                    <div style={{ marginTop: '24px', color: '#cacaca', fontSize: '14px' }}>
                        Need help? <a href="#" style={{ color: '#fff', textDecoration: 'underline' }}>Visit Support</a>
                    </div>
                </form>
            </div>
        </div>
    );
}
