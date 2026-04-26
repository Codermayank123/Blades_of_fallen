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

export const MATCH_DURATION = 60;
export const RECONNECT_TIMEOUT = 15000;
export const MAX_INPUTS_PER_SECOND = 60;
export const MAX_HEALTH = 100;

export const ROOM_STATES = {
    WAITING: 'WAITING',
    STARTING: 'STARTING',
    IN_PROGRESS: 'IN_PROGRESS',
    FINISHED: 'FINISHED'
};

export const MSG = {
    JOIN_ROOM: 'JOIN_ROOM',
    CREATE_ROOM: 'CREATE_ROOM',
    LEAVE_ROOM: 'LEAVE_ROOM',
    INPUT: 'INPUT',
    READY: 'READY',
    ARENA_READY: 'ARENA_READY',
    GAME_SELECT: 'GAME_SELECT',
    GAME_ACTION: 'GAME_ACTION',
    CHAT_MESSAGE: 'CHAT_MESSAGE',
    VOICE_JOIN: 'VOICE_JOIN',
    VOICE_LEAVE: 'VOICE_LEAVE',
    VOICE_OFFER: 'VOICE_OFFER',
    VOICE_ANSWER: 'VOICE_ANSWER',
    VOICE_ICE: 'VOICE_ICE',
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
    QUESTION: 'QUESTION',
    ANSWER_RESULT: 'ANSWER_RESULT',
    COUNTDOWN: 'COUNTDOWN',
};

// Game types
export const GAME_TYPES = {
    DUEL:         'duel',
    PIXEL_CODE:   'pixel_code',
    STACK_SMASH:  'stack_smash',
    EMOJI_ESCAPE: 'emoji_escape',
    MEME_WARS:    'meme_wars',
    // Legacy
    BUG_BOUNTY:   'bug_bounty',
    ALGO_ARENA:   'algo_arena',
    CIPHER_CLASH: 'cipher_clash',
    QUERY_QUEST:  'query_quest',
};

// Player limits per game
export const GAME_PLAYER_LIMITS = {
    duel:         { min: 2, max: 2 },
    pixel_code:   { min: 2, max: 8 },
    stack_smash:  { min: 2, max: 8 },
    emoji_escape: { min: 2, max: 8 },
    meme_wars:    { min: 2, max: 8 },
    // Legacy
    bug_bounty:   { min: 2, max: 8 },
    algo_arena:   { min: 2, max: 8 },
    cipher_clash: { min: 2, max: 8 },
    query_quest:  { min: 2, max: 8 },
};
