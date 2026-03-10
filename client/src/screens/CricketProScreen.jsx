import { useState, useEffect, useRef, useCallback } from 'react';

const COLORS = {
    bg: '#0A0F1E', cyan: '#00F5FF', purple: '#7B61FF', pink: '#FF3D81',
    green: '#00FF9C', red: '#FF3D3D', amber: '#FBBF24', text: '#E2E8F0', textDim: '#94A3B8',
};

export default function CricketProScreen({ playerId, gameState, onLeave }) {
    const canvasRef = useRef(null);
    const animRef = useRef(null);
    const stateRef = useRef({
        phase: 'waiting', ball: 0, totalBalls: 12, innings: 1,
        batterId: null, bowlerId: null, batterUsername: '', bowlerUsername: '',
        scoreboard: {}, ballProgress: 0, ballStartTime: 0,
        shotResult: null, shotResultTime: 0,
        speed: 0.5, swing: 0, bouncePoint: 0.5, delivery: null,
        bowlingCountdown: 5, ballLog: [], target: null,
        // Animation states
        swinging: false, swingStart: 0, swingType: 'drive',
        wicketFalling: false, wicketFallStart: 0,
        bowlerAction: false, bowlerActionStart: 0,
        screenShake: 0, screenShakeStart: 0,
    });
    const timingAnimRef = useRef(null);
    const timingRef = useRef(0);
    const [showIntro, setShowIntro] = useState(true);
    const [showTimingBar, setShowTimingBar] = useState(false);
    const [timingVal, setTimingVal] = useState(0);
    const [phase, setPhase] = useState('waiting');
    const [isBatter, setIsBatter] = useState(false);
    const [isBowler, setIsBowler] = useState(false);
    const [bowlChoiceMade, setBowlChoiceMade] = useState(false);
    const [innings, setInnings] = useState(1);
    const [target, setTarget] = useState(null);
    const [showSummary, setShowSummary] = useState(false);
    const [summaryData, setSummaryData] = useState(null);
    const [commentary, setCommentary] = useState([]);
    const [playerList, setPlayerList] = useState([]);
    const [scoreboard, setScoreboard] = useState({});
    const [ballLog, setBallLog] = useState([]);
    const [ballInfo, setBallInfo] = useState({ ball: 0, totalBalls: 12 });
    const sentRef = useRef(new Set()); // Track processed message IDs
    const [selectedShot, setSelectedShot] = useState('drive');
    const [showShotSelect, setShowShotSelect] = useState(false);
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

    // Send helper
    const send = useCallback((data) => {
        if (gameState?.send) {
            gameState.send(data);
        }
    }, [gameState]);

    // Process game messages
    useEffect(() => {
        const msg = gameState?.lastMessage;
        if (!msg) return;
        const s = stateRef.current;

        if (msg.type === 'GAME_START') {
            s.totalBalls = msg.ballsPerInnings || 12;
            s.scoreboard = msg.scoreboard || {};
            s.batterId = msg.batterId;
            s.bowlerId = msg.bowlerId;
            s.batterUsername = msg.playerOrder?.find(p => p.id === msg.batterId)?.username || '';
            s.bowlerUsername = msg.playerOrder?.find(p => p.id === msg.bowlerId)?.username || '';
            setScoreboard(msg.scoreboard || {});
            setPlayerList(msg.playerOrder || []);
            setBallInfo({ ball: 0, totalBalls: msg.ballsPerInnings || 12 });
            // Set roles immediately so the player is not stuck in spectating mode
            setIsBatter(msg.batterId === playerId);
            setIsBowler(msg.bowlerId === playerId);
            setPhase('waiting');
            setInnings(msg.innings || 1);
        }

        if (msg.type === 'CRICKET_PHASE') {
            s.phase = msg.phase;
            s.ball = msg.ball || s.ball;
            s.innings = msg.innings || s.innings;
            s.batterId = msg.batterId || s.batterId;
            s.bowlerId = msg.bowlerId || s.bowlerId;
            s.batterUsername = msg.batterUsername || s.batterUsername;
            s.bowlerUsername = msg.bowlerUsername || s.bowlerUsername;
            // Reset animation states on new ball
            if (msg.newBall) {
                s.wicketFalling = false;
                s.swinging = false;
                s.bowlerAction = false;
                s.screenShake = 0;
            }
            if (msg.scoreboard) { s.scoreboard = msg.scoreboard; setScoreboard(msg.scoreboard); }

            setPhase(msg.phase);
            setIsBatter(msg.batterId === playerId);
            setIsBowler(msg.bowlerId === playerId);
            setInnings(msg.innings || 1);
            setBowlChoiceMade(false);
            setBallInfo({ ball: msg.ball || s.ball, totalBalls: msg.totalBalls || s.totalBalls });

            if (msg.phase === 'batting_window') {
                if (msg.batterId === playerId) {
                    setShowTimingBar(true);
                    setShowShotSelect(false); // Hide shot panel when timing starts
                    timingRef.current = 0;
                    setTimingVal(0);
                    const startTime = Date.now();
                    const windowMs = 1200; // 1.2 second window

                    // Cancel any previous timing animation
                    if (timingAnimRef.current) cancelAnimationFrame(timingAnimRef.current);

                    const animTiming = () => {
                        const elapsed = Date.now() - startTime;
                        const val = Math.min(1, elapsed / windowMs);
                        timingRef.current = val;
                        setTimingVal(val);
                        if (elapsed < windowMs) {
                            timingAnimRef.current = requestAnimationFrame(animTiming);
                        } else {
                            // Auto-miss if not tapped
                            setShowTimingBar(false);
                        }
                    };
                    timingAnimRef.current = requestAnimationFrame(animTiming);
                }
            }

            // Show shot selection when bowling choice phase starts for batter
            if (msg.phase === 'bowling_choice' && msg.batterId === playerId) {
                setShowShotSelect(true);
            }
        }

        if (msg.type === 'CRICKET_BALL') {
            s.phase = 'ball_in_play';
            s.ball = msg.ball;
            s.innings = msg.innings || s.innings;
            s.speed = msg.speed;
            s.swing = msg.swing;
            s.bouncePoint = msg.bouncePoint;
            s.delivery = msg.delivery;
            s.batterId = msg.batterId;
            s.bowlerId = msg.bowlerId;
            s.batterUsername = msg.batterUsername;
            s.bowlerUsername = msg.bowlerUsername;
            s.ballProgress = 0;
            s.ballStartTime = Date.now();
            // Trigger bowler action animation
            s.bowlerAction = true;
            s.bowlerActionStart = Date.now();
            if (msg.scoreboard) { s.scoreboard = msg.scoreboard; setScoreboard(msg.scoreboard); }

            setPhase('ball_in_play');
            setIsBatter(msg.batterId === playerId);
            setIsBowler(msg.bowlerId === playerId);
            setBallInfo({ ball: msg.ball || s.ball, totalBalls: msg.totalBalls || s.totalBalls });
        }

        if (msg.type === 'CRICKET_BOWL_CHOICE') {
            if (msg.bowlerId !== playerId) {
                setCommentary(prev => [`Bowler is ready!`, ...prev].slice(0, 6));
            }
        }

        if (msg.type === 'CRICKET_RESULT') {
            s.phase = 'result';
            s.shotResult = { runs: msg.runs, isWicket: msg.isWicket, isDot: msg.isDot };
            s.shotResultTime = Date.now();
            // Trigger wicket-falling animation on bowled
            if (msg.isWicket) {
                s.wicketFalling = true;
                s.wicketFallStart = Date.now();
                s.screenShake = 1;
                s.screenShakeStart = Date.now();
            }
            if (msg.scoreboard) { s.scoreboard = msg.scoreboard; setScoreboard(msg.scoreboard); }
            if (msg.ballLog) { s.ballLog = msg.ballLog; setBallLog(msg.ballLog); }

            setPhase('result');
            setShowTimingBar(false);
            if (timingAnimRef.current) cancelAnimationFrame(timingAnimRef.current);

            let cLine = '';
            if (msg.isWicket) cLine = `WICKET! ${msg.batterUsername} is out`;
            else if (msg.runs === 6) cLine = `SIX! 🔥 Massive hit by ${msg.batterUsername}`;
            else if (msg.runs === 4) cLine = `FOUR! ${msg.batterUsername} finds the boundary`;
            else if (msg.runs > 0) cLine = `${msg.runs} run${msg.runs > 1 ? 's' : ''} by ${msg.batterUsername}`;
            else cLine = `Dot ball — good bowling by ${msg.bowlerUsername}`;

            if (msg.delivery) {
                cLine += ` (${msg.delivery.speed} ${msg.delivery.line} ${msg.delivery.length})`;
            }
            setCommentary(prev => [cLine, ...prev].slice(0, 8));
        }

        if (msg.type === 'CRICKET_INNINGS_CHANGE') {
            s.innings = 2;
            s.ball = 0;
            s.batterId = msg.batterId;
            s.bowlerId = msg.bowlerId;
            s.target = msg.target;
            if (msg.scoreboard) { s.scoreboard = msg.scoreboard; setScoreboard(msg.scoreboard); }

            setInnings(2);
            setTarget(msg.target);
            setPhase('innings_break');
            setIsBatter(msg.batterId === playerId);
            setIsBowler(msg.bowlerId === playerId);
            setCommentary(prev => [`═══ INNINGS BREAK ═══ Target: ${msg.target} runs`, ...prev].slice(0, 8));
        }

        if (msg.type === 'GAME_OVER') {
            s.phase = 'finished';
            setPhase('finished');
            setSummaryData({
                winnerId: msg.winner, // server sends 'winner' not 'winnerId'
                scoreboard: s.scoreboard,
                ballLog: s.ballLog,
            });
            setShowSummary(true);
        }
    }, [gameState?.lastMessage, playerId]);

    // Play shot
    const playShot = useCallback(() => {
        if (!showTimingBar) return;
        if (timingAnimRef.current) cancelAnimationFrame(timingAnimRef.current);
        // Trigger bat swing animation
        const s = stateRef.current;
        s.swinging = true;
        s.swingStart = Date.now();
        s.swingType = selectedShot;
        send({
            type: 'GAME_ACTION', action: 'play_shot',
            timing: timingRef.current,
            shotType: selectedShot,
        });
        setShowTimingBar(false);
    }, [showTimingBar, send, selectedShot]);

    // Bowler sends delivery choice
    const sendBowlChoice = useCallback((speed, line, length) => {
        send({
            type: 'GAME_ACTION', action: 'bowl_choice',
            speed, line, length,
        });
        setBowlChoiceMade(true);
    }, [send]);

    // Canvas rendering
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const resize = () => {
            canvas.width = canvas.offsetWidth * window.devicePixelRatio;
            canvas.height = canvas.offsetHeight * window.devicePixelRatio;
            ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
        };
        resize();
        window.addEventListener('resize', resize);

        const render = (time) => {
            const s = stateRef.current;
            const W = canvas.offsetWidth;
            const H = canvas.offsetHeight;

            // Reset animation states after duration
            if (s.swinging && Date.now() - s.swingStart > 500) s.swinging = false;
            if (s.wicketFalling && Date.now() - s.wicketFallStart > 2000) s.wicketFalling = false;
            if (s.bowlerAction && Date.now() - s.bowlerActionStart > 800) s.bowlerAction = false;
            if (s.screenShake > 0 && Date.now() - s.screenShakeStart > 600) s.screenShake = 0;

            // Screen shake
            ctx.save();
            if (s.screenShake > 0) {
                const elapsed = (Date.now() - s.screenShakeStart) / 600;
                const intensity = (1 - elapsed) * 6;
                ctx.translate(Math.sin(time * 0.5) * intensity, Math.cos(time * 0.7) * intensity);
            }

            // Sky
            const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.4);
            skyGrad.addColorStop(0, '#56CCF2');
            skyGrad.addColorStop(1, '#2F80ED');
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, W, H * 0.4);

            // Clouds
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.8;
            for (let i = 0; i < 5; i++) {
                const cx = (time * 0.02 + i * 200) % (W + 200) - 100;
                const cy = 50 + (i % 3) * 30;
                ctx.beginPath();
                ctx.arc(cx, cy, 30, 0, Math.PI * 2);
                ctx.arc(cx + 25, cy - 10, 35, 0, Math.PI * 2);
                ctx.arc(cx + 50, cy, 25, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;

            // Crowd
            ctx.save();
            const crowdY = H * 0.38;
            for (let cx = 0; cx < W; cx += 12) {
                const cy = crowdY + Math.sin(cx * 0.1) * 5 + Math.sin(time/200 + cx)*2;
                ctx.fillStyle = ['#ff4b4b','#4b7bff','#4bff4b','#ffff4b'][Math.floor((cx+time/100)%4)];
                ctx.beginPath();
                ctx.arc(cx, cy, 6, 0, Math.PI*2);
                ctx.fill();
            }
            ctx.restore();

            // Field
            const fieldGrad = ctx.createLinearGradient(0, H * 0.4, 0, H);
            fieldGrad.addColorStop(0, '#56ab2f');
            fieldGrad.addColorStop(1, '#a8e063');
            ctx.fillStyle = fieldGrad;
            ctx.fillRect(0, H * 0.4, W, H * 0.6);

            drawPitch(ctx, W, H, time, s);
            drawFielders(ctx, W, H, time);

            // Ball animation
            if ((s.phase === 'ball_in_play' || s.phase === 'batting_window') && s.ballStartTime > 0) {
                const elapsed = (Date.now() - s.ballStartTime) / 2000;
                s.ballProgress = Math.min(1, elapsed);
                drawBall(ctx, W, H, s);
            }

            // Shot result flash
            if (s.shotResult && Date.now() - s.shotResultTime < 2500) {
                const elapsed = (Date.now() - s.shotResultTime) / 2500;
                const alpha = Math.max(0, 1 - elapsed * 0.8);
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.font = `bold ${Math.min(48, W * 0.12)}px Orbitron, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                if (s.shotResult.isWicket) {
                    ctx.fillStyle = COLORS.red;
                    ctx.shadowColor = COLORS.red;
                    ctx.shadowBlur = 40;
                    ctx.font = `bold ${Math.min(56, W * 0.14)}px Orbitron, sans-serif`;
                    ctx.fillText('BOWLED!', W / 2, H * 0.37);
                    ctx.font = `bold ${Math.min(36, W * 0.09)}px Orbitron, sans-serif`;
                    ctx.fillText('OUT! ☝️', W / 2, H * 0.45);
                } else if (s.shotResult.runs === 6) {
                    ctx.fillStyle = COLORS.amber;
                    ctx.shadowColor = COLORS.amber;
                    ctx.shadowBlur = 30;
                    ctx.fillText('SIX! 🔥', W / 2, H * 0.4);
                } else if (s.shotResult.runs === 4) {
                    ctx.fillStyle = COLORS.green;
                    ctx.shadowColor = COLORS.green;
                    ctx.shadowBlur = 30;
                    ctx.fillText('FOUR!', W / 2, H * 0.4);
                } else if (s.shotResult.runs > 0) {
                    ctx.font = `bold ${Math.min(36, W * 0.09)}px Orbitron, sans-serif`;
                    ctx.fillStyle = COLORS.cyan;
                    ctx.fillText(`${s.shotResult.runs} RUN${s.shotResult.runs > 1 ? 'S' : ''}`, W / 2, H * 0.4);
                } else {
                    ctx.font = `bold ${Math.min(30, W * 0.07)}px Orbitron, sans-serif`;
                    ctx.fillStyle = COLORS.textDim;
                    ctx.fillText('DOT BALL', W / 2, H * 0.4);
                }
                ctx.restore();
            }

            // Red flash overlay for wickets
            if (s.shotResult?.isWicket && Date.now() - s.shotResultTime < 800) {
                const flashAlpha = Math.max(0, 0.3 * (1 - (Date.now() - s.shotResultTime) / 800));
                ctx.save();
                ctx.globalAlpha = flashAlpha;
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(0, 0, W, H);
                ctx.restore();
            }

            // Restore screen shake transform
            ctx.restore();

            // Scanline effect
            ctx.save();
            ctx.globalAlpha = 0.012;
            for (let sl = 0; sl < H; sl += 3) {
                ctx.fillStyle = '#000';
                ctx.fillRect(0, sl, W, 1);
            }
            ctx.restore();

            animRef.current = requestAnimationFrame(render);
        };

        animRef.current = requestAnimationFrame(render);
        return () => {
            cancelAnimationFrame(animRef.current);
            if (timingAnimRef.current) cancelAnimationFrame(timingAnimRef.current);
            window.removeEventListener('resize', resize);
        };
    }, []);

    // Get player username from list
    const getUsername = (pid) => {
        const found = playerList.find(p => p.id === pid);
        return found?.username || pid?.slice(0, 6) || '???';
    };

    const sbEntries = Object.entries(scoreboard);

    return (
        <div style={{ width: '100vw', height: '100vh', background: COLORS.bg, position: 'relative', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* Canvas background */}
            <canvas ref={canvasRef}
                onClick={showTimingBar ? playShot : undefined}
                style={{ width: '100%', height: '100%', display: 'block', cursor: showTimingBar ? 'pointer' : 'default' }} />

            {/* ═══ CLASSIC SCOREBOARD ═══ */}
            {!showIntro && !showSummary && phase !== 'finished' && (
                <div style={{
                    position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
                    background: '#222', border: '6px solid #5C4033',
                    borderRadius: 8, padding: '10px 20px', display: 'flex', gap: 30,
                    zIndex: 10, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', alignItems: 'center',
                    color: '#FFD700', fontFamily: 'Courier New, Courier, monospace', fontWeight: 'bold'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 12, color: '#fff', marginBottom: 4 }}>INNINGS {innings}</div>
                        <div style={{ fontSize: 24 }}>{ballInfo.ball} <span style={{fontSize:14, color:'#aaa'}}>/ {ballInfo.totalBalls}</span></div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6, minWidth: 150 }}>
                        {sbEntries.map(([pid, sb]) => (
                            <div key={pid} style={{ fontSize: 14, color: pid === playerId ? '#fff' : '#aaa', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{getUsername(pid).substring(0,8)}</span>
                                <span>{sb.runs}/{sb.wickets}</span>
                            </div>
                        ))}
                    </div>
                    {target && (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 12, color: '#fff', marginBottom: 4 }}>TARGET</div>
                            <div style={{ fontSize: 24 }}>{target}</div>
                        </div>
                    )}
                </div>
            )}
            {/* Status overlay */}
            {!showIntro && !showSummary && phase !== 'finished' && (
                <div style={{
                    position: 'absolute', top: 90, left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(0,0,0,0.5)', padding: '6px 16px', borderRadius: 20, zIndex: 10,
                    color: '#fff', fontSize: 13, fontWeight: 'bold'
                }}>
                    {isBatter ? '🏏 YOU ARE BATTING' : isBowler ? '⚾ YOU ARE BOWLING' : '👀 SPECTATING'}
                </div>
            )}

            {/* ═══ BOWLER CHOICE PANEL ═══ */}
            {phase === 'bowling_choice' && isBowler && !bowlChoiceMade && !showIntro && (
                <div style={{
                    position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(10,15,30,0.95)', border: `2px solid ${COLORS.pink}`,
                    borderRadius: 16, padding: '16px 20px', zIndex: 20,
                    maxWidth: 380, width: '92%', backdropFilter: 'blur(14px)',
                    boxShadow: `0 0 40px ${COLORS.pink}44`,
                }}>
                    <div style={{ textAlign: 'center', marginBottom: 14 }}>
                        <div style={{ fontSize: 16, color: COLORS.pink, fontWeight: 800, letterSpacing: 1, fontFamily: 'Orbitron, sans-serif' }}>
                            ⚾ CHOOSE YOUR DELIVERY
                        </div>
                        <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 4 }}>
                            pick speed, line & length — tap BOWL!
                        </div>
                    </div>
                    <BowlerPanel onSubmit={sendBowlChoice} />
                </div>
            )}

            {/* Bowler waiting */}
            {phase === 'bowling_choice' && isBowler && bowlChoiceMade && !showIntro && (
                <div style={{
                    position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(10,15,30,0.88)', border: `1px solid ${COLORS.green}`,
                    borderRadius: 12, padding: '12px 28px', zIndex: 20,
                    color: COLORS.green, fontSize: 14, fontWeight: 600,
                    fontFamily: 'Orbitron, sans-serif',
                }}>
                    ✓ Delivery set — bowling now...
                </div>
            )}

            {/* Batter waiting for bowler */}
            {phase === 'bowling_choice' && isBatter && !showIntro && (
                <div style={{
                    position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(10,15,30,0.88)', border: `1px solid ${COLORS.amber}`,
                    borderRadius: 12, padding: '14px 28px', zIndex: 20, textAlign: 'center',
                }}>
                    <div style={{ color: COLORS.amber, fontSize: 15, fontWeight: 700, animation: 'cPulse 1.5s infinite' }}>
                        ⏳ Bowler choosing delivery...
                    </div>
                    <div style={{ color: COLORS.textDim, fontSize: 11, marginTop: 4 }}>Get ready to swing!</div>
                </div>
            )}

            {/* ═══ SHOT TYPE SELECTION (batter picks before timing bar) ═══ */}
            {showShotSelect && isBatter && !showTimingBar && !showIntro && !showSummary && (
                <div style={{
                    position: 'absolute', top: '70%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: 280, height: 280, zIndex: 20, pointerEvents: 'none',
                }}>
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        background: 'rgba(255,255,255,0.95)', padding: '6px 12px', borderRadius: 20,
                        color: '#000', fontWeight: 'bold', fontSize: 13, boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                    }}>CHOOSE SHOT</div>
                    {[
                        { key: 'drive', icon: '⬆', label: 'Drive' },
                        { key: 'pull', icon: '↩️', label: 'Pull' },
                        { key: 'cut', icon: '↗️', label: 'Cut' },
                        { key: 'sweep', icon: '↙️', label: 'Sweep' },
                        { key: 'defend', icon: '🛡️', label: 'Defend' },
                    ].map((s, i, arr) => {
                        const angle = (i / arr.length) * Math.PI * 2 - Math.PI / 2;
                        const radius = 100;
                        const x = 140 + Math.cos(angle) * radius;
                        const y = 140 + Math.sin(angle) * radius;
                        return (
                            <button
                                key={s.key}
                                onClick={() => setSelectedShot(s.key)}
                                style={{
                                    position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)',
                                    width: 72, height: 72, borderRadius: '50%', border: 'none',
                                    pointerEvents: 'auto', cursor: 'pointer',
                                    background: selectedShot === s.key ? COLORS.cyan : '#fff',
                                    color: selectedShot === s.key ? '#000' : '#333',
                                    boxShadow: selectedShot === s.key ? `0 0 20px ${COLORS.cyan}` : '0 4px 10px rgba(0,0,0,0.2)',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                }}
                            >
                                <div style={{ fontSize: 26 }}>{s.icon}</div>
                                <div style={{ fontSize: 11, fontWeight: 'bold', marginTop: 2 }}>{s.label}</div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* ═══ TIMING BAR (batting interaction) ═══ */}
            {showTimingBar && !showIntro && (
                <div style={{
                    position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
                    width: '92%', maxWidth: 420, zIndex: 20,
                }}>
                    {/* Quality label based on timing position */}
                    {(() => {
                        let label = '', color = COLORS.textDim;
                        if (timingVal >= 0.35 && timingVal <= 0.60) { label = '✨ PERFECT ZONE'; color = COLORS.green; }
                        else if (timingVal < 0.35) { label = 'EARLY...'; color = COLORS.amber; }
                        else { label = 'LATE!'; color = COLORS.red; }
                        return (
                            <div style={{ textAlign: 'center', fontSize: 11, color, fontWeight: 700, marginBottom: 4, letterSpacing: 1 }}>
                                {label}
                            </div>
                        );
                    })()}
                    <div style={{
                        textAlign: 'center', marginBottom: 8,
                        fontSize: isTouchDevice ? 26 : 22, fontWeight: 900, color: '#fff',
                        textShadow: `0 0 20px ${COLORS.cyan}`,
                        animation: 'cPulse 0.4s infinite',
                        fontFamily: 'Orbitron, sans-serif',
                    }}>
                        🏏 TAP TO SWING!
                    </div>
                    <div style={{
                        height: isTouchDevice ? 34 : 26, background: 'rgba(255,255,255,0.08)',
                        borderRadius: 17, overflow: 'hidden', position: 'relative',
                        border: '1px solid rgba(255,255,255,0.2)',
                    }}>
                        {/* Sweet spot zone */}
                        <div style={{
                            position: 'absolute', left: '35%', width: '25%', height: '100%',
                            background: `linear-gradient(90deg, transparent, ${COLORS.green}40, transparent)`,
                            borderLeft: `2px solid ${COLORS.green}88`,
                            borderRight: `2px solid ${COLORS.green}88`,
                        }} />
                        {/* Moving needle */}
                        <div style={{
                            position: 'absolute', left: `${timingVal * 100}%`,
                            top: -2, bottom: -2, width: 6, background: '#fff',
                            borderRadius: 3, transform: 'translateX(-3px)',
                            boxShadow: `0 0 12px ${COLORS.cyan}, 0 0 24px ${COLORS.cyan}55`,
                        }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 9, color: COLORS.textDim, letterSpacing: 0.5 }}>
                        <span>TOO EARLY</span>
                        <span style={{ color: COLORS.green, fontWeight: 600 }}>⬆ PERFECT</span>
                        <span>TOO LATE</span>
                    </div>
                    {/* Mobile SWING button */}
                    {isTouchDevice && (
                        <button
                            onTouchStart={(e) => { e.preventDefault(); playShot(); }}
                            style={{
                                width: '100%', padding: '16px', marginTop: 10,
                                background: `linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.green})`,
                                border: 'none', borderRadius: 14, color: '#000',
                                fontWeight: 900, fontSize: 18, cursor: 'pointer',
                                fontFamily: 'Orbitron, sans-serif',
                                boxShadow: `0 6px 24px ${COLORS.cyan}44`,
                                touchAction: 'none',
                            }}
                        >
                            🏏 SWING!
                        </button>
                    )}
                </div>
            )}

            {/* Ball in play — batter waiting */}
            {phase === 'ball_in_play' && isBatter && !showTimingBar && !showIntro && (
                <div style={{
                    position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(10,15,30,0.85)', border: `1px solid ${COLORS.cyan}`,
                    borderRadius: 12, padding: '12px 24px', zIndex: 20,
                    color: COLORS.cyan, fontSize: 13, fontWeight: 600,
                }}>
                    🏏 Ball incoming — get ready...
                </div>
            )}

            {/* ═══ COMMENTARY FEED ═══ */}
            {!showIntro && !showSummary && commentary.length > 0 && (
                <div style={{
                    position: 'absolute', left: 12, bottom: 80, zIndex: 8,
                    maxWidth: 280, pointerEvents: 'none',
                }}>
                    {commentary.slice(0, 5).map((line, i) => (
                        <div key={i} style={{
                            fontSize: 11, color: i === 0 ? COLORS.text : COLORS.textDim,
                            opacity: 1 - i * 0.15, marginBottom: 3,
                        }}>
                            {line}
                        </div>
                    ))}
                </div>
            )}

            {/* ═══ BALL LOG ═══ */}
            {!showIntro && !showSummary && ballLog.length > 0 && (
                <div style={{
                    position: 'absolute', right: 12, bottom: 80, zIndex: 8,
                    display: 'flex', gap: 5, flexDirection: 'row-reverse',
                }}>
                    {ballLog.slice(-6).reverse().map((b, i) => (
                        <div key={i} style={{
                            width: 28, height: 28, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, fontWeight: 700,
                            background: b.result === 'W' ? COLORS.red
                                : b.result >= 4 ? COLORS.green
                                    : b.result > 0 ? COLORS.cyan
                                        : 'rgba(255,255,255,0.1)',
                            color: b.result === 'W' || b.result >= 4 ? '#000' : COLORS.text,
                            border: `1px solid ${b.result === 'W' ? COLORS.red : b.result >= 4 ? COLORS.green : 'rgba(255,255,255,0.2)'}`,
                        }}>
                            {b.result === 'W' ? 'W' : b.result}
                        </div>
                    ))}
                </div>
            )}

            {/* ═══ INTRO OVERLAY ═══ */}
            {showIntro && (
                <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(5,10,20,0.96)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', zIndex: 50, padding: 24,
                }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🏏</div>
                    <div style={{
                        fontSize: 24, fontWeight: 900, color: COLORS.green,
                        fontFamily: 'Orbitron, sans-serif', marginBottom: 12,
                    }}>
                        CRICKET CLASH PRO
                    </div>
                    <div style={{
                        maxWidth: 340, textAlign: 'center', color: COLORS.textDim,
                        fontSize: 13, lineHeight: 1.7, marginBottom: 28,
                    }}>
                        <strong style={{ color: COLORS.cyan }}>🏏 Batter:</strong> Time your swing in the batting window — hit the green zone for boundaries!
                        <br /><br />
                        <strong style={{ color: COLORS.pink }}>⚾ Bowler:</strong> Choose speed, line & length to outsmart the batter.
                        <br /><br />
                        <strong style={{ color: COLORS.amber }}>🔄 Innings:</strong> Each player bats once. 12 balls per innings. Most runs wins!
                    </div>
                    <button
                        onClick={() => { setShowIntro(false); send({ type: 'ARENA_READY' }); }}
                        style={{
                            background: `linear-gradient(135deg, ${COLORS.green}, ${COLORS.cyan})`,
                            border: 'none', borderRadius: 14, padding: '16px 48px',
                            color: '#000', fontWeight: 900, fontSize: 17, cursor: 'pointer',
                            fontFamily: 'Orbitron, sans-serif', letterSpacing: 1,
                            boxShadow: `0 8px 32px ${COLORS.green}33`,
                        }}
                    >
                        LET'S PLAY 🏏
                    </button>
                </div>
            )}

            {/* ═══ INNINGS BREAK ═══ */}
            {phase === 'innings_break' && !showIntro && (
                <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(5,10,20,0.88)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', zIndex: 40,
                }}>
                    <div style={{ fontSize: 20, color: COLORS.amber, fontWeight: 800, marginBottom: 10, fontFamily: 'Orbitron, sans-serif' }}>
                        🔄 INNINGS BREAK
                    </div>
                    <div style={{ fontSize: 14, color: COLORS.text, marginBottom: 6 }}>
                        {isBatter ? '🏏 Your turn to bat!' : '⚾ Your turn to bowl!'}
                    </div>
                    {target && (
                        <div style={{ fontSize: 24, color: COLORS.cyan, fontWeight: 900, marginTop: 10, fontFamily: 'Orbitron, sans-serif' }}>
                            Target: {target} runs
                        </div>
                    )}
                </div>
            )}

            {/* ═══ MATCH SUMMARY ═══ */}
            {showSummary && summaryData && (
                <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(5,10,20,0.96)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', zIndex: 50, padding: 24,
                }}>
                    <div style={{
                        fontSize: 24, fontWeight: 900,
                        color: summaryData.winnerId === playerId ? COLORS.green : summaryData.winnerId ? COLORS.red : COLORS.amber,
                        fontFamily: 'Orbitron, sans-serif', marginBottom: 20,
                    }}>
                        {summaryData.winnerId === playerId ? '🏆 YOU WIN!' : summaryData.winnerId ? '😞 YOU LOST' : '🤝 DRAW!'}
                    </div>

                    <div style={{ display: 'flex', gap: 28, marginBottom: 24 }}>
                        {Object.entries(summaryData.scoreboard).map(([pid, sb]) => (
                            <div key={pid} style={{
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: 14, padding: '14px 24px', textAlign: 'center',
                                border: `1px solid ${pid === playerId ? COLORS.cyan : COLORS.textDim}33`,
                            }}>
                                <div style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 4 }}>
                                    {getUsername(pid)}
                                </div>
                                <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', fontFamily: 'Orbitron, sans-serif' }}>
                                    {sb.runs}
                                </div>
                                <div style={{ fontSize: 10, color: COLORS.textDim }}>
                                    {sb.wickets}W • {sb.ballsFaced}B
                                </div>
                            </div>
                        ))}
                    </div>

                    <button onClick={onLeave} style={{
                        background: `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.cyan})`,
                        border: 'none', borderRadius: 12, padding: '14px 36px',
                        color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                    }}>
                        Return to Lobby
                    </button>
                </div>
            )}

            {/* CSS animations */}
            <style>{`
                @keyframes cPulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.55; }
                }
            `}</style>
        </div>
    );
}

/* ═══ Bowler Choice Panel Component ═══ */
function BowlerPanel({ onSubmit }) {
    const [speed, setSpeed] = useState('medium');
    const [line, setLine] = useState('middle');
    const [length, setLength] = useState('good');

    const optStyle = (selected) => ({
        flex: 1, padding: '8px 4px', borderRadius: 10, border: 'none',
        background: selected ? 'rgba(255,61,129,0.30)' : 'rgba(255,255,255,0.06)',
        color: selected ? '#fff' : COLORS.textDim,
        fontWeight: selected ? 700 : 400, fontSize: 12, cursor: 'pointer',
        transition: 'all 0.15s',
        outline: selected ? `2px solid ${COLORS.pink}` : '1px solid transparent',
    });

    return (
        <div>
            <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: COLORS.textDim, marginBottom: 5, fontWeight: 600, letterSpacing: 1 }}>SPEED</div>
                <div style={{ display: 'flex', gap: 5 }}>
                    {['fast', 'medium', 'slow'].map(s => (
                        <button key={s} onClick={() => setSpeed(s)} style={optStyle(speed === s)}>
                            {s === 'fast' ? '⚡ Fast' : s === 'medium' ? '🎯 Medium' : '🐢 Slow'}
                        </button>
                    ))}
                </div>
            </div>
            <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: COLORS.textDim, marginBottom: 5, fontWeight: 600, letterSpacing: 1 }}>LINE</div>
                <div style={{ display: 'flex', gap: 5 }}>
                    {['offside', 'middle', 'legside'].map(l => (
                        <button key={l} onClick={() => setLine(l)} style={optStyle(line === l)}>
                            {l === 'offside' ? '← Off' : l === 'middle' ? '⬆ Middle' : 'Leg →'}
                        </button>
                    ))}
                </div>
            </div>
            <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: COLORS.textDim, marginBottom: 5, fontWeight: 600, letterSpacing: 1 }}>LENGTH</div>
                <div style={{ display: 'flex', gap: 5 }}>
                    {['short', 'good', 'full'].map(l => (
                        <button key={l} onClick={() => setLength(l)} style={optStyle(length === l)}>
                            {l === 'short' ? '📏 Short' : l === 'good' ? '✨ Good' : '📐 Full'}
                        </button>
                    ))}
                </div>
            </div>
            <button
                onClick={() => onSubmit(speed, line, length)}
                style={{
                    width: '100%', padding: '12px',
                    background: `linear-gradient(135deg, ${COLORS.pink}, ${COLORS.amber})`,
                    border: 'none', borderRadius: 12, color: '#000',
                    fontWeight: 900, fontSize: 15, cursor: 'pointer',
                    fontFamily: 'Orbitron, sans-serif',
                    boxShadow: `0 4px 20px ${COLORS.pink}44`,
                }}
            >
                🎳 BOWL!
            </button>
        </div>
    );
}

/* ═══ Draw pitch ═══ */
function drawPitch(ctx, W, H, time, s) {
    const pitchW = W * 0.32;
    const pitchH = H * 0.52;
    const px = (W - pitchW) / 2;
    const py = H * 0.42;

    // Pitch trapezoid (perspective)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(px + pitchW * 0.15, py);
    ctx.lineTo(px + pitchW * 0.85, py);
    ctx.lineTo(px + pitchW * 1.05, py + pitchH);
    ctx.lineTo(px - pitchW * 0.05, py + pitchH);
    ctx.closePath();
    const pitchGrad = ctx.createLinearGradient(px, py, px, py + pitchH);
    pitchGrad.addColorStop(0, '#e6c280');
    pitchGrad.addColorStop(1, '#d4a355');
    ctx.fillStyle = pitchGrad;
    ctx.fill();
    ctx.strokeStyle = '#c49044';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Crease lines - crisp white
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px + pitchW * 0.18, py + pitchH * 0.15);
    ctx.lineTo(px + pitchW * 0.82, py + pitchH * 0.15);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px - pitchW * 0.02, py + pitchH * 0.85);
    ctx.lineTo(px + pitchW * 1.02, py + pitchH * 0.85);
    ctx.stroke();
    ctx.restore();

    // Stumps — batter-end stumps get wicketFalling state
    drawStumps(ctx, px + pitchW / 2, py + pitchH * 0.12, 0.7, false, time);
    drawStumps(ctx, px + pitchW / 2, py + pitchH * 0.88, 1.0, s.wicketFalling, time, s.wicketFallStart);

    // Bowler figure (top)
    drawFigure(ctx, px + pitchW * 0.3, py + pitchH * 0.06, 0.7, COLORS.pink, time, 'bowler', s);
    // Batter figure (bottom)
    drawFigure(ctx, px + pitchW * 0.65, py + pitchH * 0.75, 1.1, COLORS.cyan, time, 'batter', s);
}

/* ═══ Draw fielder positions ═══ */
function drawFielders(ctx, W, H, time) {
    const cx = W / 2;
    const cy = H * 0.60;
    const spread = Math.min(W, H) * 0.38;

    const fielders = [
        { angle: -0.15, dist: 0.85, label: 'SL',  name: 'Slip' },
        { angle: -0.55, dist: 0.70, label: 'GU',  name: 'Gully' },
        { angle: -0.90, dist: 0.80, label: 'PT',  name: 'Point' },
        { angle: -1.25, dist: 0.95, label: 'CO',  name: 'Cover' },
        { angle: -1.70, dist: 0.90, label: 'MO',  name: 'Mid-off' },
        { angle:  1.70, dist: 0.90, label: 'MI',  name: 'Mid-on' },
        { angle:  1.10, dist: 0.85, label: 'ML',  name: 'Mid-wkt' },
        { angle:  0.70, dist: 0.80, label: 'SL',  name: 'Sq Leg' },
        { angle:  0.25, dist: 0.95, label: 'FL',  name: 'Fine Leg' },
    ];

    fielders.forEach((f, i) => {
        const fx = cx + Math.sin(f.angle) * spread * f.dist;
        const fy = cy + Math.cos(f.angle) * spread * f.dist * 0.7;
        const bob = Math.sin(time / 1200 + i * 0.7) * 2;

        ctx.save();
        ctx.translate(fx, fy + bob);
        // Head
        ctx.beginPath(); ctx.arc(0, -8, 5, 0, Math.PI*2); ctx.fillStyle = '#ffcc99'; ctx.fill();
        // Body
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.roundRect(-5, -4, 10, 10, 3); ctx.fill();
        // Legs
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.lineCap='round';
        ctx.beginPath(); ctx.moveTo(-2.5, 6); ctx.lineTo(-2.5, 12); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(2.5, 6); ctx.lineTo(2.5, 12); ctx.stroke();
        ctx.restore();

        // Label
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#000';
        ctx.fillText(f.name, fx, fy + bob + 22);
        ctx.restore();
    });
}

function drawStumps(ctx, x, y, scale, falling = false, time = 0, fallStart = 0) {
    const sH = 18 * scale, sW = 2.5 * scale, gap = 7 * scale;
    const fallProgress = falling ? Math.min(1, (Date.now() - fallStart) / 600) : 0;

    ctx.save();

    if (falling && fallProgress > 0) {
        // Stumps tilt and fall backward
        for (let i = -1; i <= 1; i++) {
            ctx.save();
            const sx = x + i * gap;
            const stumpAngle = fallProgress * (0.6 + i * 0.15) * Math.PI * 0.4;
            ctx.translate(sx, y + sH / 2);
            ctx.rotate(stumpAngle);
            ctx.translate(-sx, -(y + sH / 2));
            const sg = ctx.createLinearGradient(sx - sW, y - sH / 2, sx + sW, y + sH / 2);
            sg.addColorStop(0, '#e8cfa6'); sg.addColorStop(1, '#c59a5d');
            ctx.fillStyle = sg;
            ctx.fillRect(sx - sW / 2, y - sH / 2, sW, sH);
            ctx.restore();
        }

        // Bails fly off with physics
        const bailTime = fallProgress;
        for (let b = 0; b < 2; b++) {
            const bx = x + (b === 0 ? -gap * 0.5 : gap * 0.5);
            const bFlyX = bx + (b === 0 ? -1 : 1) * bailTime * 20 * scale;
            const bFlyY = (y - sH / 2) - bailTime * 30 * scale + bailTime * bailTime * 50 * scale;
            const bRot = bailTime * Math.PI * 3 * (b === 0 ? 1 : -1);
            ctx.save();
            ctx.translate(bFlyX, bFlyY);
            ctx.rotate(bRot);
            ctx.fillStyle = '#e8cfa6';
            ctx.fillRect(-gap * 0.4, -1 * scale, gap * 0.8, 2 * scale);
            ctx.restore();
        }
    } else {
        // Normal stumps
        for (let i = -1; i <= 1; i++) {
            const sx = x + i * gap;
            const sg = ctx.createLinearGradient(sx - sW, y - sH / 2, sx + sW, y + sH / 2);
            sg.addColorStop(0, '#e8cfa6'); sg.addColorStop(1, '#c59a5d');
            ctx.fillStyle = sg;
            ctx.fillRect(sx - sW / 2, y - sH / 2, sW, sH);
        }
        // Bails on top
        ctx.strokeStyle = '#e8cfa6';
        ctx.lineWidth = 1.5 * scale;
        ctx.beginPath();
        ctx.moveTo(x - gap, y - sH / 2);
        ctx.lineTo(x, y - sH / 2 - 1.5 * scale);
        ctx.lineTo(x + gap, y - sH / 2);
        ctx.stroke();
    }

    ctx.restore();
}

function drawFigure(ctx, x, y, sc, color, time, type, s) {
    ctx.save();
    ctx.translate(x, y);

    // Shadow
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.beginPath(); ctx.ellipse(0, 10 * sc, 12 * sc, 4 * sc, 0, 0, Math.PI * 2); ctx.fillStyle = '#000'; ctx.fill();
    ctx.restore();

    // Idle bob
    const bob = Math.sin(time / 600) * 1.5 * sc;

    // Legs with stance
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 4 * sc;
    ctx.lineCap = 'round';
    if (type === 'batter') {
        // Batting stance — wider legs
        ctx.beginPath(); ctx.moveTo(-5*sc, 2*sc); ctx.lineTo(-7*sc, 11*sc); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(5*sc, 2*sc); ctx.lineTo(3*sc, 11*sc); ctx.stroke();
        // Pads
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(-9*sc, 5*sc, 5*sc, 6*sc);
        ctx.fillRect(1*sc, 5*sc, 5*sc, 6*sc);
    } else {
        // Bowler — normal legs, step forward during action
        const stepFwd = s.bowlerAction ? Math.min(1, (Date.now() - s.bowlerActionStart) / 400) * 4 * sc : 0;
        ctx.beginPath(); ctx.moveTo(-4*sc, 2*sc); ctx.lineTo(-4*sc, 10*sc + stepFwd); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(4*sc, 2*sc); ctx.lineTo(4*sc, 10*sc); ctx.stroke();
    }

    // Body
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(-8 * sc, -10 * sc + bob, 16 * sc, 14 * sc, 4 * sc);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.fillRect(-8 * sc, -4 * sc + bob, 16 * sc, 4 * sc);

    // Arms & Equipment
    if (type === 'batter') {
        // Calculate bat angle based on swing state
        let batAngle = 0.3 + Math.sin(time / 800) * 0.05; // Idle stance
        let batX = 8 * sc, batY = -2 * sc + bob;

        if (s.swinging) {
            const swingElapsed = (Date.now() - s.swingStart) / 500;
            const swingT = Math.min(1, swingElapsed);
            // Eased swing curve
            const eased = swingT < 0.5
                ? 4 * swingT * swingT * swingT
                : 1 - Math.pow(-2 * swingT + 2, 3) / 2;

            // Different swing arcs per shot type
            const swingAngles = {
                drive: { start: 0.8, end: -1.8 },
                pull: { start: 0.6, end: -2.2 },
                cut: { start: 0.5, end: -1.5 },
                sweep: { start: 0.3, end: -2.5 },
                defend: { start: 0.4, end: -0.3 },
            };
            const angles = swingAngles[s.swingType] || swingAngles.drive;
            batAngle = angles.start + (angles.end - angles.start) * eased;

            // Body leans into shot
            const lean = eased * 0.15;
            ctx.translate(lean * 5 * sc, 0);
        }

        // Draw bat
        ctx.save();
        ctx.translate(batX, batY);
        ctx.rotate(batAngle);
        // Bat blade
        ctx.fillStyle = '#d4a355';
        ctx.beginPath();
        ctx.roundRect(-2.5 * sc, -2 * sc, 5 * sc, 18 * sc, [0, 0, 2 * sc, 2 * sc]);
        ctx.fill();
        // Bat face highlight
        ctx.fillStyle = '#e8d5a8';
        ctx.fillRect(-1.5 * sc, 2 * sc, 3 * sc, 12 * sc);
        // Handle
        ctx.fillStyle = '#333';
        ctx.fillRect(-1.5 * sc, -6 * sc, 3 * sc, 5 * sc);
        // Grip
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(-1.8 * sc, -6 * sc, 3.6 * sc, 2 * sc);
        ctx.restore();

        // Arms holding bat
        ctx.strokeStyle = '#ffcc99';
        ctx.lineWidth = 3.5 * sc;
        ctx.beginPath(); ctx.moveTo(-6*sc, -6*sc + bob); ctx.lineTo(batX, batY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(6*sc, -6*sc + bob); ctx.lineTo(batX, batY); ctx.stroke();

        // Helmet
        ctx.fillStyle = '#114488';
        ctx.beginPath(); ctx.arc(0, -14 * sc + bob, 9 * sc, -Math.PI, 0.2); ctx.fill();
        // Visor
        ctx.strokeStyle = '#aac'; ctx.lineWidth = 1.5 * sc;
        ctx.beginPath();
        for (let v = 0; v < 3; v++) {
            ctx.moveTo(3*sc + v*2*sc, -12*sc + bob);
            ctx.lineTo(6*sc + v*1.5*sc, -6*sc + bob);
        }
        ctx.stroke();
    } else {
        // Bowler with bowling action animation
        const armSwing = s.bowlerAction
            ? Math.min(1, (Date.now() - s.bowlerActionStart) / 600)
            : 0;

        ctx.strokeStyle = '#ffcc99';
        ctx.lineWidth = 3.5 * sc;

        if (armSwing > 0) {
            // Bowling arm — rotates overhead and releases
            const armAngle = -Math.PI * 1.5 * armSwing; // Full rotation
            const armLen = 14 * sc;
            const armEndX = Math.cos(armAngle - Math.PI/2) * armLen;
            const armEndY = Math.sin(armAngle - Math.PI/2) * armLen - 6 * sc + bob;
            ctx.beginPath();
            ctx.moveTo(6*sc, -6*sc + bob);
            ctx.lineTo(6*sc + armEndX, armEndY);
            ctx.stroke();

            // Ball in hand (before release point)
            if (armSwing < 0.7) {
                ctx.beginPath();
                ctx.arc(6*sc + armEndX, armEndY, 3 * sc, 0, Math.PI * 2);
                ctx.fillStyle = '#cc0000';
                ctx.fill();
            }

            // Other arm
            ctx.beginPath();
            ctx.moveTo(-6*sc, -6*sc + bob);
            ctx.lineTo(-10*sc, -2*sc + bob);
            ctx.stroke();
        } else {
            // Idle bowler arms
            const idleSwing = Math.sin(time / 300) * 3 * sc;
            ctx.beginPath(); ctx.moveTo(-6*sc, -6*sc + bob); ctx.lineTo(-10*sc, -2*sc + bob + idleSwing); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(6*sc, -6*sc + bob); ctx.lineTo(10*sc, -2*sc + bob - idleSwing); ctx.stroke();
        }

        // Cap
        ctx.fillStyle = '#2255aa';
        ctx.beginPath(); ctx.arc(0, -14 * sc + bob, 8.5 * sc, -Math.PI, 0); ctx.fill();
        ctx.fillRect(-10*sc, -14.5*sc + bob, 7*sc, 2*sc); // cap brim
    }

    // Head
    ctx.beginPath();
    ctx.arc(0, -14 * sc + bob, 8 * sc, 0, Math.PI * 2);
    ctx.fillStyle = '#ffcc99';
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#000';
    if (type === 'batter') {
        ctx.beginPath(); ctx.arc(3 * sc, -15 * sc + bob, 1.5 * sc, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(6 * sc, -15 * sc + bob, 1.5 * sc, 0, Math.PI*2); ctx.fill();
    } else {
        ctx.beginPath(); ctx.arc(-2 * sc, -15 * sc + bob, 1.5 * sc, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(2 * sc, -15 * sc + bob, 1.5 * sc, 0, Math.PI*2); ctx.fill();
    }

    ctx.restore();
}

function drawBall(ctx, W, H, s) {
    const pitchW = W * 0.32;
    const pitchH = H * 0.52;
    const px = (W - pitchW) / 2;
    const py = H * 0.42;

    const t = s.ballProgress;
    const startX = px + pitchW / 2 + (s.swing || 0) * pitchW * 0.3;
    const startY = py + pitchH * 0.12;
    const endX = px + pitchW / 2;
    const endY = py + pitchH * 0.85;
    const bounceY = py + pitchH * (s.bouncePoint || 0.5);

    let bx, by;
    if (t < 0.6) {
        const bt = t / 0.6;
        bx = startX + (endX - startX) * bt;
        by = startY + (bounceY - startY) * bt;
        by -= Math.sin(bt * Math.PI) * pitchH * 0.15;
    } else {
        const bt = (t - 0.6) / 0.4;
        bx = endX;
        by = bounceY + (endY - bounceY) * bt;
        by -= Math.sin(bt * Math.PI) * pitchH * 0.08;
    }

    // Ball ground shadow on pitch
    ctx.save();
    ctx.globalAlpha = 0.25;
    const shadowY = py + pitchH * (0.12 + t * 0.73); // Projects to pitch surface
    ctx.beginPath();
    ctx.ellipse(bx, shadowY, 6 + t * 4, 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.restore();

    // Trail
    ctx.save();
    for (let i = 0; i < 6; i++) {
        const tt = Math.max(0, t - i * 0.02);
        let tx, ty;
        if (tt < 0.6) {
            const b2 = tt / 0.6; 
            tx = startX + (endX - startX) * b2; 
            ty = startY + (bounceY - startY) * b2;
            ty -= Math.sin(b2 * Math.PI) * pitchH * 0.15;
        } else {
            const b2 = (tt - 0.6) / 0.4; 
            tx = endX; 
            ty = bounceY + (endY - bounceY) * b2;
            ty -= Math.sin(b2 * Math.PI) * pitchH * 0.08;
        }
        ctx.globalAlpha = (1 - i / 6) * 0.25;
        ctx.beginPath();
        ctx.arc(tx, ty, 4.5 - i * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.red;
        ctx.fill();
    }
    ctx.restore();

    // Ball
    const ballR = 8;
    ctx.save();
    const bg = ctx.createRadialGradient(bx - 2, by - 2, 1, bx, by, ballR);
    bg.addColorStop(0, '#ff9999'); bg.addColorStop(0.5, '#e60000'); bg.addColorStop(1, '#990000');
    ctx.beginPath(); ctx.arc(bx, by, ballR, 0, Math.PI * 2);
    ctx.fillStyle = bg;
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 10;
    ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    // Seam — faster rotation
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.2;
    const seamAngle = t * Math.PI * 14;
    ctx.beginPath(); ctx.arc(bx, by, ballR * 0.7, seamAngle, seamAngle + Math.PI * 0.8); ctx.stroke();
    // Highlight
    ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.arc(bx - 3, by - 3, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#fff'; ctx.fill();
    ctx.restore();
}
