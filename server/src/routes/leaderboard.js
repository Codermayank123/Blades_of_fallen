import express from 'express';
import { User } from '../db/User.js';
import { getRankFromElo } from '../utils/elo.js';

const router = express.Router();

// Get global leaderboard - only verified Google users
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Only include users with googleId (verified users, not guests)
        const verifiedFilter = { googleId: { $exists: true, $ne: null } };

        const players = await User.find(verifiedFilter)
            .sort({ elo: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .select('username avatar elo rank stats.wins stats.losses level googleId');

        const total = await User.countDocuments(verifiedFilter);

        const leaderboard = players.map((player, index) => ({
            position: skip + index + 1,
            id: player._id,
            username: player.username,
            avatar: player.avatar,
            elo: player.elo,
            rank: getRankFromElo(player.elo),
            level: player.level,
            wins: player.stats?.wins || 0,
            losses: player.stats?.losses || 0,
            winRate: player.stats?.wins + player.stats?.losses > 0
                ? Math.round((player.stats.wins / (player.stats.wins + player.stats.losses)) * 100)
                : 0,
            verified: true  // All users on leaderboard are verified
        }));

        res.json({
            leaderboard,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// Get player rank position (only counts verified users)
router.get('/rank/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Only count verified players (with googleId)
        const verifiedFilter = { googleId: { $exists: true, $ne: null } };

        // If user is not verified, return unranked
        if (!user.googleId) {
            return res.json({
                position: null,
                total: await User.countDocuments(verifiedFilter),
                percentile: null,
                elo: user.elo,
                rank: getRankFromElo(user.elo),
                verified: false,
                message: 'Sign in with Google to appear on the leaderboard'
            });
        }

        // Count verified players with higher ELO
        const position = await User.countDocuments({
            ...verifiedFilter,
            elo: { $gt: user.elo }
        }) + 1;
        const total = await User.countDocuments(verifiedFilter);

        res.json({
            position,
            total,
            percentile: Math.round((1 - position / total) * 100),
            elo: user.elo,
            rank: getRankFromElo(user.elo),
            verified: true
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get rank distribution
router.get('/distribution', async (req, res) => {
    try {
        const distribution = await User.aggregate([
            {
                $bucket: {
                    groupBy: '$elo',
                    boundaries: [0, 1000, 1500, 2000, 2500, 3000, 10000],
                    default: 'Other',
                    output: { count: { $sum: 1 } }
                }
            }
        ]);

        const ranks = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master'];
        const result = distribution.map((bucket, index) => ({
            rank: ranks[index] || 'Master',
            count: bucket.count,
            ...getRankFromElo(bucket._id === 'Other' ? 3000 : bucket._id)
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
