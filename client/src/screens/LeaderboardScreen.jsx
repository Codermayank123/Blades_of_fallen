import { useState, useEffect } from 'react';

export default function LeaderboardScreen({ currentUser, onBack }) {
    const [leaderboard, setLeaderboard] = useState([]);
    const [myRank, setMyRank] = useState(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

    useEffect(() => {
        fetchLeaderboard();
    }, [page]);

    useEffect(() => {
        if (currentUser?.id) {
            fetchMyRank();
        }
    }, [currentUser?.id]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/leaderboard?page=${page}&limit=20`);
            if (res.ok) {
                const data = await res.json();
                setLeaderboard(data.leaderboard);
                setTotalPages(data.pagination.pages || 1);
            }
        } catch (err) {
            setLeaderboard([
                { position: 1, username: 'ShadowBlade', elo: 2450, rank: { name: 'Diamond', icon: '💠' }, wins: 342, losses: 89 },
                { position: 2, username: 'DragonFist', elo: 2380, rank: { name: 'Diamond', icon: '💠' }, wins: 298, losses: 102 },
                { position: 3, username: 'NightStriker', elo: 2210, rank: { name: 'Platinum', icon: '💎' }, wins: 256, losses: 134 },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyRank = async () => {
        try {
            const res = await fetch(`${API_URL}/leaderboard/rank/${currentUser.id}`);
            if (res.ok) {
                setMyRank(await res.json());
            }
        } catch (err) {
            console.log('Rank unavailable');
        }
    };

    const getRankDisplay = (rank) => {
        if (!rank) return { icon: '🥉', name: 'Bronze' };
        if (typeof rank === 'string') {
            const ranks = {
                'Bronze': { icon: '🥉', name: 'Bronze', color: '#cd7f32' },
                'Silver': { icon: '🥈', name: 'Silver', color: '#c0c0c0' },
                'Gold': { icon: '🥇', name: 'Gold', color: '#ffd700' },
                'Platinum': { icon: '💎', name: 'Platinum', color: '#00d4ff' },
                'Diamond': { icon: '💠', name: 'Diamond', color: '#b9f2ff' },
                'Master': { icon: '👑', name: 'Master', color: '#ff6b6b' }
            };
            return ranks[rank] || { icon: '🥉', name: rank, color: '#cd7f32' };
        }
        return rank;
    };

    const getPositionStyle = (position) => {
        if (position === 1) return { color: '#ffd700', textShadow: '0 0 15px rgba(255, 215, 0, 0.5)' };
        if (position === 2) return { color: '#c0c0c0', textShadow: '0 0 15px rgba(192, 192, 192, 0.5)' };
        if (position === 3) return { color: '#cd7f32', textShadow: '0 0 15px rgba(205, 127, 50, 0.5)' };
        return { color: 'rgba(255,255,255,0.7)' };
    };

    return (
        <div className="screen fade-in">
            <div className="card" style={{ maxWidth: '800px', width: '100%' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🏆</div>
                    <h2 style={{
                        fontSize: '2rem',
                        background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '4px'
                    }}>
                        GLOBAL LEADERBOARD
                    </h2>
                    <p style={{
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: '0.85rem',
                        marginTop: '8px'
                    }}>
                        🔒 Only Google-verified warriors appear
                    </p>
                </div>

                {/* My Rank */}
                {myRank && (
                    <div style={{
                        background: myRank.verified
                            ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(168, 85, 247, 0.1))'
                            : 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(251, 191, 36, 0.1))',
                        padding: '20px',
                        borderRadius: '16px',
                        marginBottom: '24px',
                        border: myRank.verified
                            ? '1px solid rgba(168, 85, 247, 0.3)'
                            : '1px solid rgba(251, 191, 36, 0.3)',
                        textAlign: 'center'
                    }}>
                        {myRank.verified ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '1.1rem' }}>
                                    Your Rank: <strong style={{ color: '#a855f7', fontSize: '1.3rem' }}>#{myRank.position}</strong>
                                </span>
                                <span style={{
                                    padding: '6px 16px',
                                    background: 'rgba(168, 85, 247, 0.2)',
                                    borderRadius: '20px',
                                    fontSize: '0.9rem'
                                }}>
                                    Top {myRank.percentile}%
                                </span>
                                <span>
                                    {getRankDisplay(myRank.rank).icon} {getRankDisplay(myRank.rank).name}
                                </span>
                            </div>
                        ) : (
                            <span style={{ color: '#fbbf24' }}>
                                ⚠️ {myRank.message || 'Sign in with Google to appear on the leaderboard'}
                            </span>
                        )}
                    </div>
                )}

                {/* Leaderboard Table */}
                {loading ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px',
                        color: 'rgba(255,255,255,0.5)'
                    }}>
                        <div style={{
                            fontSize: '2rem',
                            animation: 'spin 1s linear infinite',
                            display: 'inline-block'
                        }}>⚔️</div>
                        <p style={{ marginTop: '16px' }}>Loading warriors...</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{
                            width: '100%',
                            borderCollapse: 'separate',
                            borderSpacing: '0 8px'
                        }}>
                            <thead>
                                <tr>
                                    <th style={{
                                        padding: '12px 16px',
                                        textAlign: 'left',
                                        color: '#a855f7',
                                        fontSize: '0.75rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '2px',
                                        borderBottom: '1px solid rgba(168, 85, 247, 0.2)'
                                    }}>Rank</th>
                                    <th style={{ padding: '12px', textAlign: 'left', color: '#a855f7', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', borderBottom: '1px solid rgba(168, 85, 247, 0.2)' }}>Warrior</th>
                                    <th style={{ padding: '12px', textAlign: 'center', color: '#a855f7', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', borderBottom: '1px solid rgba(168, 85, 247, 0.2)' }}>Tier</th>
                                    <th style={{ padding: '12px', textAlign: 'center', color: '#a855f7', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', borderBottom: '1px solid rgba(168, 85, 247, 0.2)' }}>ELO</th>
                                    <th style={{ padding: '12px', textAlign: 'center', color: '#a855f7', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', borderBottom: '1px solid rgba(168, 85, 247, 0.2)' }}>Record</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboard.map((player, idx) => {
                                    const rankInfo = getRankDisplay(player.rank);
                                    const posStyle = getPositionStyle(player.position);
                                    return (
                                        <tr key={player.position} style={{
                                            background: player.position <= 3
                                                ? 'linear-gradient(90deg, rgba(168, 85, 247, 0.1), transparent)'
                                                : 'rgba(255,255,255,0.03)',
                                            transition: 'all 0.3s ease'
                                        }}>
                                            <td style={{
                                                padding: '16px',
                                                borderRadius: '12px 0 0 12px',
                                                fontWeight: 900,
                                                fontSize: '1.2rem',
                                                ...posStyle
                                            }}>
                                                {player.position <= 3 ? ['🥇', '🥈', '🥉'][player.position - 1] : `#${player.position}`}
                                            </td>
                                            <td style={{ padding: '16px', fontWeight: 600 }}>
                                                {player.username}
                                            </td>
                                            <td style={{
                                                padding: '16px',
                                                textAlign: 'center',
                                                color: rankInfo.color
                                            }}>
                                                {rankInfo.icon} {rankInfo.name}
                                            </td>
                                            <td style={{
                                                padding: '16px',
                                                textAlign: 'center',
                                                fontWeight: 700,
                                                fontSize: '1.1rem',
                                                color: '#fbbf24'
                                            }}>
                                                {player.elo}
                                            </td>
                                            <td style={{
                                                padding: '16px',
                                                textAlign: 'center',
                                                borderRadius: '0 12px 12px 0'
                                            }}>
                                                <span style={{ color: '#22c55e' }}>{player.wins}W</span>
                                                <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 4px' }}>/</span>
                                                <span style={{ color: '#ef4444' }}>{player.losses}L</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '16px',
                        marginTop: '24px'
                    }}>
                        <button
                            className="btn"
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            style={{ opacity: page === 1 ? 0.5 : 1 }}
                        >
                            ← Previous
                        </button>
                        <span style={{
                            padding: '10px 20px',
                            background: 'rgba(168, 85, 247, 0.2)',
                            borderRadius: '8px'
                        }}>
                            Page {page} of {totalPages}
                        </span>
                        <button
                            className="btn"
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            style={{ opacity: page === totalPages ? 0.5 : 1 }}
                        >
                            Next →
                        </button>
                    </div>
                )}

                <button
                    className="btn"
                    onClick={onBack}
                    style={{ marginTop: '24px', width: '100%' }}
                >
                    ← Back to Lobby
                </button>
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
