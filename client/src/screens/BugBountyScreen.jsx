import { useState, useEffect, useCallback, useRef } from 'react';

const DIFF_COLORS = { rookie: '#10B981', elite: '#F59E0B', legend: '#EF4444' };
const DIFF_LABELS = { rookie: 'ROOKIE', elite: 'ELITE', legend: 'LEGEND' };

export default function BugBountyScreen({ playerId, gameState, onLeave }) {
  const [round, setRound] = useState(null);
  const [question, setQuestion] = useState(null);
  const [scores, setScores] = useState([]);
  const [timeLeft, setTimeLeft] = useState(30);
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
      setRound(msg.round);
      setQuestion(msg.question);
      setTimeLeft(msg.timeLimit || 30);
      setAnswered(false);
      setResult(null);
      setRoundEnd(null);
      startTimeRef.current = Date.now();
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setTimeLeft(prev => Math.max(0, (msg.timeLimit || 30) - Math.floor(elapsed)));
      }, 200);
    }
    if (msg.type === 'ANSWER_RESULT') setResult(msg);
    if (msg.type === 'ROUND_END') {
      clearInterval(timerRef.current);
      setRoundEnd(msg);
      if (msg.scores) setScores(msg.scores);
    }
    if (msg.type === 'GAME_OVER') { setGameOver(true); clearInterval(timerRef.current); }
  }, [gameState?.lastMessage]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const handleAnswer = (optionId) => {
    if (answered) return;
    setAnswered(true);
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    send?.({ type: 'GAME_ACTION', action: 'ANSWER', answerId: optionId, timeElapsed: elapsed });
  };

  const handleReady = () => { setShowTutorial(false); send?.({ type: 'ARENA_READY' }); };

  if (showTutorial) {
    return (
      <div className="screen fade-in" style={{ padding: 20, background: '#0A0E1A' }}>
        <div className="glass-card" style={{ maxWidth: 600, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🐛</div>
          <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '2rem', color: '#EF4444', marginBottom: 8 }}>BUG BOUNTY HUNTER</h1>
          <p style={{ color: '#94A3B8', marginBottom: 24, lineHeight: 1.7 }}>
            Broken code appears each round. Find the bug and select the correct fix.<br/>
            <strong style={{ color: '#00D4FF' }}>Speed matters</strong> — faster answers earn bonus points.<br/>
            First correct answer gets <strong style={{ color: '#F59E0B' }}>2× bonus</strong>!
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
            {Object.entries(DIFF_LABELS).map(([k, v]) => (
              <div key={k} style={{ padding: 12, borderRadius: 12, background: `${DIFF_COLORS[k]}15`, border: `1px solid ${DIFF_COLORS[k]}40`, color: DIFF_COLORS[k], fontWeight: 700, fontSize: '0.8rem' }}>{v}</div>
            ))}
          </div>
          <button className="btn-neon" onClick={handleReady}>READY TO HUNT</button>
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="screen fade-in" style={{ padding: 20, background: '#0A0E1A' }}>
        <div className="glass-card" style={{ maxWidth: 500, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
          <h2 style={{ fontFamily: 'Rajdhani, sans-serif', color: '#00D4FF', marginBottom: 24 }}>MATCH COMPLETE</h2>
          {scores.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderRadius: 8, background: s.id === playerId ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${s.id === playerId ? '#00D4FF40' : 'rgba(255,255,255,0.06)'}`, marginBottom: 8 }}>
              <span style={{ color: i === 0 ? '#F59E0B' : '#E2E8F0', fontWeight: 700 }}>#{i+1} {s.username}</span>
              <span style={{ fontFamily: 'Rajdhani, sans-serif', color: '#00D4FF', fontWeight: 700 }}>{s.score}</span>
            </div>
          ))}
          <button className="btn-neon" onClick={onLeave} style={{ marginTop: 24 }}>BACK TO LOBBY</button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen fade-in" style={{ padding: 16, paddingTop: 20, background: '#0A0E1A', justifyContent: 'flex-start' }}>
      <div style={{ maxWidth: 800, width: '100%', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.5rem' }}>🐛</span>
            <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: '#EF4444', fontSize: '1.1rem' }}>ROUND {round || '-'}</span>
            {question?.difficulty && <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: '0.65rem', fontWeight: 800, background: `${DIFF_COLORS[question.difficulty]}20`, color: DIFF_COLORS[question.difficulty], border: `1px solid ${DIFF_COLORS[question.difficulty]}40` }}>{DIFF_LABELS[question.difficulty]}</span>}
          </div>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: timeLeft <= 5 ? '#EF4444' : '#00D4FF', textShadow: timeLeft <= 5 ? '0 0 20px #EF4444' : '0 0 20px #00D4FF40' }}>{timeLeft}s</div>
        </div>

        {/* Code Display */}
        {question && (
          <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 2 }}>{question.language} • {question.title}</div>
            <pre style={{ background: '#0D1117', padding: 16, borderRadius: 10, border: '1px solid rgba(0,212,255,0.15)', overflowX: 'auto', fontSize: '0.85rem', lineHeight: 1.6, color: '#E6EDF3', fontFamily: '"Fira Code", monospace', margin: 0 }}>{question.code}</pre>
            {question.hint && <div style={{ marginTop: 8, fontSize: '0.75rem', color: '#F59E0B' }}>💡 Hint: {question.hint}</div>}
          </div>
        )}

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {question?.options?.map(opt => {
            const isChosen = answered && result && result.correct !== undefined;
            const wasSelected = answered;
            let bg = 'rgba(255,255,255,0.03)';
            let border = 'rgba(255,255,255,0.08)';
            if (roundEnd && opt.id === roundEnd.correctAnswerId) { bg = 'rgba(16,185,129,0.15)'; border = '#10B981'; }
            return (
              <button key={opt.id} onClick={() => handleAnswer(opt.id)} disabled={answered}
                style={{ padding: '14px 20px', borderRadius: 12, background: bg, border: `1.5px solid ${border}`, color: '#E2E8F0', textAlign: 'left', cursor: answered ? 'default' : 'pointer', fontSize: '0.85rem', fontWeight: 500, transition: 'all 0.2s', opacity: answered && !result?.correct && opt.id !== roundEnd?.correctAnswerId ? 0.5 : 1 }}>
                <span style={{ fontWeight: 700, color: '#00D4FF', marginRight: 8 }}>{opt.id.toUpperCase()}.</span> {opt.text}
              </button>
            );
          })}
        </div>

        {/* Result feedback */}
        {result && (
          <div style={{ padding: 12, borderRadius: 10, background: result.correct ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${result.correct ? '#10B98140' : '#EF444440'}`, textAlign: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 700, color: result.correct ? '#10B981' : '#EF4444' }}>
              {result.correct ? `✓ Correct! +${result.points}pts` : '✗ Wrong!'} {result.firstCorrect && '🥇 First!'}
            </span>
          </div>
        )}

        {/* Scoreboard */}
        {scores.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {scores.slice(0, 4).map((s, i) => (
              <div key={s.id} style={{ flex: 1, minWidth: 100, padding: '8px 12px', borderRadius: 8, background: s.id === playerId ? 'rgba(0,212,255,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${s.id === playerId ? '#00D4FF30' : 'rgba(255,255,255,0.05)'}`, textAlign: 'center' }}>
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
