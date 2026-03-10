import express from 'express';
import { requireAuth, requireAdmin } from '../auth/middleware.js';
import { User } from '../db/User.js';
import { Match } from '../db/Match.js';
import { Contact } from '../db/Contact.js';

const router = express.Router();

// All admin routes require auth + admin role
router.use(requireAuth);
router.use(requireAdmin);

// GET /api/admin/users — list users with stats
router.get('/users', async (req, res) => {
    try {
        const { page = 1, limit = 50, search = '' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const filter = search
            ? { username: { $regex: search, $options: 'i' } }
            : {};

        const users = await User.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .select('username email avatar role level elo rank stats lastLogin createdAt googleId');

        const total = await User.countDocuments(filter);

        res.json({
            users: users.map(u => ({
                id: u._id,
                username: u.username,
                email: u.email || '',
                avatar: u.avatar,
                role: u.role,
                level: u.level,
                elo: u.elo,
                rank: u.rank,
                stats: u.stats,
                lastLogin: u.lastLogin,
                createdAt: u.createdAt,
                verified: !!u.googleId
            })),
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (err) {
        console.error('Admin users error:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// GET /api/admin/users/:id — user detail + match history
router.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const matches = await Match.find({
            'players.userId': user._id
        }).sort({ createdAt: -1 }).limit(50);

        res.json({
            user: {
                ...user.getPublicProfile(),
                email: user.email,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt,
                verified: !!user.googleId
            },
            matches
        });
    } catch (err) {
        console.error('Admin user detail error:', err);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// GET /api/admin/matches — match history with filters
router.get('/matches', async (req, res) => {
    try {
        const { page = 1, limit = 50, gameType, username, startDate, endDate } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const filter = {};
        if (gameType) filter.gameType = gameType;
        if (username) filter['players.username'] = { $regex: username, $options: 'i' };
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const matches = await Match.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Match.countDocuments(filter);

        res.json({
            matches,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (err) {
        console.error('Admin matches error:', err);
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
});

// GET /api/admin/analytics — totals and stats
router.get('/analytics', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalMatches = await Match.countDocuments();
        const totalContacts = await Contact.countDocuments();
        // Fix: handle contacts missing `resolved` field (count where resolved !== true)
        const unresolvedContacts = await Contact.countDocuments({ resolved: { $ne: true } });

        // Match counts per game type
        const matchesByGameRaw = await Match.aggregate([
            { $group: { _id: '$gameType', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Ensure all 5 game modes appear (even with 0 matches)
        const allModes = ['duel', 'bomb_relay', 'territory', 'neon_drift', 'cricket_pro'];
        const rawMap = {};
        for (const m of matchesByGameRaw) {
            rawMap[m._id] = m.count;
        }
        const matchesByGame = allModes.map(mode => ({
            gameType: mode,
            count: rawMap[mode] || 0
        }));

        // Most played game
        const mostPlayed = matchesByGameRaw.length > 0 ? matchesByGameRaw[0]._id : 'duel';

        // Recent activity (matches in last 7 days)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentMatches = await Match.countDocuments({ createdAt: { $gte: weekAgo } });
        const recentUsers = await User.countDocuments({ createdAt: { $gte: weekAgo } });

        // Top players
        const topPlayers = await User.find()
            .sort({ elo: -1 })
            .limit(5)
            .select('username elo rank avatar');

        // Online players from WebSocket server (only count OPEN sockets)
        const wss = req.app.locals.wss;
        let onlinePlayers = 0;
        if (wss) {
            for (const client of wss.clients) {
                if (client.readyState === 1) onlinePlayers++; // 1 = OPEN
            }
        } else {
            console.warn('Admin analytics: wss not found in app.locals — onlinePlayers will be 0');
        }

        res.json({
            totalUsers,
            totalMatches,
            totalContacts,
            unresolvedContacts,
            onlinePlayers,
            matchesByGame,
            mostPlayed,
            recentMatches,
            recentUsers,
            topPlayers
        });
    } catch (err) {
        console.error('Admin analytics error:', err);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// GET /api/admin/contacts — contact messages
router.get('/contacts', async (req, res) => {
    try {
        const { page = 1, limit = 50, resolved } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const filter = {};
        if (resolved !== undefined) filter.resolved = resolved === 'true';

        const contacts = await Contact.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Contact.countDocuments(filter);

        res.json({
            contacts,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (err) {
        console.error('Admin contacts error:', err);
        res.status(500).json({ error: 'Failed to fetch contacts' });
    }
});

// PATCH /api/admin/contacts/:id — toggle resolve
router.patch('/contacts/:id', async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);
        if (!contact) return res.status(404).json({ error: 'Contact not found' });

        contact.resolved = !contact.resolved;
        await contact.save();

        res.json({ contact });
    } catch (err) {
        console.error('Admin contact toggle error:', err);
        res.status(500).json({ error: 'Failed to update contact' });
    }
});

// POST /api/admin/reset — reset matches/contacts (dangerous)
router.post('/reset', async (req, res) => {
    try {
        const { target } = req.body; // 'matches', 'contacts', or 'all'

        if (target === 'matches' || target === 'all') {
            await Match.deleteMany({});
        }
        if (target === 'contacts' || target === 'all') {
            await Contact.deleteMany({});
        }

        res.json({ success: true, message: `Reset ${target} completed` });
    } catch (err) {
        console.error('Admin reset error:', err);
        res.status(500).json({ error: 'Failed to reset data' });
    }
});

export default router;
