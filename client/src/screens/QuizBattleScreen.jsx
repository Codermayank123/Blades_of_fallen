import { useState, useEffect, useRef } from 'react';

export default function QuizBattleScreen({ playerId, gameState, onLeave }) {
    const [question, setQuestion] = useState(null);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [roundResult, setRoundResult] = useState(null);
    const [scores, setScores] = useState({});
    const [players, setPlayers] = useState([]);
    const [timeLeft, setTimeLeft] = useState(0);
    const [roundNum, setRoundNum] = useState(0);
    const [totalRounds, setTotalRounds] = useState(8);
    const timerRef = useRef(null);
    const [showIntro, setShowIntro] = useState(true);

    useEffect(() => {
        if (!gameState?.lastMessage) return;
        const msg = gameState.lastMessage;

        if (msg.type === 'QUESTION') {
            setQuestion(msg);
            setSelectedAnswer(null);
            setRoundResult(null);
            setTimeLeft(msg.timeLimit || 15);
            setRoundNum(msg.round || 0);
            setTotalRounds(msg.totalRounds || 8);
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                setTimeLeft(t => {
                    if (t <= 1) { clearInterval(timerRef.current); return 0; }
                    return t - 1;
                });
            }, 1000);
        }

        if (msg.type === 'ROUND_END') {
            clearInterval(timerRef.current);
            setRoundResult(msg);
            setScores(msg.scores || {});
        }
    }, [gameState?.lastMessage]);

    useEffect(() => {
        if (gameState?.players) setPlayers(gameState.players);
    }, [gameState?.players]);

    useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

    const handleAnswer = (index) => {
        if (selectedAnswer !== null) return;
        setSelectedAnswer(index);
        gameState?.send?.({ type: 'GAME_ACTION', action: 'answer', answerIndex: index });
    };

    const getName = (id) => {
        const p = players.find(p => p.id === id);
        return p?.username?.split('_')[0] || (id?.slice(0, 6) ?? '???');
    };

    const timerPct = question ? (timeLeft / (question.timeLimit || 15)) * 100 : 100;
    const isUrgent = timeLeft <= 5 && timeLeft > 0;

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
                        background: 'linear-gradient(135deg, #020617, #111827, #1f2937)',
                        border: '1px solid rgba(168,85,247,0.5)',
                        boxShadow: '0 24px 80px rgba(15,23,42,0.95), 0 0 40px rgba(168,85,247,0.6)',
                        color: 'var(--c-text)',
                        fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                    }}>
                        <h2 style={{
                            marginTop: 0,
                            marginBottom: 8,
                            fontSize: 'clamp(20px, 3vw, 26px)',
                            textTransform: 'uppercase',
                            letterSpacing: 3,
                            color: '#a855f7',
                        }}>
                            Quiz Battle
                        </h2>
                        <p style={{ marginTop: 0, marginBottom: 16, fontSize: 13, color: 'var(--c-text-dim)' }}>
                            Answer each question before the timer hits zero. Faster correct answers
                            earn more points.
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
                                border: '1px solid rgba(168,85,247,0.4)',
                            }}>
                                <h3 style={{
                                    margin: '0 0 8px',
                                    fontSize: 13,
                                    letterSpacing: 1,
                                    color: '#a855f7',
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
                                    <li>Read the question at the top of the screen.</li>
                                    <li>Click one of the four answer options (A, B, C, or D).</li>
                                    <li>Once you select an answer, it&apos;s locked for that round.</li>
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
                                    <li>Correct answers give you points.</li>
                                    <li>Incorrect or late answers may give zero points.</li>
                                    <li>Leaderboard on the bottom shows the current rankings.</li>
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
                            Tip: Don&apos;t spam clicks — one confident answer is better than second‑guessing and running out of time.
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
                                    background: 'linear-gradient(135deg, #a855f7, #22c55e)',
                                    color: '#020617',
                                    boxShadow: '0 0 30px rgba(168,85,247,0.6), 0 0 60px rgba(34,197,94,0.5)',
                                }}
                            >
                                Start Quiz
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ── Header ─────────────────────────── */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: 'var(--sp-3) var(--sp-4)',
                background: 'rgba(255,255,255,0.02)',
                borderBottom: '1px solid var(--c-border)',
                marginBottom: 'var(--sp-5)',
            }}>
                <span style={{ fontFamily: 'var(--f-mono)', fontWeight: 700, fontSize: '1rem', color: '#a855f7', letterSpacing: '2px' }}>
                    🧠 QUIZ BATTLE
                </span>
                {roundNum > 0 && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--c-text-dim)', fontWeight: 600 }}>
                        Round {roundNum} / {totalRounds}
                    </span>
                )}
                {/* Timer */}
                {question && (
                    <div style={{
                        background: isUrgent ? 'rgba(239,68,68,0.2)' : 'rgba(168,85,247,0.15)',
                        border: `1px solid ${isUrgent ? 'rgba(239,68,68,0.4)' : 'rgba(168,85,247,0.3)'}`,
                        borderRadius: '999px', padding: '6px 16px',
                        fontFamily: 'var(--f-mono)', fontWeight: 700, fontSize: '1rem',
                        color: isUrgent ? '#ef4444' : '#a855f7',
                    }}>
                        {timeLeft}s
                    </div>
                )}
            </div>

            {/* ── Timer bar ───────────────────────── */}
            {question && (
                <div style={{ height: 4, background: 'var(--c-surface2)', marginBottom: 'var(--sp-5)', borderRadius: 2 }}>
                    <div style={{
                        height: '100%', width: `${timerPct}%`,
                        background: isUrgent ? '#ef4444' : '#a855f7',
                        borderRadius: 2, transition: 'width 1s linear, background 0.3s',
                    }} />
                </div>
            )}

            {/* ── Main content ────────────────────── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ maxWidth: 700, width: '100%' }}>

                    {/* Question */}
                    {question && !roundResult && (
                        <>
                            <div style={{
                                background: 'rgba(168,85,247,0.06)',
                                border: '1px solid rgba(168,85,247,0.2)',
                                borderRadius: 'var(--r-xl)', padding: 'var(--sp-8)',
                                textAlign: 'center', marginBottom: 'var(--sp-6)',
                            }}>
                                <p style={{ fontSize: 'clamp(1rem,2.5vw,1.25rem)', fontWeight: 600, lineHeight: 1.6, color: 'var(--c-text)' }}>
                                    {question.question}
                                </p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
                                {(question.options || []).map((opt, i) => {
                                    const isSelected = selectedAnswer === i;
                                    return (
                                        <button key={i} onClick={() => handleAnswer(i)}
                                            disabled={selectedAnswer !== null}
                                            style={{
                                                padding: 'var(--sp-5)', borderRadius: 'var(--r-lg)',
                                                border: isSelected ? '2px solid #a855f7' : '1px solid rgba(255,255,255,0.08)',
                                                background: isSelected ? 'rgba(168,85,247,0.25)' : 'rgba(255,255,255,0.03)',
                                                color: isSelected ? '#fff' : 'var(--c-text)',
                                                cursor: selectedAnswer !== null ? 'default' : 'pointer',
                                                fontSize: '0.95rem', fontWeight: 600,
                                                transition: 'all 0.2s',
                                                opacity: selectedAnswer !== null && !isSelected ? 0.45 : 1,
                                                boxShadow: isSelected ? '0 0 20px rgba(168,85,247,0.3)' : 'none',
                                                transform: isSelected ? 'scale(1.01)' : 'scale(1)',
                                            }}
                                            onMouseEnter={e => { if (selectedAnswer === null) { e.currentTarget.style.background = 'rgba(168,85,247,0.12)'; e.currentTarget.style.borderColor = 'rgba(168,85,247,0.4)'; } }}
                                            onMouseLeave={e => { if (selectedAnswer === null && selectedAnswer !== i) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; } }}
                                        >
                                            <span style={{ marginRight: 10, opacity: 0.5, fontFamily: 'var(--f-mono)' }}>
                                                {['A', 'B', 'C', 'D'][i]}.
                                            </span>
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>

                            {selectedAnswer !== null && (
                                <p style={{ textAlign: 'center', color: '#a855f7', marginTop: 'var(--sp-4)', fontSize: '0.875rem', opacity: 0.8 }}>
                                    ✅ Answer locked in — waiting for others...
                                </p>
                            )}
                        </>
                    )}

                    {/* Round Result */}
                    {roundResult && (
                        <div className="fade-in">
                            <div style={{
                                textAlign: 'center', padding: 'var(--sp-4) var(--sp-6)',
                                background: 'rgba(34,197,94,0.06)',
                                border: '1px solid rgba(34,197,94,0.2)', borderRadius: 'var(--r-lg)',
                                marginBottom: 'var(--sp-4)',
                            }}>
                                <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--c-green)' }}>
                                    ✅ Correct: {question?.options?.[roundResult.correctAnswer]}
                                </p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', marginBottom: 'var(--sp-4)' }}>
                                {(roundResult.results || []).map((r, i) => {
                                    const isMe = r.id === playerId;
                                    return (
                                        <div key={i} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: 'var(--sp-3) var(--sp-4)', borderRadius: 'var(--r-md)',
                                            background: isMe ? 'rgba(168,85,247,0.1)' : 'rgba(255,255,255,0.02)',
                                            border: `1px solid ${isMe ? 'rgba(168,85,247,0.25)' : 'var(--c-border)'}`,
                                        }}>
                                            <span style={{ fontWeight: isMe ? 700 : 500, fontSize: '0.875rem' }}>
                                                {r.username?.split('_')[0] || r.username} {isMe ? '(You)' : ''}
                                            </span>
                                            <span style={{ color: r.correct ? 'var(--c-green)' : 'var(--c-red)', fontWeight: 700, fontSize: '0.85rem' }}>
                                                {r.correct ? `✅ +${r.points}` : (r.answered ? '❌' : '⏳')}
                                                <span style={{ color: 'var(--c-text-dim)', marginLeft: 8 }}>[{r.totalScore} pts]</span>
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            <p style={{ textAlign: 'center', color: 'var(--c-text-dim)', fontSize: '0.8rem' }}>
                                Next question coming up...
                            </p>
                        </div>
                    )}

                    {/* Scoreboard */}
                    {Object.keys(scores).length > 0 && (
                        <div style={{
                            marginTop: 'var(--sp-6)', padding: 'var(--sp-4) var(--sp-5)',
                            background: 'var(--c-surface)', borderRadius: 'var(--r-lg)',
                            border: '1px solid var(--c-border)',
                        }}>
                            <div className="section-label" style={{ marginBottom: 'var(--sp-3)' }}>🏆 Scores</div>
                            {Object.entries(scores).sort((a, b) => b[1] - a[1]).map(([id, score], i) => (
                                <div key={id} style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    padding: 'var(--sp-2) 0', fontSize: '0.875rem',
                                    color: id === playerId ? '#a855f7' : 'var(--c-text-dim)',
                                    fontWeight: id === playerId ? 700 : 400,
                                    borderBottom: i < Object.keys(scores).length - 1 ? '1px solid var(--c-border)' : 'none',
                                }}>
                                    <span>#{i + 1} {getName(id)} {id === playerId ? '⭐' : ''}</span>
                                    <span style={{ fontFamily: 'var(--f-mono)' }}>{score} pts</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Waiting state */}
                    {!question && Object.keys(scores).length === 0 && (
                        <div style={{ textAlign: 'center', color: 'var(--c-text-dim)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: 'var(--sp-4)' }}>🧠</div>
                            <p>Waiting for first question...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
