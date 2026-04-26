import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
    roomCode: {
        type: String,
        required: true
    },
    gameType: {
        type: String,
        enum: ['duel', 'pixel_code', 'stack_smash', 'emoji_escape', 'meme_wars',
               'bug_bounty', 'algo_arena', 'cipher_clash', 'query_quest',
               'bomb_relay', 'territory', 'neon_drift', 'cricket_pro',
               'code_quiz', 'bug_hunter', 'code_crash', 'meme_code'],
        default: 'duel'
    },
    players: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        username: String,
        avatar: String,
        score: { type: Number, default: 0 }
    }],
    winner: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        username: String
    },
    winnerName: String, // fallback winner display name
    duration: Number, // seconds
    // Keep existing duel fields for backward compatibility
    finalScores: {
        player1Health: Number,
        player2Health: Number
    },
    // Events log for all game types
    eventsLog: [{
        type: String,
        playerId: String,
        data: mongoose.Schema.Types.Mixed,
        timestamp: { type: Date, default: Date.now }
    }],
    // Mode-specific summary (bomb rounds, territory %, drift scores, cricket runs)
    meta: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    startedAt: { type: Date },
    endedAt: { type: Date },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for admin queries
matchSchema.index({ gameType: 1, createdAt: -1 });
matchSchema.index({ 'players.userId': 1 });

export const Match = mongoose.model('Match', matchSchema);
