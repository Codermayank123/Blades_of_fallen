import { getUserFromToken } from './google.js';
import { User } from '../db/User.js';

// Require authentication - verifies JWT token
export function requireAuth(req, res, next) {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const userData = getUserFromToken(token);
    if (!userData || !userData.userId) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.userId = userData.userId;
    req.username = userData.username;
    next();
}

// Require admin role - must be used AFTER requireAuth
export async function requireAdmin(req, res, next) {
    try {
        const user = await User.findById(req.userId);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        req.user = user;
        next();
    } catch (err) {
        return res.status(500).json({ error: 'Server error' });
    }
}
