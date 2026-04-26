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
import WelcomeScreen from './screens/WelcomeScreen'
import PixelCodeScreen from './screens/PixelCodeScreen'
import StackSmashScreen from './screens/StackSmashScreen'
import EmojiEscapeScreen from './screens/EmojiEscapeScreen'
import MemeWarsScreen from './screens/MemeWarsScreen'
import TopNav from './components/TopNav'
import ChatPanel from './components/ChatPanel'
import VoicePanel from './components/VoicePanel'

function App() {
    // Always start at welcome — never restore game/admin screens from localStorage
    const [screen, setScreenRaw] = useState('welcome')
    const setScreen = (s) => {
        setScreenRaw(s);
        // Only persist safe nav screens, not game or admin screens
        const persistable = ['lobby', 'profile', 'leaderboard', 'about', 'howtoplay', 'contact'];
        if (persistable.includes(s)) {
            localStorage.setItem('currentScreen', s);
        } else {
            localStorage.removeItem('currentScreen');
        }
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
                const tok = localStorage.getItem('token');
                const u = localStorage.getItem('user');
                if (tok && u) {
                    try {
                        const userData = JSON.parse(u);
                        if (userData?.username) {
                            // Send immediately — no setTimeout race condition
                            send({ type: 'SET_USERNAME', username: userData.username, token: tok });
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
                // Spread to new object so React always re-renders player list
                setRoomInfo(msg.room ? { ...msg.room } : null)
                break
            case 'COUNTDOWN':
                setRoomInfo(prev => prev ? {
                    ...prev,
                    countdown: msg.seconds,
                    countdownMessage: msg.message,
                    playerCount: msg.playerCount,
                    maxPlayers: msg.maxPlayers,
                } : prev)
                break
            case 'GAME_START':
                setGameState({ ...msg, lastMessage: msg })
                if (msg.gameType) setCurrentGameType(msg.gameType)
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

            // Coding/fun game message types — forwarded as lastMessage to all game screens
            case 'QUESTION':
            case 'ROUND_START':
            case 'ROUND_END':
            case 'ROUND_HINT':
            case 'GAME_STATE':
            case 'TURN':
            case 'ANSWER_RESULT':
            case 'VOTING_START':
            case 'AI_JUDGING':
                setGameState(prev => ({ ...prev, lastMessage: msg }))
                break

            // Chat messages (also forwarded to game state for ChatPanel)
            case 'CHAT_MESSAGE':
                setGameState(prev => ({ ...prev, lastMessage: msg }))
                break

            case 'GAME_OVER':
                setGameState(prev => ({ ...prev, lastMessage: msg }))
                setGameResult(msg)
                if (msg.players) {
                    setGameState(prev => ({ ...prev, players: msg.players, lastMessage: msg }))
                }
                if (msg.winner === playerId) {
                    playSFX('victory');
                }
                // Refresh user profile
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
        // Clear any stale screen from a previous session
        localStorage.removeItem('currentScreen')
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

    const handleCreateRoom = (gameType = 'duel', gameOptions = {}) => {
        setCurrentGameType(gameType)
        send({ type: 'CREATE_ROOM', gameType, gameOptions })
    }

    const handleJoinRoom = (roomCode) => {
        send({ type: 'JOIN_ROOM', roomCode })
    }

    const handleQuickMatch = (gameType = 'duel', gameOptions = {}) => {
        setCurrentGameType(gameType)
        send({ type: 'QUICK_MATCH', gameType, gameOptions })
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
        const isAdmin = user?.role === 'admin';
        // Admin auth guard: admins cannot access game screens
        if (isAdmin && ['lobby', 'game', 'game_pixel_code', 'game_stack_smash', 'game_emoji_escape', 'game_meme_wars', 'howtoplay'].includes(dest)) {
            setScreen('admin');
            return;
        }
        // Player auth guard: non-admins cannot access admin
        if (!isAdmin && dest === 'admin') {
            setScreen('lobby');
            return;
        }
        setScreen(dest)
    }

    // Active game screens where we hide nav
    const gameScreens = ['game', 'game_pixel_code', 'game_stack_smash', 'game_emoji_escape', 'game_meme_wars'];
    const showNav = !['splash', 'login', 'welcome', ...gameScreens].includes(screen);
    const isInGame = gameScreens.includes(screen);

    // Build gameState with send function for game screens
    const gameStateWithSend = gameState ? { ...gameState, send } : { send };

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
                    playerId={playerId}
                    roomInfo={roomInfo}
                    onCreateRoom={handleCreateRoom}
                    onJoinRoom={handleJoinRoom}
                    onQuickMatch={handleQuickMatch}
                    onReady={handleReady}
                    onLeaveRoom={handleLeaveRoom}
                    onProfile={() => setScreen('profile')}
                    onLeaderboard={() => setScreen('leaderboard')}
                    onLogout={handleLogout}
                    onNavigate={handleNavigate}
                    send={send}
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
            {screen === 'game_pixel_code' && (
                <PixelCodeScreen
                    playerId={playerId}
                    gameState={gameStateWithSend}
                    onLeave={handlePlayAgain}
                />
            )}
            {screen === 'game_stack_smash' && (
                <StackSmashScreen
                    playerId={playerId}
                    gameState={gameStateWithSend}
                    onLeave={handlePlayAgain}
                />
            )}
            {screen === 'game_emoji_escape' && (
                <EmojiEscapeScreen
                    playerId={playerId}
                    gameState={gameStateWithSend}
                    onLeave={handlePlayAgain}
                />
            )}
            {screen === 'game_meme_wars' && (
                <MemeWarsScreen
                    playerId={playerId}
                    gameState={gameStateWithSend}
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

            {/* Floating Chat & Voice (visible during games and lobby) */}
            {(isInGame || screen === 'lobby') && roomInfo && (
                <>
                    <ChatPanel
                        gameState={gameStateWithSend}
                        playerId={playerId}
                        playerName={username}
                    />
                    <VoicePanel
                        gameState={gameStateWithSend}
                        playerId={playerId}
                    />
                </>
            )}
        </div>
    )
}

export default App
