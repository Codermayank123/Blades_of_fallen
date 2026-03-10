import { BaseGameRoom } from './BaseGameRoom.js';
import { MSG } from '../utils/constants.js';

/**
 * Gem Heist Arena — Real-time multiplayer gem collection (2–8 players)
 * - Free movement in 2D arena
 * - Collect gems, deposit at your base zone
 * - Bump opponents to make them drop gems
 * - Most deposited gems wins (90s match)
 * - Gold gem spawns every 30s worth 5x
 */
export class GemHeistRoom extends BaseGameRoom {
    constructor(roomCode, creatorId) {
        super(roomCode, creatorId, 'territory', 8); // Keep 'territory' as gameType
        this.ARENA_W = 1000;
        this.ARENA_H = 700;
        this.PLAYER_SPEED = 3.5;
        this.PLAYER_RADIUS = 16;
        this.GEM_RADIUS = 10;
        this.DEPOSIT_RADIUS = 50;
        this.MAX_CARRY = 5;
        this.BUMP_DIST = 30;
        this.BUMP_SPEED = 2.5;
        this.matchDuration = 90;
        this.tickInterval = null;
        this.startTime = null;
        this.totalGems = 12;        // Active gems on field
        this.players_data = {};     // playerId -> { x, y, vx, vy, carrying, deposited, color, depositZone }
        this.inputs = {};           // playerId -> { left, right, up, down }
        this.gems = [];             // { id, x, y, type, active }
        this.goldTimer = null;
        this.nextGemId = 0;
        this.events = [];           // Recent events for broadcast
    }

    getGameStartData() {
        const colors = ['#00F5FF', '#FF3D81', '#00FF9C', '#7B61FF', '#FBBF24', '#F97316', '#EC4899', '#14B8A6'];
        // Deposit zones around edges
        const depositPositions = [
            { x: 50, y: this.ARENA_H / 2 },
            { x: this.ARENA_W - 50, y: this.ARENA_H / 2 },
            { x: this.ARENA_W / 2, y: 50 },
            { x: this.ARENA_W / 2, y: this.ARENA_H - 50 },
            { x: 80, y: 80 },
            { x: this.ARENA_W - 80, y: 80 },
            { x: 80, y: this.ARENA_H - 80 },
            { x: this.ARENA_W - 80, y: this.ARENA_H - 80 },
        ];

        let i = 0;
        for (const [playerId] of this.players) {
            const dp = depositPositions[i % depositPositions.length];
            this.players_data[playerId] = {
                x: dp.x,
                y: dp.y,
                vx: 0, vy: 0,
                carrying: 0,
                deposited: 0,
                color: colors[i % colors.length],
                username: this.players.get(playerId)?.username || `P${i + 1}`,
                depositZone: { x: dp.x, y: dp.y },
                invincible: 0, // Timestamp until invincible
            };
            this.inputs[playerId] = { left: false, right: false, up: false, down: false };
            i++;
        }

        // Spawn initial gems
        this.gems = [];
        for (let g = 0; g < this.totalGems; g++) {
            this.spawnGem('normal');
        }

        return {
            arenaW: this.ARENA_W,
            arenaH: this.ARENA_H,
            players: this.players_data,
            gems: this.gems,
            matchDuration: this.matchDuration,
            maxCarry: this.MAX_CARRY,
            depositRadius: this.DEPOSIT_RADIUS,
        };
    }

    spawnGem(type = 'normal') {
        // Spawn in center region avoiding edges
        const gem = {
            id: this.nextGemId++,
            x: 120 + Math.random() * (this.ARENA_W - 240),
            y: 120 + Math.random() * (this.ARENA_H - 240),
            type, // 'normal' or 'gold'
            active: true,
        };
        this.gems.push(gem);
        return gem;
    }

    onStart() {
        this.startTime = Date.now();

        // 30fps tick
        this.tickInterval = setInterval(() => {
            try {
                this.updatePhysics();

                const elapsed = (Date.now() - this.startTime) / 1000;
                const remaining = Math.max(0, this.matchDuration - elapsed);

                this.broadcast({
                    type: MSG.HEIST_TICK,
                    players: this.players_data,
                    gems: this.gems.filter(g => g.active),
                    remaining: Math.ceil(remaining),
                    scores: this.getScoreMap(),
                    events: this.events,
                });
                this.events = [];

                if (remaining <= 0) {
                    this.finishGame();
                }
            } catch (err) {
                console.error('GemHeist tick error:', err);
            }
        }, 1000 / 30);

        // Gold gem timer
        this.goldTimer = setInterval(() => {
            const gold = this.spawnGem('gold');
            this.broadcast({
                type: MSG.HEIST_GOLD_SPAWN,
                gem: gold,
            });
        }, 30000);
    }

    handleGameAction(playerId, action) {
        try {
            if (action.action === 'input') {
                this.inputs[playerId] = {
                    left: !!action.left,
                    right: !!action.right,
                    up: !!action.up,
                    down: !!action.down,
                };
            }
        } catch (err) {
            console.error('GemHeist handleGameAction error:', err);
        }
    }

    updatePhysics() {
        const now = Date.now();

        for (const [playerId, pd] of Object.entries(this.players_data)) {
            const inp = this.inputs[playerId] || {};

            // Movement
            let dx = 0, dy = 0;
            if (inp.left) dx -= 1;
            if (inp.right) dx += 1;
            if (inp.up) dy -= 1;
            if (inp.down) dy += 1;

            // Normalize diagonal
            if (dx !== 0 && dy !== 0) {
                dx *= 0.707; dy *= 0.707;
            }

            // Slow down when carrying many gems
            const speedMult = 1 - pd.carrying * 0.08;
            pd.vx = dx * this.PLAYER_SPEED * speedMult;
            pd.vy = dy * this.PLAYER_SPEED * speedMult;

            pd.x += pd.vx;
            pd.y += pd.vy;

            // Arena bounds
            pd.x = Math.max(this.PLAYER_RADIUS, Math.min(this.ARENA_W - this.PLAYER_RADIUS, pd.x));
            pd.y = Math.max(this.PLAYER_RADIUS, Math.min(this.ARENA_H - this.PLAYER_RADIUS, pd.y));

            // Gem collection
            for (const gem of this.gems) {
                if (!gem.active) continue;
                if (pd.carrying >= this.MAX_CARRY) break;
                const gdx = pd.x - gem.x;
                const gdy = pd.y - gem.y;
                if (Math.sqrt(gdx * gdx + gdy * gdy) < this.PLAYER_RADIUS + this.GEM_RADIUS) {
                    gem.active = false;
                    pd.carrying += gem.type === 'gold' ? 3 : 1;
                    pd.carrying = Math.min(this.MAX_CARRY, pd.carrying);

                    this.events.push({
                        type: 'collect', playerId,
                        gemType: gem.type, gemId: gem.id,
                    });

                    // Respawn normal gem after 3s
                    if (gem.type === 'normal') {
                        setTimeout(() => this.spawnGem('normal'), 3000);
                    }
                }
            }
            // Clean up inactive gems
            this.gems = this.gems.filter(g => g.active);

            // Deposit at own zone
            const dz = pd.depositZone;
            const ddx = pd.x - dz.x;
            const ddy = pd.y - dz.y;
            if (Math.sqrt(ddx * ddx + ddy * ddy) < this.DEPOSIT_RADIUS && pd.carrying > 0) {
                pd.deposited += pd.carrying;
                const player = this.players.get(playerId);
                if (player) player.score = pd.deposited * 10;

                this.events.push({
                    type: 'deposit', playerId,
                    amount: pd.carrying, total: pd.deposited,
                });

                pd.carrying = 0;
            }
        }

        // Player-to-player bumping (steal gems)
        const pIds = Object.keys(this.players_data);
        for (let a = 0; a < pIds.length; a++) {
            for (let b = a + 1; b < pIds.length; b++) {
                const pa = this.players_data[pIds[a]];
                const pb = this.players_data[pIds[b]];
                const dx = pa.x - pb.x;
                const dy = pa.y - pb.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < this.BUMP_DIST && dist > 0) {
                    // Check if either is moving fast enough to bump
                    const speedA = Math.sqrt(pa.vx * pa.vx + pa.vy * pa.vy);
                    const speedB = Math.sqrt(pb.vx * pb.vx + pb.vy * pb.vy);

                    const nx = dx / dist;
                    const ny = dy / dist;

                    // Push apart
                    pa.x += nx * 3; pa.y += ny * 3;
                    pb.x -= nx * 3; pb.y -= ny * 3;

                    // Steal gems from the slower player
                    if (speedA > this.BUMP_SPEED && pb.carrying > 0 && now > (pb.invincible || 0)) {
                        const stolen = Math.ceil(pb.carrying / 2);
                        pb.carrying -= stolen;
                        // Drop stolen gems as collectible gems
                        for (let sg = 0; sg < stolen; sg++) {
                            this.gems.push({
                                id: this.nextGemId++,
                                x: pb.x + (Math.random() - 0.5) * 40,
                                y: pb.y + (Math.random() - 0.5) * 40,
                                type: 'normal', active: true,
                            });
                        }
                        pb.invincible = now + 1500; // 1.5s invincibility
                        this.events.push({
                            type: 'steal', stealer: pIds[a], victim: pIds[b],
                            amount: stolen,
                        });
                    }

                    if (speedB > this.BUMP_SPEED && pa.carrying > 0 && now > (pa.invincible || 0)) {
                        const stolen = Math.ceil(pa.carrying / 2);
                        pa.carrying -= stolen;
                        for (let sg = 0; sg < stolen; sg++) {
                            this.gems.push({
                                id: this.nextGemId++,
                                x: pa.x + (Math.random() - 0.5) * 40,
                                y: pa.y + (Math.random() - 0.5) * 40,
                                type: 'normal', active: true,
                            });
                        }
                        pa.invincible = now + 1500;
                        this.events.push({
                            type: 'steal', stealer: pIds[b], victim: pIds[a],
                            amount: stolen,
                        });
                    }
                }
            }
        }
    }

    getScoreMap() {
        const scores = {};
        for (const [id, pd] of Object.entries(this.players_data)) {
            scores[id] = pd.deposited * 10;
        }
        return scores;
    }

    finishGame() {
        clearInterval(this.tickInterval);
        if (this.goldTimer) clearInterval(this.goldTimer);

        // Winner = most deposited gems
        let winnerId = null;
        let maxDeposited = -1;
        for (const [id, pd] of Object.entries(this.players_data)) {
            if (pd.deposited > maxDeposited) {
                maxDeposited = pd.deposited;
                winnerId = id;
            }
            const player = this.players.get(id);
            if (player) player.score = pd.deposited * 10;
        }

        this.endGame(winnerId, 'complete');
    }

    getMatchMeta() {
        const playerStats = {};
        for (const [id, pd] of Object.entries(this.players_data)) {
            playerStats[id] = { deposited: pd.deposited, carrying: pd.carrying };
        }
        return { playerStats, duration: this.matchDuration };
    }

    cleanup() {
        if (this.tickInterval) clearInterval(this.tickInterval);
        if (this.goldTimer) clearInterval(this.goldTimer);
    }
}
