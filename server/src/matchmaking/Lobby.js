import { GameRoom } from '../game/GameRoom.js';
import { BombRelayRoom } from '../game/BombRelayRoom.js';
import { GemHeistRoom } from '../game/GemHeistRoom.js';
import { NeonDriftRoom } from '../game/NeonDriftRoom.js';
import { CricketProRoom } from '../game/CricketProRoom.js';
import { generateRoomCode } from '../utils/validation.js';
import { ROOM_STATES, GAME_PLAYER_LIMITS } from '../utils/constants.js';

class Lobby {
    constructor() {
        this.rooms = new Map(); // roomCode -> GameRoom
        this.playerRooms = new Map(); // playerId -> roomCode
    }

    createRoom(playerId, gameType = 'duel') {
        let roomCode;
        do {
            roomCode = generateRoomCode();
        } while (this.rooms.has(roomCode));

        let room;
        switch (gameType) {
            case 'bomb_relay':
                room = new BombRelayRoom(roomCode, playerId);
                break;
            case 'territory':
                room = new GemHeistRoom(roomCode, playerId);
                break;
            case 'neon_drift':
                room = new NeonDriftRoom(roomCode, playerId);
                break;
            case 'cricket_pro':
                room = new CricketProRoom(roomCode, playerId);
                break;
            case 'duel':
            default:
                room = new GameRoom(roomCode, playerId);
                break;
        }

        this.rooms.set(roomCode, room);
        this.playerRooms.set(playerId, roomCode);

        return room;
    }

    getRoom(roomCode) {
        return this.rooms.get(roomCode);
    }

    joinRoom(roomCode, playerId, socket, username, mongoUserId = null) {
        const room = this.rooms.get(roomCode);
        if (!room) return { success: false, error: 'Room not found' };

        if (room.state !== ROOM_STATES.WAITING) {
            return { success: false, error: 'Game already in progress' };
        }

        const maxPlayers = room.maxPlayers || (GAME_PLAYER_LIMITS[room.gameType]?.max || 2);
        if (room.players.size >= maxPlayers) {
            return { success: false, error: 'Room is full' };
        }

        const added = room.addPlayer(playerId, socket, username, mongoUserId);
        if (added) {
            this.playerRooms.set(playerId, roomCode);
            return { success: true, room };
        }

        return { success: false, error: 'Could not join room' };
    }

    leaveRoom(playerId) {
        const roomCode = this.playerRooms.get(playerId);
        if (!roomCode) return;

        const room = this.rooms.get(roomCode);
        if (room) {
            room.removePlayer(playerId);

            if (room.isEmpty()) {
                if (room.cleanup) room.cleanup();
                this.rooms.delete(roomCode);
            }
        }

        this.playerRooms.delete(playerId);
    }

    getPlayerRoom(playerId) {
        const roomCode = this.playerRooms.get(playerId);
        if (!roomCode) return null;
        return this.rooms.get(roomCode);
    }

    getAvailableRooms() {
        const available = [];
        for (const room of this.rooms.values()) {
            const maxPlayers = room.maxPlayers || (GAME_PLAYER_LIMITS[room.gameType]?.max || 2);
            if (room.state === ROOM_STATES.WAITING && room.players.size < maxPlayers) {
                available.push(room.getInfo());
            }
        }
        return available;
    }

    findAvailableRoom(gameType = 'duel') {
        for (const room of this.rooms.values()) {
            const maxPlayers = room.maxPlayers || (GAME_PLAYER_LIMITS[room.gameType]?.max || 2);
            if (room.state === ROOM_STATES.WAITING &&
                room.players.size > 0 &&
                room.players.size < maxPlayers &&
                (room.gameType || 'duel') === gameType) {
                return room;
            }
        }
        return null;
    }
}

// Singleton instance
export const lobby = new Lobby();
