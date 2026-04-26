import { BaseGameRoom } from './BaseGameRoom.js';
import { getRandomChallenges } from '../data/algorithmChallenges.js';

export class AlgorithmArenaRoom extends BaseGameRoom {
  constructor(roomCode, creatorId, options = {}) {
    super(roomCode, creatorId, 'algo_arena', 8);
    this.rounds = options.rounds || 4;
    this.category = options.category || null; // null = mixed
    this.currentRound = 0;
    this.challenges = [];
    this.roundTimer = null;
    this.roundTimeLimit = 45;
    this.roundAnswers = new Map();
  }

  getGameStartData() {
    return { rounds: this.rounds, roundTimeLimit: this.roundTimeLimit };
  }

  onStart() {
    this.challenges = getRandomChallenges(this.rounds);
    this.startRound();
  }

  startRound() {
    if (this.currentRound >= this.challenges.length) {
      this.finishGame();
      return;
    }
    const c = this.challenges[this.currentRound];
    this.roundAnswers.clear();
    this.broadcast({
      type: 'ROUND_START',
      round: this.currentRound + 1,
      totalRounds: this.rounds,
      challenge: {
        id: c.id, category: c.category, title: c.title,
        problem: c.problem, slowCode: c.slowCode, difficulty: c.difficulty,
        options: c.options.map(o => ({ id: o.id, label: o.label, complexity: o.complexity })),
      },
      timeLimit: this.roundTimeLimit,
    });
    this.roundTimer = setTimeout(() => this.endRound(), this.roundTimeLimit * 1000);
  }

  handleGameAction(playerId, action) {
    if (action.action === 'ANSWER' && !this.roundAnswers.has(playerId)) {
      const c = this.challenges[this.currentRound];
      if (!c) return;
      const chosen = c.options.find(o => o.id === action.answerId);
      const correct = chosen?.correct || false;
      const timeElapsed = action.timeElapsed || this.roundTimeLimit;
      const speedBonus = Math.max(0, Math.floor((this.roundTimeLimit - timeElapsed) * 8));
      const isFirst = correct && this.roundAnswers.size === 0;
      const points = correct ? (150 + speedBonus + (isFirst ? 100 : 0)) : 0;

      this.roundAnswers.set(playerId, { answerId: action.answerId, correct, points });
      const player = this.players.get(playerId);
      if (player) player.score += points;

      this.sendTo(playerId, {
        type: 'ANSWER_RESULT', correct, points, speedBonus, firstCorrect: isFirst,
        explanation: c.explanation, optimalComplexity: chosen?.complexity,
      });

      const connected = Array.from(this.players.values()).filter(p => p.connected);
      if (this.roundAnswers.size >= connected.length) {
        clearTimeout(this.roundTimer);
        setTimeout(() => this.endRound(), 1500);
      }
    }
  }

  endRound() {
    clearTimeout(this.roundTimer);
    const c = this.challenges[this.currentRound];
    const correct = c?.options.find(o => o.correct);
    this.broadcast({
      type: 'ROUND_END', round: this.currentRound + 1,
      correctAnswerId: correct?.id, explanation: c?.explanation,
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

  cleanup() { super.cleanup(); clearTimeout(this.roundTimer); }
}
