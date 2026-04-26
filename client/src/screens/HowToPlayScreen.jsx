import { useState, useEffect, useRef, useCallback } from 'react';

// ── Typewriter Hook ──────────────────────────────
function useTypewriter(text, speed = 28) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    timerRef.current = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(timerRef.current);
      }
    }, speed);
    return () => clearInterval(timerRef.current);
  }, [text, speed]);

  return { displayed, done };
}

// ── ARIA SVG Robot ──────────────────────────────
function ARIARobot({ speaking }) {
  return (
    <div style={{ position: 'relative', width: 120, height: 130, flexShrink: 0 }}>
      <svg viewBox="0 0 120 130" width="120" height="130" style={{ animation: speaking ? undefined : 'ariaBob 2.5s ease-in-out infinite' }}>
        <style>{`
          @keyframes ariaBob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
          @keyframes ariaEyeBlink { 0%,90%,100% { ry: 8 } 92%,98% { ry: 1 } }
          @keyframes ariaAntenna { 0%,100% { transform: rotate(-8deg) } 50% { transform: rotate(8deg) } }
          @keyframes ariaDot { 0%,66%,100% { opacity: 0 } 33% { opacity: 1 } }
          @keyframes ariaSpeakDot { 0% { opacity:0.2 } 50% { opacity:1 } 100% { opacity:0.2 } }
        `}</style>

        {/* Antenna */}
        <g style={{ transformOrigin: '60px 18px', animation: 'ariaAntenna 2s ease-in-out infinite' }}>
          <line x1="60" y1="18" x2="60" y2="6" stroke="#00FFFF" strokeWidth="3" strokeLinecap="round" />
          <circle cx="60" cy="4" r="4" fill="#00FFFF" style={{ filter: 'drop-shadow(0 0 6px #00FFFF)' }} />
        </g>

        {/* Head */}
        <rect x="20" y="20" width="80" height="60" rx="18" fill="#111827" stroke="#00FFFF" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 10px rgba(0,255,255,0.3))' }} />

        {/* Eyes */}
        <ellipse cx="42" cy="46" rx="11" ry="8" fill="#00FFFF" style={{ filter: 'drop-shadow(0 0 8px #00FFFF)', animation: 'ariaEyeBlink 3s ease-in-out infinite' }} />
        <ellipse cx="78" cy="46" rx="11" ry="8" fill="#00FFFF" style={{ filter: 'drop-shadow(0 0 8px #00FFFF)', animation: 'ariaEyeBlink 3s ease-in-out infinite 0.15s' }} />
        <circle cx="42" cy="46" r="4" fill="#001A1A" />
        <circle cx="78" cy="46" r="4" fill="#001A1A" />
        <circle cx="44" cy="44" r="2" fill="#fff" opacity={0.6} />
        <circle cx="80" cy="44" r="2" fill="#fff" opacity={0.6} />

        {/* Mouth */}
        {speaking ? (
          <g>
            <rect x="38" y="63" width="44" height="10" rx="5" fill="#00FFFF" opacity={0.2} />
            <circle cx="48" cy="68" r="3" fill="#00FFFF" style={{ animation: 'ariaSpeakDot 0.5s ease infinite 0s' }} />
            <circle cx="60" cy="68" r="3" fill="#00FFFF" style={{ animation: 'ariaSpeakDot 0.5s ease infinite 0.15s' }} />
            <circle cx="72" cy="68" r="3" fill="#00FFFF" style={{ animation: 'ariaSpeakDot 0.5s ease infinite 0.3s' }} />
          </g>
        ) : (
          <path d="M38 68 Q60 78 82 68" stroke="#00FFFF" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        )}

        {/* Body */}
        <rect x="30" y="83" width="60" height="36" rx="12" fill="#111827" stroke="#00FFFF" strokeWidth="1.5" opacity={0.7} />
        <rect x="42" y="91" width="36" height="20" rx="6" fill="rgba(0,255,255,0.06)" stroke="rgba(0,255,255,0.2)" strokeWidth="1" />
        <circle cx="60" cy="101" r="5" fill="none" stroke="#00FFFF" strokeWidth="1.5" opacity={0.5} />
        <circle cx="60" cy="101" r="2" fill="#00FFFF" opacity={0.7} />
      </svg>
    </div>
  );
}

// ── Game content ──────────────────────────────
const TABS = [
  {
    id: 'start', label: '🚀 Getting Started', color: '#7B2FBE',
    aria: `Welcome! I'm ARIA — your Animated Rules Intelligence Assistant. Code Arena is a competitive multiplayer platform where coders and creatives battle in real time. To begin, log in with your username, pick a game mode from the Lobby, and click Quick Match to join instantly — or host a private room and share the code with friends. Each game has different mechanics, so explore them all to find your favorite!`,
    tips: ['💡 Use Quick Match for instant play — no waiting!', '🏠 Host a Room to play with specific friends using a 6-digit code', '⭐ Win matches to climb the leaderboard and earn ELO rating'],
    preview: null,
  },
  {
    id: 'pixel_code', label: '🖼️ Pixel Code', color: '#00FF88',
    aria: `Pixel Code is a visual coding challenge. Each round, you'll see an ASCII art grid on the left — a pixelated output. Your job is to pick which of the four code snippets, in JavaScript, Python, or Rust, actually generates that exact output. The tricky part? Options include deliberate off-by-one errors, wrong loop bounds, and subtle bugs. You must trace execution in your head to find the correct one. Answer faster for bigger bonus points!`,
    tips: ['🔍 Count rows and columns carefully — off-by-one errors are common traps', '⚡ The EXPERT level uses recursion and higher-order functions — trace step by step', '⏱️ Answering in the first 10s gives maximum speed bonus multiplier'],
    preview: 'pixel',
  },
  {
    id: 'stack_smash', label: '💥 Stack Smash', color: '#FF6B6B',
    aria: `Stack Smash shows you a crash dump from a real program. A red error banner explains what went wrong — stack overflow, infinite loop, or memory leak. Your job is to identify which exact line in the call stack trace is causing it. In regular mode you pick from multiple choice options. But watch out for Fix It mode — sometimes you'll need to type a one-line fix directly into a code editor input. Faster answers earn more points!`,
    tips: ['🔴 Look for recursive functions without proper base cases — classic overflow', '💾 Memory leaks in JavaScript often happen in closures holding references', '✏️ In Fix It mode, your fix must be syntactically valid — think before typing'],
    preview: 'stack',
  },
  {
    id: 'emoji_escape', label: '😂 Emoji Escape', color: '#FFDD00',
    aria: `Emoji Escape is pure creative speed! Each round shows a sequence of emojis that encodes a famous movie, song title, proverb, or coding joke. Type the correct answer before your opponent does — the first correct answer wins the round! Warning: wrong answers add a 5-second penalty to your timer. And if your opponent answers wrong, you get a "Steal" opportunity to win the point! A hint appears in the last 10 seconds if nobody has answered.`,
    tips: ['🎬 Read emojis as a story, not individual symbols — think laterally', '⚡ Speed is everything — practice common movies and songs in your head', '🔥 After an opponent mistake, hit submit immediately to steal the point!'],
    preview: 'emoji',
  },
  {
    id: 'meme_wars', label: '🏆 Meme Wars', color: '#FF69B4',
    aria: `Meme Wars is the ultimate creativity contest! Each round reveals a meme template — described with text and emoji. You have 30 seconds to write the funniest caption possible. Then all captions are shown anonymously and everyone votes for the best one. You earn 3 points for every vote you receive, plus a 1-point bonus just for submitting on time. Watch for the wildcard round — a surprise tech or coding meme that changes everything!`,
    tips: ['🎭 Anonymous voting means pure comedy wins — no cliques, just funny', '🃏 The wildcard tech meme usually references "It works on my machine" type jokes', '⏰ Always submit something! Even a mediocre caption earns the on-time bonus point'],
    preview: 'meme',
  },
];

// ── Mini Previews ──────────────────────────────
function MiniPreview({ type }) {
  if (type === 'pixel') return (
    <div style={{ background: '#050810', borderRadius: 10, padding: 16, border: '1px solid rgba(0,255,136,0.2)' }}>
      <div style={{ fontSize: '0.6rem', color: '#00FF88', marginBottom: 8, letterSpacing: 2 }}>OUTPUT PREVIEW</div>
      <pre style={{ fontFamily: 'var(--f-mono)', color: '#00FF88', fontSize: '0.9rem', textShadow: '0 0 6px rgba(0,255,136,0.6)', margin: 0, lineHeight: 1.4 }}>
{`▓▓▓▓▓
▓░░░▓
▓░▓░▓
▓░░░▓
▓▓▓▓▓`}
      </pre>
      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {['for(i=0;i<=5;i++)', 'for(i=0;i<5;i++)', 'for(i=1;i<5;i++)', 'for(i=0;i<4;i++)'].map((c, i) => (
          <div key={i} style={{ padding: '6px 8px', borderRadius: 6, background: i === 1 ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${i === 1 ? '#00FF8840' : 'rgba(255,255,255,0.06)'}`, fontFamily: 'var(--f-mono)', fontSize: '0.65rem', color: i === 1 ? '#00FF88' : '#8b949e' }}>{c}</div>
        ))}
      </div>
    </div>
  );

  if (type === 'stack') return (
    <div style={{ background: '#0D1117', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,107,107,0.2)' }}>
      <div style={{ padding: '8px 12px', background: 'rgba(255,107,107,0.1)', borderBottom: '1px solid rgba(255,107,107,0.2)', fontSize: '0.65rem', color: '#FF6B6B', fontFamily: 'var(--f-mono)' }}>🔴 RuntimeError: Maximum call stack exceeded</div>
      {['01  function factorial(n) {', '02    return factorial(n-1) * n;', '03  }', '04  factorial(100000);'].map((l, i) => (
        <div key={i} style={{ padding: '5px 12px', background: i === 1 ? 'rgba(255,107,107,0.1)' : 'transparent', borderLeft: `3px solid ${i === 1 ? '#FF6B6B' : 'transparent'}`, fontFamily: 'var(--f-mono)', fontSize: '0.72rem', color: i === 1 ? '#FF6B6B' : '#c9d1d9' }}>
          {l} {i === 1 && <span style={{ color: '#FF6B6B', fontSize: '0.6rem' }}>← no base case!</span>}
        </div>
      ))}
    </div>
  );

  if (type === 'emoji') return (
    <div style={{ background: '#111827', borderRadius: 10, padding: 20, textAlign: 'center', border: '1px solid rgba(255,221,0,0.2)' }}>
      <div style={{ fontSize: '3rem', letterSpacing: 6, marginBottom: 12 }}>🦁 👑 🌍</div>
      <div style={{ padding: '8px 14px', background: 'rgba(255,221,0,0.06)', borderRadius: 8, border: '1px solid rgba(255,221,0,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '1rem' }}>💬</span>
        <span style={{ color: '#FFDD00', fontSize: '0.85rem', fontStyle: 'italic' }}>The Lion King</span>
      </div>
    </div>
  );

  if (type === 'meme') return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ display: 'inline-block', padding: '20px 24px 16px', background: '#fff', borderRadius: 4, boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>😅</div>
        <div style={{ fontFamily: 'Impact, "Arial Black", sans-serif', fontSize: '0.85rem', color: '#000', letterSpacing: 2 }}>IT WORKS ON MY MACHINE</div>
      </div>
      <div style={{ marginTop: 12, padding: '10px 16px', background: 'rgba(255,105,180,0.06)', borderRadius: 10, border: '1px solid rgba(255,105,180,0.2)', fontFamily: 'Impact, "Arial Black", sans-serif', color: '#fff', fontSize: '0.9rem' }}>
        works on prod too... sometimes
      </div>
    </div>
  );

  return null;
}

// ── Main Component ──────────────────────────────
export default function HowToPlayScreen({ onBack }) {
  const [activeTab, setActiveTab] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [tipsVisible, setTipsVisible] = useState(false);
  const tab = TABS[activeTab];
  const { displayed, done } = useTypewriter(tab.aria, 28);

  // Text-to-speech
  const speakText = useCallback((text) => {
    if (!audioEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.9;
    utt.pitch = 1.1;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.name.toLowerCase().includes('female') || v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Google UK English Female'));
    if (preferred) utt.voice = preferred;
    window.speechSynthesis.speak(utt);
  }, [audioEnabled]);

  useEffect(() => {
    setTipsVisible(false);
    if (done && audioEnabled) speakText(tab.aria);
  }, [activeTab]);

  useEffect(() => {
    if (done) {
      setTimeout(() => setTipsVisible(true), 200);
      if (audioEnabled) speakText(tab.aria);
    }
  }, [done]);

  useEffect(() => {
    if (!audioEnabled && window.speechSynthesis) window.speechSynthesis.cancel();
  }, [audioEnabled]);

  // Stop speech immediately when leaving the screen (unmount)
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  const handleBack = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    onBack();
  };

  const handleTabChange = (idx) => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setActiveTab(idx);
  };

  const isSpeaking = !done;
  const tabColor = tab.color;

  return (
    <div className="screen fade-in" style={{ padding: 'var(--sp-4)', paddingTop: '80px', justifyContent: 'flex-start' }}>
      <style>{`
        @keyframes ariaBob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
        @keyframes tipFadeIn { from { opacity:0; transform:translateX(-12px) } to { opacity:1; transform:translateX(0) } }
        @keyframes tabSlide { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes cursorBlink { 0%,50% { opacity:1 } 51%,100% { opacity:0 } }
        .aria-cursor::after { content:'|'; animation: cursorBlink 0.7s step-end infinite; color: #00FFFF; }
      `}</style>

      <div style={{ maxWidth: 900, width: '100%', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-6)' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--f-heading)', fontSize: '1.8rem', fontWeight: 900, color: 'var(--c-text)', margin: 0, letterSpacing: 2 }}>HOW TO PLAY</h1>
            <p style={{ color: 'var(--c-text-off)', fontSize: '0.8rem', margin: 0, marginTop: 4 }}>ARIA — Your AI Game Guide</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={() => setAudioEnabled(v => !v)}
              style={{ padding: '8px 14px', borderRadius: 20, background: audioEnabled ? 'rgba(0,255,255,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${audioEnabled ? 'rgba(0,255,255,0.3)' : 'rgba(255,255,255,0.1)'}`, color: audioEnabled ? '#00FFFF' : 'var(--c-text-off)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s' }}>
              {audioEnabled ? '🔊 Audio ON' : '🔇 Audio OFF'}
            </button>
            <button className="btn2 btn2--ghost" onClick={handleBack}>← Back</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 'var(--sp-6)', flexWrap: 'wrap' }}>
          {TABS.map((t, i) => (
            <button key={t.id} onClick={() => handleTabChange(i)}
              style={{
                padding: '8px 16px', borderRadius: 20, cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
                border: `1.5px solid ${activeTab === i ? `${t.color}60` : 'rgba(255,255,255,0.08)'}`,
                background: activeTab === i ? `${t.color}12` : 'transparent',
                color: activeTab === i ? t.color : 'var(--c-text-dim)',
                transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                transform: activeTab === i ? 'scale(1.04)' : 'scale(1)',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-5)', alignItems: 'start' }}>
          {/* ARIA Panel */}
          <div style={{ animation: 'tabSlide 0.35s ease both' }}>
            {/* ARIA Robot + Speech */}
            <div className="glass-card" style={{ padding: 24, marginBottom: 'var(--sp-4)', borderColor: `${tabColor}20` }}>
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <ARIARobot speaking={isSpeaking} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.65rem', color: tabColor, fontWeight: 700, letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' }}>ARIA SAYS</div>
                  <div className={!done ? 'aria-cursor' : ''} style={{ fontFamily: 'var(--f-body)', fontSize: '0.87rem', color: 'var(--c-text)', lineHeight: 1.75, minHeight: 80 }}>
                    {displayed}
                  </div>
                  {isSpeaking && (
                    <div style={{ display: 'flex', gap: 4, marginTop: 12, alignItems: 'center' }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: tabColor, animation: `ariaSpeakDot 0.5s ease infinite`, animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pro Tips */}
            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ fontSize: '0.65rem', color: tabColor, fontWeight: 700, letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase' }}>PRO TIPS</div>
              {tab.tips.map((tip, i) => (
                <div key={i} style={{
                  padding: '10px 14px', borderRadius: 10, marginBottom: 8,
                  background: `${tabColor}08`, border: `1px solid ${tabColor}20`,
                  fontSize: '0.82rem', color: 'var(--c-text)', lineHeight: 1.5,
                  opacity: tipsVisible ? 1 : 0,
                  animation: tipsVisible ? `tipFadeIn 0.4s ease both` : 'none',
                  animationDelay: `${i * 0.15}s`,
                  transition: 'opacity 0.3s',
                }}>
                  {tip}
                </div>
              ))}
            </div>
          </div>

          {/* Preview Panel */}
          <div style={{ animation: 'tabSlide 0.4s ease both' }}>
            <div className="glass-card" style={{ padding: 24, marginBottom: 'var(--sp-4)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--c-text-off)', fontWeight: 700, letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' }}>GAME PREVIEW</div>
              {tab.preview ? <MiniPreview type={tab.preview} /> : (
                <div style={{ textAlign: 'center', padding: 'var(--sp-8)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎮</div>
                  <div style={{ color: 'var(--c-text-dim)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                    Welcome to Code Arena!<br />Select a game tab to preview its mechanics.
                  </div>
                  <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {TABS.slice(1).map(t => (
                      <div key={t.id} style={{ padding: '10px 14px', borderRadius: 10, background: `${t.color}08`, border: `1px solid ${t.color}20`, textAlign: 'center' }}>
                        <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>{t.label.split(' ')[0]}</div>
                        <div style={{ fontSize: '0.7rem', color: t.color, fontWeight: 600 }}>{t.label.split(' ').slice(1).join(' ')}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Reference */}
            {tab.id !== 'start' && (
              <div className="glass-card" style={{ padding: 20 }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--c-text-off)', fontWeight: 700, letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase' }}>QUICK REFERENCE</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Rounds', value: tab.id === 'pixel_code' ? '5' : tab.id === 'stack_smash' ? '4' : tab.id === 'emoji_escape' ? '6' : '4' },
                    { label: 'Timer', value: tab.id === 'pixel_code' ? '40s' : tab.id === 'stack_smash' ? '35–60s' : tab.id === 'emoji_escape' ? '25s' : '30+20s' },
                    { label: 'Players', value: tab.id === 'meme_wars' ? '3–8' : '2–8' },
                    { label: 'Category', value: tab.id === 'pixel_code' || tab.id === 'stack_smash' ? 'Coding' : 'Fun' },
                  ].map(s => (
                    <div key={s.label} style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--f-mono)', fontWeight: 700, color: tabColor, fontSize: '0.95rem' }}>{s.value}</div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--c-text-off)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 'var(--sp-8)', textAlign: 'center' }}>
          <button className="btn-neon" onClick={handleBack} style={{ borderColor: tabColor, color: tabColor }}>
            READY TO PLAY →
          </button>
        </div>
      </div>
    </div>
  );
}
