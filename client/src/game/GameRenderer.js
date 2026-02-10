// Sprite animation configuration
const SPRITES = {
    player1: {
        idle: { src: '/sprites/Idle.png', frames: 8 },
        run: { src: '/sprites/Run.png', frames: 8 },
        jump: { src: '/sprites/Jump.png', frames: 2 },
        fall: { src: '/sprites/Fall.png', frames: 2 },
        attack1: { src: '/sprites/Attack1.png', frames: 6 },
        takeHit: { src: '/sprites/Take Hit - white silhouette.png', frames: 4 },
        death: { src: '/sprites/Death.png', frames: 6 }
    },
    player2: {
        idle: { src: '/sprites2/Idle.png', frames: 8 },
        run: { src: '/sprites2/Run.png', frames: 8 },
        jump: { src: '/sprites2/Jump.png', frames: 2 },
        fall: { src: '/sprites2/Fall.png', frames: 2 },
        attack1: { src: '/sprites2/Attack1.png', frames: 8 },
        takeHit: { src: '/sprites2/Take hit.png', frames: 3 },
        death: { src: '/sprites2/death.png', frames: 7 }
    }
};

export class GameRenderer {
    constructor(ctx, width = 1024, height = 576) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        this.baseWidth = 1024;
        this.baseHeight = 576;
        this.images = {};
        this.background = null;
        this.shop = null;
        this.assetsLoaded = false;

        // Time-based animation (consistent across all devices)
        this.animTime = 0;           // Accumulated time in ms
        this.frameDuration = 120;    // ms per animation frame (consistent speed)
        this.lastTimestamp = 0;
    }

    setSize(width, height) {
        this.width = width;
        this.height = height;
        if (this.ctx.canvas) {
            this.ctx.canvas.width = width;
            this.ctx.canvas.height = height;
        }
    }

    getScale() {
        return Math.min(this.width / this.baseWidth, this.height / this.baseHeight);
    }

    async loadAssets() {
        try {
            // Load ALL assets in parallel for much faster loading
            const allPromises = [];

            // Background and shop
            const bgPromise = this.loadImage('/img/background.png');
            const shopPromise = this.loadImage('/img/shop.png');
            allPromises.push(bgPromise, shopPromise);

            // All sprite images in parallel
            const spritePromises = {};
            for (const [playerKey, sprites] of Object.entries(SPRITES)) {
                spritePromises[playerKey] = {};
                for (const [animName, config] of Object.entries(sprites)) {
                    const promise = this.loadImage(config.src);
                    spritePromises[playerKey][animName] = { promise, frames: config.frames };
                    allPromises.push(promise);
                }
            }

            // Wait for ALL images at once
            await Promise.all(allPromises);

            // Assign loaded images
            this.background = await bgPromise;
            this.shop = await shopPromise;

            for (const [playerKey, sprites] of Object.entries(spritePromises)) {
                this.images[playerKey] = {};
                for (const [animName, data] of Object.entries(sprites)) {
                    const img = await data.promise;
                    this.images[playerKey][animName] = {
                        image: img,
                        frames: data.frames
                    };
                }
            }

            this.assetsLoaded = true;
            this.lastTimestamp = performance.now();
            console.log('All game assets loaded (parallel)');
        } catch (error) {
            console.error('Error loading assets:', error);
        }
    }

    loadImage(src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => {
                console.warn('Failed to load:', src);
                resolve(null);
            };
            img.src = src;
        });
    }

    render(gameState, localPlayerId, deltaTime) {
        const ctx = this.ctx;

        // Update animation time using deltaTime for consistency
        // deltaTime comes from requestAnimationFrame - same real-world time on all devices
        if (deltaTime && deltaTime > 0) {
            this.animTime += deltaTime;
        } else {
            // Fallback: calculate from performance.now()
            const now = performance.now();
            this.animTime += (now - this.lastTimestamp);
            this.lastTimestamp = now;
        }

        // Current animation frame (time-based, device-independent)
        const animFrame = Math.floor(this.animTime / this.frameDuration);

        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, this.width, this.height);

        if (this.background) {
            ctx.drawImage(this.background, 0, 0, this.width, this.height);
        }

        if (this.shop) {
            const shopFrames = 6;
            const shopFrame = animFrame % shopFrames;
            const shopWidth = this.shop.width / shopFrames;
            const scale = this.getScale();
            ctx.drawImage(
                this.shop,
                shopFrame * shopWidth, 0, shopWidth, this.shop.height,
                600 * scale, 135 * scale, shopWidth * 2.7 * scale, this.shop.height * 2.7 * scale
            );
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(0, 0, this.width, this.height);

        if (gameState?.players && gameState.players.length > 0) {
            gameState.players.forEach((player, index) => {
                const spriteSet = index === 0 ? 'player1' : 'player2';
                const isPlayer2 = index === 1;
                this.drawPlayer(player, spriteSet, player.id === localPlayerId, isPlayer2, animFrame);
            });
        } else {
            ctx.fillStyle = 'white';
            ctx.font = '20px Cinzel';
            ctx.textAlign = 'center';
            ctx.fillText('Waiting for game...', this.width / 2, this.height / 2);
        }
    }

    drawPlayer(player, spriteSet, isLocal, isPlayer2, animFrame) {
        const sprites = this.images[spriteSet];
        if (!sprites) return;

        const animState = player.animState || 'idle';
        const spriteData = sprites[animState] || sprites.idle;

        // Get scale factor
        const canvasScale = this.getScale();
        const scaleX = this.width / this.baseWidth;
        const scaleY = this.height / this.baseHeight;

        if (!spriteData?.image) {
            // Fallback rectangle - scaled
            const ctx = this.ctx;
            ctx.fillStyle = spriteSet === 'player1' ? '#818cf8' : '#f87171';
            ctx.fillRect(player.x * scaleX, player.y * scaleY, 50 * canvasScale, 150 * canvasScale);
            return;
        }

        const { image, frames } = spriteData;

        // Use time-based frame index (consistent across devices)
        let frameIndex;
        if (animState === 'attack1' && player.attackFrame !== undefined) {
            // Attack frames come from server - already synchronized
            frameIndex = Math.min(player.attackFrame, frames - 1);
        } else {
            // Time-based animation frame (same speed on all devices)
            frameIndex = animFrame % frames;
        }

        const frameWidth = image.width / frames;

        // Sprite scaling
        const baseScale = 2.4;
        const spriteScale = baseScale * canvasScale;

        // Offsets scaled for current screen
        const offsetX = 215 * canvasScale;
        const offsetY = (spriteSet === 'player1' ? 140 : 250) * canvasScale;

        const ctx = this.ctx;
        ctx.save();

        // Scale player position from server coordinates (1024x576) to current canvas size
        const scaledX = player.x * scaleX;
        const scaledY = player.y * scaleY;

        const drawX = scaledX - offsetX;
        const drawY = scaledY - offsetY;

        // Player 2's sprites face left by default, Player 1 faces right
        let shouldFlip;
        if (isPlayer2) {
            shouldFlip = player.facingRight;
        } else {
            shouldFlip = !player.facingRight;
        }

        if (shouldFlip) {
            ctx.translate(scaledX + 25 * canvasScale, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(
                image,
                frameIndex * frameWidth, 0, frameWidth, image.height,
                25 * canvasScale - frameWidth * spriteScale + offsetX, drawY,
                frameWidth * spriteScale, image.height * spriteScale
            );
        } else {
            ctx.drawImage(
                image,
                frameIndex * frameWidth, 0, frameWidth, image.height,
                drawX, drawY,
                frameWidth * spriteScale, image.height * spriteScale
            );
        }

        ctx.restore();

        // UI elements (name + health bar)
        const uiScale = canvasScale;

        // Clean player name
        let displayName = player.username || 'Player';
        if (displayName.includes('_')) {
            displayName = displayName.split('_')[0];
        }
        displayName = displayName.toUpperCase();

        // Player name above character
        ctx.fillStyle = isLocal ? '#22c55e' : '#f87171';
        ctx.font = `bold ${Math.max(10, Math.floor(14 * uiScale))}px Cinzel`;
        ctx.textAlign = 'center';
        ctx.fillText(displayName, scaledX + 25 * uiScale, scaledY - 25 * uiScale);

        // Health bar
        const barWidth = 60 * uiScale;
        const barHeight = 6 * uiScale;
        const barX = scaledX + 25 * uiScale - barWidth / 2;
        const barY = scaledY - 40 * uiScale;

        ctx.fillStyle = '#dc2626';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(barX, barY, (player.health / 100) * barWidth, barHeight);
    }
}
