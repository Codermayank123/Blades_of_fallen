import { v4 as uuidv4 } from 'uuid';
import { lobby } from './matchmaking/Lobby.js';
import { validateInputPacket, RateLimiter, sanitizeString } from './utils/validation.js';
import { MSG } from './utils/constants.js';

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
            handleCreateRoom(socket, playerId, player.username, player.mongoUserId);
            break;

        case MSG.JOIN_ROOM:
        case 'JOIN_ROOM':
            handleJoinRoom(socket, playerId, player.username, message.roomCode, player.mongoUserId);
            break;

        case 'QUICK_MATCH':
            handleQuickMatch(socket, playerId, player.username, player.mongoUserId);
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

        case 'GET_ROOMS':
            send(socket, { type: 'ROOM_LIST', rooms: lobby.getAvailableRooms() });
            break;

        default:
            console.warn(`Unknown message type: ${type}`);
    }
}

function handleCreateRoom(socket, playerId, username, mongoUserId) {
    const room = lobby.createRoom(playerId);
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

    if (room.players.size >= 2) {
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

function handleQuickMatch(socket, playerId, username, mongoUserId) {
    // Find available room or create new
    let room = lobby.findAvailableRoom();

    if (!room) {
        // Create new room
        room = lobby.createRoom(playerId);
        room.addPlayer(playerId, socket, username, mongoUserId);

        send(socket, {
            type: MSG.ROOM_CREATED,
            room: room.getInfo()
        });
    } else {
        // Join existing room
        if (room.addPlayer(playerId, socket, username, mongoUserId)) {
            lobby.playerRooms.set(playerId, room.roomCode);

            send(socket, {
                type: MSG.ROOM_JOINED,
                room: room.getInfo()
            });

            room.broadcast({
                type: 'PLAYER_JOINED',
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

    // Validate input
    const input = validateInputPacket(message);
    if (!input) return;

    room.handleInput(playerId, input);
}

function handleArenaReady(playerId) {
    const roomCode = lobby.playerRooms.get(playerId);
    if (!roomCode) return;

    const room = lobby.getRoom(roomCode);
    if (room) {
        room.arenaReady(playerId);
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
