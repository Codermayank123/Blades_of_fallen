import { useState, useEffect, useRef } from 'react';

const LEVEL_META = {
  beginner: { label: 'BEGINNER', color: '#00FF88', glow: 'rgba(0,255,136,0.4)' },
  intermediate: { label: 'INTERMEDIATE', color: '#FFDD00', glow: 'rgba(255,221,0,0.4)' },
  expert: { label: 'EXPERT', color: '#FF6B6B', glow: 'rgba(255,107,107,0.4)' },
};

const LANG_COLORS = { js: '#FFDD00', python: '#4584b6', rust: '#CE422B', java: '#ED8B00', cpp: '#9B59B6' };

function normalizeLang(lang) {
  const l = String(lang || '').toLowerCase();
  if (l === 'javascript') return 'js';
  if (l === 'c++') return 'cpp';
  return l || 'js';
}

function SyntaxHighlight({ code, lang }) {
  // Simple keyword colorizer
  const keywords = {
    js: ['function', 'return', 'for', 'let', 'const', 'var', 'while', 'if', 'else', 'of', 'in', 'new', 'true', 'false', '=>', 'map', 'filter', 'reduce', 'forEach', 'length', 'push'],
    python: ['def', 'return', 'for', 'while', 'if', 'else', 'elif', 'in', 'range', 'print', 'len', 'True', 'False', 'lambda', 'import', 'from', 'class'],
    rust: ['fn', 'let', 'mut', 'for', 'while', 'if', 'else', 'return', 'use', 'impl', 'struct', 'enum', 'pub', 'mod', 'match', 'Some', 'None'],
  };
  const kws = keywords[lang] || keywords.js;
  const lines = code.split('\n');
  return (
    <pre style={{
      background: '#0D1117', padding: 'var(--sp-4)',
      borderRadius: 'var(--r-md)', overflowX: 'auto',
      fontSize: '0.82rem', lineHeight: 1.7, margin: 0,
      fontFamily: 'var(--f-mono)', color: '#c9d1d9', border: '1px solid rgba(0,255,136,0.12)',
    }}>
      {lines.map((line, li) => {
        const parts = line.split(/(\s+|[()[\]{},;=+\-*/<>!])/);
        return (
          <div key={li} style={{ minHeight: '1.3em' }}>
            <span style={{ color: '#444', userSelect: 'none', marginRight: 12, fontSize: '0.7rem' }}>{String(li + 1).padStart(2, '0')}</span>
            {parts.map((part, pi) => {
              if (kws.includes(part.trim())) return <span key={pi} style={{ color: '#ff7b72' }}>{part}</span>;
              if (/^\d+$/.test(part.trim())) return <span key={pi} style={{ color: '#79c0ff' }}>{part}</span>;
              if (/^["'`].*["'`]$/.test(part.trim())) return <span key={pi} style={{ color: '#a5d6ff' }}>{part}</span>;
              if (/^\/\//.test(part.trim())) return <span key={pi} style={{ color: '#8b949e' }}>{part}</span>;
              return <span key={pi}>{part}</span>;
            })}
          </div>
        );
      })}
    </pre>
  );
}

export default function PixelCodeScreen({ playerId, gameState, onLeave }) {
  const [round, setRound] = useState(null);
  const [question, setQuestion] = useState(null);
  const [scores, setScores] = useState([]);
  const [timeLeft, setTimeLeft] = useState(40);
  const [answered, setAnswered] = useState(false);
  const [result, setResult] = useState(null);
  const [roundEnd, setRoundEnd] = useState(null);
  const [compiling, setCompiling] = useState(false);
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
      setTimeLeft(msg.timeLimit || 40);
      setAnswered(false);
      setResult(null);
      setRoundEnd(null);
      setCompiling(false);
      startTimeRef.current = Date.now();
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setTimeLeft(prev => Math.max(0, (msg.timeLimit || 40) - Math.floor(elapsed)));
      }, 200);
    }
    if (msg.type === 'ANSWER_RESULT') { setResult(msg); setCompiling(false); }
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
    setCompiling(true);
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    send?.({ type: 'GAME_ACTION', action: 'ANSWER', answerId: optionId, timeElapsed: elapsed });
  };

  const handleReady = () => { setShowTutorial(false); send?.({ type: 'ARENA_READY' }); };

  if (showTutorial) {
    return (
      <div className="screen fade-in" style={{ background: '#0A0E1A', padding: 20 }}>
        <div className="glass-card" style={{ maxWidth: 600, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🖼️</div>
          <h1 style={{ fontFamily: 'var(--f-heading)', fontSize: '2rem', color: '#00FF88', marginBottom: 8, letterSpacing: 3 }}>PIXEL CODE</h1>
          <p style={{ color: 'var(--c-text-dim)', marginBottom: 24, lineHeight: 1.8, fontSize: '0.9rem' }}>
            A pixelated ASCII art grid appears each round.<br />
            <strong style={{ color: '#00D4FF' }}>Pick the code snippet that generates it.</strong><br />
            Watch for off-by-one errors, wrong loop bounds & subtle bugs!
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
            {Object.entries(LEVEL_META).map(([k, v]) => (
              <div key={k} style={{ padding: 12, borderRadius: 12, background: `${v.color}12`, border: `1px solid ${v.color}30`, color: v.color, fontWeight: 700, fontSize: '0.75rem', letterSpacing: 1 }}>{v.label}</div>
            ))}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--c-text-off)', marginBottom: 24 }}>
            5 rounds · 40s each · Speed bonus multiplier
          </div>
          <button className="btn-neon" onClick={handleReady} style={{ borderColor: '#00FF88', color: '#00FF88' }}>COMPILE &amp; PLAY</button>
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="screen fade-in" style={{ padding: 20, background: '#0A0E1A' }}>
        <div className="glass-card" style={{ maxWidth: 500, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
          <h2 style={{ fontFamily: 'var(--f-heading)', color: '#00FF88', marginBottom: 24, letterSpacing: 2 }}>MATCH COMPLETE</h2>
          {scores.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderRadius: 8, background: s.id === playerId ? 'rgba(0,255,136,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${s.id === playerId ? '#00FF8840' : 'rgba(255,255,255,0.06)'}`, marginBottom: 8 }}>
              <span style={{ color: i === 0 ? '#FFD700' : 'var(--c-text)', fontWeight: 700 }}>#{i + 1} {s.username}</span>
              <span style={{ fontFamily: 'var(--f-mono)', color: '#00FF88', fontWeight: 700 }}>{s.score}</span>
            </div>
          ))}
          <button className="btn-neon" onClick={onLeave} style={{ marginTop: 24, borderColor: '#00FF88', color: '#00FF88' }}>BACK TO LOBBY</button>
        </div>
      </div>
    );
  }

  const lang = normalizeLang(question?.language || 'js');
  const level = question?.level || 'beginner';
  const lvMeta = LEVEL_META[level] || LEVEL_META.beginner;

  return (
    <div className="screen fade-in" style={{ padding: 16, paddingTop: 20, background: '#0A0E1A', justifyContent: 'flex-start' }}>
      <div style={{ maxWidth: 860, width: '100%', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.3rem' }}>🖼️</span>
            <span style={{ fontFamily: 'var(--f-mono)', fontWeight: 700, color: '#00FF88', fontSize: '0.95rem' }}>PIXEL CODE · ROUND {round || '-'}</span>
            <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: '0.6rem', fontWeight: 800, background: `${lvMeta.color}18`, color: lvMeta.color, border: `1px solid ${lvMeta.color}35`, boxShadow: `0 0 8px ${lvMeta.glow}` }}>{lvMeta.label}</span>
            {lang && <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: '0.6rem', fontWeight: 700, background: `${LANG_COLORS[lang]}18`, color: LANG_COLORS[lang] }}>{lang.toUpperCase()}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              className="btn2 btn2--ghost"
              onClick={() => { send?.({ type: 'LEAVE_ROOM' }); onLeave?.(); }}
              style={{ padding: '6px 10px', fontSize: '0.7rem', borderRadius: 999 }}
            >
              Exit
            </button>
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: '1.6rem', fontWeight: 800, color: timeLeft <= 8 ? '#FF6B6B' : '#00FF88', textShadow: timeLeft <= 8 ? '0 0 20px rgba(255,107,107,0.8)' : '0 0 20px rgba(0,255,136,0.5)', transition: 'color 0.3s, text-shadow 0.3s' }}>{timeLeft}s</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          {/* ASCII Grid */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--c-text-off)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 2 }}>OUTPUT PREVIEW</div>
            {question?.output ? (
              <pre style={{ fontFamily: 'var(--f-mono)', fontSize: '1rem', lineHeight: 1.4, color: '#00FF88', background: '#050810', padding: 16, borderRadius: 8, border: '1px solid rgba(0,255,136,0.15)', textShadow: '0 0 8px rgba(0,255,136,0.5)', margin: 0, overflowX: 'auto' }}>
                {question.output}
              </pre>
            ) : (
              <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text-off)', fontSize: '0.8rem' }}>Waiting for question...</div>
            )}
            {question?.description && <div style={{ marginTop: 10, fontSize: '0.75rem', color: 'var(--c-text-dim)', lineHeight: 1.5 }}>{question.description}</div>}
          </div>

          {/* Scoreboard */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--c-text-off)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 2 }}>LEADERBOARD</div>
            {scores.length > 0 ? scores.map((s, i) => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 6, background: s.id === playerId ? 'rgba(0,255,136,0.06)' : 'transparent', marginBottom: 4 }}>
                <span style={{ fontSize: '0.75rem', color: i === 0 ? '#FFD700' : 'var(--c-text)' }}>{i === 0 ? '👑' : `#${i + 1}`} {s.username}</span>
                <span style={{ fontFamily: 'var(--f-mono)', color: '#00FF88', fontSize: '0.8rem', fontWeight: 700 }}>{s.score}</span>
              </div>
            )) : (
              <div style={{ color: 'var(--c-text-off)', fontSize: '0.8rem', textAlign: 'center', padding: 20 }}>Scores appear after round 1</div>
            )}
          </div>
        </div>

        {/* Compiling indicator */}
        {compiling && (
          <div style={{ textAlign: 'center', padding: '8px 0', marginBottom: 12, color: '#00FF88', fontFamily: 'var(--f-mono)', fontSize: '0.8rem', animation: 'pulse 0.8s ease-in-out infinite' }}>
            ⚙️ compiling...
          </div>
        )}

        {/* Result feedback */}
        {result && (
          <div style={{ padding: 12, borderRadius: 10, background: result.correct ? 'rgba(0,255,136,0.08)' : 'rgba(255,107,107,0.08)', border: `1px solid ${result.correct ? '#00FF8840' : '#FF6B6B40'}`, textAlign: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 700, color: result.correct ? '#00FF88' : '#FF6B6B', fontFamily: 'var(--f-mono)' }}>
              {result.correct ? `✓ Correct! +${result.points}pts` : '✗ Wrong answer'} {result.firstCorrect && '🥇 First!'}
            </span>
          </div>
        )}

        {/* Code Options */}
        <div style={{ fontSize: '0.65rem', color: 'var(--c-text-off)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 2 }}>WHICH CODE GENERATES THIS OUTPUT?</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {(question?.options || []).map((opt, idx) => {
            const labels = ['A', 'B', 'C', 'D'];
            const isCorrect = roundEnd && opt.id === roundEnd.correctAnswerId;
            let borderColor = 'rgba(0,255,136,0.08)';
            if (isCorrect) borderColor = '#00FF88';
            return (
              <button key={opt.id} onClick={() => handleAnswer(opt.id)} disabled={answered}
                style={{ padding: 0, border: `1.5px solid ${borderColor}`, borderRadius: 10, background: isCorrect ? 'rgba(0,255,136,0.06)' : 'rgba(0,0,0,0.4)', cursor: answered ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.2s', opacity: answered && !isCorrect && opt.id !== roundEnd?.correctAnswerId ? 0.55 : 1 }}>
                <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,255,136,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--f-mono)', fontWeight: 800, color: '#00FF88', fontSize: '0.8rem' }}>{labels[idx] || opt.id.toUpperCase()}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--c-text-off)' }}>{lang?.toUpperCase()}</span>
                </div>
                <div style={{ padding: '8px 12px 12px' }}>
                  <SyntaxHighlight code={opt.code || opt.text || ''} lang={lang} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
