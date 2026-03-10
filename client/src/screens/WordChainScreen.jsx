import { useState, useEffect, useRef } from 'react';

export default function WordChainScreen({ playerId, gameState, onAction, onBack }) {
    const [currentTurn, setCurrentTurn] = useState(null);
    const [word, setWord] = useState('');
    const [lastWord, setLastWord] = useState('');
    const [requiredLetter, setRequiredLetter] = useState('');
    const [scores, setScores] = useState({});
    const [eliminated, setEliminated] = useState([]);
    const [players, setPlayers] = useState([]);
    const [timeLeft, setTimeLeft] = useState(0);
    const [feedMessage, setFeedMessage] = useState('');
    const timerRef = useRef(null);
    const [showIntro, setShowIntro] = useState(true);
    const inputRef = useRef(null);

    const isMyTurn = currentTurn === playerId;
    const amEliminated = eliminated.includes(playerId);

    useEffect(() => {
        if (!gameState?.lastMessage) return;
        const msg = gameState.lastMessage;

        switch (msg.type) {
            case 'TURN':
                setCurrentTurn(msg.currentPlayer);
                setLastWord(msg.lastWord || '');
                setRequiredLetter(msg.requiredLetter || '');
                setScores(msg.scores || {});
                setEliminated(msg.eliminated || []);
                setTimeLeft(msg.timeLimit);
                setWord('');

                if (timerRef.current) clearInterval(timerRef.current);
                timerRef.current = setInterval(() => {
                    setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current); return 0; } return t - 1; });
                }, 1000);

                if (msg.currentPlayer === playerId) {
                    setTimeout(() => inputRef.current?.focus(), 100);
                }
                break;
            case 'GAME_STATE':
                if (msg.action === 'word_accepted') {
                    setFeedMessage(`✅ ${msg.username}: "${msg.word}" (+${msg.points} pts)`);
                    setScores(msg.scores || {});
                } else if (msg.action === 'player_eliminated') {
                    setFeedMessage(`💀 ${msg.username} eliminated: ${msg.reason}`);
                    setEliminated(msg.eliminated || []);
                    setScores(msg.scores || {});
                }
                break;
            case 'ROUND_START':
                if (msg.playerOrder) {
                    setPlayers(msg.playerOrder);
                }
                break;
        }
    }, [gameState?.lastMessage, playerId]);

    useEffect(() => {
        if (gameState?.players) setPlayers(gameState.players);
    }, [gameState?.players]);

    useEffect(() => {
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    const handleSubmitWord = (e) => {
        e.preventDefault();
        if (!word.trim() || !isMyTurn) return;
        onAction({ action: 'word', word: word.trim() });
        setWord('');
    };

    const getPlayerName = (item) => {
        if (typeof item === 'object') return item.username;
        // It's an ID - find from players
        const found = (Array.isArray(players) ? players : []).find(p =>
            (typeof p === 'object' ? p.id : p) === item
        );
        return typeof found === 'object' ? found.username : item?.slice(0, 6);
    };

    return (
        <div className="screen fade-in" style={{ padding: '16px', position: 'relative' }}>
            {/* Intro / rules overlay */}
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
                        background: 'linear-gradient(135deg, #020617, #0f172a, #022c22)',
                        border: '1px solid rgba(34,197,94,0.5)',
                        boxShadow: '0 24px 80px rgba(15,23,42,0.95), 0 0 40px rgba(34,197,94,0.6)',
                        color: 'var(--c-text)',
                        fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                    }}>
                        <h2 style={{
                            marginTop: 0,
                            marginBottom: 8,
                            fontSize: 'clamp(20px, 3vw, 26px)',
                            textTransform: 'uppercase',
                            letterSpacing: 3,
                            color: '#06b6d4',
                        }}>
                            Word Chain
                        </h2>
                        <p style={{ marginTop: 0, marginBottom: 16, fontSize: 13, color: 'var(--c-text-dim)' }}>
                            Continue the chain by typing a word that starts with the last letter of
                            the previous word.
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
                                border: '1px solid rgba(6,182,212,0.5)',
                            }}>
                                <h3 style={{
                                    margin: '0 0 8px',
                                    fontSize: 13,
                                    letterSpacing: 1,
                                    color: '#06b6d4',
                                    textTransform: 'uppercase',
                                }}>
                                    Your Turn
                                </h3>
                                <ul style={{
                                    margin: 0,
                                    paddingLeft: 18,
                                    fontSize: 13,
                                    lineHeight: 1.6,
                                    color: 'var(--c-text-dim)',
                                }}>
                                    <li>Check the last word and required starting letter.</li>
                                    <li>Type a valid word that starts with that letter.</li>
                                    <li>Submit before the timer hits zero.</li>
                                </ul>
                            </div>

                            <div style={{
                                padding: 12,
                                borderRadius: 12,
                                background: 'rgba(15,23,42,0.9)',
                                border: '1px solid rgba(34,197,94,0.5)',
                            }}>
                                <h3 style={{
                                    margin: '0 0 8px',
                                    fontSize: 13,
                                    letterSpacing: 1,
                                    color: '#22c55e',
                                    textTransform: 'uppercase',
                                }}>
                                    Scoring & Elimination
                                </h3>
                                <ul style={{
                                    margin: 0,
                                    paddingLeft: 18,
                                    fontSize: 13,
                                    lineHeight: 1.6,
                                    color: 'var(--c-text-dim)',
                                }}>
                                    <li>Valid words earn you points.</li>
                                    <li>Invalid, repeated, or missing words can eliminate you.</li>
                                    <li>Last remaining player or highest score wins.</li>
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
                            Tip: Think ahead while others play – have a word ready for your next
                            letter.
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
                                    background: 'linear-gradient(135deg, #06b6d4, #22c55e)',
                                    color: '#020617',
                                    boxShadow: '0 0 30px rgba(6,182,212,0.6), 0 0 60px rgba(34,197,94,0.5)',
                                }}
                            >
                                Start Round
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="card" style={{ maxWidth: '600px', width: '100%', padding: '24px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{
                        margin: 0, background: 'linear-gradient(135deg, #06b6d4, #22c55e)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                    }}>📝 Word Chain</h2>
                    <div style={{
                        background: timeLeft <= 5 ? 'rgba(239,68,68,0.3)' : 'rgba(6,182,212,0.2)',
                        padding: '8px 16px', borderRadius: '20px', fontWeight: 700,
                        color: timeLeft <= 5 ? '#ef4444' : '#06b6d4'
                    }}>⏱️ {timeLeft}s</div>
                </div>

                {/* Current word chain info */}
                <div style={{
                    background: 'rgba(255,255,255,0.05)', borderRadius: '16px',
                    padding: '20px', marginBottom: '20px', textAlign: 'center',
                    border: '1px solid rgba(6,182,212,0.15)'
                }}>
                    {lastWord ? (
                        <>
                            <p style={{ margin: '0 0 8px', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Last word:</p>
                            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#06b6d4' }}>{lastWord}</p>
                            <p style={{ margin: '8px 0 0', fontSize: '0.9rem', color: '#fbbf24' }}>
                                Next word must start with <strong style={{ fontSize: '1.2rem' }}>"{requiredLetter.toUpperCase()}"</strong>
                            </p>
                        </>
                    ) : (
                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)' }}>First word — type anything!</p>
                    )}
                </div>

                {/* Turn indicator */}
                <div style={{
                    textAlign: 'center', marginBottom: '16px', padding: '12px',
                    borderRadius: '10px',
                    background: isMyTurn ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.03)',
                    border: isMyTurn ? '1px solid rgba(34,197,94,0.3)' : 'none'
                }}>
                    {amEliminated ? (
                        <span style={{ color: '#ef4444', fontWeight: 700 }}>💀 You've been eliminated!</span>
                    ) : isMyTurn ? (
                        <span style={{ color: '#22c55e', fontWeight: 700, fontSize: '1.1rem' }}>🎯 Your turn! Type a word!</span>
                    ) : (
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                            Waiting for {currentTurn ? getPlayerName(currentTurn) : '...'}
                        </span>
                    )}
                </div>

                {/* Input */}
                {isMyTurn && !amEliminated && (
                    <form onSubmit={handleSubmitWord} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={word}
                            onChange={e => setWord(e.target.value)}
                            placeholder={requiredLetter ? `Type a word starting with "${requiredLetter.toUpperCase()}"...` : 'Type any word...'}
                            className="input"
                            style={{ flex: 1, fontSize: '1rem' }}
                            maxLength={30}
                            autoFocus
                        />
                        <button type="submit" className="btn btn-primary"
                            disabled={!word.trim()}
                            style={{ padding: '12px 24px', whiteSpace: 'nowrap' }}>
                            Send ➤
                        </button>
                    </form>
                )}

                {/* Feed message */}
                {feedMessage && (
                    <div style={{
                        textAlign: 'center', padding: '10px', borderRadius: '8px',
                        background: 'rgba(255,255,255,0.03)', marginBottom: '12px',
                        color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem'
                    }}>{feedMessage}</div>
                )}

                {/* Player Scores */}
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                    <h4 style={{ margin: '0 0 10px', color: '#06b6d4', fontSize: '0.9rem' }}>👥 Players</h4>
                    {Object.entries(scores)
                        .sort((a, b) => b[1] - a[1])
                        .map(([id, score], i) => {
                            const isElim = eliminated.includes(id);
                            const isMe = id === playerId;
                            return (
                                <div key={id} style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    padding: '6px 0', fontSize: '0.85rem',
                                    color: isElim ? 'rgba(255,255,255,0.3)' : (isMe ? '#06b6d4' : 'rgba(255,255,255,0.6)'),
                                    fontWeight: isMe ? 700 : 400,
                                    textDecoration: isElim ? 'line-through' : 'none'
                                }}>
                                    <span>
                                        {currentTurn === id ? '➤ ' : ''}
                                        {getPlayerName(id)} {isMe ? '⭐' : ''} {isElim ? '💀' : ''}
                                    </span>
                                    <span>{score} pts</span>
                                </div>
                            );
                        })}
                </div>
            </div>
        </div>
    );
}
