import { useState, useEffect, useRef, useCallback } from 'react';

const COLORS = {
    bg: '#0A0F1E', cyan: '#00F5FF', purple: '#7B61FF', pink: '#FF3D81',
    green: '#00FF9C', red: '#FF3D3D', amber: '#FBBF24', text: '#E2E8F0', textDim: '#94A3B8',
    road: '#2A2D35', grass: '#1a301a', curb: '#cc3333', curbW: '#ffffff',
};

export default function NeonDriftScreen({ playerId, gameState, onLeave }) {
    const canvasRef = useRef(null);
    const animRef = useRef(null);
    const stateRef = useRef({
        cars: {}, trackPoints: [], checkpoints: [], roadWidth: 100,
        cars: {}, trackPoints: [], checkpoints: [], roadWidth: 100,
        progress: {}, rankings: [], remaining: 120, lapsToWin: 3,
        finishOrder: [], raceOver: false, winnerId: null,
        powerUps: [], powerUpTypes: [], raceStartTime: 0,
    });
    const inputRef = useRef({ left: false, right: false, up: false, down: false, boost: false });
    const keysDown = useRef(new Set());
    const sendRef = useRef(null);
    const [showCountdown, setShowCountdown] = useState(true);
    const [raceOver, setRaceOver] = useState(false);
    const [winData, setWinData] = useState(null);
    const [lapNotice, setLapNotice] = useState('');

    // Handle game messages
    useEffect(() => {
        const msg = gameState?.lastMessage;
        if (!msg) return;
        const s = stateRef.current;

        if (msg.type === 'GAME_START') {
            s.trackPoints = msg.trackPoints || [];
            s.checkpoints = msg.checkpoints || [];
            s.roadWidth = msg.roadWidth || 100;
            s.cars = msg.cars || {};
            s.lapsToWin = msg.lapsToWin || 3;
            s.progress = msg.progress || {};
            s.powerUps = msg.powerUps || [];
            s.powerUpTypes = msg.powerUpTypes || [];
            s.raceStartTime = Date.now() + 3000;
            // Start countdown
            setShowCountdown(true);
            setTimeout(() => setShowCountdown(false), 3000);
            // Send arena ready — use sendRef for reliable access
            setTimeout(() => {
                sendRef.current?.({ type: 'ARENA_READY' });
            }, 100);
        }

        if (msg.type === 'DRIFT_TICK') {
            s.cars = msg.cars || s.cars;
            s.progress = msg.progress || s.progress;
            s.rankings = msg.rankings || s.rankings;
            s.remaining = msg.remaining ?? s.remaining;
            s.finishOrder = msg.finishOrder || s.finishOrder;
            s.powerUps = msg.powerUps || s.powerUps;
        }

        if (msg.type === 'DRIFT_LAP') {
            if (msg.playerId === playerId) {
                setLapNotice(`LAP ${msg.laps}/${msg.lapsToWin}`);
                setTimeout(() => setLapNotice(''), 2000);
            }
        }

        if (msg.type === 'DRIFT_FINISH') {
            if (msg.playerId === playerId) {
                setLapNotice(`🏁 FINISHED P${msg.position}!`);
            }
        }

        if (msg.type === 'GAME_OVER') {
            s.raceOver = true;
            s.winnerId = msg.winner; // server sends 'winner'
            setRaceOver(true);
            setWinData({
                winnerId: msg.winner,
                rankings: s.rankings,
            });
        }
    }, [gameState?.lastMessage, playerId]);

    // Input handling
    useEffect(() => {
        // Keep sendRef up to date
        sendRef.current = gameState?.send;

        const sendInput = () => {
            const inp = inputRef.current;
            gameState?.send?.({
                type: 'GAME_ACTION', action: 'input',
                left: inp.left, right: inp.right,
                up: inp.up, down: inp.down, boost: inp.boost,
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
            if (e.code === 'ShiftLeft' || e.code === 'Space') inp.boost = true;
            sendInput();
        };
        const onKeyUp = (e) => {
            keysDown.current.delete(e.code);
            const inp = inputRef.current;
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') inp.left = false;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') inp.right = false;
            if (e.code === 'ArrowUp' || e.code === 'KeyW') inp.up = false;
            if (e.code === 'ArrowDown' || e.code === 'KeyS') inp.down = false;
            if (e.code === 'ShiftLeft' || e.code === 'Space') inp.boost = false;
            sendInput();
        };

        // Continuous input send at 15fps for smooth driving
        const inputLoop = setInterval(sendInput, 66);

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        return () => {
            clearInterval(inputLoop);
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    }, [gameState]);

    // Touch controls — dedicated mobile buttons
    const touchStateRef = useRef({ active: false, startX: 0, startY: 0 });
    const [isTouchDevice, setIsTouchDevice] = useState(false);

    useEffect(() => {
        const check = () => {
            const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            setIsTouchDevice(hasTouch || window.innerWidth <= 1024);
        };
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleTouchStart = (e) => {
            e.preventDefault();
            const t = e.touches[0];
            touchStateRef.current = { active: true, startX: t.clientX, startY: t.clientY };
            inputRef.current.up = true;
            gameState?.send?.({
                type: 'GAME_ACTION', action: 'input',
                ...inputRef.current,
            });
        };

        const handleTouchMove = (e) => {
            e.preventDefault();
            if (!touchStateRef.current.active) return;
            const t = e.touches[0];
            const dx = t.clientX - touchStateRef.current.startX;
            inputRef.current.left = dx < -20;
            inputRef.current.right = dx > 20;
            gameState?.send?.({
                type: 'GAME_ACTION', action: 'input',
                ...inputRef.current,
            });
        };

        const handleTouchEnd = (e) => {
            e.preventDefault();
            touchStateRef.current.active = false;
            inputRef.current = { left: false, right: false, up: false, down: false, boost: false };
            gameState?.send?.({
                type: 'GAME_ACTION', action: 'input',
                ...inputRef.current,
            });
        };

        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

        return () => {
            canvas.removeEventListener('touchstart', handleTouchStart);
            canvas.removeEventListener('touchmove', handleTouchMove);
            canvas.removeEventListener('touchend', handleTouchEnd);
        };
    }, [gameState]);

    // Mobile button handlers
    const handleMobileBtn = useCallback((key, value) => {
        inputRef.current[key] = value;
        gameState?.send?.({
            type: 'GAME_ACTION', action: 'input',
            ...inputRef.current,
        });
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
            const myCar = s.cars[playerId];
            if (!myCar) {
                ctx.fillStyle = COLORS.bg;
                ctx.fillRect(0, 0, W, H);
                ctx.fillStyle = COLORS.text;
                ctx.font = '16px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Waiting for race...', W / 2, H / 2);
                animRef.current = requestAnimationFrame(render);
                return;
            }

            // Camera centered on player car
            const camX = myCar.x - W / 2;
            const camY = myCar.y - H / 2;

            // Background (rich grass/ground)
            const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, W * 0.8);
            bgGrad.addColorStop(0, '#142e14');
            bgGrad.addColorStop(0.4, '#0d230d');
            bgGrad.addColorStop(0.8, '#091a09');
            bgGrad.addColorStop(1, '#061206');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, W, H);

            // Grass texture: subtle cross-hatch
            ctx.save();
            const grassOff = time * 0.001;
            for (let gx = -30; gx < W + 30; gx += 20) {
                for (let gy = -30; gy < H + 30; gy += 20) {
                    const wx = gx + (camX * 0.15 % 20);
                    const wy = gy + (camY * 0.15 % 20);
                    const shade = ((Math.floor(wx / 20) + Math.floor(wy / 20)) % 2 === 0) ? 0.04 : 0.02;
                    ctx.globalAlpha = shade;
                    ctx.fillStyle = '#2a5a2a';
                    ctx.fillRect(gx, gy, 10, 10);
                }
            }
            ctx.restore();

            ctx.save();
            ctx.translate(-camX, -camY);

            // Draw track
            if (s.trackPoints.length > 2) {
                // Helper: draw track path on ctx
                const drawTrackPath = () => {
                    ctx.beginPath();
                    ctx.moveTo(s.trackPoints[0].x, s.trackPoints[0].y);
                    for (let i = 1; i < s.trackPoints.length; i++) {
                        ctx.lineTo(s.trackPoints[i].x, s.trackPoints[i].y);
                    }
                    ctx.closePath();
                };

                // Rumble strip / curb (red-white alternating outer edge)
                ctx.save();
                ctx.lineWidth = s.roadWidth * 2 + 16;
                ctx.setLineDash([8, 8]);
                ctx.lineDashOffset = (time / 30) % 16;
                ctx.strokeStyle = '#cc2222';
                ctx.lineJoin = 'round'; ctx.lineCap = 'round';
                drawTrackPath(); ctx.stroke();
                ctx.lineDashOffset = (time / 30) % 16 + 8;
                ctx.strokeStyle = '#dddddd';
                drawTrackPath(); ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();

                // Road surface (smooth dark asphalt)
                ctx.save();
                ctx.lineWidth = s.roadWidth * 2;
                const roadGrad = ctx.createLinearGradient(
                    s.trackPoints[0].x, s.trackPoints[0].y,
                    s.trackPoints[Math.floor(s.trackPoints.length / 2)].x,
                    s.trackPoints[Math.floor(s.trackPoints.length / 2)].y
                );
                roadGrad.addColorStop(0, '#2A2D35');
                roadGrad.addColorStop(0.5, '#222530');
                roadGrad.addColorStop(1, '#2A2D35');
                ctx.strokeStyle = roadGrad;
                ctx.lineJoin = 'round'; ctx.lineCap = 'round';
                drawTrackPath(); ctx.stroke();
                ctx.restore();

                // Lane markings: solid white edge lines
                for (const offset of [-1, 1]) {
                    ctx.save();
                    ctx.lineWidth = s.roadWidth * 2 + offset * (s.roadWidth * 2 - 8);
                    ctx.strokeStyle = `rgba(255,255,255,0.${offset === -1 ? '15' : '12'})`;
                    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
                    drawTrackPath();
                    ctx.stroke();
                    ctx.restore();
                }

                // Re-draw core road to clean up edge overlap
                ctx.save();
                ctx.lineWidth = s.roadWidth * 2 - 10;
                ctx.strokeStyle = '#252830';
                ctx.lineJoin = 'round'; ctx.lineCap = 'round';
                drawTrackPath(); ctx.stroke();
                ctx.restore();

                // Center dashed line (animated)
                ctx.save();
                ctx.setLineDash([14, 16]);
                ctx.lineDashOffset = -(time / 18) % 30;
                ctx.lineWidth = 2.5;
                ctx.strokeStyle = 'rgba(255,255,100,0.18)';
                drawTrackPath(); ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();

                // Start/finish checkerboard line
                const sp = s.trackPoints[0];
                const np = s.trackPoints[1];
                const ang = Math.atan2(np.y - sp.y, np.x - sp.x);
                ctx.save();
                ctx.translate(sp.x, sp.y);
                ctx.rotate(ang + Math.PI / 2);
                const rw = s.roadWidth;
                const cellSz = 8;
                for (let c = -rw; c < rw; c += cellSz) {
                    for (let r = -cellSz; r < cellSz; r += cellSz) {
                        const isWhite = ((Math.floor((c + rw) / cellSz) + Math.floor((r + cellSz) / cellSz)) % 2 === 0);
                        ctx.fillStyle = isWhite ? '#ffffff' : '#111111';
                        ctx.globalAlpha = 0.65;
                        ctx.fillRect(c, r, cellSz, cellSz);
                    }
                }
                ctx.restore();
            }

            // Draw checkpoints (small glowing markers)
            for (let ci = 0; ci < s.checkpoints.length; ci++) {
                const cp = s.checkpoints[ci];
                ctx.save();
                const cpPulse = Math.sin(time / 400 + ci * 0.8) * 0.08;
                ctx.globalAlpha = 0.2 + cpPulse;
                ctx.beginPath();
                ctx.arc(cp.x, cp.y, 14, 0, Math.PI * 2);
                ctx.fillStyle = COLORS.amber;
                ctx.shadowColor = COLORS.amber;
                ctx.shadowBlur = 14;
                ctx.fill();
                ctx.shadowBlur = 0;
                // Checkpoint number
                ctx.globalAlpha = 0.5;
                ctx.font = 'bold 8px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#000';
                ctx.fillText(`${ci + 1}`, cp.x, cp.y);
                ctx.restore();
            }

            // ═══ Draw Power-ups ═══
            const pups = s.powerUps || [];
            for (const pu of pups) {
                if (!pu.active) continue;
                ctx.save();
                const puPulse = 0.85 + Math.sin(time / 250 + pu.id) * 0.15;
                const puSize = 16 * puPulse;

                // Outer glow
                ctx.beginPath();
                ctx.arc(pu.x, pu.y, puSize + 8, 0, Math.PI * 2);
                ctx.fillStyle = pu.color + '18';
                ctx.shadowColor = pu.color;
                ctx.shadowBlur = 20;
                ctx.fill();

                // Background circle
                ctx.beginPath();
                ctx.arc(pu.x, pu.y, puSize, 0, Math.PI * 2);
                ctx.fillStyle = '#1a1a2e';
                ctx.strokeStyle = pu.color;
                ctx.lineWidth = 2.5;
                ctx.shadowBlur = 12;
                ctx.fill();
                ctx.stroke();

                // Icon
                ctx.shadowBlur = 0;
                ctx.font = `${Math.round(puSize * 0.9)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(pu.icon, pu.x, pu.y);
                ctx.restore();
            }

            // Draw all cars (others first, then player on top)
            const carIds = Object.keys(s.cars);
            const sortedIds = carIds.filter(id => id !== playerId);
            sortedIds.push(playerId); // Player car rendered last (on top)

            for (const cId of sortedIds) {
                const car = s.cars[cId];
                if (!car) continue;
                drawCar(ctx, car, cId === playerId, time);
            }

            // Directional Arrow (first 5 seconds of race)
            const raceStartElapsed = Date.now() - Math.max(0, s.raceStartTime || 0);
            if (s.raceStartTime && raceStartElapsed >= 0 && raceStartElapsed < 5000 && s.trackPoints.length > 1) {
                const sp = s.trackPoints[0];
                const np = s.trackPoints[1];
                const dirAng = Math.atan2(np.y - sp.y, np.x - sp.x);
                
                ctx.save();
                ctx.translate(myCar.x, myCar.y);
                const fade = Math.min(1, Math.max(0, 1 - raceStartElapsed / 5000));
                const arrowPulse = 1 + Math.sin(time / 150) * 0.2;
                ctx.globalAlpha = fade;
                
                ctx.rotate(dirAng);
                ctx.translate(60 + arrowPulse * 10, 0); // Position ahead of car
                
                ctx.fillStyle = COLORS.cyan;
                ctx.shadowColor = COLORS.cyan;
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.moveTo(15, 0);
                ctx.lineTo(-10, -10);
                ctx.lineTo(-5, 0);
                ctx.lineTo(-10, 10);
                ctx.closePath();
                ctx.fill();
                
                ctx.shadowBlur = 0;
                ctx.font = 'bold 14px Orbitron, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('GO →', 0, -20);
                
                ctx.restore();
            }

            ctx.restore(); // End camera transform

            // ═══ HUD ═══
            drawHUD(ctx, W, H, s, playerId, time);

            // ═══ Minimap ═══
            drawMinimap(ctx, W, H, s, playerId);

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

            {/* Countdown overlay */}
            {showCountdown && (
                <div style={{
                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.6)', zIndex: 20,
                }}>
                    <CountdownTimer />
                </div>
            )}

            {/* Lap notice */}
            {lapNotice && (
                <div style={{
                    position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)',
                    fontSize: 36, fontWeight: 900, color: COLORS.green,
                    fontFamily: 'Orbitron, sans-serif', textShadow: `0 0 30px ${COLORS.green}`,
                    zIndex: 15, animation: 'pulse 0.5s ease-out',
                }}>
                    {lapNotice}
                </div>
            )}

            {/* Race over overlay */}
            {raceOver && winData && (
                <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(5,10,20,0.90)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', zIndex: 30,
                }}>
                    <div style={{
                        fontSize: 26, fontWeight: 900, fontFamily: 'Orbitron, sans-serif',
                        color: winData.winnerId === playerId ? COLORS.green : COLORS.red,
                        marginBottom: 16,
                    }}>
                        {winData.winnerId === playerId ? '🏆 YOU WIN!' : '🏁 RACE OVER'}
                    </div>

                    {/* Rankings */}
                    <div style={{
                        background: 'rgba(255,255,255,0.05)', borderRadius: 12,
                        padding: '12px 20px', minWidth: 250, marginBottom: 20,
                    }}>
                        {(winData.rankings || []).map((r, i) => (
                            <div key={r.id} style={{
                                display: 'flex', justifyContent: 'space-between', padding: '4px 0',
                                color: r.id === playerId ? COLORS.cyan : COLORS.text,
                                fontWeight: r.id === playerId ? 700 : 400,
                                fontSize: 13,
                            }}>
                                <span>P{r.position} {r.username}</span>
                                <span>{r.laps}L {r.cpCount}CP</span>
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

            {/* Mobile controls hint */}
            {!isTouchDevice && (
                <div style={{
                    position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
                    fontSize: 10, color: 'rgba(255,255,255,0.25)', zIndex: 5,
                }}>
                    WASD / Arrows to drive • SHIFT to boost
                </div>
            )}

            {/* Mobile Touch Controls */}
            {isTouchDevice && !raceOver && (
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
                    {/* Left side — Steering */}
                    <div style={{ position: 'absolute', bottom: 24, left: 16, display: 'flex', gap: 10, pointerEvents: 'auto' }}>
                        <button
                            onTouchStart={(e) => { e.preventDefault(); handleMobileBtn('left', true); }}
                            onTouchEnd={(e) => { e.preventDefault(); handleMobileBtn('left', false); }}
                            onTouchCancel={(e) => { e.preventDefault(); handleMobileBtn('left', false); }}
                            style={mobileBtnStyle}
                        >◀</button>
                        <button
                            onTouchStart={(e) => { e.preventDefault(); handleMobileBtn('right', true); }}
                            onTouchEnd={(e) => { e.preventDefault(); handleMobileBtn('right', false); }}
                            onTouchCancel={(e) => { e.preventDefault(); handleMobileBtn('right', false); }}
                            style={mobileBtnStyle}
                        >▶</button>
                    </div>

                    {/* Right side — Gas / Brake / Boost */}
                    <div style={{ position: 'absolute', bottom: 24, right: 16, display: 'flex', gap: 10, alignItems: 'flex-end', pointerEvents: 'auto' }}>
                        <button
                            onTouchStart={(e) => { e.preventDefault(); handleMobileBtn('down', true); }}
                            onTouchEnd={(e) => { e.preventDefault(); handleMobileBtn('down', false); }}
                            onTouchCancel={(e) => { e.preventDefault(); handleMobileBtn('down', false); }}
                            style={{ ...mobileBtnStyle, background: 'rgba(255,61,61,0.25)', borderColor: 'rgba(255,61,61,0.5)' }}
                        >🔻</button>
                        <button
                            onTouchStart={(e) => { e.preventDefault(); handleMobileBtn('up', true); }}
                            onTouchEnd={(e) => { e.preventDefault(); handleMobileBtn('up', false); }}
                            onTouchCancel={(e) => { e.preventDefault(); handleMobileBtn('up', false); }}
                            style={{ ...mobileBtnStyle, width: 78, height: 78, fontSize: 28, background: 'rgba(0,255,156,0.2)', borderColor: 'rgba(0,255,156,0.5)' }}
                        >▲</button>
                        <button
                            onTouchStart={(e) => { e.preventDefault(); handleMobileBtn('boost', true); }}
                            onTouchEnd={(e) => { e.preventDefault(); handleMobileBtn('boost', false); }}
                            onTouchCancel={(e) => { e.preventDefault(); handleMobileBtn('boost', false); }}
                            style={{ ...mobileBtnStyle, borderRadius: '50%', width: 64, height: 64, fontSize: 12, fontWeight: 800, background: 'rgba(0,245,255,0.17)', borderColor: 'rgba(0,245,255,0.5)' }}
                        >⚡⁠BOOST</button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.5} }
            `}</style>
        </div>
    );
}

/* ═══ Countdown Component ═══ */
function CountdownTimer() {
    const [count, setCount] = useState(3);
    useEffect(() => {
        if (count <= 0) return;
        const t = setTimeout(() => setCount(count - 1), 1000);
        return () => clearTimeout(t);
    }, [count]);

    return (
        <div style={{
            fontSize: count > 0 ? 80 : 50, fontWeight: 900, fontFamily: 'Orbitron, sans-serif',
            color: count > 0 ? COLORS.amber : COLORS.green,
            textShadow: `0 0 40px ${count > 0 ? COLORS.amber : COLORS.green}`,
        }}>
            {count > 0 ? count : 'GO!'}
        </div>
    );
}

/* ═══ Draw Car ═══ */
function drawCar(ctx, car, isPlayer, time) {
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);

    // Shadow
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(2, 2, 18, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Car body — top-down sports car shape
    const cL = 18, cW = 9;
    ctx.beginPath();
    ctx.moveTo(cL, 0);
    ctx.bezierCurveTo(cL, -cW * 0.4, cL - 3, -cW * 0.8, cL - 5, -cW);
    ctx.lineTo(-cL + 4, -cW);
    ctx.bezierCurveTo(-cL + 1, -cW, -cL, -cW * 0.7, -cL, 0);
    ctx.bezierCurveTo(-cL, cW * 0.7, -cL + 1, cW, -cL + 4, cW);
    ctx.lineTo(cL - 5, cW);
    ctx.bezierCurveTo(cL - 3, cW * 0.8, cL, cW * 0.4, cL, 0);
    ctx.closePath();

    // Body paint gradient
    const bodyGrad = ctx.createLinearGradient(0, -cW, 0, cW);
    bodyGrad.addColorStop(0, lightenColor(car.color, 30));
    bodyGrad.addColorStop(0.5, car.color);
    bodyGrad.addColorStop(1, darkenColor(car.color, 30));
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Outline
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Windshield
    ctx.beginPath();
    ctx.moveTo(cL - 10, -cW * 0.5);
    ctx.lineTo(cL - 7, -cW * 0.35);
    ctx.lineTo(cL - 7, cW * 0.35);
    ctx.lineTo(cL - 10, cW * 0.5);
    ctx.closePath();
    ctx.fillStyle = 'rgba(100, 180, 255, 0.35)';
    ctx.fill();

    // Headlights
    ctx.fillStyle = '#ffffcc';
    ctx.shadowColor = '#ffffaa';
    ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(cL - 2, -cW * 0.55, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cL - 2, cW * 0.55, 2, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // Tail lights
    ctx.fillStyle = '#ff3333';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 5;
    ctx.beginPath(); ctx.arc(-cL + 3, -cW * 0.6, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-cL + 3, cW * 0.6, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // Boost flame
    if (car.boosted) {
        ctx.save();
        const flameLen = 12 + Math.random() * 8;
        const grad = ctx.createLinearGradient(-cL, 0, -cL - flameLen, 0);
        grad.addColorStop(0, 'rgba(0,245,255,0.8)');
        grad.addColorStop(0.5, 'rgba(123,97,255,0.4)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(-cL, -3);
        ctx.lineTo(-cL - flameLen, 0);
        ctx.lineTo(-cL, 3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // Drift smoke
    if (car.driftMeter > 30) {
        ctx.save();
        ctx.globalAlpha = Math.min(0.3, car.driftMeter / 200);
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(-cL + Math.random() * 8, (Math.random() - 0.5) * cW * 2, 3 + Math.random() * 3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(200,200,200,0.3)';
            ctx.fill();
        }
        ctx.restore();
    }

    ctx.restore();

    // Name tag
    ctx.save();
    ctx.font = `bold 9px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const name = car.username || '';
    const tw = ctx.measureText(name).width;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.roundRect(car.x - tw / 2 - 4, car.y - 26, tw + 8, 14, 4);
    ctx.fill();
    ctx.fillStyle = isPlayer ? COLORS.cyan : '#ddd';
    ctx.fillText(name, car.x, car.y - 14);
    ctx.restore();
}

/* ═══ Draw HUD ═══ */
function drawHUD(ctx, W, H, s, playerId, time) {
    const myCar = s.cars[playerId];
    const myProg = s.progress[playerId];
    if (!myCar || !myProg) return;

    // Speed gauge (bottom center)
    const speed = Math.abs(myCar.speed || 0);
    const speedPct = Math.min(1, speed / 6);
    const gaugeR = 50;
    const gx = W / 2, gy = H - 55;

    // Gauge background
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(gx, gy, gaugeR + 4, Math.PI * 0.8, Math.PI * 2.2);
    ctx.lineWidth = 8;
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.stroke();
    ctx.restore();

    // Gauge fill
    ctx.save();
    ctx.beginPath();
    const startAngle = Math.PI * 0.8;
    const endAngle = startAngle + speedPct * Math.PI * 1.4;
    ctx.arc(gx, gy, gaugeR, startAngle, endAngle);
    ctx.lineWidth = 6;
    const gaugeGrad = ctx.createLinearGradient(gx - gaugeR, gy, gx + gaugeR, gy);
    gaugeGrad.addColorStop(0, COLORS.cyan);
    gaugeGrad.addColorStop(0.5, COLORS.green);
    gaugeGrad.addColorStop(1, COLORS.red);
    ctx.strokeStyle = gaugeGrad;
    ctx.shadowColor = COLORS.cyan;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.restore();

    // Speed number
    const kmh = Math.round(speed * 50);
    ctx.font = `bold 22px Orbitron, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(kmh, gx, gy - 5);
    ctx.font = '8px sans-serif';
    ctx.fillStyle = COLORS.textDim;
    ctx.fillText('KM/H', gx, gy + 10);

    // Boost meter (below speed gauge)
    const boostW = 80, boostH = 6;
    const boostX = gx - boostW / 2, boostY = gy + 22;
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(boostX, boostY, boostW, boostH);
    const boostPct = (myCar.boostMeter || 0) / 100;
    const boostGrad = ctx.createLinearGradient(boostX, 0, boostX + boostW, 0);
    boostGrad.addColorStop(0, COLORS.purple);
    boostGrad.addColorStop(1, COLORS.cyan);
    ctx.fillStyle = boostGrad;
    ctx.fillRect(boostX, boostY, boostW * boostPct, boostH);
    ctx.font = '7px sans-serif';
    ctx.fillStyle = COLORS.textDim;
    ctx.textAlign = 'center';
    ctx.fillText(`BOOST ${Math.round(myCar.boostMeter || 0)}%`, gx, boostY + boostH + 9);

    // Position indicator (top right)
    const myRanking = (s.rankings || []).find(r => r.id === playerId);
    const pos = myRanking?.position || '?';
    const total = Object.keys(s.cars).length;
    ctx.save();
    ctx.font = `bold 28px Orbitron, sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#fff';
    ctx.fillText(`${pos}`, W - 16, 14);
    ctx.font = `bold 14px Orbitron, sans-serif`;
    ctx.fillStyle = COLORS.textDim;
    ctx.fillText(`/${total}`, W - 16, 44);
    ctx.restore();

    // Lap counter (top right, below position)
    ctx.save();
    ctx.font = `bold 12px Orbitron, sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.amber;
    ctx.fillText(`LAP ${myProg.laps + 1}/${s.lapsToWin}`, W - 16, 66);
    ctx.restore();

    // Time remaining (top center)
    ctx.save();
    ctx.font = `bold 14px Orbitron, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = s.remaining < 15 ? COLORS.red : COLORS.text;
    const mins = Math.floor(s.remaining / 60);
    const secs = s.remaining % 60;
    ctx.fillText(`${mins}:${secs.toString().padStart(2, '0')}`, W / 2, 20);
    ctx.restore();

    // On/off road indicator
    if (!myCar.onRoad) {
        ctx.save();
        ctx.font = `bold 12px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = COLORS.red;
        ctx.globalAlpha = 0.5 + Math.sin(time / 200) * 0.3;
        ctx.fillText('⚠ OFF TRACK', W / 2, 40);
        ctx.restore();
    }

    // Active power-up effect indicator
    if (myCar.activeEffect) {
        const effectLabels = {
            speed: { label: '⚡ SPEED BOOST', color: '#00FF9C' },
            turbo: { label: '🚀 TURBO!', color: '#06B6D4' },
        };
        const eff = effectLabels[myCar.activeEffect];
        if (eff) {
            ctx.save();
            ctx.font = 'bold 14px Orbitron, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = eff.color;
            ctx.shadowColor = eff.color;
            ctx.shadowBlur = 16;
            ctx.globalAlpha = 0.7 + Math.sin(time / 150) * 0.3;
            ctx.fillText(eff.label, W / 2, 58);
            ctx.restore();
        }
    }
}

/* ═══ Draw Minimap ═══ */
function drawMinimap(ctx, W, H, s, playerId) {
    if (!s.trackPoints.length) return;

    const mmW = 120, mmH = 80;
    const mx = 12, my = 12;

    // Find track bounds
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of s.trackPoints) {
        minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    }
    const pad = 50;
    minX -= pad; minY -= pad; maxX += pad; maxY += pad;
    const scaleX = mmW / (maxX - minX);
    const scaleY = mmH / (maxY - minY);
    const sc = Math.min(scaleX, scaleY);

    // Background
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.beginPath();
    ctx.roundRect(mx - 4, my - 4, mmW + 8, mmH + 8, 6);
    ctx.fill();
    ctx.restore();

    // Track line
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < s.trackPoints.length; i++) {
        const px = mx + (s.trackPoints[i].x - minX) * sc;
        const py = my + (s.trackPoints[i].y - minY) * sc;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // Cars on minimap
    for (const [cId, car] of Object.entries(s.cars)) {
        const px = mx + (car.x - minX) * sc;
        const py = my + (car.y - minY) * sc;
        ctx.beginPath();
        ctx.arc(px, py, cId === playerId ? 3 : 2, 0, Math.PI * 2);
        ctx.fillStyle = car.color || '#fff';
        if (cId === playerId) {
            ctx.shadowColor = car.color;
            ctx.shadowBlur = 6;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

/* ═══ Utility ═══ */
function lightenColor(hex, amount) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.min(255, r + amount)},${Math.min(255, g + amount)},${Math.min(255, b + amount)})`;
}

function darkenColor(hex, amount) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.max(0, r - amount)},${Math.max(0, g - amount)},${Math.max(0, b - amount)})`;
}

/* ═══ Mobile Button Style ═══ */
const mobileBtnStyle = {
    width: 64, height: 64, borderRadius: 14,
    border: '2px solid rgba(255,255,255,0.3)',
    background: 'rgba(255,255,255,0.08)',
    color: '#fff', fontSize: 22,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', touchAction: 'none',
    WebkitTapHighlightColor: 'transparent',
    backdropFilter: 'blur(6px)',
    transition: 'transform 0.1s',
    userSelect: 'none', WebkitUserSelect: 'none',
};
