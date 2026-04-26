import { useState, useEffect, useRef } from 'react';

function ScoreCounter({ count, animate }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!animate) { setDisplay(count); return; }
    let start = 0;
    const step = Math.ceil(count / 20) || 1;
    const iv = setInterval(() => {
      start = Math.min(start + step, count);
      setDisplay(start);
      if (start >= count) clearInterval(iv);
    }, 40);
    return () => clearInterval(iv);
  }, [count, animate]);
  return <span>{display}</span>;
}

export default function MemeWarsScreen({ playerId, gameState, onLeave }) {
  const [round, setRound] = useState(null);
  const [template, setTemplate] = useState(null);
  const [phase, setPhase] = useState('caption'); // 'caption' | 'judging' | 'results'
  const [caption, setCaption] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [scores, setScores] = useState([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [showTutorial, setShowTutorial] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const send = gameState?.send;

  useEffect(() => {
    if (!gameState?.lastMessage) return;
    const msg = gameState.lastMessage;

    if (msg.type === 'ROUND_START') {
      setRound(msg.round);
      setTemplate(msg.meme);
      setPhase('caption');
      setCaption('');
      setSubmitted(false);
      setResults(null);
      const tl = msg.timeLimit || 30;
      setTimeLeft(tl);
      startTimeRef.current = Date.now();
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setTimeLeft(Math.max(0, tl - Math.floor(elapsed)));
      }, 200);
    }

    if (msg.type === 'AI_JUDGING') {
      clearInterval(timerRef.current);
      setPhase('judging');
    }

    if (msg.type === 'ROUND_END') {
      clearInterval(timerRef.current);
      setPhase('results');
      setResults(msg);
      if (msg.scores) setScores(msg.scores);
    }

    if (msg.type === 'GAME_OVER') { setGameOver(true); clearInterval(timerRef.current); }
  }, [gameState?.lastMessage]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const handleSubmitCaption = () => {
    if (submitted || !caption.trim()) return;
    setSubmitted(true);
    send?.({ type: 'GAME_ACTION', action: 'CAPTION', caption: caption.trim() });
  };

  const handleReady = () => { setShowTutorial(false); send?.({ type: 'ARENA_READY' }); };

  /* ─── Tutorial Screen ──────────────────────── */
  if (showTutorial) {
    return (
      <div className="screen fade-in" style={{ background: '#0A0E1A', padding: 20 }}>
        <div className="glass-card" style={{ maxWidth: 620, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🏆</div>
          <h1 style={{ fontFamily: 'var(--f-heading)', fontSize: '2rem', color: '#FF69B4', marginBottom: 8, letterSpacing: 3 }}>MEME WARS</h1>
          <p style={{ color: 'var(--c-text-dim)', marginBottom: 24, lineHeight: 1.9 }}>
            A fun prompt is revealed. Write the funniest caption in <strong style={{ color: '#FFDD00' }}>30s</strong>.<br />
            An <strong style={{ color: '#00D4FF' }}>AI Judge</strong> scores all captions for humor, creativity &amp; relevance.<br />
            <strong style={{ color: '#FF69B4' }}>Top captions win the most points!</strong>
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
            {['✏️ Write Caption (30s)', '🤖 AI Judges', '🏆 Results + Scores'].map((s, i) => (
              <div key={i} style={{ padding: 12, borderRadius: 10, background: 'rgba(255,105,180,0.08)', border: '1px solid rgba(255,105,180,0.2)', fontSize: '0.75rem', color: '#FF69B4', fontWeight: 600 }}>{s}</div>
            ))}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--c-text-off)', marginBottom: 24 }}>4 rounds · AI-powered fair judging · No self-voting bias</div>
          <button className="btn-neon" onClick={handleReady} style={{ borderColor: '#FF69B4', color: '#FF69B4' }}>LET THE WARS BEGIN!</button>
        </div>
      </div>
    );
  }

  /* ─── Game Over Screen ──────────────────────── */
  if (gameOver) {
    return (
      <div className="screen fade-in" style={{ padding: 20, background: '#0A0E1A' }}>
        <div className="glass-card" style={{ maxWidth: 500, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
          <h2 style={{ fontFamily: 'var(--f-heading)', color: '#FF69B4', marginBottom: 24, letterSpacing: 2 }}>MEME LORD!</h2>
          {scores.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderRadius: 8, background: s.id === playerId ? 'rgba(255,105,180,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${s.id === playerId ? '#FF69B440' : 'rgba(255,255,255,0.06)'}`, marginBottom: 8 }}>
              <span style={{ color: i === 0 ? '#FFD700' : 'var(--c-text)', fontWeight: 700 }}>#{i + 1} {s.username}</span>
              <span style={{ fontFamily: 'var(--f-mono)', color: '#FF69B4', fontWeight: 700 }}>{s.score}</span>
            </div>
          ))}
          <button className="btn-neon" onClick={onLeave} style={{ marginTop: 24, borderColor: '#FF69B4', color: '#FF69B4' }}>BACK TO LOBBY</button>
        </div>
      </div>
    );
  }

  /* ─── Main Game UI ──────────────────────── */
  return (
    <div className="screen fade-in" style={{ padding: 16, paddingTop: 20, background: '#0A0E1A', justifyContent: 'flex-start' }}>
      <div style={{ maxWidth: 760, width: '100%', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.3rem' }}>🏆</span>
            <span style={{ fontFamily: 'var(--f-mono)', fontWeight: 700, color: '#FF69B4', fontSize: '0.95rem' }}>MEME WARS · R{round || '-'}</span>
            <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: '0.65rem', fontWeight: 700, background: phase === 'caption' ? 'rgba(255,221,0,0.12)' : phase === 'judging' ? 'rgba(0,212,255,0.12)' : 'rgba(255,105,180,0.12)', color: phase === 'caption' ? '#FFDD00' : phase === 'judging' ? '#00D4FF' : '#FF69B4', border: `1px solid ${phase === 'caption' ? '#FFDD0030' : phase === 'judging' ? '#00D4FF30' : '#FF69B430'}` }}>
              {phase === 'caption' ? '✏️ CAPTIONING' : phase === 'judging' ? '🤖 AI JUDGING' : '🏆 RESULTS'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              className="btn2 btn2--ghost"
              onClick={() => { send?.({ type: 'LEAVE_ROOM' }); onLeave?.(); }}
              style={{ padding: '6px 10px', fontSize: '0.7rem', borderRadius: 999 }}
            >
              Exit
            </button>
            {phase === 'caption' && (
              <div style={{ fontFamily: 'var(--f-mono)', fontSize: '1.5rem', fontWeight: 800, color: timeLeft <= 8 ? '#FF6B6B' : '#FF69B4' }}>{timeLeft}s</div>
            )}
          </div>
        </div>

        {/* Meme Template Frame */}
        <div style={{ marginBottom: 20, textAlign: 'center' }}>
          <div style={{
            display: 'inline-block', padding: '24px 32px 20px',
            background: '#fff', borderRadius: 4,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
            position: 'relative',
          }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 8 }}>{template?.emoji || '📸'}</div>
            <div style={{ fontFamily: 'Impact, "Arial Black", sans-serif', fontSize: '0.9rem', color: '#000', letterSpacing: 2, textTransform: 'uppercase', maxWidth: 300, lineHeight: 1.4 }}>
              {template?.name || 'MEME TEMPLATE'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#555', marginTop: 6 }}>{template?.description || 'Loading template...'}</div>
            {template?.prompt && (
              <div style={{ fontSize: '0.8rem', color: '#FF1493', marginTop: 8, fontWeight: 700, fontStyle: 'italic' }}>
                💬 {template.prompt}
              </div>
            )}
          </div>
        </div>

        {/* Caption Phase */}
        {phase === 'caption' && (
          <div className="glass-card" style={{ padding: 24, marginBottom: 16 }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--c-text-off)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 2 }}>YOUR CAPTION</div>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              disabled={submitted}
              maxLength={120}
              placeholder="Write the funniest caption you can think of..."
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 10,
                background: 'rgba(0,0,0,0.5)', border: '1.5px solid rgba(255,105,180,0.2)',
                color: '#fff', fontFamily: 'Impact, "Arial Black", sans-serif',
                fontSize: '1.1rem', letterSpacing: 0.5,
                resize: 'none', height: 80, outline: 'none',
                transition: 'border-color 0.3s',
              }}
              onFocus={e => e.target.style.borderColor = '#FF69B480'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,105,180,0.2)'}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--c-text-off)' }}>{caption.length}/120</span>
              <button className="btn2 btn2--primary" onClick={handleSubmitCaption} disabled={submitted || !caption.trim()}
                style={{ background: 'linear-gradient(135deg, #FF69B4, #FF1493)', border: 'none', fontWeight: 700, padding: '10px 24px' }}>
                {submitted ? '✓ Submitted!' : '📤 Submit Caption'}
              </button>
            </div>
            {submitted && (
              <div style={{ marginTop: 10, textAlign: 'center', color: '#00FF88', fontSize: '0.8rem', fontWeight: 600 }}>
                🎭 Caption locked in! AI Judge will score it soon...
              </div>
            )}
          </div>
        )}

        {/* AI Judging Phase */}
        {phase === 'judging' && (
          <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{
              fontSize: '3rem', marginBottom: 16,
              animation: 'pulse-dot 1.5s ease-in-out infinite',
            }}>🤖</div>
            <h3 style={{ fontFamily: 'var(--f-mono)', color: '#00D4FF', fontSize: '1rem', letterSpacing: 2, marginBottom: 8 }}>
              AI JUDGE IS EVALUATING...
            </h3>
            <p style={{ color: 'var(--c-text-off)', fontSize: '0.8rem' }}>
              Scoring captions for humor, creativity &amp; relevance
            </p>
            <div style={{
              width: '200px', height: '4px', margin: '16px auto 0',
              background: 'rgba(0,212,255,0.15)', borderRadius: 2, overflow: 'hidden',
            }}>
              <div style={{
                width: '100%', height: '100%',
                background: 'linear-gradient(90deg, #00D4FF, #FF69B4, #00D4FF)',
                borderRadius: 2,
                animation: 'loading-shimmer 1.5s ease-in-out infinite',
              }} />
            </div>
            <style>{`
              @keyframes loading-shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
              }
            `}</style>
          </div>
        )}

        {/* Results Phase */}
        {phase === 'results' && results && (
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--c-text-off)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 2 }}>🤖 AI JUDGE RESULTS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {(results.results || []).map((cap, i) => (
                <div key={cap.id} style={{
                  padding: 20, borderRadius: 16,
                  background: i === 0 ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${i === 0 ? '#FFD70060' : 'rgba(255,255,255,0.06)'}`,
                  boxShadow: i === 0 ? '0 0 24px rgba(255,215,0,0.15)' : 'none',
                  animation: `slide-up 0.4s ease both`, animationDelay: `${i * 0.1}s`,
                  position: 'relative',
                }}>
                  {i === 0 && <div style={{ position: 'absolute', top: -10, right: 16, background: '#FFD700', color: '#000', fontSize: '0.65rem', fontWeight: 900, padding: '2px 10px', borderRadius: 20 }}>🏆 WINNER</div>}
                  <div style={{ fontFamily: 'Impact, "Arial Black", sans-serif', fontSize: '1.05rem', color: '#fff', marginBottom: 10 }}>{cap.caption || cap.text}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--c-text-dim)', fontWeight: 600 }}>by {cap.username || '???'}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {cap.aiComment && (
                        <span style={{ fontSize: '0.7rem', color: '#00D4FF', fontWeight: 600 }}>{cap.aiComment}</span>
                      )}
                      <span style={{ fontFamily: 'var(--f-mono)', color: '#FFD700', fontWeight: 700 }}>
                        🤖 <ScoreCounter count={cap.aiScore || 0} animate={i === 0} />/100
                      </span>
                      {cap.pointsAwarded > 0 && (
                        <span style={{ fontSize: '0.7rem', color: '#00FF88', fontWeight: 700 }}>+{cap.pointsAwarded}pts</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {scores.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {scores.map((s, i) => (
                  <div key={s.id} style={{ flex: 1, minWidth: 100, padding: '8px 12px', borderRadius: 10, background: s.id === playerId ? 'rgba(255,105,180,0.07)' : 'rgba(255,255,255,0.02)', border: `1px solid ${s.id === playerId ? '#FF69B430' : 'rgba(255,255,255,0.05)'}`, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--c-text-dim)' }}>{s.username}</div>
                    <div style={{ fontFamily: 'var(--f-mono)', fontWeight: 700, color: i === 0 ? '#FFD700' : 'var(--c-text)' }}>{s.score}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
