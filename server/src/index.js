import 'dotenv/config';
import { createServer } from 'http';
import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';

import { connectDB } from './db/connection.js';
import { handleConnection } from './server.js';
import authRoutes from './routes/auth.js';
import leaderboardRoutes from './routes/leaderboard.js';
import adminRoutes from './routes/admin.js';
import contactRoutes from './routes/contact.js';
import userRoutes from './routes/user.js';
import questionsRoutes from './routes/questions.js';
import { getUserFromToken } from './auth/google.js';
import { User } from './db/User.js';

const PORT = process.env.PORT || 3001;

// Parse CORS origins (supports comma-separated list)
// Always include production frontend and localhost
const defaultOrigins = [
    'https://blades-frontend.onrender.com',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000'
];
const envOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : [];
const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

console.log('Allowed CORS origins:', allowedOrigins);

// Express app for HTTP routes
const app = express();
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            console.log('Blocked by CORS:', origin);
            console.log('Allowed origins are:', allowedOrigins);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json({ limit: '5mb' }));

// Auth middleware
app.use((req, res, next) => {
    const token = req.headers.authorization;
    if (token) {
        const user = getUserFromToken(token);
        if (user) {
            req.userId = user.userId;
            req.username = user.username;
        }
    }
    next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/user', userRoutes);
app.use('/api/questions', questionsRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now(), server: 'nexus-arena' });
});

// Create HTTP server
const server = createServer(app);

// WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (socket, req) => {
    handleConnection(socket, req);
});

// Expose wss to Express routes (for online player count)
app.locals.wss = wss;

wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
});

// Seed admin user
async function seedAdmin() {
    try {
        const existing = await User.findOne({ username: 'admin', role: 'admin' });
        if (!existing) {
            const admin = new User({
                username: 'admin',
                email: 'admin@site.com',
                role: 'admin',
                avatar: ''
            });
            await admin.save();
            console.log('👑 Admin user seeded (username: admin)');
        } else {
            console.log('👑 Admin user exists');
        }
    } catch (err) {
        console.warn('⚠️ Failed to seed admin:', err.message);
    }
}

// Start server
async function start() {
    // Connect to MongoDB (optional - game works without it)
    try {
        await connectDB();
        console.log('✅ MongoDB connected');
        await seedAdmin();
    } catch (err) {
        console.warn('⚠️ MongoDB not connected - running without database');
        console.warn('   Auth/leaderboard features disabled');
    }

    server.listen(PORT, () => {
        console.log(`🎮 Game server running on port ${PORT}`);
        console.log(`📡 WebSocket: ws://localhost:${PORT}`);
        console.log(`🌐 API: http://localhost:${PORT}/api`);
    });
}

start();
