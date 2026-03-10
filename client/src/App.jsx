import { useState, useCallback } from 'react'
import { useWebSocket } from './hooks/useWebSocket'
import { useAudio } from './hooks/useAudio'
import SplashScreen from './screens/SplashScreen'
import LoginScreen from './screens/LoginScreen'
import LobbyScreen from './screens/LobbyScreen'
import GameScreen from './screens/GameScreen'
import ResultsScreen from './screens/ResultsScreen'
import ProfileScreen from './screens/ProfileScreen'
import LeaderboardScreen from './screens/LeaderboardScreen'
import AboutScreen from './screens/AboutScreen'
import HowToPlayScreen from './screens/HowToPlayScreen'
import ContactScreen from './screens/ContactScreen'
import AdminDashboard from './screens/AdminDashboard'
import BombRelayScreen from './screens/BombRelayScreen'
import GemHeistScreen from './screens/GemHeistScreen'
import NeonDriftScreen from './screens/NeonDriftScreen'
import CricketProScreen from './screens/CricketProScreen'
import WelcomeScreen from './screens/WelcomeScreen'
import TopNav from './components/TopNav'

function App() {
    // Screen routing logic
    const [screen, setScreenRaw] = useState(() => {
        // Always start on the welcome screen for both new and returning users.
        // The welcome screen itself decides whether to send the user to login or lobby.
        return 'welcome';
    })
    const setScreen = (s) => {
        setScreenRaw(s);
        localStorage.setItem('currentScreen', s);
    }
    const [username, setUsername] = useState('')
    const [roomInfo, setRoomInfo] = useState(null)
    const [gameResult, setGameResult] = useState(null)
    const [playerId, setPlayerId] = useState(null)
    const [gameState, setGameState] = useState(null)
    const [currentGameType, setCurrentGameType] = useState('duel')
    const [authToken, setAuthToken] = useState(localStorage.getItem('token'))
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('user'))
        } catch { return null }
    })

    const { playSFX } = useAudio();

    const handleMessage = useCallback((msg) => {
        console.log('Message:', msg.type, msg)

        switch (msg.type) {
            case 'CONNECTED': {
                setPlayerId(msg.playerId)
                // Re-send username immediately on connect/reconnect
                // so server always has the real callsign, not Player_XXXXXX
                const tok = localStorage.getItem('token');
                const u = localStorage.getItem('user');
                if (tok && u) {
                    try {
                        const userData = JSON.parse(u);
                        if (userData?.username) {
                            // Will be sent after the current render cycle via send
                            setTimeout(() => {
                                send({ type: 'SET_USERNAME', username: userData.username, token: tok });
                            }, 50);
                        }
                    } catch (e) { /* ignore */ }
                }
                break;
            }
            case 'ROOM_CREATED':
            case 'ROOM_JOINED':
                setRoomInfo(msg.room)
                if (msg.room?.gameType) setCurrentGameType(msg.room.gameType)
                setScreen('lobby')
                break
            case 'PLAYER_JOINED':
            case 'PLAYER_READY':
            case 'ROOM_UPDATE':
                setRoomInfo(msg.room)
                break
            case 'COUNTDOWN':
                // Fill timer countdown — update room info with countdown state
                setRoomInfo(prev => prev ? {
                    ...prev,
                    countdown: msg.seconds,
                    countdownMessage: msg.message,
                    playerCount: msg.playerCount,
                    maxPlayers: msg.maxPlayers,
                } : prev)
                break
            case 'GAME_START':
                // Store as both the base gameState AND as lastMessage
                // so individual game screens can react to GAME_START
                setGameState({ ...msg, lastMessage: msg })
                if (msg.gameType) setCurrentGameType(msg.gameType)
                // Route to correct game screen
                const gt = msg.gameType || 'duel';
                if (gt === 'duel') setScreen('game')
                else setScreen('game_' + gt)
                break
            case 'STATE_UPDATE':
                setGameState(msg)
                break
            case 'TIMER_START':
                setGameState(prev => prev ? { ...prev, timer: msg.timer, timerStarted: true } : prev)
                break

            // Multi-game message types (pass-through to active game screen)
            case 'QUESTION':
            case 'ROUND_START':
            case 'ROUND_END':
            case 'GAME_STATE':
            case 'TURN':
            case 'TAP_GO':
            case 'TAP_RESULT':
            case 'FLIP_RESULT':
            case 'ANSWER_RESULT':
            case 'SPRINT_TICK':
            case 'SPRINT_BOOST':
            case 'BALL_BOWLED':
            case 'SHOT_RESULT':
            case 'BATTER_CHANGE':
            // Bomb Relay Royale
            case 'BOMB_TICK':
            case 'BOMB_PASS':
            case 'BOMB_EXPLODE':
            case 'BOMB_ROUND':
            // Territory / Gem Heist Arena
            case 'TERRITORY_TICK':
            case 'TERRITORY_CAPTURE':
            case 'TERRITORY_ABILITY':
            case 'HEIST_TICK':
            case 'HEIST_GEM_COLLECT':
            case 'HEIST_GEM_DEPOSIT':
            case 'HEIST_GEM_STEAL':
            case 'HEIST_GOLD_SPAWN':
            // Neon Drift Arena
            case 'DRIFT_TICK':
            case 'DRIFT_BOOST':
            case 'DRIFT_CHECKPOINT':
            case 'DRIFT_COLLISION':
            case 'DRIFT_LAP':
            case 'DRIFT_FINISH':
            // Cricket Clash Pro
            case 'CRICKET_BALL':
            case 'CRICKET_SHOT':
            case 'CRICKET_RESULT':
            case 'CRICKET_CHANGE':
            case 'CRICKET_OVER':
            case 'CRICKET_PHASE':
            case 'CRICKET_BOWL_CHOICE':
            case 'CRICKET_INNINGS_CHANGE':
                setGameState(prev => ({ ...prev, lastMessage: msg }))
                break

            case 'GAME_OVER':
                // Pass to game screen FIRST so it can show its own summary
                setGameState(prev => ({ ...prev, lastMessage: msg }))
                setGameResult(msg)
                if (msg.players) {
                    setGameState(prev => ({ ...prev, players: msg.players, lastMessage: msg }))
                }
                if (msg.winner === playerId) {
                    playSFX('victory');
                }
                // Refresh user profile from DB so stats are up to date
                {
                    const tok = localStorage.getItem('token');
                    if (tok) {
                        const isProduction = window.location.protocol === 'https:';
                        const apiUrl = import.meta.env.VITE_API_URL || (isProduction
                            ? `https://${window.location.hostname.replace('frontend', 'backend')}/api`
                            : 'http://localhost:3001/api');
                        fetch(`${apiUrl}/user/profile`, {
                            headers: { Authorization: `Bearer ${tok}` }
                        })
                            .then(r => r.ok ? r.json() : null)
                            .then(data => {
                                if (data?.user) {
                                    setUser(data.user);
                                    localStorage.setItem('user', JSON.stringify(data.user));
                                }
                            })
                            .catch(() => { /* ignore */ });
                    }
                }
                setTimeout(() => {
                    setScreen('results')
                }, 4000)
                break
            case 'ROOM_LEFT':
                setRoomInfo(null)
                setScreen('lobby')
                break
            case 'ERROR':
                console.error('Server error:', msg.error)
                alert(msg.error)
                break
        }
    }, [playerId, playSFX])

    // Auto-detect production vs development
    const isProduction = window.location.protocol === 'https:';
    const WS_URL = import.meta.env.VITE_WS_URL || (isProduction
        ? `wss://${window.location.hostname.replace('frontend', 'backend')}`
        : 'ws://localhost:3001');

    const { send, connected } = useWebSocket(
        WS_URL,
        { onMessage: handleMessage }
    )

    const handleArenaReady = useCallback(() => {
        send({ type: 'ARENA_READY' });
    }, [send]);

    const handleLogin = (name, token, userData) => {
        setUsername(name)
        if (token) setAuthToken(token)
        if (userData) setUser(userData)
        send({ type: 'SET_USERNAME', username: name, token })

        // Admin users go to admin dashboard
        if (userData?.role === 'admin') {
            setScreen('admin')
        } else {
            setScreen('lobby')
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('currentScreen')
        setAuthToken(null)
        setUser(null)
        setUsername('')
        setScreen('login')
    }

    const handleCreateRoom = (gameType = 'duel') => {
        setCurrentGameType(gameType)
        send({ type: 'CREATE_ROOM', gameType })
    }

    const handleJoinRoom = (roomCode) => {
        send({ type: 'JOIN_ROOM', roomCode })
    }

    const handleQuickMatch = (gameType = 'duel') => {
        setCurrentGameType(gameType)
        send({ type: 'QUICK_MATCH', gameType })
    }

    const handleReady = () => {
        send({ type: 'READY' })
    }

    const handleLeaveRoom = () => {
        send({ type: 'LEAVE_ROOM' })
        setRoomInfo(null)
    }

    const handlePlayAgain = () => {
        setGameResult(null)
        setRoomInfo(null)
        setGameState(null)
        setScreen('lobby')
    }

    const handleGameAction = (action) => {
        send({ type: 'GAME_ACTION', ...action })
    }

    const handleNavigate = (dest) => {
        setScreen(dest)
    }

    // Show TopNav on all screens except splash, login, welcome, and active game screens
    const showNav = !['splash', 'login', 'welcome', 'game', 'game_quiz', 'game_memory', 'game_street_sprint', 'game_cricket_clash', 'game_reaction_tap', 'game_bomb_relay', 'game_territory', 'game_neon_drift', 'game_cricket_pro'].includes(screen);

    return (
        <div className="app">
            {showNav && (
                <TopNav
                    currentScreen={screen}
                    onNavigate={handleNavigate}
                    user={user}
                />
            )}

            {screen === 'welcome' && (
                <WelcomeScreen onEnter={() => {
                    localStorage.setItem('hasSeenIntro', 'true');
                    // After the welcome screen, always take the user to the login screen
                    // so they can choose how to enter (guest or Google), even if a token exists.
                    setScreen('login');
                }} />
            )}
            {screen === 'splash' && (
                <SplashScreen onEnter={() => setScreen('login')} />
            )}
            {screen === 'login' && (
                <LoginScreen onLogin={handleLogin} connected={connected} />
            )}
            {screen === 'lobby' && (
                <LobbyScreen
                    username={username}
                    user={user}
                    roomInfo={roomInfo}
                    onCreateRoom={handleCreateRoom}
                    onJoinRoom={handleJoinRoom}
                    onQuickMatch={handleQuickMatch}
                    onReady={handleReady}
                    onLeaveRoom={handleLeaveRoom}
                    onProfile={() => setScreen('profile')}
                    onLeaderboard={() => setScreen('leaderboard')}
                    onLogout={handleLogout}
                />
            )}
            {screen === 'game' && (
                <GameScreen
                    send={send}
                    playerId={playerId}
                    roomInfo={roomInfo}
                    gameState={gameState}
                    onArenaReady={handleArenaReady}
                />
            )}
            {screen === 'game_bomb_relay' && (
                <BombRelayScreen
                    playerId={playerId}
                    gameState={{ ...gameState, send }}
                    onLeave={handlePlayAgain}
                />
            )}
            {screen === 'game_territory' && (
                <GemHeistScreen
                    playerId={playerId}
                    gameState={{ ...gameState, send }}
                    onLeave={handlePlayAgain}
                />
            )}
            {screen === 'game_neon_drift' && (
                <NeonDriftScreen
                    playerId={playerId}
                    gameState={{ ...gameState, send }}
                    onLeave={handlePlayAgain}
                />
            )}
            {screen === 'game_cricket_pro' && (
                <CricketProScreen
                    playerId={playerId}
                    gameState={{ ...gameState, send }}
                    onLeave={handlePlayAgain}
                />
            )}
            {screen === 'results' && (
                <ResultsScreen
                    result={gameResult}
                    playerId={playerId}
                    onPlayAgain={handlePlayAgain}
                />
            )}
            {screen === 'profile' && (
                <ProfileScreen
                    user={user}
                    onBack={() => setScreen('lobby')}
                />
            )}
            {screen === 'leaderboard' && (
                <LeaderboardScreen
                    currentUser={user}
                    onBack={() => setScreen('lobby')}
                />
            )}
            {screen === 'about' && (
                <AboutScreen onBack={() => setScreen('lobby')} />
            )}
            {screen === 'howtoplay' && (
                <HowToPlayScreen onBack={() => setScreen('lobby')} />
            )}
            {screen === 'contact' && (
                <ContactScreen onBack={() => setScreen('lobby')} />
            )}
            {screen === 'admin' && (
                <AdminDashboard
                    user={user}
                    onBack={() => setScreen('lobby')}
                    onLogout={handleLogout}
                />
            )}
        </div>
    )
}

export default App
