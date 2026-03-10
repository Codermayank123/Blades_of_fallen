import { BaseGameRoom } from './BaseGameRoom.js';
import { MSG } from '../utils/constants.js';

const TOTAL_ROUNDS = 10;
const MIN_DELAY = 2000; // ms
const MAX_DELAY = 6000; // ms

export class ReactionTapRoom extends BaseGameRoom {
    constructor(roomCode, creatorId) {
        super(roomCode, creatorId, 'reaction', 8);
        this.currentRound = 0;
        this.totalRounds = TOTAL_ROUNDS;
        this.roundActive = false;
        this.taps = new Map();
        this.goTime = 0;
        this.roundTimer = null;
        this.goTimer = null;
    }

    onStart() {
        this.currentRound = 0;
        setTimeout(() => this.startRound(), 2000);
    }

    startRound() {
        if (this.currentRound >= this.totalRounds) {
            this.finishGame();
            return;
        }

        this.currentRound++;
        this.taps.clear();
        this.roundActive = false;

        // Tell players to get ready
        this.broadcast({
            type: MSG.ROUND_START,
            round: this.currentRound,
            totalRounds: this.totalRounds,
            message: 'Get ready...',
            scores: this.getScores()
        });

        // Random delay before GO
        const delay = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);

        this.goTimer = setTimeout(() => {
            this.goTime = Date.now();
            this.roundActive = true;

            this.broadcast({
                type: MSG.TAP_GO,
                round: this.currentRound
            });

            // Round timeout (5 second window)
            this.roundTimer = setTimeout(() => {
                this.resolveRound();
            }, 5000);
        }, delay);
    }

    handleGameAction(playerId, action) {
        if (action.action !== 'tap') return;

        if (!this.roundActive) {
            // False start!
            this.sendTo(playerId, {
                type: MSG.GAME_STATE,
                action: 'false_start',
                message: 'Too early! Wait for GO!'
            });
            return;
        }

        if (this.taps.has(playerId)) return; // Already tapped

        const reactionTime = Date.now() - this.goTime;
        this.taps.set(playerId, reactionTime);

        this.broadcast({
            type: MSG.GAME_STATE,
            action: 'player_tapped',
            playerId,
            username: this.players.get(playerId)?.username,
            tappedCount: this.taps.size,
            totalPlayers: this.players.size
        });

        // If everyone tapped, resolve early
        if (this.taps.size >= this.players.size) {
            clearTimeout(this.roundTimer);
            setTimeout(() => this.resolveRound(), 300);
        }
    }

    resolveRound() {
        clearTimeout(this.roundTimer);
        this.roundActive = false;

        // Sort by reaction time
        const sorted = Array.from(this.taps.entries()).sort((a, b) => a[1] - b[1]);

        // Award points: fastest gets most points
        const results = [];
        sorted.forEach(([id, time], index) => {
            const points = Math.max(1, this.players.size - index) * 2;
            const player = this.players.get(id);
            if (player) {
                player.score += points;
            }
            results.push({
                id,
                username: player?.username,
                reactionTime: time,
                points,
                position: index + 1
            });
        });

        // Players who didn't tap get 0
        for (const [id, p] of this.players) {
            if (!this.taps.has(id)) {
                results.push({
                    id,
                    username: p.username,
                    reactionTime: null,
                    points: 0,
                    position: results.length + 1
                });
            }
        }

        this.eventsLog.push({
            type: 'round_result',
            data: { round: this.currentRound, fastest: sorted[0]?.[0] }
        });

        this.broadcast({
            type: MSG.ROUND_END,
            round: this.currentRound,
            results,
            scores: this.getScores()
        });

        // Next round
        setTimeout(() => this.startRound(), 3000);
    }

    finishGame() {
        let winnerId = null;
        let highScore = -1;
        for (const [id, p] of this.players) {
            if (p.score > highScore) {
                highScore = p.score;
                winnerId = id;
            }
        }
        this.endGame(winnerId, 'complete');
    }

    getScores() {
        const scores = {};
        for (const [id, p] of this.players) {
            scores[id] = p.score;
        }
        return scores;
    }

    cleanup() {
        if (this.roundTimer) clearTimeout(this.roundTimer);
        if (this.goTimer) clearTimeout(this.goTimer);
    }
}
