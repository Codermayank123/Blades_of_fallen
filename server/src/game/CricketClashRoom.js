import { BaseGameRoom } from './BaseGameRoom.js';

const BALLS_PER_PLAYER = 6; // balls each player faces

// Shot types: risk/reward profile
const SHOTS = {
    defensive: { runChances: [0, 0, 0, 1, 1, 2], outBias: 0 },
    normal: { runChances: [0, 1, 2, 3, 4, 4], outBias: 1 },
    aggressive: { runChances: [4, 6, 6, 6, 6, 6], outBias: 3 }
};

// Overall out probability (20-sided roll threshold)
const OUT_THRESHOLD = { defensive: 2, normal: 5, aggressive: 9 };

/**
 * CricketClashRoom — multiplayer batting rotation game.
 *
 * Flow:
 *  1. Players take turns batting (one at a time).
 *  2. Server bowls a ball; batter chooses shot type in 8s.
 *  3. Server resolves: runs scored OR OUT.
 *  4. After BALLS_PER_PLAYER balls (or OUT), next player bats.
 *  5. After everyone bats, highest score wins.
 */
export class CricketClashRoom extends BaseGameRoom {
    constructor(roomCode, creatorId) {
        super(roomCode, creatorId, 'cricket_clash', 10);
        this.playerOrder = []; // ordered list of playerIds
        this.batterIndex = 0;
        this.playerStats = new Map(); // id -> { runs, balls, out, isOut }
        this.ballTimer = null;
        this.shotTimeout = null;
        this.awaitingShot = false;
        this.currentBall = 0;
    }

    getGameStartData() {
        return { ballsPerPlayer: BALLS_PER_PLAYER };
    }

    onStart() {
        // Build ordered list from connected players
        for (const [id] of this.players) {
            this.playerOrder.push(id);
            this.playerStats.set(id, { runs: 0, balls: 0, out: false });
        }
        this.batterIndex = 0;
        this._startBatterTurn();
    }

    handleGameAction(playerId, message) {
        if (this.state !== 'IN_PROGRESS' && this.state !== 'in_progress') return;
        if (!this.awaitingShot) return;

        // Only the current batter can respond
        const currentBatterId = this.playerOrder[this.batterIndex];
        if (playerId !== currentBatterId) return;

        const { shot } = message; // 'defensive' | 'normal' | 'aggressive'
        if (!SHOTS[shot]) return;

        clearTimeout(this.shotTimeout);
        this.awaitingShot = false;
        this._resolveShot(currentBatterId, shot);
    }

    _startBatterTurn() {
        if (this.batterIndex >= this.playerOrder.length) {
            // All players have batted — find winner
            this._endInnings();
            return;
        }

        const batterId = this.playerOrder[this.batterIndex];
        const stats = this.playerStats.get(batterId);
        const batter = this.players.get(batterId);

        this.broadcast({
            type: 'BATTER_CHANGE',
            batterId,
            batterUsername: batter?.username || 'Player',
            stats: this._getAllStats()
        });

        this.currentBall = 0;
        this._bowlNextBall();
    }

    _bowlNextBall() {
        const batterId = this.playerOrder[this.batterIndex];
        const stats = this.playerStats.get(batterId);

        if (!stats || stats.out || stats.balls >= BALLS_PER_PLAYER) {
            this.batterIndex++;
            this._startBatterTurn();
            return;
        }

        this.awaitingShot = true;
        this.broadcast({
            type: 'BALL_BOWLED',
            batterId,
            ball: stats.balls + 1,
            totalBalls: BALLS_PER_PLAYER,
            timeLimit: 8000 // 8 seconds to choose shot
        });

        // Auto-defensive shot if no response in 8s
        this.shotTimeout = setTimeout(() => {
            if (this.awaitingShot) {
                this.awaitingShot = false;
                this._resolveShot(batterId, 'defensive');
            }
        }, 8000);
    }

    _resolveShot(batterId, shot) {
        const stats = this.playerStats.get(batterId);
        if (!stats) return;

        stats.balls++;

        // Determine outcome
        const outRoll = Math.floor(Math.random() * 20);
        const isOut = outRoll < OUT_THRESHOLD[shot];

        let runs = 0;
        if (!isOut) {
            const profile = SHOTS[shot];
            const idx = Math.floor(Math.random() * profile.runChances.length);
            runs = profile.runChances[idx];
        }

        stats.runs += runs;
        stats.out = isOut;

        // Update score for ELO tracking
        const player = this.players.get(batterId);
        if (player) player.score = stats.runs;

        this.broadcast({
            type: 'SHOT_RESULT',
            batterId,
            shot,
            runs,
            isOut,
            totalRuns: stats.runs,
            ball: stats.balls,
            stats: this._getAllStats()
        });

        if (isOut || stats.balls >= BALLS_PER_PLAYER) {
            // Move to next batter after a short delay
            setTimeout(() => {
                this.batterIndex++;
                this._startBatterTurn();
            }, 1500);
        } else {
            setTimeout(() => this._bowlNextBall(), 1500);
        }
    }

    _endInnings() {
        clearTimeout(this.ballTimer);
        clearTimeout(this.shotTimeout);

        // Find player with highest runs
        let topId = null, topRuns = -1;
        for (const [id, stats] of this.playerStats) {
            if (stats.runs > topRuns) {
                topRuns = stats.runs;
                topId = id;
            }
        }

        // Attach final per-player stat snapshot to GAME_OVER extra data
        // BaseGameRoom.endGame will handle ELO + match saving
        for (const [id, stats] of this.playerStats) {
            const p = this.players.get(id);
            if (p) p.score = stats.runs;
        }

        this.endGame(topId, 'innings_complete');
    }

    _getAllStats() {
        const result = {};
        for (const [id, stats] of this.playerStats) {
            const p = this.players.get(id);
            result[id] = {
                username: p?.username || id,
                runs: stats.runs,
                balls: stats.balls,
                out: stats.out
            };
        }
        return result;
    }

    cleanup() {
        clearTimeout(this.ballTimer);
        clearTimeout(this.shotTimeout);
    }
}
