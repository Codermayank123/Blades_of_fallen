import { BaseGameRoom } from './BaseGameRoom.js';
import { getRandomScenarios } from '../data/queryQuestScenarios.js';

export class QueryQuestRoom extends BaseGameRoom {
  constructor(roomCode, creatorId, options = {}) {
    super(roomCode, creatorId, 'query_quest', 8);
    this.rounds = options.rounds || 5;
    this.currentRound = 0;
    this.scenarios = [];
    this.roundTimer = null;
    this.roundTimeLimit = 60;
    this.roundAnswers = new Map();
  }

  getGameStartData() {
    return { rounds: this.rounds, roundTimeLimit: this.roundTimeLimit };
  }

  onStart() {
    this.scenarios = getRandomScenarios(this.rounds);
    this.startRound();
  }

  startRound() {
    if (this.currentRound >= this.scenarios.length) {
      this.finishGame();
      return;
    }
    const s = this.scenarios[this.currentRound];
    this.roundAnswers.clear();
    this.broadcast({
      type: 'ROUND_START',
      round: this.currentRound + 1,
      totalRounds: this.rounds,
      scenario: {
        id: s.id, type: s.type, difficulty: s.difficulty,
        scenario: s.scenario, hint: s.hint,
        ...(s.type === 'sql' ? { schema: s.schema } : {}),
        ...(s.type === 'regex' ? { testStrings: s.testStrings } : {}),
        keywords: s.keywords,
      },
      timeLimit: this.roundTimeLimit,
    });
    this.roundTimer = setTimeout(() => this.endRound(), this.roundTimeLimit * 1000);
  }

  handleGameAction(playerId, action) {
    if (action.action === 'SUBMIT_QUERY' && !this.roundAnswers.has(playerId)) {
      const s = this.scenarios[this.currentRound];
      if (!s) return;
      const query = (action.query || '').trim();
      let correct = false;
      let score = 0;
      const timeElapsed = action.timeElapsed || this.roundTimeLimit;

      if (s.type === 'sql') {
        // Check if query contains required keywords
        const keywordsFound = s.keywords.filter(kw =>
          query.toUpperCase().includes(kw.toUpperCase())
        ).length;
        const keywordScore = Math.floor((keywordsFound / s.keywords.length) * 100);
        // Check pattern match
        correct = s.expectedPattern.test(query);
        const speedBonus = Math.max(0, Math.floor((this.roundTimeLimit - timeElapsed) * 5));
        score = correct ? (200 + keywordScore + speedBonus) : keywordScore;
      } else if (s.type === 'regex') {
        try {
          const userRegex = new RegExp(query);
          // Test against sample strings
          let matchScore = 0;
          if (s.testStrings) {
            for (const ts of s.testStrings) {
              const expected = s.expectedPattern.test(ts);
              const actual = userRegex.test(ts);
              if (expected === actual) matchScore++;
            }
          }
          correct = matchScore === (s.testStrings?.length || 0);
          const accuracy = s.testStrings?.length ? matchScore / s.testStrings.length : 0;
          const speedBonus = Math.max(0, Math.floor((this.roundTimeLimit - timeElapsed) * 5));
          score = Math.floor(accuracy * 200) + (correct ? 100 + speedBonus : 0);
        } catch (e) {
          correct = false;
          score = 0;
        }
      }

      const isFirst = correct && this.roundAnswers.size === 0;
      if (isFirst) score += 150;

      this.roundAnswers.set(playerId, { query, correct, score });
      const player = this.players.get(playerId);
      if (player) player.score += score;

      this.sendTo(playerId, {
        type: 'ANSWER_RESULT', correct, points: score, firstCorrect: isFirst,
        sampleAnswer: s.sampleAnswer,
      });

      const connected = Array.from(this.players.values()).filter(p => p.connected);
      if (this.roundAnswers.size >= connected.length) {
        clearTimeout(this.roundTimer);
        setTimeout(() => this.endRound(), 2000);
      }
    }
  }

  endRound() {
    clearTimeout(this.roundTimer);
    const s = this.scenarios[this.currentRound];
    this.broadcast({
      type: 'ROUND_END', round: this.currentRound + 1,
      sampleAnswer: s?.sampleAnswer, queryType: s?.type,
      scores: this.getScoreBoard(),
    });
    this.currentRound++;
    setTimeout(() => this.startRound(), 3500);
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
