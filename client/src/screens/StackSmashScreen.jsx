import { useState, useEffect, useRef } from 'react';

const LANG_ACCENT = { js: '#FFDD00', python: '#4584b6', java: '#ED8B00', cpp: '#9B59B6' };
const LANG_LABELS = { js: 'JavaScript', python: 'Python', java: 'Java', cpp: 'C++' };

const DIFFICULTY_META = {
  easy: { label: 'EASY', color: '#00FF88' },
  medium: { label: 'MEDIUM', color: '#FFDD00' },
  hard: { label: 'HARD', color: '#FF6B6B' },
};

function StackFrame({ line, index, isError, highlighted }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '8px 14px',
      background: isError ? 'rgba(255,107,107,0.12)' : highlighted ? 'rgba(255,221,0,0.06)' : 'transparent',
      borderLeft: `3px solid ${isError ? '#FF6B6B' : highlighted ? '#FFDD00' : 'rgba(255,255,255,0.06)'}`,
      fontFamily: 'var(--f-mono)', fontSize: '0.8rem',
      transition: 'all 0.3s',
    }}>
      <span style={{ color: '#555', minWidth: 24, fontSize: '0.7rem' }}>{index + 1}</span>
      <span style={{ color: isError ? '#FF6B6B' : highlighted ? '#FFDD00' : '#c9d1d9', lineHeight: 1.5 }}>{line}</span>
      {isError && <span style={{ marginLeft: 'auto', color: '#FF6B6B', fontSize: '0.65rem', fontWeight: 700, whiteSpace: 'nowrap' }}>← HERE</span>}
    </div>
  );
}

export default function StackSmashScreen({ playerId, gameState, onLeave }) {
  const [round, setRound] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [scores, setScores] = useState([]);
  const [timeLeft, setTimeLeft] = useState(35);
  const [answered, setAnswered] = useState(false);
  const [result, setResult] = useState(null);
  const [roundEnd, setRoundEnd] = useState(null);
  const [fixInput, setFixInput] = useState('');
  const [showTutorial, setShowTutorial] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [exploding, setExploding] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const send = gameState?.send;

  const normalizeLang = (lang) => {
    const l = String(lang || '').toLowerCase();
    if (l === 'javascript') return 'js';
    if (l === 'c++') return 'cpp';
    return l || 'js';
  };

  const parseError = (err) => {
    const s = String(err || '');
    const idx = s.indexOf(':');
    if (idx === -1) return { errorType: 'RuntimeError', errorMessage: s || 'Crash detected' };
    return { errorType: s.slice(0, idx).trim() || 'RuntimeError', errorMessage: s.slice(idx + 1).trim() || 'Crash detected' };
  };

  useEffect(() => {
    if (!gameState?.lastMessage) return;
    const msg = gameState.lastMessage;
    if (msg.type === 'ROUND_START') {
      setRound(msg.round);
      const q = msg.challenge || msg.question;
      if (q) {
        const { errorType, errorMessage } = parseError(q.error);
        setChallenge({
          ...q,
          language: normalizeLang(q.language),
          errorType,
          errorMessage,
          stackTrace: Array.isArray(q.stackTrace) ? q.stackTrace : (Array.isArray(q.code) ? q.code : []),
          options: (q.options || []).map((o, idx) => ({ ...o, lineNumber: o.lineNumber ?? idx + 1 })),
        });
      } else {
        setChallenge(null);
      }
      const tl = q?.mode === 'fixit' ? 60 : (msg.timeLimit || 35);
      setTimeLeft(tl);
      setAnswered(false);
      setResult(null);
      setRoundEnd(null);
      setFixInput('');
      setExploding(false);
      startTimeRef.current = Date.now();
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setTimeLeft(prev => Math.max(0, tl - Math.floor(elapsed)));
      }, 200);
    }
    if (msg.type === 'ANSWER_RESULT') {
      setResult(msg);
      if (!msg.correct) setExploding(true);
      setTimeout(() => setExploding(false), 800);
    }
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

  const handleFixSubmit = () => {
    if (answered || !fixInput.trim()) return;
    setAnswered(true);
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    send?.({ type: 'GAME_ACTION', action: 'FIX_SUBMIT', fix: fixInput.trim(), timeElapsed: elapsed });
  };

  const handleReady = () => { setShowTutorial(false); send?.({ type: 'ARENA_READY' }); };

  if (showTutorial) {
    return (
      <div className="screen fade-in" style={{ background: '#0A0E1A', padding: 20 }}>
        <div className="glass-card" style={{ maxWidth: 600, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>💥</div>
          <h1 style={{ fontFamily: 'var(--f-heading)', fontSize: '2rem', color: '#FF6B6B', marginBottom: 8, letterSpacing: 3 }}>STACK SMASH</h1>
          <p style={{ color: 'var(--c-text-dim)', marginBottom: 24, lineHeight: 1.8, fontSize: '0.9rem' }}>
            A crash trace appears each round.<br />
            <strong style={{ color: '#00D4FF' }}>Find the line causing the stack overflow, infinite loop or memory leak.</strong><br />
            In Fix It mode, type a 1-line fix instead of multiple choice!
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            {Object.entries(LANG_LABELS).map(([k, v]) => (
              <span key={k} style={{ padding: '4px 12px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700, background: `${LANG_ACCENT[k]}15`, color: LANG_ACCENT[k], border: `1px solid ${LANG_ACCENT[k]}30` }}>{v}</span>
            ))}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--c-text-off)', marginBottom: 24 }}>4 rounds · MCQ (35s) or Fix It (60s) per round</div>
          <button className="btn-neon" onClick={handleReady} style={{ borderColor: '#FF6B6B', color: '#FF6B6B' }}>SMASH THE STACK</button>
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="screen fade-in" style={{ padding: 20, background: '#0A0E1A' }}>
        <div className="glass-card" style={{ maxWidth: 500, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💥</div>
          <h2 style={{ fontFamily: 'var(--f-heading)', color: '#FF6B6B', marginBottom: 24, letterSpacing: 2 }}>SMASHED IT!</h2>
          {scores.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderRadius: 8, background: s.id === playerId ? 'rgba(255,107,107,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${s.id === playerId ? '#FF6B6B40' : 'rgba(255,255,255,0.06)'}`, marginBottom: 8 }}>
              <span style={{ color: i === 0 ? '#FFD700' : 'var(--c-text)', fontWeight: 700 }}>#{i + 1} {s.username}</span>
              <span style={{ fontFamily: 'var(--f-mono)', color: '#FF6B6B', fontWeight: 700 }}>{s.score}</span>
            </div>
          ))}
          <button className="btn-neon" onClick={onLeave} style={{ marginTop: 24, borderColor: '#FF6B6B', color: '#FF6B6B' }}>BACK TO LOBBY</button>
        </div>
      </div>
    );
  }

  const lang = challenge?.language || 'js';
  const accent = LANG_ACCENT[lang] || '#FF6B6B';
  const isFixIt = challenge?.mode === 'fixit';
  const diff = challenge?.difficulty || 'easy';
  const diffMeta = DIFFICULTY_META[diff] || DIFFICULTY_META.easy;

  return (
    <div className="screen fade-in" style={{ padding: 16, paddingTop: 20, background: '#0A0E1A', justifyContent: 'flex-start', animation: exploding ? 'shake 0.5s ease' : undefined }}>
      <div style={{ maxWidth: 800, width: '100%', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.3rem' }}>💥</span>
            <span style={{ fontFamily: 'var(--f-mono)', fontWeight: 700, color: accent, fontSize: '0.95rem' }}>STACK SMASH · R{round || '-'}</span>
            <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: '0.6rem', fontWeight: 700, background: `${accent}18`, color: accent }}>{LANG_LABELS[lang]}</span>
            <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: '0.6rem', fontWeight: 700, background: `${diffMeta.color}15`, color: diffMeta.color }}>{diffMeta.label}</span>
            {isFixIt && <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: '0.6rem', fontWeight: 800, background: 'rgba(255,100,0,0.12)', color: '#FF8C00', border: '1px solid rgba(255,100,0,0.3)' }}>FIX IT MODE</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              className="btn2 btn2--ghost"
              onClick={() => { send?.({ type: 'LEAVE_ROOM' }); onLeave?.(); }}
              style={{ padding: '6px 10px', fontSize: '0.7rem', borderRadius: 999 }}
            >
              Exit
            </button>
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: '1.6rem', fontWeight: 800, color: timeLeft <= 8 ? '#FF6B6B' : accent, textShadow: `0 0 20px ${accent}80`, transition: 'color 0.3s' }}>{timeLeft}s</div>
          </div>
        </div>

        {/* Error Banner */}
        <div style={{ padding: '10px 16px', borderRadius: 8, background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#FF6B6B', fontSize: '1rem' }}>🔴</span>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.75rem', color: '#FF6B6B', fontWeight: 700 }}>
            {challenge?.errorType || 'RuntimeError'}: {challenge?.errorMessage || 'Stack overflow detected'}
          </span>
        </div>

        {/* Stack Trace */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '8px 14px', background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '0.65rem', color: 'var(--c-text-off)', textTransform: 'uppercase', letterSpacing: 2 }}>
            CALL STACK TRACE — {LANG_LABELS[lang]}
          </div>
          {(challenge?.stackTrace || []).map((line, i) => (
            <StackFrame key={i} line={line} index={i} isError={roundEnd && i === roundEnd.bugLine} highlighted={!roundEnd && i % 4 === 2} />
          ))}
          {!challenge && (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--c-text-off)', fontSize: '0.85rem' }}>Waiting for challenge...</div>
          )}
        </div>

        {/* Result feedback */}
        {result && (
          <div style={{ padding: 12, borderRadius: 10, background: result.correct ? 'rgba(0,255,136,0.08)' : 'rgba(255,107,107,0.08)', border: `1px solid ${result.correct ? '#00FF8840' : '#FF6B6B40'}`, textAlign: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 700, color: result.correct ? '#00FF88' : '#FF6B6B', fontFamily: 'var(--f-mono)' }}>
              {result.correct ? `✓ Correct! +${result.points}pts` : '✗ Wrong!'} {result.firstCorrect && '🥇 First!'}
            </span>
            {result.explanation && <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--c-text-dim)' }}>{result.explanation}</div>}
          </div>
        )}

        {/* Answers */}
        {isFixIt ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              className="input2"
              value={fixInput}
              onChange={e => setFixInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleFixSubmit()}
              placeholder="Type your 1-line fix here..."
              disabled={answered}
              style={{ fontFamily: 'var(--f-mono)', fontSize: '0.85rem', flex: 1, background: 'rgba(0,0,0,0.5)', borderColor: `${accent}40` }}
            />
            <button className="btn2 btn2--primary" onClick={handleFixSubmit} disabled={answered || !fixInput.trim()} style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, border: 'none', whiteSpace: 'nowrap' }}>
              Submit Fix
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(challenge?.options || []).map((opt, idx) => {
              const isCorrect = roundEnd && opt.id === roundEnd.correctAnswerId;
              return (
                <button key={opt.id} onClick={() => handleAnswer(opt.id)} disabled={answered}
                  style={{ padding: '12px 16px', borderRadius: 10, background: isCorrect ? 'rgba(0,255,136,0.08)' : 'rgba(255,255,255,0.03)', border: `1.5px solid ${isCorrect ? '#00FF88' : 'rgba(255,255,255,0.08)'}`, color: 'var(--c-text)', textAlign: 'left', cursor: answered ? 'default' : 'pointer', fontSize: '0.85rem', transition: 'all 0.2s', opacity: answered && !isCorrect ? 0.5 : 1 }}>
                  <span style={{ fontWeight: 700, color: accent, marginRight: 8, fontFamily: 'var(--f-mono)' }}>Line {opt.lineNumber ?? idx + 1}.</span> {opt.text}
                </button>
              );
            })}
          </div>
        )}

        {/* Scores sidebar */}
        {scores.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
            {scores.slice(0, 5).map((s, i) => (
              <div key={s.id} style={{ flex: 1, minWidth: 90, padding: '8px 12px', borderRadius: 8, background: s.id === playerId ? `${accent}10` : 'rgba(255,255,255,0.02)', border: `1px solid ${s.id === playerId ? `${accent}30` : 'rgba(255,255,255,0.05)'}`, textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--c-text-dim)', marginBottom: 2 }}>{s.username}</div>
                <div style={{ fontFamily: 'var(--f-mono)', fontWeight: 700, color: i === 0 ? '#FFD700' : 'var(--c-text)' }}>{s.score}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
