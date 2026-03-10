import { BaseGameRoom } from './BaseGameRoom.js';
import { MSG } from '../utils/constants.js';

const CARD_SYMBOLS = ['🗡️', '🛡️', '⚔️', '🏹', '🔮', '💎', '👑', '🐉', '🦅', '🔥', '⭐', '🌙'];
const TURN_TIME = 10; // seconds per turn

export class MemoryMatchRoom extends BaseGameRoom {
    constructor(roomCode, creatorId) {
        super(roomCode, creatorId, 'memory', 6);
        this.cards = [];
        this.revealedCards = []; // Currently flipped cards (max 2)
        this.matchedCards = new Set(); // Indices of matched cards
        this.playerOrder = [];
        this.currentPlayerIndex = 0;
        this.turnTimer = null;
        this.boardSize = 0; // Will be set based on player count
    }

    /**
     * Called by BaseGameRoom.startGame() to merge into the GAME_START message.
     * This replaces the old duplicate broadcast that was causing the bug.
     */
    getGameStartData() {
        // Prepare the board BEFORE startGame sends GAME_START
        this.playerOrder = Array.from(this.players.keys());
        this.currentPlayerIndex = 0;

        const pairCount = Math.min(CARD_SYMBOLS.length, 4 + this.players.size);
        this.boardSize = pairCount * 2;

        const symbols = CARD_SYMBOLS.slice(0, pairCount);
        this.cards = [...symbols, ...symbols];

        // Shuffle
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }

        return {
            boardSize: this.boardSize,
            cardCount: this.cards.length,
            columns: this.cards.length <= 12 ? 4 : 6
        };
    }

    onStart() {
        // Board already initialized in getGameStartData()
        // Just kick off the first turn
        this.startTurn();
    }

    startTurn() {
        // Check if all cards matched
        if (this.matchedCards.size >= this.cards.length) {
            this.finishGame();
            return;
        }

        const currentPlayerId = this.playerOrder[this.currentPlayerIndex];
        this.revealedCards = [];

        this.broadcast({
            type: MSG.TURN,
            currentPlayer: currentPlayerId,
            currentUsername: this.players.get(currentPlayerId)?.username,
            matchedCards: Array.from(this.matchedCards),
            scores: this.getScores(),
            timeLimit: TURN_TIME
        });

        this.turnTimer = setTimeout(() => {
            // Timeout = skip turn
            this.nextTurn();
        }, TURN_TIME * 1000);
    }

    handleGameAction(playerId, action) {
        if (action.action !== 'flip') return;

        const currentPlayerId = this.playerOrder[this.currentPlayerIndex];
        if (playerId !== currentPlayerId) return;

        const cardIndex = action.cardIndex;

        // Validate
        if (cardIndex < 0 || cardIndex >= this.cards.length) return;
        if (this.matchedCards.has(cardIndex)) return;
        if (this.revealedCards.includes(cardIndex)) return;
        if (this.revealedCards.length >= 2) return;

        this.revealedCards.push(cardIndex);

        // Send flip result to all
        this.broadcast({
            type: MSG.FLIP_RESULT,
            cardIndex,
            symbol: this.cards[cardIndex],
            revealedCards: this.revealedCards.map(i => ({ index: i, symbol: this.cards[i] })),
            playerId
        });

        if (this.revealedCards.length === 2) {
            clearTimeout(this.turnTimer);

            const [first, second] = this.revealedCards;
            const isMatch = this.cards[first] === this.cards[second];

            setTimeout(() => {
                if (isMatch) {
                    this.matchedCards.add(first);
                    this.matchedCards.add(second);
                    const player = this.players.get(playerId);
                    if (player) player.score += 10;

                    this.eventsLog.push({
                        type: 'match',
                        playerId,
                        data: { symbol: this.cards[first] }
                    });

                    this.broadcast({
                        type: MSG.GAME_STATE,
                        action: 'match_found',
                        playerId,
                        username: player?.username,
                        cards: [first, second],
                        symbol: this.cards[first],
                        matchedCards: Array.from(this.matchedCards),
                        scores: this.getScores()
                    });

                    // Same player gets another turn on match
                    setTimeout(() => this.startTurn(), 1000);
                } else {
                    this.broadcast({
                        type: MSG.GAME_STATE,
                        action: 'no_match',
                        cards: [first, second],
                        matchedCards: Array.from(this.matchedCards),
                        scores: this.getScores()
                    });

                    // Next player's turn
                    setTimeout(() => this.nextTurn(), 1200);
                }
            }, 1000);
        }
    }

    nextTurn() {
        clearTimeout(this.turnTimer);
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.playerOrder.length;
        this.startTurn();
    }

    finishGame() {
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

    getScores() {
        const scores = {};
        for (const [id, p] of this.players) {
            scores[id] = p.score;
        }
        return scores;
    }

    cleanup() {
        if (this.turnTimer) clearTimeout(this.turnTimer);
    }
}
