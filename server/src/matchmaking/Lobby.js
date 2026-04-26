import { GameRoom } from '../game/GameRoom.js';
import { PixelCodeRoom } from '../game/PixelCodeRoom.js';
import { StackSmashRoom } from '../game/StackSmashRoom.js';
import { EmojiEscapeRoom } from '../game/EmojiEscapeRoom.js';
import { MemeWarsRoom } from '../game/MemeWarsRoom.js';
// Legacy rooms kept for any historical rooms still in memory
import { BugBountyRoom } from '../game/BugBountyRoom.js';
import { AlgorithmArenaRoom } from '../game/AlgorithmArenaRoom.js';
import { CipherClashRoom } from '../game/CipherClashRoom.js';
import { QueryQuestRoom } from '../game/QueryQuestRoom.js';
import { generateRoomCode } from '../utils/validation.js';
import { ROOM_STATES, GAME_PLAYER_LIMITS } from '../utils/constants.js';

class Lobby {
    constructor() {
        this.rooms = new Map();
        this.playerRooms = new Map();
    }

    createRoom(playerId, gameType = 'duel', options = {}) {
        let roomCode;
        do { roomCode = generateRoomCode(); } while (this.rooms.has(roomCode));

        let room;
        switch (gameType) {
            // ── NEW GAMES ──────────────────────────────────────────
            case 'pixel_code':
                room = new PixelCodeRoom(roomCode, playerId, options);
                break;
            case 'stack_smash':
                room = new StackSmashRoom(roomCode, playerId, options);
                break;
            case 'emoji_escape':
                room = new EmojiEscapeRoom(roomCode, playerId, options);
                break;
            case 'meme_wars':
                room = new MemeWarsRoom(roomCode, playerId, options);
                break;
            // ── LEGACY (kept for backwards compat) ─────────────────
            case 'bug_bounty':
                room = new BugBountyRoom(roomCode, playerId, options);
                break;
            case 'algo_arena':
                room = new AlgorithmArenaRoom(roomCode, playerId, options);
                break;
            case 'cipher_clash':
                room = new CipherClashRoom(roomCode, playerId, options);
                break;
            case 'query_quest':
                room = new QueryQuestRoom(roomCode, playerId, options);
                break;
            // ── DEFAULT ────────────────────────────────────────────
            case 'duel':
            default:
                room = new GameRoom(roomCode, playerId);
                break;
        }

        this.rooms.set(roomCode, room);
        this.playerRooms.set(playerId, roomCode);
        console.log(`[Lobby] Created room ${roomCode} gameType=${gameType}`);
        return room;
    }

    getRoom(roomCode) { return this.rooms.get(roomCode); }

    joinRoom(roomCode, playerId, socket, username, mongoUserId = null) {
        const room = this.rooms.get(roomCode);
        if (!room) return { success: false, error: 'Room not found' };
        if (room.state !== ROOM_STATES.WAITING) return { success: false, error: 'Game already in progress' };
        const maxPlayers = room.maxPlayers || (GAME_PLAYER_LIMITS[room.gameType]?.max || 2);
        if (room.players.size >= maxPlayers) return { success: false, error: 'Room is full' };
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
                console.log(`[Lobby] Room ${roomCode} deleted (empty)`);
            }
        }
        this.playerRooms.delete(playerId);
    }

    getPlayerRoom(playerId) {
        const roomCode = this.playerRooms.get(playerId);
        return roomCode ? this.rooms.get(roomCode) : null;
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
            if (
                room.state === ROOM_STATES.WAITING &&
                room.players.size > 0 &&
                room.players.size < maxPlayers &&
                room.gameType === gameType          // strict equality — no fallback to duel
            ) {
                return room;
            }
        }
        return null;
    }
}

export const lobby = new Lobby();
