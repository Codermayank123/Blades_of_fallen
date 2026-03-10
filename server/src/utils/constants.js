// Game constants - shared between server and client
export const CANVAS_WIDTH = 1024;
export const CANVAS_HEIGHT = 576;
export const GROUND_Y = 330;
export const GRAVITY = 0.7;

export const PLAYER_SPEED = 10;
export const JUMP_VELOCITY = -18;
export const PLAYER_WIDTH = 50;
export const PLAYER_HEIGHT = 150;

export const ATTACK_DAMAGE = 15;
export const ATTACK_COOLDOWN = 400;
export const ATTACK_RANGE = 150;
export const ATTACK_HEIGHT = 50;

export const TICK_RATE = 60;
export const TICK_INTERVAL = 1000 / TICK_RATE;
export const STATE_BROADCAST_RATE = 1;

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
    ARENA_READY: 'ARENA_READY',
    GAME_SELECT: 'GAME_SELECT',
    GAME_ACTION: 'GAME_ACTION',

    // Server -> Client (shared)
    ROOM_JOINED: 'ROOM_JOINED',
    ROOM_CREATED: 'ROOM_CREATED',
    PLAYER_JOINED: 'PLAYER_JOINED',
    PLAYER_LEFT: 'PLAYER_LEFT',
    GAME_START: 'GAME_START',
    TIMER_START: 'TIMER_START',
    STATE_UPDATE: 'STATE_UPDATE',
    GAME_OVER: 'GAME_OVER',
    ERROR: 'ERROR',
    ROUND_START: 'ROUND_START',
    ROUND_END: 'ROUND_END',
    GAME_STATE: 'GAME_STATE',
    TURN: 'TURN',

    // Bomb Relay Royale
    BOMB_TICK: 'BOMB_TICK',
    BOMB_PASS: 'BOMB_PASS',
    BOMB_EXPLODE: 'BOMB_EXPLODE',
    BOMB_ROUND: 'BOMB_ROUND',

    // Territory / Gem Heist Arena
    TERRITORY_TICK: 'TERRITORY_TICK',
    TERRITORY_CAPTURE: 'TERRITORY_CAPTURE',
    TERRITORY_ABILITY: 'TERRITORY_ABILITY',
    HEIST_TICK: 'HEIST_TICK',
    HEIST_GEM_COLLECT: 'HEIST_GEM_COLLECT',
    HEIST_GEM_DEPOSIT: 'HEIST_GEM_DEPOSIT',
    HEIST_GEM_STEAL: 'HEIST_GEM_STEAL',
    HEIST_GOLD_SPAWN: 'HEIST_GOLD_SPAWN',

    // Neon Drift Arena
    DRIFT_TICK: 'DRIFT_TICK',
    DRIFT_BOOST: 'DRIFT_BOOST',
    DRIFT_CHECKPOINT: 'DRIFT_CHECKPOINT',
    DRIFT_COLLISION: 'DRIFT_COLLISION',
    DRIFT_LAP: 'DRIFT_LAP',
    DRIFT_FINISH: 'DRIFT_FINISH',

    // Cricket Clash Pro
    CRICKET_BALL: 'CRICKET_BALL',
    CRICKET_SHOT: 'CRICKET_SHOT',
    CRICKET_RESULT: 'CRICKET_RESULT',
    CRICKET_CHANGE: 'CRICKET_CHANGE',
    CRICKET_OVER: 'CRICKET_OVER',
    CRICKET_BOWL_CHOICE: 'CRICKET_BOWL_CHOICE',
    CRICKET_PHASE: 'CRICKET_PHASE',
    CRICKET_INNINGS_CHANGE: 'CRICKET_INNINGS_CHANGE',

    // Room fill / countdown
    COUNTDOWN: 'COUNTDOWN',
};

// Game types
export const GAME_TYPES = {
    DUEL: 'duel',
    BOMB_RELAY: 'bomb_relay',
    TERRITORY: 'territory',
    NEON_DRIFT: 'neon_drift',
    CRICKET_PRO: 'cricket_pro'
};

// Player limits per game
export const GAME_PLAYER_LIMITS = {
    duel: { min: 2, max: 2 },
    bomb_relay: { min: 2, max: 10 },
    territory: { min: 2, max: 8 },
    neon_drift: { min: 2, max: 12 },
    cricket_pro: { min: 2, max: 2 }
};
