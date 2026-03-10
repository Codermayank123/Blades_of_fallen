import { useRef, useState, useEffect, useCallback } from 'react';
import { useGameLoop } from '../hooks/useGameLoop';
import { useInputHandler } from '../hooks/useInputHandler';
import { useAudio } from '../hooks/useAudio';
import { GameRenderer } from '../game/GameRenderer';
import MobileControls from '../components/MobileControls';

export default function GameScreen({ send, playerId, roomInfo, gameState, onArenaReady }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const rendererRef = useRef(null);
    const [timer, setTimer] = useState(60);
    const [assetsLoaded, setAssetsLoaded] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showIntro, setShowIntro] = useState(true);
    const [sfxVol, setSfxVol] = useState(80);
    const [musicVol, setMusicVol] = useState(30);
    const [canvasSize, setCanvasSize] = useState({ width: 1024, height: 576 });
    const [isPortrait, setIsPortrait] = useState(false);
    const lastHealthRef = useRef({});

    const { playSFX, playMusic, stopMusic, setSFXVolume, setMusicVolume, toggleMute } = useAudio();

    // Force landscape on mobile
    useEffect(() => {
        // Try to lock orientation using Screen Orientation API
        const lockLandscape = async () => {
            try {
                if (screen.orientation && screen.orientation.lock) {
                    await screen.orientation.lock('landscape');
                    console.log('Screen locked to landscape');
                }
            } catch (e) {
                // Orientation lock not supported or not in fullscreen
                console.log('Orientation lock not available:', e.message);
            }
        };

        // Try fullscreen + landscape lock on mobile
        const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (isMobile) {
            lockLandscape();

            // Try requesting fullscreen for orientation lock to work
            const el = document.documentElement;
            if (el.requestFullscreen) {
                el.requestFullscreen().then(() => lockLandscape()).catch(() => { });
            }
        }

        // Check if portrait
        const checkOrientation = () => {
            const portrait = window.innerHeight > window.innerWidth;
            setIsPortrait(portrait);
        };

        checkOrientation();
        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', checkOrientation);

        return () => {
            window.removeEventListener('resize', checkOrientation);
            window.removeEventListener('orientationchange', checkOrientation);
            // Unlock orientation when leaving game
            if (screen.orientation && screen.orientation.unlock) {
                try { screen.orientation.unlock(); } catch (e) { }
            }
            if (document.fullscreenElement) {
                try { document.exitFullscreen(); } catch (e) { }
            }
        };
    }, []);

    // Handle window resize for TRULY full-screen canvas
    const updateCanvasSize = useCallback(() => {
        const padding = 20;
        const healthBarHeight = 70;
        const maxWidth = window.innerWidth - padding;
        const maxHeight = window.innerHeight - healthBarHeight - padding;

        // Maintain 16:9 aspect ratio
        const aspectRatio = 16 / 9;
        let width = maxWidth;
        let height = width / aspectRatio;

        if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
        }

        // On mobile portrait, don't enforce minimum - let it be smaller
        const isMobilePortrait = window.innerHeight > window.innerWidth && window.innerWidth < 768;
        if (!isMobilePortrait) {
            width = Math.max(width, 640);
            height = Math.max(height, 360);
        }

        setCanvasSize({ width: Math.floor(width), height: Math.floor(height) });
    }, []);

    // Initialize and resize
    useEffect(() => {
        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
        return () => window.removeEventListener('resize', updateCanvasSize);
    }, [updateCanvasSize]);

    // Initialize renderer
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        rendererRef.current = new GameRenderer(ctx, canvasSize.width, canvasSize.height);
        rendererRef.current.loadAssets().then(() => {
            setAssetsLoaded(true);
            playMusic();
            // Tell server this client's arena is ready
            if (onArenaReady) onArenaReady();
        });

        return () => {
            stopMusic();
        };
    }, [playMusic, stopMusic, onArenaReady]);

    // Update renderer size when canvas size changes
    useEffect(() => {
        if (rendererRef.current) {
            rendererRef.current.setSize(canvasSize.width, canvasSize.height);
        }
    }, [canvasSize]);

    // Update timer from game state
    useEffect(() => {
        if (gameState?.timer !== undefined) {
            setTimer(gameState.timer);
        }
    }, [gameState?.timer]);

    // Play sound effects based on game events
    useEffect(() => {
        if (!gameState?.players) return;

        gameState.players.forEach(player => {
            const prevHealth = lastHealthRef.current[player.id] ?? 100;

            if (player.health < prevHealth) {
                playSFX('hit');
            }

            if (player.isAttacking && player.attackFrame === 0) {
                playSFX('attack');
            }

            if (player.dead && prevHealth > 0) {
                playSFX('death');
            }

            lastHealthRef.current[player.id] = player.health;
        });
    }, [gameState, playSFX]);

    // Handle inputs
    useInputHandler(send, true);

    // Render loop - pass deltaTime for consistent animation speed across all devices
    useGameLoop((dt) => {
        const renderer = rendererRef.current;
        if (!renderer || !assetsLoaded) return;
        renderer.render(gameState, playerId, dt);
    });

    // Clean player name - remove any ID suffixes or timestamp suffixes
    const cleanPlayerName = (name, fallback) => {
        if (!name) return fallback;

        // Remove underscore + ID suffix patterns (e.g., "JAIN_MLDTP7GF" -> "JAIN")
        // This handles the guest username pattern: username_${Date.now().toString(36)}
        let cleanName = name.split('_')[0];

        // If the result is too short or looks like an ID, use fallback
        if (cleanName.length < 2 || /^[0-9a-f-]{20,}$/i.test(cleanName)) {
            return fallback;
        }

        return cleanName.toUpperCase();
    };

    // Get player info for health bars
    const getPlayerInfo = (index) => {
        if (!gameState?.players || gameState.players.length <= index) {
            return { health: 100, username: index === 0 ? 'PLAYER 1' : 'PLAYER 2', isLocal: false };
        }
        const player = gameState.players[index];
        const fallbackName = index === 0 ? 'PLAYER 1' : 'PLAYER 2';

        return {
            health: player.health ?? 100,
            username: cleanPlayerName(player.username, fallbackName),
            isLocal: player.id === playerId
        };
    };

    const player1 = getPlayerInfo(0);
    const player2 = getPlayerInfo(1);

    // Volume handlers
    const handleSfxChange = (e) => {
        const val = parseInt(e.target.value);
        setSfxVol(val);
        setSFXVolume(val / 100);
    };

    const handleMusicChange = (e) => {
        const val = parseInt(e.target.value);
        setMusicVol(val);
        setMusicVolume(val / 100);
    };

    // Auto-hide intro overlay after a short delay as a fallback
    useEffect(() => {
        if (!assetsLoaded || !showIntro) return;
        const timeout = setTimeout(() => setShowIntro(false), 15000);
        return () => clearTimeout(timeout);
    }, [assetsLoaded, showIntro]);

    return (
        <div
            ref={containerRef}
            className="game-container fade-in"
            style={{
                width: '100vw',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                padding: '5px',
                boxSizing: 'border-box',
                overflow: 'hidden',
                background: '#000'
            }}
        >
            {/* Portrait mode overlay - prompt to rotate */}
            {isPortrait && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    color: 'white',
                    textAlign: 'center',
                    padding: '20px'
                }}>
                    <div style={{
                        fontSize: '60px',
                        animation: 'rotatePhone 2s ease-in-out infinite',
                        marginBottom: '24px'
                    }}>
                        📱
                    </div>
                    <h2 style={{
                        fontFamily: 'Cinzel, serif',
                        color: '#c4a54d',
                        fontSize: 'clamp(18px, 4vw, 28px)',
                        marginBottom: '12px',
                        textShadow: '0 0 20px rgba(196, 165, 77, 0.4)'
                    }}>
                        Rotate Your Device
                    </h2>
                    <p style={{
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: 'clamp(12px, 2.5vw, 16px)',
                        maxWidth: '280px'
                    }}>
                        Turn your phone sideways for the best arena experience
                    </p>
                    <style>{`
                        @keyframes rotatePhone {
                            0%, 100% { transform: rotate(0deg); }
                            25% { transform: rotate(-30deg); }
                            75% { transform: rotate(-90deg); }
                        }
                    `}</style>
                </div>
            )}
            {/* Settings button */}
            <button
                className="settings-btn"
                onClick={() => setShowSettings(!showSettings)}
                style={{
                    position: 'fixed',
                    top: '10px',
                    right: '10px',
                    zIndex: 100
                }}
            >
                ⚙️
            </button>

            {/* Settings panel */}
            {showSettings && (
                <div className="settings-panel" style={{
                    position: 'fixed',
                    top: '50px',
                    right: '10px'
                }}>
                    <h3>Audio Settings</h3>
                    <div className="setting-row">
                        <label>SFX Volume</label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={sfxVol}
                            onChange={handleSfxChange}
                        />
                        <span>{sfxVol}%</span>
                    </div>
                    <div className="setting-row">
                        <label>Music Volume</label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={musicVol}
                            onChange={handleMusicChange}
                        />
                        <span>{musicVol}%</span>
                    </div>
                    <button onClick={toggleMute} className="btn btn-secondary">
                        Toggle Mute
                    </button>
                </div>
            )}

            {/* Intro / controls overlay shown before the match starts */}
            {assetsLoaded && showIntro && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0, 0, 0, 0.85)',
                        padding: '24px',
                        boxSizing: 'border-box',
                    }}
                >
                    <div
                        style={{
                            maxWidth: '700px',
                            width: '100%',
                            borderRadius: '16px',
                            padding: '24px 28px',
                            background:
                                'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,64,175,0.9))',
                            boxShadow:
                                '0 20px 60px rgba(15,23,42,0.9), 0 0 40px rgba(56,189,248,0.35)',
                            border: '1px solid rgba(148,163,184,0.5)',
                            color: '#e5e7eb',
                            fontFamily: 'Cinzel, serif',
                        }}
                    >
                        <h2
                            style={{
                                marginTop: 0,
                                marginBottom: '8px',
                                fontSize: 'clamp(20px, 3vw, 28px)',
                                color: '#fbbf24',
                                textTransform: 'uppercase',
                                letterSpacing: '4px',
                                textAlign: 'center',
                                textShadow:
                                    '0 0 16px rgba(251,191,36,0.5), 0 0 40px rgba(59,130,246,0.6)',
                            }}
                        >
                            Duel Controls & Rules
                        </h2>
                        <p
                            style={{
                                marginTop: 0,
                                marginBottom: '18px',
                                fontSize: '0.9rem',
                                textAlign: 'center',
                                color: 'rgba(226,232,240,0.8)',
                            }}
                        >
                            Learn the controls before you enter the arena. Once you&apos;re ready,
                            start the match and fight fair.
                        </p>

                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                                gap: '18px',
                                marginBottom: '18px',
                            }}
                        >
                            <div
                                style={{
                                    padding: '12px 14px',
                                    borderRadius: '12px',
                                    background:
                                        'radial-gradient(circle at top, rgba(56,189,248,0.25), transparent 70%)',
                                    border: '1px solid rgba(59,130,246,0.6)',
                                }}
                            >
                                <h3
                                    style={{
                                        marginTop: 0,
                                        marginBottom: '10px',
                                        fontSize: '0.95rem',
                                        color: '#bfdbfe',
                                        textTransform: 'uppercase',
                                        letterSpacing: '2px',
                                    }}
                                >
                                    Player 1 (Left)
                                </h3>
                                <ul
                                    style={{
                                        listStyle: 'none',
                                        padding: 0,
                                        margin: 0,
                                        fontSize: '0.85rem',
                                        lineHeight: 1.6,
                                    }}
                                >
                                    <li>
                                        <strong>W</strong> – Jump
                                    </li>
                                    <li>
                                        <strong>A / D</strong> – Move left / right
                                    </li>
                                    <li>
                                        <strong>Space</strong> – Attack
                                    </li>
                                </ul>
                            </div>

                            <div
                                style={{
                                    padding: '12px 14px',
                                    borderRadius: '12px',
                                    background:
                                        'radial-gradient(circle at top, rgba(251,191,36,0.18), transparent 70%)',
                                    border: '1px solid rgba(250,204,21,0.6)',
                                }}
                            >
                                <h3
                                    style={{
                                        marginTop: 0,
                                        marginBottom: '10px',
                                        fontSize: '0.95rem',
                                        color: '#facc15',
                                        textTransform: 'uppercase',
                                        letterSpacing: '2px',
                                    }}
                                >
                                    Player 2 (Right)
                                </h3>
                                <ul
                                    style={{
                                        listStyle: 'none',
                                        padding: 0,
                                        margin: 0,
                                        fontSize: '0.85rem',
                                        lineHeight: 1.6,
                                    }}
                                >
                                    <li>
                                        <strong>↑</strong> – Jump
                                    </li>
                                    <li>
                                        <strong>← / →</strong> – Move left / right
                                    </li>
                                    <li>
                                        <strong>↓</strong> – Attack
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <p
                            style={{
                                fontSize: '0.8rem',
                                marginBottom: '18px',
                                color: 'rgba(209,213,219,0.8)',
                                textAlign: 'center',
                            }}
                        >
                            Tip: Both players should be ready before you start. Attacks and movement
                            are mirrored so that each side has a fair chance to win.
                        </p>

                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: '12px',
                                flexWrap: 'wrap',
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => setShowIntro(false)}
                                style={{
                                    padding: '10px 32px',
                                    borderRadius: '999px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontFamily: 'Cinzel, serif',
                                    fontSize: '0.9rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '3px',
                                    background:
                                        'linear-gradient(135deg, #fbbf24, #f97316, #ef4444)',
                                    color: '#0b1120',
                                    boxShadow:
                                        '0 0 30px rgba(251,191,36,0.6), 0 0 60px rgba(248,113,113,0.5)',
                                }}
                            >
                                Start Match
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Health bars and timer - compact */}
            <div className="health-bar-container" style={{
                width: canvasSize.width,
                maxWidth: '100%',
                marginBottom: '5px'
            }}>
                {/* Player 1 (left) */}
                <div className="health-section">
                    <span className={`player-label ${player1.isLocal ? 'local' : ''}`}>
                        {player1.username} {player1.isLocal && '(YOU)'}
                    </span>
                    <div className="health-bar">
                        <div
                            className="health-bar-fill"
                            style={{ width: `${player1.health}%` }}
                        />
                    </div>
                </div>

                <div className="timer">{timer}</div>

                {/* Player 2 (right) */}
                <div className="health-section right">
                    <span className={`player-label ${player2.isLocal ? 'local' : ''}`}>
                        {player2.username} {player2.isLocal && '(YOU)'}
                    </span>
                    <div className="health-bar right">
                        <div
                            className="health-bar-fill"
                            style={{ width: `${player2.health}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Loading overlay */}
            {!assetsLoaded && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 100%)',
                    zIndex: 50
                }}>
                    <div style={{
                        fontSize: 'clamp(20px, 3vw, 32px)',
                        color: '#c4a54d',
                        fontFamily: 'Cinzel, serif',
                        marginBottom: '20px',
                        textShadow: '0 0 20px rgba(196, 165, 77, 0.5)'
                    }}>
                        ⚔️ Loading Arena...
                    </div>
                    <div style={{
                        width: '200px',
                        height: '4px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '2px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: '60%',
                            height: '100%',
                            background: 'linear-gradient(90deg, #c4a54d, #f5d78e)',
                            borderRadius: '2px',
                            animation: 'loading-bar 1.5s ease-in-out infinite'
                        }} />
                    </div>
                    <style>{`
                        @keyframes loading-bar {
                            0% { width: 10%; margin-left: 0; }
                            50% { width: 60%; margin-left: 20%; }
                            100% { width: 10%; margin-left: 90%; }
                        }
                    `}</style>
                </div>
            )}

            {/* Game canvas - FULL SCREEN */}
            <canvas
                ref={canvasRef}
                className="game-canvas"
                width={canvasSize.width}
                height={canvasSize.height}
                style={{
                    width: canvasSize.width,
                    height: canvasSize.height,
                    display: 'block'
                }}
            />

            {/* Mobile touch controls */}
            <MobileControls send={send} isPlaying={assetsLoaded} />
        </div>
    );
}
