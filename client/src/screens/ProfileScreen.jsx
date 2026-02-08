import { useState, useEffect } from 'react';

export default function ProfileScreen({ user, onBack }) {
    const [profile, setProfile] = useState(user);
    const [matchHistory, setMatchHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    // Auto-detect production vs development
    const isProduction = window.location.protocol === 'https:';
    const API_URL = import.meta.env.VITE_API_URL || (isProduction
        ? `https://${window.location.hostname.replace('frontend', 'backend')}/api`
        : 'http://localhost:3001/api');

    useEffect(() => {
        if (user?.id) {
            fetchProfile();
        } else {
            setLoading(false);
        }
    }, [user?.id]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                setMatchHistory(data.matchHistory || []);
            }
        } catch (err) {
            console.log('Using local profile data');
        } finally {
            setLoading(false);
        }
    };

    const getRankInfo = (rank) => {
        const ranks = {
            'Bronze': { icon: '🥉', color: '#cd7f32', glow: 'rgba(205, 127, 50, 0.3)' },
            'Silver': { icon: '🥈', color: '#c0c0c0', glow: 'rgba(192, 192, 192, 0.3)' },
            'Gold': { icon: '🥇', color: '#ffd700', glow: 'rgba(255, 215, 0, 0.3)' },
            'Platinum': { icon: '💎', color: '#00d4ff', glow: 'rgba(0, 212, 255, 0.3)' },
            'Diamond': { icon: '💠', color: '#b9f2ff', glow: 'rgba(185, 242, 255, 0.3)' },
            'Master': { icon: '👑', color: '#ff6b6b', glow: 'rgba(255, 107, 107, 0.3)' }
        };
        return ranks[rank] || ranks['Bronze'];
    };

    const displayProfile = profile || {
        username: 'Guest Player',
        level: 1,
        elo: 1000,
        rank: 'Bronze',
        stats: { wins: 0, losses: 0, totalMatches: 0 },
        winRate: 0
    };

    const rankInfo = getRankInfo(displayProfile.rank);

    return (
        <div className="screen fade-in">
            <div className="card" style={{ maxWidth: '600px', width: '100%' }}>
                {/* Profile Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '24px',
                    marginBottom: '32px',
                    paddingBottom: '24px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}>
                    {/* Avatar */}
                    <div style={{
                        position: 'relative'
                    }}>
                        <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
                            padding: '4px',
                            boxShadow: `0 0 30px ${rankInfo.glow}`
                        }}>
                            <img
                                src={displayProfile.avatar || 'https://via.placeholder.com/100?text=👤'}
                                alt="Avatar"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    background: '#0a0a0f'
                                }}
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/100?text=👤'; }}
                            />
                        </div>
                        {/* Level Badge */}
                        <div style={{
                            position: 'absolute',
                            bottom: '-8px',
                            right: '-8px',
                            background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            border: '3px solid #0a0a0f'
                        }}>
                            {displayProfile.level}
                        </div>
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1 }}>
                        <h2 style={{
                            fontSize: '1.8rem',
                            marginBottom: '8px',
                            background: 'linear-gradient(135deg, #fff, #a855f7)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            {displayProfile.username}
                        </h2>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            background: `linear-gradient(135deg, ${rankInfo.color}22, ${rankInfo.color}11)`,
                            borderRadius: '20px',
                            border: `1px solid ${rankInfo.color}33`,
                            fontSize: '0.9rem'
                        }}>
                            <span>{rankInfo.icon}</span>
                            <span style={{ color: rankInfo.color, fontWeight: 600 }}>{displayProfile.rank}</span>
                            <span style={{ color: 'rgba(255,255,255,0.3)' }}>•</span>
                            <span style={{ color: '#fbbf24', fontWeight: 700 }}>{displayProfile.elo} ELO</span>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '16px',
                    marginBottom: '32px'
                }}>
                    {/* Wins */}
                    <div style={{
                        background: 'rgba(34, 197, 94, 0.1)',
                        border: '1px solid rgba(34, 197, 94, 0.2)',
                        borderRadius: '16px',
                        padding: '20px',
                        textAlign: 'center',
                        transition: 'all 0.3s ease'
                    }}>
                        <div style={{
                            fontSize: '2.2rem',
                            fontWeight: 900,
                            color: '#22c55e',
                            textShadow: '0 0 20px rgba(34, 197, 94, 0.5)'
                        }}>
                            {displayProfile.stats?.wins || 0}
                        </div>
                        <div style={{
                            fontSize: '0.7rem',
                            color: 'rgba(255,255,255,0.5)',
                            textTransform: 'uppercase',
                            letterSpacing: '2px',
                            marginTop: '4px'
                        }}>Victories</div>
                    </div>

                    {/* Losses */}
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '16px',
                        padding: '20px',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            fontSize: '2.2rem',
                            fontWeight: 900,
                            color: '#ef4444',
                            textShadow: '0 0 20px rgba(239, 68, 68, 0.5)'
                        }}>
                            {displayProfile.stats?.losses || 0}
                        </div>
                        <div style={{
                            fontSize: '0.7rem',
                            color: 'rgba(255,255,255,0.5)',
                            textTransform: 'uppercase',
                            letterSpacing: '2px',
                            marginTop: '4px'
                        }}>Defeats</div>
                    </div>

                    {/* Win Rate */}
                    <div style={{
                        background: 'rgba(168, 85, 247, 0.1)',
                        border: '1px solid rgba(168, 85, 247, 0.2)',
                        borderRadius: '16px',
                        padding: '20px',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            fontSize: '2.2rem',
                            fontWeight: 900,
                            color: '#a855f7',
                            textShadow: '0 0 20px rgba(168, 85, 247, 0.5)'
                        }}>
                            {displayProfile.winRate || 0}%
                        </div>
                        <div style={{
                            fontSize: '0.7rem',
                            color: 'rgba(255,255,255,0.5)',
                            textTransform: 'uppercase',
                            letterSpacing: '2px',
                            marginTop: '4px'
                        }}>Win Rate</div>
                    </div>
                </div>

                {/* Additional Stats */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px',
                    marginBottom: '32px'
                }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '12px',
                        padding: '16px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>
                            {displayProfile.stats?.totalMatches || 0}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                            Total Matches
                        </div>
                    </div>
                    <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '12px',
                        padding: '16px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>
                            {displayProfile.kd || '0.00'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                            K/D Ratio
                        </div>
                    </div>
                    <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '12px',
                        padding: '16px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fbbf24' }}>
                            {displayProfile.stats?.bestWinStreak || 0}🔥
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                            Best Streak
                        </div>
                    </div>
                </div>

                {/* Match History */}
                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{
                        fontSize: '1rem',
                        color: 'rgba(255,255,255,0.6)',
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        marginBottom: '16px'
                    }}>
                        Recent Battles
                    </h3>
                    {matchHistory.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {matchHistory.map((match, i) => (
                                <div key={i} style={{
                                    padding: '12px 16px',
                                    background: match.result === 'win'
                                        ? 'rgba(34, 197, 94, 0.1)'
                                        : match.result === 'loss'
                                            ? 'rgba(239, 68, 68, 0.1)'
                                            : 'rgba(251, 191, 36, 0.1)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span>vs {match.opponent}</span>
                                    <div>
                                        <span style={{
                                            color: match.result === 'win' ? '#22c55e' :
                                                match.result === 'loss' ? '#ef4444' : '#fbbf24',
                                            fontWeight: 700,
                                            marginRight: '12px'
                                        }}>
                                            {match.result.toUpperCase()}
                                        </span>
                                        <span style={{
                                            color: match.eloChange > 0 ? '#22c55e' : '#ef4444'
                                        }}>
                                            {match.eloChange > 0 ? '+' : ''}{match.eloChange}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{
                            textAlign: 'center',
                            padding: '40px',
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '12px',
                            color: 'rgba(255,255,255,0.4)'
                        }}>
                            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚔️</div>
                            No battles recorded yet
                        </div>
                    )}
                </div>

                <button
                    className="btn"
                    onClick={onBack}
                    style={{ width: '100%' }}
                >
                    ← Back to Lobby
                </button>
            </div>
        </div>
    );
}
