import { useState, useEffect, useRef } from 'react';

export default function SplashScreen({ onEnter }) {
    const [showButton, setShowButton] = useState(false);
    const [fading, setFading] = useState(false);
    const videoRef = useRef(null);

    useEffect(() => {
        const timer = setTimeout(() => setShowButton(true), 2000);
        return () => clearTimeout(timer);
    }, []);

    const handleEnter = () => {
        setFading(true);
        setTimeout(() => onEnter(), 600);
    };

    // Generate floating particles matching Cyber Arena style
    const particles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: 2 + Math.random() * 3,
        delay: `${Math.random() * 4}s`,
        dur: `${3 + Math.random() * 4}s`,
    }));

    return (
        <div style={{
            position: 'fixed', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, var(--c-bg) 0%, var(--c-surface) 40%, var(--c-bg) 100%)',
            transition: 'opacity 0.6s ease',
            opacity: fading ? 0 : 1,
            zIndex: 9999, overflow: 'hidden',
        }}>
            {/* Background video */}
            <video
                ref={videoRef}
                autoPlay muted loop playsInline
                style={{
                    position: 'absolute', inset: 0,
                    width: '100%', height: '100%',
                    objectFit: 'cover', opacity: 0.1,
                }}
                onError={() => { if (videoRef.current) videoRef.current.style.display = 'none'; }}
            >
                <source src="/splash-bg.mp4" type="video/mp4" />
            </video>

            {/* Animated grid overlay */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.06 }}>
                {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} style={{
                        position: 'absolute', top: `${i * 5}%`, left: 0, right: 0,
                        height: '1px',
                        background: 'linear-gradient(90deg, transparent, var(--c-primary), transparent)',
                    }} />
                ))}
                {Array.from({ length: 16 }).map((_, i) => (
                    <div key={`v${i}`} style={{
                        position: 'absolute', left: `${i * 6.25}%`, top: 0, bottom: 0,
                        width: '1px',
                        background: 'linear-gradient(180deg, transparent, var(--c-cyan), transparent)',
                    }} />
                ))}
            </div>

            {/* Central glow (matching WelcomeScreen) */}
            <div style={{
                position: 'absolute',
                width: '400px', height: '400px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, rgba(34,211,238,0.04) 50%, transparent 70%)',
                filter: 'blur(50px)',
                pointerEvents: 'none',
                animation: 'splashGlowPulse 3s ease-in-out infinite',
            }} />

            {/* Floating particles */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {particles.map(p => (
                    <div key={p.id} style={{
                        position: 'absolute', left: p.left, top: p.top,
                        width: p.size, height: p.size,
                        borderRadius: '50%',
                        background: p.id % 2 === 0 ? 'var(--c-primary)' : 'var(--c-cyan)',
                        opacity: 0.4,
                        animation: `splashFloat ${p.dur} ease-in-out ${p.delay} infinite alternate`,
                    }} />
                ))}
            </div>

            {/* Content */}
            <div style={{
                position: 'relative', zIndex: 1,
                textAlign: 'center', padding: 'var(--sp-8)',
            }}>
                <h1 style={{
                    fontFamily: 'var(--f-mono)',
                    fontSize: 'clamp(1.6rem, 6vw, 3rem)',
                    fontWeight: 900,
                    letterSpacing: '8px',
                    background: 'linear-gradient(135deg, var(--c-primary-l), var(--c-cyan))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginBottom: 'var(--sp-3)',
                    animation: 'fadeIn 1s ease',
                }}>
                    CODE ARENA
                </h1>

                <p style={{
                    color: 'var(--c-text-off)',
                    fontSize: '0.85rem',
                    letterSpacing: '5px',
                    textTransform: 'uppercase',
                    marginBottom: 'var(--sp-12)',
                    animation: 'fadeIn 1.5s ease',
                }}>
                    Code. Battle. Dominate.
                </p>

                {showButton && (
                    <button
                        className="btn2 btn2--primary btn2--lg"
                        onClick={handleEnter}
                        style={{
                            padding: '16px 48px',
                            letterSpacing: '4px',
                            fontSize: '0.9rem',
                            animation: 'fadeIn 0.5s ease',
                        }}
                    >
                        BEGIN
                    </button>
                )}
            </div>

            <style>{`
                @keyframes splashGlowPulse {
                    0%, 100% { transform: scale(1); opacity: 0.6; }
                    50% { transform: scale(1.15); opacity: 1; }
                }
                @keyframes splashFloat {
                    0% { transform: translateY(0) translateX(0); }
                    100% { transform: translateY(-20px) translateX(10px); }
                }
            `}</style>
        </div>
    );
}
