import { useState, useEffect, useRef, useCallback } from 'react';

const CATEGORY_META = {
  movies: { label: 'Movies', icon: '🎬', color: '#FF6B6B' },
  songs: { label: 'Songs', icon: '🎵', color: '#FFDD00' },
  proverbs: { label: 'Proverbs', icon: '📜', color: '#00D4FF' },
  coding: { label: 'Coding Jokes', icon: '👨‍💻', color: '#00FF88' },
  tech: { label: 'Tech Brands', icon: '💡', color: '#A78BFA' },
};

function ConfettiBurst() {
  const colors = ['#FF6B6B', '#FFDD00', '#00FF88', '#00D4FF', '#FF69B4', '#A78BFA'];
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100, overflow: 'hidden' }}>
      {Array.from({ length: 30 }, (_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${Math.random() * 100}%`,
          top: '-10px',
          width: `${6 + Math.random() * 8}px`,
          height: `${6 + Math.random() * 8}px`,
          background: colors[i % colors.length],
          borderRadius: Math.random() > 0.5 ? '50%' : 0,
          animation: `float-up ${0.8 + Math.random() * 1.2}s ease-out forwards`,
          animationDelay: `${Math.random() * 0.4}s`,
        }} />
      ))}
    </div>
  );
}

function StealAlert() {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(255,107,107,0.15)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, pointerEvents: 'none',
      animation: 'fadeIn 0.1s ease, neonFlicker 0.5s ease 0.1s',
    }}>
      <div style={{ background: 'rgba(255,107,107,0.9)', padding: '16px 32px', borderRadius: 16, fontFamily: 'var(--f-heading)', fontSize: '2rem', color: '#fff', fontWeight: 900, letterSpacing: 3, textShadow: '0 0 30px rgba(255,107,107,0.8)' }}>
        🔥 STEAL THE POINT!
      </div>
    </div>
  );
}

export default function EmojiEscapeScreen({ playerId, gameState, onLeave }) {
  const [round, setRound] = useState(null);
  const [puzzle, setPuzzle] = useState(null);
  const [serverHint, setServerHint] = useState(null);
  const [scores, setScores] = useState([]);
  const [timeLeft, setTimeLeft] = useState(25);
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [roundEnd, setRoundEnd] = useState(null);
  const [hintVisible, setHintVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSteal, setShowSteal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const inputRef = useRef(null);
  const send = gameState?.send;

  const showStealEffect = useCallback(() => {
    setShowSteal(true);
    setTimeout(() => setShowSteal(false), 1500);
  }, []);

  useEffect(() => {
    if (!gameState?.lastMessage) return;
    const msg = gameState.lastMessage;
    if (msg.type === 'ROUND_START') {
      setRound(msg.round);
      setPuzzle(msg.question || msg.puzzle);
      setServerHint(null);
      setTimeLeft(msg.timeLimit || 25);
      setAnswer('');
      setSubmitted(false);
      setResult(null);
      setRoundEnd(null);
      setHintVisible(false);
      setShowConfetti(false);
      startTimeRef.current = Date.now();
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const remaining = Math.max(0, (msg.timeLimit || 25) - Math.floor(elapsed));
        setTimeLeft(remaining);
        if (remaining <= 10) setHintVisible(true);
      }, 200);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (msg.type === 'ROUND_HINT') {
      setServerHint(msg.hint || null);
      setHintVisible(true);
    }
    if (msg.type === 'ANSWER_RESULT') {
      setResult(msg);
      if (msg.correct) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
      }
      if (msg.canSteal) showStealEffect();
    }
    if (msg.type === 'ROUND_END') {
      clearInterval(timerRef.current);
      setRoundEnd(msg);
      if (msg.scores) setScores(msg.scores);
    }
    if (msg.type === 'GAME_OVER') { setGameOver(true); clearInterval(timerRef.current); }
  }, [gameState?.lastMessage, showStealEffect]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const handleSubmit = () => {
    if (submitted || !answer.trim()) return;
    setSubmitted(true);
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    send?.({ type: 'GAME_ACTION', action: 'ANSWER', answer: answer.trim(), timeElapsed: elapsed });
  };

  const handleReady = () => { setShowTutorial(false); send?.({ type: 'ARENA_READY' }); };

  if (showTutorial) {
    return (
      <div className="screen fade-in" style={{ background: '#0A0E1A', padding: 20 }}>
        <div className="glass-card" style={{ maxWidth: 600, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16, animation: 'pulse 2s ease-in-out infinite' }}>😂</div>
          <h1 style={{ fontFamily: 'var(--f-heading)', fontSize: '2rem', color: '#FFDD00', marginBottom: 8, letterSpacing: 3 }}>EMOJI ESCAPE</h1>
          <p style={{ color: 'var(--c-text-dim)', marginBottom: 24, lineHeight: 1.8 }}>
            A sequence of emojis tells a story.<br />
            <strong style={{ color: '#FFDD00' }}>Type the correct answer — fastest wins!</strong><br />
            ⚠️ Wrong answers add a <strong>5s penalty</strong>. Opponent wrong? Steal the point!
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
            {Object.values(CATEGORY_META).map(c => (
              <span key={c.label} style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', background: `${c.color}15`, color: c.color, border: `1px solid ${c.color}30` }}>{c.icon} {c.label}</span>
            ))}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--c-text-off)', marginBottom: 24 }}>6 rounds · 25s each</div>
          <button className="btn-neon" onClick={handleReady} style={{ borderColor: '#FFDD00', color: '#FFDD00' }}>DECODE & WIN!</button>
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="screen fade-in" style={{ padding: 20, background: '#0A0E1A' }}>
        <div className="glass-card" style={{ maxWidth: 500, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontFamily: 'var(--f-heading)', color: '#FFDD00', marginBottom: 24, letterSpacing: 2 }}>ESCAPED!</h2>
          {scores.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderRadius: 8, background: s.id === playerId ? 'rgba(255,221,0,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${s.id === playerId ? '#FFDD0040' : 'rgba(255,255,255,0.06)'}`, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${['#FFD700','#C0C0C0','#CD7F32','#A78BFA'][i] || '#555'}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: ['#FFD700','#C0C0C0','#CD7F32','#A78BFA'][i] || '#555', fontWeight: 800 }}>{i + 1}</div>
                <span style={{ fontWeight: 700, color: i === 0 ? '#FFD700' : 'var(--c-text)' }}>{s.username}</span>
              </div>
              <span style={{ fontFamily: 'var(--f-mono)', color: '#FFDD00', fontWeight: 700 }}>{s.score}</span>
            </div>
          ))}
          <button className="btn-neon" onClick={onLeave} style={{ marginTop: 24, borderColor: '#FFDD00', color: '#FFDD00' }}>BACK TO LOBBY</button>
        </div>
      </div>
    );
  }

  const category = puzzle?.category || 'movies';
  const catMeta = CATEGORY_META[category] || CATEGORY_META.movies;
  const timerPct = (timeLeft / 25) * 100;

  return (
    <div className="screen fade-in" style={{ padding: 16, paddingTop: 24, background: '#0A0E1A', justifyContent: 'flex-start' }}>
      {showConfetti && <ConfettiBurst />}
      {showSteal && <StealAlert />}

      <div style={{ maxWidth: 700, width: '100%', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.3rem' }}>😂</span>
            <span style={{ fontFamily: 'var(--f-mono)', fontWeight: 700, color: '#FFDD00' }}>EMOJI ESCAPE · R{round || '-'}</span>
            <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 700, background: `${catMeta.color}15`, color: catMeta.color, border: `1px solid ${catMeta.color}30` }}>
              {catMeta.icon} {catMeta.label}
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
            <div style={{ width: 80, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${timerPct}%`, background: timeLeft <= 8 ? '#FF6B6B' : '#FFDD00', transition: 'width 0.2s linear, background 0.3s', borderRadius: 3 }} />
            </div>
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: '1.5rem', fontWeight: 800, color: timeLeft <= 8 ? '#FF6B6B' : '#FFDD00', minWidth: 36, textAlign: 'right' }}>{timeLeft}s</div>
          </div>
        </div>

        {/* Emoji Display */}
        <div className="glass-card" style={{ padding: 'var(--sp-8)', textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: '4rem', letterSpacing: 8, marginBottom: 12, lineHeight: 1.3, animation: 'scaleIn 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
            {puzzle?.emojis || '🤔 🎮 ❓'}
          </div>
          {hintVisible && serverHint && (
            <div style={{ padding: '8px 16px', background: 'rgba(255,221,0,0.08)', border: '1px solid rgba(255,221,0,0.2)', borderRadius: 8, fontSize: '0.8rem', color: '#FFDD00', animation: 'fadeIn 0.4s ease' }}>
              💡 Hint: {serverHint}
            </div>
          )}
        </div>

        {/* Answer Input */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              ref={inputRef}
              className="input2"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Type your answer..."
              disabled={submitted}
              style={{ paddingLeft: 40, fontSize: '1rem', fontWeight: 600, borderColor: submitted ? (result?.correct ? '#00FF88' : '#FF6B6B') : 'rgba(255,221,0,0.25)', background: 'rgba(255,221,0,0.04)', transition: 'border-color 0.3s' }}
            />
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '1.1rem' }}>💬</span>
          </div>
          <button className="btn2 btn2--primary" onClick={handleSubmit} disabled={submitted || !answer.trim()}
            style={{ background: 'linear-gradient(135deg, #FFDD00, #FF8C00)', border: 'none', color: '#000', fontWeight: 800, letterSpacing: 1, minWidth: 80 }}>
            GO!
          </button>
        </div>

        {/* Result */}
        {result && (
          <div style={{ padding: 12, borderRadius: 10, background: result.correct ? 'rgba(0,255,136,0.08)' : 'rgba(255,107,107,0.08)', border: `1px solid ${result.correct ? '#00FF8840' : '#FF6B6B40'}`, textAlign: 'center', marginBottom: 16 }}>
            <span style={{ fontWeight: 700, color: result.correct ? '#00FF88' : '#FF6B6B', fontSize: '0.95rem' }}>
              {result.correct ? `🎉 Correct! +${result.points}pts` : `❌ Wrong! -5s penalty`}
            </span>
            {roundEnd?.answer && <div style={{ marginTop: 6, fontSize: '0.8rem', color: 'var(--c-text-dim)' }}>Answer: <strong style={{ color: 'var(--c-text)' }}>{roundEnd.answer}</strong></div>}
          </div>
        )}

        {/* Live Scores */}
        {scores.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {scores.map((s, i) => (
              <div key={s.id} style={{ flex: 1, minWidth: 100, padding: '8px 12px', borderRadius: 10, background: s.id === playerId ? 'rgba(255,221,0,0.07)' : 'rgba(255,255,255,0.02)', border: `1px solid ${s.id === playerId ? '#FFDD0030' : 'rgba(255,255,255,0.05)'}`, textAlign: 'center', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--c-surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: i === 0 ? '#FFD700' : 'var(--c-text-dim)' }}>{s.username?.slice(0, 2).toUpperCase()}</div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--c-text)' }}>{s.username}</div>
                  <div style={{ fontFamily: 'var(--f-mono)', fontWeight: 800, color: '#FFDD00', fontSize: '0.85rem' }}>{s.score}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
