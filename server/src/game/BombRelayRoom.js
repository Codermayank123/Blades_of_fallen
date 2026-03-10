import { BaseGameRoom } from './BaseGameRoom.js';
import { ROOM_STATES, MSG } from '../utils/constants.js';

/**
 * Bomb Relay Royale — pass-the-bomb survival (3–10 players)
 * State: countdown → active → exploding → elimination → active... → finished
 */
export class BombRelayRoom extends BaseGameRoom {
    constructor(roomCode, creatorId) {
        super(roomCode, creatorId, 'bomb_relay', 10);
        this.alivePlayers = [];     // IDs of players still alive
        this.bombHolder = null;     // current holder ID
        this.bombTimer = 8000;      // ms remaining on bomb
        this.bombMaxTime = 8000;    // starting timer per round
        this.roundNumber = 0;
        this.tickInterval = null;
        this.bombInterval = null;
        this.passCooldown = new Map(); // playerId -> timestamp of last pass
        this.PASS_COOLDOWN_MS = 1000;
        this.MIN_BOMB_TIME = 3000;
        this.phase = 'waiting';     // waiting | countdown | active | exploding | finished
    }

    getGameStartData() {
        this.alivePlayers = Array.from(this.players.keys());
        return {
            alivePlayers: this.alivePlayers,
            totalPlayers: this.alivePlayers.length
        };
    }

    onStart() {
        this.phase = 'countdown';
        // 3 second countdown then start first round
        let count = 3;
        const countInterval = setInterval(() => {
            this.broadcast({
                type: MSG.BOMB_ROUND,
                action: 'countdown',
                count
            });
            count--;
            if (count < 0) {
                clearInterval(countInterval);
                this.startRound();
            }
        }, 1000);
        this._countdownInterval = countInterval;
    }

    startRound() {
        if (this.alivePlayers.length <= 1) {
            this.finishGame();
            return;
        }

        this.roundNumber++;
        // Decrease bomb timer each round (min 3s)
        this.bombMaxTime = Math.max(this.MIN_BOMB_TIME, 8000 - (this.roundNumber - 1) * 500);
        this.bombTimer = this.bombMaxTime;

        // Random starting holder
        const randomIdx = Math.floor(Math.random() * this.alivePlayers.length);
        this.bombHolder = this.alivePlayers[randomIdx];
        this.phase = 'active';

        this.broadcast({
            type: MSG.BOMB_ROUND,
            action: 'start',
            round: this.roundNumber,
            bombHolder: this.bombHolder,
            bombHolderUsername: this.players.get(this.bombHolder)?.username,
            bombMaxTime: this.bombMaxTime,
            alivePlayers: this.alivePlayers.map(id => ({
                id,
                username: this.players.get(id)?.username
            }))
        });

        // Tick every 100ms
        this.tickInterval = setInterval(() => {
            this.bombTimer -= 100;

            this.broadcast({
                type: MSG.BOMB_TICK,
                bombHolder: this.bombHolder,
                bombTimer: this.bombTimer,
                bombMaxTime: this.bombMaxTime,
                bombPct: this.bombTimer / this.bombMaxTime
            });

            if (this.bombTimer <= 0) {
                this.explode();
            }
        }, 100);
    }

    handleGameAction(playerId, action) {
        if (action.action === 'pass_bomb') {
            this.passBomb(playerId, action.targetId);
        }
    }

    passBomb(fromId, toId) {
        if (this.phase !== 'active') return;
        if (fromId !== this.bombHolder) return;
        if (!this.alivePlayers.includes(toId)) return;
        if (fromId === toId) return;

        // Check cooldown
        const lastPass = this.passCooldown.get(fromId) || 0;
        if (Date.now() - lastPass < this.PASS_COOLDOWN_MS) return;

        this.passCooldown.set(fromId, Date.now());
        this.bombHolder = toId;

        this.broadcast({
            type: MSG.BOMB_PASS,
            from: fromId,
            fromUsername: this.players.get(fromId)?.username,
            to: toId,
            toUsername: this.players.get(toId)?.username,
            bombTimer: this.bombTimer,
            bombPct: this.bombTimer / this.bombMaxTime
        });
    }

    explode() {
        clearInterval(this.tickInterval);
        this.tickInterval = null;
        this.phase = 'exploding';

        const eliminatedId = this.bombHolder;
        const eliminatedName = this.players.get(eliminatedId)?.username;

        // Remove from alive
        this.alivePlayers = this.alivePlayers.filter(id => id !== eliminatedId);

        this.eventsLog.push({
            type: 'elimination',
            playerId: eliminatedId,
            data: { round: this.roundNumber }
        });

        this.broadcast({
            type: MSG.BOMB_EXPLODE,
            eliminatedId,
            eliminatedUsername: eliminatedName,
            round: this.roundNumber,
            alivePlayers: this.alivePlayers.map(id => ({
                id,
                username: this.players.get(id)?.username
            })),
            aliveCount: this.alivePlayers.length
        });

        // After 2.5s delay for explosion animation, start next round
        setTimeout(() => {
            if (this.alivePlayers.length <= 1) {
                this.finishGame();
            } else {
                this.startRound();
            }
        }, 2500);
    }

    finishGame() {
        this.phase = 'finished';
        const winnerId = this.alivePlayers[0] || null;

        // Score: surviving = 100, eliminated = based on survival order
        const totalPlayers = Array.from(this.players.keys()).length;
        for (const [id, p] of this.players) {
            if (id === winnerId) {
                p.score = 100;
            } else {
                p.score = 0;
            }
        }

        this.endGame(winnerId, 'complete');
    }

    getMatchMeta() {
        return {
            rounds: this.roundNumber,
            totalPlayers: this.players.size,
            survivors: this.alivePlayers.length
        };
    }

    cleanup() {
        if (this.tickInterval) clearInterval(this.tickInterval);
        if (this._countdownInterval) clearInterval(this._countdownInterval);
    }
}
