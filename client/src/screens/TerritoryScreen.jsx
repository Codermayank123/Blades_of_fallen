import { useState, useEffect, useRef, useCallback } from 'react';

const COLORS = {
    bg: '#0A0F1E', cyan: '#00F5FF', purple: '#7B61FF', pink: '#FF3D81',
    green: '#00FF9C', red: '#FF3D3D', amber: '#FBBF24', text: '#E2E8F0', textDim: '#94A3B8',
};
const PLAYER_COLORS = ['#00F5FF', '#7B61FF', '#FF3D81', '#00FF9C', '#FBBF24', '#F97316', '#06B6D4', '#A855F7'];

/* ── Ambient particles cache ─── */
const _ambientParticles = [];
function ensureAmbient(W, H) {
    if (_ambientParticles.length === 0) {
        for (let i = 0; i < 40; i++) {
            _ambientParticles.push({
                x: Math.random() * W, y: Math.random() * H,
                r: 0.5 + Math.random() * 2, speed: 0.15 + Math.random() * 0.4,
                drift: Math.random() * Math.PI * 2, color: PLAYER_COLORS[Math.floor(Math.random() * 5)],
            });
        }
    }
}

export default function TerritoryScreen({ playerId, gameState, onLeave }) {
    const canvasRef = useRef(null);
    const animRef = useRef(null);
    const stateRef = useRef({
        grid: [], gridSize: 10, playerColors: {},
        scores: {}, remaining: 120, captures: [],
        abilities: [], shieldedTiles: new Set(),
    });

    const [remaining, setRemaining] = useState(120);
    const [scores, setScores] = useState({});
    const [players, setPlayers] = useState([]);
    const [myAbilities, setMyAbilities] = useState({ shield: true, surge: true, sabotage: true });
    const [phase, setPhase] = useState('waiting');
    const [showIntro, setShowIntro] = useState(true);

    useEffect(() => {
        if (!gameState?.lastMessage) return;
        const msg = gameState.lastMessage;
        const s = stateRef.current;

        if (msg.type === 'GAME_START') {
            s.grid = msg.grid || [];
            s.gridSize = msg.gridSize || 10;
            s.playerColors = msg.playerColors || {};
            setPlayers(msg.players || []);
            setPhase('active');
        }
        if (msg.type === 'TERRITORY_TICK') {
            s.grid = msg.grid || s.grid;
            s.scores = msg.scores || {};
            s.remaining = msg.remaining || 0;
            setScores(msg.scores || {});
            setRemaining(msg.remaining || 0);
        }
        if (msg.type === 'TERRITORY_CAPTURE') {
            s.grid = msg.grid || s.grid;
            s.scores = msg.scores || {};
            setScores(msg.scores || {});
            // Add capture animation
            s.captures.push({ row: msg.row, col: msg.col, time: Date.now(), playerId: msg.playerId });
        }
        if (msg.type === 'TERRITORY_ABILITY') {
            s.abilities.push({ ...msg, time: Date.now() });
            if (msg.ability === 'shield' && msg.tiles) {
                msg.tiles.forEach(([r, c]) => s.shieldedTiles.add(`${r},${c}`));
                setTimeout(() => {
                    msg.tiles.forEach(([r, c]) => s.shieldedTiles.delete(`${r},${c}`));
                }, msg.duration || 5000);
            }
        }
        if (msg.type === 'GAME_OVER') {
            setPhase('finished');
        }
    }, [gameState?.lastMessage]);

    const captureCell = useCallback((row, col) => {
        gameState?.send?.({ type: 'GAME_ACTION', action: 'capture', row, col });
    }, [gameState]);

    const useAbility = useCallback((ability) => {
        gameState?.send?.({ type: 'GAME_ACTION', action: 'ability', ability });
        setMyAbilities(prev => ({ ...prev, [ability]: false }));
        setTimeout(() => setMyAbilities(prev => ({ ...prev, [ability]: true })), 15000);
    }, [gameState]);

    // Canvas click handler
    const handleCanvasClick = useCallback((e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const s = stateRef.current;

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX / window.devicePixelRatio;
        const y = (e.clientY - rect.top) * scaleY / window.devicePixelRatio;

        // Grid offset
        const W = canvas.offsetWidth;
        const H = canvas.offsetHeight;
        const gridPx = Math.min(W - 40, H - 120);
        const cellSize = gridPx / s.gridSize;
        const ox = (W - gridPx) / 2;
        const oy = 60;

        const col = Math.floor((x - ox) / cellSize);
        const row = Math.floor((y - oy) / cellSize);

        if (row >= 0 && row < s.gridSize && col >= 0 && col < s.gridSize) {
            captureCell(row, col);
        }
    }, [captureCell]);

    // Canvas rendering
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const resize = () => {
            canvas.width = canvas.offsetWidth * window.devicePixelRatio;
            canvas.height = canvas.offsetHeight * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        };
        resize();
        window.addEventListener('resize', resize);

        const render = (time) => {
            const s = stateRef.current;
            const W = canvas.offsetWidth;
            const H = canvas.offsetHeight;

            // Deep background gradient
            const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
            bgGrad.addColorStop(0, '#050816');
            bgGrad.addColorStop(0.4, '#0A0F1E');
            bgGrad.addColorStop(1, '#0D1225');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, W, H);

            // Floating ambient particles
            ensureAmbient(W, H);
            _ambientParticles.forEach(p => {
                p.y -= p.speed;
                p.x += Math.sin(time / 2000 + p.drift) * 0.3;
                if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
                ctx.save();
                ctx.globalAlpha = 0.15;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            // Grid
            const gridPx = Math.min(W - 40, H - 120);
            const cellSize = gridPx / s.gridSize;
            const ox = (W - gridPx) / 2;
            const oy = 60;

            // Grid outer border glow
            ctx.save();
            ctx.strokeStyle = 'rgba(123,97,255,0.15)';
            ctx.lineWidth = 2;
            ctx.shadowColor = COLORS.purple;
            ctx.shadowBlur = 15;
            ctx.strokeRect(ox - 2, oy - 2, gridPx + 4, gridPx + 4);
            ctx.restore();

            // Draw cells
            for (let r = 0; r < s.gridSize; r++) {
                for (let c = 0; c < s.gridSize; c++) {
                    const x = ox + c * cellSize;
                    const y = oy + r * cellSize;
                    const owner = s.grid[r]?.[c];
                    const isShielded = s.shieldedTiles.has(`${r},${c}`);
                    const pad = 1.5;
                    const cw = cellSize - pad * 2;
                    const cornerR = Math.max(2, cellSize * 0.08);

                    if (owner) {
                        const color = s.playerColors[owner] || '#333';
                        const isOwn = owner === playerId;

                        // Cell gradient fill
                        const cellGrad = ctx.createLinearGradient(x + pad, y + pad, x + pad + cw, y + pad + cw);
                        cellGrad.addColorStop(0, hexAlpha(color, isOwn ? 0.65 : 0.35));
                        cellGrad.addColorStop(1, hexAlpha(color, isOwn ? 0.45 : 0.2));
                        ctx.fillStyle = cellGrad;
                        roundedRect(ctx, x + pad, y + pad, cw, cw, cornerR);
                        ctx.fill();

                        // Inner glow
                        ctx.save();
                        const glowGrad = ctx.createRadialGradient(
                            x + cellSize / 2, y + cellSize / 2, 0,
                            x + cellSize / 2, y + cellSize / 2, cw * 0.7
                        );
                        glowGrad.addColorStop(0, hexAlpha(color, 0.15));
                        glowGrad.addColorStop(1, 'transparent');
                        ctx.fillStyle = glowGrad;
                        roundedRect(ctx, x + pad, y + pad, cw, cw, cornerR);
                        ctx.fill();
                        ctx.restore();

                        // Border glow
                        ctx.save();
                        ctx.shadowColor = color;
                        ctx.shadowBlur = isOwn ? 8 : 4;
                        ctx.strokeStyle = hexAlpha(color, isOwn ? 0.6 : 0.3);
                        ctx.lineWidth = isOwn ? 1.5 : 0.8;
                        roundedRect(ctx, x + pad, y + pad, cw, cw, cornerR);
                        ctx.stroke();
                        ctx.restore();

                        // Shield indicator — animated dashes
                        if (isShielded) {
                            ctx.save();
                            ctx.strokeStyle = 'rgba(255,255,255,0.7)';
                            ctx.lineWidth = 2;
                            const dashOffset = (time / 100) % 12;
                            ctx.setLineDash([4, 4]);
                            ctx.lineDashOffset = dashOffset;
                            roundedRect(ctx, x + pad + 2, y + pad + 2, cw - 4, cw - 4, cornerR);
                            ctx.stroke();
                            ctx.setLineDash([]);
                            ctx.restore();
                        }
                    } else {
                        // Empty cell — stone texture effect
                        const stoneGrad = ctx.createLinearGradient(x + pad, y + pad, x + pad + cw, y + pad + cw);
                        stoneGrad.addColorStop(0, 'rgba(120,120,130,0.04)');
                        stoneGrad.addColorStop(0.5, 'rgba(140,140,150,0.06)');
                        stoneGrad.addColorStop(1, 'rgba(120,120,130,0.04)');
                        ctx.fillStyle = stoneGrad;
                        roundedRect(ctx, x + pad, y + pad, cw, cw, cornerR);
                        ctx.fill();

                        // Cross-hatch texture lines (stone/tile feeling)
                        ctx.save();
                        ctx.globalAlpha = 0.025;
                        ctx.strokeStyle = '#aaa';
                        ctx.lineWidth = 0.5;
                        // Diagonal lines
                        for (let d = 0; d < cw; d += 6) {
                            ctx.beginPath();
                            ctx.moveTo(x + pad + d, y + pad);
                            ctx.lineTo(x + pad, y + pad + d);
                            ctx.stroke();
                        }
                        ctx.restore();

                        // Center dot (subtle pulsing)
                        ctx.save();
                        ctx.globalAlpha = 0.04 + Math.sin(time / 1000 + r * 0.5 + c * 0.3) * 0.02;
                        ctx.fillStyle = COLORS.purple;
                        ctx.beginPath();
                        ctx.arc(x + cellSize / 2, y + cellSize / 2, 2, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();
                    }

                    // Grid border
                    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
                    ctx.lineWidth = 0.5;
                    roundedRect(ctx, x + pad, y + pad, cw, cw, cornerR);
                    ctx.stroke();
                }
            }

            // Capture animations — ripple wave
            s.captures = s.captures.filter(cap => {
                const elapsed = (Date.now() - cap.time) / 1000;
                if (elapsed > 0.8) return false;
                const cx2 = ox + cap.col * cellSize + cellSize / 2;
                const cy2 = oy + cap.row * cellSize + cellSize / 2;
                const color = s.playerColors[cap.playerId] || COLORS.cyan;

                // Multiple ripple rings
                for (let ring = 0; ring < 3; ring++) {
                    const ringElapsed = Math.max(0, elapsed - ring * 0.08);
                    if (ringElapsed <= 0) continue;
                    const radius = ringElapsed * cellSize * (1.5 + ring * 0.5);
                    const alpha = Math.max(0, 1 - ringElapsed / 0.7) * (0.5 / (ring + 1));
                    ctx.save();
                    ctx.globalAlpha = alpha;
                    ctx.beginPath();
                    ctx.arc(cx2, cy2, radius, 0, Math.PI * 2);
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2.5 - ring * 0.5;
                    ctx.shadowColor = color;
                    ctx.shadowBlur = 10;
                    ctx.stroke();
                    ctx.restore();
                }

                // Flash fill
                if (elapsed < 0.2) {
                    ctx.save();
                    ctx.globalAlpha = (0.2 - elapsed) * 2;
                    ctx.fillStyle = hexAlpha(color, 0.4);
                    ctx.fillRect(
                        ox + cap.col * cellSize, oy + cap.row * cellSize,
                        cellSize, cellSize
                    );
                    ctx.restore();
                }
                return true;
            });

            // Scanline overlay
            ctx.save();
            ctx.globalAlpha = 0.015;
            for (let sl = 0; sl < H; sl += 3) {
                ctx.fillStyle = '#000';
                ctx.fillRect(0, sl, W, 1);
            }
            ctx.restore();

            // HUD: title with glow
            ctx.save();
            ctx.font = 'bold 14px Orbitron, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillStyle = COLORS.purple;
            ctx.shadowColor = COLORS.purple;
            ctx.shadowBlur = 10;
            ctx.fillText('🧠 TERRITORY CONQUEST', 16, 28);
            ctx.restore();

            // Timer with glow
            ctx.save();
            ctx.textAlign = 'right';
            ctx.font = 'bold 14px Orbitron, sans-serif';
            const timerColor = s.remaining < 15 ? COLORS.red : COLORS.cyan;
            ctx.fillStyle = timerColor;
            ctx.shadowColor = timerColor;
            ctx.shadowBlur = 8;
            ctx.fillText(`⏱ ${s.remaining}s`, W - 16, 28);
            ctx.restore();

            // Leaderboard below grid with colored indicators
            const lbY = oy + gridPx + 20;
            ctx.font = '11px Inter, sans-serif';
            ctx.textAlign = 'center';
            const sorted = Object.entries(s.scores).sort((a, b) => b[1] - a[1]);
            sorted.forEach(([pid, score], i) => {
                const color = s.playerColors[pid] || COLORS.text;
                const name = (players || []).find(p => p.id === pid)?.username || pid.slice(0, 6);
                const isMe = pid === playerId;
                const xPos = W / 2 + (i - sorted.length / 2) * 130;

                // Color indicator dot
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(xPos - 35, lbY - 3, 4, 0, Math.PI * 2);
                ctx.fill();

                // Name and score
                ctx.fillStyle = isMe ? color : COLORS.text;
                ctx.font = `${isMe ? 'bold ' : ''}11px Inter, sans-serif`;
                ctx.fillText(`${isMe ? '▶ ' : ''}${name}: ${score}`, xPos, lbY);
            });

            animRef.current = requestAnimationFrame(render);
        };

        animRef.current = requestAnimationFrame(render);
        return () => {
            window.removeEventListener('resize', resize);
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, [playerId, players]);

    return (
        <div style={{ width: '100vw', height: '100vh', background: COLORS.bg, position: 'relative', overflow: 'hidden' }}>
            <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer' }}
            />
            {/* Intro / controls overlay */}
            {showIntro && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(10, 15, 30, 0.9)',
                        padding: '24px',
                        boxSizing: 'border-box',
                    }}
                >
                    <div
                        style={{
                            maxWidth: 640,
                            width: '100%',
                            borderRadius: 16,
                            padding: '22px 26px',
                            background:
                                'linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,64,175,0.9))',
                            border: '1px solid rgba(148,163,184,0.4)',
                            boxShadow:
                                '0 24px 80px rgba(15,23,42,0.95), 0 0 40px rgba(129,140,248,0.35)',
                            color: COLORS.text,
                            fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                        }}
                    >
                        <h2
                            style={{
                                marginTop: 0,
                                marginBottom: 8,
                                fontSize: 'clamp(20px, 3vw, 26px)',
                                textTransform: 'uppercase',
                                letterSpacing: 3,
                                color: COLORS.purple,
                            }}
                        >
                            Territory Conquest
                        </h2>
                        <p
                            style={{
                                marginTop: 0,
                                marginBottom: 16,
                                fontSize: 13,
                                color: COLORS.textDim,
                            }}
                        >
                            Capture as many cells on the grid as you can before the timer ends.
                            Every click can swing the map.
                        </p>

                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                                gap: 16,
                                marginBottom: 18,
                            }}
                        >
                            <div
                                style={{
                                    padding: 12,
                                    borderRadius: 12,
                                    background: 'rgba(15,23,42,0.9)',
                                    border: `1px solid ${COLORS.cyan}33`,
                                }}
                            >
                                <h3
                                    style={{
                                        margin: '0 0 8px',
                                        fontSize: 13,
                                        letterSpacing: 1,
                                        color: COLORS.cyan,
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    Controls
                                </h3>
                                <ul
                                    style={{
                                        margin: 0,
                                        paddingLeft: 18,
                                        fontSize: 13,
                                        lineHeight: 1.6,
                                        color: COLORS.textDim,
                                    }}
                                >
                                    <li>Click any cell on the grid to try to capture it.</li>
                                    <li>Target cells next to your existing color to expand faster.</li>
                                    <li>Click carefully – wasted clicks are lost opportunities.</li>
                                </ul>
                            </div>

                            <div
                                style={{
                                    padding: 12,
                                    borderRadius: 12,
                                    background: 'rgba(15,23,42,0.9)',
                                    border: `1px solid ${COLORS.amber}33`,
                                }}
                            >
                                <h3
                                    style={{
                                        margin: '0 0 8px',
                                        fontSize: 13,
                                        letterSpacing: 1,
                                        color: COLORS.amber,
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    Abilities
                                </h3>
                                <ul
                                    style={{
                                        margin: 0,
                                        paddingLeft: 18,
                                        fontSize: 13,
                                        lineHeight: 1.6,
                                        color: COLORS.textDim,
                                    }}
                                >
                                    <li>
                                        <strong>Shield</strong> – Protects your tiles from being
                                        stolen for a short time.
                                    </li>
                                    <li>
                                        <strong>Surge</strong> – Rapidly boosts your captures.
                                    </li>
                                    <li>
                                        <strong>Sabotage</strong> – Disrupts enemy territory.
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <p
                            style={{
                                marginTop: 0,
                                marginBottom: 20,
                                fontSize: 12,
                                color: COLORS.textDim,
                                textAlign: 'center',
                            }}
                        >
                            Tip: Play the long game – protecting key clusters can be better than
                            grabbing random tiles.
                        </p>

                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => { setShowIntro(false); gameState?.send?.({ type: 'ARENA_READY' }); }}
                                style={{
                                    padding: '10px 32px',
                                    borderRadius: 999,
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    letterSpacing: 2,
                                    textTransform: 'uppercase',
                                    background:
                                        'linear-gradient(135deg, #22c55e, #a3e635, #facc15)',
                                    color: '#0b1120',
                                    boxShadow:
                                        '0 0 30px rgba(74,222,128,0.6), 0 0 60px rgba(234,179,8,0.5)',
                                }}
                            >
                                Start Match
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Ability bar */}
            <div style={{
                position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
                display: 'flex', gap: '10px', zIndex: 10,
            }}>
                {[
                    { key: 'shield', icon: '🛡️', label: 'Shield', color: COLORS.cyan },
                    { key: 'surge', icon: '⚡', label: 'Surge', color: COLORS.amber },
                    { key: 'sabotage', icon: '💀', label: 'Sabotage', color: COLORS.pink },
                ].map(ab => (
                    <button key={ab.key} onClick={() => useAbility(ab.key)} disabled={!myAbilities[ab.key]} style={{
                        background: myAbilities[ab.key]
                            ? `linear-gradient(135deg, ${ab.color}22, ${ab.color}11)`
                            : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${myAbilities[ab.key] ? ab.color + '66' : 'rgba(255,255,255,0.1)'}`,
                        color: myAbilities[ab.key] ? ab.color : COLORS.textDim,
                        padding: '10px 18px', borderRadius: '10px', cursor: myAbilities[ab.key] ? 'pointer' : 'not-allowed',
                        fontWeight: 700, fontSize: '0.8rem', fontFamily: 'Inter, sans-serif',
                        opacity: myAbilities[ab.key] ? 1 : 0.4,
                        transition: 'all 0.2s',
                    }}>
                        {ab.icon} {ab.label}
                    </button>
                ))}
                <button onClick={onLeave} style={{
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: COLORS.textDim, padding: '10px 16px', borderRadius: '10px',
                    cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'Inter, sans-serif',
                }}>Exit</button>
            </div>
        </div>
    );
}

function hexAlpha(hex, alpha) {
    const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
    return hex + a;
}

function roundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}
