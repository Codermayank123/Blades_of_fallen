import {
    CANVAS_WIDTH,
    GROUND_Y,
    GRAVITY,
    PLAYER_SPEED,
    JUMP_VELOCITY,
    PLAYER_WIDTH,
    PLAYER_HEIGHT,
    ATTACK_DAMAGE,
    ATTACK_COOLDOWN,
    ATTACK_RANGE,
    ATTACK_HEIGHT,
    MAX_HEALTH
} from '../utils/constants.js';

export class ServerFighter {
    constructor(id, spawnX) {
        this.id = id;
        this.x = spawnX;
        this.y = 0;
        this.velX = 0;
        this.velY = 0;
        this.health = MAX_HEALTH;

        // Player 1 (left spawn) faces right, Player 2 (right spawn) faces left
        this.facingRight = spawnX < CANVAS_WIDTH / 2;

        this.isAttacking = false;
        this.attackCooldown = 0;
        this.attackFrame = 0;
        this.attackHit = false; // Track if this attack already hit

        this.animState = 'idle';
        this.dead = false;

        this.lastInputSeq = -1;
        this.inputQueue = [];
        this.onGround = false;
    }

    queueInput(input) {
        if (this.dead) return;
        if (input.seq <= this.lastInputSeq) return;
        this.inputQueue.push(input);
    }

    processInputs() {
        if (this.dead || this.inputQueue.length === 0) return;

        // Process the latest input
        const input = this.inputQueue[this.inputQueue.length - 1];
        this.inputQueue = [];

        if (!input.inputs) return;

        const { left, right, jump, attack } = input.inputs;

        // Movement
        this.velX = 0;
        if (left && !right) {
            this.velX = -PLAYER_SPEED;
            this.facingRight = false;
        } else if (right && !left) {
            this.velX = PLAYER_SPEED;
            this.facingRight = true;
        }

        // Jump (only if on ground)
        if (jump && this.onGround) {
            this.velY = JUMP_VELOCITY;
            this.onGround = false;
        }

        // Attack (with cooldown)
        if (attack && this.attackCooldown <= 0 && !this.isAttacking) {
            this.isAttacking = true;
            this.attackFrame = 0;
            this.attackHit = false;
            this.attackCooldown = ATTACK_COOLDOWN;
        }

        this.lastInputSeq = input.seq;
    }

    update(dt) {
        if (this.dead) return;

        // Apply velocity
        this.x += this.velX;
        this.y += this.velY;

        // Apply gravity
        if (this.y < GROUND_Y) {
            this.velY += GRAVITY;
            this.onGround = false;
        } else {
            this.y = GROUND_Y;
            this.velY = 0;
            this.onGround = true;
        }

        // Clamp to bounds
        if (this.x < 0) this.x = 0;
        if (this.x > CANVAS_WIDTH - PLAYER_WIDTH) this.x = CANVAS_WIDTH - PLAYER_WIDTH;

        // Update attack state - FASTER animation
        if (this.isAttacking) {
            this.attackFrame++;
            // Attack animation completes in 12 ticks (was 20) for faster combat
            if (this.attackFrame >= 12) {
                this.isAttacking = false;
                this.attackFrame = 0;
            }
        }

        // Reduce cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown -= dt;
        }

        // Update animation state
        this.updateAnimState();
    }

    updateAnimState() {
        if (this.dead) {
            this.animState = 'death';
        } else if (this.isAttacking) {
            this.animState = 'attack1';
        } else if (this.velY < 0) {
            this.animState = 'jump';
        } else if (this.velY > 0 && !this.onGround) {
            this.animState = 'fall';
        } else if (this.velX !== 0) {
            this.animState = 'run';
        } else {
            this.animState = 'idle';
        }
    }

    // Check if attack is in the "hit" window (frames 4-9 of 12 for faster combat)
    canHit() {
        return this.isAttacking && this.attackFrame >= 4 && this.attackFrame <= 9 && !this.attackHit;
    }

    markHit() {
        this.attackHit = true;
    }

    getAttackBox() {
        // Attack box extends in front of player
        if (this.facingRight) {
            return {
                x: this.x + PLAYER_WIDTH - 10,
                y: this.y,
                width: ATTACK_RANGE,
                height: ATTACK_HEIGHT + 50
            };
        } else {
            return {
                x: this.x - ATTACK_RANGE + 10,
                y: this.y,
                width: ATTACK_RANGE,
                height: ATTACK_HEIGHT + 50
            };
        }
    }

    takeDamage(amount) {
        if (this.dead) return;

        this.health -= amount;
        this.animState = 'takeHit';

        if (this.health <= 0) {
            this.health = 0;
            this.dead = true;
            this.animState = 'death';
        }
    }

    getState() {
        return {
            id: this.id,
            x: Math.round(this.x),
            y: Math.round(this.y),
            velX: this.velX,
            velY: Math.round(this.velY * 10) / 10,
            health: this.health,
            animState: this.animState,
            isAttacking: this.isAttacking,
            // 12 ticks / 2 = 6 frames (matches Attack1.png which has 6 frames)
            attackFrame: Math.floor(this.attackFrame / 2),
            facingRight: this.facingRight,
            dead: this.dead,
            lastInputSeq: this.lastInputSeq
        };
    }
}
