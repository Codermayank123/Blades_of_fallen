import { useAudio } from '../hooks/useAudio';

export default function ResultsScreen({ result, playerId, onPlayAgain }) {
    const { playSFX } = useAudio();

    if (!result) return null;

    const isWinner = result.winner === playerId;
    const isDraw = result.reason === 'tie';

    // Get ELO change for this player
    const eloChange = result.eloChanges?.[playerId];

    // Clean player name helper
    const cleanName = (name, fallback) => {
        if (!name) return fallback;
        let clean = name.includes('_') ? name.split('_')[0] : name;
        return clean.toUpperCase();
    };

    // Get player names
    const players = result.players || [];
    const player1 = players[0];
    const player2 = players[1];

    const getReasonText = () => {
        switch (result.reason) {
            case 'ko': return '💀 Knockout!';
            case 'timeout': return '⏱️ Time Up!';
            case 'tie': return "🤝 It's a Tie!";
            case 'disconnect': return '🔌 Opponent Disconnected';
            default: return '⚔️ Match Over';
        }
    };

    return (
        <div className="screen fade-in" style={{
            background: isWinner
                ? 'radial-gradient(ellipse at center, rgba(34, 197, 94, 0.1) 0%, transparent 70%)'
                : isDraw
                    ? 'radial-gradient(ellipse at center, rgba(251, 191, 36, 0.1) 0%, transparent 70%)'
                    : 'radial-gradient(ellipse at center, rgba(239, 68, 68, 0.1) 0%, transparent 70%)'
        }}>
            <div className="card" style={{
                textAlign: 'center',
                maxWidth: '550px',
                width: '100%',
                position: 'relative',
                overflow: 'visible'
            }}>
                {/* Decorative glow */}
                <div style={{
                    position: 'absolute',
                    top: '-50px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '200px',
                    height: '200px',
                    background: isWinner
                        ? 'radial-gradient(circle, rgba(34, 197, 94, 0.3) 0%, transparent 70%)'
                        : isDraw
                            ? 'radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%)'
                            : 'radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, transparent 70%)',
                    pointerEvents: 'none',
                    zIndex: -1
                }}></div>

                {/* Result Icon */}
                <div style={{
                    fontSize: '5rem',
                    marginBottom: '16px',
                    animation: 'victoryPulse 1.5s ease-in-out infinite'
                }}>
                    {isDraw ? '🤝' : (isWinner ? '🏆' : '💀')}
                </div>

                {/* Result Header */}
                <h1 className="victory-message" style={{
                    color: isDraw ? '#fbbf24' : (isWinner ? '#22c55e' : '#ef4444'),
                    marginBottom: '8px'
                }}>
                    {isDraw ? 'DRAW' : (isWinner ? 'VICTORY' : 'DEFEAT')}
                </h1>

                <p style={{
                    fontSize: '1.1rem',
                    color: 'rgba(255,255,255,0.7)',
                    marginBottom: '32px'
                }}>
                    {getReasonText()}
                </p>

                {/* Score Display */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '24px',
                    padding: '24px',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '16px',
                    marginBottom: '24px'
                }}>
                    {/* Player 1 */}
                    <div style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: '16px',
                        background: player1?.id === result.winner
                            ? 'rgba(34, 197, 94, 0.15)'
                            : 'transparent',
                        borderRadius: '12px',
                        border: player1?.id === result.winner
                            ? '2px solid rgba(34, 197, 94, 0.3)'
                            : '2px solid transparent'
                    }}>
                        <div style={{
                            fontSize: '2.5rem',
                            fontWeight: 900,
                            color: player1?.id === result.winner ? '#22c55e' : '#ef4444',
                            textShadow: player1?.id === result.winner
                                ? '0 0 20px rgba(34, 197, 94, 0.5)'
                                : '0 0 20px rgba(239, 68, 68, 0.5)'
                        }}>
                            {result.finalScores?.player1Health || 0}%
                        </div>
                        <div style={{
                            color: 'rgba(255,255,255,0.7)',
                            fontSize: '0.9rem',
                            marginTop: '8px',
                            fontWeight: 600,
                            letterSpacing: '1px'
                        }}>
                            {cleanName(player1?.username, 'PLAYER 1')}
                        </div>
                        {player1?.id === result.winner && (
                            <div style={{
                                marginTop: '8px',
                                color: '#fbbf24',
                                fontSize: '0.75rem',
                                fontWeight: 700
                            }}>
                                👑 WINNER
                            </div>
                        )}
                    </div>

                    {/* VS */}
                    <div style={{
                        color: 'rgba(255,255,255,0.2)',
                        fontSize: '1.5rem',
                        fontWeight: 900,
                        letterSpacing: '4px'
                    }}>
                        VS
                    </div>

                    {/* Player 2 */}
                    <div style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: '16px',
                        background: player2?.id === result.winner
                            ? 'rgba(34, 197, 94, 0.15)'
                            : 'transparent',
                        borderRadius: '12px',
                        border: player2?.id === result.winner
                            ? '2px solid rgba(34, 197, 94, 0.3)'
                            : '2px solid transparent'
                    }}>
                        <div style={{
                            fontSize: '2.5rem',
                            fontWeight: 900,
                            color: player2?.id === result.winner ? '#22c55e' : '#ef4444',
                            textShadow: player2?.id === result.winner
                                ? '0 0 20px rgba(34, 197, 94, 0.5)'
                                : '0 0 20px rgba(239, 68, 68, 0.5)'
                        }}>
                            {result.finalScores?.player2Health || 0}%
                        </div>
                        <div style={{
                            color: 'rgba(255,255,255,0.7)',
                            fontSize: '0.9rem',
                            marginTop: '8px',
                            fontWeight: 600,
                            letterSpacing: '1px'
                        }}>
                            {cleanName(player2?.username, 'PLAYER 2')}
                        </div>
                        {player2?.id === result.winner && (
                            <div style={{
                                marginTop: '8px',
                                color: '#fbbf24',
                                fontSize: '0.75rem',
                                fontWeight: 700
                            }}>
                                👑 WINNER
                            </div>
                        )}
                    </div>
                </div>

                {/* ELO Change */}
                {eloChange !== undefined && (
                    <div style={{
                        background: eloChange >= 0
                            ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.1))'
                            : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1))',
                        padding: '16px 24px',
                        borderRadius: '12px',
                        marginBottom: '24px',
                        border: eloChange >= 0
                            ? '1px solid rgba(34, 197, 94, 0.3)'
                            : '1px solid rgba(239, 68, 68, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px'
                    }}>
                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                            ELO Change:
                        </span>
                        <span style={{
                            fontSize: '1.5rem',
                            fontWeight: 900,
                            color: eloChange >= 0 ? '#22c55e' : '#ef4444',
                            textShadow: eloChange >= 0
                                ? '0 0 10px rgba(34, 197, 94, 0.5)'
                                : '0 0 10px rgba(239, 68, 68, 0.5)'
                        }}>
                            {eloChange >= 0 ? '+' : ''}{eloChange}
                        </span>
                    </div>
                )}

                {/* Play Again Button */}
                <button
                    onClick={onPlayAgain}
                    className="btn btn-primary"
                    style={{
                        width: '100%',
                        padding: '18px',
                        fontSize: '1.1rem'
                    }}
                >
                    ⚔️ Play Again
                </button>
            </div>
        </div>
    );
}
