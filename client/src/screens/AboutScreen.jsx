export default function AboutScreen({ onBack }) {
    const features = [
        { title: 'Real-Time Multiplayer', desc: 'WebSocket-powered with sub-100ms latency', color: 'var(--c-primary-l)' },
        { title: 'Five Game Modes', desc: 'Duel, Quiz, Word Chain, Reaction, Memory', color: 'var(--c-cyan)' },
        { title: 'ELO Ranking System', desc: 'Competitive matchmaking and global leaderboard', color: 'var(--c-amber)' },
        { title: 'Cross-Platform', desc: 'Works on desktop and mobile browsers', color: 'var(--c-green)' },
    ];

    return (
        <div className="screen fade-in" style={{
            padding: 'var(--sp-4)', paddingTop: '64px',
            justifyContent: 'flex-start',
        }}>
            <div style={{ maxWidth: '600px', width: '100%', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--sp-8)' }}>
                    <h1 style={{
                        fontFamily: 'var(--f-mono)', fontSize: 'clamp(1.2rem, 4vw, 1.6rem)',
                        fontWeight: 800, letterSpacing: '4px',
                        color: 'var(--c-primary-l)', marginBottom: 'var(--sp-2)',
                    }}>
                        ABOUT THE ARENA
                    </h1>
                    <p style={{
                        color: 'var(--c-text-dim)', fontSize: '0.85rem', lineHeight: 1.7,
                    }}>
                        Nexus Arena is a multiplayer game platform featuring five
                        distinct competitive modes. Built for players who seek fast-paced,
                        skill-based challenges.
                    </p>
                </div>

                <div className="section-label">Features</div>
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                    gap: 'var(--sp-3)', marginBottom: 'var(--sp-6)',
                }}>
                    {features.map((f, i) => (
                        <div key={i} className="stat-card" style={{ textAlign: 'left', padding: 'var(--sp-5)' }}>
                            <div style={{
                                fontWeight: 700, fontSize: '0.9rem', color: f.color,
                                marginBottom: 'var(--sp-1)',
                            }}>{f.title}</div>
                            <div style={{
                                fontSize: '0.78rem', color: 'var(--c-text-off)', lineHeight: 1.5,
                            }}>{f.desc}</div>
                        </div>
                    ))}
                </div>

                <div className="section-label">Tech Stack</div>
                <div className="panel" style={{ padding: 'var(--sp-5)', marginBottom: 'var(--sp-6)' }}>
                    <div style={{
                        display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)',
                    }}>
                        {['React', 'Vite', 'Node.js', 'Express', 'WebSocket', 'MongoDB', 'Canvas API'].map(t => (
                            <span key={t} className="badge">{t}</span>
                        ))}
                    </div>
                </div>

                <button className="btn2 btn2--ghost btn2--block" onClick={onBack}>
                    Back to Hub
                </button>
            </div>
        </div>
    );
}
