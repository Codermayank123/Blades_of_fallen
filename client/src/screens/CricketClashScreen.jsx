import { useState, useEffect, useCallback } from 'react';

const SHOTS = [
    { id: 'defensive', label: 'Defensive', desc: 'Safe. 0–2 runs. Rarely out.', color: '#22d3ee', rune: '🛡' },
    { id: 'normal', label: 'Normal', desc: 'Balanced. 0–4 runs.', color: '#8b5cf6', rune: '🏏' },
    { id: 'aggressive', label: 'Aggressive', desc: 'High risk. Up to 6 runs!', color: '#f87171', rune: '🔥' },
];

export default function CricketClashScreen({ gameState, playerId, onLeave }) {
    const [phase, setPhase] = useState('waiting'); // waiting | batting | spectating | finished
    const [currentBatter, setCurrentBatter] = useState(null);
    const [scoreboard, setScoreboard] = useState({});
    const [lastResult, setLastResult] = useState(null);
    const [awaitingShot, setAwaitingShot] = useState(false);
    const [shotSent, setShotSent] = useState(false);
    const [ballCount, setBallCount] = useState({ current: 0, total: 6 });
    const [result, setResult] = useState(null);
    const [feedItems, setFeedItems] = useState([]);
    const [showIntro, setShowIntro] = useState(true);

    const isMyTurn = currentBatter?.batterId === playerId;

    const sendAction = useCallback((shot) => {
        if (gameState?.send && !shotSent) {
            gameState.send({ type: 'GAME_ACTION', action: 'SHOT', shot });
            setShotSent(true);
        }
    }, [gameState, shotSent]);

    const addFeed = useCallback((text, color) => {
        setFeedItems(prev => [{ text, color, id: Date.now() }, ...prev].slice(0, 8));
    }, []);

    useEffect(() => {
        if (!gameState?.lastMessage) return;
        const msg = gameState.lastMessage;

        if (msg.type === 'GAME_START') {
            setPhase('spectating');
            setBallCount(prev => ({ ...prev, total: msg.ballsPerPlayer || 6 }));
        }

        if (msg.type === 'BATTER_CHANGE') {
            setCurrentBatter(msg);
            setScoreboard(msg.stats || {});
            setLastResult(null);
            setAwaitingShot(false);
            setShotSent(false);
            const isMe = msg.batterId === playerId;
            setPhase(isMe ? 'batting' : 'spectating');
            addFeed(`${msg.batterUsername} is now batting`, 'var(--c-cyan)');
        }

        if (msg.type === 'BALL_BOWLED') {
            setAwaitingShot(true);
            setShotSent(false);
            setBallCount({ current: msg.ball, total: msg.totalBalls });
        }

        if (msg.type === 'SHOT_RESULT') {
            setScoreboard(msg.stats || {});
            setLastResult(msg);
            setAwaitingShot(false);
            const batter = msg.stats?.[msg.batterId];
            const who = batter?.username || 'Player';
            if (msg.isOut) {
                addFeed(`${who} is OUT!`, 'var(--c-red)');
            } else {
                addFeed(`${who} hits ${msg.runs} run${msg.runs !== 1 ? 's' : ''}`, msg.runs >= 4 ? 'var(--c-amber)' : 'var(--c-green)');
            }
        }

        if (msg.type === 'GAME_OVER') {
            setPhase('finished');
            setResult(msg);
        }
    }, [gameState?.lastMessage, playerId, addFeed]);

    const sortedPlayers = Object.entries(scoreboard).sort(([, a], [, b]) => b.runs - a.runs);

    // ── Finished ──
    if (phase === 'finished' && result) {
        const isWinner = result.winner === playerId;
        const winnerName = result.winnerUsername || 'Unknown';
        const eloChange = result.eloChanges?.[playerId];

        return (
            <div className="screen fade-in" style={{ padding: 'var(--sp-4)' }}>
                <div className="panel" style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
                    <div style={{ fontSize: '3.5rem', marginBottom: 'var(--sp-4)' }}>
                        {isWinner ? '🏆' : '🏏'}
                    </div>
                    <h2 style={{
                        fontFamily: 'var(--f-mono)', fontSize: '1.8rem', fontWeight: 900, letterSpacing: '2px',
                        color: isWinner ? 'var(--c-amber)' : 'var(--c-text-dim)', marginBottom: 'var(--sp-2)'
                    }}>
                        {isWinner ? 'MATCH WON!' : 'INNINGS OVER'}
                    </h2>
                    <p style={{ color: 'var(--c-text-dim)', marginBottom: 'var(--sp-6)' }}>
                        {isWinner ? 'Top scorer!' : `${winnerName} wins!`}
                    </p>

                    {/* Final Scorecard */}
                    <div style={{ marginBottom: 'var(--sp-6)' }}>
                        <p className="section-label">Final Scorecard</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                            {sortedPlayers.map(([id, stats], i) => (
                                <div key={id} style={{
                                    display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
                                    padding: 'var(--sp-3) var(--sp-4)',
                                    background: id === playerId ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${id === playerId ? 'rgba(139,92,246,0.3)' : 'var(--c-border)'}`,
                                    borderRadius: 'var(--r-md)'
                                }}>
                                    <span style={{ fontFamily: 'var(--f-mono)', width: 28, color: i === 0 ? 'var(--c-amber)' : 'var(--c-text-dim)' }}>#{i + 1}</span>
                                    <span style={{ flex: 1, fontWeight: 600 }}>{stats.username}</span>
                                    <span style={{ fontFamily: 'var(--f-mono)', color: 'var(--c-amber)', fontWeight: 700 }}>{stats.runs}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--c-text-off)' }}>({stats.balls}b)</span>
                                    {stats.out && <span style={{ fontSize: '0.7rem', color: 'var(--c-red)' }}>OUT</span>}
                                </div>
                            ))}
                        </div>
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

    // ── Main game view ──
    return (
        <div style={{
            minHeight: '100vh', display: 'flex', flexDirection: 'column',
            background: 'var(--c-bg)', padding: 'var(--sp-4)', gap: 'var(--sp-4)'
        }}>
            {/* Intro / controls overlay */}
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
                        background: 'linear-gradient(135deg, #020617, #052e16, #14532d)',
                        border: '1px solid rgba(74,222,128,0.5)',
                        boxShadow: '0 24px 80px rgba(15,23,42,0.95), 0 0 40px rgba(74,222,128,0.6)',
                        color: 'var(--c-text)',
                        fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                    }}>
                        <h2 style={{
                            marginTop: 0,
                            marginBottom: 8,
                            fontSize: 'clamp(20px, 3vw, 26px)',
                            textTransform: 'uppercase',
                            letterSpacing: 3,
                            color: 'var(--c-amber)',
                        }}>
                            Cricket Clash
                        </h2>
                        <p style={{ marginTop: 0, marginBottom: 16, fontSize: 13, color: 'var(--c-text-dim)' }}>
                            Choose a shot type when it&apos;s your turn to bat. Safer shots give
                            fewer runs but lower your chance of getting out.
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
                                border: '1px solid rgba(59,130,246,0.5)',
                            }}>
                                <h3 style={{
                                    margin: '0 0 8px',
                                    fontSize: 13,
                                    letterSpacing: 1,
                                    color: 'var(--c-cyan)',
                                    textTransform: 'uppercase',
                                }}>
                                    Shot Selection
                                </h3>
                                <ul style={{
                                    margin: 0,
                                    paddingLeft: 18,
                                    fontSize: 13,
                                    lineHeight: 1.6,
                                    color: 'var(--c-text-dim)',
                                }}>
                                    <li><strong>Defensive</strong> – Very safe, low runs.</li>
                                    <li><strong>Normal</strong> – Balanced risk and reward.</li>
                                    <li><strong>Aggressive</strong> – Big runs, higher chance of wicket.</li>
                                </ul>
                            </div>

                            <div style={{
                                padding: 12,
                                borderRadius: 12,
                                background: 'rgba(15,23,42,0.9)',
                                border: '1px solid rgba(74,222,128,0.5)',
                            }}>
                                <h3 style={{
                                    margin: '0 0 8px',
                                    fontSize: 13,
                                    letterSpacing: 1,
                                    color: 'var(--c-green)',
                                    textTransform: 'uppercase',
                                }}>
                                    Match Rules
                                </h3>
                                <ul style={{
                                    margin: 0,
                                    paddingLeft: 18,
                                    fontSize: 13,
                                    lineHeight: 1.6,
                                    color: 'var(--c-text-dim)',
                                }}>
                                    <li>Everyone gets a fixed number of balls.</li>
                                    <li>Scoreboard shows runs and balls faced for each player.</li>
                                    <li>Highest total runs when the innings end wins.</li>
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
                            Tip: Start safe to get your eye in, then ramp up the aggression once
                            you understand the timing.
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
                                    background: 'linear-gradient(135deg, #22c55e, #fbbf24)',
                                    color: '#020617',
                                    boxShadow: '0 0 30px rgba(74,222,128,0.6), 0 0 60px rgba(251,191,36,0.5)',
                                }}
                            >
                                Start Match
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Header */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: '1px solid var(--c-border)', paddingBottom: 'var(--sp-3)'
            }}>
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: '1rem', fontWeight: 700, color: 'var(--c-amber)', letterSpacing: '2px' }}>
                    CRICKET CLASH
                </span>
                {currentBatter && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--c-text-dim)' }}>
                        Ball {ballCount.current}/{ballCount.total}
                    </span>
                )}
                <button className="btn2 btn2--ghost" style={{ fontSize: '0.75rem' }} onClick={onLeave}>Exit</button>
            </div>

            <div style={{ display: 'flex', gap: 'var(--sp-4)', flex: 1, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                {/* Left Pane: Scoreboard + feed */}
                <div style={{ minWidth: 200, flex: '0 0 200px', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                    <div>
                        <p className="section-label">Scorecard</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                            {sortedPlayers.map(([id, stats], i) => (
                                <div key={id} style={{
                                    display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
                                    padding: 'var(--sp-2) var(--sp-3)',
                                    background: currentBatter?.batterId === id
                                        ? 'rgba(251,191,36,0.08)' : id === playerId
                                            ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${currentBatter?.batterId === id ? 'rgba(251,191,36,0.25)' : 'var(--c-border)'}`,
                                    borderRadius: 'var(--r-sm)'
                                }}>
                                    {currentBatter?.batterId === id && <span style={{ fontSize: '0.75rem' }}>🏏</span>}
                                    <span style={{ flex: 1, fontSize: '0.8rem', fontWeight: id === playerId ? 700 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {stats.username}
                                    </span>
                                    <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--c-amber)' }}>
                                        {stats.runs}
                                    </span>
                                    {stats.out && <span style={{ fontSize: '0.65rem', color: 'var(--c-red)' }}>✕</span>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Live feed */}
                    <div>
                        <p className="section-label">Ball Feed</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {feedItems.map((f, i) => (
                                <div key={f.id} style={{
                                    fontSize: '0.75rem', color: f.color, padding: '4px 8px',
                                    background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--r-sm)',
                                    opacity: 1 - i * 0.1, transition: 'opacity 0.3s'
                                }}>
                                    {f.text}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Pane: Batting or spectating */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)', alignItems: 'center' }}>
                    {/* Last result banner */}
                    {lastResult && (
                        <div className="anim-fadeIn" style={{
                            padding: 'var(--sp-3) var(--sp-6)', borderRadius: 'var(--r-lg)', textAlign: 'center',
                            background: lastResult.isOut ? 'rgba(248,113,113,0.12)' : lastResult.runs >= 4 ? 'rgba(251,191,36,0.12)' : 'rgba(52,211,153,0.1)',
                            border: `1px solid ${lastResult.isOut ? 'rgba(248,113,113,0.3)' : lastResult.runs >= 4 ? 'rgba(251,191,36,0.3)' : 'rgba(52,211,153,0.25)'}`
                        }}>
                            {lastResult.isOut ? (
                                <>
                                    <div style={{ fontSize: '2rem' }}>🔴</div>
                                    <div style={{ fontFamily: 'var(--f-mono)', fontWeight: 900, fontSize: '1.4rem', color: 'var(--c-red)', letterSpacing: '3px' }}>OUT!</div>
                                </>
                            ) : (
                                <>
                                    <div style={{ fontSize: '2.5rem', fontFamily: 'var(--f-mono)', fontWeight: 900, color: lastResult.runs >= 6 ? 'var(--c-amber)' : 'var(--c-green)' }}>
                                        {lastResult.runs === 6 ? '⭐ SIX!' : lastResult.runs === 4 ? '🏏 FOUR!' : `${lastResult.runs} RUN${lastResult.runs !== 1 ? 'S' : ''}`}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* My batting turn */}
                    {phase === 'batting' && (
                        <div style={{ textAlign: 'center', width: '100%', maxWidth: 360 }}>
                            <p style={{ color: 'var(--c-amber)', fontWeight: 700, letterSpacing: '2px', fontSize: '0.85rem', marginBottom: 'var(--sp-4)' }}>
                                YOUR TURN TO BAT!
                            </p>

                            {awaitingShot && !shotSent ? (
                                <>
                                    <p style={{ color: 'var(--c-text-dim)', fontSize: '0.8rem', marginBottom: 'var(--sp-3)' }}>
                                        Choose your shot:
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                                        {SHOTS.map(s => (
                                            <button
                                                key={s.id}
                                                onClick={() => sendAction(s.id)}
                                                style={{
                                                    padding: 'var(--sp-4) var(--sp-5)', borderRadius: 'var(--r-md)',
                                                    border: `1px solid ${s.color}44`,
                                                    background: `${s.color}0f`,
                                                    cursor: 'pointer', textAlign: 'left',
                                                    color: 'var(--c-text)', display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = `${s.color}20`}
                                                onMouseLeave={e => e.currentTarget.style.background = `${s.color}0f`}
                                            >
                                                <span style={{ fontSize: '1.5rem' }}>{s.rune}</span>
                                                <div>
                                                    <div style={{ fontWeight: 700, color: s.color }}>{s.label}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--c-text-dim)' }}>{s.desc}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            ) : shotSent ? (
                                <div style={{ textAlign: 'center', color: 'var(--c-text-dim)', padding: 'var(--sp-8)' }}>
                                    <div className="anim-spin" style={{ display: 'inline-block', fontSize: '2rem', marginBottom: 'var(--sp-3)' }}>🏏</div>
                                    <p>Shot played! Waiting for result...</p>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', color: 'var(--c-text-dim)', padding: 'var(--sp-8)' }}>
                                    <p>Next ball incoming...</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Spectating */}
                    {phase === 'spectating' && currentBatter && (
                        <div style={{ textAlign: 'center', color: 'var(--c-text-dim)', padding: 'var(--sp-8)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: 'var(--sp-3)' }}>🏏</div>
                            <p style={{ fontWeight: 600 }}>{currentBatter.batterUsername} is batting</p>
                            <p style={{ fontSize: '0.8rem', marginTop: 8 }}>Your turn is coming up...</p>
                        </div>
                    )}

                    {phase === 'waiting' && (
                        <div style={{ textAlign: 'center', color: 'var(--c-text-dim)', padding: 'var(--sp-8)' }}>
                            <p>Waiting for match to start...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
