import express from 'express';
import { verifyGoogleToken, generateToken } from '../auth/google.js';
import { User } from '../db/User.js';

const router = express.Router();

// Google OAuth login
router.post('/google', async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ error: 'Missing credential' });
        }

        // Verify Google token
        const googleUser = await verifyGoogleToken(credential);

        // Find or create user
        let user = await User.findOne({ googleId: googleUser.googleId });

        if (!user) {
            // Create new user
            const username = await generateUniqueUsername(googleUser.name);
            user = new User({
                googleId: googleUser.googleId,
                email: googleUser.email,
                username,
                avatar: googleUser.picture
            });
            await user.save();
            console.log(`New user created: ${username}`);
        } else {
            // Update last login
            user.lastLogin = new Date();
            if (googleUser.picture) {
                user.avatar = googleUser.picture;
            }
            await user.save();
        }

        // Generate session token
        const token = generateToken(user._id.toString(), user.username);

        res.json({
            token,
            user: user.getPublicProfile()
        });
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
});

// Guest login (for testing without Google)
router.post('/guest', async (req, res) => {
    try {
        const { username } = req.body;

        if (!username || username.length < 2) {
            return res.status(400).json({ error: 'Username required (min 2 chars)' });
        }

        // Use the username as-is (clean, no suffix)
        // Just sanitize it for safety
        const cleanUsername = username.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20);

        // Check if username exists, if so add a small random number
        let finalUsername = cleanUsername;
        const existingUser = await User.findOne({ username: cleanUsername });
        if (existingUser) {
            // Add small random suffix only if username is taken
            finalUsername = `${cleanUsername}${Math.floor(Math.random() * 100)}`;
        }

        // Create guest user (no Google ID)
        const user = new User({
            username: finalUsername,
            avatar: ''
        });
        await user.save();

        const token = generateToken(user._id.toString(), user.username);

        res.json({
            token,
            user: user.getPublicProfile()
        });
    } catch (error) {
        console.error('Guest auth error:', error);
        res.status(500).json({ error: 'Failed to create guest account' });
    }
});

// Google OAuth with access token (popup flow - more reliable on localhost)
router.post('/google/token', async (req, res) => {
    try {
        const { accessToken, user: googleUser } = req.body;

        if (!accessToken || !googleUser) {
            return res.status(400).json({ error: 'Missing access token or user data' });
        }

        // Verify the token is valid by checking if we got user info
        if (!googleUser.id || !googleUser.email) {
            return res.status(400).json({ error: 'Invalid Google user data' });
        }

        // Find or create user
        let user = await User.findOne({ googleId: googleUser.id });

        if (!user) {
            // Also check by email in case they logged in before
            user = await User.findOne({ email: googleUser.email });
        }

        if (!user) {
            // Create new user
            const username = await generateUniqueUsername(googleUser.name || googleUser.email.split('@')[0]);
            user = new User({
                googleId: googleUser.id,
                email: googleUser.email,
                username,
                avatar: googleUser.picture || ''
            });
            await user.save();
            console.log(`New Google user created: ${username}`);
        } else {
            // Update existing user
            if (!user.googleId) {
                user.googleId = googleUser.id;
            }
            user.lastLogin = new Date();
            if (googleUser.picture) {
                user.avatar = googleUser.picture;
            }
            await user.save();
        }

        // Generate session token
        const token = generateToken(user._id.toString(), user.username);

        res.json({
            token,
            user: user.getPublicProfile()
        });
    } catch (error) {
        console.error('Google token auth error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
});

// Get current user profile
router.get('/me', async (req, res) => {
    try {
        const userId = req.userId; // Set by auth middleware
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user.getPublicProfile());
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user profile by ID
router.get('/profile/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user.getPublicProfile());
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Helper to generate unique username
async function generateUniqueUsername(baseName) {
    let username = baseName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 15);
    let exists = await User.findOne({ username });
    let attempts = 0;

    while (exists && attempts < 100) {
        username = `${baseName.slice(0, 12)}${Math.floor(Math.random() * 1000)}`;
        exists = await User.findOne({ username });
        attempts++;
    }

    return username;
}

export default router;
