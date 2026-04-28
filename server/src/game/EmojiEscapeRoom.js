import { BaseGameRoom } from './BaseGameRoom.js';

// ─── MOVIES ─────────────────────────────────────────────────────────────────────
const EMOJI_ROUNDS = [
  { id: 'em1',  category: 'movies', emojis: '🦁👑🌅🐾',       answer: 'The Lion King',            keywords: ['lion king', 'lion', 'simba'] },
  { id: 'em2',  category: 'movies', emojis: '🕷️🕸️🦸‍♂️🏙️',     answer: 'Spider-Man',               keywords: ['spiderman', 'spider man', 'spider'] },
  { id: 'em3',  category: 'movies', emojis: '❄️👸⛄🎵',        answer: 'Frozen',                   keywords: ['frozen', 'elsa', 'let it go'] },
  { id: 'em4',  category: 'movies', emojis: '🤖🚗🔄💥',       answer: 'Transformers',             keywords: ['transformers', 'transformer', 'autobots'] },
  { id: 'em5',  category: 'movies', emojis: '🚢🧊💑💔',        answer: 'Titanic',                  keywords: ['titanic', 'jack rose'] },
  { id: 'em6',  category: 'movies', emojis: '🧙‍♂️💍🌋👁️',      answer: 'Lord of the Rings',        keywords: ['lord of the rings', 'lotr', 'rings', 'lord rings'] },
  { id: 'em7',  category: 'movies', emojis: '🦕🦖🏝️⚠️',       answer: 'Jurassic Park',            keywords: ['jurassic', 'jurassic park', 'jurassic world', 'dinosaur'] },
  { id: 'em8',  category: 'movies', emojis: '🦇🌑🃏🏙️',       answer: 'The Dark Knight',          keywords: ['dark knight', 'batman', 'joker'] },
  { id: 'em9',  category: 'movies', emojis: '👻❌🔫🚫',        answer: 'Ghostbusters',             keywords: ['ghostbusters', 'ghost busters', 'ghost'] },
  { id: 'em10', category: 'movies', emojis: '🏴‍☠️⚓🗺️💀',      answer: 'Pirates of the Caribbean', keywords: ['pirates', 'caribbean', 'jack sparrow', 'pirates caribbean'] },
  { id: 'em11', category: 'movies', emojis: '🧪😡💚👊',        answer: 'The Incredible Hulk',      keywords: ['hulk', 'incredible hulk'] },
  { id: 'em12', category: 'movies', emojis: '🐀👨‍🍳🍝🇫🇷',     answer: 'Ratatouille',              keywords: ['ratatouille', 'rat chef', 'remy'] },
  { id: 'em13', category: 'movies', emojis: '🏎️⚡🏁🏆',        answer: 'Cars',                     keywords: ['cars', 'lightning mcqueen', 'mcqueen'] },
  { id: 'em14', category: 'movies', emojis: '🐠🔍🌊👨‍👦',      answer: 'Finding Nemo',             keywords: ['nemo', 'finding nemo'] },
  { id: 'em15', category: 'movies', emojis: '🧞‍♂️🪄🏜️👸',      answer: 'Aladdin',                  keywords: ['aladdin', 'genie', 'jasmine'] },
  { id: 'em16', category: 'movies', emojis: '🤠🚀🧸♾️',        answer: 'Toy Story',                keywords: ['toy story', 'woody', 'buzz', 'buzz lightyear'] },
  { id: 'em17', category: 'movies', emojis: '🦈🩸🏖️😱',        answer: 'Jaws',                     keywords: ['jaws', 'shark'] },
  { id: 'em18', category: 'movies', emojis: '💊🔴🔵🕶️',       answer: 'The Matrix',               keywords: ['matrix', 'neo', 'red pill'] },
  { id: 'em19', category: 'movies', emojis: '⭐⚔️🌌👨‍👧',      answer: 'Star Wars',                keywords: ['star wars', 'starwars', 'jedi', 'skywalker'] },
  { id: 'em20', category: 'movies', emojis: '🐒👑🏢✈️',        answer: 'King Kong',                keywords: ['king kong', 'kong'] },
  { id: 'em21', category: 'movies', emojis: '🧊🦥🐿️👶',       answer: 'Ice Age',                  keywords: ['ice age', 'iceage', 'sid', 'manny'] },
  { id: 'em22', category: 'movies', emojis: '🐍✈️😱🆘',        answer: 'Snakes on a Plane',        keywords: ['snakes', 'snakes on a plane', 'snakes plane'] },
  { id: 'em23', category: 'movies', emojis: '🔨⚡👑🌩️',       answer: 'Thor',                     keywords: ['thor', 'hammer', 'mjolnir'] },
  { id: 'em24', category: 'movies', emojis: '🦸‍♂️🛡️⭐🇺🇸',    answer: 'Captain America',          keywords: ['captain america', 'cap', 'steve rogers'] },
  { id: 'em25', category: 'movies', emojis: '🧤💎✨💥',        answer: 'Avengers',                 keywords: ['avengers', 'infinity war', 'endgame', 'thanos'] },
  { id: 'em26', category: 'movies', emojis: '🐼🥋🍜🏔️',       answer: 'Kung Fu Panda',            keywords: ['kung fu panda', 'panda', 'po'] },
  { id: 'em27', category: 'movies', emojis: '👨‍🚀🌍🥔🔴',      answer: 'The Martian',              keywords: ['martian', 'mars'] },
  { id: 'em28', category: 'movies', emojis: '🧟‍♂️🌍🔫🏃',      answer: 'World War Z',              keywords: ['world war z', 'zombie'] },
  { id: 'em29', category: 'movies', emojis: '🦁🐗🐒🎶',       answer: 'The Jungle Book',          keywords: ['jungle book', 'mowgli', 'baloo'] },
  { id: 'em30', category: 'movies', emojis: '🏠👻😱🎃',        answer: 'The Conjuring',            keywords: ['conjuring'] },

  // ── Cricket Players ──
  { id: 'cr1',  category: 'cricket', emojis: '🏏👑🇮🇳🏃‍♂️',    answer: 'Virat Kohli',              keywords: ['virat', 'kohli', 'king kohli'] },
  { id: 'cr2',  category: 'cricket', emojis: '🏏🚁6️⃣🏆',      answer: 'MS Dhoni',                 keywords: ['dhoni', 'msd', 'mahi', 'ms dhoni', 'captain cool'] },
  { id: 'cr3',  category: 'cricket', emojis: '🏏🙏💯🇮🇳',      answer: 'Sachin Tendulkar',         keywords: ['sachin', 'tendulkar', 'god of cricket', 'master blaster'] },
  { id: 'cr4',  category: 'cricket', emojis: '🏏🦵🔄🇦🇺',      answer: 'Shane Warne',              keywords: ['warne', 'shane warne', 'warnie'] },
  { id: 'cr5',  category: 'cricket', emojis: '🏏📊9️⃣9️⃣🐐',     answer: 'Don Bradman',              keywords: ['bradman', 'don bradman', 'don'] },
  { id: 'cr6',  category: 'cricket', emojis: '🏏🏆8️⃣3️⃣🇮🇳',    answer: 'Kapil Dev',                keywords: ['kapil', 'kapil dev'] },
  { id: 'cr7',  category: 'cricket', emojis: '🏏6️⃣6️⃣6️⃣🇯🇲',    answer: 'Chris Gayle',              keywords: ['gayle', 'chris gayle', 'universe boss'] },
  { id: 'cr8',  category: 'cricket', emojis: '🏏🧱🛡️🇮🇳',      answer: 'Rahul Dravid',             keywords: ['dravid', 'rahul dravid', 'wall', 'the wall'] },
  { id: 'cr9',  category: 'cricket', emojis: '🏏💨🎯🇮🇳',       answer: 'Jasprit Bumrah',           keywords: ['bumrah', 'jasprit', 'jasprit bumrah'] },
  { id: 'cr10', category: 'cricket', emojis: '🏏🧤🇱🇰💯',      answer: 'Kumar Sangakkara',         keywords: ['sangakkara', 'sanga', 'kumar sangakkara'] },
  { id: 'cr11', category: 'cricket', emojis: '🏏👊🇼🇮🏖️',      answer: 'Viv Richards',             keywords: ['viv', 'richards', 'viv richards', 'vivian'] },
  { id: 'cr12', category: 'cricket', emojis: '🏏🎯🇮🇳2️⃣0️⃣0️⃣',  answer: 'Rohit Sharma',             keywords: ['rohit', 'sharma', 'hitman', 'rohit sharma'] },
  { id: 'cr13', category: 'cricket', emojis: '🏏🤵🇳🇿🏔️',      answer: 'Kane Williamson',          keywords: ['kane', 'williamson', 'kane williamson'] },
  { id: 'cr14', category: 'cricket', emojis: '🏏💨🔄🇵🇰',      answer: 'Wasim Akram',              keywords: ['wasim', 'akram', 'wasim akram', 'sultan of swing'] },
  { id: 'cr15', category: 'cricket', emojis: '🏏💣6️⃣🇵🇰',      answer: 'Shahid Afridi',            keywords: ['afridi', 'shahid afridi', 'boom boom', 'lala'] },
  { id: 'cr16', category: 'cricket', emojis: '🏏🔬🏋️🇦🇺',      answer: 'Steve Smith',              keywords: ['smith', 'steve smith'] },
  { id: 'cr17', category: 'cricket', emojis: '🏏🔄3️⃣6️⃣0️⃣🇿🇦',  answer: 'AB de Villiers',           keywords: ['ab', 'de villiers', 'abd', 'mr 360', 'ab de villiers'] },
  { id: 'cr18', category: 'cricket', emojis: '🏏6️⃣6️⃣6️⃣6️⃣6️⃣6️⃣🇮🇳', answer: 'Yuvraj Singh',         keywords: ['yuvraj', 'yuvi', 'yuvraj singh'] },
  { id: 'cr19', category: 'cricket', emojis: '🏏⚖️🇧🇩💪',      answer: 'Shakib Al Hasan',          keywords: ['shakib', 'shakib al hasan'] },
  { id: 'cr20', category: 'cricket', emojis: '🏏🔥🏴󠁧󠁢󠁥󠁮󠁧󠁿🏆',  answer: 'Ben Stokes',               keywords: ['stokes', 'ben stokes'] },
];

// Hints map - sent after 15s
const HINTS = {
  em1: 'Disney — a cub becomes king of the savanna',
  em2: 'Marvel — a teenager bitten by a spider',
  em3: 'Let it go! Disney ice princess',
  em4: 'Robots that disguise as vehicles',
  em5: 'An unsinkable ship meets an iceberg',
  em6: 'One ring to rule them all',
  em7: 'Dinosaurs brought back to life on an island',
  em8: 'Gotham city, a bat and a clown',
  em9: 'Who you gonna call?',
  em10: 'Captain Jack Sparrow sails the seas',
  em11: 'A scientist turns green when angry',
  em12: 'A rat who dreams of being a Parisian chef',
  em13: 'Pixar — talking race cars',
  em14: 'A clownfish dad searches the ocean for his son',
  em15: 'Three wishes from a magic lamp',
  em16: 'To infinity and beyond!',
  em17: 'A great white shark terrorizes a beach town',
  em18: 'Red pill or blue pill?',
  em19: 'May the Force be with you',
  em20: 'A giant ape on top of the Empire State Building',
  em21: 'Prehistoric animals survive glacial conditions',
  em22: 'Reptiles aboard a flight — Samuel L. Jackson',
  em23: 'Norse god with a magical hammer',
  em24: 'Super-soldier with a star-spangled shield',
  em25: 'Earth\'s mightiest heroes assemble',
  em26: 'A chubby panda learns martial arts',
  em27: 'An astronaut stranded on the red planet',
  em28: 'Zombies take over the world — Brad Pitt',
  em29: 'A boy raised by wolves in the wild',
  em30: 'A paranormal investigation horror film',
  cr1: 'Indian captain, king of chases',
  cr2: 'Captain Cool, helicopter shot master',
  cr3: 'God of Cricket, 100 international centuries',
  cr4: 'Australian leg-spin legend, ball of the century',
  cr5: 'The greatest batsman, 99.94 average',
  cr6: '1983 World Cup winning captain of India',
  cr7: 'Universe Boss, T20 sixes king from Jamaica',
  cr8: 'The Wall — rock-solid Indian batsman',
  cr9: 'Indian pacer with an unorthodox bowling action',
  cr10: 'Sri Lankan batting legend, wicketkeeper',
  cr11: 'Master Blaster of the West Indies',
  cr12: 'Hitman — triple centurion in ODIs',
  cr13: 'New Zealand captain, classy batsman',
  cr14: 'Sultan of Swing from Pakistan',
  cr15: 'Boom Boom — Pakistan all-rounder known for big sixes',
  cr16: 'Australian batsman with an unusual technique',
  cr17: 'Mr. 360 — can hit anywhere on the field',
  cr18: 'Six sixes in an over, 2011 WC hero',
  cr19: 'Bangladesh all-rounder, best in the world at his peak',
  cr20: 'England hero of the 2019 World Cup final',
};

/**
 * Normalize a string: lowercase, trim, strip special characters, collapse spaces.
 */
function normalize(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
}

/**
 * Simple Levenshtein distance for fuzzy matching.
 */
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Check if a player's answer is correct.
 * 1. Exact normalized match
 * 2. Substring containment (answer inside guess or vice-versa)
 * 3. Keyword match — ANY single keyword found in the guess
 * 4. Fuzzy match — Levenshtein distance within tolerance
 */
function isAnswerCorrect(playerAnswer, correctAnswer, keywords = []) {
  const normPlayer = normalize(playerAnswer);
  const normCorrect = normalize(correctAnswer);

  if (!normPlayer) return false;

  // 1. Exact match
  if (normPlayer === normCorrect) return true;

  // 2. Substring containment — guess contains the answer or vice-versa
  if (normPlayer.includes(normCorrect)) return true;
  if (normCorrect.includes(normPlayer) && normPlayer.length >= normCorrect.length * 0.5) return true;

  // 3. Keyword match — if ANY keyword is found in the guess
  if (keywords.length > 0) {
    const playerWords = normPlayer.split(' ');
    for (const kw of keywords) {
      const normKw = normalize(kw);
      if (!normKw) continue;
      // Multi-word keyword: check if contained as phrase
      if (normKw.includes(' ')) {
        if (normPlayer.includes(normKw)) return true;
      } else {
        // Single-word keyword: check if any player word matches
        if (playerWords.includes(normKw)) return true;
      }
    }
  }

  // 4. Fuzzy match — allow small typos (distance <= 2 for short, <= 3 for long answers)
  const maxDist = normCorrect.length <= 8 ? 1 : normCorrect.length <= 15 ? 2 : 3;
  if (levenshtein(normPlayer, normCorrect) <= maxDist) return true;

  // 5. Fuzzy keyword match — allow 1 typo per keyword
  for (const kw of keywords) {
    const normKw = normalize(kw);
    if (!normKw || normKw.includes(' ')) continue;
    const playerWords = normPlayer.split(' ');
    for (const pw of playerWords) {
      if (pw.length >= 3 && levenshtein(pw, normKw) <= 1) return true;
    }
  }

  return false;
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
        const hint = HINTS[q2?.id] || null;
        this.broadcast({ type: 'ROUND_HINT', hint });
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

    const correct = isAnswerCorrect(action.answer || '', q.answer, q.keywords);

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
