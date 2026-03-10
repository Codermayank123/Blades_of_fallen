import { BaseGameRoom } from './BaseGameRoom.js';
import { MSG } from '../utils/constants.js';

/**
 * Cricket Clash Pro — True multiplayer cricket (2 players)
 * - Two innings: each player bats 12 balls
 * - Bowler CHOOSES delivery (speed/line/length) within 5s
 * - Batter times their shot in a short window
 * - Outcome = bowler choice × batter timing accuracy
 */
export class CricketProRoom extends BaseGameRoom {
    constructor(roomCode, creatorId) {
        super(roomCode, creatorId, 'cricket_pro', 2);
        this.ballsPerInnings = 12;
        this.currentBall = 0;
        this.innings = 1;          // 1 or 2
        this.playerOrder = [];
        this.currentBatterIdx = 0;
        this.currentBowlerIdx = 1;
        this.scoreboard = {};      // playerId -> { runs, wickets, ballsFaced }
        // Phases: waiting | bowling_choice | ball_in_play | batting_window | result | innings_break | finished
        this.phase = 'waiting';
        this.ballTimer = null;
        this.battingWindow = null;
        this.bowlingTimer = null;
        this.ballData = null;
        this.ballLog = [];         // Array of { ball, batterId, bowlerId, delivery, timing, result }
    }

    getGameStartData() {
        this.playerOrder = Array.from(this.players.keys());
        this.currentBatterIdx = 0;
        this.currentBowlerIdx = this.playerOrder.length > 1 ? 1 : 0;

        for (const pid of this.playerOrder) {
            this.scoreboard[pid] = { runs: 0, wickets: 0, ballsFaced: 0 };
        }

        return {
            ballsPerInnings: this.ballsPerInnings,
            totalBalls: this.ballsPerInnings * 2,
            innings: this.innings,
            playerOrder: this.playerOrder.map(id => ({
                id,
                username: this.players.get(id)?.username
            })),
            scoreboard: this.scoreboard,
            batterId: this.playerOrder[this.currentBatterIdx],
            bowlerId: this.playerOrder[this.currentBowlerIdx],
        };
    }

    onStart() {
        setTimeout(() => this.startBowlingChoice(), 2000);
    }

    /** Phase 1: Bowler chooses delivery (5s window) */
    startBowlingChoice() {
        if (this.phase === 'finished') return;

        // Check if innings over
        if (this.currentBall >= this.ballsPerInnings) {
            if (this.innings === 1) {
                this.startSecondInnings();
                return;
            } else {
                this.finishGame();
                return;
            }
        }

        this.currentBall++;
        this.phase = 'bowling_choice';

        const batterId = this.playerOrder[this.currentBatterIdx];
        const bowlerId = this.playerOrder[this.currentBowlerIdx];

        this.ballData = {
            batterId,
            bowlerId,
            delivery: null,   // Will be set by bowler's choice
            shotPlayed: false,
            shotTiming: null,
        };

        // Tell everyone: bowler is choosing
        this.broadcast({
            type: MSG.CRICKET_PHASE,
            phase: 'bowling_choice',
            ball: this.currentBall,
            totalBalls: this.ballsPerInnings,
            innings: this.innings,
            batterId,
            batterUsername: this.players.get(batterId)?.username,
            bowlerId,
            bowlerUsername: this.players.get(bowlerId)?.username,
            countdown: 5,
            scoreboard: this.scoreboard,
            newBall: true,
        });

        // 5s timer for bowler to choose
        this.bowlingTimer = setTimeout(() => {
            // Auto-pick random delivery if bowler didn't choose
            if (!this.ballData.delivery) {
                this.ballData.delivery = {
                    speed: ['fast', 'medium', 'slow'][Math.floor(Math.random() * 3)],
                    line: ['offside', 'middle', 'legside'][Math.floor(Math.random() * 3)],
                    length: ['short', 'good', 'full'][Math.floor(Math.random() * 3)],
                };
            }
            this.deliverBall();
        }, 5500);
    }

    /** Phase 2: Ball travels to batter */
    deliverBall() {
        if (this.phase === 'finished') return;
        this.phase = 'ball_in_play';

        const { batterId, bowlerId, delivery } = this.ballData;

        // Calculate ball physics from delivery choice
        const speedMap = { fast: 0.85, medium: 0.55, slow: 0.3 };
        const swingMap = { offside: -0.25, middle: 0, legside: 0.25 };
        const bounceMap = { short: 0.25, good: 0.45, full: 0.7 };

        const speed = speedMap[delivery.speed] || 0.55;
        const swing = swingMap[delivery.line] + (Math.random() - 0.5) * 0.1;
        const bouncePoint = bounceMap[delivery.length] + (Math.random() - 0.5) * 0.05;

        this.ballData.ballPhysics = { speed, swing, bouncePoint };

        this.broadcast({
            type: MSG.CRICKET_BALL,
            ball: this.currentBall,
            totalBalls: this.ballsPerInnings,
            innings: this.innings,
            batterId,
            batterUsername: this.players.get(batterId)?.username,
            bowlerId,
            bowlerUsername: this.players.get(bowlerId)?.username,
            delivery,
            speed,
            swing,
            bouncePoint,
            scoreboard: this.scoreboard,
        });

        // After ball travel (1.5s), open batting window
        const travelTime = delivery.speed === 'fast' ? 1200 : (delivery.speed === 'slow' ? 2000 : 1500);
        this.ballTimer = setTimeout(() => {
            this.phase = 'batting_window';

            this.broadcast({
                type: MSG.CRICKET_PHASE,
                phase: 'batting_window',
                ball: this.currentBall,
                batterId,
                countdown: delivery.speed === 'fast' ? 0.6 : (delivery.speed === 'slow' ? 1.0 : 0.8),
            });

            // Batting window duration depends on speed (slightly wider for mobile friendliness)
            const windowMs = delivery.speed === 'fast' ? 800 : (delivery.speed === 'slow' ? 1200 : 1000);
            this.battingWindow = setTimeout(() => {
                if (!this.ballData.shotPlayed) {
                    this.resolveShot(batterId, null, 'dot');
                }
            }, windowMs);
        }, travelTime);
    }

    handleGameAction(playerId, action) {
        try {
            if (action.action === 'bowl_choice') {
                this.handleBowlChoice(playerId, action);
            } else if (action.action === 'play_shot') {
                this.playShot(playerId, action.timing, action.shotType);
            }
        } catch (err) {
            console.error('Cricket handleGameAction error:', err);
        }
    }

    /** Bowler submits their delivery choice */
    handleBowlChoice(playerId, action) {
        if (this.phase !== 'bowling_choice') return;
        if (playerId !== this.ballData?.bowlerId) return;
        if (this.ballData.delivery) return; // Already chose

        const validSpeeds = ['fast', 'medium', 'slow'];
        const validLines = ['offside', 'middle', 'legside'];
        const validLengths = ['short', 'good', 'full'];

        this.ballData.delivery = {
            speed: validSpeeds.includes(action.speed) ? action.speed : 'medium',
            line: validLines.includes(action.line) ? action.line : 'middle',
            length: validLengths.includes(action.length) ? action.length : 'good',
        };

        // Immediately broadcast that bowler has chosen (but don't reveal choice to batter)
        this.broadcast({
            type: MSG.CRICKET_BOWL_CHOICE,
            bowlerId: playerId,
            bowlerUsername: this.players.get(playerId)?.username,
            chosen: true, // Don't reveal actual choice to batter
        });

        // Cancel timeout and deliver immediately
        if (this.bowlingTimer) clearTimeout(this.bowlingTimer);
        // Small delay so batter sees "bowler chose!" message
        setTimeout(() => this.deliverBall(), 800);
    }

    playShot(playerId, timing, shotType) {
        if (this.phase !== 'batting_window') return;
        if (playerId !== this.ballData?.batterId) return;
        if (this.ballData.shotPlayed) return;

        this.ballData.shotPlayed = true;
        this.ballData.shotTiming = timing;

        if (this.battingWindow) clearTimeout(this.battingWindow);

        // Calculate outcome: bowler delivery × batter timing
        const accuracy = 1 - Math.abs((timing || 0.5) - 0.5) * 2; // 0=miss, 1=perfect
        const delivery = this.ballData.delivery;
        const result = this.calculateOutcome(accuracy, delivery, shotType);

        this.resolveShot(playerId, shotType, result);
    }

    /** Core outcome engine: delivery properties × batting accuracy × shot type */
    calculateOutcome(accuracy, delivery, shotType) {
        const rand = Math.random();

        // Fast balls are harder to hit but more rewarding
        // Slow balls are easier but give fewer big shots
        // Good length is hardest to score off
        // Full length is best for boundaries if timed well
        // Short length = pull shot opportunity but risky

        let difficultyMod = 0;
        if (delivery.speed === 'fast') difficultyMod += 0.15;
        if (delivery.speed === 'slow') difficultyMod -= 0.10;
        if (delivery.length === 'good') difficultyMod += 0.10;
        if (delivery.length === 'full') difficultyMod -= 0.05;
        if (delivery.line === 'offside') difficultyMod += 0.05;

        // Shot type modifiers: reward matching shot to delivery
        let shotBonus = 0;
        if (shotType === 'drive' && delivery.length === 'full') shotBonus = 0.12;
        else if (shotType === 'pull' && delivery.length === 'short') shotBonus = 0.12;
        else if (shotType === 'cut' && delivery.line === 'offside') shotBonus = 0.10;
        else if (shotType === 'sweep' && delivery.line === 'legside') shotBonus = 0.10;
        else if (shotType === 'defend') { shotBonus = 0.05; difficultyMod -= 0.15; } // Defend is safer
        // Wrong shot choice penalty
        if (shotType === 'pull' && delivery.length === 'full') shotBonus = -0.10;
        if (shotType === 'drive' && delivery.length === 'short') shotBonus = -0.10;

        const effectiveAccuracy = Math.max(0, Math.min(1, accuracy - difficultyMod + shotBonus));

        if (effectiveAccuracy > 0.80) {
            // Excellent timing
            if (shotType === 'defend') {
                return rand < 0.15 ? 2 : (rand < 0.50 ? 1 : 0);
            }
            if (delivery.length === 'full') {
                return rand < 0.40 ? 6 : (rand < 0.75 ? 4 : 2);
            }
            return rand < 0.20 ? 6 : (rand < 0.55 ? 4 : (rand < 0.80 ? 2 : 1));
        } else if (effectiveAccuracy > 0.55) {
            // Good timing
            if (shotType === 'defend') {
                return rand < 0.25 ? 1 : 0;
            }
            return rand < 0.10 ? 4 : (rand < 0.35 ? 2 : (rand < 0.65 ? 1 : 0));
        } else if (effectiveAccuracy > 0.30) {
            // Decent timing
            return rand < 0.05 ? 2 : (rand < 0.30 ? 1 : (rand < 0.60 ? 0 : 'W'));
        } else {
            // Poor timing — high wicket chance (defend reduces risk)
            if (shotType === 'defend') {
                return rand < 0.25 ? 'W' : 0;
            }
            return rand < 0.50 ? 'W' : (rand < 0.75 ? 0 : 1);
        }
    }

    resolveShot(batterId, shotType, result) {
        this.phase = 'result';

        const runs = result === 'W' ? 0 : (result === 'dot' ? 0 : result);
        const isWicket = result === 'W';
        const isDot = result === 'dot' || result === 0;

        // Update scoreboard
        this.scoreboard[batterId].ballsFaced++;
        if (isWicket) {
            this.scoreboard[batterId].wickets++;
        } else {
            this.scoreboard[batterId].runs += runs;
            const player = this.players.get(batterId);
            if (player) player.score += runs * 10;
        }

        // Log ball
        this.ballLog.push({
            ball: this.currentBall,
            innings: this.innings,
            batterId,
            bowlerId: this.ballData?.bowlerId,
            delivery: this.ballData?.delivery,
            timing: this.ballData?.shotTiming,
            result: isWicket ? 'W' : runs,
        });

        this.broadcast({
            type: MSG.CRICKET_RESULT,
            ball: this.currentBall,
            totalBalls: this.ballsPerInnings,
            innings: this.innings,
            batterId,
            batterUsername: this.players.get(batterId)?.username,
            bowlerId: this.ballData?.bowlerId,
            bowlerUsername: this.players.get(this.ballData?.bowlerId)?.username,
            delivery: this.ballData?.delivery,
            shotType: shotType || 'defend',
            result: isWicket ? 'W' : runs,
            runs,
            isWicket,
            isDot: isDot && !isWicket,
            accuracy: this.ballData?.shotTiming,
            scoreboard: this.scoreboard,
            ballLog: this.ballLog.slice(-6), // Last 6 balls
        });

        this.eventsLog.push({
            type: 'ball',
            playerId: batterId,
            data: { ball: this.currentBall, result, shotType }
        });

        // Next ball after 2.5s
        setTimeout(() => this.startBowlingChoice(), 2500);
    }

    startSecondInnings() {
        this.innings = 2;
        this.currentBall = 0;

        // Swap batter/bowler
        this.currentBatterIdx = 1;
        this.currentBowlerIdx = 0;

        const batterId = this.playerOrder[this.currentBatterIdx];
        const bowlerId = this.playerOrder[this.currentBowlerIdx];

        // Target to chase
        const target = this.scoreboard[bowlerId].runs + 1;

        this.broadcast({
            type: MSG.CRICKET_INNINGS_CHANGE,
            innings: 2,
            batterId,
            batterUsername: this.players.get(batterId)?.username,
            bowlerId,
            bowlerUsername: this.players.get(bowlerId)?.username,
            target,
            scoreboard: this.scoreboard,
        });

        // Start after 4s break
        setTimeout(() => this.startBowlingChoice(), 4000);
    }

    finishGame() {
        this.phase = 'finished';

        // Winner = highest runs
        let winnerId = null;
        let maxRuns = -1;
        for (const [pid, sb] of Object.entries(this.scoreboard)) {
            if (sb.runs > maxRuns) {
                maxRuns = sb.runs;
                winnerId = pid;
            }
        }

        // Check for tie
        const scores = Object.values(this.scoreboard).map(s => s.runs);
        const isTie = scores.length === 2 && scores[0] === scores[1];

        // Set final scores
        for (const [pid, sb] of Object.entries(this.scoreboard)) {
            const player = this.players.get(pid);
            if (player) player.score = sb.runs * 10;
        }

        this.endGame(isTie ? null : winnerId, 'complete');
    }

    getMatchMeta() {
        return {
            ballsPerInnings: this.ballsPerInnings,
            scoreboard: this.scoreboard,
            ballLog: this.ballLog,
        };
    }

    cleanup() {
        if (this.ballTimer) clearTimeout(this.ballTimer);
        if (this.battingWindow) clearTimeout(this.battingWindow);
        if (this.bowlingTimer) clearTimeout(this.bowlingTimer);
    }
}
