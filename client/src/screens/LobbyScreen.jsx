import { useState, useEffect } from 'react';

export default function LobbyScreen({
    username,
    user,
    roomInfo,
    onCreateRoom,
    onJoinRoom,
    onQuickMatch,
    onReady,
    onLeaveRoom,
    onProfile,
    onLeaderboard,
    onLogout,
    onRefreshUser // New prop to refresh user data
}) {
    const [joinCode, setJoinCode] = useState('');
    const [currentUser, setCurrentUser] = useState(user);

    // Auto-detect production vs development
    const isProduction = window.location.protocol === 'https:';
    const API_URL = import.meta.env.VITE_API_URL || (isProduction
        ? `https://${window.location.hostname.replace('frontend', 'backend')}/api`
        : 'http://localhost:3001/api');

    // Refresh user stats when lobby screen mounts
    useEffect(() => {
        const refreshStats = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const res = await fetch(`${API_URL}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setCurrentUser(data);
                    // Also update parent state if callback provided
                    if (onRefreshUser) {
                        onRefreshUser(data);
                    }
                }
            } catch (err) {
                console.log('Failed to refresh stats');
            }
        };

        refreshStats();
    }, []); // Run once on mount

    // Update local user when prop changes
    useEffect(() => {
        if (user) {
            setCurrentUser(user);
        }
    }, [user]);

    // Clean player name helper
    const cleanName = (name, fallback) => {
        if (!name) return fallback;
        let clean = name.includes('_') ? name.split('_')[0] : name;
        return clean.toUpperCase();
    };

    // In a room
    if (roomInfo) {
        return (
            <div className="screen fade-in">
                <div className="card" style={{ textAlign: 'center', maxWidth: '520px', width: '100%' }}>
                    {/* Room Header */}
                    <div style={{ marginBottom: '24px' }}>
                        <h2 style={{
                            fontSize: '1.8rem',
                            marginBottom: '8px',
                            background: 'linear-gradient(135deg, #fff, #a855f7)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            ⚔️ Battle Room
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                            Share this code with your opponent
                        </p>
                    </div>

                    {/* Room Code */}
                    <div className="room-code">{roomInfo.roomCode}</div>

                    {/* Players List */}
                    <div style={{
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '16px',
                        padding: '20px',
                        margin: '24px 0'
                    }}>
                        <h3 style={{
                            fontSize: '0.9rem',
                            color: 'rgba(255,255,255,0.5)',
                            marginBottom: '16px',
                            textTransform: 'uppercase',
                            letterSpacing: '2px'
                        }}>
                            Warriors ({roomInfo.players?.length || 0}/2)
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {roomInfo.players?.map((player, i) => (
                                <div
                                    key={player.id || i}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '16px 20px',
                                        background: player.ready
                                            ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.1))'
                                            : 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: '12px',
                                        border: player.ready
                                            ? '2px solid rgba(34, 197, 94, 0.5)'
                                            : '2px solid rgba(255, 255, 255, 0.1)',
                                        transition: 'all 0.3s ease',
                                        boxShadow: player.ready
                                            ? '0 0 20px rgba(34, 197, 94, 0.2)'
                                            : 'none',
                                        flexWrap: 'wrap',
                                        gap: '10px'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: i === 0
                                                ? 'linear-gradient(135deg, #a855f7, #7c3aed)'
                                                : 'linear-gradient(135deg, #06b6d4, #0891b2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.2rem',
                                            flexShrink: 0
                                        }}>
                                            {i === 0 ? '⚔️' : '🗡️'}
                                        </div>
                                        <span style={{
                                            fontSize: '1.1rem',
                                            fontWeight: 700,
                                            color: player.ready ? '#22c55e' : '#fff',
                                            letterSpacing: '1px'
                                        }}>
                                            {cleanName(player.username, `Player ${i + 1}`)}
                                        </span>
                                    </div>

                                    {player.ready ? (
                                        <span style={{
                                            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                                            color: 'white',
                                            padding: '6px 16px',
                                            borderRadius: '20px',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                            boxShadow: '0 0 15px rgba(34, 197, 94, 0.4)'
                                        }}>
                                            ✓ Ready
                                        </span>
                                    ) : (
                                        <span style={{
                                            color: 'rgba(255, 255, 255, 0.4)',
                                            fontSize: '0.8rem',
                                            fontStyle: 'italic'
                                        }}>
                                            Waiting...
                                        </span>
                                    )}
                                </div>
                            ))}

                            {/* Empty slot */}
                            {roomInfo.players?.length < 2 && (
                                <div style={{
                                    padding: '20px',
                                    border: '2px dashed rgba(255, 255, 255, 0.2)',
                                    borderRadius: '12px',
                                    color: 'rgba(255, 255, 255, 0.3)',
                                    textAlign: 'center',
                                    fontSize: '0.9rem'
                                }}>
                                    Waiting for opponent...
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {roomInfo.players?.length === 2 && (
                            <button onClick={onReady} className="btn btn-primary" style={{ width: '100%' }}>
                                ⚔️ Ready for Battle!
                            </button>
                        )}
                        <button onClick={onLeaveRoom} className="btn" style={{ width: '100%' }}>
                            Leave Room
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Lobby (no room)
    return (
        <div className="screen fade-in" style={{ padding: '16px' }}>
            <div className="card" style={{
                maxWidth: '500px',
                width: '100%',
                textAlign: 'center',
                padding: '24px'
            }}>
                {/* Navigation - INSIDE the card at top */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '24px',
                    flexWrap: 'wrap'
                }}>
                    <button
                        onClick={onProfile}
                        className="btn"
                        style={{
                            padding: '8px 16px',
                            fontSize: '0.75rem',
                            letterSpacing: '1px'
                        }}
                    >
                        👤 Profile
                    </button>
                    <button
                        onClick={onLeaderboard}
                        className="btn"
                        style={{
                            padding: '8px 16px',
                            fontSize: '0.75rem',
                            letterSpacing: '1px'
                        }}
                    >
                        🏆 Ranks
                    </button>
                    <button
                        onClick={onLogout}
                        className="btn"
                        style={{
                            padding: '8px 16px',
                            fontSize: '0.75rem',
                            letterSpacing: '1px'
                        }}
                    >
                        🚪 Logout
                    </button>
                </div>

                {/* Welcome */}
                <div style={{ marginBottom: '28px' }}>
                    <h1 style={{
                        fontSize: 'clamp(1.5rem, 5vw, 2.2rem)',
                        marginBottom: '12px',
                        background: 'linear-gradient(135deg, #fff, #a855f7)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Welcome, Warrior
                    </h1>
                    <p style={{
                        color: '#a855f7',
                        fontSize: 'clamp(0.9rem, 3vw, 1.1rem)',
                        fontWeight: 600,
                        letterSpacing: '2px'
                    }}>
                        {cleanName(username || user?.username, 'WARRIOR')}
                    </p>
                </div>

                {/* Quick Match */}
                <button
                    onClick={onQuickMatch}
                    className="btn btn-primary"
                    style={{
                        width: '100%',
                        padding: '18px',
                        fontSize: 'clamp(0.9rem, 3vw, 1.1rem)',
                        marginBottom: '20px'
                    }}
                >
                    ⚔️ Quick Match
                </button>

                <div className="divider">
                    <span>or</span>
                </div>

                {/* Create/Join Room - Stacked on mobile */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    marginTop: '20px'
                }}>
                    <button
                        onClick={onCreateRoom}
                        className="btn btn-secondary"
                        style={{ width: '100%', padding: '14px' }}
                    >
                        🏰 Create Room
                    </button>

                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap'
                    }}>
                        <input
                            type="text"
                            placeholder="Room Code"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            className="input"
                            style={{
                                flex: 1,
                                minWidth: '120px',
                                textAlign: 'center',
                                letterSpacing: '4px',
                                textTransform: 'uppercase',
                                fontWeight: 600
                            }}
                            maxLength={6}
                        />
                        <button
                            onClick={() => joinCode && onJoinRoom(joinCode)}
                            className="btn"
                            disabled={!joinCode}
                            style={{
                                opacity: joinCode ? 1 : 0.5,
                                minWidth: '80px'
                            }}
                        >
                            Join
                        </button>
                    </div>
                </div>

                {/* Stats preview */}
                {currentUser && (
                    <div style={{
                        marginTop: '28px',
                        padding: '16px',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '12px',
                        display: 'flex',
                        justifyContent: 'space-around',
                        flexWrap: 'wrap',
                        gap: '16px'
                    }}>
                        <div style={{ textAlign: 'center', minWidth: '60px' }}>
                            <div style={{
                                fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
                                fontWeight: 700,
                                color: '#fbbf24'
                            }}>
                                {currentUser.elo || 1000}
                            </div>
                            <div style={{
                                fontSize: '0.65rem',
                                color: 'rgba(255,255,255,0.5)',
                                textTransform: 'uppercase'
                            }}>
                                ELO
                            </div>
                        </div>
                        <div style={{ textAlign: 'center', minWidth: '60px' }}>
                            <div style={{
                                fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
                                fontWeight: 700,
                                color: '#22c55e'
                            }}>
                                {currentUser.stats?.wins || 0}
                            </div>
                            <div style={{
                                fontSize: '0.65rem',
                                color: 'rgba(255,255,255,0.5)',
                                textTransform: 'uppercase'
                            }}>
                                Wins
                            </div>
                        </div>
                        <div style={{ textAlign: 'center', minWidth: '60px' }}>
                            <div style={{
                                fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
                                fontWeight: 700,
                                color: '#ef4444'
                            }}>
                                {currentUser.stats?.losses || 0}
                            </div>
                            <div style={{
                                fontSize: '0.65rem',
                                color: 'rgba(255,255,255,0.5)',
                                textTransform: 'uppercase'
                            }}>
                                Losses
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
