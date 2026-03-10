import express from 'express';
import { requireAuth } from '../auth/middleware.js';
import { User } from '../db/User.js';

const router = express.Router();

// GET /api/user/profile — get current user's full profile (fresh from DB)
router.get('/profile', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user: user.getPublicProfile() });
    } catch (err) {
        console.error('Profile fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// POST|PATCH /api/user/avatar — upload avatar (base64)
const avatarHandler = async (req, res) => {
    try {
        const { avatar } = req.body;

        if (!avatar) {
            return res.status(400).json({ error: 'Avatar data required' });
        }

        // Validate base64 image (rough check)
        if (!avatar.startsWith('data:image/')) {
            return res.status(400).json({ error: 'Invalid image format. Must be a base64 data URI.' });
        }

        // Check size (roughly 4MB limit for base64 which is ~3MB actual)
        if (avatar.length > 4 * 1024 * 1024) {
            return res.status(400).json({ error: 'Image too large. Max 3MB.' });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.avatar = avatar;
        await user.save();

        res.json({
            success: true,
            user: user.getPublicProfile()
        });
    } catch (err) {
        console.error('Avatar upload error:', err);
        res.status(500).json({ error: 'Failed to upload avatar' });
    }
};

router.post('/avatar', requireAuth, avatarHandler);
router.patch('/avatar', requireAuth, avatarHandler);

export default router;
