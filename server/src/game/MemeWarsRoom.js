import { BaseGameRoom } from './BaseGameRoom.js';

// ── Easier, well-structured meme templates with clear prompts ──────────
const MEME_TEMPLATES = [
  {
    id: 'mw1', name: 'When the Code Works',
    emoji: '😱',
    description: 'Your code works on the first try — what do you say?',
    prompt: 'Write what you say when your code works first try',
    category: 'coding',
    keywords: ['code', 'works', 'first', 'try', 'bug', 'magic', 'impossible', 'believe', 'run', 'compile'],
  },
  {
    id: 'mw2', name: 'Monday Morning',
    emoji: '😴',
    description: 'How you feel on Monday morning before coffee',
    prompt: 'Describe your Monday morning mood',
    category: 'relatable',
    keywords: ['monday', 'morning', 'coffee', 'sleep', 'tired', 'bed', 'alarm', 'hate', 'zombie', 'dead'],
  },
  {
    id: 'mw3', name: 'My Browser Tabs',
    emoji: '💻',
    description: 'You have 47 browser tabs open — name the craziest one',
    prompt: 'Name the weirdest tab in your 47 open tabs',
    category: 'coding',
    keywords: ['tab', 'browser', 'stack', 'overflow', 'google', 'search', 'how', 'why', 'tutorial', 'random'],
  },
  {
    id: 'mw4', name: 'Boss Walks In',
    emoji: '😰',
    description: 'Your boss walks in while you\'re slacking off — what\'s your excuse?',
    prompt: 'Quick excuse when the boss catches you slacking',
    category: 'relatable',
    keywords: ['boss', 'work', 'research', 'meeting', 'project', 'testing', 'review', 'important', 'studying'],
  },
  {
    id: 'mw5', name: 'Error 404',
    emoji: '🔥',
    description: 'Production is down at 3 AM — what\'s your first thought?',
    prompt: 'First thought when production crashes at 3 AM',
    category: 'coding',
    keywords: ['server', 'down', 'crash', 'deploy', 'friday', 'fix', 'blame', 'sleep', 'panic', 'git'],
  },
  {
    id: 'mw6', name: 'New Framework',
    emoji: '✨',
    description: 'A new JavaScript framework just dropped — name it',
    prompt: 'Make up a name for a new JS framework',
    category: 'coding',
    keywords: ['react', 'vue', 'angular', 'next', 'fast', 'light', 'blazing', 'quantum', 'ultra', 'js'],
  },
  {
    id: 'mw7', name: 'Plot Twist',
    emoji: '🎬',
    description: 'The biggest plot twist in your life',
    prompt: 'Describe a funny life plot twist',
    category: 'relatable',
    keywords: ['actually', 'turns', 'out', 'surprise', 'never', 'expected', 'twist', 'whole', 'time'],
  },
  {
    id: 'mw8', name: 'WiFi Down',
    emoji: '📵',
    description: 'The WiFi goes out — what do you do first?',
    prompt: 'First thing you do when WiFi dies',
    category: 'relatable',
    keywords: ['wifi', 'internet', 'phone', 'data', 'outside', 'book', 'panic', 'router', 'restart'],
  },
  {
    id: 'mw9', name: 'Stack Overflow',
    emoji: '🙏',
    description: 'Your prayer to Stack Overflow when stuck on a bug',
    prompt: 'Write a prayer to Stack Overflow',
    category: 'coding',
    keywords: ['please', 'help', 'answer', 'copy', 'paste', 'error', 'solution', 'save', 'question'],
  },
  {
    id: 'mw10', name: 'Pet Thoughts',
    emoji: '🐱',
    description: 'What your pet is thinking right now',
    prompt: 'What is your pet thinking?',
    category: 'relatable',
    keywords: ['food', 'sleep', 'play', 'human', 'treat', 'walk', 'toy', 'why', 'look', 'love'],
  },
  {
    id: 'mw11', name: 'Git Commit Message',
    emoji: '📝',
    description: 'Write the most honest git commit message ever',
    prompt: 'Write a brutally honest git commit message',
    category: 'coding',
    keywords: ['fix', 'bug', 'works', 'idk', 'please', 'final', 'again', 'maybe', 'hopefully', 'done'],
  },
  {
    id: 'mw12', name: 'Explain Like I\'m 5',
    emoji: '👶',
    description: 'Explain your job to a 5-year-old',
    prompt: 'How would you explain your job to a kid?',
    category: 'relatable',
    keywords: ['computer', 'make', 'things', 'work', 'magic', 'buttons', 'screen', 'money', 'people'],
  },
];

const CAPTION_TIME = 30; // seconds to write caption
const AI_JUDGE_DELAY = 3; // seconds to "think" before showing results

// ── AI Caption Scoring Engine ──────────────────────────────────────────
function scoreCaption(captionText, template) {
  const text = captionText.toLowerCase().trim();
  const words = text.split(/\s+/);
  let score = 0;

  // 1. Length score (0-20): sweet spot is 15-80 chars
  const len = text.length;
  if (len >= 15 && len <= 80) score += 20;
  else if (len >= 8 && len <= 120) score += 12;
  else if (len >= 3) score += 5;

  // 2. Relevance to template keywords (0-30)
  const keywords = template.keywords || [];
  let keywordHits = 0;
  for (const kw of keywords) {
    if (text.includes(kw.toLowerCase())) keywordHits++;
  }
  score += Math.min(30, keywordHits * 10);

  // 3. Humor indicators (0-25)
  // Exclamation/question marks signal energy
  if (/[!?]{1,3}/.test(text)) score += 5;
  // ALL CAPS words (shouting = funny)
  const capsWords = captionText.split(/\s+/).filter(w => w.length > 2 && w === w.toUpperCase());
  if (capsWords.length > 0 && capsWords.length <= 4) score += 6;
  // Common humor patterns
  const humorPatterns = [
    /^when /i, /^me:/i, /^nobody:/i, /^pov:/i, /^plot twist/i,
    /but then/i, /turns out/i, /not gonna lie/i, /ngl/i,
    /\.\.\./,  // suspense dots
    /lol|lmao|bruh|bro|nah|fr/i,  // slang
  ];
  for (const p of humorPatterns) {
    if (p.test(text)) { score += 4; break; }
  }
  // Contrast/comparison (funny structure)
  if (/\bvs\.?\b|\bbut\b|\bwhile\b|\binstead\b|\bexcept\b/i.test(text)) score += 5;
  // Emojis add personality
  if (/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}]/u.test(captionText)) score += 5;

  // 4. Creativity (0-25)
  // Unique word count — more varied vocabulary = more creative
  const uniqueWords = new Set(words.filter(w => w.length > 2));
  score += Math.min(10, uniqueWords.size * 2);
  // Not just repeating the template text
  const templateWords = (template.name + ' ' + template.description).toLowerCase().split(/\s+/);
  const overlap = words.filter(w => templateWords.includes(w)).length;
  const overlapRatio = words.length > 0 ? overlap / words.length : 1;
  if (overlapRatio < 0.3) score += 10; // reward originality
  else if (overlapRatio < 0.6) score += 5;
  // Has some structure (not just one word)
  if (words.length >= 3) score += 5;

  // 5. Random factor (±8) for variety so it's not perfectly deterministic
  score += Math.floor(Math.random() * 17) - 8;

  // Clamp to 0-100
  return Math.max(0, Math.min(100, score));
}

function getAIComment(score) {
  if (score >= 80) return '🔥 Absolutely legendary!';
  if (score >= 65) return '😂 Genuinely funny!';
  if (score >= 50) return '👍 Solid caption!';
  if (score >= 35) return '🤔 Not bad, decent effort';
  if (score >= 20) return '😐 Could use more spice';
  return '💤 Needs more creativity';
}

export class MemeWarsRoom extends BaseGameRoom {
  constructor(roomCode, creatorId, options = {}) {
    super(roomCode, creatorId, 'meme_wars', 8);
    this.rounds = options.rounds || 4;
    this.currentRound = 0;
    this.templates = [];
    this.phase = 'caption';       // 'caption' | 'judging' | 'results'
    this.captions = new Map();    // playerId -> caption text
    this.captionTimer = null;
    this.judgeTimer = null;
  }

  getGameStartData() {
    return { rounds: this.rounds, captionTime: CAPTION_TIME, gameType: 'meme_wars' };
  }

  onStart() {
    this.templates = [...MEME_TEMPLATES].sort(() => Math.random() - 0.5).slice(0, this.rounds);
    this.startRound();
  }

  startRound() {
    if (this.currentRound >= this.templates.length) { this.finishGame(); return; }
    const t = this.templates[this.currentRound];
    this.captions.clear();
    this.phase = 'caption';

    this.broadcast({
      type: 'ROUND_START',
      round: this.currentRound + 1,
      totalRounds: this.rounds,
      phase: 'caption',
      meme: {
        id: t.id, name: t.name, emoji: t.emoji,
        description: t.description, prompt: t.prompt,
        category: t.category,
      },
      timeLimit: CAPTION_TIME,
    });

    this.captionTimer = setTimeout(() => this.startJudging(), CAPTION_TIME * 1000);
  }

  handleGameAction(playerId, action) {
    if (action.action === 'CAPTION' && this.phase === 'caption') {
      if (!this.captions.has(playerId)) {
        const text = String(action.caption || '').slice(0, 200).trim();
        if (text) {
          this.captions.set(playerId, text);
          // Bonus point for submitting on time
          const player = this.players.get(playerId);
          if (player) player.score += 10;
          this.sendTo(playerId, { type: 'ANSWER_RESULT', correct: true, points: 10, message: 'Caption submitted! +10 bonus' });
        }
      }
      // Start judging early if everyone submitted
      const connected = Array.from(this.players.values()).filter(p => p.connected).length;
      if (this.captions.size >= connected) {
        clearTimeout(this.captionTimer);
        this.startJudging();
      }
    }
    // No VOTE action needed — AI judges instead
  }

  startJudging() {
    clearTimeout(this.captionTimer);
    this.phase = 'judging';

    // Tell clients that AI is judging
    this.broadcast({
      type: 'AI_JUDGING',
      round: this.currentRound + 1,
      message: '🤖 AI Judge is evaluating captions...',
    });

    // Short delay to build suspense, then reveal results
    this.judgeTimer = setTimeout(() => this.revealResults(), AI_JUDGE_DELAY * 1000);
  }

  revealResults() {
    clearTimeout(this.judgeTimer);
    this.phase = 'results';

    const template = this.templates[this.currentRound];

    // Score each caption with AI
    const scored = [];
    for (const [pid, captionText] of this.captions) {
      const aiScore = scoreCaption(captionText, template);
      const comment = getAIComment(aiScore);
      scored.push({ playerId: pid, caption: captionText, aiScore, comment });
    }

    // Add entries for players who didn't submit
    for (const [id, p] of this.players) {
      if (!this.captions.has(id)) {
        scored.push({ playerId: id, caption: '(no submission)', aiScore: 0, comment: '💤 No submission' });
      }
    }

    // Sort by AI score descending
    scored.sort((a, b) => b.aiScore - a.aiScore);

    // Award points: 1st = 50, 2nd = 30, 3rd = 15, rest = 5
    const pointTiers = [50, 30, 15];
    scored.forEach((entry, i) => {
      const points = pointTiers[i] || 5;
      if (entry.aiScore > 0) { // Only award if they submitted
        const player = this.players.get(entry.playerId);
        if (player) player.score += points;
        entry.pointsAwarded = points;
      } else {
        entry.pointsAwarded = 0;
      }
    });

    const results = scored.map(s => ({
      id: s.playerId,
      username: this.players.get(s.playerId)?.username || '???',
      score: this.players.get(s.playerId)?.score || 0,
      caption: s.caption,
      aiScore: s.aiScore,
      aiComment: s.comment,
      pointsAwarded: s.pointsAwarded,
      votes: s.aiScore, // Use aiScore as "votes" for client compatibility
    }));

    this.broadcast({
      type: 'ROUND_END',
      round: this.currentRound + 1,
      results,
      scores: this.getScoreBoard(),
      aiJudged: true,
    });

    this.currentRound++;
    setTimeout(() => this.startRound(), 5000);
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
    clearTimeout(this.captionTimer);
    clearTimeout(this.judgeTimer);
  }
}
