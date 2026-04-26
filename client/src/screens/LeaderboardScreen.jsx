import { useState, useEffect } from 'react';

export default function LeaderboardScreen({ currentUser, onBack }) {
    const [leaderboard, setLeaderboard] = useState([]);
    const [myRank, setMyRank] = useState(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const isProduction = window.location.protocol === 'https:';
    const API_URL = import.meta.env.VITE_API_URL || (isProduction
        ? `https://${window.location.hostname.replace('frontend', 'backend')}/api`
        : 'http://localhost:3001/api');

    useEffect(() => { fetchLeaderboard(); }, [page]);
    useEffect(() => { if (currentUser?.id) fetchMyRank(); }, [currentUser?.id]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/leaderboard?page=${page}&limit=20`);
            if (res.ok) {
                const data = await res.json();
                setLeaderboard(data.leaderboard);
                setTotalPages(data.pagination.pages || 1);
            }
        } catch {
            setLeaderboard([
                { position: 1, username: 'ShadowBlade', elo: 2450, rank: 'Diamond', wins: 342, losses: 89 },
                { position: 2, username: 'DragonFist', elo: 2380, rank: 'Diamond', wins: 298, losses: 102 },
                { position: 3, username: 'NightStriker', elo: 2210, rank: 'Platinum', wins: 256, losses: 134 },
            ]);
        } finally { setLoading(false); }
    };

    const fetchMyRank = async () => {
        try {
            const res = await fetch(`${API_URL}/leaderboard/rank/${currentUser.id}`);
            if (res.ok) setMyRank(await res.json());
        } catch { /* rank unavailable */ }
    };

    const getRankColor = (rank) => {
        const name = typeof rank === 'string' ? rank : rank?.name || 'Bronze';
        return { Master: '#fb7185', Diamond: '#67e8f9', Platinum: '#a5b4fc', Gold: '#fbbf24', Silver: '#cbd5e1', Bronze: '#d97706' }[name] || '#d97706';
    };
    const getRankName = (rank) => typeof rank === 'string' ? rank : rank?.name || 'Bronze';

    const posColor = (p) => p === 1 ? '#fbbf24' : p === 2 ? '#cbd5e1' : p === 3 ? '#d97706' : 'var(--c-text-dim)';

    return (
        <div className="screen fade-in" style={{
            padding: 'var(--sp-4)', paddingTop: '64px',
            justifyContent: 'flex-start',
        }}>
            <div style={{ maxWidth: '700px', width: '100%', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 'var(--sp-6)' }}>
                    <h1 style={{
                        fontFamily: 'var(--f-mono)', fontSize: 'clamp(1rem, 4vw, 1.4rem)',
                        fontWeight: 800, letterSpacing: '4px', color: 'var(--c-amber)',
                        marginBottom: 'var(--sp-2)',
                    }}>
                        GLOBAL RANKINGS
                    </h1>
                    <p style={{ color: 'var(--c-text-off)', fontSize: '0.75rem', letterSpacing: '2px', textTransform: 'uppercase' }}>
                        Google-verified warriors only
                    </p>
                </div>

                {/* My Rank */}
                {myRank && (
                    <div className="panel" style={{ marginBottom: 'var(--sp-5)', textAlign: 'center', padding: 'var(--sp-5)' }}>
                        {myRank.verified ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-5)', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.9rem', color: 'var(--c-text-dim)' }}>
                                    Your Rank: <strong style={{ color: 'var(--c-primary-l)', fontSize: '1.2rem' }}>#{myRank.position}</strong>
                                </span>
                                <span className="badge">Top {myRank.percentile}%</span>
                            </div>
                        ) : (
                            <span style={{ color: 'var(--c-amber)', fontSize: '0.85rem' }}>
                                {myRank.message || 'Sign in with Google to appear on rankings'}
                            </span>
                        )}
                    </div>
                )}

                {/* Table */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 'var(--sp-12)', color: 'var(--c-text-off)' }}>
                        Loading...
                    </div>
                ) : (
                    <div className="panel" style={{ padding: 'var(--sp-4)', overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {['Rank', 'Player', 'Tier', 'ELO', 'Record'].map(h => (
                                        <th key={h} style={{
                                            padding: 'var(--sp-3) var(--sp-4)',
                                            textAlign: h === 'Rank' || h === 'Player' ? 'left' : 'center',
                                            color: 'var(--c-text-off)', fontSize: '0.65rem',
                                            textTransform: 'uppercase', letterSpacing: '2px',
                                            fontWeight: 700,
                                            borderBottom: '1px solid var(--c-border)',
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboard.map((player) => (
                                    <tr key={player.position} style={{
                                        borderBottom: '1px solid var(--c-border)',
                                        transition: 'background 0.2s',
                                    }}>
                                        <td style={{
                                            padding: 'var(--sp-3) var(--sp-4)',
                                            fontWeight: 800, fontSize: '1rem',
                                            color: posColor(player.position),
                                            fontFamily: 'var(--f-mono)',
                                        }}>
                                            #{player.position}
                                        </td>
                                        <td style={{
                                            padding: 'var(--sp-3) var(--sp-4)',
                                            fontWeight: 600, fontSize: '0.875rem',
                                        }}>
                                            {player.username}
                                        </td>
                                        <td style={{
                                            padding: 'var(--sp-3) var(--sp-4)',
                                            textAlign: 'center',
                                            color: getRankColor(player.rank),
                                            fontSize: '0.8rem', fontWeight: 600,
                                        }}>
                                            {getRankName(player.rank)}
                                        </td>
                                        <td style={{
                                            padding: 'var(--sp-3) var(--sp-4)',
                                            textAlign: 'center',
                                            fontWeight: 700, fontSize: '1rem',
                                            color: 'var(--c-amber)',
                                            fontFamily: 'var(--f-mono)',
                                        }}>
                                            {player.elo}
                                        </td>
                                        <td style={{
                                            padding: 'var(--sp-3) var(--sp-4)',
                                            textAlign: 'center', fontSize: '0.8rem',
                                        }}>
                                            <span style={{ color: 'var(--c-green)' }}>{player.wins}W</span>
                                            <span style={{ color: 'var(--c-text-off)', margin: '0 4px' }}>/</span>
                                            <span style={{ color: 'var(--c-red)' }}>{player.losses}L</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: 'var(--sp-4)', marginTop: 'var(--sp-5)',
                    }}>
                        <button className="btn2" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                            Prev
                        </button>
                        <span style={{
                            fontSize: '0.8rem', color: 'var(--c-text-dim)',
                            fontFamily: 'var(--f-mono)',
                        }}>
                            {page} / {totalPages}
                        </span>
                        <button className="btn2" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                            Next
                        </button>
                    </div>
                )}

                <button className="btn2 btn2--ghost btn2--block" onClick={onBack}
                    style={{ marginTop: 'var(--sp-5)' }}
                >
                    Back to Arcade
                </button>
            </div>
        </div>
    );
}
