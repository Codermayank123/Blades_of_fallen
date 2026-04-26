import { useState, useEffect, useRef } from 'react';

const CAT_COLORS = { sorting: '#06B6D4', trees: '#10B981', dp: '#F59E0B', graphs: '#EF4444' };
const CAT_ICONS = { sorting: '📊', trees: '🌲', dp: '🧮', graphs: '🕸️' };

export default function AlgorithmArenaScreen({ playerId, gameState, onLeave }) {
  const [round, setRound] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [scores, setScores] = useState([]);
  const [timeLeft, setTimeLeft] = useState(45);
  const [answered, setAnswered] = useState(false);
  const [result, setResult] = useState(null);
  const [roundEnd, setRoundEnd] = useState(null);
  const [showTutorial, setShowTutorial] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const send = gameState?.send;

  useEffect(() => {
    if (!gameState?.lastMessage) return;
    const msg = gameState.lastMessage;
    if (msg.type === 'ROUND_START') {
      setRound(msg.round); setChallenge(msg.challenge); setTimeLeft(msg.timeLimit || 45);
      setAnswered(false); setResult(null); setRoundEnd(null);
      startTimeRef.current = Date.now();
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setTimeLeft(Math.max(0, (msg.timeLimit || 45) - Math.floor(elapsed)));
      }, 200);
    }
    if (msg.type === 'ANSWER_RESULT') setResult(msg);
    if (msg.type === 'ROUND_END') { clearInterval(timerRef.current); setRoundEnd(msg); if (msg.scores) setScores(msg.scores); }
    if (msg.type === 'GAME_OVER') { setGameOver(true); clearInterval(timerRef.current); }
  }, [gameState?.lastMessage]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const handleAnswer = (optionId) => {
    if (answered) return;
    setAnswered(true);
    send?.({ type: 'GAME_ACTION', action: 'ANSWER', answerId: optionId, timeElapsed: (Date.now() - startTimeRef.current) / 1000 });
  };

  if (showTutorial) {
    return (
      <div className="screen fade-in" style={{ padding: 20, background: '#0A0E1A' }}>
        <div className="glass-card" style={{ maxWidth: 600, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
          <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '2rem', color: '#06B6D4', marginBottom: 8 }}>ALGORITHM ARENA</h1>
          <p style={{ color: '#94A3B8', marginBottom: 24, lineHeight: 1.7 }}>
            You'll see slow, unoptimized code each round.<br/>
            Pick the <strong style={{ color: '#00D4FF' }}>best optimization</strong> with the lowest complexity.<br/>
            Categories: <strong style={{ color: '#10B981' }}>Sorting</strong>, <strong style={{ color: '#F59E0B' }}>Trees</strong>, <strong style={{ color: '#EF4444' }}>DP</strong>, <strong style={{ color: '#06B6D4' }}>Graphs</strong>
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
            {Object.entries(CAT_ICONS).map(([k, icon]) => (
              <div key={k} style={{ padding: 10, borderRadius: 10, background: `${CAT_COLORS[k]}10`, border: `1px solid ${CAT_COLORS[k]}30`, color: CAT_COLORS[k], fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>{icon} {k}</div>
            ))}
          </div>
          <button className="btn-neon" onClick={() => { setShowTutorial(false); send?.({ type: 'ARENA_READY' }); }}>ENTER ARENA</button>
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="screen fade-in" style={{ padding: 20, background: '#0A0E1A' }}>
        <div className="glass-card" style={{ maxWidth: 500, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
          <h2 style={{ fontFamily: 'Rajdhani, sans-serif', color: '#06B6D4', marginBottom: 24 }}>MATCH COMPLETE</h2>
          {scores.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderRadius: 8, background: s.id === playerId ? 'rgba(6,182,212,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${s.id === playerId ? '#06B6D440' : 'rgba(255,255,255,0.06)'}`, marginBottom: 8 }}>
              <span style={{ color: i === 0 ? '#F59E0B' : '#E2E8F0', fontWeight: 700 }}>#{i+1} {s.username}</span>
              <span style={{ fontFamily: 'Rajdhani, sans-serif', color: '#06B6D4', fontWeight: 700 }}>{s.score}</span>
            </div>
          ))}
          <button className="btn-neon" onClick={onLeave} style={{ marginTop: 24 }}>BACK TO LOBBY</button>
        </div>
      </div>
    );
  }

  const catColor = challenge?.category ? CAT_COLORS[challenge.category] : '#06B6D4';

  return (
    <div className="screen fade-in" style={{ padding: 16, paddingTop: 20, background: '#0A0E1A', justifyContent: 'flex-start' }}>
      <div style={{ maxWidth: 800, width: '100%', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.5rem' }}>⚡</span>
            <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: '#06B6D4', fontSize: '1.1rem' }}>ROUND {round || '-'}</span>
            {challenge?.category && <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: '0.65rem', fontWeight: 800, background: `${catColor}15`, color: catColor, border: `1px solid ${catColor}40`, textTransform: 'uppercase' }}>{CAT_ICONS[challenge.category]} {challenge.category}</span>}
          </div>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: timeLeft <= 10 ? '#EF4444' : '#06B6D4' }}>{timeLeft}s</div>
        </div>

        {challenge && (
          <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#E2E8F0', marginBottom: 8 }}>{challenge.title}</div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: 12 }}>{challenge.problem}</div>
            <pre style={{ background: '#0D1117', padding: 16, borderRadius: 10, border: `1px solid ${catColor}20`, overflowX: 'auto', fontSize: '0.82rem', lineHeight: 1.6, color: '#E6EDF3', fontFamily: '"Fira Code", monospace', margin: 0 }}>{challenge.slowCode}</pre>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {challenge?.options?.map(opt => {
            let bg = 'rgba(255,255,255,0.03)', border = 'rgba(255,255,255,0.08)';
            if (roundEnd && opt.id === roundEnd.correctAnswerId) { bg = 'rgba(16,185,129,0.15)'; border = '#10B981'; }
            return (
              <button key={opt.id} onClick={() => handleAnswer(opt.id)} disabled={answered}
                style={{ padding: '14px 20px', borderRadius: 12, background: bg, border: `1.5px solid ${border}`, color: '#E2E8F0', textAlign: 'left', cursor: answered ? 'default' : 'pointer', fontSize: '0.85rem', transition: 'all 0.2s' }}>
                <div style={{ fontWeight: 600 }}>{opt.label}</div>
                <div style={{ fontSize: '0.7rem', color: catColor, fontFamily: 'Rajdhani, sans-serif', marginTop: 4 }}>Complexity: {opt.complexity}</div>
              </button>
            );
          })}
        </div>

        {result && (
          <div style={{ padding: 12, borderRadius: 10, background: result.correct ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${result.correct ? '#10B98140' : '#EF444440'}`, textAlign: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 700, color: result.correct ? '#10B981' : '#EF4444' }}>
              {result.correct ? `✓ Optimal! +${result.points}pts` : '✗ Not optimal'} {result.firstCorrect && '🥇'}
            </span>
            {result.explanation && <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 4 }}>{result.explanation}</div>}
          </div>
        )}

        {scores.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {scores.slice(0, 4).map((s, i) => (
              <div key={s.id} style={{ flex: 1, minWidth: 100, padding: '8px 12px', borderRadius: 8, background: s.id === playerId ? 'rgba(6,182,212,0.08)' : 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
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
