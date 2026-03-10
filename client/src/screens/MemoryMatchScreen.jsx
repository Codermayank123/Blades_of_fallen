import { useState, useEffect, useRef } from 'react';

export default function MemoryMatchScreen({ playerId, gameState, onLeave }) {
    const [cards, setCards] = useState([]);
    const [revealedCards, setRevealedCards] = useState([]);
    const [matchedCards, setMatchedCards] = useState(new Set());
    const [currentTurn, setCurrentTurn] = useState(null);
    const [scores, setScores] = useState({});
    const [players, setPlayers] = useState([]);
    const [columns, setColumns] = useState(4);
    const [feedMessage, setFeedMessage] = useState('');
    const [timeLeft, setTimeLeft] = useState(0);
    const timerRef = useRef(null);
    const [showIntro, setShowIntro] = useState(true);

    const isMyTurn = currentTurn === playerId;

    // Init from GAME_START
    useEffect(() => {
        if (gameState && cards.length === 0) {
            const cnt = gameState.cardCount || gameState.boardSize || 12;
            const cols = gameState.columns || 4;
            setCards(Array(cnt).fill(null));
            setColumns(cols);
            if (gameState.players) setPlayers(gameState.players);
        }
    }, [gameState]);

    useEffect(() => {
        if (!gameState?.lastMessage) return;
        const msg = gameState.lastMessage;

        if (msg.type === 'GAME_START') {
            setCards(Array(msg.cardCount || 12).fill(null));
            setColumns(msg.columns || 4);
        }

        if (msg.type === 'TURN') {
            setCurrentTurn(msg.currentPlayer);
            setMatchedCards(new Set(msg.matchedCards || []));
            setScores(msg.scores || {});
            setRevealedCards([]);
            setTimeLeft(msg.timeLimit || 10);
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current); return 0; } return t - 1; });
            }, 1000);
        }

        if (msg.type === 'FLIP_RESULT') {
            setRevealedCards(msg.revealedCards || []);
            if (msg.cardIndex !== undefined && msg.symbol) {
                setCards(prev => {
                    const next = [...prev];
                    next[msg.cardIndex] = msg.symbol;
                    return next;
                });
            }
        }

        if (msg.type === 'GAME_STATE') {
            if (msg.action === 'match_found') {
                setFeedMessage(`✅ ${msg.username || 'Someone'} matched ${msg.symbol}!`);
                setMatchedCards(new Set(msg.matchedCards || []));
                setScores(msg.scores || {});
            } else if (msg.action === 'no_match') {
                setFeedMessage('❌ No match — next player\'s turn');
                setMatchedCards(new Set(msg.matchedCards || []));
                setScores(msg.scores || {});
                setTimeout(() => setRevealedCards([]), 800);
            }
        }
    }, [gameState?.lastMessage]);

    useEffect(() => {
        if (gameState?.players) setPlayers(gameState.players);
    }, [gameState?.players]);

    useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

    const handleFlip = (cardIndex) => {
        if (!isMyTurn) return;
        if (matchedCards.has(cardIndex)) return;
        if (revealedCards.some(r => r.index === cardIndex)) return;
        if (revealedCards.length >= 2) return;
        gameState?.send?.({ type: 'GAME_ACTION', action: 'flip', cardIndex });
    };

    const getName = (id) => {
        const p = (players || []).find(p => p.id === id);
        if (!p) return id?.slice(0, 6) || '???';
        return (p.username || '').split('_')[0] || p.username;
    };

    const isRevealed = (i) => revealedCards.some(r => r.index === i);
    const isMatched = (i) => matchedCards.has(i);

    const timerPct = timeLeft > 0 ? (timeLeft / 10) * 100 : 0;
    const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);

    return (
        <div style={{
            minHeight: '100vh', width: '100%',
            background: 'var(--c-bg)',
            display: 'flex', flexDirection: 'column',
            padding: 'var(--sp-4)',
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
                        background: 'linear-gradient(135deg, #020617, #0f172a, #111827)',
                        border: '1px solid rgba(34,211,238,0.5)',
                        boxShadow: '0 24px 80px rgba(15,23,42,0.95), 0 0 40px rgba(34,211,238,0.6)',
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
                            Memory Match
                        </h2>
                        <p style={{ marginTop: 0, marginBottom: 16, fontSize: 13, color: 'var(--c-text-dim)' }}>
                            Flip cards two at a time to find matching pairs. Try to remember where
                            symbols are revealed.
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
                                border: '1px solid rgba(34,211,238,0.4)',
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
                                    <li>On your turn, click on a face‑down card to flip it.</li>
                                    <li>Flip a second card to try to find the matching symbol.</li>
                                    <li>If they don&apos;t match, they flip back on the next turn.</li>
                                </ul>
                            </div>

                            <div style={{
                                padding: 12,
                                borderRadius: 12,
                                background: 'rgba(15,23,42,0.9)',
                                border: '1px solid rgba(52,211,153,0.4)',
                            }}>
                                <h3 style={{
                                    margin: '0 0 8px',
                                    fontSize: 13,
                                    letterSpacing: 1,
                                    color: 'var(--c-green)',
                                    textTransform: 'uppercase',
                                }}>
                                    Turn & Score
                                </h3>
                                <ul style={{
                                    margin: 0,
                                    paddingLeft: 18,
                                    fontSize: 13,
                                    lineHeight: 1.6,
                                    color: 'var(--c-text-dim)',
                                }}>
                                    <li>Only the active player can flip cards.</li>
                                    <li>Find a pair to score points and keep your turn.</li>
                                    <li>Scoreboard at the bottom shows who is leading.</li>
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
                            Tip: Pay attention when others reveal cards — you can use that
                            information on your turn.
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
                                    background: 'linear-gradient(135deg, #22d3ee, #34d399)',
                                    color: '#020617',
                                    boxShadow: '0 0 30px rgba(34,211,238,0.6), 0 0 60px rgba(52,211,153,0.5)',
                                }}
                            >
                                Start Game
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Header */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: 'var(--sp-3) var(--sp-4)',
                background: 'rgba(255,255,255,0.02)',
                borderBottom: '1px solid var(--c-border)',
                marginBottom: 'var(--sp-4)',
            }}>
                <span style={{ fontFamily: 'var(--f-mono)', fontWeight: 700, fontSize: '1rem', color: 'var(--c-cyan)', letterSpacing: '2px' }}>
                    🃏 MEMORY MATCH
                </span>
                <div style={{
                    fontFamily: 'var(--f-mono)', fontSize: '0.9rem', fontWeight: 700,
                    color: timeLeft <= 3 ? 'var(--c-red)' : 'var(--c-green)',
                    padding: '6px 14px', borderRadius: 'var(--r-full)',
                    background: timeLeft <= 3 ? 'rgba(248,113,113,0.1)' : 'rgba(52,211,153,0.1)',
                    border: `1px solid ${timeLeft <= 3 ? 'rgba(248,113,113,0.2)' : 'rgba(52,211,153,0.2)'}`,
                }}>
                    {timeLeft}s
                </div>
                <button className="btn2 btn2--ghost" style={{ fontSize: '0.75rem' }} onClick={onLeave}>Exit</button>
            </div>

            {/* Timer bar */}
            <div style={{ height: 3, background: 'var(--c-surface2)', borderRadius: 2, marginBottom: 'var(--sp-3)' }}>
                <div style={{
                    height: '100%', width: `${timerPct}%`,
                    background: timeLeft <= 3 ? 'var(--c-red)' : 'var(--c-cyan)',
                    transition: 'width 1s linear, background 0.3s', borderRadius: 2,
                }} />
            </div>

            {/* Turn indicator */}
            <div style={{
                textAlign: 'center', marginBottom: 'var(--sp-3)', padding: 'var(--sp-3)',
                borderRadius: 'var(--r-md)',
                background: isMyTurn ? 'rgba(52,211,153,0.06)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isMyTurn ? 'rgba(52,211,153,0.15)' : 'transparent'}`,
            }}>
                {isMyTurn
                    ? <span style={{ color: 'var(--c-green)', fontWeight: 600, fontSize: '0.875rem' }}>Your turn — flip two cards!</span>
                    : <span style={{ color: 'var(--c-text-dim)', fontSize: '0.875rem' }}>Waiting for {getName(currentTurn)}...</span>
                }
            </div>

            {/* Feed */}
            {feedMessage && (
                <div style={{
                    textAlign: 'center', padding: 'var(--sp-2)', color: 'var(--c-text-dim)',
                    fontSize: '0.8rem', marginBottom: 'var(--sp-2)',
                }}>
                    {feedMessage}
                </div>
            )}

            {/* Card grid */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${columns}, 1fr)`,
                    gap: 'var(--sp-2)',
                    width: '100%',
                    maxWidth: columns <= 4 ? 480 : 640,
                    marginBottom: 'var(--sp-5)',
                }}>
                    {cards.map((symbol, index) => {
                        const revealed = isRevealed(index);
                        const matched = isMatched(index);
                        const showFace = revealed || matched;
                        const clickable = isMyTurn && !matched && !revealed && revealedCards.length < 2;

                        return (
                            <div
                                key={index}
                                className={`mem-card ${showFace ? 'mem-card--flipped' : ''} ${matched ? 'mem-card--matched' : ''}`}
                                onClick={() => clickable && handleFlip(index)}
                                style={{ aspectRatio: '1', cursor: clickable ? 'pointer' : 'default' }}
                            >
                                <div className="mem-card__inner">
                                    <div className="mem-card__face mem-card__back">
                                        <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.7rem', opacity: 0.3 }}>?</span>
                                    </div>
                                    <div className="mem-card__face mem-card__front">
                                        {symbol || '?'}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Scoreboard */}
                {sortedScores.length > 0 && (
                    <div style={{
                        padding: 'var(--sp-4)', background: 'var(--c-surface)',
                        borderRadius: 'var(--r-lg)', border: '1px solid var(--c-border)',
                        width: '100%', maxWidth: 400,
                    }}>
                        <div className="section-label" style={{ marginBottom: 'var(--sp-3)' }}>Scoreboard</div>
                        {sortedScores.map(([id, score], i) => {
                            const isMe = id === playerId;
                            const isCurrent = id === currentTurn;
                            return (
                                <div key={id} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: 'var(--sp-2) 0', fontSize: '0.875rem',
                                    color: isMe ? 'var(--c-green)' : isCurrent ? 'var(--c-amber)' : 'var(--c-text-dim)',
                                    fontWeight: isMe ? 700 : 400,
                                    borderBottom: i < sortedScores.length - 1 ? '1px solid var(--c-border)' : 'none',
                                }}>
                                    <span>
                                        {isCurrent && <span style={{ marginRight: 4, color: 'var(--c-amber)' }}>▶</span>}
                                        #{i + 1} {getName(id)} {isMe ? '(you)' : ''}
                                    </span>
                                    <span style={{ fontFamily: 'var(--f-mono)', fontWeight: 700 }}>{score}</span>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Waiting */}
                {cards.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--c-text-dim)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 'var(--sp-3)' }}>🃏</div>
                        <p>Setting up the board...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
