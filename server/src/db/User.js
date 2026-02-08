import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    // Authentication
    googleId: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true },

    // Profile
    username: { type: String, required: true, unique: true },
    avatar: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now },

    // Level & XP
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },

    // ELO Rating
    elo: { type: Number, default: 1000 },
    peakElo: { type: Number, default: 1000 },
    rank: { type: String, default: 'Bronze' },

    // Match Statistics
    stats: {
        wins: { type: Number, default: 0 },
        losses: { type: Number, default: 0 },
        draws: { type: Number, default: 0 },
        totalMatches: { type: Number, default: 0 },
        kills: { type: Number, default: 0 },
        deaths: { type: Number, default: 0 },
        winStreak: { type: Number, default: 0 },
        bestWinStreak: { type: Number, default: 0 }
    },

    // Season data
    seasonStats: [{
        season: Number,
        elo: Number,
        rank: String,
        wins: Number,
        losses: Number,
        endDate: Date
    }],

    // Match history (last 50)
    matchHistory: [{
        matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
        opponent: String,
        result: { type: String, enum: ['win', 'loss', 'draw'] },
        eloChange: Number,
        date: { type: Date, default: Date.now }
    }]
});

// Calculate rank from ELO
UserSchema.methods.calculateRank = function () {
    const elo = this.elo;
    if (elo >= 3000) return 'Master';
    if (elo >= 2500) return 'Diamond';
    if (elo >= 2000) return 'Platinum';
    if (elo >= 1500) return 'Gold';
    if (elo >= 1000) return 'Silver';
    return 'Bronze';
};

// Update ELO after match
UserSchema.methods.updateElo = function (newElo, result) {
    this.elo = Math.max(0, newElo);
    if (this.elo > this.peakElo) {
        this.peakElo = this.elo;
    }
    this.rank = this.calculateRank();

    // Update stats
    this.stats.totalMatches++;
    if (result === 'win') {
        this.stats.wins++;
        this.stats.winStreak++;
        if (this.stats.winStreak > this.stats.bestWinStreak) {
            this.stats.bestWinStreak = this.stats.winStreak;
        }
    } else if (result === 'loss') {
        this.stats.losses++;
        this.stats.winStreak = 0;
    } else {
        this.stats.draws++;
    }
};

// Get win rate
UserSchema.methods.getWinRate = function () {
    const total = this.stats.wins + this.stats.losses;
    if (total === 0) return 0;
    return Math.round((this.stats.wins / total) * 100);
};

// Get K/D ratio
UserSchema.methods.getKD = function () {
    if (this.stats.deaths === 0) return this.stats.kills;
    return (this.stats.kills / this.stats.deaths).toFixed(2);
};

// XP and leveling
UserSchema.methods.addXP = function (amount) {
    this.xp += amount;
    const xpPerLevel = 100;
    while (this.xp >= this.level * xpPerLevel) {
        this.xp -= this.level * xpPerLevel;
        this.level++;
    }
};

// Get public profile
UserSchema.methods.getPublicProfile = function () {
    return {
        id: this._id,
        username: this.username,
        avatar: this.avatar,
        level: this.level,
        elo: this.elo,
        rank: this.rank,
        stats: this.stats,
        winRate: this.getWinRate(),
        kd: this.getKD(),
        matchHistory: (this.matchHistory || []).slice(0, 10) // Last 10 matches
    };
};

// Indexes for leaderboard queries
UserSchema.index({ elo: -1 });
UserSchema.index({ 'stats.wins': -1 });
UserSchema.index({ level: -1 });

export const User = mongoose.model('User', UserSchema);
