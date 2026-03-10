import { useState } from 'react';

export default function TopNav({ currentScreen, onNavigate, user }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const isAdmin = user?.role === 'admin';

    const navItems = isAdmin
        ? [
            { id: 'admin', label: 'Admin' },
            { id: 'leaderboard', label: 'Rankings' },
            { id: 'profile', label: 'Profile' },
            { id: 'about', label: 'About' },
        ]
        : [
            { id: 'lobby', label: 'Hub' },
            { id: 'leaderboard', label: 'Rankings' },
            { id: 'profile', label: 'Profile' },
            { id: 'howtoplay', label: 'How to Play' },
            { id: 'about', label: 'About' },
            { id: 'contact', label: 'Support' },
        ];

    return (
        <nav style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
            background: 'rgba(6,6,9,0.92)',
            backdropFilter: 'blur(24px)',
            borderBottom: '1px solid var(--c-border)',
        }}>
            <div style={{
                maxWidth: '1200px', margin: '0 auto',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                height: '52px', padding: '0 var(--sp-5)',
            }}>
                {/* Logo — text only */}
                <div
                    onClick={() => onNavigate('lobby')}
                    style={{
                        fontFamily: 'var(--f-mono)',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        letterSpacing: '3px',
                        color: 'var(--c-primary-l)',
                        cursor: 'pointer',
                        userSelect: 'none',
                    }}
                >
                    NEXUS
                </div>

                {/* Desktop links */}
                <div className="topnav-desktop" style={{
                    display: 'flex', gap: '2px', alignItems: 'center',
                }}>
                    {navItems.map(item => {
                        const active = currentScreen === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id)}
                                style={{
                                    background: active ? 'rgba(139,92,246,0.1)' : 'transparent',
                                    border: 'none',
                                    borderBottom: active ? '2px solid var(--c-primary)' : '2px solid transparent',
                                    color: active ? 'var(--c-primary-l)' : 'var(--c-text-dim)',
                                    padding: '14px 12px',
                                    cursor: 'pointer',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    fontFamily: 'var(--f-body)',
                                    letterSpacing: '0.3px',
                                    transition: 'all 0.2s ease',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {item.label}
                            </button>
                        );
                    })}
                </div>

                {/* Mobile hamburger */}
                <button
                    className="topnav-hamburger"
                    onClick={() => setMenuOpen(!menuOpen)}
                    style={{
                        display: 'none',
                        background: 'none', border: 'none',
                        color: 'var(--c-text)', fontSize: '1.3rem',
                        cursor: 'pointer', padding: '8px',
                        fontFamily: 'var(--f-body)', fontWeight: 300,
                    }}
                >
                    {menuOpen ? '\u2715' : '\u2630'}
                </button>
            </div>

            {/* Mobile dropdown */}
            {menuOpen && (
                <div className="topnav-mobile" style={{
                    padding: 'var(--sp-2) var(--sp-4) var(--sp-4)',
                    display: 'flex', flexDirection: 'column', gap: '2px',
                    borderTop: '1px solid var(--c-border)',
                }}>
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => { onNavigate(item.id); setMenuOpen(false); }}
                            style={{
                                background: currentScreen === item.id ? 'rgba(139,92,246,0.08)' : 'transparent',
                                border: 'none',
                                color: currentScreen === item.id ? 'var(--c-primary-l)' : 'var(--c-text-dim)',
                                padding: '12px 16px',
                                borderRadius: 'var(--r-md)',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                fontFamily: 'var(--f-body)',
                                textAlign: 'left',
                                width: '100%',
                                transition: 'all 0.15s',
                            }}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            )}

            <style>{`
                @media (max-width: 768px) {
                    .topnav-desktop { display: none !important; }
                    .topnav-hamburger { display: block !important; }
                }
                @media (min-width: 769px) {
                    .topnav-mobile { display: none !important; }
                }
            `}</style>
        </nav>
    );
}
