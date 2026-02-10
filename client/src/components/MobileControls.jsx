import { useRef, useCallback, useEffect, useState } from 'react';

export default function MobileControls({ send, isPlaying }) {
    const [isMobile, setIsMobile] = useState(false);
    const inputStateRef = useRef({
        left: false,
        right: false,
        jump: false,
        attack: false
    });
    const seqRef = useRef(0);
    const attackCooldownRef = useRef(false);

    // Detect mobile/touch device
    useEffect(() => {
        const checkMobile = () => {
            const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const isSmallScreen = window.innerWidth <= 1024;
            setIsMobile(hasTouchScreen || isSmallScreen);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const sendInput = useCallback(() => {
        if (!isPlaying || !send) return;
        send({
            type: 'INPUT',
            seq: seqRef.current++,
            tick: Date.now(),
            inputs: { ...inputStateRef.current }
        });
    }, [send, isPlaying]);

    // Movement handlers
    const handleLeftStart = useCallback((e) => {
        e.preventDefault();
        inputStateRef.current.left = true;
        inputStateRef.current.right = false;
        sendInput();
    }, [sendInput]);

    const handleLeftEnd = useCallback((e) => {
        e.preventDefault();
        inputStateRef.current.left = false;
        sendInput();
    }, [sendInput]);

    const handleRightStart = useCallback((e) => {
        e.preventDefault();
        inputStateRef.current.right = true;
        inputStateRef.current.left = false;
        sendInput();
    }, [sendInput]);

    const handleRightEnd = useCallback((e) => {
        e.preventDefault();
        inputStateRef.current.right = false;
        sendInput();
    }, [sendInput]);

    const handleJump = useCallback((e) => {
        e.preventDefault();
        if (!inputStateRef.current.jump) {
            inputStateRef.current.jump = true;
            sendInput();
            setTimeout(() => {
                inputStateRef.current.jump = false;
            }, 100);
        }
    }, [sendInput]);

    const handleAttack = useCallback((e) => {
        e.preventDefault();
        if (!attackCooldownRef.current) {
            inputStateRef.current.attack = true;
            attackCooldownRef.current = true;
            sendInput();
            setTimeout(() => {
                inputStateRef.current.attack = false;
            }, 50);
            setTimeout(() => {
                attackCooldownRef.current = false;
            }, 800);
        }
    }, [sendInput]);

    if (!isMobile || !isPlaying) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '140px',
            zIndex: 1000,
            pointerEvents: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none'
        }}>
            {/* Left side - D-Pad */}
            <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                pointerEvents: 'auto'
            }}>
                {/* Left button */}
                <button
                    onTouchStart={handleLeftStart}
                    onTouchEnd={handleLeftEnd}
                    onTouchCancel={handleLeftEnd}
                    style={dpadBtnStyle}
                >
                    <span style={{ fontSize: '28px' }}>◀</span>
                </button>

                {/* Right button */}
                <button
                    onTouchStart={handleRightStart}
                    onTouchEnd={handleRightEnd}
                    onTouchCancel={handleRightEnd}
                    style={dpadBtnStyle}
                >
                    <span style={{ fontSize: '28px' }}>▶</span>
                </button>
            </div>

            {/* Right side - Action buttons */}
            <div style={{
                position: 'absolute',
                bottom: '20px',
                right: '20px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-end',
                pointerEvents: 'auto'
            }}>
                {/* Jump button */}
                <button
                    onTouchStart={handleJump}
                    style={{
                        ...actionBtnStyle,
                        background: 'radial-gradient(circle, rgba(34,197,94,0.4) 0%, rgba(34,197,94,0.15) 100%)',
                        borderColor: 'rgba(34,197,94,0.6)',
                        marginBottom: '50px'
                    }}
                >
                    <span style={{ fontSize: '20px' }}>⬆</span>
                    <span style={{ fontSize: '10px', marginTop: '2px' }}>JUMP</span>
                </button>

                {/* Attack button */}
                <button
                    onTouchStart={handleAttack}
                    style={{
                        ...actionBtnStyle,
                        width: '80px',
                        height: '80px',
                        background: 'radial-gradient(circle, rgba(239,68,68,0.4) 0%, rgba(239,68,68,0.15) 100%)',
                        borderColor: 'rgba(239,68,68,0.6)'
                    }}
                >
                    <span style={{ fontSize: '24px' }}>⚔️</span>
                    <span style={{ fontSize: '10px', marginTop: '2px' }}>ATK</span>
                </button>
            </div>

            <style>{`
                .mobile-btn:active {
                    transform: scale(0.9) !important;
                    filter: brightness(1.3) !important;
                }
            `}</style>
        </div>
    );
}

const dpadBtnStyle = {
    width: '70px',
    height: '70px',
    borderRadius: '16px',
    border: '2px solid rgba(196, 165, 77, 0.5)',
    background: 'radial-gradient(circle, rgba(196,165,77,0.3) 0%, rgba(196,165,77,0.1) 100%)',
    color: '#c4a54d',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    touchAction: 'none',
    WebkitTapHighlightColor: 'transparent',
    backdropFilter: 'blur(8px)',
    transition: 'transform 0.1s, filter 0.1s'
};

const actionBtnStyle = {
    width: '65px',
    height: '65px',
    borderRadius: '50%',
    border: '2px solid',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    touchAction: 'none',
    WebkitTapHighlightColor: 'transparent',
    backdropFilter: 'blur(8px)',
    fontFamily: 'Cinzel, serif',
    transition: 'transform 0.1s, filter 0.1s'
};
