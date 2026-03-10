import { BaseGameRoom } from './BaseGameRoom.js';
import { MSG } from '../utils/constants.js';

/**
 * Territory Grid Conquest — realtime zone control (2–8 players)
 * 10×10 grid, capture adjacent tiles, abilities, 120s match
 */
export class TerritoryRoom extends BaseGameRoom {
    constructor(roomCode, creatorId) {
        super(roomCode, creatorId, 'territory', 8);
        this.GRID_SIZE = 10;
        this.grid = []; // 2D: grid[row][col] = null | playerId
        this.playerColors = {};
        this.playerAbilities = {};  // playerId -> { shield, surge, sabotage }
        this.shieldedTiles = new Set(); // "row,col" strings
        this.surgeActive = new Map(); // playerId -> expires timestamp
        this.matchDuration = 120; // seconds
        this.tickInterval = null;
        this.scoreInterval = null;
        this.startTime = null;
    }

    getGameStartData() {
        // Init grid (all null)
        this.grid = Array.from({ length: this.GRID_SIZE }, () =>
            Array(this.GRID_SIZE).fill(null)
        );

        // Assign colors + starting positions + abilities
        const colors = ['#00F5FF', '#7B61FF', '#FF3D81', '#00FF9C', '#FBBF24', '#F97316', '#06B6D4', '#A855F7'];
        const startPositions = [
            [0, 0], [9, 9], [0, 9], [9, 0],
            [4, 0], [4, 9], [0, 4], [9, 4]
        ];

        let i = 0;
        for (const [playerId] of this.players) {
            this.playerColors[playerId] = colors[i % colors.length];
            // Give starting tile
            const [r, c] = startPositions[i % startPositions.length];
            this.grid[r][c] = playerId;
            // Init abilities (cooldowns)
            this.playerAbilities[playerId] = {
                shield: { ready: true, cooldown: 15000, lastUsed: 0 },
                surge: { ready: true, cooldown: 15000, lastUsed: 0 },
                sabotage: { ready: true, cooldown: 15000, lastUsed: 0 },
            };
            i++;
        }

        return {
            gridSize: this.GRID_SIZE,
            grid: this.grid,
            playerColors: this.playerColors,
            matchDuration: this.matchDuration
        };
    }

    onStart() {
        this.startTime = Date.now();

        // Score tick: every 1s, tiles generate points
        this.scoreInterval = setInterval(() => {
            for (const [playerId, p] of this.players) {
                let tiles = 0;
                for (let r = 0; r < this.GRID_SIZE; r++) {
                    for (let c = 0; c < this.GRID_SIZE; c++) {
                        if (this.grid[r][c] === playerId) tiles++;
                    }
                }
                p.score += tiles; // 1 point per tile per second
            }
        }, 1000);

        // Broadcast tick every 500ms
        this.tickInterval = setInterval(() => {
            const elapsed = (Date.now() - this.startTime) / 1000;
            const remaining = Math.max(0, this.matchDuration - elapsed);

            // Update ability cooldowns
            const now = Date.now();
            for (const playerId of this.players.keys()) {
                const abs = this.playerAbilities[playerId];
                if (!abs) continue;
                for (const key of ['shield', 'surge', 'sabotage']) {
                    abs[key].ready = (now - abs[key].lastUsed) >= abs[key].cooldown;
                }
            }

            // Clean expired surges
            for (const [pid, expires] of this.surgeActive) {
                if (now > expires) this.surgeActive.delete(pid);
            }

            // Clean expired shields (they last 5s)
            // shields are managed per-use

            this.broadcast({
                type: MSG.TERRITORY_TICK,
                grid: this.grid,
                scores: this.getScoreMap(),
                remaining: Math.ceil(remaining),
                elapsed: Math.floor(elapsed),
            });

            if (remaining <= 0) {
                this.finishGame();
            }
        }, 500);
    }

    handleGameAction(playerId, action) {
        if (action.action === 'capture') {
            this.captureCell(playerId, action.row, action.col);
        }
        if (action.action === 'ability') {
            this.useAbility(playerId, action.ability, action);
        }
    }

    captureCell(playerId, row, col) {
        if (row < 0 || row >= this.GRID_SIZE || col < 0 || col >= this.GRID_SIZE) return;

        // Check adjacency: must own at least one neighboring tile
        const neighbors = [
            [row - 1, col], [row + 1, col],
            [row, col - 1], [row, col + 1]
        ];
        const ownsNeighbor = neighbors.some(([r, c]) => {
            if (r < 0 || r >= this.GRID_SIZE || c < 0 || c >= this.GRID_SIZE) return false;
            return this.grid[r][c] === playerId;
        });
        if (!ownsNeighbor) return;

        // Check if tile is shielded
        if (this.shieldedTiles.has(`${row},${col}`) && this.grid[row][col] !== playerId) return;

        // Can capture neutral or opponent tiles
        const prevOwner = this.grid[row][col];
        if (prevOwner === playerId) return; // already own it

        this.grid[row][col] = playerId;

        // Surge = double capture (auto-capture one more adjacent neutral/enemy tile)
        if (this.surgeActive.has(playerId)) {
            for (const [nr, nc] of neighbors) {
                if (nr < 0 || nr >= this.GRID_SIZE || nc < 0 || nc >= this.GRID_SIZE) continue;
                if (this.grid[nr][nc] !== playerId && !this.shieldedTiles.has(`${nr},${nc}`)) {
                    this.grid[nr][nc] = playerId;
                    break; // only one bonus
                }
            }
        }

        this.broadcast({
            type: MSG.TERRITORY_CAPTURE,
            playerId,
            row, col,
            grid: this.grid,
            scores: this.getScoreMap(),
        });
    }

    useAbility(playerId, ability, action) {
        const abs = this.playerAbilities[playerId];
        if (!abs || !abs[ability]) return;
        if (!abs[ability].ready) return;

        abs[ability].lastUsed = Date.now();
        abs[ability].ready = false;

        switch (ability) {
            case 'shield': {
                // Shield all owned tiles for 5 seconds
                const myTiles = [];
                for (let r = 0; r < this.GRID_SIZE; r++) {
                    for (let c = 0; c < this.GRID_SIZE; c++) {
                        if (this.grid[r][c] === playerId) {
                            this.shieldedTiles.add(`${r},${c}`);
                            myTiles.push([r, c]);
                        }
                    }
                }
                setTimeout(() => {
                    myTiles.forEach(([r, c]) => this.shieldedTiles.delete(`${r},${c}`));
                }, 5000);

                this.broadcast({
                    type: MSG.TERRITORY_ABILITY,
                    playerId, ability: 'shield',
                    tiles: myTiles,
                    duration: 5000
                });
                break;
            }
            case 'surge': {
                this.surgeActive.set(playerId, Date.now() + 5000);
                this.broadcast({
                    type: MSG.TERRITORY_ABILITY,
                    playerId, ability: 'surge',
                    duration: 5000
                });
                break;
            }
            case 'sabotage': {
                // Steal one random tile from the player with the most tiles
                let maxTiles = 0;
                let targetId = null;
                for (const [pid] of this.players) {
                    if (pid === playerId) continue;
                    let count = 0;
                    for (let r = 0; r < this.GRID_SIZE; r++) {
                        for (let c = 0; c < this.GRID_SIZE; c++) {
                            if (this.grid[r][c] === pid) count++;
                        }
                    }
                    if (count > maxTiles) {
                        maxTiles = count;
                        targetId = pid;
                    }
                }
                if (targetId && maxTiles > 0) {
                    // Find a random tile owned by target
                    const targetTiles = [];
                    for (let r = 0; r < this.GRID_SIZE; r++) {
                        for (let c = 0; c < this.GRID_SIZE; c++) {
                            if (this.grid[r][c] === targetId && !this.shieldedTiles.has(`${r},${c}`)) {
                                targetTiles.push([r, c]);
                            }
                        }
                    }
                    if (targetTiles.length > 0) {
                        const [sr, sc] = targetTiles[Math.floor(Math.random() * targetTiles.length)];
                        this.grid[sr][sc] = playerId;
                        this.broadcast({
                            type: MSG.TERRITORY_ABILITY,
                            playerId, ability: 'sabotage',
                            targetId,
                            stolenTile: [sr, sc],
                            grid: this.grid
                        });
                    }
                }
                break;
            }
        }
    }

    getScoreMap() {
        const scores = {};
        for (const [id, p] of this.players) {
            scores[id] = p.score;
        }
        return scores;
    }

    finishGame() {
        clearInterval(this.tickInterval);
        clearInterval(this.scoreInterval);

        let winnerId = null;
        let highScore = -1;
        for (const [id, p] of this.players) {
            if (p.score > highScore) {
                highScore = p.score;
                winnerId = id;
            }
        }
        this.endGame(winnerId, 'complete');
    }

    getMatchMeta() {
        const tileCount = {};
        for (const [id] of this.players) {
            tileCount[id] = 0;
        }
        for (let r = 0; r < this.GRID_SIZE; r++) {
            for (let c = 0; c < this.GRID_SIZE; c++) {
                if (this.grid[r][c] && tileCount[this.grid[r][c]] !== undefined) {
                    tileCount[this.grid[r][c]]++;
                }
            }
        }
        return { tileCount, gridSize: this.GRID_SIZE };
    }

    cleanup() {
        if (this.tickInterval) clearInterval(this.tickInterval);
        if (this.scoreInterval) clearInterval(this.scoreInterval);
    }
}
