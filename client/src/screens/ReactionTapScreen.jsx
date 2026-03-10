import { useState, useEffect, useRef } from 'react';

export default function ReactionTapScreen({ playerId, gameState, onLeave }) {
    const sendAction = (action) => gameState?.send?.({ type: 'GAME_ACTION', action });
    const [phase, setPhase] = useState('waiting'); // waiting, ready, go, tapped, results
    const [round, setRound] = useState(0);
    const [totalRounds, setTotalRounds] = useState(10);
    const [scores, setScores] = useState({});
    const [roundResults, setRoundResults] = useState(null);
    const [players, setPlayers] = useState([]);
    const [message, setMessage] = useState('');
    const [tapTime, setTapTime] = useState(null);
    const goTimeRef = useRef(null);
    const [showIntro, setShowIntro] = useState(true);

    useEffect(() => {
        if (!gameState?.lastMessage) return;
        const msg = gameState.lastMessage;

        switch (msg.type) {
            case 'ROUND_START':
                setRound(msg.round);
                setTotalRounds(msg.totalRounds);
                setScores(msg.scores || {});
                setPhase('ready');
                setTapTime(null);
                setRoundResults(null);
                setMessage('Get ready... 👀');
                break;
            case 'TAP_GO':
                setPhase('go');
                goTimeRef.current = Date.now();
                setMessage('TAP NOW! ⚡');
                break;
            case 'GAME_STATE':
                if (msg.action === 'player_tapped') {
                    if (msg.playerId === playerId) {
                        setPhase('tapped');
                    }
                } else if (msg.action === 'false_start') {
                    setMessage('Too early! Wait for GO! ❌');
                }
                break;
            case 'ROUND_END':
                setPhase('results');
                setRoundResults(msg.results);
                setScores(msg.scores || {});
                break;
        }
    }, [gameState?.lastMessage, playerId]);

    useEffect(() => {
        if (gameState?.players) setPlayers(gameState.players);
    }, [gameState?.players]);

    const handleTap = () => {
        if (phase === 'ready') {
            // False start
            setMessage('Too early! Wait for GO! ❌');
            return;
        }
        if (phase !== 'go') return;

        const reactionMs = Date.now() - goTimeRef.current;
        setTapTime(reactionMs);
        setPhase('tapped');
        sendAction('tap');
    };

    const getPlayerName = (id) => {
        const p = (players || []).find(p => p.id === id);
        return p?.username || id?.slice(0, 6);
    };

    const getColor = () => {
        if (phase === 'go') return '#22c55e';
        if (phase === 'ready') return '#fbbf24';
        return '#a855f7';
    };

    return (
        <div style={{ minHeight: '100vh', width: '100%', background: 'var(--c-bg)', display: 'flex', flexDirection: 'column', padding: 'var(--sp-4)' }}>
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
                        background: 'linear-gradient(135deg, #020617, #0f172a, #1f2937)',
                        border: '1px solid rgba(250,204,21,0.5)',
                        boxShadow: '0 24px 80px rgba(15,23,42,0.95), 0 0 40px rgba(250,204,21,0.6)',
                        color: 'var(--c-text)',
                        fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                    }}>
                        <h2 style={{
                            marginTop: 0,
                            marginBottom: 8,
                            fontSize: 'clamp(20px, 3vw, 26px)',
                            textTransform: 'uppercase',
                            letterSpacing: 3,
                            color: '#fbbf24',
                        }}>
                            Reaction Tap
                        </h2>
                        <p style={{ marginTop: 0, marginBottom: 16, fontSize: 13, color: 'var(--c-text-dim)' }}>
                            Wait for the screen to turn green, then tap as fast as you can. Too
                            early means a penalty.
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
                                border: '1px solid rgba(250,204,21,0.4)',
                            }}>
                                <h3 style={{
                                    margin: '0 0 8px',
                                    fontSize: 13,
                                    letterSpacing: 1,
                                    color: '#fbbf24',
                                    textTransform: 'uppercase',
                                }}>
                                    Phases
                                </h3>
                                <ul style={{
                                    margin: 0,
                                    paddingLeft: 18,
                                    fontSize: 13,
                                    lineHeight: 1.6,
                                    color: 'var(--c-text-dim)',
                                }}>
                                    <li><strong>Yellow</strong> – Get ready but don&apos;t tap.</li>
                                    <li><strong>Green</strong> – Tap anywhere in the big box.</li>
                                    <li><strong>Too early</strong> – False start warning.</li>
                                </ul>
                            </div>

                            <div style={{
                                padding: 12,
                                borderRadius: 12,
                                background: 'rgba(15,23,42,0.9)',
                                border: '1px solid rgba(34,197,94,0.4)',
                            }}>
                                <h3 style={{
                                    margin: '0 0 8px',
                                    fontSize: 13,
                                    letterSpacing: 1,
                                    color: '#22c55e',
                                    textTransform: 'uppercase',
                                }}>
                                    Scoring
                                </h3>
                                <ul style={{
                                    margin: 0,
                                    paddingLeft: 18,
                                    fontSize: 13,
                                    lineHeight: 1.6,
                                    color: 'var(--c-text-dim)',
                                }}>
                                    <li>Your reaction time in milliseconds is recorded each round.</li>
                                    <li>Faster taps earn more points.</li>
                                    <li>Leaderboard at the bottom tracks total points.</li>
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
                            Tip: Don&apos;t focus on the icon, focus on the color change – it helps
                            you react more consistently.
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
                                    background: 'linear-gradient(135deg, #fbbf24, #22c55e)',
                                    color: '#020617',
                                    boxShadow: '0 0 30px rgba(250,204,21,0.6), 0 0 60px rgba(34,197,94,0.5)',
                                }}
                            >
                                Start Rounds
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--c-border)', paddingBottom: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
                <span style={{ fontFamily: 'var(--f-mono)', fontWeight: 700, color: '#fbbf24', letterSpacing: '2px', fontSize: '1rem' }}>⚡ REACTION TAP</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', fontWeight: 600 }}>Round {round}/{totalRounds}</span>
                <button className="btn2 btn2--ghost" style={{ fontSize: '0.75rem' }} onClick={onLeave}>Exit</button>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-4)' }}>
                <div className="card" style={{ maxWidth: '550px', width: '100%', padding: '24px' }}>

                    {/* Tap Area */}
                    <div
                        onClick={handleTap}
                        style={{
                            width: '100%',
                            height: '200px',
                            borderRadius: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: (phase === 'go' || phase === 'ready') ? 'pointer' : 'default',
                            background: phase === 'go'
                                ? 'linear-gradient(135deg, rgba(34,197,94,0.4), rgba(34,197,94,0.1))'
                                : phase === 'ready'
                                    ? 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,191,36,0.05))'
                                    : 'rgba(255,255,255,0.03)',
                            border: `2px solid ${phase === 'go' ? 'rgba(34,197,94,0.5)' : phase === 'ready' ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.08)'}`,
                            transition: 'all 0.15s',
                            userSelect: 'none',
                            marginBottom: '16px'
                        }}
                    >
                        <div style={{ fontSize: '3rem', marginBottom: '8px' }}>
                            {phase === 'go' ? '🟢' : phase === 'ready' ? '🟡' : phase === 'tapped' ? '✅' : '⏳'}
                        </div>
                        <div style={{
                            fontSize: phase === 'go' ? '1.5rem' : '1.1rem',
                            fontWeight: 800,
                            color: getColor(),
                            textTransform: 'uppercase',
                            letterSpacing: '2px'
                        }}>
                            {phase === 'go' ? 'TAP NOW!' : phase === 'ready' ? 'WAIT...' : phase === 'tapped' ? `${tapTime}ms` : message || 'Waiting...'}
                        </div>
                        {phase === 'tapped' && tapTime && (
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginTop: '4px' }}>
                                Reaction time recorded ✅
                            </div>
                        )}
                    </div>

                    {/* Round Results */}
                    {phase === 'results' && roundResults && (
                        <div style={{
                            background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
                            padding: '16px', marginBottom: '16px'
                        }}>
                            <h4 style={{ margin: '0 0 10px', color: '#fbbf24', fontSize: '0.9rem' }}>⚡ Round Results</h4>
                            {roundResults.map((r, i) => {
                                const isMe = r.id === playerId;
                                return (
                                    <div key={i} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '8px 12px', borderRadius: '8px', marginBottom: '4px',
                                        background: isMe ? 'rgba(251,191,36,0.1)' : 'transparent',
                                        border: isMe ? '1px solid rgba(251,191,36,0.2)' : 'none'
                                    }}>
                                        <span style={{ fontWeight: isMe ? 700 : 500, fontSize: '0.9rem' }}>
                                            #{r.position} {r.username} {isMe ? '⭐' : ''}
                                        </span>
                                        <span style={{
                                            color: r.reactionTime ? '#22c55e' : '#ef4444',
                                            fontWeight: 600, fontSize: '0.85rem'
                                        }}>
                                            {r.reactionTime ? `${r.reactionTime}ms (+${r.points})` : 'No tap'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Scoreboard */}
                    {Object.keys(scores).length > 0 && (
                        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                            <h4 style={{ margin: '0 0 10px', color: '#fbbf24', fontSize: '0.9rem' }}>🏆 Total Scores</h4>
                            {Object.entries(scores)
                                .sort((a, b) => b[1] - a[1])
                                .map(([id, score], i) => (
                                    <div key={id} style={{
                                        display: 'flex', justifyContent: 'space-between',
                                        padding: '6px 0', fontSize: '0.85rem',
                                        color: id === playerId ? '#fbbf24' : 'rgba(255,255,255,0.6)',
                                        fontWeight: id === playerId ? 700 : 400
                                    }}>
                                        <span>#{i + 1} {getPlayerName(id)} {id === playerId ? '⭐' : ''}</span>
                                        <span>{score} pts</span>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
