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
        this.baseWidth = 1024;  // Original design width for scaling
        this.baseHeight = 576;  // Original design height for scaling
        this.images = {};
        this.background = null;
        this.shop = null;
        this.frameCount = 0;
        this.frameHold = 8;
        this.assetsLoaded = false;
    }

    setSize(width, height) {
        this.width = width;
        this.height = height;
        // Update canvas size
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
            this.background = await this.loadImage('/img/background.png');
            this.shop = await this.loadImage('/img/shop.png');

            for (const [playerKey, sprites] of Object.entries(SPRITES)) {
                this.images[playerKey] = {};
                for (const [animName, config] of Object.entries(sprites)) {
                    const img = await this.loadImage(config.src);
                    this.images[playerKey][animName] = {
                        image: img,
                        frames: config.frames
                    };
                }
            }

            this.assetsLoaded = true;
            console.log('All game assets loaded');
        } catch (error) {
            console.error('Error loading assets:', error);
        }
    }

    loadImage(src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = src;
        });
    }

    render(gameState, localPlayerId) {
        const ctx = this.ctx;
        this.frameCount++;

        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, this.width, this.height);

        if (this.background) {
            ctx.drawImage(this.background, 0, 0, this.width, this.height);
        }

        if (this.shop) {
            const shopFrames = 6;
            const shopFrame = Math.floor(this.frameCount / 30) % shopFrames;
            const shopWidth = this.shop.width / shopFrames;
            ctx.drawImage(
                this.shop,
                shopFrame * shopWidth, 0, shopWidth, this.shop.height,
                600, 135, shopWidth * 2.7, this.shop.height * 2.7
            );
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(0, 0, this.width, this.height);

        if (gameState?.players && gameState.players.length > 0) {
            // Assign sprites based on player index order from server
            gameState.players.forEach((player, index) => {
                const spriteSet = index === 0 ? 'player1' : 'player2';
                const isPlayer2 = index === 1;
                this.drawPlayer(player, spriteSet, player.id === localPlayerId, isPlayer2);
            });
        } else {
            ctx.fillStyle = 'white';
            ctx.font = '20px Cinzel';
            ctx.textAlign = 'center';
            ctx.fillText('Waiting for game...', this.width / 2, this.height / 2);
        }
    }

    drawPlayer(player, spriteSet, isLocal, isPlayer2) {
        const sprites = this.images[spriteSet];
        if (!sprites) return;

        const animState = player.animState || 'idle';
        const spriteData = sprites[animState] || sprites.idle;

        if (!spriteData?.image) {
            // Fallback rectangle
            const ctx = this.ctx;
            ctx.fillStyle = spriteSet === 'player1' ? '#818cf8' : '#f87171';
            ctx.fillRect(player.x, player.y, 50, 150);
            return;
        }

        const { image, frames } = spriteData;

        let frameIndex;
        if (animState === 'attack1' && player.attackFrame !== undefined) {
            frameIndex = Math.min(player.attackFrame, frames - 1);
        } else {
            frameIndex = Math.floor(this.frameCount / this.frameHold) % frames;
        }

        const frameWidth = image.width / frames;
        const scale = 2.4;
        const offsetX = 215;
        const offsetY = spriteSet === 'player1' ? 140 : 250;

        const ctx = this.ctx;
        ctx.save();

        const drawX = player.x - offsetX;
        const drawY = player.y - offsetY;

        // Player 2's sprites are drawn facing left by default
        // So we need to flip logic: 
        // - Player 1: flip when NOT facing right
        // - Player 2: flip when facing right (because sprite faces left)
        let shouldFlip;
        if (isPlayer2) {
            // Player 2 sprite faces left, so flip when facing right
            shouldFlip = player.facingRight;
        } else {
            // Player 1 sprite faces right, so flip when facing left
            shouldFlip = !player.facingRight;
        }

        if (shouldFlip) {
            ctx.translate(player.x + 25, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(
                image,
                frameIndex * frameWidth, 0, frameWidth, image.height,
                25 - frameWidth * scale + offsetX, drawY,
                frameWidth * scale, image.height * scale
            );
        } else {
            ctx.drawImage(
                image,
                frameIndex * frameWidth, 0, frameWidth, image.height,
                drawX, drawY,
                frameWidth * scale, image.height * scale
            );
        }

        ctx.restore();

        // Clean player name - remove ID suffixes
        let displayName = player.username || 'Player';
        if (displayName.includes('_')) {
            displayName = displayName.split('_')[0];
        }
        displayName = displayName.toUpperCase();

        // Player name above character
        ctx.fillStyle = isLocal ? '#22c55e' : '#f87171';
        ctx.font = 'bold 14px Cinzel';
        ctx.textAlign = 'center';
        ctx.fillText(displayName, player.x + 25, player.y - 25);

        // Health bar
        const barWidth = 60;
        const barHeight = 6;
        const barX = player.x + 25 - barWidth / 2;
        const barY = player.y - 40;

        ctx.fillStyle = '#dc2626';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(barX, barY, (player.health / 100) * barWidth, barHeight);
    }
}
