import { useState, useEffect, useRef, useCallback } from 'react';

const FINISH_LINE = 100;

export default function StreetSprintScreen({ gameState, playerId, onLeave }) {
    const [players, setPlayers] = useState([]);
    const [timeLeft, setTimeLeft] = useState(45);
    const [gamePhase, setGamePhase] = useState('waiting'); // waiting | countdown | racing | finished
    const [countdown, setCountdown] = useState(3);
    const [boostAvailable, setBoostAvailable] = useState(false);
    const [isBoosting, setIsBoosting] = useState(false);
    const [result, setResult] = useState(null);
    const [tapFlash, setTapFlash] = useState(false);
    const [showIntro, setShowIntro] = useState(true);
    const countdownRef = useRef(null);
    const boostTimerRef = useRef(null);

    const myPlayer = players.find(p => p.id === playerId);

    const sendAction = useCallback((action) => {
        if (gameState?.send) {
            gameState.send({ type: 'GAME_ACTION', action });
        }
    }, [gameState]);

    useEffect(() => {
        if (!gameState?.lastMessage) return;
        const msg = gameState.lastMessage;

        if (msg.type === 'GAME_START') {
            setGamePhase('countdown');
            let c = 3;
            setCountdown(c);
            countdownRef.current = setInterval(() => {
                c--;
                if (c <= 0) {
                    clearInterval(countdownRef.current);
                    setGamePhase('racing');
                } else {
                    setCountdown(c);
                }
            }, 1000);
        }

        if (msg.type === 'SPRINT_TICK') {
            setPlayers(msg.players || []);
            setTimeLeft(msg.timeLeft || 0);
            if (msg.boost?.available) setBoostAvailable(true);
        }

        if (msg.type === 'SPRINT_BOOST') {
            if (msg.available) {
                setBoostAvailable(true);
            } else if (msg.playerId === playerId) {
                setIsBoosting(true);
                setBoostAvailable(false);
                boostTimerRef.current = setTimeout(() => setIsBoosting(false), msg.duration || 3000);
            } else {
                setBoostAvailable(false);
            }
        }

        if (msg.type === 'GAME_OVER') {
            clearInterval(countdownRef.current);
            setGamePhase('finished');
            setResult(msg);
        }

        return () => { };
    }, [gameState?.lastMessage, playerId]);

    useEffect(() => () => {
        clearInterval(countdownRef.current);
        clearTimeout(boostTimerRef.current);
    }, []);

    const handleTap = () => {
        if (gamePhase !== 'racing') return;
        sendAction('TAP');
        setTapFlash(true);
        setTimeout(() => setTapFlash(false), 80);
    };

    const handleBoost = () => {
        if (!boostAvailable || gamePhase !== 'racing') return;
        sendAction('CLAIM_BOOST');
    };

    const LANE_COLORS = ['#8b5cf6', '#22d3ee', '#34d399', '#fbbf24', '#f87171', '#fb7185', '#a78bfa', '#6ee7b7'];

    const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    // ── Finished ──
    if (gamePhase === 'finished' && result) {
        const isWinner = result.winner === playerId;
        const winnerName = result.winnerUsername || 'Unknown';
        const eloChange = result.eloChanges?.[playerId];

        return (
            <div className="screen fade-in" style={{ padding: 'var(--sp-4)' }}>
                <div className="panel" style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: 'var(--sp-4)' }}>
                        {isWinner ? '🏁' : '🚗'}
                    </div>
                    <h2 style={{
                        fontFamily: 'var(--f-mono)', fontSize: '1.8rem', fontWeight: 900,
                        color: isWinner ? 'var(--c-amber)' : 'var(--c-text-dim)',
                        letterSpacing: '2px', marginBottom: 'var(--sp-2)'
                    }}>
                        {isWinner ? 'WINNER!' : 'RACE OVER'}
                    </h2>
                    <p style={{ color: 'var(--c-text-dim)', marginBottom: 'var(--sp-6)' }}>
                        {isWinner ? 'You crossed the finish line!' : `${winnerName} wins!`}
                    </p>

                    {/* Final Standings */}
                    <div style={{ marginBottom: 'var(--sp-6)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                        {[...players].sort((a, b) => b.progress - a.progress).map((p, i) => (
                            <div key={p.id} style={{
                                display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
                                padding: 'var(--sp-3) var(--sp-4)',
                                background: p.id === playerId ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${p.id === playerId ? 'rgba(139,92,246,0.3)' : 'var(--c-border)'}`,
                                borderRadius: 'var(--r-md)'
                            }}>
                                <span style={{ fontFamily: 'var(--f-mono)', fontSize: '1.1rem', width: 28, color: i === 0 ? 'var(--c-amber)' : 'var(--c-text-dim)' }}>
                                    #{i + 1}
                                </span>
                                <span style={{ flex: 1, fontWeight: 600 }}>{p.username}</span>
                                <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.9rem', color: 'var(--c-cyan)' }}>
                                    {Math.round(p.progress)}%
                                </span>
                            </div>
                        ))}
                    </div>

                    {eloChange != null && (
                        <p style={{ color: eloChange >= 0 ? 'var(--c-green)' : 'var(--c-red)', fontWeight: 700, marginBottom: 'var(--sp-4)' }}>
                            ELO {eloChange >= 0 ? '+' : ''}{eloChange}
                        </p>
                    )}
                    <button className="btn2 btn2--primary btn2--block" onClick={onLeave}>Back to Lobby</button>
                </div>
            </div>
        );
    }

    // ── Countdown / Waiting ──
    if (gamePhase === 'waiting' || gamePhase === 'countdown') {
        return (
            <div className="screen" style={{ textAlign: 'center', position: 'relative' }}>
                {/* Intro / controls overlay while waiting */}
                {showIntro && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 30,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(15, 23, 42, 0.96)',
                        padding: '24px',
                        boxSizing: 'border-box',
                    }}>
                        <div style={{
                            maxWidth: 620,
                            width: '100%',
                            borderRadius: 16,
                            padding: '22px 26px',
                            background: 'linear-gradient(135deg, #020617, #0f172a, #1f2937)',
                            border: '1px solid rgba(56,189,248,0.5)',
                            boxShadow: '0 24px 80px rgba(15,23,42,0.95), 0 0 40px rgba(56,189,248,0.6)',
                            color: 'var(--c-text)',
                            fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                        }}>
                            <h2 style={{
                                marginTop: 0,
                                marginBottom: 8,
                                fontSize: 'clamp(20px, 3vw, 26px)',
                                textTransform: 'uppercase',
                                letterSpacing: 3,
                                color: 'var(--c-cyan)',
                            }}>
                                Street Sprint
                            </h2>
                            <p style={{ marginTop: 0, marginBottom: 16, fontSize: 13, color: 'var(--c-text-dim)' }}>
                                Tap as fast as you can to push your car towards the finish line.
                                Grab boosts when they appear.
                            </p>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                                gap: 16,
                                marginBottom: 18,
                            }}>
                                <div style={{
                                    padding: 12,
                                    borderRadius: 12,
                                    background: 'rgba(15,23,42,0.9)',
                                    border: '1px solid rgba(56,189,248,0.4)',
                                }}>
                                    <h3 style={{
                                        margin: '0 0 8px',
                                        fontSize: 13,
                                        letterSpacing: 1,
                                        color: 'var(--c-cyan)',
                                        textTransform: 'uppercase',
                                    }}>
                                        Controls
                                    </h3>
                                    <ul style={{
                                        margin: 0,
                                        paddingLeft: 18,
                                        fontSize: 13,
                                        lineHeight: 1.6,
                                        color: 'var(--c-text-dim)',
                                    }}>
                                        <li>Tap or click the big circular button to advance.</li>
                                        <li>The faster you tap, the faster your car moves.</li>
                                        <li>Use the &quot;Grab Boost&quot; button when it appears.</li>
                                    </ul>
                                </div>

                                <div style={{
                                    padding: 12,
                                    borderRadius: 12,
                                    background: 'rgba(15,23,42,0.9)',
                                    border: '1px solid rgba(251,191,36,0.4)',
                                }}>
                                    <h3 style={{
                                        margin: '0 0 8px',
                                        fontSize: 13,
                                        letterSpacing: 1,
                                        color: 'var(--c-amber)',
                                        textTransform: 'uppercase',
                                    }}>
                                        Race Info
                                    </h3>
                                    <ul style={{
                                        margin: 0,
                                        paddingLeft: 18,
                                        fontSize: 13,
                                        lineHeight: 1.6,
                                        color: 'var(--c-text-dim)',
                                    }}>
                                        <li>The timer at the top shows how long is left.</li>
                                        <li>Lanes show each player&apos;s progress to 100%.</li>
                                        <li>First to the finish line or furthest when time is up wins.</li>
                                    </ul>
                                </div>
                            </div>

                            <p style={{
                                marginTop: 0,
                                marginBottom: 20,
                                fontSize: 12,
                                color: 'var(--c-text-dim)',
                                textAlign: 'center',
                            }}>
                                Tip: Keep a steady tapping rhythm instead of random bursts for better stamina.
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowIntro(false)}
                                    style={{
                                        padding: '10px 32px',
                                        borderRadius: 999,
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: 13,
                                        fontWeight: 600,
                                        letterSpacing: 2,
                                        textTransform: 'uppercase',
                                        background: 'linear-gradient(135deg, #22d3ee, #fbbf24)',
                                        color: '#020617',
                                        boxShadow: '0 0 30px rgba(56,189,248,0.6), 0 0 60px rgba(251,191,36,0.5)',
                                    }}
                                >
                                    Ready
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <p style={{ fontFamily: 'var(--f-mono)', fontSize: '5rem', color: 'var(--c-amber)', animation: 'pulse 0.8s ease-in-out infinite' }}>
                    {gamePhase === 'countdown' ? countdown : '...'}
                </p>
                <p style={{ color: 'var(--c-text-dim)', letterSpacing: '3px', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                    {gamePhase === 'countdown' ? 'Get Ready!' : 'Waiting for players...'}
                </p>
            </div>
        );
    }

    // ── Racing ──
    return (
        <div style={{
            minHeight: '100vh', display: 'flex', flexDirection: 'column',
            background: 'var(--c-bg)', padding: 'var(--sp-4)', gap: 'var(--sp-4)'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: '1px solid var(--c-border)', paddingBottom: 'var(--sp-3)'
            }}>
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: '1rem', fontWeight: 700, color: 'var(--c-cyan)', letterSpacing: '2px' }}>
                    STREET SPRINT
                </span>
                <div style={{
                    fontFamily: 'var(--f-mono)', fontSize: '1.5rem', fontWeight: 900,
                    color: timeLeft <= 10 ? 'var(--c-red)' : 'var(--c-text)',
                    letterSpacing: '2px'
                }}>
                    {formatTime(timeLeft)}
                </div>
                <button className="btn2 btn2--ghost" style={{ fontSize: '0.75rem' }} onClick={onLeave}>Exit</button>
            </div>

            {/* Race lanes */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                {[...players].sort((a, b) => b.progress - a.progress).map((p, i) => {
                    const color = LANE_COLORS[i % LANE_COLORS.length];
                    const isMe = p.id === playerId;
                    return (
                        <div key={p.id} style={{
                            background: isMe ? 'rgba(139,92,246,0.06)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${isMe ? 'rgba(139,92,246,0.25)' : 'var(--c-border)'}`,
                            borderRadius: 'var(--r-md)', padding: 'var(--sp-3) var(--sp-4)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ fontWeight: isMe ? 700 : 400, fontSize: '0.875rem' }}>
                                    {isMe && '▶ '}{p.username}
                                    {p.boosting && <span style={{ marginLeft: 8, fontSize: '0.7rem', color: 'var(--c-amber)', fontWeight: 700 }}>⚡ BOOSTED</span>}
                                </span>
                                <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.8rem', color }}>
                                    {Math.round(p.progress)}%
                                </span>
                            </div>
                            {/* Progress bar */}
                            <div style={{ height: 12, background: 'rgba(255,255,255,0.06)', borderRadius: 6, overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${Math.round(p.progress)}%`,
                                    background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                                    borderRadius: 6,
                                    transition: 'width 0.3s ease',
                                    boxShadow: isMe ? `0 0 12px ${color}66` : 'none'
                                }} />
                            </div>
                            {/* Car icon at progress position */}
                            {p.progress < FINISH_LINE && (
                                <div style={{
                                    marginLeft: `calc(${Math.max(0, p.progress - 3)}% )`,
                                    fontSize: '1rem',
                                    marginTop: -4
                                }}>🚗</div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', alignItems: 'center' }}>
                {/* Boost */}
                {boostAvailable && (
                    <button
                        onClick={handleBoost}
                        className="btn2 anim-scaleIn"
                        style={{
                            padding: '10px 32px', fontSize: '0.85rem', fontWeight: 700,
                            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                            border: 'none', color: '#000', borderRadius: 'var(--r-md)',
                            boxShadow: '0 0 20px rgba(251,191,36,0.4)',
                            letterSpacing: '1px'
                        }}
                    >
                        ⚡ GRAB BOOST
                    </button>
                )}

                {/* Tap button */}
                <button
                    onClick={handleTap}
                    style={{
                        width: 180, height: 180, borderRadius: '50%',
                        border: `4px solid ${tapFlash ? 'var(--c-cyan)' : 'rgba(139,92,246,0.5)'}`,
                        background: tapFlash
                            ? 'rgba(34,211,238,0.2)'
                            : isBoosting ? 'rgba(251,191,36,0.15)' : 'rgba(139,92,246,0.1)',
                        cursor: 'pointer', transition: 'all 0.08s ease',
                        transform: tapFlash ? 'scale(0.95)' : 'scale(1)',
                        boxShadow: tapFlash ? '0 0 30px rgba(34,211,238,0.5)' : isBoosting ? '0 0 30px rgba(251,191,36,0.4)' : '0 0 20px rgba(139,92,246,0.2)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        gap: 4, userSelect: 'none'
                    }}
                >
                    <span style={{ fontSize: '2.5rem' }}>🚗</span>
                    <span style={{
                        fontFamily: 'var(--f-mono)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '2px',
                        color: isBoosting ? 'var(--c-amber)' : 'var(--c-primary-l)'
                    }}>
                        {isBoosting ? '⚡ BOOSTED' : 'TAP'}
                    </span>
                </button>

                <p style={{ color: 'var(--c-text-off)', fontSize: '0.75rem', letterSpacing: '1px' }}>
                    Tap fast to race! {myPlayer ? `${Math.round(myPlayer.progress)}% complete` : ''}
                </p>
            </div>
        </div>
    );
}
