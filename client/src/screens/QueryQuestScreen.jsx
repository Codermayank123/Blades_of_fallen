import { useState, useEffect, useRef } from 'react';

export default function QueryQuestScreen({ playerId, gameState, onLeave }) {
  const [round, setRound] = useState(null);
  const [scenario, setScenario] = useState(null);
  const [scores, setScores] = useState([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [query, setQuery] = useState('');
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
      setRound(msg.round); setScenario(msg.scenario); setTimeLeft(msg.timeLimit || 60);
      setQuery(''); setSubmitted(false); setResult(null); setRoundEnd(null);
      startTimeRef.current = Date.now();
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft(Math.max(0, (msg.timeLimit || 60) - Math.floor((Date.now() - startTimeRef.current) / 1000)));
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
    if (submitted || !query.trim()) return;
    setSubmitted(true);
    send?.({ type: 'GAME_ACTION', action: 'SUBMIT_QUERY', query: query.trim(), timeElapsed: (Date.now() - startTimeRef.current) / 1000 });
  };

  const accentColor = scenario?.type === 'regex' ? '#A855F7' : '#10B981';

  if (showTutorial) {
    return (
      <div className="screen fade-in" style={{ padding: 20, background: '#0A0E1A' }}>
        <div className="glass-card" style={{ maxWidth: 600, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '2rem', color: '#10B981', marginBottom: 8 }}>QUERY QUEST</h1>
          <p style={{ color: '#94A3B8', marginBottom: 24, lineHeight: 1.7 }}>
            You'll get database scenarios and pattern matching puzzles.<br/>
            Write <strong style={{ color: '#10B981' }}>SQL queries</strong> or <strong style={{ color: '#A855F7' }}>regex patterns</strong> to solve them.<br/>
            Correct queries earn points, with <strong style={{ color: '#F59E0B' }}>speed bonuses</strong>!
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
            <div style={{ padding: 12, borderRadius: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981', fontWeight: 700 }}>🗃️ SQL Queries</div>
            <div style={{ padding: 12, borderRadius: 10, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', color: '#A855F7', fontWeight: 700 }}>🔤 Regex Patterns</div>
          </div>
          <button className="btn-neon" onClick={() => { setShowTutorial(false); send?.({ type: 'ARENA_READY' }); }}>START QUEST</button>
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="screen fade-in" style={{ padding: 20, background: '#0A0E1A' }}>
        <div className="glass-card" style={{ maxWidth: 500, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
          <h2 style={{ fontFamily: 'Rajdhani, sans-serif', color: '#10B981', marginBottom: 24 }}>QUEST COMPLETE</h2>
          {scores.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderRadius: 8, background: s.id === playerId ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)', marginBottom: 8 }}>
              <span style={{ color: i === 0 ? '#F59E0B' : '#E2E8F0', fontWeight: 700 }}>#{i+1} {s.username}</span>
              <span style={{ fontFamily: 'Rajdhani, sans-serif', color: '#10B981', fontWeight: 700 }}>{s.score}</span>
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
            <span style={{ fontSize: '1.5rem' }}>🔍</span>
            <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: '#10B981', fontSize: '1.1rem' }}>ROUND {round || '-'}</span>
            {scenario?.type && <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: '0.65rem', fontWeight: 800, background: `${accentColor}15`, color: accentColor, border: `1px solid ${accentColor}40`, textTransform: 'uppercase' }}>{scenario.type === 'sql' ? '🗃️ SQL' : '🔤 REGEX'}</span>}
          </div>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: timeLeft <= 10 ? '#EF4444' : accentColor }}>{timeLeft}s</div>
        </div>

        {/* Scenario */}
        {scenario && (
          <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#E2E8F0', marginBottom: 12, lineHeight: 1.6 }}>📋 {scenario.scenario}</div>
            {scenario.schema && (
              <div style={{ padding: 12, borderRadius: 8, background: '#0D1117', border: '1px solid rgba(16,185,129,0.2)', marginBottom: 10 }}>
                <div style={{ fontSize: '0.65rem', color: '#94A3B8', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>Schema</div>
                <code style={{ fontSize: '0.82rem', color: '#10B981', fontFamily: '"Fira Code", monospace' }}>{scenario.schema}</code>
              </div>
            )}
            {scenario.testStrings && (
              <div style={{ padding: 12, borderRadius: 8, background: '#0D1117', border: '1px solid rgba(168,85,247,0.2)', marginBottom: 10 }}>
                <div style={{ fontSize: '0.65rem', color: '#94A3B8', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>Test Strings</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {scenario.testStrings.map((ts, i) => (
                    <code key={i} style={{ fontSize: '0.8rem', color: '#A855F7', fontFamily: '"Fira Code", monospace', padding: '2px 8px', background: 'rgba(168,85,247,0.1)', borderRadius: 4 }}>"{ts}"</code>
                  ))}
                </div>
              </div>
            )}
            {scenario.keywords && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {scenario.keywords.map(kw => (
                  <span key={kw} style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 999, background: `${accentColor}10`, color: accentColor, border: `1px solid ${accentColor}25`, fontWeight: 600 }}>{kw}</span>
                ))}
              </div>
            )}
            {scenario.hint && <div style={{ fontSize: '0.75rem', color: '#F59E0B', marginTop: 10 }}>💡 {scenario.hint}</div>}
          </div>
        )}

        {/* Query Editor */}
        <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
          <textarea ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} disabled={submitted} rows={3}
            placeholder={scenario?.type === 'sql' ? 'SELECT ...' : 'Type your regex pattern...'}
            style={{ width: '100%', padding: 16, borderRadius: 12, background: '#0D1117', border: `2px solid ${submitted ? (result?.correct ? '#10B981' : '#EF444480') : accentColor + '30'}`, color: '#E6EDF3', fontSize: '0.9rem', fontFamily: '"Fira Code", monospace', outline: 'none', resize: 'vertical', minHeight: 80, transition: 'border-color 0.3s', boxSizing: 'border-box' }} />
          <button type="submit" disabled={submitted || !query.trim()} className="btn-neon" style={{ marginTop: 10, width: '100%', opacity: submitted ? 0.5 : 1 }}>
            {scenario?.type === 'sql' ? '▶ EXECUTE QUERY' : '▶ TEST PATTERN'}
          </button>
        </form>

        {/* Result */}
        {result && (
          <div style={{ padding: 14, borderRadius: 10, background: result.correct ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.08)', border: `1px solid ${result.correct ? '#10B98140' : '#EF444430'}`, marginBottom: 12 }}>
            <div style={{ fontWeight: 700, color: result.correct ? '#10B981' : '#EF4444', textAlign: 'center', marginBottom: 6 }}>
              {result.correct ? `✓ Correct! +${result.points}pts` : `Partial: +${result.points}pts`} {result.firstCorrect && '🥇'}
            </div>
            {result.sampleAnswer && (
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', textAlign: 'center' }}>
                Sample: <code style={{ color: accentColor }}>{result.sampleAnswer}</code>
              </div>
            )}
          </div>
        )}

        {/* Scoreboard */}
        {scores.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {scores.slice(0, 4).map((s, i) => (
              <div key={s.id} style={{ flex: 1, minWidth: 100, padding: '8px 12px', borderRadius: 8, background: s.id === playerId ? `${accentColor}10` : 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
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
