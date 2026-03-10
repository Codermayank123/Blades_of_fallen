export default function HowToPlayScreen({ onBack }) {
    const games = [
        {
            title: 'Arena Duel', color: '#ef4444', players: '2 Players',
            rules: [
                'WASD or Arrow Keys to move your fighter',
                'Space or J to attack your opponent',
                'Reduce opponent HP to zero to win',
                '60 second time limit — highest HP wins on timeout',
                'Win matches to climb the ELO leaderboard'
            ]
        },
        {
            title: 'Bomb Relay Royale', color: '#FF3D81', players: '3–10 Players',
            rules: [
                'A ticking bomb randomly starts with one player',
                'Click on another player\'s avatar to pass the bomb to them',
                'You must pass before the timer runs out or you explode!',
                'Each round the fuse gets shorter — act fast!',
                'Last player standing wins the game'
            ]
        },
        {
            title: 'Gem Heist Arena', color: '#7B61FF', players: '2–8 Players',
            rules: [
                'WASD or Arrow Keys to move around the arena',
                'Walk over gems to collect them (max 5 at a time)',
                'Return to your base zone (dashed circle) to deposit and score',
                'Bump into opponents while moving fast to make them drop their gems!',
                'Gold gems spawn every 30 seconds — they\'re worth 3x!',
                'Most deposited gems when time runs out wins!'
            ]
        },
        {
            title: 'Neon Drift Racing', color: '#00F5FF', players: '2–12 Players',
            rules: [
                'Arrow Keys or WASD to steer and accelerate',
                'Complete 3 full laps around the track to win',
                'Pass through all checkpoints in order to count a lap',
                'Going off-road slows you down dramatically — stay on the track!',
                'Drifting builds your boost meter — press Shift/Space when 50%+ to activate',
                'Collect power-ups on the track: ⚡Speed Boost, 🛢️Oil Slick, 🛡️Shield, ⭐Bonus Points, 🚀Mini Turbo',
                'Oil slicks reduce your speed and mess up your steering — avoid the pink ones!',
                'First to finish 3 laps wins, or most progress at time limit'
            ]
        },
        {
            title: 'Cricket Clash Pro', color: '#00FF9C', players: '2 Players',
            rules: [
                'Two innings — each player bats and bowls once (12 balls per innings)',
                'Bowler: choose speed (fast/medium/slow), line & length within 5 seconds',
                'Batter: tap/click when the timing bar is in the green sweet zone',
                'Fast balls are harder to hit but easier to score big off',
                'Full-length deliveries reward perfect timing with boundaries (4s, 6s)',
                'Second innings player must chase the first\'s total to win'
            ]
        }
    ];

    return (
        <div className="screen fade-in" style={{
            padding: 'var(--sp-4)', paddingTop: '64px',
            justifyContent: 'flex-start',
        }}>
            <div style={{ maxWidth: '650px', width: '100%', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--sp-6)' }}>
                    <h1 style={{
                        fontFamily: 'var(--f-mono)', fontSize: 'clamp(1rem, 4vw, 1.4rem)',
                        fontWeight: 800, letterSpacing: '4px',
                        color: 'var(--c-cyan)', marginBottom: 'var(--sp-2)',
                    }}>
                        HOW TO PLAY
                    </h1>
                    <p style={{ color: 'var(--c-text-off)', fontSize: '0.8rem' }}>
                        Pick a mode and jump in
                    </p>
                </div>

                {/* Getting Started */}
                <div className="panel" style={{ padding: 'var(--sp-5)', marginBottom: 'var(--sp-5)' }}>
                    <div className="section-label">Getting Started</div>
                    <ol style={{
                        color: 'var(--c-text-dim)', paddingLeft: 'var(--sp-5)',
                        lineHeight: 2, fontSize: '0.85rem',
                    }}>
                        <li>Login as Guest or with Google</li>
                        <li>Select a mode in the Hub</li>
                        <li>Create a room or Quick Match</li>
                        <li>Share room code with friends</li>
                        <li>Everyone clicks Ready — match begins</li>
                    </ol>
                </div>

                {/* Mode Guides */}
                <div className="section-label">Mode Guides</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', marginBottom: 'var(--sp-6)' }}>
                    {games.map((g, i) => (
                        <div key={i} style={{
                            padding: 'var(--sp-5)', borderRadius: 'var(--r-lg)',
                            background: 'var(--c-surface)',
                            borderLeft: `3px solid ${g.color}`,
                            border: '1px solid var(--c-border)',
                            borderLeftColor: g.color,
                        }}>
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                marginBottom: 'var(--sp-3)',
                            }}>
                                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{g.title}</span>
                                <span style={{
                                    fontSize: '0.7rem', fontWeight: 600,
                                    color: g.color,
                                }}>{g.players}</span>
                            </div>
                            <ul style={{
                                color: 'var(--c-text-dim)', paddingLeft: 'var(--sp-5)',
                                fontSize: '0.8rem', lineHeight: 1.8,
                            }}>
                                {g.rules.map((r, j) => <li key={j}>{r}</li>)}
                            </ul>
                        </div>
                    ))}
                </div>

                <button className="btn2 btn2--ghost btn2--block" onClick={onBack}>
                    Back to Hub
                </button>
            </div>
        </div>
    );
}
