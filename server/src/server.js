import { v4 as uuidv4 } from 'uuid';
import { lobby } from './matchmaking/Lobby.js';
import { validateInputPacket, RateLimiter, sanitizeString } from './utils/validation.js';
import { MSG, GAME_PLAYER_LIMITS } from './utils/constants.js';

// Try to import auth, but don't fail if not available
let getUserFromToken = null;
try {
    const authModule = await import('./auth/google.js');
    getUserFromToken = authModule.getUserFromToken;
} catch (e) {
    console.log('Auth module not available, running without authentication');
}

const rateLimiter = new RateLimiter();

// Store player data by socket
const playerData = new Map();

export function handleConnection(socket, req) {
    // Generate temporary player ID
    const playerId = uuidv4();

    // Store player data
    playerData.set(socket, {
        playerId,
        username: 'Player_' + playerId.slice(0, 6),
        mongoUserId: null
    });

    console.log(`Player connected: ${playerId}`);

    socket.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            const player = playerData.get(socket);
            if (player) {
                handleMessage(socket, player, message);
            }
        } catch (error) {
            console.error('Invalid message:', error.message);
            sendError(socket, 'Invalid message format');
        }
    });

    socket.on('close', () => {
        const player = playerData.get(socket);
        if (player) {
            console.log(`Player disconnected: ${player.playerId}`);
            lobby.leaveRoom(player.playerId);
            rateLimiter.clear(player.playerId);
            playerData.delete(socket);
        }
    });

    socket.on('error', (error) => {
        const player = playerData.get(socket);
        console.error(`Socket error for ${player?.playerId}:`, error.message);
    });

    // Send welcome message
    send(socket, { type: 'CONNECTED', playerId });
}

function handleMessage(socket, player, message) {
    const { type } = message;
    const { playerId, username, mongoUserId } = player;

    switch (type) {
        case 'SET_USERNAME':
            player.username = sanitizeString(message.username, 20) || username;

            // Extract MongoDB user ID from JWT token if provided
            if (message.token && getUserFromToken) {
                try {
                    const tokenData = getUserFromToken(message.token);
                    if (tokenData && tokenData.userId) {
                        player.mongoUserId = tokenData.userId;
                        console.log(`Player ${player.username} authenticated with MongoDB ID: ${player.mongoUserId}`);
                    }
                } catch (e) {
                    console.log('Token verification failed');
                }
            }

            send(socket, { type: 'USERNAME_SET', username: player.username });
            break;

        case MSG.CREATE_ROOM:
        case 'CREATE_ROOM':
            handleCreateRoom(socket, playerId, player.username, player.mongoUserId, message.gameType, message.gameOptions);
            break;

        case MSG.JOIN_ROOM:
        case 'JOIN_ROOM':
            handleJoinRoom(socket, playerId, player.username, message.roomCode, player.mongoUserId);
            break;

        case 'QUICK_MATCH':
            handleQuickMatch(socket, playerId, player.username, player.mongoUserId, message.gameType, message.gameOptions);
            break;

        case MSG.READY:
        case 'READY':
            handleReady(playerId);
            break;

        case MSG.INPUT:
        case 'INPUT':
            handleInput(playerId, message);
            break;

        case MSG.LEAVE_ROOM:
        case 'LEAVE_ROOM':
            handleLeaveRoom(socket, playerId);
            break;

        case MSG.ARENA_READY:
        case 'ARENA_READY':
            handleArenaReady(playerId);
            break;

        case MSG.GAME_ACTION:
        case 'GAME_ACTION':
            handleGameAction(playerId, message);
            break;

        case 'GET_ROOMS':
            send(socket, { type: 'ROOM_LIST', rooms: lobby.getAvailableRooms() });
            break;

        case 'START_NOW':
            handleStartNow(playerId);
            break;

        case 'CHAT_MESSAGE':
            handleChatMessage(playerId, player.username, message);
            break;

        case 'VOICE_JOIN':
        case 'VOICE_LEAVE':
        case 'VOICE_OFFER':
        case 'VOICE_ANSWER':
        case 'VOICE_ICE':
            handleVoiceSignal(playerId, message);
            break;

        default:
            console.warn(`Unknown message type: ${type}`);
    }
}

function handleChatMessage(playerId, username, message) {
    const roomCode = lobby.playerRooms.get(playerId);
    if (!roomCode) return;
    const room = lobby.getRoom(roomCode);
    if (!room) return;

    const text = sanitizeString(message.text, 200);
    if (!text) return;

    room.broadcast({
        type: 'CHAT_MESSAGE',
        senderId: playerId,
        username,
        text,
        timestamp: Date.now(),
    });
}

function handleVoiceSignal(playerId, message) {
    const roomCode = lobby.playerRooms.get(playerId);
    if (!roomCode) return;
    const room = lobby.getRoom(roomCode);
    if (!room) return;

    // Relay voice signals to specific target or broadcast
    if (message.targetId) {
        const targetPlayer = room.players.get(message.targetId);
        if (targetPlayer?.socket) {
            send(targetPlayer.socket, { ...message, senderId: playerId });
        }
    } else {
        // Broadcast to all except sender
        for (const [id, p] of room.players) {
            if (id !== playerId && p.socket) {
                send(p.socket, { ...message, senderId: playerId });
            }
        }
    }
}

function handleCreateRoom(socket, playerId, username, mongoUserId, gameType = 'duel', gameOptions = {}) {
    const room = lobby.createRoom(playerId, gameType, gameOptions);
    room.addPlayer(playerId, socket, username, mongoUserId);

    send(socket, {
        type: MSG.ROOM_CREATED,
        room: room.getInfo()
    });
}

function handleJoinRoom(socket, playerId, username, roomCode, mongoUserId) {
    if (!roomCode) {
        sendError(socket, 'Room code required');
        return;
    }

    const room = lobby.getRoom(roomCode.toUpperCase());

    if (!room) {
        sendError(socket, 'Room not found');
        return;
    }

    const maxPlayers = room.maxPlayers || (GAME_PLAYER_LIMITS[room.gameType]?.max || 2);
    if (room.players.size >= maxPlayers) {
        sendError(socket, 'Room is full');
        return;
    }

    if (!room.addPlayer(playerId, socket, username, mongoUserId)) {
        sendError(socket, 'Cannot join room');
        return;
    }

    lobby.playerRooms.set(playerId, roomCode.toUpperCase());

    // Notify joiner
    send(socket, {
        type: MSG.ROOM_JOINED,
        room: room.getInfo()
    });

    // Notify all players in room
    room.broadcast({
        type: 'PLAYER_JOINED',
        room: room.getInfo()
    });
}

function handleQuickMatch(socket, playerId, username, mongoUserId, gameType = 'duel', gameOptions = {}) {
    // Find available room or create new
    let room = lobby.findAvailableRoom(gameType);

    if (!room) {
        // Create new room
        room = lobby.createRoom(playerId, gameType, gameOptions);
        room.addPlayer(playerId, socket, username, mongoUserId);

        // Send notification FIRST, then auto-ready
        send(socket, {
            type: MSG.ROOM_CREATED,
            room: room.getInfo()
        });

        // Auto-ready the creator in quick match (only 1 player, won't trigger start)
        room.setReady(playerId);
    } else {
        // Join existing room
        if (room.addPlayer(playerId, socket, username, mongoUserId)) {
            lobby.playerRooms.set(playerId, room.roomCode);

            // Send notifications FIRST so client has room info before countdown starts
            send(socket, {
                type: MSG.ROOM_JOINED,
                room: room.getInfo()
            });

            room.broadcast({
                type: 'PLAYER_JOINED',
                room: room.getInfo()
            });

            // Auto-ready AFTER notifications (this may trigger countdown)
            room.setReady(playerId);

            // Broadcast ready state so all players see the update
            room.broadcast({
                type: 'PLAYER_READY',
                room: room.getInfo()
            });
        } else {
            sendError(socket, 'Failed to join room');
        }
    }
}

function handleReady(playerId) {
    const roomCode = lobby.playerRooms.get(playerId);
    if (!roomCode) {
        console.log(`Player ${playerId} not in a room`);
        return;
    }

    const room = lobby.getRoom(roomCode);
    if (room) {
        room.setReady(playerId);
        console.log(`Player ${playerId} is ready in room ${roomCode}`);

        // Broadcast ready state to all players in room
        room.broadcast({
            type: 'PLAYER_READY',
            room: room.getInfo()
        });
    }
}

function handleInput(playerId, message) {
    // Rate limiting
    if (!rateLimiter.check(playerId)) {
        return; // Drop packet
    }

    const roomCode = lobby.playerRooms.get(playerId);
    if (!roomCode) return;

    const room = lobby.getRoom(roomCode);
    if (!room) return;

    // Validate input (duel game only)
    if (room.handleInput) {
        const input = validateInputPacket(message);
        if (!input) return;
        room.handleInput(playerId, input);
    }
}

function handleGameAction(playerId, message) {
    const roomCode = lobby.playerRooms.get(playerId);
    if (!roomCode) return;

    const room = lobby.getRoom(roomCode);
    if (!room) return;

    if (room.handleGameAction) {
        room.handleGameAction(playerId, message);
    }
}

function handleArenaReady(playerId) {
    const roomCode = lobby.playerRooms.get(playerId);
    if (!roomCode) return;

    const room = lobby.getRoom(roomCode);
    if (!room) return;

    // BaseGameRoom.handleArenaReady defers onStart() until all players ready
    if (room.handleArenaReady) {
        room.handleArenaReady(playerId);
    }
    // Legacy duel-specific arenaReady
    if (room.arenaReady) {
        room.arenaReady(playerId);
    }
}

function handleStartNow(playerId) {
    const roomCode = lobby.playerRooms.get(playerId);
    if (!roomCode) return;

    const room = lobby.getRoom(roomCode);
    if (!room) return;

    if (room.handleStartNow) {
        room.handleStartNow(playerId);
    }
}

function handleLeaveRoom(socket, playerId) {
    lobby.leaveRoom(playerId);
    send(socket, { type: 'ROOM_LEFT' });
}

function send(socket, message) {
    if (socket.readyState === 1) {
        socket.send(JSON.stringify(message));
    }
}

function sendError(socket, error) {
    send(socket, { type: 'ERROR', error });
}
