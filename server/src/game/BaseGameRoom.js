import { Match } from '../db/Match.js';
import { User } from '../db/User.js';
import { calculateEloChange, XP_REWARDS } from '../utils/elo.js';
import { ROOM_STATES, MSG, GAME_PLAYER_LIMITS } from '../utils/constants.js';

/**
 * BaseGameRoom — shared logic for all game types.
 * Subclasses override: onStart(), handleGameAction(), getGameState(), getGameStartData()
 */
export class BaseGameRoom {
    constructor(roomCode, creatorId, gameType, maxPlayers = 2) {
        this.roomCode = roomCode;
        this.creatorId = creatorId;
        this.gameType = gameType;
        this.maxPlayers = maxPlayers;
        this.players = new Map(); // playerId -> { socket, username, mongoUserId, ready, connected, score }
        this.state = ROOM_STATES.WAITING;
        this.winner = null;
        this.eventsLog = [];
        this.startedAt = null;
        this.endedAt = null;
        this.arenaReadyPlayers = new Set(); // Players who dismissed instruction screen
        this.fillTimer = null;               // Countdown timer before game starts
        this.fillCountdown = 0;              // Seconds remaining in countdown
        this.gameStarted = false;            // Whether onStart() has been called
    }

    addPlayer(playerId, socket, username, mongoUserId = null) {
        if (this.players.size >= this.maxPlayers) return false;
        if (this.state !== ROOM_STATES.WAITING) return false;

        this.players.set(playerId, {
            id: playerId,
            mongoUserId,
            socket,
            username,
            ready: false,
            connected: true,
            score: 0
        });

        return true;
    }

    removePlayer(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            player.connected = false;

            if (this.state === ROOM_STATES.IN_PROGRESS) {
                const connectedPlayers = Array.from(this.players.values()).filter(p => p.connected);
                if (connectedPlayers.length <= 1 && connectedPlayers.length > 0) {
                    this.endGame(connectedPlayers[0].id, 'disconnect');
                } else if (connectedPlayers.length === 0) {
                    this.endGame(null, 'abandoned');
                }
            }
        }

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
        const limits = GAME_PLAYER_LIMITS[this.gameType] || { min: 2, max: 2 };
        const readyCount = Array.from(this.players.values()).filter(p => p.ready).length;
        const allReady = Array.from(this.players.values()).every(p => p.ready);

        // Not enough players or not all ready
        if (readyCount < limits.min || !allReady) {
            this.clearFillTimer();
            return;
        }

        // Room is full or only 2-player game — start immediately
        if (this.players.size >= limits.max || limits.max <= 2) {
            this.clearFillTimer();
            this.startGame();
            return;
        }

        // Enough players but room not full — start countdown
        // Reset countdown each time a new player joins
        this.clearFillTimer();
        this.fillCountdown = 10;

        this.broadcast({
            type: MSG.COUNTDOWN,
            seconds: this.fillCountdown,
            playerCount: this.players.size,
            maxPlayers: limits.max,
            message: `Game starting in ${this.fillCountdown}s — waiting for more players...`,
        });

        this.fillTimer = setInterval(() => {
            this.fillCountdown--;

            this.broadcast({
                type: MSG.COUNTDOWN,
                seconds: this.fillCountdown,
                playerCount: this.players.size,
                maxPlayers: limits.max,
                message: this.fillCountdown > 0
                    ? `Game starting in ${this.fillCountdown}s...`
                    : 'Starting!',
            });

            if (this.fillCountdown <= 0) {
                this.clearFillTimer();
                this.startGame();
            }
        }, 1000);
    }

    clearFillTimer() {
        if (this.fillTimer) {
            clearInterval(this.fillTimer);
            this.fillTimer = null;
        }
        this.fillCountdown = 0;
    }

    startGame() {
        this.state = ROOM_STATES.IN_PROGRESS;
        this.startedAt = new Date();

        const startData = {
            type: MSG.GAME_START,
            gameType: this.gameType,
            players: this.getPlayerList(),
            ...this.getGameStartData()
        };

        this.broadcast(startData);
        // Don't call onStart() yet — wait for all players to send ARENA_READY
        // so instruction screens can be shown first
    }

    handleArenaReady(playerId) {
        this.arenaReadyPlayers.add(playerId);
        if (this.arenaReadyPlayers.size >= this.players.size && !this.gameStarted) {
            this.gameStarted = true;
            this.onStart();
        }
    }

    // Override in subclass — return extra fields for GAME_START message
    getGameStartData() { return {}; }

    // Override in subclass
    onStart() { }

    // Override in subclass — handles GAME_ACTION messages
    handleGameAction(playerId, action) { }

    // Override in subclass — returns game-specific state
    getGameState() { return {}; }

    async endGame(winnerId, reason) {
        if (this.state === ROOM_STATES.FINISHED) return;

        this.state = ROOM_STATES.FINISHED;
        this.winner = winnerId;
        this.endedAt = new Date();

        this.cleanup();

        const scores = {};
        for (const [id, p] of this.players) {
            scores[id] = p.score;
        }

        let eloChanges = {};
        try {
            await this.saveMatch(winnerId, reason);
            eloChanges = await this.updatePlayerStats(winnerId, reason);
        } catch (err) {
            console.error('Failed to save match / update stats:', err);
        }

        const winnerPlayer = winnerId ? this.players.get(winnerId) : null;

        this.broadcast({
            type: MSG.GAME_OVER,
            gameType: this.gameType,
            winner: winnerId,
            winnerUsername: winnerPlayer?.username || null,
            reason,
            scores,
            eloChanges,
            players: this.getPlayerList()
        });
    }

    async saveMatch(winnerId, reason) {
        try {
            const playerArray = Array.from(this.players.values());
            const winnerPlayer = winnerId ? this.players.get(winnerId) : null;
            console.log(`[saveMatch] ${this.gameType} room=${this.roomCode} players=${playerArray.length} winner=${winnerPlayer?.username || 'none'} reason=${reason}`);

            const match = new Match({
                roomCode: this.roomCode,
                gameType: this.gameType,
                players: playerArray.map(p => {
                    const playerEntry = {
                        username: p.username,
                        avatar: '',
                        score: p.score || 0
                    };
                    if (p.mongoUserId) playerEntry.userId = p.mongoUserId;
                    return playerEntry;
                }).filter(p => p.username), // Only save players with usernames
                winnerName: winnerPlayer?.username || '',
                duration: this.startedAt ? Math.round((this.endedAt - this.startedAt) / 1000) : 0,
                eventsLog: this.eventsLog.slice(-50),
                meta: this.getMatchMeta ? this.getMatchMeta() : {},
                startedAt: this.startedAt,
                endedAt: this.endedAt
            });

            // Set winner subdocument only if we have data
            if (winnerPlayer) {
                match.winner = { username: winnerPlayer.username };
                if (winnerPlayer.mongoUserId) match.winner.userId = winnerPlayer.mongoUserId;
            }

            await match.save();
            console.log(`[saveMatch] Saved match ${match._id} for ${this.gameType}`);
        } catch (err) {
            console.error('Error saving match:', err);
        }
    }

    /**
     * Update player stats (ELO, wins/losses, XP, matchHistory) in the database.
     */
    async updatePlayerStats(winnerId, reason) {
        const playerArray = Array.from(this.players.values());
        if (playerArray.length < 2) return {};

        const eloChanges = {};

        try {
            const userMap = new Map(); // playerId -> User doc
            for (const p of playerArray) {
                if (p.mongoUserId) {
                    try {
                        const user = await User.findById(p.mongoUserId);
                        if (user) userMap.set(p.id, user);
                    } catch (e) {
                        console.error(`Failed to load user ${p.mongoUserId}:`, e.message);
                    }
                }
            }

            if (userMap.size === 0) {
                console.log('No database users to update');
                return {};
            }

            const winnerUser = winnerId ? userMap.get(winnerId) : null;
            const winnerElo = winnerUser?.elo || 1000;

            const allElos = playerArray.map(p => userMap.get(p.id)?.elo || 1000);
            const avgOpponentElo = Math.round(
                allElos.reduce((sum, e) => sum + e, 0) / allElos.length
            );

            for (const p of playerArray) {
                const user = userMap.get(p.id);
                if (!user) continue;

                const playerElo = user.elo || 1000;
                const isWinner = p.id === winnerId;
                const isDraw = !winnerId;
                let result, eloChange;

                if (isDraw) {
                    result = 'draw';
                    const { winnerChange } = calculateEloChange(playerElo, avgOpponentElo, true);
                    eloChange = winnerChange;
                    user.updateElo(playerElo + eloChange, 'draw');
                    user.addXP(XP_REWARDS.DRAW);
                } else if (isWinner) {
                    result = 'win';
                    const { winnerChange } = calculateEloChange(playerElo, avgOpponentElo, false);
                    eloChange = winnerChange;
                    user.updateElo(playerElo + eloChange, 'win');
                    user.addXP(XP_REWARDS.WIN);
                } else {
                    result = 'loss';
                    const { loserChange } = calculateEloChange(winnerElo, playerElo, false);
                    eloChange = loserChange;
                    user.updateElo(playerElo + eloChange, 'loss');
                    user.addXP(XP_REWARDS.LOSS);
                }

                const opponentNames = playerArray
                    .filter(o => o.id !== p.id)
                    .map(o => o.username)
                    .join(', ');

                user.matchHistory.unshift({
                    opponent: opponentNames,
                    result,
                    eloChange,
                    gameType: this.gameType,
                    date: new Date()
                });

                if (user.matchHistory.length > 50) {
                    user.matchHistory = user.matchHistory.slice(0, 50);
                }

                await user.save();
                eloChanges[p.id] = eloChange;

                // ── Update per-game stats ──
                if (!user.gameStats) user.gameStats = new Map();
                let gs = user.gameStats.get(this.gameType);
                if (!gs) {
                    gs = { wins: 0, losses: 0, draws: 0, totalMatches: 0 };
                }
                gs.totalMatches++;
                if (result === 'win') gs.wins++;
                else if (result === 'loss') gs.losses++;
                else gs.draws++;
                user.gameStats.set(this.gameType, gs);
                await user.save();

                console.log(`[${this.gameType}] ${user.username}: ${result} (ELO ${eloChange >= 0 ? '+' : ''}${eloChange})`);
            }

            return eloChanges;
        } catch (err) {
            console.error('Error updating player stats:', err);
            return {};
        }
    }

    cleanup() {
        this.clearFillTimer();
        // Subclasses override to clear timers/intervals
    }

    broadcast(message) {
        const data = JSON.stringify(message);
        for (const player of this.players.values()) {
            if (player.connected && player.socket.readyState === 1) {
                player.socket.send(data);
            }
        }
    }

    sendTo(playerId, message) {
        const player = this.players.get(playerId);
        if (player && player.connected && player.socket.readyState === 1) {
            player.socket.send(JSON.stringify(message));
        }
    }

    getPlayerList() {
        const list = [];
        for (const [id, p] of this.players) {
            list.push({
                id,
                username: p.username,
                ready: p.ready,
                score: p.score,
                connected: p.connected
            });
        }
        return list;
    }

    isEmpty() {
        return this.players.size === 0 ||
            Array.from(this.players.values()).every(p => !p.connected);
    }

    getInfo() {
        return {
            roomCode: this.roomCode,
            state: this.state,
            gameType: this.gameType,
            maxPlayers: this.maxPlayers,
            playerCount: this.players.size,
            players: this.getPlayerList()
        };
    }
}
