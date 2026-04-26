import React from 'react';
import { BRAND, MODE_LABELS } from '../config/brand.js';

export default function ResultsScreen({ result, playerId, onPlayAgain }) {
    if (!result) return null;

    const isWinner = result.winner === playerId;
    const isDraw = result.reason === 'tie';
    const eloChange = result.eloChanges?.[playerId];
    const gameType = result.gameType || 'duel';
    const players = result.players || [];

    const cleanName = (name, fallback) => {
        if (!name) return fallback;
        return (name.includes('_') ? name.split('_')[0] : name).toUpperCase();
    };

    const getReasonText = () => {
        switch (result.reason) {
            case 'ko': return 'Knockout';
            case 'timeout': return 'Time Up';
            case 'tie': return 'Draw';
            case 'disconnect': return 'Opponent Disconnected';
            case 'complete':
            case 'codequiz_complete':
            case 'bughunter_complete':
            case 'codecrash_complete':
            case 'memecode_complete':
            case 'syntaxspeed_complete':
                return 'Match Complete';
            case 'abandoned': return 'Match Abandoned';
            default: return 'Match Over';
        }
    };

    const mainColor = isDraw ? 'var(--c-amber)' : (isWinner ? 'var(--c-green)' : 'var(--c-red)');
    const accentRgba = isDraw ? 'rgba(251,191,36,' : (isWinner ? 'rgba(52,211,153,' : 'rgba(248,113,113,');

    // Sort players by score descending for multi-player modes
    const sortedPlayers = [...players].sort((a, b) => (result.scores?.[b.id] || b.score || 0) - (result.scores?.[a.id] || a.score || 0));

    const isDuel = gameType === 'duel' && players.length === 2;

    return (
        <div className="screen fade-in" style={{
            background: `radial-gradient(ellipse at center, ${accentRgba}0.06) 0%, transparent 70%)`,
        }}>
            <div className="panel" style={{
                textAlign: 'center', maxWidth: '520px', width: '100%',
            }}>
                {/* Game Mode Label */}
                <div style={{
                    fontSize: '0.65rem', fontWeight: 700, letterSpacing: '3px',
                    color: 'var(--c-text-off)', marginBottom: 'var(--sp-2)',
                    textTransform: 'uppercase',
                }}>
                    {MODE_LABELS[gameType] || gameType}
                </div>

                {/* Result */}
                <h1 style={{
                    fontFamily: 'var(--f-mono)', fontSize: 'clamp(2rem, 7vw, 3rem)',
                    fontWeight: 900, letterSpacing: '6px',
                    color: mainColor,
                    textShadow: `0 0 40px ${accentRgba}0.4)`,
                    marginBottom: 'var(--sp-2)',
                }}>
                    {isDraw ? 'DRAW' : (isWinner ? 'VICTORY' : 'DEFEAT')}
                </h1>
                <p style={{
                    color: 'var(--c-text-dim)', fontSize: '0.85rem',
                    marginBottom: 'var(--sp-6)',
                }}>{getReasonText()}</p>

                {/* Duel Layout (2 players with health) */}
                {isDuel && (
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: 'var(--sp-5)', padding: 'var(--sp-5)',
                        background: 'var(--c-surface)', borderRadius: 'var(--r-lg)',
                        border: '1px solid var(--c-border)',
                        marginBottom: 'var(--sp-5)',
                    }}>
                        {players.map((p, i) => (
                            <React.Fragment key={p.id}>
                                {i === 1 && (
                                    <div style={{
                                        color: 'var(--c-text-off)', fontSize: '0.8rem',
                                        fontWeight: 800, letterSpacing: '4px',
                                    }}>VS</div>
                                )}
                                <div style={{ flex: 1, textAlign: 'center' }}>
                                    <div style={{
                                        fontFamily: 'var(--f-mono)', fontSize: '2rem',
                                        fontWeight: 800,
                                        color: p.id === result.winner ? 'var(--c-green)' : 'var(--c-red)',
                                    }}>
                                        {result.scores?.[p.id] ?? (i === 0 ? result.finalScores?.player1Health : result.finalScores?.player2Health) ?? 0}
                                    </div>
                                    <div style={{
                                        fontSize: '0.8rem', fontWeight: 600,
                                        color: 'var(--c-text-dim)', marginTop: 'var(--sp-1)',
                                        letterSpacing: '0.5px',
                                    }}>
                                        {cleanName(p.username, `PLAYER ${i + 1}`)}
                                    </div>
                                    {p.id === result.winner && (
                                        <div style={{
                                            marginTop: 'var(--sp-2)', fontSize: '0.65rem', fontWeight: 700,
                                            color: 'var(--c-amber)', letterSpacing: '2px',
                                        }}>WINNER</div>
                                    )}
                                </div>
                            </React.Fragment>
                        ))}
                    </div>
                )}

                {/* Multi-Player Scoreboard Layout */}
                {!isDuel && (
                    <div style={{
                        display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)',
                        marginBottom: 'var(--sp-5)',
                    }}>
                        {sortedPlayers.map((p, idx) => {
                            const score = result.scores?.[p.id] ?? p.score ?? 0;
                            const isMe = p.id === playerId;
                            const isMatchWinner = p.id === result.winner;
                            return (
                                <div key={p.id} style={{
                                    display: 'flex', alignItems: 'center',
                                    gap: 'var(--sp-3)', padding: 'var(--sp-3) var(--sp-4)',
                                    background: isMe ? 'rgba(139,92,246,0.08)' : 'var(--c-surface)',
                                    border: `1px solid ${isMatchWinner ? 'rgba(251,191,36,0.3)' : isMe ? 'rgba(139,92,246,0.2)' : 'var(--c-border)'}`,
                                    borderRadius: 'var(--r-md)',
                                }}>
                                    {/* Rank */}
                                    <div style={{
                                        fontFamily: 'var(--f-mono)', fontSize: '1rem',
                                        fontWeight: 800, width: '28px', textAlign: 'center',
                                        color: idx === 0 ? 'var(--c-amber)' : idx === 1 ? 'var(--c-text-dim)' : 'var(--c-text-off)',
                                    }}>
                                        #{idx + 1}
                                    </div>
                                    {/* Name */}
                                    <div style={{
                                        flex: 1, fontWeight: 600, fontSize: '0.875rem',
                                        color: isMe ? 'var(--c-primary-l)' : 'var(--c-text)',
                                    }}>
                                        {cleanName(p.username, 'PLAYER')}
                                        {isMatchWinner && (
                                            <span style={{
                                                marginLeft: '8px', fontSize: '0.6rem', fontWeight: 700,
                                                color: 'var(--c-amber)', letterSpacing: '1px',
                                            }}>WINNER</span>
                                        )}
                                        {isMe && !isMatchWinner && (
                                            <span style={{
                                                marginLeft: '8px', fontSize: '0.6rem', fontWeight: 600,
                                                color: 'var(--c-text-off)', letterSpacing: '1px',
                                            }}>YOU</span>
                                        )}
                                    </div>
                                    {/* Score */}
                                    <div style={{
                                        fontFamily: 'var(--f-mono)', fontSize: '1.1rem',
                                        fontWeight: 800,
                                        color: idx === 0 ? 'var(--c-amber)' : 'var(--c-text)',
                                    }}>
                                        {score}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ELO Change */}
                {eloChange !== undefined && (
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: 'var(--sp-3)', padding: 'var(--sp-4)',
                        borderRadius: 'var(--r-md)',
                        background: `${eloChange >= 0 ? 'rgba(52,211,153,' : 'rgba(248,113,113,'}0.06)`,
                        border: `1px solid ${eloChange >= 0 ? 'rgba(52,211,153,' : 'rgba(248,113,113,'}0.15)`,
                        marginBottom: 'var(--sp-5)',
                    }}>
                        <span style={{ color: 'var(--c-text-dim)', fontSize: '0.8rem' }}>ELO</span>
                        <span style={{
                            fontFamily: 'var(--f-mono)', fontSize: '1.3rem', fontWeight: 800,
                            color: eloChange >= 0 ? 'var(--c-green)' : 'var(--c-red)',
                        }}>
                            {eloChange >= 0 ? '+' : ''}{eloChange}
                        </span>
                    </div>
                )}

                <button className="btn2 btn2--primary btn2--block btn2--lg" onClick={onPlayAgain}>
                    {BRAND.returnToHub}
                </button>
            </div>
        </div>
    );
}
