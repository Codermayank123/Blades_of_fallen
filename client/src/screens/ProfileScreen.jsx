import { useState, useEffect } from 'react';

const GAME_MODE_META = {
    duel: { label: 'Arena Duel', color: '#fb7185', icon: '⚔️' },
    bomb_relay: { label: 'Bomb Relay', color: '#f97316', icon: '💣' },
    territory: { label: 'Territory', color: '#34d399', icon: '🗺️' },
    neon_drift: { label: 'Neon Drift', color: '#67e8f9', icon: '🏎️' },
    cricket_pro: { label: 'Cricket Clash', color: '#a78bfa', icon: '🏏' },
};

export default function ProfileScreen({ user, onBack }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [toast, setToast] = useState('');

    const isProduction = window.location.protocol === 'https:';
    const API_URL = import.meta.env.VITE_API_URL || (isProduction
        ? `https://${window.location.hostname.replace('frontend', 'backend')}/api`
        : 'http://localhost:3001/api');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/user/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProfile(data.user || data);
            } else {
                setProfile(user);
            }
        } catch {
            setProfile(user);
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 500_000) {
            setToast('File too large — max 500KB');
            return;
        }

        const reader = new FileReader();
        reader.onload = async () => {
            const base64 = reader.result;
            setUploading(true);
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/user/avatar`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ avatar: base64 })
                });
                if (res.ok) {
                    const data = await res.json();
                    setProfile(prev => ({ ...prev, avatar: data.user?.avatar || base64 }));
                    const stored = JSON.parse(localStorage.getItem('user') || '{}');
                    stored.avatar = data.user?.avatar || base64;
                    localStorage.setItem('user', JSON.stringify(stored));
                    setToast('Avatar updated');
                } else {
                    setToast('Upload failed');
                }
            } catch {
                setToast('Upload failed');
            } finally {
                setUploading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    useEffect(() => {
        if (toast) { const t = setTimeout(() => setToast(''), 3000); return () => clearTimeout(t); }
    }, [toast]);

    const p = profile || user || {};
    const displayName = p.username?.includes('_') ? p.username.split('_')[0] : (p.username || 'Player');
    const wins = p.stats?.wins || p.wins || 0;
    const losses = p.stats?.losses || p.losses || 0;
    const total = wins + losses;
    const winRate = total ? ((wins / total) * 100).toFixed(1) : '0.0';
    const elo = p.stats?.elo || p.elo || 1000;
    const level = p.level || Math.floor((p.stats?.xp || p.xp || 0) / 100) + 1;
    const matchHistory = p.matchHistory || [];

    // Build per-game stats from profile.gameStats (Map serialized as object)
    const rawGameStats = p.gameStats || {};
    const gameStatsEntries = Object.entries(rawGameStats).filter(
        ([, s]) => s && (s.wins || s.losses || s.draws || s.total)
    );

    const getRankName = (e) => {
        if (e >= 2200) return 'Master';
        if (e >= 1800) return 'Diamond';
        if (e >= 1500) return 'Platinum';
        if (e >= 1200) return 'Gold';
        if (e >= 900) return 'Silver';
        return 'Bronze';
    };

    const getRankColor = (name) => ({
        Master: '#fb7185', Diamond: '#67e8f9', Platinum: '#a5b4fc',
        Gold: '#fbbf24', Silver: '#cbd5e1', Bronze: '#d97706',
    }[name] || '#d97706');

    const rankName = getRankName(elo);
    const rankColor = getRankColor(rankName);

    const initials = displayName.slice(0, 2).toUpperCase();

    if (loading) {
        return (
            <div className="screen fade-in">
                <div className="panel" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', padding: 'var(--sp-12)' }}>
                    <div style={{ color: 'var(--c-text-off)' }}>Loading profile...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="screen fade-in" style={{ padding: 'var(--sp-4)', paddingTop: '64px', justifyContent: 'flex-start' }}>
            <div style={{ maxWidth: '560px', width: '100%', margin: '0 auto' }}>
                {/* Toast */}
                {toast && <div className={`toast ${toast.includes('fail') ? 'toast--error' : 'toast--success'}`}>{toast}</div>}

                {/* Avatar + Name */}
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    marginBottom: 'var(--sp-8)',
                }}>
                    <label style={{
                        width: '88px', height: '88px', borderRadius: '50%',
                        overflow: 'hidden', cursor: 'pointer', marginBottom: 'var(--sp-4)',
                        border: `2px solid ${rankColor}`,
                        boxShadow: `0 0 20px ${rankColor}33`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: p.avatar ? 'transparent' : 'var(--c-surface2)',
                        position: 'relative',
                    }}>
                        {p.avatar ? (
                            <img src={p.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <span style={{
                                fontFamily: 'var(--f-mono)', fontSize: '1.4rem',
                                fontWeight: 800, color: rankColor, letterSpacing: '2px',
                            }}>{initials}</span>
                        )}
                        {uploading && (
                            <div style={{
                                position: 'absolute', inset: 0,
                                background: 'rgba(0,0,0,0.6)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.7rem', color: 'var(--c-text)',
                            }}>...</div>
                        )}
                        <input type="file" accept="image/*" onChange={handleAvatarUpload}
                            style={{ display: 'none' }}
                        />
                    </label>

                    <h2 style={{
                        fontFamily: 'var(--f-mono)', fontSize: '1.2rem',
                        fontWeight: 700, letterSpacing: '2px', marginBottom: 'var(--sp-1)',
                    }}>
                        {displayName.toUpperCase()}
                    </h2>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
                    }}>
                        <span className="badge" style={{
                            background: `${rankColor}18`, color: rankColor,
                            borderColor: `${rankColor}33`,
                        }}>
                            {rankName}
                        </span>
                        <span style={{
                            fontSize: '0.75rem', color: 'var(--c-text-off)',
                        }}>
                            Level {level}
                        </span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="section-label">Stats</div>
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 'var(--sp-3)', marginBottom: 'var(--sp-6)',
                }}>
                    {[
                        { label: 'ELO', value: elo, color: 'var(--c-amber)' },
                        { label: 'Wins', value: wins, color: 'var(--c-green)' },
                        { label: 'Losses', value: losses, color: 'var(--c-red)' },
                        { label: 'Win %', value: `${winRate}%`, color: 'var(--c-cyan)' },
                    ].map(s => (
                        <div className="stat-card" key={s.label}>
                            <div className="stat-card__value" style={{ color: s.color }}>{s.value}</div>
                            <div className="stat-card__label">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Per-Game Breakdown */}
                {gameStatsEntries.length > 0 && (
                    <>
                        <div className="section-label">Per-Game Breakdown</div>
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                            gap: 'var(--sp-3)', marginBottom: 'var(--sp-6)',
                        }}>
                            {gameStatsEntries.map(([mode, s]) => {
                                const meta = GAME_MODE_META[mode] || { label: mode, color: '#94a3b8', icon: '🎮' };
                                const gW = s.wins || 0, gL = s.losses || 0, gD = s.draws || 0;
                                const gT = s.total || (gW + gL + gD);
                                const gWR = gT ? ((gW / gT) * 100).toFixed(0) : '0';
                                return (
                                    <div key={mode} className="panel" style={{
                                        padding: 'var(--sp-4)',
                                        borderLeft: `3px solid ${meta.color}`,
                                        background: 'var(--c-surface)',
                                    }}>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
                                            marginBottom: 'var(--sp-3)',
                                        }}>
                                            <span style={{ fontSize: '1.3rem' }}>{meta.icon}</span>
                                            <span style={{
                                                fontFamily: 'var(--f-mono)', fontWeight: 700,
                                                fontSize: '0.85rem', letterSpacing: '1px',
                                                color: meta.color,
                                            }}>{meta.label}</span>
                                        </div>
                                        <div style={{
                                            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                                            gap: 'var(--sp-2)', textAlign: 'center',
                                        }}>
                                            {[
                                                { l: 'W', v: gW, c: 'var(--c-green)' },
                                                { l: 'L', v: gL, c: 'var(--c-red)' },
                                                { l: 'Total', v: gT, c: 'var(--c-text)' },
                                                { l: 'Win%', v: `${gWR}%`, c: 'var(--c-cyan)' },
                                            ].map(stat => (
                                                <div key={stat.l}>
                                                    <div style={{
                                                        fontSize: '1rem', fontWeight: 700,
                                                        fontFamily: 'var(--f-mono)', color: stat.c,
                                                    }}>{stat.v}</div>
                                                    <div style={{
                                                        fontSize: '0.6rem', color: 'var(--c-text-off)',
                                                        textTransform: 'uppercase', letterSpacing: '1px',
                                                    }}>{stat.l}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* Match History */}
                <div className="section-label">Recent Matches</div>
                <div className="panel" style={{ padding: 'var(--sp-4)', marginBottom: 'var(--sp-6)' }}>
                    {matchHistory.length === 0 ? (
                        <div style={{
                            textAlign: 'center', padding: 'var(--sp-8)',
                            color: 'var(--c-text-off)', fontSize: '0.85rem',
                        }}>
                            No matches played yet
                        </div>
                    ) : (
                        matchHistory.slice(0, 10).map((m, i) => {
                            const isWin = m.result === 'win';
                            const isDraw = m.result === 'draw';
                            return (
                                <div key={i} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: 'var(--sp-3) 0',
                                    borderBottom: i < matchHistory.length - 1 ? '1px solid var(--c-border)' : 'none',
                                }}>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                            {m.gameType || 'Unknown'}
                                        </div>
                                        <div style={{
                                            fontSize: '0.7rem', color: 'var(--c-text-off)',
                                        }}>
                                            vs {m.opponent || 'Unknown'}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{
                                            fontSize: '0.8rem', fontWeight: 700,
                                            color: isDraw ? 'var(--c-amber)' : (isWin ? 'var(--c-green)' : 'var(--c-red)'),
                                        }}>
                                            {isDraw ? 'Draw' : (isWin ? 'Victory' : 'Defeat')}
                                        </div>
                                        {m.eloChange !== undefined && (
                                            <div style={{
                                                fontSize: '0.7rem',
                                                color: m.eloChange >= 0 ? 'var(--c-green)' : 'var(--c-red)',
                                            }}>
                                                {m.eloChange >= 0 ? '+' : ''}{m.eloChange} ELO
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <button className="btn2 btn2--ghost btn2--block" onClick={onBack}>
                    Back to Hub
                </button>
            </div>
        </div>
    );
}
