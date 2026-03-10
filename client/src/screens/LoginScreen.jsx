import { useState, useEffect, useCallback, useRef } from 'react';
import { BRAND } from '../config/brand';

export default function LoginScreen({ onLogin, connected }) {
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [googleReady, setGoogleReady] = useState(false);
    const [loginMode, setLoginMode] = useState('player');
    const [adminPassword, setAdminPassword] = useState('');
    const [adminUsername, setAdminUsername] = useState('admin');
    const tokenClientRef = useRef(null);

    const isProduction = window.location.protocol === 'https:';
    const API_URL = import.meta.env.VITE_API_URL || (isProduction
        ? `https://${window.location.hostname.replace('frontend', 'backend')}/api`
        : 'http://localhost:3001/api');
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '626931226663-psqii8knvvh5jelps8vc06v1kuccgc0n.apps.googleusercontent.com';

    const handleGoogleToken = useCallback(async (tokenResponse) => {
        if (!tokenResponse.access_token) { setGoogleLoading(false); return; }
        try {
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
            });
            if (!userInfoRes.ok) throw new Error('Failed to get user info');
            const googleUser = await userInfoRes.json();
            const baseApi = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
            const res = await fetch(`${baseApi}/auth/google/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accessToken: tokenResponse.access_token,
                    user: { id: googleUser.sub, email: googleUser.email, name: googleUser.name, picture: googleUser.picture }
                })
            });
            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                onLogin(data.user.username, data.token, data.user);
            } else {
                alert('Authentication failed. Please try again.');
            }
        } catch (err) {
            console.error('Google auth error:', err);
            alert('Failed to authenticate. Please try guest login.');
        } finally { setGoogleLoading(false); }
    }, [API_URL, onLogin]);

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) return;
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true; script.defer = true;
        script.onload = () => {
            if (window.google) {
                tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
                    client_id: GOOGLE_CLIENT_ID, scope: 'email profile openid', callback: handleGoogleToken,
                });
                setGoogleReady(true);
            }
        };
        document.head.appendChild(script);
        return () => { const s = document.querySelector('script[src="https://accounts.google.com/gsi/client"]'); if (s) s.remove(); };
    }, [GOOGLE_CLIENT_ID, handleGoogleToken]);

    const handleGoogleLogin = () => {
        if (!tokenClientRef.current || !googleReady) { alert('Google Sign-In is not ready yet.'); return; }
        setGoogleLoading(true);
        tokenClientRef.current.requestAccessToken();
    };

    const handleGuestLogin = async (e) => {
        e.preventDefault();
        if (!username.trim() || username.length < 2) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/guest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username.trim() })
            });
            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                onLogin(data.user.username, data.token, data.user);
            } else {
                const error = await res.json();
                alert(error.error || 'Login failed');
            }
        } catch (err) { onLogin(username.trim()); }
        finally { setIsLoading(false); }
    };

    const handleAdminLogin = async (e) => {
        e.preventDefault();
        if (!adminUsername.trim() || !adminPassword) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/admin-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: adminUsername.trim(), password: adminPassword })
            });
            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                onLogin(data.user.username, data.token, data.user);
            } else {
                const error = await res.json();
                alert(error.error || 'Admin login failed');
            }
        } catch (err) {
            console.error('Admin login error:', err);
            alert('Cannot reach server. Is the backend running on port 3001?');
        }
        finally { setIsLoading(false); }
    };

    const tabStyle = (active) => ({
        flex: 1, padding: '10px', borderRadius: 'var(--r-md)', border: 'none',
        cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
        fontFamily: 'var(--f-body)', letterSpacing: '0.5px',
        background: active ? 'rgba(139,92,246,0.12)' : 'transparent',
        borderBottom: active ? '2px solid var(--c-primary)' : '2px solid transparent',
        color: active ? 'var(--c-primary-l)' : 'var(--c-text-off)',
        transition: 'all 0.2s',
    });

    return (
        <div className="screen fade-in" style={{ padding: 'var(--sp-4)', position: 'relative', overflow: 'hidden' }}>
            {/* Animated grid background (matching Cyber Arena theme) */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.04 }}>
                {Array.from({ length: 14 }).map((_, i) => (
                    <div key={i} style={{
                        position: 'absolute', top: `${i * 7}%`, left: 0, right: 0,
                        height: '1px',
                        background: 'linear-gradient(90deg, transparent, var(--c-primary), transparent)',
                    }} />
                ))}
                {Array.from({ length: 10 }).map((_, i) => (
                    <div key={`v${i}`} style={{
                        position: 'absolute', left: `${i * 10}%`, top: 0, bottom: 0,
                        width: '1px',
                        background: 'linear-gradient(180deg, transparent, var(--c-cyan), transparent)',
                    }} />
                ))}
            </div>
            {/* Central glow */}
            <div style={{
                position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
                width: '350px', height: '350px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(139,92,246,0.08), transparent 70%)',
                filter: 'blur(40px)', pointerEvents: 'none',
            }} />

            <div className="panel" style={{ maxWidth: '420px', width: '100%', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                {/* Header */}
                <div style={{ marginBottom: 'var(--sp-8)' }}>
                    <h1 style={{
                        fontFamily: 'var(--f-mono)',
                        fontSize: 'clamp(1.4rem, 5vw, 2rem)',
                        fontWeight: 800,
                        letterSpacing: '4px',
                        color: 'var(--c-primary-l)',
                        marginBottom: 'var(--sp-2)',
                    }}>
                        {BRAND.name.toUpperCase()}
                    </h1>
                    <p style={{
                        color: 'var(--c-text-off)',
                        fontSize: '0.8rem',
                        letterSpacing: '3px',
                        textTransform: 'uppercase',
                    }}>
                        {loginMode === 'admin' ? 'Command Center' : 'Enter the Arena'}
                    </p>
                </div>

                {/* Player / Admin toggle */}
                <div style={{
                    display: 'flex', gap: '4px', marginBottom: 'var(--sp-6)',
                    background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--r-md)', padding: '4px',
                }}>
                    <button onClick={() => setLoginMode('player')} style={tabStyle(loginMode === 'player')}>
                        Player
                    </button>
                    <button onClick={() => setLoginMode('admin')} style={tabStyle(loginMode === 'admin')}>
                        Admin
                    </button>
                </div>

                {loginMode === 'player' ? (
                    <>
                        <form onSubmit={handleGuestLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
                            <input
                                type="text" value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Choose a callsign"
                                className="input2"
                                style={{ textAlign: 'center', letterSpacing: '1px' }}
                                maxLength={20} disabled={isLoading}
                            />
                            <button type="submit" className="btn2 btn2--primary btn2--block btn2--lg"
                                disabled={!username.trim() || username.length < 2 || isLoading}
                                style={{ opacity: (!username.trim() || username.length < 2) ? 0.4 : 1 }}
                            >
                                {isLoading ? 'Connecting...' : 'Enter as Guest'}
                            </button>
                        </form>

                        <div className="divider2"><span>or</span></div>

                        <button onClick={handleGoogleLogin} className="btn2 btn2--block btn2--lg"
                            disabled={googleLoading || !googleReady}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                opacity: !googleReady ? 0.5 : 1,
                            }}
                        >
                            {googleLoading ? 'Connecting...' : (
                                <>
                                    <svg width="18" height="18" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Sign in with Google
                                </>
                            )}
                        </button>
                    </>
                ) : (
                    <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                        <input type="text" value={adminUsername}
                            onChange={(e) => setAdminUsername(e.target.value)}
                            placeholder="Admin username" className="input2"
                            style={{ textAlign: 'center' }}
                            maxLength={30} disabled={isLoading}
                        />
                        <input type="password" value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            placeholder="Password" className="input2"
                            style={{ textAlign: 'center' }}
                            disabled={isLoading}
                        />
                        <button type="submit" className="btn2 btn2--primary btn2--block btn2--lg"
                            disabled={!adminUsername.trim() || !adminPassword || isLoading}
                            style={{ opacity: (!adminUsername.trim() || !adminPassword) ? 0.4 : 1 }}
                        >
                            {isLoading ? 'Authenticating...' : 'Admin Login'}
                        </button>
                    </form>
                )}

                {/* Connection dot */}
                <div style={{
                    marginTop: 'var(--sp-6)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 'var(--sp-2)',
                }}>
                    <span style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: connected ? 'var(--c-green)' : 'var(--c-red)',
                        boxShadow: connected ? '0 0 8px var(--c-green)' : 'none',
                    }}></span>
                    <span style={{
                        color: connected ? 'var(--c-green)' : 'var(--c-red)',
                        fontSize: '0.7rem', fontWeight: 600, letterSpacing: '1.5px',
                        textTransform: 'uppercase',
                    }}>
                        {connected ? 'Server Online' : 'Connecting...'}
                    </span>
                </div>

                <p style={{
                    marginTop: 'var(--sp-4)', fontSize: '0.7rem',
                    color: 'var(--c-text-off)', lineHeight: 1.5,
                }}>
                    {loginMode === 'admin'
                        ? 'Admin access requires server-configured credentials'
                        : 'Sign in with Google to track ELO and appear on rankings'}
                </p>
            </div>
        </div>
    );
}
