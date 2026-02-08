import { PLAYER_WIDTH, PLAYER_HEIGHT, ATTACK_DAMAGE } from '../utils/constants.js';

// Check if attack box hits target player
export function checkAttackCollision(attacker, target) {
    // Use the new canHit() method for proper timing
    if (!attacker.canHit()) return false;
    if (target.dead) return false;

    const attackBox = attacker.getAttackBox();

    // Target hitbox
    const targetBox = {
        x: target.x,
        y: target.y,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT
    };

    return rectanglesOverlap(attackBox, targetBox);
}

// AABB collision detection
function rectanglesOverlap(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

// Process all attack collisions in a room
export function processAttacks(players) {
    const hits = [];
    const playerArray = Array.from(players.values());

    for (let i = 0; i < playerArray.length; i++) {
        for (let j = 0; j < playerArray.length; j++) {
            if (i === j) continue;

            const attacker = playerArray[i];
            const target = playerArray[j];

            if (checkAttackCollision(attacker, target)) {
                target.takeDamage(ATTACK_DAMAGE);
                attacker.markHit(); // Prevent multiple hits from same attack
                hits.push({
                    attacker: attacker.id,
                    target: target.id,
                    damage: ATTACK_DAMAGE,
                    targetHealth: target.health
                });
            }
        }
    }

    return hits;
}
