import { GameRoom } from '../game/GameRoom.js';
import { generateRoomCode } from '../utils/validation.js';
import { ROOM_STATES } from '../utils/constants.js';

class Lobby {
    constructor() {
        this.rooms = new Map(); // roomCode -> GameRoom
        this.playerRooms = new Map(); // playerId -> roomCode
    }

    createRoom(playerId) {
        // Generate unique room code
        let roomCode;
        do {
            roomCode = generateRoomCode();
        } while (this.rooms.has(roomCode));

        const room = new GameRoom(roomCode, playerId);
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

        if (room.players.size >= 2) {
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

            // Cleanup empty rooms
            if (room.isEmpty()) {
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
            if (room.state === ROOM_STATES.WAITING && room.players.size < 2) {
                available.push(room.getInfo());
            }
        }
        return available;
    }

    // Find a room with one player waiting
    findAvailableRoom() {
        for (const room of this.rooms.values()) {
            if (room.state === ROOM_STATES.WAITING && room.players.size === 1) {
                return room;
            }
        }
        return null;
    }
}

// Singleton instance
export const lobby = new Lobby();
