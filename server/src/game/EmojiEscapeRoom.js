import { BaseGameRoom } from './BaseGameRoom.js';

const EMOJI_ROUNDS = [
  { id: 'em1', category: 'movies',   emojis: '🦁👑🌍',          answer: 'The Lion King',         hint: 'Disney animated classic' },
  { id: 'em2', category: 'movies',   emojis: '🕷️🧑👦',          answer: 'Spider-Man',            hint: 'Marvel superhero' },
  { id: 'em3', category: 'movies',   emojis: '🧊👸❄️',           answer: 'Frozen',                hint: 'Let it go...' },
  { id: 'em4', category: 'movies',   emojis: '🤖🚗🔴🔵',        answer: 'Transformers',          hint: 'More than meets the eye' },
  { id: 'em5', category: 'songs',    emojis: '🎸🔥💀',           answer: 'Highway to Hell',       hint: 'AC/DC classic' },
  { id: 'em6', category: 'songs',    emojis: '🌧️🙂',             answer: 'Singing in the Rain',   hint: 'Classic musical number' },
  { id: 'em7', category: 'songs',    emojis: '💃🕺🌃',           answer: 'Dancing in the Dark',   hint: 'Springsteen hit' },
  { id: 'em8', category: 'coding',   emojis: '🖥️🔥🚒',           answer: 'It works on my machine', hint: 'Classic dev excuse' },
  { id: 'em9', category: 'coding',   emojis: '☕🐛🔍',           answer: 'Java Debug',            hint: 'Finding issues in Java' },
  { id: 'em10', category: 'coding',  emojis: '🐍📦💥',           answer: 'Python Package Error', hint: 'pip install gone wrong' },
  { id: 'em11', category: 'proverbs',emojis: '🐦⏰🪱',           answer: 'Early bird gets the worm', hint: 'About being on time' },
  { id: 'em12', category: 'proverbs',emojis: '👁️👁️🦷🦷',        answer: 'Eye for an eye',       hint: 'Old testament law' },
];

function normalize(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
}

export class EmojiEscapeRoom extends BaseGameRoom {
  constructor(roomCode, creatorId, options = {}) {
    super(roomCode, creatorId, 'emoji_escape', 8);
    this.rounds = options.rounds || 6;
    this.category = options.category || null;
    this.currentRound = 0;
    this.questions = [];
    this.roundTimer = null;
    this.roundTimeLimit = 25;
    this.roundWinner = null;   // playerId who got this round first
    this.penaltyMap = new Map(); // playerId -> penalty end timestamp
    this.roundAnswered = false;
  }

  getGameStartData() {
    return { rounds: this.rounds, roundTimeLimit: this.roundTimeLimit, gameType: 'emoji_escape' };
  }

  onStart() {
    let pool = [...EMOJI_ROUNDS];
    if (this.category) pool = pool.filter(q => q.category === this.category);
    this.questions = pool.sort(() => Math.random() - 0.5).slice(0, this.rounds);
    if (this.questions.length === 0) this.questions = EMOJI_ROUNDS.sort(() => Math.random() - 0.5).slice(0, this.rounds);
    this.startRound();
  }

  startRound() {
    if (this.currentRound >= this.questions.length) { this.finishGame(); return; }
    const q = this.questions[this.currentRound];
    this.roundWinner = null;
    this.roundAnswered = false;
    this.penaltyMap.clear();

    this.broadcast({
      type: 'ROUND_START',
      round: this.currentRound + 1,
      totalRounds: this.rounds,
      question: { id: q.id, emojis: q.emojis, category: q.category },
      timeLimit: this.roundTimeLimit,
    });

    this.roundTimer = setTimeout(() => {
      // Hint at 10s remaining — broadcast
      const q2 = this.questions[this.currentRound];
      if (!this.roundAnswered) {
        this.broadcast({ type: 'ROUND_HINT', hint: q2?.hint });
      }
    }, (this.roundTimeLimit - 10) * 1000);

    this.roundEndTimer = setTimeout(() => this.endRound(null), this.roundTimeLimit * 1000);
  }

  handleGameAction(playerId, action) {
    if (action.action !== 'ANSWER') return;
    const q = this.questions[this.currentRound];
    if (!q || this.roundAnswered) return;

    // Check penalty
    const penalty = this.penaltyMap.get(playerId);
    if (penalty && Date.now() < penalty) {
      this.sendTo(playerId, { type: 'ANSWER_RESULT', correct: false, penalty: true, points: 0 });
      return;
    }

    const correct = normalize(action.answer || '') === normalize(q.answer);

    if (correct) {
      this.roundAnswered = true;
      clearTimeout(this.roundTimer);
      clearTimeout(this.roundEndTimer);

      const timeElapsed = action.timeElapsed || this.roundTimeLimit;
      const speedBonus = Math.max(0, Math.floor((this.roundTimeLimit - timeElapsed) * 10));
      const points = 200 + speedBonus;

      const player = this.players.get(playerId);
      if (player) player.score += points;
      this.roundWinner = playerId;

      this.sendTo(playerId, { type: 'ANSWER_RESULT', correct: true, points, speedBonus, firstCorrect: true });
      // Tell others they missed it
      for (const [id] of this.players) {
        if (id !== playerId) {
          this.sendTo(id, { type: 'ANSWER_RESULT', correct: false, points: 0, stolenBy: player?.username });
        }
      }
      setTimeout(() => this.endRound(playerId), 1500);
    } else {
      // Wrong answer — 5s penalty
      this.penaltyMap.set(playerId, Date.now() + 5000);
      this.sendTo(playerId, { type: 'ANSWER_RESULT', correct: false, penalty: true, penaltyMs: 5000, points: 0 });
    }
  }

  endRound(winnerId) {
    clearTimeout(this.roundTimer);
    clearTimeout(this.roundEndTimer);
    const q = this.questions[this.currentRound];
    this.broadcast({
      type: 'ROUND_END',
      round: this.currentRound + 1,
      correctAnswer: q?.answer,
      roundWinner: winnerId,
      scores: this.getScoreBoard(),
    });
    this.currentRound++;
    setTimeout(() => this.startRound(), 3000);
  }

  finishGame() {
    const scores = this.getScoreBoard();
    this.endGame(scores[0]?.id || null, 'complete');
  }

  getScoreBoard() {
    return Array.from(this.players.entries())
      .map(([id, p]) => ({ id, username: p.username, score: p.score }))
      .sort((a, b) => b.score - a.score);
  }

  cleanup() {
    super.cleanup();
    clearTimeout(this.roundTimer);
    clearTimeout(this.roundEndTimer);
  }
}
