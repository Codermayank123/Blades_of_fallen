import { useState, useEffect, useRef } from 'react';

const TYPE_COLORS = { caesar: '#F59E0B', binary: '#06B6D4', morse: '#10B981', hex: '#A855F7' };
const TYPE_ICONS = { caesar: '🔑', binary: '💻', morse: '📡', hex: '🔢' };

export default function CipherClashScreen({ playerId, gameState, onLeave }) {
  const [round, setRound] = useState(null);
  const [puzzle, setPuzzle] = useState(null);
  const [scores, setScores] = useState([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [roundEnd, setRoundEnd] = useState(null);
  const [showTutorial, setShowTutorial] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const inputRef = useRef(null);
  const send = gameState?.send;

  useEffect(() => {
    if (!gameState?.lastMessage) return;
    const msg = gameState.lastMessage;
    if (msg.type === 'ROUND_START') {
      setRound(msg.round); setPuzzle(msg.puzzle); setTimeLeft(msg.timeLimit || 30);
      setAnswer(''); setSubmitted(false); setResult(null); setRoundEnd(null);
      startTimeRef.current = Date.now();
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setTimeLeft(Math.max(0, (msg.timeLimit || 30) - Math.floor(elapsed)));
      }, 200);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (msg.type === 'ANSWER_RESULT') setResult(msg);
    if (msg.type === 'ROUND_END') { clearInterval(timerRef.current); setRoundEnd(msg); if (msg.scores) setScores(msg.scores); }
    if (msg.type === 'GAME_OVER') { setGameOver(true); clearInterval(timerRef.current); }
  }, [gameState?.lastMessage]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (submitted || !answer.trim()) return;
    setSubmitted(true);
    send?.({ type: 'GAME_ACTION', action: 'DECODE', answer: answer.trim(), timeElapsed: (Date.now() - startTimeRef.current) / 1000 });
  };

  if (showTutorial) {
    return (
      <div className="screen fade-in" style={{ padding: 20, background: '#0A0E1A' }}>
        <div className="glass-card" style={{ maxWidth: 600, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
          <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '2rem', color: '#F59E0B', marginBottom: 8 }}>CIPHER CLASH</h1>
          <p style={{ color: '#94A3B8', marginBottom: 24, lineHeight: 1.7 }}>
            Each round shows an <strong style={{ color: '#00D4FF' }}>encrypted message</strong>.<br/>
            Decode it and type the answer before time runs out.<br/>
            Faster solves earn <strong style={{ color: '#F59E0B' }}>massive speed bonuses</strong>!
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
            {Object.entries(TYPE_ICONS).map(([k, icon]) => (
              <div key={k} style={{ padding: 10, borderRadius: 10, background: `${TYPE_COLORS[k]}10`, border: `1px solid ${TYPE_COLORS[k]}30`, color: TYPE_COLORS[k], fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>{icon} {k}</div>
            ))}
          </div>
          <button className="btn-neon" onClick={() => { setShowTutorial(false); send?.({ type: 'ARENA_READY' }); }}>CRACK THE CODE</button>
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="screen fade-in" style={{ padding: 20, background: '#0A0E1A' }}>
        <div className="glass-card" style={{ maxWidth: 500, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
          <h2 style={{ fontFamily: 'Rajdhani, sans-serif', color: '#F59E0B', marginBottom: 24 }}>MATCH COMPLETE</h2>
          {scores.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderRadius: 8, background: s.id === playerId ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${s.id === playerId ? '#F59E0B40' : 'rgba(255,255,255,0.06)'}`, marginBottom: 8 }}>
              <span style={{ color: i === 0 ? '#F59E0B' : '#E2E8F0', fontWeight: 700 }}>#{i+1} {s.username}</span>
              <span style={{ fontFamily: 'Rajdhani, sans-serif', color: '#F59E0B', fontWeight: 700 }}>{s.score}</span>
            </div>
          ))}
          <button className="btn-neon" onClick={onLeave} style={{ marginTop: 24 }}>BACK TO LOBBY</button>
        </div>
      </div>
    );
  }

  const cipherColor = puzzle?.type ? TYPE_COLORS[puzzle.type] : '#F59E0B';

  return (
    <div className="screen fade-in" style={{ padding: 16, paddingTop: 20, background: '#0A0E1A', justifyContent: 'flex-start' }}>
      <div style={{ maxWidth: 700, width: '100%', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.5rem' }}>🔐</span>
            <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: '#F59E0B', fontSize: '1.1rem' }}>ROUND {round || '-'}</span>
            {puzzle?.type && <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: '0.65rem', fontWeight: 800, background: `${cipherColor}15`, color: cipherColor, border: `1px solid ${cipherColor}40`, textTransform: 'uppercase' }}>{TYPE_ICONS[puzzle.type]} {puzzle.type}</span>}
          </div>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: timeLeft <= 5 ? '#EF4444' : cipherColor, animation: timeLeft <= 5 ? 'pulse 0.5s infinite' : 'none' }}>{timeLeft}s</div>
        </div>

        {/* Encoded Message */}
        {puzzle && (
          <div className="glass-card" style={{ padding: 24, marginBottom: 20, textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginBottom: 12, letterSpacing: 2, textTransform: 'uppercase' }}>Encrypted Message</div>
            <div style={{ fontFamily: '"Fira Code", monospace', fontSize: 'clamp(1rem, 3vw, 1.6rem)', fontWeight: 700, color: cipherColor, letterSpacing: puzzle.type === 'binary' ? '2px' : '4px', wordBreak: 'break-all', lineHeight: 1.8, textShadow: `0 0 20px ${cipherColor}40`, padding: '16px 0' }}>
              {puzzle.encoded}
            </div>
            {puzzle.hint && <div style={{ fontSize: '0.75rem', color: '#F59E0B', marginTop: 8 }}>💡 {puzzle.hint}</div>}
          </div>
        )}

        {/* Answer Input */}
        <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input ref={inputRef} type="text" value={answer} onChange={e => setAnswer(e.target.value.toUpperCase())} disabled={submitted}
              placeholder="TYPE YOUR DECODED ANSWER..." autoComplete="off"
              style={{ flex: 1, padding: '14px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: `2px solid ${submitted ? (result?.correct ? '#10B981' : '#EF4444') : cipherColor + '40'}`, color: '#E2E8F0', fontSize: '1rem', fontFamily: '"Fira Code", monospace', letterSpacing: 2, outline: 'none', transition: 'all 0.3s' }} />
            <button type="submit" disabled={submitted || !answer.trim()} className="btn-neon"
              style={{ padding: '14px 24px', opacity: submitted ? 0.5 : 1 }}>DECODE</button>
          </div>
        </form>

        {/* Result */}
        {result && (
          <div style={{ padding: 14, borderRadius: 10, background: result.correct ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${result.correct ? '#10B98140' : '#EF444440'}`, textAlign: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 700, color: result.correct ? '#10B981' : '#EF4444', fontSize: '1rem' }}>
              {result.correct ? `✓ Decoded! +${result.points}pts` : '✗ Wrong decode'} {result.firstCorrect && '🥇 First!'}
            </span>
          </div>
        )}

        {/* Round End - show correct answer */}
        {roundEnd && (
          <div style={{ padding: 14, borderRadius: 10, background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)', textAlign: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Answer: </span>
            <span style={{ fontFamily: '"Fira Code", monospace', color: '#00D4FF', fontWeight: 700, letterSpacing: 2 }}>{roundEnd.decoded}</span>
          </div>
        )}

        {/* Scoreboard */}
        {scores.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {scores.slice(0, 4).map((s, i) => (
              <div key={s.id} style={{ flex: 1, minWidth: 100, padding: '8px 12px', borderRadius: 8, background: s.id === playerId ? `${cipherColor}10` : 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem', color: '#94A3B8' }}>{s.username}</div>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: i === 0 ? '#F59E0B' : '#E2E8F0' }}>{s.score}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
