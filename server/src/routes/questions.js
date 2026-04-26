import express from 'express';
import { getQuestionsByDifficulty, getRandomQuestions } from '../data/bugBountyQuestions.js';
import { getChallengesByCategory, getRandomChallenges } from '../data/algorithmChallenges.js';
import { getPuzzlesByType, getRandomPuzzles } from '../data/cipherClashPuzzles.js';
import { getScenariosByType, getRandomScenarios } from '../data/queryQuestScenarios.js';

const router = express.Router();

/**
 * GET /api/questions/:game
 * Query params: difficulty, category, type, count
 */
router.get('/:game', (req, res) => {
    const { game } = req.params;
    const { difficulty, category, type, count = '10' } = req.query;
    const n = Math.min(Number(count) || 10, 50);

    try {
        let questions;
        switch (game) {
            case 'bug_bounty':
                questions = difficulty
                    ? getQuestionsByDifficulty(difficulty, n)
                    : getRandomQuestions(n);
                break;
            case 'algo_arena':
                questions = category
                    ? getChallengesByCategory(category, n)
                    : getRandomChallenges(n);
                break;
            case 'cipher_clash':
                questions = type
                    ? getPuzzlesByType(type, n)
                    : getRandomPuzzles(n);
                break;
            case 'query_quest':
                questions = type
                    ? getScenariosByType(type, n)
                    : getRandomScenarios(n);
                break;
            default:
                return res.status(400).json({ error: `Unknown game type: ${game}` });
        }

        res.json({ questions, total: questions.length });
    } catch (err) {
        console.error('Questions fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch questions' });
    }
});

export default router;
