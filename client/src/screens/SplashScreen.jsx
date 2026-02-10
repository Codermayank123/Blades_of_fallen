import { useState, useEffect, useRef } from 'react';

export default function SplashScreen({ onEnter }) {
    const [showButton, setShowButton] = useState(false);
    const [fadeOut, setFadeOut] = useState(false);
    const videoRef = useRef(null);

    useEffect(() => {
        // Show the "Enter" button after a short delay
        const timer = setTimeout(() => setShowButton(true), 2000);
        return () => clearTimeout(timer);
    }, []);

    const handleEnter = () => {
        setFadeOut(true);
        setTimeout(() => onEnter(), 800);
    };

    return (
        <div
            onClick={() => {
                // Try to play video on click (mobile autoplay policy)
                if (videoRef.current) {
                    videoRef.current.play().catch(() => { });
                }
            }}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                overflow: 'hidden',
                zIndex: 9999,
                opacity: fadeOut ? 0 : 1,
                transition: 'opacity 0.8s ease-out',
                cursor: 'pointer'
            }}
        >
            {/* Background Video */}
            <video
                ref={videoRef}
                autoPlay
                loop
                muted
                playsInline
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    minWidth: '100%',
                    minHeight: '100%',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'cover',
                    zIndex: -1
                }}
            >
                <source src="/video/page.mp4" type="video/mp4" />
            </video>

            {/* Dark overlay */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.7) 100%)',
                zIndex: 0
            }} />

            {/* Content */}
            <div style={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
                padding: '20px'
            }}>
                {/* Title */}
                <h1 style={{
                    fontFamily: 'Cinzel Decorative, Cinzel, serif',
                    fontSize: 'clamp(32px, 6vw, 72px)',
                    color: '#c4a54d',
                    textShadow: '0 0 40px rgba(196, 165, 77, 0.6), 0 4px 20px rgba(0,0,0,0.8)',
                    marginBottom: '10px',
                    letterSpacing: '4px',
                    animation: 'titleGlow 3s ease-in-out infinite alternate'
                }}>
                    BLADES OF THE FALLEN
                </h1>

                {/* Subtitle */}
                <p style={{
                    fontFamily: 'Cinzel, serif',
                    fontSize: 'clamp(14px, 2vw, 22px)',
                    color: 'rgba(255,255,255,0.7)',
                    letterSpacing: '6px',
                    textTransform: 'uppercase',
                    marginBottom: '60px'
                }}>
                    Prepare for Battle
                </p>

                {/* Sword divider */}
                <div style={{
                    fontSize: 'clamp(24px, 4vw, 48px)',
                    marginBottom: '40px',
                    animation: 'swordPulse 2s ease-in-out infinite'
                }}>
                    ⚔️
                </div>

                {/* Enter button */}
                {showButton && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEnter();
                        }}
                        style={{
                            fontFamily: 'Cinzel, serif',
                            fontSize: 'clamp(16px, 2.5vw, 24px)',
                            padding: '16px 60px',
                            background: 'linear-gradient(135deg, rgba(196,165,77,0.2) 0%, rgba(196,165,77,0.05) 100%)',
                            border: '2px solid rgba(196, 165, 77, 0.6)',
                            color: '#c4a54d',
                            cursor: 'pointer',
                            letterSpacing: '4px',
                            textTransform: 'uppercase',
                            borderRadius: '4px',
                            transition: 'all 0.3s ease',
                            animation: 'fadeInUp 0.8s ease-out'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'linear-gradient(135deg, rgba(196,165,77,0.4) 0%, rgba(196,165,77,0.1) 100%)';
                            e.target.style.borderColor = '#c4a54d';
                            e.target.style.boxShadow = '0 0 30px rgba(196, 165, 77, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'linear-gradient(135deg, rgba(196,165,77,0.2) 0%, rgba(196,165,77,0.05) 100%)';
                            e.target.style.borderColor = 'rgba(196, 165, 77, 0.6)';
                            e.target.style.boxShadow = 'none';
                        }}
                    >
                        Enter the Arena
                    </button>
                )}
            </div>

            <style>{`
                @keyframes titleGlow {
                    0% { text-shadow: 0 0 20px rgba(196, 165, 77, 0.4), 0 4px 20px rgba(0,0,0,0.8); }
                    100% { text-shadow: 0 0 60px rgba(196, 165, 77, 0.8), 0 4px 20px rgba(0,0,0,0.8); }
                }
                @keyframes swordPulse {
                    0%, 100% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.2); opacity: 1; }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
