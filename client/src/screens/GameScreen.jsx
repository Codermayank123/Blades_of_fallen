import { useRef, useState, useEffect, useCallback } from 'react';
import { useGameLoop } from '../hooks/useGameLoop';
import { useInputHandler } from '../hooks/useInputHandler';
import { useAudio } from '../hooks/useAudio';
import { GameRenderer } from '../game/GameRenderer';

export default function GameScreen({ send, playerId, roomInfo, gameState }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const rendererRef = useRef(null);
    const [timer, setTimer] = useState(60);
    const [assetsLoaded, setAssetsLoaded] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [sfxVol, setSfxVol] = useState(80);
    const [musicVol, setMusicVol] = useState(30);
    const [canvasSize, setCanvasSize] = useState({ width: 1024, height: 576 });
    const lastHealthRef = useRef({});

    const { playSFX, playMusic, stopMusic, setSFXVolume, setMusicVolume, toggleMute } = useAudio();

    // Handle window resize for TRULY full-screen canvas
    const updateCanvasSize = useCallback(() => {
        // Use almost full window size with minimal padding
        const padding = 20;
        const healthBarHeight = 70; // Height for health bars
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

        // Ensure minimum size
        width = Math.max(width, 640);
        height = Math.max(height, 360);

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
        });

        return () => {
            stopMusic();
        };
    }, [playMusic, stopMusic]);

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

    // Render loop
    useGameLoop((dt) => {
        const renderer = rendererRef.current;
        if (!renderer || !assetsLoaded) return;
        renderer.render(gameState, playerId);
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
        </div>
    );
}
