import { BaseGameRoom } from './BaseGameRoom.js';
import { getProgressiveQuestions, getQuestionsByDifficulty, getRandomQuestions } from '../data/bugBountyQuestions.js';

export class BugBountyRoom extends BaseGameRoom {
  constructor(roomCode, creatorId, options = {}) {
    const limits = { min: 2, max: 8 };
    super(roomCode, creatorId, 'bug_bounty', limits.max);
    this.rounds = options.rounds || 5;
    this.difficulty = options.difficulty || null; // null = progressive
    this.currentRound = 0;
    this.questions = [];
    this.roundTimer = null;
    this.roundTimeLimit = 30; // seconds per round
    this.roundAnswers = new Map(); // playerId -> answer
    this.usedQuestionIds = new Set();
  }

  getGameStartData() {
    return { rounds: this.rounds, roundTimeLimit: this.roundTimeLimit };
  }

  onStart() {
    if (this.difficulty) {
      this.questions = getQuestionsByDifficulty(this.difficulty, this.rounds);
    } else {
      this.questions = getProgressiveQuestions(this.rounds);
    }
    // Ensure no repeats
    this.questions = this.questions.filter(q => {
      if (this.usedQuestionIds.has(q.id)) return false;
      this.usedQuestionIds.add(q.id);
      return true;
    });
    this.startRound();
  }

  startRound() {
    if (this.currentRound >= this.questions.length) {
      this.finishGame();
      return;
    }
    const q = this.questions[this.currentRound];
    this.roundAnswers.clear();
    this.broadcast({
      type: 'ROUND_START',
      round: this.currentRound + 1,
      totalRounds: this.rounds,
      question: {
        id: q.id, title: q.title, difficulty: q.difficulty,
        language: q.language, code: q.code, bug: q.bug,
        options: q.options.map(o => ({ id: o.id, text: o.text })),
        hint: q.hint,
      },
      timeLimit: this.roundTimeLimit,
    });
    this.roundTimer = setTimeout(() => this.endRound(), this.roundTimeLimit * 1000);
  }

  handleGameAction(playerId, action) {
    if (action.action === 'ANSWER' && !this.roundAnswers.has(playerId)) {
      const q = this.questions[this.currentRound];
      if (!q) return;
      const chosen = q.options.find(o => o.id === action.answerId);
      const correct = chosen?.correct || false;
      const timeElapsed = action.timeElapsed || this.roundTimeLimit;
      const speedBonus = Math.max(0, Math.floor((this.roundTimeLimit - timeElapsed) * 10));
      const isFirst = correct && this.roundAnswers.size === 0;
      const points = correct ? (100 + speedBonus + (isFirst ? 100 : 0)) : 0;

      this.roundAnswers.set(playerId, { answerId: action.answerId, correct, points, timeElapsed });

      const player = this.players.get(playerId);
      if (player) player.score += points;

      this.sendTo(playerId, {
        type: 'ANSWER_RESULT', correct, points, speedBonus,
        firstCorrect: isFirst, explanation: q.bug,
      });

      // Check if all players answered
      const connected = Array.from(this.players.values()).filter(p => p.connected);
      if (this.roundAnswers.size >= connected.length) {
        clearTimeout(this.roundTimer);
        setTimeout(() => this.endRound(), 1500);
      }
    }
  }

  endRound() {
    clearTimeout(this.roundTimer);
    const q = this.questions[this.currentRound];
    const correctOption = q?.options.find(o => o.correct);

    this.broadcast({
      type: 'ROUND_END',
      round: this.currentRound + 1,
      correctAnswerId: correctOption?.id,
      explanation: q?.bug,
      scores: this.getScoreBoard(),
    });

    this.currentRound++;
    setTimeout(() => this.startRound(), 3000);
  }

  finishGame() {
    const scores = this.getScoreBoard();
    const winner = scores.length > 0 ? scores[0].id : null;
    this.endGame(winner, 'complete');
  }

  getScoreBoard() {
    return Array.from(this.players.entries())
      .map(([id, p]) => ({ id, username: p.username, score: p.score }))
      .sort((a, b) => b.score - a.score);
  }

  cleanup() {
    super.cleanup();
    clearTimeout(this.roundTimer);
  }
}
