import { useState, useEffect, useRef, useCallback } from 'react';

/* ── Helpers ─────────────────────────────── */
function lightenColor(hex, amt) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.min(255, r + amt);
    g = Math.min(255, g + amt);
    b = Math.min(255, b + amt);
    return `rgb(${r},${g},${b})`;
}

/* ── Color palette ───────────────────────────── */
const COLORS = {
    bg: '#0A0F1E',
    surface: '#111827',
    border: '#1E293B',
    cyan: '#00F5FF',
    purple: '#7B61FF',
    pink: '#FF3D81',
    green: '#00FF9C',
    red: '#FF3D3D',
    amber: '#FBBF24',
    textDim: '#94A3B8',
    text: '#E2E8F0',
};

const PLAYER_COLORS = [
    '#00F5FF', '#7B61FF', '#FF3D81', '#00FF9C', '#FBBF24',
    '#F97316', '#06B6D4', '#A855F7', '#EC4899', '#10B981'
];

export default function BombRelayScreen({ playerId, gameState, onLeave }) {
    const canvasRef = useRef(null);
    const animRef = useRef(null);
    const stateRef = useRef({
        phase: 'waiting',
        alivePlayers: [],
        bombHolder: null,
        bombPct: 1,
        bombTimer: 0,
        countdown: 3,
        round: 0,
        eliminated: null,
        explosionTime: 0,
        passLine: null,
        passLineTime: 0,
        particles: [],
    });

    const [phase, setPhase] = useState('waiting');
    const [alivePlayers, setAlivePlayers] = useState([]);
    const [bombHolder, setBombHolder] = useState(null);
    const [round, setRound] = useState(0);
    const [countdown, setCountdown] = useState(3);
    const [bombPct, setBombPct] = useState(1);
    const [eliminated, setEliminated] = useState(null);
    const [myStatus, setMyStatus] = useState('alive');
    const [showIntro, setShowIntro] = useState(true);
    const [isTouchDevice, setIsTouchDevice] = useState(false);

    // Detect touch device
    useEffect(() => {
        const check = () => {
            const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            setIsTouchDevice(hasTouch || window.innerWidth <= 1024);
        };
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // Process server messages
    useEffect(() => {
        if (!gameState?.lastMessage) return;
        const msg = gameState.lastMessage;
        const s = stateRef.current;

        if (msg.type === 'GAME_START') {
            s.alivePlayers = (msg.players || []).map(p => ({ ...p, alive: true }));
            s.phase = 'countdown';
            setPhase('countdown');
            setAlivePlayers(s.alivePlayers);
        }

        if (msg.type === 'BOMB_ROUND') {
            if (msg.action === 'countdown') {
                s.countdown = msg.count;
                setCountdown(msg.count);
            }
            if (msg.action === 'start') {
                s.phase = 'active';
                s.round = msg.round;
                s.bombHolder = msg.bombHolder;
                s.bombPct = 1;
                s.alivePlayers = msg.alivePlayers || s.alivePlayers;
                setPhase('active');
                setRound(msg.round);
                setBombHolder(msg.bombHolder);
                setAlivePlayers(msg.alivePlayers || []);
                setBombPct(1);
                setEliminated(null);
            }
        }

        if (msg.type === 'BOMB_TICK') {
            s.bombHolder = msg.bombHolder;
            s.bombPct = msg.bombPct;
            s.bombTimer = msg.bombTimer;
            setBombHolder(msg.bombHolder);
            setBombPct(msg.bombPct);
        }

        if (msg.type === 'BOMB_PASS') {
            s.bombHolder = msg.to;
            s.passLine = { from: msg.from, to: msg.to };
            s.passLineTime = Date.now();
            setBombHolder(msg.to);

            // Spawn pass particles
            for (let i = 0; i < 8; i++) {
                s.particles.push({
                    x: 0, y: 0, // positioned in render
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    life: 1,
                    color: COLORS.amber,
                    forPlayer: msg.to,
                });
            }
        }

        if (msg.type === 'BOMB_EXPLODE') {
            s.phase = 'exploding';
            s.eliminated = msg.eliminatedId;
            s.explosionTime = Date.now();
            setPhase('exploding');
            setEliminated(msg.eliminatedId);
            setAlivePlayers(msg.alivePlayers || []);
            if (msg.eliminatedId === playerId) setMyStatus('eliminated');

            // Explosion particles
            for (let i = 0; i < 40; i++) {
                const angle = (Math.PI * 2 * i) / 40;
                const speed = 2 + Math.random() * 6;
                s.particles.push({
                    x: 0, y: 0,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 1,
                    color: Math.random() > 0.5 ? COLORS.red : COLORS.amber,
                    forPlayer: msg.eliminatedId,
                    isExplosion: true,
                });
            }
        }

        if (msg.type === 'GAME_OVER') {
            s.phase = 'finished';
            setPhase('finished');
        }
    }, [gameState?.lastMessage, playerId]);

    // Pass bomb to target
    const passBomb = useCallback((targetId) => {
        if (bombHolder !== playerId) return;
        gameState?.send?.({ type: 'GAME_ACTION', action: 'pass_bomb', targetId });
    }, [bombHolder, playerId, gameState]);

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

        let lastTime = performance.now();

        const render = (time) => {
            const dt = (time - lastTime) / 1000;
            lastTime = time;
            const s = stateRef.current;
            const W = canvas.offsetWidth;
            const H = canvas.offsetHeight;

            // Clear
            ctx.fillStyle = COLORS.bg;
            ctx.fillRect(0, 0, W, H);

            // Animated grid background
            drawGrid(ctx, W, H, time);

            // Player positions in a circle
            const allPlayers = s.alivePlayers;
            const cx = W / 2;
            const cy = H / 2;
            const radius = Math.min(W, H) * 0.32;
            const positions = {};

            if (Array.isArray(allPlayers)) {
                allPlayers.forEach((p, i) => {
                    const pid = p.id || p;
                    const angle = (Math.PI * 2 * i) / allPlayers.length - Math.PI / 2;
                    const px = cx + Math.cos(angle) * radius;
                    const py = cy + Math.sin(angle) * radius;
                    positions[pid] = { x: px, y: py };
                });
            }

            // Draw pass line
            if (s.passLine && Date.now() - s.passLineTime < 600) {
                const fromPos = positions[s.passLine.from];
                const toPos = positions[s.passLine.to];
                if (fromPos && toPos) {
                    const alpha = 1 - (Date.now() - s.passLineTime) / 600;
                    ctx.save();
                    ctx.globalAlpha = alpha;
                    ctx.strokeStyle = COLORS.amber;
                    ctx.lineWidth = 3;
                    ctx.setLineDash([8, 4]);
                    ctx.beginPath();
                    ctx.moveTo(fromPos.x, fromPos.y);
                    ctx.lineTo(toPos.x, toPos.y);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.restore();
                }
            }

            // Draw players
            if (Array.isArray(allPlayers)) {
                allPlayers.forEach((p, i) => {
                    const pid = p.id || p;
                    const uname = p.username || pid.slice(0, 6);
                    const pos = positions[pid];
                    if (!pos) return;

                    const isBombHolder = pid === s.bombHolder;
                    const isMe = pid === playerId;
                    const color = PLAYER_COLORS[i % PLAYER_COLORS.length];

                    // Glow for bomb holder — multi-layer pulsing
                    if (isBombHolder && s.phase === 'active') {
                        const pulseScale = 1 + Math.sin(time / 120) * 0.2;
                        for (let ring = 3; ring >= 1; ring--) {
                            const glowRadius = (25 + ring * 12) * pulseScale;
                            const grad = ctx.createRadialGradient(pos.x, pos.y, 8, pos.x, pos.y, glowRadius);
                            grad.addColorStop(0, `rgba(255,61,61,${0.3 / ring})`);
                            grad.addColorStop(0.6, `rgba(255,150,0,${0.15 / ring})`);
                            grad.addColorStop(1, 'rgba(255,61,61,0)');
                            ctx.fillStyle = grad;
                            ctx.beginPath();
                            ctx.arc(pos.x, pos.y, glowRadius, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }

                    // Animated spinning ring
                    ctx.save();
                    const ringRadius = 30;
                    const dashAngle = time / (isBombHolder ? 200 : 800);
                    ctx.translate(pos.x, pos.y);
                    ctx.rotate(dashAngle);
                    ctx.beginPath();
                    ctx.arc(0, 0, ringRadius, 0, Math.PI * 1.2);
                    ctx.strokeStyle = isBombHolder ? COLORS.red + 'AA' : color + '55';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(0, 0, ringRadius, Math.PI * 1.4, Math.PI * 2.6);
                    ctx.strokeStyle = isBombHolder ? COLORS.amber + 'AA' : color + '33';
                    ctx.stroke();
                    ctx.restore();

                    // Player circle with gradient
                    ctx.save();
                    const avatarGrad = ctx.createRadialGradient(
                        pos.x - 6, pos.y - 6, 2,
                        pos.x, pos.y, 24
                    );
                    if (isBombHolder) {
                        avatarGrad.addColorStop(0, '#ff6b6b');
                        avatarGrad.addColorStop(1, '#c0392b');
                    } else {
                        avatarGrad.addColorStop(0, lightenColor(color, 40));
                        avatarGrad.addColorStop(1, color);
                    }
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, 24, 0, Math.PI * 2);
                    ctx.fillStyle = avatarGrad;
                    ctx.shadowColor = isBombHolder ? COLORS.red : color;
                    ctx.shadowBlur = isBombHolder ? 25 : 12;
                    ctx.fill();
                    ctx.restore();

                    // Inner highlight
                    ctx.save();
                    ctx.globalAlpha = 0.25;
                    const innerGrad = ctx.createRadialGradient(
                        pos.x - 8, pos.y - 10, 2,
                        pos.x, pos.y, 20
                    );
                    innerGrad.addColorStop(0, 'rgba(255,255,255,0.6)');
                    innerGrad.addColorStop(1, 'transparent');
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, 22, 0, Math.PI * 2);
                    ctx.fillStyle = innerGrad;
                    ctx.fill();
                    ctx.restore();

                    // Player border
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, 24, 0, Math.PI * 2);
                    ctx.strokeStyle = isMe ? COLORS.cyan : 'rgba(255,255,255,0.25)';
                    ctx.lineWidth = isMe ? 3 : 1;
                    ctx.stroke();

                    // Initial letter inside avatar
                    ctx.font = 'bold 16px Inter, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#fff';
                    ctx.fillText(uname.charAt(0).toUpperCase(), pos.x, pos.y + 1);

                    // Bomb rendering on holder (detailed procedural bomb)
                    if (isBombHolder && s.phase === 'active') {
                        const bombBob = Math.sin(time / 150) * 3;
                        const bx = pos.x;
                        const by = pos.y - 38 + bombBob;
                        const bR = 12;

                        // Bomb body (metallic gradient sphere)
                        ctx.save();
                        const bombGrad = ctx.createRadialGradient(bx - 3, by - 3, 1, bx, by, bR);
                        bombGrad.addColorStop(0, '#555');
                        bombGrad.addColorStop(0.4, '#333');
                        bombGrad.addColorStop(0.8, '#1a1a1a');
                        bombGrad.addColorStop(1, '#000');
                        ctx.beginPath();
                        ctx.arc(bx, by, bR, 0, Math.PI * 2);
                        ctx.fillStyle = bombGrad;
                        ctx.shadowColor = COLORS.red;
                        ctx.shadowBlur = 15;
                        ctx.fill();

                        // Metallic highlight
                        ctx.globalAlpha = 0.35;
                        ctx.beginPath();
                        ctx.arc(bx - 4, by - 4, 4, 0, Math.PI * 2);
                        ctx.fillStyle = '#888';
                        ctx.fill();
                        ctx.globalAlpha = 1;

                        // Fuse cap (little cylinder on top)
                        ctx.fillStyle = '#666';
                        ctx.fillRect(bx - 3, by - bR - 3, 6, 5);
                        ctx.strokeStyle = '#888';
                        ctx.lineWidth = 0.5;
                        ctx.strokeRect(bx - 3, by - bR - 3, 6, 5);

                        // Fuse wick (curvy line)
                        ctx.beginPath();
                        ctx.moveTo(bx, by - bR - 3);
                        ctx.quadraticCurveTo(bx + 8, by - bR - 12, bx + 4, by - bR - 16);
                        ctx.strokeStyle = '#8B7355';
                        ctx.lineWidth = 1.5;
                        ctx.stroke();

                        // Spark at fuse tip (animated)
                        const sparkPulse = 0.5 + Math.sin(time / 80) * 0.5;
                        const sparkGrad = ctx.createRadialGradient(
                            bx + 4, by - bR - 16, 0,
                            bx + 4, by - bR - 16, 8 * sparkPulse
                        );
                        sparkGrad.addColorStop(0, 'rgba(255,255,200,0.9)');
                        sparkGrad.addColorStop(0.3, 'rgba(255,180,0,0.6)');
                        sparkGrad.addColorStop(1, 'rgba(255,100,0,0)');
                        ctx.fillStyle = sparkGrad;
                        ctx.beginPath();
                        ctx.arc(bx + 4, by - bR - 16, 8 * sparkPulse, 0, Math.PI * 2);
                        ctx.fill();

                        // Tiny spark particles
                        for (let sp = 0; sp < 3; sp++) {
                            const sx = bx + 4 + (Math.random() - 0.5) * 10;
                            const sy = by - bR - 16 + (Math.random() - 0.5) * 8;
                            ctx.fillStyle = ['#FBBF24', '#ff6b35', '#ffe'][sp];
                            ctx.globalAlpha = 0.3 + Math.random() * 0.5;
                            ctx.beginPath();
                            ctx.arc(sx, sy, 1 + Math.random(), 0, Math.PI * 2);
                            ctx.fill();
                        }
                        ctx.restore();
                    }

                    // Player name
                    ctx.textBaseline = 'top';
                    ctx.font = `${isMe ? 'bold ' : ''}11px Inter, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.fillStyle = isMe ? COLORS.cyan : COLORS.text;
                    ctx.shadowColor = isMe ? COLORS.cyan : 'transparent';
                    ctx.shadowBlur = isMe ? 6 : 0;
                    ctx.fillText(uname.slice(0, 10), pos.x, pos.y + 38);
                    ctx.shadowBlur = 0;

                    if (isMe) {
                        ctx.font = '9px Inter, sans-serif';
                        ctx.fillStyle = COLORS.cyan;
                        ctx.fillText('(YOU)', pos.x, pos.y + 52);
                    }
                });
            }

            // Explosion effect — multi-ring shockwave with screen shake
            if (s.phase === 'exploding' && s.eliminated) {
                const ePos = positions[s.eliminated];
                if (ePos) {
                    const elapsed = (Date.now() - s.explosionTime) / 1000;
                    if (elapsed < 2.5) {
                        // Screen shake
                        if (elapsed < 0.4) {
                            const shake = (0.4 - elapsed) * 8;
                            ctx.save();
                            ctx.translate(
                                (Math.random() - 0.5) * shake,
                                (Math.random() - 0.5) * shake
                            );
                        }

                        // Multiple expanding rings
                        for (let ring = 0; ring < 4; ring++) {
                            const ringDelay = ring * 0.12;
                            const ringElapsed = Math.max(0, elapsed - ringDelay);
                            if (ringElapsed <= 0) continue;
                            const ringR = ringElapsed * (100 + ring * 30);
                            const alpha = Math.max(0, 1 - ringElapsed * 0.7);
                            ctx.save();
                            ctx.globalAlpha = alpha;
                            ctx.beginPath();
                            ctx.arc(ePos.x, ePos.y, ringR, 0, Math.PI * 2);
                            ctx.strokeStyle = ring % 2 === 0 ? COLORS.red : COLORS.amber;
                            ctx.lineWidth = 4 - ring;
                            ctx.shadowColor = ring % 2 === 0 ? COLORS.red : COLORS.amber;
                            ctx.shadowBlur = 30;
                            ctx.stroke();
                            ctx.restore();
                        }

                        // Central flash burst
                        if (elapsed < 0.3) {
                            const flashAlpha = (0.3 - elapsed) / 0.3;
                            const flashGrad = ctx.createRadialGradient(
                                ePos.x, ePos.y, 0, ePos.x, ePos.y, 80
                            );
                            flashGrad.addColorStop(0, `rgba(255,255,200,${flashAlpha * 0.8})`);
                            flashGrad.addColorStop(0.5, `rgba(255,150,0,${flashAlpha * 0.3})`);
                            flashGrad.addColorStop(1, 'transparent');
                            ctx.fillStyle = flashGrad;
                            ctx.fillRect(0, 0, W, H);
                        }

                        // White flash overlay
                        if (elapsed < 0.15) {
                            ctx.save();
                            ctx.globalAlpha = (0.15 - elapsed) * 4;
                            ctx.fillStyle = 'rgba(255,255,255,0.5)';
                            ctx.fillRect(0, 0, W, H);
                            ctx.restore();
                        }

                        if (elapsed < 0.4) ctx.restore(); // end screen shake
                    }
                }
            }

            // Particles
            s.particles = s.particles.filter(p => {
                p.life -= dt * 1.5;
                if (p.life <= 0) return false;
                const basePos = p.forPlayer ? positions[p.forPlayer] : { x: cx, y: cy };
                if (!basePos) return false;
                p.x += p.vx;
                p.y += p.vy;
                ctx.save();
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(basePos.x + p.x, basePos.y + p.y, p.isExplosion ? 3 : 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                return true;
            });

            // Countdown overlay
            if (s.phase === 'countdown') {
                ctx.save();
                ctx.fillStyle = 'rgba(10,15,30,0.6)';
                ctx.fillRect(0, 0, W, H);
                ctx.font = 'bold 80px Orbitron, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = COLORS.cyan;
                ctx.shadowColor = COLORS.cyan;
                ctx.shadowBlur = 40;
                ctx.fillText(s.countdown > 0 ? s.countdown : 'GO!', cx, cy);
                ctx.restore();
            }

            // HUD: Bomb timer bar at top
            if (s.phase === 'active') {
                const barW = W * 0.6;
                const barH = 8;
                const barX = (W - barW) / 2;
                const barY = 20;

                // Background
                ctx.fillStyle = 'rgba(255,255,255,0.05)';
                roundRect(ctx, barX, barY, barW, barH, 4);
                ctx.fill();

                // Fill
                const pct = Math.max(0, s.bombPct);
                const fillColor = pct > 0.5 ? COLORS.green : pct > 0.2 ? COLORS.amber : COLORS.red;
                ctx.fillStyle = fillColor;
                ctx.shadowColor = fillColor;
                ctx.shadowBlur = 8;
                roundRect(ctx, barX, barY, barW * pct, barH, 4);
                ctx.fill();
                ctx.shadowBlur = 0;

                // Timer text
                ctx.font = 'bold 14px Orbitron, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = fillColor;
                const seconds = Math.max(0, s.bombTimer / 1000).toFixed(1);
                ctx.fillText(`⏱ ${seconds}s`, cx, barY + barH + 20);
            }

            // Round indicator
            if (s.round > 0 && s.phase !== 'countdown') {
                ctx.font = '12px Inter, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillStyle = COLORS.textDim;
                ctx.fillText(`Round ${s.round}`, 16, 24);
            }

            // Title
            ctx.font = 'bold 14px Orbitron, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillStyle = COLORS.pink;
            ctx.fillText('💣 BOMB RELAY', W - 16, 24);

            animRef.current = requestAnimationFrame(render);
        };

        animRef.current = requestAnimationFrame(render);

        return () => {
            window.removeEventListener('resize', resize);
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, [playerId]);

    // Get alive players I can pass to (not me)
    const passTargets = alivePlayers.filter(p => (p.id || p) !== playerId);
    const iAmBombHolder = bombHolder === playerId;
    const iAmAlive = myStatus === 'alive';

    return (
        <div style={{
            width: '100vw', height: '100vh',
            background: COLORS.bg,
            display: 'flex', flexDirection: 'column',
            fontFamily: 'Inter, sans-serif',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Canvas */}
            <canvas
                ref={canvasRef}
                style={{
                    position: 'absolute', top: 0, left: 0,
                    width: '100%', height: '100%',
                }}
            />

            {/* Intro / controls overlay */}
            {showIntro && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 30,
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
                                '0 24px 80px rgba(15,23,42,0.95), 0 0 40px rgba(56,189,248,0.35)',
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
                                color: COLORS.pink,
                            }}
                        >
                            Bomb Relay Royale
                        </h2>
                        <p
                            style={{
                                marginTop: 0,
                                marginBottom: 16,
                                fontSize: 13,
                                color: COLORS.textDim,
                            }}
                        >
                            Don&apos;t be holding the bomb when it explodes. Pass it away in time and
                            outlast everyone else.
                        </p>

                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
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
                                    Objective
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
                                    <li>Stay alive while the bomb timer ticks down.</li>
                                    <li>
                                        When you have the bomb, you <strong>must</strong> pass it
                                        before it reaches zero.
                                    </li>
                                    <li>Last player standing wins the round.</li>
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
                                    <li>When you hold the bomb, use the buttons at the bottom.</li>
                                    <li>
                                        Click a player&apos;s name to pass the bomb instantly to
                                        them.
                                    </li>
                                    <li>Plan your passes – don&apos;t help the current leader.</li>
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
                            Tip: Watch the timer bar at the top. The less time left, the faster you
                            need to react.
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
                                        'linear-gradient(135deg, #f97316, #fb7185, #ec4899)',
                                    color: '#0b1120',
                                    boxShadow:
                                        '0 0 30px rgba(251,113,133,0.6), 0 0 60px rgba(236,72,153,0.5)',
                                }}
                            >
                                Start Round
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom HUD overlay */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '16px',
                background: 'linear-gradient(transparent, rgba(10,15,30,0.95))',
                display: 'flex', flexDirection: 'column', gap: '10px',
                alignItems: 'center',
                zIndex: 10,
            }}>
                {/* Pass buttons — only show if I hold the bomb */}
                {phase === 'active' && iAmBombHolder && iAmAlive && (
                    <div style={{
                        display: 'flex', gap: isTouchDevice ? '12px' : '8px', flexWrap: 'wrap',
                        justifyContent: 'center',
                    }}>
                        <span style={{
                            color: COLORS.red, fontSize: isTouchDevice ? '1rem' : '0.8rem',
                            fontWeight: 700, marginRight: '4px',
                            fontFamily: 'Orbitron, sans-serif',
                            display: 'flex', alignItems: 'center',
                        }}>
                            💣 PASS TO:
                        </span>
                        {passTargets.map((p, i) => (
                            <button
                                key={p.id || i}
                                onClick={() => passBomb(p.id || p)}
                                onTouchStart={(e) => { e.preventDefault(); passBomb(p.id || p); }}
                                style={{
                                    background: `linear-gradient(135deg, ${PLAYER_COLORS[i % PLAYER_COLORS.length]}22, ${PLAYER_COLORS[i % PLAYER_COLORS.length]}11)`,
                                    border: `2px solid ${PLAYER_COLORS[i % PLAYER_COLORS.length]}66`,
                                    color: PLAYER_COLORS[i % PLAYER_COLORS.length],
                                    padding: isTouchDevice ? '14px 22px' : '8px 16px',
                                    borderRadius: isTouchDevice ? '14px' : '8px',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    fontSize: isTouchDevice ? '1rem' : '0.8rem',
                                    fontFamily: 'Inter, sans-serif',
                                    transition: 'all 0.15s',
                                    minWidth: isTouchDevice ? '80px' : 'auto',
                                    minHeight: isTouchDevice ? '54px' : 'auto',
                                    touchAction: 'none',
                                    WebkitTapHighlightColor: 'transparent',
                                    userSelect: 'none',
                                    WebkitUserSelect: 'none',
                                    backdropFilter: 'blur(6px)',
                                }}
                            >
                                {(p.username || 'Player').slice(0, 10)}
                            </button>
                        ))}
                    </div>
                )}

                {/* Status messages */}
                {phase === 'active' && !iAmBombHolder && iAmAlive && (
                    <div style={{
                        color: COLORS.green, fontSize: '0.9rem',
                        fontWeight: 600, textAlign: 'center',
                        fontFamily: 'Orbitron, sans-serif',
                    }}>
                        ✅ You're safe — watch out!
                    </div>
                )}

                {myStatus === 'eliminated' && (
                    <div style={{
                        color: COLORS.red, fontSize: '1rem',
                        fontWeight: 700, textAlign: 'center',
                        fontFamily: 'Orbitron, sans-serif',
                    }}>
                        💀 ELIMINATED — Spectating...
                    </div>
                )}

                {phase === 'exploding' && eliminated && (
                    <div style={{
                        color: COLORS.red, fontSize: '0.9rem',
                        fontWeight: 600, textAlign: 'center',
                        animation: 'pulse 0.5s ease-in-out',
                    }}>
                        💥 {eliminated === playerId ? 'You were' : `${alivePlayers.find(p => p.id === eliminated)?.username || 'Player'} was`} eliminated!
                    </div>
                )}

                {phase === 'finished' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            color: myStatus === 'alive' ? COLORS.green : COLORS.red,
                            fontSize: '1.2rem', fontWeight: 700,
                            fontFamily: 'Orbitron, sans-serif',
                        }}>
                            {myStatus === 'alive' ? '🏆 VICTORY!' : '💀 DEFEATED'}
                        </div>
                    </div>
                )}

                {/* Exit button */}
                <button
                    onClick={onLeave}
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: COLORS.textDim,
                        padding: '6px 20px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontFamily: 'Inter, sans-serif',
                    }}
                >
                    Exit
                </button>
            </div>
        </div>
    );
}

/* ── Stars cache ─────────────────────────── */
const _stars = [];
function ensureStars(W, H) {
    if (_stars.length === 0) {
        for (let i = 0; i < 120; i++) {
            _stars.push({
                x: Math.random() * W,
                y: Math.random() * H,
                r: 0.3 + Math.random() * 1.5,
                speed: 0.1 + Math.random() * 0.3,
                twinkleSpeed: 0.5 + Math.random() * 2,
            });
        }
    }
}

/* ── Helper: animated grid + starfield + nebula background ─── */
function drawGrid(ctx, W, H, time) {
    // Deep space gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#050816');
    bgGrad.addColorStop(0.5, '#0A0F1E');
    bgGrad.addColorStop(1, '#0D1225');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Nebula blobs
    const nebulae = [
        { x: W * 0.2, y: H * 0.3, r: 180, color: 'rgba(123,97,255,0.04)' },
        { x: W * 0.8, y: H * 0.6, r: 200, color: 'rgba(255,61,129,0.03)' },
        { x: W * 0.5, y: H * 0.15, r: 140, color: 'rgba(0,245,255,0.03)' },
    ];
    nebulae.forEach(n => {
        const grad = ctx.createRadialGradient(
            n.x + Math.sin(time / 3000) * 20, n.y + Math.cos(time / 4000) * 15,
            0,
            n.x + Math.sin(time / 3000) * 20, n.y + Math.cos(time / 4000) * 15,
            n.r
        );
        grad.addColorStop(0, n.color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
    });

    // Twinkling starfield
    ensureStars(W, H);
    _stars.forEach(star => {
        const twinkle = 0.3 + Math.sin(time / 1000 * star.twinkleSpeed) * 0.5 + 0.2;
        ctx.save();
        ctx.globalAlpha = twinkle;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
        // Star glow
        if (star.r > 1) {
            ctx.globalAlpha = twinkle * 0.15;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.r * 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    });

    // Subtle grid
    const spacing = 50;
    const offsetX = (time / 60) % spacing;
    const offsetY = (time / 80) % spacing;
    ctx.save();
    ctx.strokeStyle = 'rgba(0,245,255,0.015)';
    ctx.lineWidth = 1;
    for (let x = -spacing + offsetX; x < W + spacing; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
    }
    for (let y = -spacing + offsetY; y < H + spacing; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
    }
    ctx.restore();

    // Scanline overlay
    ctx.save();
    ctx.globalAlpha = 0.02;
    for (let y = 0; y < H; y += 3) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, y, W, 1);
    }
    ctx.restore();

    // Vignette
    const vigGrad = ctx.createRadialGradient(W / 2, H / 2, W * 0.25, W / 2, H / 2, W * 0.7);
    vigGrad.addColorStop(0, 'transparent');
    vigGrad.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, W, H);
}

/* ── Helper: rounded rect ───────────────── */
function roundRect(ctx, x, y, w, h, r) {
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
