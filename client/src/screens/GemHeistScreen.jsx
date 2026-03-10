import { useState, useEffect, useRef, useCallback } from 'react';

const COLORS = {
    bg: '#0A0F1E', cyan: '#00F5FF', purple: '#7B61FF', pink: '#FF3D81',
    green: '#00FF9C', red: '#FF3D3D', amber: '#FBBF24', text: '#E2E8F0', textDim: '#94A3B8',
    gemNormal: '#00F5FF', gemGold: '#FFD700',
};

export default function GemHeistScreen({ playerId, gameState, onLeave }) {
    const canvasRef = useRef(null);
    const animRef = useRef(null);
    const stateRef = useRef({
        players: {}, gems: [], remaining: 90, scores: {},
        arenaW: 1000, arenaH: 700, maxCarry: 5, depositRadius: 50,
        events: [], gameOver: false, winnerId: null,
    });
    const inputRef = useRef({ left: false, right: false, up: false, down: false });
    const keysDown = useRef(new Set());
    const [showIntro, setShowIntro] = useState(true);
    const [gameOver, setGameOver] = useState(false);
    const [winData, setWinData] = useState(null);
    const [feed, setFeed] = useState([]);
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

    // Mobile button handler
    const handleMobileBtn = useCallback((key, value) => {
        inputRef.current[key] = value;
        gameState?.send?.({
            type: 'GAME_ACTION', action: 'input', ...inputRef.current,
        });
    }, [gameState]);

    // Handle game messages
    useEffect(() => {
        const msg = gameState?.lastMessage;
        if (!msg) return;
        const s = stateRef.current;

        if (msg.type === 'GAME_START') {
            s.arenaW = msg.arenaW || 1000;
            s.arenaH = msg.arenaH || 700;
            s.players = msg.players || {};
            s.gems = msg.gems || [];
            s.maxCarry = msg.maxCarry || 5;
            s.depositRadius = msg.depositRadius || 50;
        }

        if (msg.type === 'HEIST_TICK') {
            s.players = msg.players || s.players;
            s.gems = msg.gems || s.gems;
            s.remaining = msg.remaining ?? s.remaining;
            s.scores = msg.scores || s.scores;

            // Process events for feed
            if (msg.events?.length) {
                const newFeed = [];
                for (const ev of msg.events) {
                    if (ev.type === 'deposit') {
                        const pname = s.players[ev.playerId]?.username || '???';
                        newFeed.push(`💎 ${pname} deposited ${ev.amount} gem${ev.amount > 1 ? 's' : ''} (${ev.total} total)`);
                    } else if (ev.type === 'steal') {
                        const stealer = s.players[ev.stealer]?.username || '???';
                        const victim = s.players[ev.victim]?.username || '???';
                        newFeed.push(`💥 ${stealer} bumped ${victim} — ${ev.amount} gem${ev.amount > 1 ? 's' : ''} dropped!`);
                    }
                }
                if (newFeed.length) {
                    setFeed(prev => [...newFeed, ...prev].slice(0, 6));
                }
            }
        }

        if (msg.type === 'HEIST_GOLD_SPAWN') {
            setFeed(prev => ['⭐ GOLD GEM spawned! Worth 3x!', ...prev].slice(0, 6));
        }

        if (msg.type === 'GAME_OVER') {
            s.gameOver = true;
            s.winnerId = msg.winner; // server sends 'winner', not 'winnerId'
            setGameOver(true);
            setWinData({
                winnerId: msg.winner,
                players: s.players,
                scores: s.scores,
            });
        }
    }, [gameState?.lastMessage, playerId]);

    // Input handling
    useEffect(() => {
        const sendInput = () => {
            const inp = inputRef.current;
            gameState?.send?.({
                type: 'GAME_ACTION', action: 'input',
                left: inp.left, right: inp.right,
                up: inp.up, down: inp.down,
            });
        };

        const onKeyDown = (e) => {
            if (keysDown.current.has(e.code)) return;
            keysDown.current.add(e.code);
            const inp = inputRef.current;
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') inp.left = true;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') inp.right = true;
            if (e.code === 'ArrowUp' || e.code === 'KeyW') inp.up = true;
            if (e.code === 'ArrowDown' || e.code === 'KeyS') inp.down = true;
            sendInput();
        };
        const onKeyUp = (e) => {
            keysDown.current.delete(e.code);
            const inp = inputRef.current;
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') inp.left = false;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') inp.right = false;
            if (e.code === 'ArrowUp' || e.code === 'KeyW') inp.up = false;
            if (e.code === 'ArrowDown' || e.code === 'KeyS') inp.down = false;
            sendInput();
        };

        // Continuous input send at 15fps to keep server in sync
        const inputLoop = setInterval(sendInput, 66);

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        return () => {
            clearInterval(inputLoop);
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    }, [gameState]);

    // Touch controls
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const touchState = { active: false, startX: 0, startY: 0 };

        const onTouchStart = (e) => {
            e.preventDefault();
            const t = e.touches[0];
            touchState.active = true;
            touchState.startX = t.clientX;
            touchState.startY = t.clientY;
        };

        const onTouchMove = (e) => {
            e.preventDefault();
            if (!touchState.active) return;
            const t = e.touches[0];
            const dx = t.clientX - touchState.startX;
            const dy = t.clientY - touchState.startY;
            const inp = inputRef.current;
            inp.left = dx < -15; inp.right = dx > 15;
            inp.up = dy < -15; inp.down = dy > 15;
            gameState?.send?.({
                type: 'GAME_ACTION', action: 'input', ...inp,
            });
        };

        const onTouchEnd = (e) => {
            e.preventDefault();
            touchState.active = false;
            inputRef.current = { left: false, right: false, up: false, down: false };
            gameState?.send?.({
                type: 'GAME_ACTION', action: 'input', ...inputRef.current,
            });
        };

        canvas.addEventListener('touchstart', onTouchStart, { passive: false });
        canvas.addEventListener('touchmove', onTouchMove, { passive: false });
        canvas.addEventListener('touchend', onTouchEnd, { passive: false });
        return () => {
            canvas.removeEventListener('touchstart', onTouchStart);
            canvas.removeEventListener('touchmove', onTouchMove);
            canvas.removeEventListener('touchend', onTouchEnd);
        };
    }, [gameState]);

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
            const myP = s.players[playerId];

            // Camera
            let camX = 0, camY = 0;
            if (myP) {
                camX = myP.x - W / 2;
                camY = myP.y - H / 2;
                // Clamp camera
                camX = Math.max(0, Math.min(s.arenaW - W, camX));
                camY = Math.max(0, Math.min(s.arenaH - H, camY));
            }

            // Background
            ctx.fillStyle = '#08090F';
            ctx.fillRect(0, 0, W, H);

            ctx.save();
            ctx.translate(-camX, -camY);

            // Arena floor
            const floorGrad = ctx.createRadialGradient(s.arenaW / 2, s.arenaH / 2, 50,
                s.arenaW / 2, s.arenaH / 2, s.arenaW * 0.6);
            floorGrad.addColorStop(0, '#111522');
            floorGrad.addColorStop(0.5, '#0D1019');
            floorGrad.addColorStop(1, '#080A10');
            ctx.fillStyle = floorGrad;
            ctx.fillRect(0, 0, s.arenaW, s.arenaH);

            // Grid pattern
            ctx.save();
            ctx.globalAlpha = 0.04;
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 0.5;
            for (let gx = 0; gx < s.arenaW; gx += 40) {
                ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, s.arenaH); ctx.stroke();
            }
            for (let gy = 0; gy < s.arenaH; gy += 40) {
                ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(s.arenaW, gy); ctx.stroke();
            }
            ctx.restore();

            // Arena border
            ctx.strokeStyle = 'rgba(123,97,255,0.15)';
            ctx.lineWidth = 3;
            ctx.strokeRect(0, 0, s.arenaW, s.arenaH);

            // Draw deposit zones
            for (const [pid, pd] of Object.entries(s.players)) {
                const dz = pd.depositZone;
                if (!dz) continue;
                ctx.save();
                // Pulsing ring
                const pulse = Math.sin(time / 500 + parseInt(pid.slice(0, 4), 16)) * 0.15;
                ctx.globalAlpha = 0.15 + pulse;
                ctx.beginPath();
                ctx.arc(dz.x, dz.y, s.depositRadius, 0, Math.PI * 2);
                ctx.strokeStyle = pd.color;
                ctx.lineWidth = 2;
                ctx.setLineDash([6, 4]);
                ctx.stroke();
                ctx.setLineDash([]);
                // Fill
                ctx.globalAlpha = 0.05 + pulse * 0.5;
                ctx.fillStyle = pd.color;
                ctx.fill();
                // Label
                ctx.globalAlpha = 0.4;
                ctx.font = '8px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = pd.color;
                ctx.fillText(pid === playerId ? 'YOUR BASE' : pd.username, dz.x, dz.y + s.depositRadius + 12);
                ctx.restore();
            }

            // Draw gems
            for (const gem of s.gems) {
                if (!gem.active) continue;
                drawGem(ctx, gem.x, gem.y, gem.type, time);
            }

            // Draw players (others first, then self on top)
            const pIds = Object.keys(s.players);
            const sortedPIds = pIds.filter(id => id !== playerId);
            if (s.players[playerId]) sortedPIds.push(playerId);

            for (const pid of sortedPIds) {
                const pd = s.players[pid];
                if (!pd) continue;
                drawPlayer(ctx, pd, pid === playerId, time);
            }

            ctx.restore(); // End camera transform

            // ═══ HUD ═══
            drawHeistHUD(ctx, W, H, s, playerId, time);

            animRef.current = requestAnimationFrame(render);
        };

        animRef.current = requestAnimationFrame(render);
        return () => {
            cancelAnimationFrame(animRef.current);
            window.removeEventListener('resize', resize);
        };
    }, [playerId]);

    return (
        <div style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative', overflow: 'hidden' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

            {/* Intro overlay */}
            {showIntro && (
                <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(5,10,20,0.95)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', zIndex: 50, padding: 24,
                }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>💎</div>
                    <div style={{
                        fontSize: 22, fontWeight: 900, color: COLORS.cyan,
                        fontFamily: 'Orbitron, sans-serif', marginBottom: 8,
                    }}>
                        GEM HEIST ARENA
                    </div>
                    <div style={{
                        maxWidth: 320, textAlign: 'center', color: COLORS.textDim,
                        fontSize: 13, lineHeight: 1.6, marginBottom: 24,
                    }}>
                        <strong style={{ color: COLORS.cyan }}>💎 Collect</strong> gems scattered across the arena
                        <br /><br />
                        <strong style={{ color: COLORS.green }}>🏠 Deposit</strong> gems at your base zone to score
                        <br /><br />
                        <strong style={{ color: COLORS.pink }}>💥 Bump</strong> opponents while moving fast to make them drop gems!
                        <br /><br />
                        <strong style={{ color: COLORS.amber }}>⭐ Gold gems</strong> spawn every 30s — worth 3x!
                    </div>
                    <button
                        onClick={() => { setShowIntro(false); gameState?.send?.({ type: 'ARENA_READY' }); }}
                        style={{
                            background: `linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.purple})`,
                            border: 'none', borderRadius: 12, padding: '14px 40px',
                            color: '#fff', fontWeight: 900, fontSize: 16, cursor: 'pointer',
                            fontFamily: 'Orbitron, sans-serif', letterSpacing: 1,
                        }}
                    >
                        START HEIST 💎
                    </button>
                </div>
            )}

            {/* Event feed */}
            {!showIntro && feed.length > 0 && (
                <div style={{
                    position: 'absolute', left: 12, bottom: 40, zIndex: 10,
                    maxWidth: 260, pointerEvents: 'none',
                }}>
                    {feed.slice(0, 5).map((line, i) => (
                        <div key={i} style={{
                            fontSize: 10, color: i === 0 ? COLORS.text : COLORS.textDim,
                            opacity: 1 - i * 0.15, marginBottom: 2,
                        }}>
                            {line}
                        </div>
                    ))}
                </div>
            )}

            {/* Game over overlay */}
            {gameOver && winData && (
                <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(5,10,20,0.92)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', zIndex: 30,
                }}>
                    <div style={{
                        fontSize: 26, fontWeight: 900, fontFamily: 'Orbitron, sans-serif',
                        color: winData.winnerId === playerId ? COLORS.green : COLORS.red,
                        marginBottom: 16,
                    }}>
                        {winData.winnerId === playerId ? '🏆 YOU WIN!' : '💎 HEIST OVER'}
                    </div>

                    <div style={{
                        background: 'rgba(255,255,255,0.05)', borderRadius: 12,
                        padding: '12px 20px', minWidth: 250, marginBottom: 20,
                    }}>
                        {Object.entries(winData.players || {})
                            .sort((a, b) => (b[1].deposited || 0) - (a[1].deposited || 0))
                            .map(([pid, pd], i) => (
                                <div key={pid} style={{
                                    display: 'flex', justifyContent: 'space-between', padding: '4px 0',
                                    color: pid === playerId ? COLORS.cyan : COLORS.text,
                                    fontWeight: pid === playerId ? 700 : 400, fontSize: 13,
                                }}>
                                    <span style={{ color: pd.color }}>{i + 1}. {pd.username}</span>
                                    <span>💎 {pd.deposited}</span>
                                </div>
                            ))}
                    </div>

                    <button onClick={onLeave} style={{
                        background: `linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.purple})`,
                        border: 'none', borderRadius: 10, padding: '12px 32px',
                        color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    }}>
                        Return to Lobby
                    </button>
                </div>
            )}

            {/* Controls hint / Mobile D-Pad */}
            {!showIntro && !gameOver && (
                <>
                    {!isTouchDevice && (
                        <div style={{
                            position: 'absolute', bottom: 8, right: 12, fontSize: 9,
                            color: 'rgba(255,255,255,0.2)', zIndex: 5,
                        }}>
                            WASD / Arrows to move
                        </div>
                    )}
                    {isTouchDevice && (
                        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 15 }}>
                            {/* D-Pad (bottom-left) */}
                            <div style={{ position: 'absolute', bottom: 20, left: 18, pointerEvents: 'auto' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                    <button
                                        onTouchStart={(e) => { e.preventDefault(); handleMobileBtn('up', true); }}
                                        onTouchEnd={(e) => { e.preventDefault(); handleMobileBtn('up', false); }}
                                        onTouchCancel={(e) => { e.preventDefault(); handleMobileBtn('up', false); }}
                                        style={gemMobileBtnStyle}
                                    >▲</button>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <button
                                            onTouchStart={(e) => { e.preventDefault(); handleMobileBtn('left', true); }}
                                            onTouchEnd={(e) => { e.preventDefault(); handleMobileBtn('left', false); }}
                                            onTouchCancel={(e) => { e.preventDefault(); handleMobileBtn('left', false); }}
                                            style={gemMobileBtnStyle}
                                        >◀</button>
                                        <div style={{ width: 54, height: 54 }} />
                                        <button
                                            onTouchStart={(e) => { e.preventDefault(); handleMobileBtn('right', true); }}
                                            onTouchEnd={(e) => { e.preventDefault(); handleMobileBtn('right', false); }}
                                            onTouchCancel={(e) => { e.preventDefault(); handleMobileBtn('right', false); }}
                                            style={gemMobileBtnStyle}
                                        >▶</button>
                                    </div>
                                    <button
                                        onTouchStart={(e) => { e.preventDefault(); handleMobileBtn('down', true); }}
                                        onTouchEnd={(e) => { e.preventDefault(); handleMobileBtn('down', false); }}
                                        onTouchCancel={(e) => { e.preventDefault(); handleMobileBtn('down', false); }}
                                        style={gemMobileBtnStyle}
                                    >▼</button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

/* ═══ Draw Gem ═══ */
function drawGem(ctx, x, y, type, time) {
    const isGold = type === 'gold';
    const gR = isGold ? 10 : 7;
    const bob = Math.sin(time / 300 + x * 0.01) * 2;
    const gy = y + bob;

    // Glow
    ctx.save();
    ctx.globalAlpha = 0.2 + Math.sin(time / 400 + x * 0.05) * 0.1;
    ctx.beginPath();
    ctx.arc(x, gy, gR + 6, 0, Math.PI * 2);
    ctx.fillStyle = isGold ? COLORS.gemGold : COLORS.gemNormal;
    ctx.fill();
    ctx.restore();

    // Diamond shape
    ctx.save();
    ctx.translate(x, gy);
    ctx.rotate(time / 1000 + x * 0.01);

    ctx.beginPath();
    ctx.moveTo(0, -gR);           // Top
    ctx.lineTo(gR * 0.7, 0);      // Right
    ctx.lineTo(0, gR);            // Bottom
    ctx.lineTo(-gR * 0.7, 0);     // Left
    ctx.closePath();

    const gemGrad = ctx.createLinearGradient(0, -gR, 0, gR);
    if (isGold) {
        gemGrad.addColorStop(0, '#FFE566');
        gemGrad.addColorStop(0.5, '#FFD700');
        gemGrad.addColorStop(1, '#B8860B');
    } else {
        gemGrad.addColorStop(0, '#66FFFF');
        gemGrad.addColorStop(0.5, '#00F5FF');
        gemGrad.addColorStop(1, '#0088AA');
    }
    ctx.fillStyle = gemGrad;
    ctx.shadowColor = isGold ? COLORS.gemGold : COLORS.gemNormal;
    ctx.shadowBlur = 10;
    ctx.fill();

    // Center highlight
    ctx.beginPath();
    ctx.moveTo(0, -gR * 0.5);
    ctx.lineTo(gR * 0.3, 0);
    ctx.lineTo(0, gR * 0.3);
    ctx.lineTo(-gR * 0.3, 0);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.shadowBlur = 0;
    ctx.fill();

    ctx.restore();
}

/* ═══ Draw Player ═══ */
function drawPlayer(ctx, pd, isMe, time) {
    const { x, y, color, username, carrying, invincible } = pd;

    // Shadow
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.beginPath();
    ctx.ellipse(x, y + 14, 12, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.restore();

    // Invincibility shield
    const now = Date.now();
    if (invincible && invincible > now) {
        ctx.save();
        ctx.globalAlpha = 0.15 + Math.sin(time / 100) * 0.1;
        ctx.beginPath();
        ctx.arc(x, y, 22, 0, Math.PI * 2);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.restore();
    }

    // Body (circle character)
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    const bodyGrad = ctx.createRadialGradient(x - 3, y - 3, 2, x, y, 14);
    bodyGrad.addColorStop(0, lightenColor(color, 40));
    bodyGrad.addColorStop(1, darkenColor(color, 20));
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Outline
    ctx.strokeStyle = isMe ? '#fff' : 'rgba(255,255,255,0.2)';
    ctx.lineWidth = isMe ? 2 : 1;
    ctx.stroke();
    ctx.restore();

    // Eyes
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x - 4, y - 2, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 4, y - 2, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(x - 3.5, y - 1.5, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 4.5, y - 1.5, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Carrying indicator
    if (carrying > 0) {
        ctx.save();
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Gem count badge
        const badgeX = x + 12, badgeY = y - 12;
        ctx.beginPath();
        ctx.arc(badgeX, badgeY, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fill();
        ctx.strokeStyle = COLORS.cyan;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = COLORS.cyan;
        ctx.fillText(`${carrying}`, badgeX, badgeY);
        ctx.restore();
    }

    // Name tag
    ctx.save();
    ctx.font = `bold 9px Inter, sans-serif`;
    ctx.textAlign = 'center';
    const name = username || '';
    const tw = ctx.measureText(name).width;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.roundRect(x - tw / 2 - 4, y - 28, tw + 8, 14, 4);
    ctx.fill();
    ctx.fillStyle = isMe ? '#fff' : '#ccc';
    ctx.fillText(name, x, y - 17);
    ctx.restore();
}

/* ═══ Draw HUD ═══ */
function drawHeistHUD(ctx, W, H, s, playerId, time) {
    const myP = s.players[playerId];
    if (!myP) return;

    // Timer (top center)
    ctx.save();
    ctx.font = `bold 16px Orbitron, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = s.remaining < 15 ? COLORS.red : COLORS.text;
    const mins = Math.floor(s.remaining / 60);
    const secs = s.remaining % 60;
    ctx.fillText(`${mins}:${secs.toString().padStart(2, '0')}`, W / 2, 22);
    ctx.restore();

    // My stats (top left)
    ctx.save();
    ctx.font = `bold 12px Orbitron, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.cyan;
    ctx.fillText(`💎 Carrying: ${myP.carrying}/${s.maxCarry}`, 14, 22);
    ctx.fillStyle = COLORS.green;
    ctx.fillText(`🏠 Deposited: ${myP.deposited}`, 14, 40);
    ctx.restore();

    // Leaderboard (top right)
    const sorted = Object.entries(s.players)
        .sort((a, b) => (b[1].deposited || 0) - (a[1].deposited || 0));

    ctx.save();
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    sorted.forEach(([pid, pd], i) => {
        ctx.fillStyle = pid === playerId ? COLORS.cyan : COLORS.textDim;
        ctx.fillText(`${pd.username}: ${pd.deposited}💎`, W - 14, 18 + i * 14);
    });
    ctx.restore();
}

/* ═══ Utility ═══ */
function lightenColor(hex, amount) {
    try {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgb(${Math.min(255, r + amount)},${Math.min(255, g + amount)},${Math.min(255, b + amount)})`;
    } catch { return hex; }
}

function darkenColor(hex, amount) {
    try {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgb(${Math.max(0, r - amount)},${Math.max(0, g - amount)},${Math.max(0, b - amount)})`;
    } catch { return hex; }
}

/* ═══ Mobile Button Style ═══ */
const gemMobileBtnStyle = {
    width: 54, height: 54, borderRadius: 12,
    border: '2px solid rgba(0,245,255,0.3)',
    background: 'rgba(0,245,255,0.08)',
    color: '#fff', fontSize: 20,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', touchAction: 'none',
    WebkitTapHighlightColor: 'transparent',
    backdropFilter: 'blur(6px)',
    transition: 'transform 0.1s',
    userSelect: 'none', WebkitUserSelect: 'none',
};
