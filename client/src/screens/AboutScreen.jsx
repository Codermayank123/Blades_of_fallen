import { GAME_MODE_META, GAME_CATEGORIES } from '../config/brand.js';
import { GAME_ICONS } from '../components/GameIcons.jsx';

export default function AboutScreen({ onBack }) {
    const games = [
        {
            id: 'duel',
            title: 'Arena Duel',
            desc: 'Classic real-time 1v1 combat — attack, defend, and outlast your opponent in a live duel with health bars and combo moves.',
            color: '#7B2FBE', category: 'Action',
        },
        {
            id: 'pixel_code',
            title: 'Pixel Code',
            desc: 'A pixel-art grid appears on screen — pick which JavaScript, Python, or Rust snippet generates that exact output. Trace loops in your head!',
            color: '#00FF88', category: 'Coding',
        },
        {
            id: 'stack_smash',
            title: 'Stack Smash',
            desc: 'A crash dump flashes on screen. Find which line of the call stack is causing the overflow, memory leak, or infinite loop — before time runs out.',
            color: '#FF6B6B', category: 'Coding',
        },
        {
            id: 'emoji_escape',
            title: 'Emoji Escape',
            desc: 'A sequence of emojis encodes a movie, song, or coding joke. Type the correct answer first — wrong answers add a 5-second penalty!',
            color: '#FFDD00', category: 'Fun',
        },
        {
            id: 'meme_wars',
            title: 'Meme Wars',
            desc: 'See a meme template, write the funniest caption, then vote for the best. 3 points per vote received — pure comedy wins, no politics.',
            color: '#FF69B4', category: 'Fun',
        },
    ];

    const features = [
        { title: 'Real-Time Multiplayer', desc: 'WebSocket-powered — sub-100ms latency across all game modes', color: 'var(--c-cyan)' },
        { title: '5 Game Modes', desc: '1 action duel · 2 coding challenges · 2 creative/fun games', color: 'var(--c-primary-l)' },
        { title: 'ELO Ranking System', desc: 'Competitive matchmaking and global leaderboard — every match counts', color: 'var(--c-amber)' },
        { title: 'AI Assistant (ARIA)', desc: 'Interactive animated robot guides you through every game mechanic', color: '#00FFFF' },
        { title: 'Avatar Builder', desc: 'Fully customizable SVG avatar — face, hair, outfit, and accessories', color: 'var(--c-green)' },
        { title: 'Cross-Platform', desc: 'Responsive UI from 320px mobile to 4K desktop — touch-friendly', color: 'var(--c-rose)' },
    ];

    return (
        <div className="screen fade-in" style={{ padding: 'var(--sp-4)', paddingTop: '64px', justifyContent: 'flex-start' }}>
            <div style={{ maxWidth: '680px', width: '100%', margin: '0 auto' }}>

                {/* Hero */}
                <div style={{ textAlign: 'center', marginBottom: 'var(--sp-8)' }}>
                    <h1 style={{
                        fontFamily: 'var(--f-heading)', fontSize: 'clamp(1.2rem, 4vw, 1.6rem)',
                        fontWeight: 800, letterSpacing: '4px',
                        color: 'var(--c-cyan)', marginBottom: 'var(--sp-3)',
                    }}>
                        ABOUT CODE ARENA
                    </h1>
                    <p style={{ color: 'var(--c-text-dim)', fontSize: '0.87rem', lineHeight: 1.75, maxWidth: 500, margin: '0 auto' }}>
                        Code Arena is a competitive multiplayer platform where developers battle
                        across five unique games spanning action combat, coding challenges, and
                        creative fun. Play live against real opponents — every match sharpens your skills.
                    </p>
                </div>

                {/* Game Modes */}
                <div className="section-label">Game Modes</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', marginBottom: 'var(--sp-7)' }}>
                    {games.map((g) => {
                        const Icon = GAME_ICONS[g.id];
                        return (
                            <div key={g.id} style={{
                                display: 'flex', alignItems: 'center', gap: 'var(--sp-4)',
                                padding: 'var(--sp-4) var(--sp-5)',
                                background: `${g.color}06`,
                                border: `1px solid ${g.color}20`,
                                borderLeft: `3px solid ${g.color}`,
                                borderRadius: 'var(--r-md)',
                                transition: 'all 0.2s',
                            }}>
                                <div style={{ flexShrink: 0, width: 36, display: 'flex', alignItems: 'center' }}>
                                    {Icon ? <Icon size={32} /> : null}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 3 }}>
                                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: g.color }}>{g.title}</span>
                                        <span style={{ fontSize: '0.55rem', fontWeight: 800, letterSpacing: 2, color: g.color, opacity: 0.7, padding: '1px 7px', borderRadius: 999, background: `${g.color}15`, border: `1px solid ${g.color}20` }}>
                                            {g.category.toUpperCase()}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--c-text-off)', lineHeight: 1.55 }}>{g.desc}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Features */}
                <div className="section-label">Platform Features</div>
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: 'var(--sp-3)', marginBottom: 'var(--sp-6)',
                }}>
                    {features.map((f, i) => (
                        <div key={i} className="stat-card" style={{ textAlign: 'left', padding: 'var(--sp-4)', borderTop: `2px solid ${f.color}` }}>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: f.color, marginBottom: 'var(--sp-1)' }}>{f.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--c-text-off)', lineHeight: 1.55 }}>{f.desc}</div>
                        </div>
                    ))}
                </div>

                {/* Tech Stack */}
                <div className="section-label">Tech Stack</div>
                <div className="panel" style={{ padding: 'var(--sp-4)', marginBottom: 'var(--sp-6)' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
                        {['React 18', 'Vite', 'Node.js', 'Express', 'WebSocket (ws)', 'MongoDB', 'JWT Auth', 'Web Speech API', 'Canvas API'].map(t => (
                            <span key={t} className="badge">{t}</span>
                        ))}
                    </div>
                </div>

                <button className="btn2 btn2--ghost btn2--block" onClick={onBack}>
                    Back to Arcade
                </button>
            </div>
        </div>
    );
}
