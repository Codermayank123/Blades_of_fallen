import { BaseGameRoom } from './BaseGameRoom.js';
import { MSG } from '../utils/constants.js';

/**
 * Neon Drift Arena — Track-based multiplayer racing (2–12 players)
 * - Defined oval track with road segments
 * - 3 laps to win, ordered checkpoint validation
 * - On-road / off-road speed differential
 * - Server-authoritative physics at 30fps
 * - Boost meter from drifting, activatable boost
 */
export class NeonDriftRoom extends BaseGameRoom {
    constructor(roomCode, creatorId) {
        super(roomCode, creatorId, 'neon_drift', 12);
        this.TRACK_SCALE = 1;
        this.CAR_MAX_SPEED = 4.5;
        this.TURN_SPEED = 0.055;
        this.DRIFT_FACTOR = 0.90;
        this.OFFROAD_SPEED_MULT = 0.4;
        this.ROAD_WIDTH = 120;         // Half-width of road corridor (wider for easier driving)
        this.LAPS_TO_WIN = 3;
        this.matchDuration = 120;      // 2 min max
        this.tickInterval = null;
        this.startTime = null;
        this.cars = {};
        this.inputs = {};
        this.trackPoints = [];         // Centerline points defining the track
        this.checkpoints = [];         // Checkpoint regions (subset of track points)
        this.playerProgress = {};      // playerId -> { nextCP, laps, finished, finishTime }
        this.finishOrder = [];         // Array of { playerId, laps, time }
        this.raceFinished = false;

        // Power-up system (streamlined — only speed items)
        this.powerUps = [];            // Active power-ups on track
        this.powerUpIdCounter = 0;
        this.POWERUP_TYPES = [
            { type: 'speed_boost', color: '#00FF9C', icon: '⚡', duration: 3000, effect: 'speed', mult: 1.4 },
            { type: 'mini_turbo', color: '#06B6D4', icon: '🚀', duration: 1500, effect: 'turbo', mult: 1.8 },
        ];
        this.POWERUP_RESPAWN_MS = 18000; // Respawn interval (less frequent)
        this.lastPowerUpSpawn = 0;
    }

    getGameStartData() {
        // Define an oval track as centerline points
        this.trackPoints = this.generateTrackPoints();

        // Place checkpoints at intervals around the track
        const numCP = 8;
        this.checkpoints = [];
        for (let i = 0; i < numCP; i++) {
            const idx = Math.floor((i / numCP) * this.trackPoints.length);
            const pt = this.trackPoints[idx];
            this.checkpoints.push({
                id: i,
                x: pt.x,
                y: pt.y,
                r: 100, // Checkpoint detection radius
                trackIdx: idx,
            });
        }

        // Place cars at starting positions (along the start straight)
        const startPt = this.trackPoints[0];
        const nextPt = this.trackPoints[1];
        const startAngle = Math.atan2(nextPt.y - startPt.y, nextPt.x - startPt.x);

        const colors = ['#00F5FF', '#7B61FF', '#FF3D81', '#00FF9C', '#FBBF24', '#F97316',
            '#06B6D4', '#A855F7', '#EC4899', '#14B8A6', '#EF4444', '#8B5CF6'];
        let i = 0;
        for (const [playerId] of this.players) {
            const row = Math.floor(i / 2);
            const col = i % 2;
            // Stagger starting positions behind the start line
            const perpX = -Math.sin(startAngle) * (col === 0 ? -25 : 25);
            const perpY = Math.cos(startAngle) * (col === 0 ? -25 : 25);
            const backX = -Math.cos(startAngle) * row * 50;
            const backY = -Math.sin(startAngle) * row * 50;

            this.cars[playerId] = {
                x: startPt.x + perpX + backX,
                y: startPt.y + perpY + backY,
                angle: startAngle,
                vx: 0, vy: 0,
                speed: 0,
                driftMeter: 0,
                boostMeter: 0,      // 0-100
                boosted: false,
                boostEnd: 0,
                onRoad: true,
                color: colors[i % colors.length],
                username: this.players.get(playerId)?.username || `P${i + 1}`,
            };
            this.inputs[playerId] = { left: false, right: false, up: false, down: false, boost: false };
            this.playerProgress[playerId] = {
                nextCP: 0,
                laps: 0,
                cpCount: 0,
                finished: false,
                finishTime: 0,
                position: i + 1,
            };
            i++;
        }

        return {
            trackPoints: this.trackPoints,
            checkpoints: this.checkpoints,
            roadWidth: this.ROAD_WIDTH,
            cars: this.cars,
            matchDuration: this.matchDuration,
            lapsToWin: this.LAPS_TO_WIN,
            progress: this.playerProgress,
            powerUps: this.powerUps,
            powerUpTypes: this.POWERUP_TYPES,
        };
    }

    generateTrackPoints() {
        // Generate a larger, more interesting track with sweeping curves
        const pts = [];
        const cx = 800, cy = 500;
        const rx = 700, ry = 450;
        const totalPts = 160;

        for (let i = 0; i < totalPts; i++) {
            const angle = (i / totalPts) * Math.PI * 2;
            // More variation for interesting sweeping curves
            const rMod = 1 + Math.sin(angle * 3) * 0.12 + Math.cos(angle * 5) * 0.06 + Math.sin(angle * 7) * 0.03;
            pts.push({
                x: cx + Math.cos(angle) * rx * rMod,
                y: cy + Math.sin(angle) * ry * rMod,
            });
        }
        return pts;
    }

    onStart() {
        this.startTime = Date.now();
        this.lastPowerUpSpawn = Date.now();

        // Spawn initial power-ups (fewer, cleaner track)
        this.spawnPowerUps(3);

        // 30fps tick
        this.tickInterval = setInterval(() => {
            try {
                this.updatePhysics();

                const elapsed = (Date.now() - this.startTime) / 1000;
                const remaining = Math.max(0, this.matchDuration - elapsed);

                // Calculate positions (sort by laps desc, then CPs desc)
                const rankings = this.calculateRankings();

                this.broadcast({
                    type: MSG.DRIFT_TICK,
                    cars: this.cars,
                    progress: this.playerProgress,
                    rankings,
                    remaining: Math.ceil(remaining),
                    finishOrder: this.finishOrder,
                    powerUps: this.powerUps,
                });

                if (remaining <= 0 && !this.raceFinished) {
                    this.finishGame();
                }
            } catch (err) {
                console.error('NeonDrift updatePhysics error:', err);
            }
        }, 1000 / 30);
    }

    handleGameAction(playerId, action) {
        try {
            if (action.action === 'input') {
                this.inputs[playerId] = {
                    left: !!action.left,
                    right: !!action.right,
                    up: !!action.up,
                    down: !!action.down,
                    boost: !!action.boost,
                };
            }
        } catch (err) {
            console.error('NeonDrift handleGameAction error:', err);
        }
    }

    updatePhysics() {
        const now = Date.now();

        for (const [playerId, car] of Object.entries(this.cars)) {
            const inp = this.inputs[playerId] || {};
            const prog = this.playerProgress[playerId];
            if (!prog || prog.finished) continue;

            // Turning
            if (inp.left) car.angle -= this.TURN_SPEED * (car.onRoad ? 1 : 0.7);
            if (inp.right) car.angle += this.TURN_SPEED * (car.onRoad ? 1 : 0.7);

            // Acceleration
            const maxSpd = car.boosted ? this.CAR_MAX_SPEED * 1.5 : this.CAR_MAX_SPEED;
            const spdLimit = car.onRoad ? maxSpd : maxSpd * this.OFFROAD_SPEED_MULT;
            const accel = inp.up ? 0.18 : (inp.down ? -0.10 : -0.03);
            car.speed = Math.max(-1.5, Math.min(spdLimit, car.speed + accel));

            // On/off road speed reduction
            if (!car.onRoad && car.speed > spdLimit) {
                car.speed *= 0.96; // Gradual slowdown off-road
            }

            // Velocity (with drift)
            const targetVx = Math.cos(car.angle) * car.speed;
            const targetVy = Math.sin(car.angle) * car.speed;
            car.vx = car.vx * this.DRIFT_FACTOR + targetVx * (1 - this.DRIFT_FACTOR);
            car.vy = car.vy * this.DRIFT_FACTOR + targetVy * (1 - this.DRIFT_FACTOR);

            // Drift meter
            const actualAngle = Math.atan2(car.vy, car.vx);
            const angleDiff = Math.abs(car.angle - actualAngle);
            car.driftMeter = Math.min(100, car.driftMeter + angleDiff * Math.abs(car.speed) * 2.5);
            car.driftMeter *= 0.97;

            // Build boost from drifting
            if (car.driftMeter > 30 && Math.abs(car.speed) > 1.5) {
                car.boostMeter = Math.min(100, car.boostMeter + 0.25);
            }

            // Activate boost
            if (inp.boost && car.boostMeter >= 50 && !car.boosted) {
                car.boosted = true;
                car.boostEnd = now + 2500;
                car.boostMeter -= 50;
            }

            // Boost expire
            if (car.boosted && now > car.boostEnd) {
                car.boosted = false;
            }

            // Position
            car.x += car.vx;
            car.y += car.vy;

            // === Power-up collision ===
            for (let pi = this.powerUps.length - 1; pi >= 0; pi--) {
                const pu = this.powerUps[pi];
                if (!pu.active) continue;
                const dx = car.x - pu.x;
                const dy = car.y - pu.y;
                if (Math.sqrt(dx * dx + dy * dy) < 40) {
                    // Collect power-up
                    pu.active = false;
                    const puType = this.POWERUP_TYPES.find(t => t.type === pu.type);
                    if (puType) {
                        this.applyPowerUp(playerId, car, puType, now);
                    }
                    // Remove from array
                    this.powerUps.splice(pi, 1);
                }
            }

            // === Apply / expire active effects ===
            if (car.activeEffect) {
                if (now > car.effectEnd) {
                    // Effect expired
                    car.activeEffect = null;
                    car.effectEnd = 0;
                } else {
                    // Apply ongoing effects
                    if (car.activeEffect === 'slow') {
                        car.speed *= 0.92;
                        // Reduce steering when on oil
                        if (inp.left) car.angle += this.TURN_SPEED * 0.3; // counter-steer wobble
                    }
                }
            }

            // Track boundary detection (distance to nearest track centerline point)
            car.onRoad = this.isOnRoad(car.x, car.y);

            // Keep in arena bounds (wider than track)
            const ARENA_W = 1600, ARENA_H = 1000;
            if (car.x < 10) { car.x = 10; car.vx *= -0.5; }
            if (car.x > ARENA_W) { car.x = ARENA_W; car.vx *= -0.5; }
            if (car.y < 10) { car.y = 10; car.vy *= -0.5; }
            if (car.y > ARENA_H) { car.y = ARENA_H; car.vy *= -0.5; }

            // Checkpoint detection
            if (prog.nextCP < this.checkpoints.length) {
                const cp = this.checkpoints[prog.nextCP];
                const dx = car.x - cp.x;
                const dy = car.y - cp.y;
                if (Math.sqrt(dx * dx + dy * dy) < cp.r + 20) {
                    prog.nextCP++;
                    prog.cpCount++;

                    // Full lap
                    if (prog.nextCP >= this.checkpoints.length) {
                        prog.nextCP = 0;
                        prog.laps++;

                        this.broadcast({
                            type: MSG.DRIFT_LAP,
                            playerId,
                            laps: prog.laps,
                            lapsToWin: this.LAPS_TO_WIN,
                        });

                        // Check if player finished
                        if (prog.laps >= this.LAPS_TO_WIN) {
                            prog.finished = true;
                            prog.finishTime = Date.now() - this.startTime;
                            this.finishOrder.push({
                                playerId,
                                time: prog.finishTime,
                                position: this.finishOrder.length + 1,
                            });

                            this.broadcast({
                                type: MSG.DRIFT_FINISH,
                                playerId,
                                position: this.finishOrder.length,
                                time: prog.finishTime,
                            });

                            // If all players finished, end game
                            const allFinished = Object.values(this.playerProgress).every(p => p.finished);
                            if (allFinished) {
                                this.finishGame();
                            }
                        }
                    }
                }
            }
        }

        // Car-to-car bumping
        const ids = Object.keys(this.cars);
        for (let a = 0; a < ids.length; a++) {
            for (let b = a + 1; b < ids.length; b++) {
                const carA = this.cars[ids[a]];
                const carB = this.cars[ids[b]];
                const dx = carA.x - carB.x;
                const dy = carA.y - carB.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 28 && dist > 0) {
                    const nx = dx / dist;
                    const ny = dy / dist;
                    carA.vx += nx * 1.2;
                    carA.vy += ny * 1.2;
                    carB.vx -= nx * 1.2;
                    carB.vy -= ny * 1.2;
                    carA.speed *= 0.75;
                    carB.speed *= 0.75;
                }
            }
        }

        // Respawn power-ups periodically
        if (now - this.lastPowerUpSpawn > this.POWERUP_RESPAWN_MS) {
            this.lastPowerUpSpawn = now;
            this.spawnPowerUps(2);
        }
    }

    applyPowerUp(playerId, car, puType, now) {
        switch (puType.effect) {
            case 'speed':
                car.speed = Math.min(car.speed * puType.mult, this.CAR_MAX_SPEED * 1.6);
                car.activeEffect = 'speed';
                car.effectEnd = now + puType.duration;
                break;
            case 'slow':
                car.speed *= puType.mult;
                car.activeEffect = 'slow';
                car.effectEnd = now + puType.duration;
                break;
            case 'shield':
                car.activeEffect = 'shield';
                car.effectEnd = now + puType.duration;
                break;
            case 'points': {
                const player = this.players.get(playerId);
                if (player) player.score += puType.mult;
                const prog = this.playerProgress[playerId];
                if (prog) prog.cpCount += 5; // Bonus checkpoint credit
                break;
            }
            case 'turbo':
                car.speed = this.CAR_MAX_SPEED * puType.mult;
                car.boosted = true;
                car.boostEnd = now + puType.duration;
                car.activeEffect = 'turbo';
                car.effectEnd = now + puType.duration;
                break;
        }
    }

    spawnPowerUps(count) {
        for (let i = 0; i < count; i++) {
            // Pick a random track point and spawn near it
            const idx = Math.floor(Math.random() * this.trackPoints.length);
            const pt = this.trackPoints[idx];
            // Slight random offset so items aren't exactly on centerline
            const offset = (Math.random() - 0.5) * this.ROAD_WIDTH * 0.6;
            const angle = Math.atan2(
                this.trackPoints[(idx + 1) % this.trackPoints.length].y - pt.y,
                this.trackPoints[(idx + 1) % this.trackPoints.length].x - pt.x
            );
            const px = pt.x + Math.sin(angle) * offset;
            const py = pt.y - Math.cos(angle) * offset;

            const typeIdx = Math.floor(Math.random() * this.POWERUP_TYPES.length);
            const pu = this.POWERUP_TYPES[typeIdx];

            this.powerUps.push({
                id: ++this.powerUpIdCounter,
                type: pu.type,
                color: pu.color,
                icon: pu.icon,
                x: px,
                y: py,
                active: true,
            });
        }
    }

    isOnRoad(x, y) {
        // Find minimum distance to any track centerline segment
        let minDist = Infinity;
        for (let i = 0; i < this.trackPoints.length; i++) {
            const a = this.trackPoints[i];
            const b = this.trackPoints[(i + 1) % this.trackPoints.length];
            const dist = this.pointToSegmentDist(x, y, a.x, a.y, b.x, b.y);
            if (dist < minDist) minDist = dist;
        }
        return minDist < this.ROAD_WIDTH;
    }

    pointToSegmentDist(px, py, ax, ay, bx, by) {
        const dx = bx - ax, dy = by - ay;
        const len2 = dx * dx + dy * dy;
        if (len2 === 0) return Math.sqrt((px - ax) ** 2 + (py - ay) ** 2);
        let t = ((px - ax) * dx + (py - ay) * dy) / len2;
        t = Math.max(0, Math.min(1, t));
        const projX = ax + t * dx;
        const projY = ay + t * dy;
        return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
    }

    calculateRankings() {
        const entries = Object.entries(this.playerProgress).map(([id, p]) => ({
            id,
            laps: p.laps,
            cpCount: p.cpCount,
            finished: p.finished,
            finishTime: p.finishTime,
            username: this.cars[id]?.username || id.slice(0, 6),
        }));

        // Sort: finished first (by time), then by laps desc, then by cpCount desc
        entries.sort((a, b) => {
            if (a.finished && !b.finished) return -1;
            if (!a.finished && b.finished) return 1;
            if (a.finished && b.finished) return a.finishTime - b.finishTime;
            if (a.laps !== b.laps) return b.laps - a.laps;
            return b.cpCount - a.cpCount;
        });

        return entries.map((e, i) => ({ ...e, position: i + 1 }));
    }

    getScoreMap() {
        const scores = {};
        for (const [id, p] of Object.entries(this.playerProgress)) {
            scores[id] = p.laps * 100 + p.cpCount * 10 + (p.finished ? 500 : 0);
        }
        return scores;
    }

    finishGame() {
        if (this.raceFinished) return;
        this.raceFinished = true;
        clearInterval(this.tickInterval);

        const rankings = this.calculateRankings();
        const winnerId = rankings[0]?.id || null;

        // Set scores based on ranking
        for (const r of rankings) {
            const player = this.players.get(r.id);
            if (player) {
                player.score = r.laps * 100 + r.cpCount * 10 + (r.finished ? 500 : 0);
            }
        }

        this.endGame(winnerId, 'complete');
    }

    getMatchMeta() {
        return {
            rankings: this.calculateRankings(),
            lapsToWin: this.LAPS_TO_WIN,
            finishOrder: this.finishOrder,
        };
    }

    cleanup() {
        if (this.tickInterval) clearInterval(this.tickInterval);
    }
}
