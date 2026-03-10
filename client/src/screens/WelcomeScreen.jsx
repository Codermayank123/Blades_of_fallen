import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function WelcomeScreen({ onEnter }) {
    const containerRef = useRef(null);
    const titleRef = useRef(null);
    const subtitleRef = useRef(null);
    const btnRef = useRef(null);
    const particlesRef = useRef(null);
    const glowRef = useRef(null);
    const linesRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

            // Background grid lines fade in
            tl.fromTo('.welcome-line',
                { scaleX: 0, opacity: 0 },
                { scaleX: 1, opacity: 0.15, duration: 1.2, stagger: 0.08 },
                0
            );

            // Central glow pulse
            tl.fromTo(glowRef.current,
                { scale: 0, opacity: 0 },
                { scale: 1, opacity: 1, duration: 1.5, ease: 'power2.out' },
                0.3
            );

            // Title letters animate in
            tl.fromTo('.welcome-char',
                { y: 80, opacity: 0, rotateX: -90 },
                { y: 0, opacity: 1, rotateX: 0, duration: 0.8, stagger: 0.04, ease: 'back.out(1.7)' },
                0.8
            );

            // Subtitle slide up
            tl.fromTo(subtitleRef.current,
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8 },
                1.8
            );

            // Floating particles
            tl.fromTo('.welcome-particle',
                { scale: 0, opacity: 0 },
                { scale: 1, opacity: 0.6, duration: 0.6, stagger: { each: 0.05, from: 'random' } },
                1.2
            );

            // Button entrance
            tl.fromTo(btnRef.current,
                { y: 40, opacity: 0, scale: 0.8 },
                { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'elastic.out(1, 0.5)' },
                2.2
            );

            // Continuous particle float
            gsap.to('.welcome-particle', {
                y: 'random(-30, 30)',
                x: 'random(-20, 20)',
                duration: 'random(3, 6)',
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
                stagger: { each: 0.3, from: 'random' }
            });

            // Glow pulse loop
            gsap.to(glowRef.current, {
                scale: 1.1,
                opacity: 0.7,
                duration: 2.5,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut'
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    const handleEnter = () => {
        const tl = gsap.timeline({
            onComplete: () => {
                localStorage.setItem('hasSeenIntro', 'true');
                onEnter();
            }
        });
        tl.to(containerRef.current, {
            scale: 1.05, opacity: 0, duration: 0.6, ease: 'power2.in'
        });
    };

    const title = 'NEXUS ARENA';
    const particles = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: 2 + Math.random() * 4,
        color: ['var(--c-primary)', 'var(--c-cyan)', 'var(--c-amber)', 'var(--c-green)', 'var(--c-rose)'][i % 5]
    }));

    const lines = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        top: `${8 + i * 8}%`,
        rotate: i % 3 === 0 ? '0deg' : i % 3 === 1 ? '90deg' : '45deg'
    }));

    return (
        <div ref={containerRef} style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'linear-gradient(135deg, var(--c-bg) 0%, var(--c-surface) 40%, var(--c-bg) 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', cursor: 'default'
        }}>
            {/* Animated grid lines */}
            <div ref={linesRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {lines.map(l => (
                    <div key={l.id} className="welcome-line" style={{
                        position: 'absolute', top: l.top, left: 0, right: 0,
                        height: '1px',
                        background: 'linear-gradient(90deg, transparent, var(--c-primary), transparent)',
                        transform: `rotate(${l.rotate})`, transformOrigin: 'center',
                        opacity: 0.3,
                    }} />
                ))}
            </div>

            {/* Central glow */}
            <div ref={glowRef} style={{
                position: 'absolute',
                width: '500px', height: '500px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, rgba(34,211,238,0.05) 50%, transparent 70%)',
                filter: 'blur(60px)',
                pointerEvents: 'none'
            }} />

            {/* Floating particles */}
            <div ref={particlesRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {particles.map(p => (
                    <div key={p.id} className="welcome-particle" style={{
                        position: 'absolute', left: p.left, top: p.top,
                        width: p.size, height: p.size,
                        borderRadius: '50%',
                        background: p.color,
                        boxShadow: `0 0 ${p.size * 3}px ${p.color}66`,
                    }} />
                ))}
            </div>

            {/* Title */}
            <div ref={titleRef} style={{
                display: 'flex', gap: '4px', marginBottom: '16px',
                perspective: '600px', position: 'relative', zIndex: 2,
            }}>
                {title.split('').map((char, i) => (
                    <span key={i} className="welcome-char" style={{
                        display: 'inline-block',
                        fontFamily: "var(--f-mono)",
                        fontSize: 'clamp(2.5rem, 7vw, 5rem)',
                        fontWeight: 900,
                        letterSpacing: '6px',
                        background: 'linear-gradient(135deg, var(--c-primary), var(--c-cyan), var(--c-amber))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        textShadow: 'none',
                        minWidth: char === ' ' ? '20px' : 'auto',
                    }}>
                        {char}
                    </span>
                ))}
            </div>

            {/* Subtitle */}
            <div ref={subtitleRef} style={{
                fontFamily: "var(--f-body)",
                fontSize: 'clamp(0.8rem, 2vw, 1.1rem)',
                color: 'var(--c-text-off)',
                letterSpacing: '8px',
                textTransform: 'uppercase',
                marginBottom: '48px',
                position: 'relative', zIndex: 2,
            }}>
                MULTIPLAYER GAMING ARENA
            </div>

            {/* Enter button */}
            <button
                ref={btnRef}
                onClick={handleEnter}
                style={{
                    position: 'relative', zIndex: 2,
                    padding: '16px 48px',
                    fontSize: '0.9rem',
                    fontFamily: "var(--f-mono)",
                    fontWeight: 700,
                    letterSpacing: '4px',
                    textTransform: 'uppercase',
                    color: '#fff',
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(34,211,238,0.15))',
                    border: '1px solid rgba(139,92,246,0.4)',
                    borderRadius: 'var(--r-md)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(10px)',
                    boxShadow: 'var(--shadow-glow)',
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.35), rgba(34,211,238,0.25))';
                    e.currentTarget.style.boxShadow = '0 0 50px rgba(139,92,246,0.3), inset 0 1px 0 rgba(255,255,255,0.15)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(34,211,238,0.15))';
                    e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
                    e.currentTarget.style.transform = 'translateY(0)';
                }}
            >
                Enter Arena
            </button>

            {/* Skip hint */}
            <div style={{
                position: 'absolute', bottom: '32px',
                fontSize: '0.65rem', color: 'var(--c-text-off)',
                letterSpacing: '3px', textTransform: 'uppercase',
            }}>
                FIRST TIME WELCOME
            </div>
        </div>
    );
}
