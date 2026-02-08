import { useState, useEffect, useCallback, useRef } from 'react';

export default function LoginScreen({ onLogin, connected }) {
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [googleReady, setGoogleReady] = useState(false);
    const tokenClientRef = useRef(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    // Handle Google OAuth token
    const handleGoogleToken = useCallback(async (tokenResponse) => {
        if (!tokenResponse.access_token) {
            console.error('No access token in response');
            setGoogleLoading(false);
            return;
        }

        try {
            // Get user info from Google using the access token
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
            });

            if (!userInfoRes.ok) {
                throw new Error('Failed to get user info from Google');
            }

            const googleUser = await userInfoRes.json();

            // Send to our server
            const res = await fetch(`${API_URL}/auth/google/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accessToken: tokenResponse.access_token,
                    user: {
                        id: googleUser.sub,
                        email: googleUser.email,
                        name: googleUser.name,
                        picture: googleUser.picture
                    }
                })
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                onLogin(data.user.username, data.token, data.user);
            } else {
                const error = await res.json();
                console.error('Server auth failed:', error);
                alert('Authentication failed. Please try again.');
            }
        } catch (err) {
            console.error('Google auth error:', err);
            alert('Failed to authenticate. Please try guest login.');
        } finally {
            setGoogleLoading(false);
        }
    }, [API_URL, onLogin]);

    // Initialize Google OAuth2 (popup flow - more reliable than FedCM)
    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) {
            console.log('Google Client ID not configured');
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            if (window.google) {
                // Use OAuth2 token client instead of Identity Services
                tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
                    client_id: GOOGLE_CLIENT_ID,
                    scope: 'email profile openid',
                    callback: handleGoogleToken,
                });
                setGoogleReady(true);
                console.log('Google OAuth2 ready');
            }
        };
        script.onerror = () => {
            console.error('Failed to load Google script');
        };
        document.head.appendChild(script);

        return () => {
            const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
            if (existingScript) existingScript.remove();
        };
    }, [GOOGLE_CLIENT_ID, handleGoogleToken]);

    const handleGoogleLogin = () => {
        if (!tokenClientRef.current || !googleReady) {
            alert('Google Sign-In is not ready. Please refresh the page.');
            return;
        }
        setGoogleLoading(true);
        // This opens a popup window for OAuth
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
        } catch (err) {
            console.error('Login error:', err);
            // Still allow guest login even if server fails
            onLogin(username.trim());
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="screen fade-in" style={{ position: 'relative', padding: '16px' }}>
            {/* Decorative sword icons - hidden on small screens */}
            <div style={{
                position: 'absolute',
                top: '10%',
                left: '10%',
                fontSize: 'clamp(2rem, 6vw, 4rem)',
                opacity: 0.1,
                transform: 'rotate(-30deg)',
                pointerEvents: 'none',
                display: window.innerWidth < 400 ? 'none' : 'block'
            }}>⚔️</div>
            <div style={{
                position: 'absolute',
                bottom: '10%',
                right: '10%',
                fontSize: 'clamp(2rem, 6vw, 4rem)',
                opacity: 0.1,
                transform: 'rotate(30deg)',
                pointerEvents: 'none',
                display: window.innerWidth < 400 ? 'none' : 'block'
            }}>⚔️</div>

            {/* Main card */}
            <div className="card" style={{
                maxWidth: '440px',
                width: '100%',
                textAlign: 'center',
                padding: 'clamp(16px, 4vw, 40px)'
            }}>
                {/* Logo/Title */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <h1 className="title" style={{
                        fontSize: 'clamp(1.6rem, 6vw, 2.8rem)',
                        marginBottom: '0.5rem',
                        lineHeight: 1.1
                    }}>
                        Blades of the Fallen
                    </h1>
                    <p style={{
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: 'clamp(0.7rem, 2vw, 0.9rem)',
                        fontStyle: 'italic',
                        letterSpacing: '2px'
                    }}>
                        Prepare for Battle
                    </p>
                </div>

                {/* Guest Login Form */}
                <form onSubmit={handleGuestLogin} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your warrior name"
                            className="input"
                            style={{
                                width: '100%',
                                paddingLeft: '48px',
                                fontSize: '1rem'
                            }}
                            maxLength={20}
                            disabled={isLoading}
                        />
                        <span style={{
                            position: 'absolute',
                            left: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: '1.2rem',
                            opacity: 0.5
                        }}>👤</span>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={!username.trim() || username.length < 2 || isLoading}
                        style={{
                            width: '100%',
                            padding: '16px',
                            fontSize: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            opacity: (!username.trim() || username.length < 2) ? 0.5 : 1
                        }}
                    >
                        {isLoading ? (
                            <>
                                <span style={{
                                    animation: 'spin 1s linear infinite',
                                    display: 'inline-block'
                                }}>⚔️</span>
                                Entering Arena...
                            </>
                        ) : (
                            <>⚔️ Enter the Arena</>
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div className="divider">
                    <span>or</span>
                </div>

                {/* Google Sign In */}
                <button
                    onClick={handleGoogleLogin}
                    className="btn btn-google"
                    disabled={googleLoading || !googleReady}
                    style={{
                        width: '100%',
                        padding: '14px',
                        opacity: (!googleReady) ? 0.6 : 1
                    }}
                >
                    {googleLoading ? (
                        'Connecting...'
                    ) : (
                        <>
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Sign in with Google
                        </>
                    )}
                </button>

                {/* Connection Status */}
                <div style={{
                    marginTop: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                }}>
                    <span style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: connected ? '#22c55e' : '#ef4444',
                        boxShadow: connected
                            ? '0 0 10px #22c55e, 0 0 20px rgba(34, 197, 94, 0.5)'
                            : '0 0 10px #ef4444',
                        animation: connected ? 'pulse 2s ease-in-out infinite' : 'none'
                    }}></span>
                    <span style={{
                        color: connected ? '#22c55e' : '#ef4444',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        letterSpacing: '1px'
                    }}>
                        {connected ? 'CONNECTED TO SERVER' : 'CONNECTING...'}
                    </span>
                </div>

                {/* Leaderboard hint */}
                <p style={{
                    marginTop: '20px',
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.4)',
                    lineHeight: 1.5
                }}>
                    Sign in with Google to appear on the global leaderboard
                </p>
            </div>

            {/* Spin animation */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
