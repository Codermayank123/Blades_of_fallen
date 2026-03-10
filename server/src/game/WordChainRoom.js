import { BaseGameRoom } from './BaseGameRoom.js';
import { MSG } from '../utils/constants.js';

const TURN_TIME = 15; // seconds per turn
const MAX_ROUNDS = 30; // safety limit

// Simple word list for validation (common English words starting with each letter)
const VALID_STARTERS = 'abcdefghijklmnopqrstuvwxyz';

export class WordChainRoom extends BaseGameRoom {
    constructor(roomCode, creatorId) {
        super(roomCode, creatorId, 'wordchain', 8);
        this.usedWords = new Set();
        this.lastWord = '';
        this.currentPlayerIndex = 0;
        this.playerOrder = [];
        this.turnTimer = null;
        this.roundCount = 0;
        this.eliminatedPlayers = new Set();
    }

    onStart() {
        this.playerOrder = Array.from(this.players.keys());
        this.currentPlayerIndex = 0;
        this.lastWord = '';
        this.roundCount = 0;

        this.broadcast({
            type: MSG.ROUND_START,
            message: 'Word Chain begins! Type a word when it\'s your turn.',
            playerOrder: this.playerOrder.map(id => ({
                id,
                username: this.players.get(id).username
            }))
        });

        this.startTurn();
    }

    startTurn() {
        // Skip eliminated players
        let attempts = 0;
        while (this.eliminatedPlayers.has(this.playerOrder[this.currentPlayerIndex]) && attempts < this.playerOrder.length) {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.playerOrder.length;
            attempts++;
        }

        const activePlayers = this.playerOrder.filter(id => !this.eliminatedPlayers.has(id));
        if (activePlayers.length <= 1) {
            const winnerId = activePlayers[0] || null;
            this.endGame(winnerId, 'last_standing');
            return;
        }

        if (this.roundCount >= MAX_ROUNDS) {
            // Highest score wins
            let winnerId = null;
            let high = -1;
            for (const [id, p] of this.players) {
                if (!this.eliminatedPlayers.has(id) && p.score > high) {
                    high = p.score;
                    winnerId = id;
                }
            }
            this.endGame(winnerId, 'max_rounds');
            return;
        }

        const currentPlayerId = this.playerOrder[this.currentPlayerIndex];
        const requiredLetter = this.lastWord ? this.lastWord.slice(-1).toLowerCase() : '';

        this.broadcast({
            type: MSG.TURN,
            currentPlayer: currentPlayerId,
            currentUsername: this.players.get(currentPlayerId)?.username,
            lastWord: this.lastWord,
            requiredLetter,
            timeLimit: TURN_TIME,
            scores: this.getScores(),
            eliminated: Array.from(this.eliminatedPlayers)
        });

        this.turnTimer = setTimeout(() => {
            this.handleTimeout(currentPlayerId);
        }, TURN_TIME * 1000);
    }

    handleGameAction(playerId, action) {
        if (action.action !== 'word') return;

        const currentPlayerId = this.playerOrder[this.currentPlayerIndex];
        if (playerId !== currentPlayerId) return; // Not their turn

        clearTimeout(this.turnTimer);

        const word = (action.word || '').trim().toLowerCase();
        const requiredLetter = this.lastWord ? this.lastWord.slice(-1).toLowerCase() : '';

        // Validate word
        let valid = true;
        let reason = '';

        if (!word || word.length < 2) {
            valid = false;
            reason = 'Word too short (min 2 letters)';
        } else if (!/^[a-z]+$/.test(word)) {
            valid = false;
            reason = 'Only letters allowed';
        } else if (requiredLetter && word[0] !== requiredLetter) {
            valid = false;
            reason = `Word must start with "${requiredLetter.toUpperCase()}"`;
        } else if (this.usedWords.has(word)) {
            valid = false;
            reason = 'Word already used!';
        }

        if (valid) {
            this.usedWords.add(word);
            this.lastWord = word;
            this.roundCount++;
            const player = this.players.get(playerId);
            player.score += word.length; // Points = word length

            this.eventsLog.push({ type: 'word', playerId, data: { word } });

            this.broadcast({
                type: MSG.GAME_STATE,
                action: 'word_accepted',
                word,
                playerId,
                username: player.username,
                points: word.length,
                scores: this.getScores()
            });

            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.playerOrder.length;
            setTimeout(() => this.startTurn(), 1500);
        } else {
            // Wrong answer = eliminate
            this.eliminatePlayer(playerId, reason);
        }
    }

    handleTimeout(playerId) {
        this.eliminatePlayer(playerId, 'Time ran out!');
    }

    eliminatePlayer(playerId, reason) {
        this.eliminatedPlayers.add(playerId);

        this.broadcast({
            type: MSG.GAME_STATE,
            action: 'player_eliminated',
            playerId,
            username: this.players.get(playerId)?.username,
            reason,
            scores: this.getScores(),
            eliminated: Array.from(this.eliminatedPlayers)
        });

        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.playerOrder.length;
        setTimeout(() => this.startTurn(), 2000);
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
