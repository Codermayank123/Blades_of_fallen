import { BaseGameRoom } from './BaseGameRoom.js';

// Built-in pixel code questions — no external data file needed
const PIXEL_QUESTIONS = [
  {
    id: 'px1', difficulty: 'beginner', language: 'javascript',
    output: '▓▓▓\n▓░▓\n▓▓▓',
    options: [
      { id: 'a', text: 'for(i=0;i<3;i++)', correct: false },
      { id: 'b', text: 'for(i=0;i<=3;i++)', correct: false },
      { id: 'c', text: 'for(i=1;i<=3;i++)', correct: true },
      { id: 'd', text: 'for(i=0;i<2;i++)', correct: false },
    ],
    explanation: 'Rows are 1-indexed: i from 1 to 3 (inclusive) gives exactly 3 rows.',
  },
  {
    id: 'px2', difficulty: 'beginner', language: 'python',
    output: '* * *\n* * *\n* * *',
    options: [
      { id: 'a', text: 'for i in range(3):\n  print("* "*3)', correct: true },
      { id: 'b', text: 'for i in range(4):\n  print("* "*3)', correct: false },
      { id: 'c', text: 'for i in range(3):\n  print("* "*4)', correct: false },
      { id: 'd', text: 'for i in range(2):\n  print("* "*3)', correct: false },
    ],
    explanation: 'range(3) yields 3 iterations, "* "*3 gives "* * * " (3 stars).',
  },
  {
    id: 'px3', difficulty: 'intermediate', language: 'javascript',
    output: '1\n12\n123\n1234\n12345',
    options: [
      { id: 'a', text: 'for(r=1;r<=5;r++) console.log([...Array(r+1).keys()].slice(1).join(""))', correct: false },
      { id: 'b', text: 'for(r=1;r<=5;r++) console.log([...Array(r).keys()].map(x=>x+1).join(""))', correct: true },
      { id: 'c', text: 'for(r=0;r<5;r++) console.log(Array(r).fill(0).map((_,i)=>i+1).join(""))', correct: false },
      { id: 'd', text: 'for(r=1;r<5;r++) console.log([...Array(r).keys()].join(""))', correct: false },
    ],
    explanation: 'Array(r).keys() gives 0..r-1, map(x=>x+1) shifts to 1..r.',
  },
  {
    id: 'px4', difficulty: 'expert', language: 'javascript',
    output: '    *\n   ***\n  *****\n *******\n*********',
    options: [
      { id: 'a', text: 'for(i=1;i<=5;i++) console.log(" ".repeat(5-i)+"*".repeat(2*i-1))', correct: true },
      { id: 'b', text: 'for(i=0;i<5;i++) console.log(" ".repeat(5-i)+"*".repeat(2*i+1))', correct: false },
      { id: 'c', text: 'for(i=1;i<=5;i++) console.log(" ".repeat(i)+"*".repeat(2*i-1))', correct: false },
      { id: 'd', text: 'for(i=1;i<=5;i++) console.log(" ".repeat(5-i)+"*".repeat(i*2))', correct: false },
    ],
    explanation: 'Spaces = n-i, stars = 2i-1. For i=5: 0 spaces, 9 stars.',
  },
  {
    id: 'px5', difficulty: 'intermediate', language: 'python',
    output: '0 1 1 2 3 5 8',
    options: [
      { id: 'a', text: 'a,b=0,1\nfor _ in range(7):\n  print(a,end=" ")\n  a,b=b,a+b', correct: true },
      { id: 'b', text: 'a,b=1,1\nfor _ in range(7):\n  print(a,end=" ")\n  a,b=b,a+b', correct: false },
      { id: 'c', text: 'a,b=0,1\nfor _ in range(6):\n  print(a,end=" ")\n  a,b=b,a+b', correct: false },
      { id: 'd', text: 'a,b=0,1\nfor _ in range(7):\n  print(b,end=" ")\n  a,b=b,a+b', correct: false },
    ],
    explanation: 'Fibonacci starting at 0,1. Range(7) gives 7 values: 0 1 1 2 3 5 8.',
  },
];

export class PixelCodeRoom extends BaseGameRoom {
  constructor(roomCode, creatorId, options = {}) {
    super(roomCode, creatorId, 'pixel_code', 8);
    this.rounds = options.rounds || 5;
    this.difficulty = options.difficulty || null;
    this.language = options.language || null;
    this.currentRound = 0;
    this.questions = [];
    this.roundTimer = null;
    this.roundTimeLimit = 40;
    this.roundAnswers = new Map();
  }

  getGameStartData() {
    return { rounds: this.rounds, roundTimeLimit: this.roundTimeLimit, gameType: 'pixel_code' };
  }

  onStart() {
    let pool = [...PIXEL_QUESTIONS];
    if (this.difficulty) pool = pool.filter(q => q.difficulty === this.difficulty);
    if (this.language) pool = pool.filter(q => q.language === this.language);
    // Shuffle and pick
    this.questions = pool.sort(() => Math.random() - 0.5).slice(0, this.rounds);
    if (this.questions.length === 0) this.questions = PIXEL_QUESTIONS.slice(0, this.rounds);
    this.startRound();
  }

  startRound() {
    if (this.currentRound >= this.questions.length) { this.finishGame(); return; }
    const q = this.questions[this.currentRound];
    this.roundAnswers.clear();
    this.broadcast({
      type: 'ROUND_START',
      round: this.currentRound + 1,
      totalRounds: this.rounds,
      question: {
        id: q.id, output: q.output, difficulty: q.difficulty, language: q.language,
        options: q.options.map(o => ({ id: o.id, text: o.text })),
      },
      timeLimit: this.roundTimeLimit,
    });
    this.roundTimer = setTimeout(() => this.endRound(), this.roundTimeLimit * 1000);
  }

  handleGameAction(playerId, action) {
    if (action.action !== 'ANSWER' || this.roundAnswers.has(playerId)) return;
    const q = this.questions[this.currentRound];
    if (!q) return;
    const chosen = q.options.find(o => o.id === action.answerId);
    const correct = chosen?.correct || false;
    const timeElapsed = action.timeElapsed || this.roundTimeLimit;
    const speedBonus = correct ? Math.max(0, Math.floor((this.roundTimeLimit - timeElapsed) * 8)) : 0;
    const isFirst = correct && this.roundAnswers.size === 0;
    const points = correct ? (100 + speedBonus + (isFirst ? 50 : 0)) : 0;

    this.roundAnswers.set(playerId, { answerId: action.answerId, correct, points });
    const player = this.players.get(playerId);
    if (player) player.score += points;

    this.sendTo(playerId, {
      type: 'ANSWER_RESULT', correct, points, speedBonus,
      firstCorrect: isFirst, explanation: q.explanation,
    });

    const connected = Array.from(this.players.values()).filter(p => p.connected);
    if (this.roundAnswers.size >= connected.length) {
      clearTimeout(this.roundTimer);
      setTimeout(() => this.endRound(), 1500);
    }
  }

  endRound() {
    clearTimeout(this.roundTimer);
    const q = this.questions[this.currentRound];
    const correctOpt = q?.options.find(o => o.correct);
    this.broadcast({
      type: 'ROUND_END',
      round: this.currentRound + 1,
      correctAnswerId: correctOpt?.id,
      explanation: q?.explanation,
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

  cleanup() { super.cleanup(); clearTimeout(this.roundTimer); }
}
