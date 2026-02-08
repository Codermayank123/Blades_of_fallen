// ELO rating calculation utilities

const K_FACTOR = 32; // Standard K-factor for competitive games

// Calculate expected score (probability of winning)
export function expectedScore(playerElo, opponentElo) {
    return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
}

// Calculate new ELO after a match
export function calculateEloChange(winnerElo, loserElo, isDraw = false) {
    const expectedWin = expectedScore(winnerElo, loserElo);
    const expectedLose = 1 - expectedWin;

    if (isDraw) {
        // Draw: both players move toward average
        const winnerChange = Math.round(K_FACTOR * (0.5 - expectedWin));
        const loserChange = Math.round(K_FACTOR * (0.5 - expectedLose));
        return {
            winnerNew: winnerElo + winnerChange,
            loserNew: loserElo + loserChange,
            winnerChange,
            loserChange
        };
    }

    // Winner gets points, loser loses points
    const winnerChange = Math.round(K_FACTOR * (1 - expectedWin));
    const loserChange = Math.round(K_FACTOR * (0 - expectedLose));

    return {
        winnerNew: Math.max(0, winnerElo + winnerChange),
        loserNew: Math.max(0, loserElo + loserChange),
        winnerChange,
        loserChange
    };
}

// Get rank tier from ELO
export function getRankFromElo(elo) {
    if (elo >= 3000) return { name: 'Master', icon: '👑', color: '#ff6b6b' };
    if (elo >= 2500) return { name: 'Diamond', icon: '💠', color: '#00d4ff' };
    if (elo >= 2000) return { name: 'Platinum', icon: '💎', color: '#00ffc8' };
    if (elo >= 1500) return { name: 'Gold', icon: '🥇', color: '#ffd700' };
    if (elo >= 1000) return { name: 'Silver', icon: '🥈', color: '#c0c0c0' };
    return { name: 'Bronze', icon: '🥉', color: '#cd7f32' };
}

// Season reset - soft reset toward 1000
export function seasonReset(currentElo) {
    const baseline = 1000;
    const resetRatio = 0.5; // 50% reset toward baseline
    return Math.round(baseline + (currentElo - baseline) * resetRatio);
}

// XP rewards
export const XP_REWARDS = {
    WIN: 50,
    LOSS: 20,
    DRAW: 30,
    KILL: 5,
    FIRST_WIN: 25 // Bonus for first win of the day
};
