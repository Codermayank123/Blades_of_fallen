// Game constants - shared between server and client
export const CANVAS_WIDTH = 1024;
export const CANVAS_HEIGHT = 576;
export const GROUND_Y = 330;
export const GRAVITY = 0.7;

export const PLAYER_SPEED = 10; // Faster movement (was 6)
export const JUMP_VELOCITY = -18;
export const PLAYER_WIDTH = 50;
export const PLAYER_HEIGHT = 150;

export const ATTACK_DAMAGE = 15;
export const ATTACK_COOLDOWN = 400; // Much faster attacks (was 1000ms)
export const ATTACK_RANGE = 150;
export const ATTACK_HEIGHT = 50;

export const TICK_RATE = 60;
export const TICK_INTERVAL = 1000 / TICK_RATE;
export const STATE_BROADCAST_RATE = 1; // Send state every tick for smooth gameplay

export const MATCH_DURATION = 60; // seconds
export const RECONNECT_TIMEOUT = 15000; // ms

export const MAX_INPUTS_PER_SECOND = 60;
export const MAX_HEALTH = 100;

// Room states
export const ROOM_STATES = {
    WAITING: 'WAITING',
    STARTING: 'STARTING',
    IN_PROGRESS: 'IN_PROGRESS',
    FINISHED: 'FINISHED'
};

// Message types
export const MSG = {
    // Client -> Server
    JOIN_ROOM: 'JOIN_ROOM',
    CREATE_ROOM: 'CREATE_ROOM',
    LEAVE_ROOM: 'LEAVE_ROOM',
    INPUT: 'INPUT',
    READY: 'READY',

    // Server -> Client
    ROOM_JOINED: 'ROOM_JOINED',
    ROOM_CREATED: 'ROOM_CREATED',
    PLAYER_JOINED: 'PLAYER_JOINED',
    PLAYER_LEFT: 'PLAYER_LEFT',
    GAME_START: 'GAME_START',
    STATE_UPDATE: 'STATE_UPDATE',
    GAME_OVER: 'GAME_OVER',
    ERROR: 'ERROR'
};
