import 'dotenv/config';
import { createServer } from 'http';
import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';

import { connectDB } from './db/connection.js';
import { handleConnection } from './server.js';
import authRoutes from './routes/auth.js';
import leaderboardRoutes from './routes/leaderboard.js';
import { getUserFromToken } from './auth/google.js';

const PORT = process.env.PORT || 3001;

// Parse CORS origins (supports comma-separated list)
// Always include production frontend and localhost
const defaultOrigins = [
    'https://blades-frontend.onrender.com',
    'http://localhost:5173',
    'http://localhost:5174',
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
app.use(express.json());

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

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

// Create HTTP server
const server = createServer(app);

// WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (socket, req) => {
    handleConnection(socket, req);
});

wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
});

// Start server
async function start() {
    // Connect to MongoDB (optional - game works without it)
    try {
        await connectDB();
        console.log('✅ MongoDB connected');
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
