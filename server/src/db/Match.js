import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
    roomCode: {
        type: String,
        required: true
    },
    players: [{
        odId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        odUsername: String
    }],
    winner: {
        odId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        username: String
    },
    duration: Number, // seconds
    finalScores: {
        player1Health: Number,
        player2Health: Number
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    endedAt: Date
});

export const Match = mongoose.model('Match', matchSchema);
