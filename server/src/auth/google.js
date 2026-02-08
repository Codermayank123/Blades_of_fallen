import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRY = '7d';

// Verify Google ID token
export async function verifyGoogleToken(idToken) {
    try {
        // Verify with Google's tokeninfo endpoint
        const response = await fetch(
            `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
        );

        if (!response.ok) {
            throw new Error('Invalid token');
        }

        const payload = await response.json();

        // Verify the audience matches our client ID
        if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
            throw new Error('Token audience mismatch');
        }

        return {
            googleId: payload.sub,
            email: payload.email,
            name: payload.name || payload.email.split('@')[0],
            picture: payload.picture
        };
    } catch (error) {
        console.error('Google token verification failed:', error);
        throw new Error('Invalid Google token');
    }
}

// Generate JWT for session
export function generateToken(userId, username) {
    return jwt.sign(
        { userId, username },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
    );
}

// Verify JWT
export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

// Middleware to extract user from token
export function getUserFromToken(token) {
    if (!token) return null;

    // Remove 'Bearer ' prefix if present
    const cleanToken = token.startsWith('Bearer ')
        ? token.slice(7)
        : token;

    return verifyToken(cleanToken);
}
