import { BaseGameRoom } from './BaseGameRoom.js';
import { MSG } from '../utils/constants.js';

// Trivia question bank
const QUESTIONS = [
    { q: "What planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], answer: 1 },
    { q: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], answer: 3 },
    { q: "Who painted the Mona Lisa?", options: ["Van Gogh", "Da Vinci", "Picasso", "Monet"], answer: 1 },
    { q: "What is the capital of Japan?", options: ["Seoul", "Beijing", "Tokyo", "Bangkok"], answer: 2 },
    { q: "How many continents are there?", options: ["5", "6", "7", "8"], answer: 2 },
    { q: "What gas do plants absorb?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], answer: 2 },
    { q: "What is the hardest natural substance?", options: ["Gold", "Iron", "Diamond", "Platinum"], answer: 2 },
    { q: "Which country has the most people?", options: ["USA", "India", "China", "Russia"], answer: 1 },
    { q: "What year did WW2 end?", options: ["1943", "1944", "1945", "1946"], answer: 2 },
    { q: "What is the smallest prime number?", options: ["0", "1", "2", "3"], answer: 2 },
    { q: "Who wrote Romeo and Juliet?", options: ["Dickens", "Shakespeare", "Tolkien", "Austen"], answer: 1 },
    { q: "What is the speed of light?", options: ["300k km/s", "150k km/s", "600k km/s", "1M km/s"], answer: 0 },
    { q: "Which element has symbol 'O'?", options: ["Gold", "Osmium", "Oxygen", "Oganesson"], answer: 2 },
    { q: "What is the largest mammal?", options: ["Elephant", "Blue Whale", "Giraffe", "Hippo"], answer: 1 },
    { q: "How many legs does a spider have?", options: ["6", "8", "10", "12"], answer: 1 },
    { q: "What is the boiling point of water in °C?", options: ["90", "100", "110", "120"], answer: 1 },
    { q: "Which planet has the most moons?", options: ["Jupiter", "Saturn", "Uranus", "Neptune"], answer: 1 },
    { q: "What is the chemical formula for water?", options: ["CO2", "H2O", "NaCl", "O2"], answer: 1 },
    { q: "In what year did the Titanic sink?", options: ["1910", "1912", "1914", "1916"], answer: 1 },
    { q: "What is the currency of the UK?", options: ["Euro", "Dollar", "Pound", "Franc"], answer: 2 },
    { q: "What animal is known as the King of the Jungle?", options: ["Tiger", "Lion", "Bear", "Wolf"], answer: 1 },
    { q: "What is the square root of 144?", options: ["10", "11", "12", "13"], answer: 2 },
    { q: "Which gas makes up most of Earth's atmosphere?", options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Argon"], answer: 2 },
    { q: "What does CPU stand for?", options: ["Central Processing Unit", "Computer Personal Unit", "Central Program Utility", "Core Processing Unit"], answer: 0 },
    { q: "Which planet is closest to the Sun?", options: ["Venus", "Earth", "Mercury", "Mars"], answer: 2 },
];

const ROUND_TIME = 15; // seconds per question
const TOTAL_ROUNDS = 8;

export class QuizBattleRoom extends BaseGameRoom {
    constructor(roomCode, creatorId) {
        super(roomCode, creatorId, 'quiz', 8);
        this.currentRound = 0;
        this.totalRounds = TOTAL_ROUNDS;
        this.currentQuestion = null;
        this.answers = new Map(); // playerId -> answerIndex
        this.roundTimer = null;
        this.questionPool = [];
    }

    onStart() {
        // Shuffle and pick questions
        this.questionPool = [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, this.totalRounds);
        this.nextRound();
    }

    nextRound() {
        if (this.currentRound >= this.totalRounds) {
            this.finishGame();
            return;
        }

        this.answers.clear();
        this.currentQuestion = this.questionPool[this.currentRound];
        this.currentRound++;

        this.broadcast({
            type: MSG.QUESTION,
            round: this.currentRound,
            totalRounds: this.totalRounds,
            question: this.currentQuestion.q,
            options: this.currentQuestion.options,
            timeLimit: ROUND_TIME
        });

        this.roundTimer = setTimeout(() => {
            this.resolveRound();
        }, ROUND_TIME * 1000);
    }

    handleGameAction(playerId, action) {
        if (action.action === 'answer') {
            if (this.answers.has(playerId)) return; // Already answered

            this.answers.set(playerId, {
                index: action.answerIndex,
                timestamp: Date.now()
            });

            // Notify all that someone answered
            this.broadcast({
                type: MSG.GAME_STATE,
                answeredCount: this.answers.size,
                totalPlayers: this.players.size
            });

            // If everyone answered, resolve early
            if (this.answers.size >= this.players.size) {
                clearTimeout(this.roundTimer);
                setTimeout(() => this.resolveRound(), 500);
            }
        }
    }

    resolveRound() {
        clearTimeout(this.roundTimer);

        const correctAnswer = this.currentQuestion.answer;
        const results = [];

        for (const [id, p] of this.players) {
            const answer = this.answers.get(id);
            let correct = false;
            let points = 0;

            if (answer && answer.index === correctAnswer) {
                correct = true;
                points = 10;
                p.score += points;
            }

            results.push({
                id,
                username: p.username,
                answered: !!answer,
                answerIndex: answer?.index ?? -1,
                correct,
                points,
                totalScore: p.score
            });
        }

        this.eventsLog.push({
            type: 'round_result',
            data: { round: this.currentRound, correctAnswer, results: results.length }
        });

        this.broadcast({
            type: MSG.ROUND_END,
            round: this.currentRound,
            correctAnswer,
            results,
            scores: this.getScores()
        });

        // Next round after delay
        setTimeout(() => this.nextRound(), 3000);
    }

    finishGame() {
        // Determine winner (highest score)
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
        if (this.roundTimer) clearTimeout(this.roundTimer);
    }
}
