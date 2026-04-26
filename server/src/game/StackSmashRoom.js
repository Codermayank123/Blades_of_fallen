import { BaseGameRoom } from './BaseGameRoom.js';

const STACK_QUESTIONS = [
  {
    id: 'ss1', difficulty: 'rookie', language: 'javascript',
    error: 'RangeError: Maximum call stack size exceeded',
    code: [
      'function factorial(n) {',
      '  return factorial(n - 1) * n;',  // bug line
      '}',
      'factorial(5);',
    ],
    bugLine: 1, // 0-indexed
    explanation: 'No base case — factorial(0) never stops recursing.',
    options: [
      { id: 'a', text: 'Line 1 — missing base case (if n===0 return 1)', correct: true },
      { id: 'b', text: 'Line 3 — wrong multiplication order', correct: false },
      { id: 'c', text: 'Line 4 — wrong initial argument', correct: false },
      { id: 'd', text: 'Line 2 — wrong function name', correct: false },
    ],
  },
  {
    id: 'ss2', difficulty: 'rookie', language: 'javascript',
    error: 'TypeError: Cannot read properties of undefined (reading "length")',
    code: [
      'function getLen(arr) {',
      '  return arr.length;',
      '}',
      'getLen();',  // bug line
    ],
    bugLine: 3,
    explanation: 'Called without argument — arr is undefined inside the function.',
    options: [
      { id: 'a', text: 'Line 1 — function missing parameter default', correct: false },
      { id: 'b', text: 'Line 2 — .length not valid on arrays', correct: false },
      { id: 'c', text: 'Line 4 — called without passing an array argument', correct: true },
      { id: 'd', text: 'Line 3 — missing return type annotation', correct: false },
    ],
  },
  {
    id: 'ss3', difficulty: 'elite', language: 'javascript',
    error: 'Memory leak: heap growing unbounded',
    code: [
      'const cache = [];',
      'function memoize(fn) {',
      '  return function(...args) {',
      '    cache.push({ args, result: fn(...args) });',  // bug line
      '    return cache[cache.length-1].result;',
      '  };',
      '}',
    ],
    bugLine: 3,
    explanation: 'cache is never cleared — every call appends, causing unbounded memory growth.',
    options: [
      { id: 'a', text: 'Line 1 — should use Map not Array', correct: false },
      { id: 'b', text: 'Line 4 — pushes every call result but cache is never evicted', correct: true },
      { id: 'c', text: 'Line 5 — accessing wrong index', correct: false },
      { id: 'd', text: 'Line 3 — spread operator causes copies', correct: false },
    ],
  },
  {
    id: 'ss4', difficulty: 'elite', language: 'python',
    error: 'RecursionError: maximum recursion depth exceeded',
    code: [
      'def fib(n):',
      '  if n == 1: return 1',
      '  return fib(n-1) + fib(n-2)',  // bug line
      'print(fib(0))',
    ],
    bugLine: 2,
    explanation: 'fib(0) hits n-2 = -2, never hits n==1 — infinite recursion. Need n<=1.',
    options: [
      { id: 'a', text: 'Line 1 — wrong parameter name', correct: false },
      { id: 'b', text: 'Line 4 — wrong initial call argument', correct: false },
      { id: 'c', text: 'Line 2 — base case should be n<=1, not n==1', correct: true },
      { id: 'd', text: 'Line 3 — should call fib(n+1)', correct: false },
    ],
  },
  {
    id: 'ss5', difficulty: 'legend', language: 'javascript',
    error: 'RangeError: Maximum call stack size exceeded (async)',
    code: [
      'async function fetchAll(urls) {',
      '  for (const url of urls) {',
      '    await fetchAll([url]);',  // bug line
      '  }',
      '}',
    ],
    bugLine: 2,
    explanation: 'fetchAll calls itself with each individual URL, causing infinite async recursion.',
    options: [
      { id: 'a', text: 'Line 1 — async not needed here', correct: false },
      { id: 'b', text: 'Line 2 — for..of wrong for promises', correct: false },
      { id: 'c', text: 'Line 3 — recursive call with same data, infinite loop', correct: true },
      { id: 'd', text: 'Line 4 — missing break statement', correct: false },
    ],
  },
];

export class StackSmashRoom extends BaseGameRoom {
  constructor(roomCode, creatorId, options = {}) {
    super(roomCode, creatorId, 'stack_smash', 8);
    this.rounds = options.rounds || 4;
    this.difficulty = options.difficulty || null;
    this.language = options.language || null;
    this.currentRound = 0;
    this.questions = [];
    this.roundTimer = null;
    this.roundTimeLimit = 35;
    this.roundAnswers = new Map();
  }

  getGameStartData() {
    return { rounds: this.rounds, roundTimeLimit: this.roundTimeLimit, gameType: 'stack_smash' };
  }

  onStart() {
    let pool = [...STACK_QUESTIONS];
    if (this.difficulty) pool = pool.filter(q => q.difficulty === this.difficulty);
    if (this.language) pool = pool.filter(q => q.language === this.language);
    this.questions = pool.sort(() => Math.random() - 0.5).slice(0, this.rounds);
    if (this.questions.length === 0) this.questions = STACK_QUESTIONS.slice(0, this.rounds);
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
        id: q.id, error: q.error, code: q.code,
        difficulty: q.difficulty, language: q.language,
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
      bugLine: q?.bugLine,
      explanation: q?.explanation,
      scores: this.getScoreBoard(),
    });
    this.currentRound++;
    setTimeout(() => this.startRound(), 3500);
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
