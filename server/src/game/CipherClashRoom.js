import { BaseGameRoom } from './BaseGameRoom.js';
import { getMixedRound } from '../data/cipherClashPuzzles.js';

export class CipherClashRoom extends BaseGameRoom {
  constructor(roomCode, creatorId, options = {}) {
    super(roomCode, creatorId, 'cipher_clash', 8);
    this.rounds = options.rounds || 5;
    this.currentRound = 0;
    this.puzzles = [];
    this.roundTimer = null;
    this.roundAnswers = new Map();
  }

  getGameStartData() {
    return { rounds: this.rounds };
  }

  onStart() {
    this.puzzles = getMixedRound(this.rounds);
    this.startRound();
  }

  startRound() {
    if (this.currentRound >= this.puzzles.length) {
      this.finishGame();
      return;
    }
    const p = this.puzzles[this.currentRound];
    this.roundAnswers.clear();
    this.broadcast({
      type: 'ROUND_START',
      round: this.currentRound + 1,
      totalRounds: this.rounds,
      puzzle: {
        id: p.id, type: p.type, encoded: p.encoded,
        difficulty: p.difficulty, hint: p.hint,
      },
      timeLimit: p.timeLimit || 30,
    });
    this.roundTimer = setTimeout(() => this.endRound(), (p.timeLimit || 30) * 1000);
  }

  handleGameAction(playerId, action) {
    if (action.action === 'DECODE' && !this.roundAnswers.has(playerId)) {
      const p = this.puzzles[this.currentRound];
      if (!p) return;
      const answer = (action.answer || '').trim().toUpperCase();
      const correct = answer === p.decoded.toUpperCase();
      const timeElapsed = action.timeElapsed || (p.timeLimit || 30);
      const timeLimit = p.timeLimit || 30;
      const speedBonus = Math.max(0, Math.floor((timeLimit - timeElapsed) * 15));
      const isFirst = correct && this.roundAnswers.size === 0;
      const points = correct ? (200 + speedBonus + (isFirst ? 150 : 0)) : 0;

      this.roundAnswers.set(playerId, { answer, correct, points });
      const player = this.players.get(playerId);
      if (player) player.score += points;

      this.sendTo(playerId, {
        type: 'ANSWER_RESULT', correct, points, speedBonus, firstCorrect: isFirst,
      });

      // Broadcast progress
      this.broadcast({
        type: 'GAME_STATE',
        answeredCount: this.roundAnswers.size,
        totalPlayers: Array.from(this.players.values()).filter(p2 => p2.connected).length,
      });

      const connected = Array.from(this.players.values()).filter(p2 => p2.connected);
      if (this.roundAnswers.size >= connected.length) {
        clearTimeout(this.roundTimer);
        setTimeout(() => this.endRound(), 1500);
      }
    }
  }

  endRound() {
    clearTimeout(this.roundTimer);
    const p = this.puzzles[this.currentRound];
    this.broadcast({
      type: 'ROUND_END', round: this.currentRound + 1,
      decoded: p?.decoded, cipherType: p?.type,
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
