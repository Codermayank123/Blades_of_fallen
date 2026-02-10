import { ServerFighter } from './Fighter.js';
import { processAttacks } from './Physics.js';
import { User } from '../db/User.js';
import { calculateEloChange, XP_REWARDS } from '../utils/elo.js';
import {
    TICK_RATE,
    TICK_INTERVAL,
    STATE_BROADCAST_RATE,
    MATCH_DURATION,
    CANVAS_WIDTH,
    ROOM_STATES,
    MSG
} from '../utils/constants.js';

export class GameRoom {
    constructor(roomCode, creatorId) {
        this.roomCode = roomCode;
        this.creatorId = creatorId;
        this.players = new Map(); // odId -> { socket, fighter, ready }
        this.state = ROOM_STATES.WAITING;
        this.tick = 0;
        this.timer = MATCH_DURATION;
        this.gameLoop = null;
        this.winner = null;
        this.events = [];
    }

    addPlayer(playerId, socket, username, mongoUserId = null) {
        if (this.players.size >= 2) return false;
        if (this.state !== ROOM_STATES.WAITING) return false;

        // Spawn positions
        const spawnX = this.players.size === 0 ? 200 : 700;
        const fighter = new ServerFighter(playerId, spawnX);

        this.players.set(playerId, {
            odId: playerId,
            mongoUserId, // For database updates
            socket,
            username,
            fighter,
            ready: false,
            connected: true
        });

        return true;
    }

    removePlayer(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            player.connected = false;

            // If game in progress, other player wins
            if (this.state === ROOM_STATES.IN_PROGRESS) {
                const otherPlayer = this.getOtherPlayer(playerId);
                if (otherPlayer) {
                    this.endGame(otherPlayer.odId, 'disconnect');
                }
            }
        }

        // If waiting, remove completely
        if (this.state === ROOM_STATES.WAITING) {
            this.players.delete(playerId);
        }
    }

    setReady(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            player.ready = true;
            this.checkStart();
        }
    }

    checkStart() {
        if (this.players.size !== 2) return;

        const allReady = Array.from(this.players.values()).every(p => p.ready);
        if (allReady) {
            this.startGame();
        }
    }

    startGame() {
        this.state = ROOM_STATES.IN_PROGRESS;
        this.tick = 0;
        this.timer = MATCH_DURATION;
        this.arenaReadyCount = 0;
        this.timerStarted = false;

        // Notify players to load their arenas
        this.broadcast({
            type: MSG.GAME_START,
            players: this.getPlayerStates()
        });

        // Start game loop (physics/movement works immediately)
        this.gameLoop = setInterval(() => this.update(), TICK_INTERVAL);

        // Timeout: if both clients don't confirm within 10 seconds, start timer anyway
        this.arenaTimeout = setTimeout(() => {
            if (!this.timerStarted) {
                console.log(`Room ${this.roomCode}: Arena timeout - starting timer`);
                this.startTimer();
            }
        }, 10000);
    }

    // Called when a client confirms their arena has loaded
    arenaReady(playerId) {
        if (this.timerStarted) return;

        const player = this.players.get(playerId);
        if (player && !player.arenaReady) {
            player.arenaReady = true;
            this.arenaReadyCount++;
            console.log(`Room ${this.roomCode}: Player ${playerId} arena ready (${this.arenaReadyCount}/2)`);

            // Both players' arenas are loaded - start the timer!
            if (this.arenaReadyCount >= 2) {
                this.startTimer();
            }
        }
    }

    startTimer() {
        if (this.timerStarted) return;
        this.timerStarted = true;

        // Clear the timeout since both are ready
        if (this.arenaTimeout) {
            clearTimeout(this.arenaTimeout);
            this.arenaTimeout = null;
        }

        console.log(`Room ${this.roomCode}: Both arenas ready - timer started!`);

        // Tell both clients to start their timers
        this.broadcast({ type: MSG.TIMER_START, timer: this.timer });

        // Start countdown
        this.timerInterval = setInterval(() => {
            this.timer--;
            if (this.timer <= 0) {
                this.endGameByTimer();
            }
        }, 1000);
    }

    update() {
        if (this.state !== ROOM_STATES.IN_PROGRESS) return;

        this.tick++;
        this.events = [];

        // Process inputs for all players
        for (const player of this.players.values()) {
            player.fighter.processInputs();
        }

        // Update physics
        for (const player of this.players.values()) {
            player.fighter.update(TICK_INTERVAL);
        }

        // Check attack collisions
        const fighters = new Map();
        for (const [id, player] of this.players) {
            fighters.set(id, player.fighter);
        }
        const hits = processAttacks(fighters);
        this.events.push(...hits.map(h => ({ type: 'HIT', ...h })));

        // Check win condition
        this.checkWinCondition();

        // Broadcast state periodically
        if (this.tick % STATE_BROADCAST_RATE === 0) {
            this.broadcastState();
        }
    }

    checkWinCondition() {
        const playerArray = Array.from(this.players.values());

        for (const player of playerArray) {
            if (player.fighter.dead) {
                const winner = this.getOtherPlayer(player.odId);
                if (winner) {
                    this.endGame(winner.odId, 'ko');
                }
                return;
            }
        }
    }

    endGameByTimer() {
        const playerArray = Array.from(this.players.values());

        if (playerArray.length !== 2) {
            this.endGame(null, 'incomplete');
            return;
        }

        const [p1, p2] = playerArray;

        if (p1.fighter.health > p2.fighter.health) {
            this.endGame(p1.odId, 'timeout');
        } else if (p2.fighter.health > p1.fighter.health) {
            this.endGame(p2.odId, 'timeout');
        } else {
            this.endGame(null, 'tie');
        }
    }

    async endGame(winnerId, reason) {
        if (this.state === ROOM_STATES.FINISHED) return;

        this.state = ROOM_STATES.FINISHED;
        this.winner = winnerId;

        // Stop loops
        if (this.gameLoop) clearInterval(this.gameLoop);
        if (this.timerInterval) clearInterval(this.timerInterval);

        // Get final scores
        const playerArray = Array.from(this.players.values());
        const finalScores = {};
        playerArray.forEach((p, i) => {
            finalScores[`player${i + 1}Health`] = p.fighter.health;
        });

        // Update ELO and stats in database
        let eloChanges = {};
        try {
            eloChanges = await this.updatePlayerStats(winnerId, reason);
        } catch (err) {
            console.error('Failed to update stats:', err);
        }

        // Broadcast game over
        this.broadcast({
            type: MSG.GAME_OVER,
            winner: winnerId,
            reason,
            finalScores,
            eloChanges,
            players: this.getPlayerStates()
        });
    }

    async updatePlayerStats(winnerId, reason) {
        const playerArray = Array.from(this.players.values());
        if (playerArray.length !== 2) return {};

        const [p1, p2] = playerArray;
        const eloChanges = {};

        try {
            // Find users in database
            const user1 = p1.mongoUserId ? await User.findById(p1.mongoUserId) : null;
            const user2 = p2.mongoUserId ? await User.findById(p2.mongoUserId) : null;

            if (!user1 && !user2) {
                console.log('No database users to update');
                return {};
            }

            const elo1 = user1?.elo || 1000;
            const elo2 = user2?.elo || 1000;

            if (reason === 'tie') {
                // Draw
                const { winnerChange, loserChange } = calculateEloChange(elo1, elo2, true);
                if (user1) {
                    user1.updateElo(elo1 + winnerChange, 'draw');
                    user1.addXP(XP_REWARDS.DRAW);
                    await user1.save();
                    eloChanges[p1.odId] = winnerChange;
                }
                if (user2) {
                    user2.updateElo(elo2 + loserChange, 'draw');
                    user2.addXP(XP_REWARDS.DRAW);
                    await user2.save();
                    eloChanges[p2.odId] = loserChange;
                }
            } else if (winnerId) {
                // We have a winner
                const winner = winnerId === p1.odId ? p1 : p2;
                const loser = winnerId === p1.odId ? p2 : p1;
                const winnerUser = winnerId === p1.odId ? user1 : user2;
                const loserUser = winnerId === p1.odId ? user2 : user1;
                const winnerElo = winnerId === p1.odId ? elo1 : elo2;
                const loserElo = winnerId === p1.odId ? elo2 : elo1;

                const { winnerNew, loserNew, winnerChange, loserChange } =
                    calculateEloChange(winnerElo, loserElo);

                if (winnerUser) {
                    winnerUser.updateElo(winnerNew, 'win');
                    winnerUser.addXP(XP_REWARDS.WIN);
                    winnerUser.stats.kills += 1;

                    // Add to match history
                    winnerUser.matchHistory.unshift({
                        opponent: loser.username,
                        result: 'win',
                        eloChange: winnerChange,
                        date: new Date()
                    });
                    // Keep only last 50 matches
                    if (winnerUser.matchHistory.length > 50) {
                        winnerUser.matchHistory = winnerUser.matchHistory.slice(0, 50);
                    }

                    await winnerUser.save();
                    eloChanges[winner.odId] = winnerChange;
                }

                if (loserUser) {
                    loserUser.updateElo(loserNew, 'loss');
                    loserUser.addXP(XP_REWARDS.LOSS);
                    loserUser.stats.deaths += 1;

                    // Add to match history
                    loserUser.matchHistory.unshift({
                        opponent: winner.username,
                        result: 'loss',
                        eloChange: loserChange,
                        date: new Date()
                    });
                    // Keep only last 50 matches
                    if (loserUser.matchHistory.length > 50) {
                        loserUser.matchHistory = loserUser.matchHistory.slice(0, 50);
                    }

                    await loserUser.save();
                    eloChanges[loser.odId] = loserChange;
                }

                console.log(`Match ended: ${winner.username} beat ${loser.username}`);
                console.log(`ELO: ${winner.username} +${winnerChange}, ${loser.username} ${loserChange}`);
            }

            return eloChanges;
        } catch (err) {
            console.error('Error updating player stats:', err);
            return {};
        }
    }

    handleInput(playerId, input) {
        const player = this.players.get(playerId);
        if (!player || this.state !== ROOM_STATES.IN_PROGRESS) return;

        player.fighter.queueInput(input);
    }

    broadcastState() {
        const state = {
            type: MSG.STATE_UPDATE,
            tick: this.tick,
            timer: this.timer,
            players: this.getPlayerStates(),
            events: this.events
        };

        this.broadcast(state);
    }

    broadcast(message) {
        const data = JSON.stringify(message);
        for (const player of this.players.values()) {
            if (player.connected && player.socket.readyState === 1) {
                player.socket.send(data);
            }
        }
    }

    getPlayerStates() {
        const states = [];
        let playerIndex = 1;
        for (const player of this.players.values()) {
            states.push({
                id: player.odId,  // Use 'id' to match client expectations
                username: player.username || `Player ${playerIndex}`,
                ...player.fighter.getState()
            });
            playerIndex++;
        }
        return states;
    }

    getOtherPlayer(playerId) {
        for (const player of this.players.values()) {
            if (player.odId !== playerId) return player;
        }
        return null;
    }

    isEmpty() {
        return this.players.size === 0 ||
            Array.from(this.players.values()).every(p => !p.connected);
    }

    getInfo() {
        let playerIndex = 1;
        return {
            roomCode: this.roomCode,
            state: this.state,
            playerCount: this.players.size,
            players: Array.from(this.players.values()).map(p => {
                const info = {
                    id: p.odId,
                    username: p.username || `Player ${playerIndex}`,
                    ready: p.ready
                };
                playerIndex++;
                return info;
            })
        };
    }
}
