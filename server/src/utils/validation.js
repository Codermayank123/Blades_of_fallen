import { MAX_INPUTS_PER_SECOND, PLAYER_SPEED, ATTACK_COOLDOWN } from './constants.js';

// Validate input packet structure
export function validateInputPacket(input) {
    if (!input || typeof input !== 'object') return null;

    const { inputs, seq, tick } = input;

    if (typeof seq !== 'number' || seq < 0) return null;
    if (typeof tick !== 'number' || tick < 0) return null;
    if (!inputs || typeof inputs !== 'object') return null;

    // Validate input flags are booleans
    const validKeys = ['left', 'right', 'jump', 'attack'];
    for (const key of validKeys) {
        if (inputs[key] !== undefined && typeof inputs[key] !== 'boolean') {
            return null;
        }
    }

    // Return the validated input object, not just true
    return input;
}

// Rate limiter for inputs
export class RateLimiter {
    constructor(maxPerSecond = MAX_INPUTS_PER_SECOND) {
        this.maxPerSecond = maxPerSecond;
        this.counts = new Map();
    }

    check(playerId) {
        const now = Date.now();
        const playerData = this.counts.get(playerId) || { count: 0, resetTime: now + 1000 };

        if (now > playerData.resetTime) {
            playerData.count = 0;
            playerData.resetTime = now + 1000;
        }

        playerData.count++;
        this.counts.set(playerId, playerData);

        return playerData.count <= this.maxPerSecond;
    }

    clear(playerId) {
        this.counts.delete(playerId);
    }
}

// Validate player movement
export function validateMovement(oldPos, newPos, dt) {
    const maxDistance = PLAYER_SPEED * dt * 1.5; // 1.5x tolerance for lag
    const distance = Math.sqrt(
        Math.pow(newPos.x - oldPos.x, 2) +
        Math.pow(newPos.y - oldPos.y, 2)
    );
    return distance <= maxDistance;
}

// Sanitize string input
export function sanitizeString(str, maxLength = 50) {
    if (typeof str !== 'string') return '';
    return str.slice(0, maxLength).replace(/[<>]/g, '');
}

// Generate room code
export function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}
