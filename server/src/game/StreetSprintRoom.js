import { BaseGameRoom } from './BaseGameRoom.js';

const RACE_DURATION = 45; // seconds
const FINISH_LINE = 100; // progress units to win
const BASE_TAP_GAIN = 2.5; // progress per tap
const BOOST_DURATION = 3000; // ms
const BOOST_MULTIPLIER = 2.0;
const TICK_MS = 500; // broadcast every 500ms

/**
 * StreetSprintRoom — turn-key racing mode.
 *
 * Mechanic:
 *  - Players spam GAME_ACTION { action: 'TAP' } to gain progress
 *  - Boost pickups appear randomly: picking up gives 2x speed for 3s
 *  - First player to reach progress=100 wins
 *  - If nobody reaches 100 in RACE_DURATION seconds, highest progress wins
 */
export class StreetSprintRoom extends BaseGameRoom {
    constructor(roomCode, creatorId) {
        super(roomCode, creatorId, 'street_sprint', 8);
        this.raceTimer = null;
        this.tickTimer = null;
        this.timeLeft = RACE_DURATION;
        this.boostSpawnTimer = null;
        this.activeBoost = null; // { playerId, expiresAt }
    }

    getGameStartData() {
        return {
            duration: RACE_DURATION,
            finishLine: FINISH_LINE
        };
    }

    onStart() {
        // Initialise race state per player
        for (const [id, p] of this.players) {
            p.progress = 0;
            p.boosting = false;
            p.boostExpiry = 0;
            p.taps = 0;
            p.score = 0;
        }
        this.timeLeft = RACE_DURATION;

        // Start tick broadcast
        this.tickTimer = setInterval(() => this._tick(), TICK_MS);

        // Countdown to game over
        this.raceTimer = setTimeout(() => this._timeUp(), RACE_DURATION * 1000);

        // Spawn first boost after 8s
        this._scheduleBoost(8000);
    }

    handleGameAction(playerId, message) {
        if (this.state !== 'IN_PROGRESS' && this.state !== 'in_progress') return;
        const player = this.players.get(playerId);
        if (!player || !player.connected) return;

        if (message.action === 'TAP') {
            const now = Date.now();
            const isBoosting = player.boosting && player.boostExpiry > now;
            const gain = BASE_TAP_GAIN * (isBoosting ? BOOST_MULTIPLIER : 1);

            player.progress = Math.min(FINISH_LINE, (player.progress || 0) + gain);
            player.taps = (player.taps || 0) + 1;
            player.score = Math.round(player.progress);

            // Check if finished
            if (player.progress >= FINISH_LINE) {
                this._finishRace(playerId);
            }
        } else if (message.action === 'CLAIM_BOOST') {
            // Only valid if boost is unclaimed and in the lane
            if (this.activeBoost && !this.activeBoost.claimedBy) {
                this.activeBoost.claimedBy = playerId;
                const player = this.players.get(playerId);
                if (player) {
                    player.boosting = true;
                    player.boostExpiry = Date.now() + BOOST_DURATION;
                    setTimeout(() => { if (player) player.boosting = false; }, BOOST_DURATION);
                }
                this.broadcast({
                    type: 'SPRINT_BOOST',
                    playerId,
                    duration: BOOST_DURATION
                });
                this.activeBoost = null;
                this._scheduleBoost(10000 + Math.random() * 5000);
            }
        }
    }

    _tick() {
        const now = Date.now();
        this.timeLeft = Math.max(0, this.timeLeft - TICK_MS / 1000);

        const playerStates = [];
        for (const [id, p] of this.players) {
            playerStates.push({
                id,
                username: p.username,
                progress: Math.round((p.progress || 0) * 10) / 10,
                boosting: p.boosting && p.boostExpiry > now,
                taps: p.taps || 0
            });
        }

        // Sort by progress descending
        playerStates.sort((a, b) => b.progress - a.progress);

        this.broadcast({
            type: 'SPRINT_TICK',
            players: playerStates,
            timeLeft: Math.ceil(this.timeLeft),
            boost: this.activeBoost ? { available: true, at: this.activeBoost.at } : null
        });
    }

    _finishRace(winnerId) {
        clearInterval(this.tickTimer);
        clearTimeout(this.raceTimer);
        clearTimeout(this.boostSpawnTimer);
        this.endGame(winnerId, 'finish');
    }

    _timeUp() {
        clearInterval(this.tickTimer);
        clearTimeout(this.boostSpawnTimer);

        // Find player with highest progress
        let topId = null, topProgress = -1;
        for (const [id, p] of this.players) {
            if ((p.progress || 0) > topProgress) {
                topProgress = p.progress;
                topId = id;
            }
        }
        this.endGame(topId, 'timeout');
    }

    _scheduleBoost(delay) {
        this.boostSpawnTimer = setTimeout(() => {
            if (this.state !== 'IN_PROGRESS') return;
            const at = Math.random(); // relative lane position 0-1
            this.activeBoost = { at, claimedBy: null };
            this.broadcast({ type: 'SPRINT_BOOST', available: true, at });
        }, delay);
    }

    cleanup() {
        clearInterval(this.tickTimer);
        clearTimeout(this.raceTimer);
        clearTimeout(this.boostSpawnTimer);
    }
}
