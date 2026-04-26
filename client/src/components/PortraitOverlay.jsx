/**
 * Shared portrait-mode overlay prompting the user to rotate their device.
 * Rendered by game screens when useLandscapeLock().isPortrait is true.
 */
export default function PortraitOverlay() {
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0,
            width: '100vw', height: '100vh',
            background: 'linear-gradient(135deg, #0a0e27 0%, #1a1145 40%, #0d1b2a 100%)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, color: 'white', textAlign: 'center', padding: '20px',
        }}>
            <div style={{
                fontSize: '60px',
                animation: 'rotatePhone 2s ease-in-out infinite',
                marginBottom: '24px',
            }}>
                📱
            </div>
            <h2 style={{
                fontFamily: 'var(--f-mono), Orbitron, sans-serif',
                color: 'var(--c-primary-l, #7B61FF)',
                fontSize: 'clamp(18px, 4vw, 28px)',
                marginBottom: '12px',
                textShadow: '0 0 20px rgba(123, 97, 255, 0.4)',
            }}>
                Rotate Your Device
            </h2>
            <p style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: 'clamp(12px, 2.5vw, 16px)',
                maxWidth: '280px',
            }}>
                Turn your phone sideways for the best gaming experience
            </p>
            <style>{`
                @keyframes rotatePhone {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-30deg); }
                    75% { transform: rotate(-90deg); }
                }
            `}</style>
        </div>
    );
}
