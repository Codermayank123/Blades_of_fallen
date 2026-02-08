import { useState, useCallback } from 'react'
import { useWebSocket } from './hooks/useWebSocket'
import { useAudio } from './hooks/useAudio'
import LoginScreen from './screens/LoginScreen'
import LobbyScreen from './screens/LobbyScreen'
import GameScreen from './screens/GameScreen'
import ResultsScreen from './screens/ResultsScreen'
import ProfileScreen from './screens/ProfileScreen'
import LeaderboardScreen from './screens/LeaderboardScreen'

function App() {
    const [screen, setScreen] = useState('login')
    const [username, setUsername] = useState('')
    const [roomInfo, setRoomInfo] = useState(null)
    const [gameResult, setGameResult] = useState(null)
    const [playerId, setPlayerId] = useState(null)
    const [gameState, setGameState] = useState(null)
    const [authToken, setAuthToken] = useState(localStorage.getItem('token'))
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('user'))
        } catch { return null }
    })

    const { playSFX } = useAudio();

    const handleMessage = useCallback((msg) => {
        console.log('Message:', msg.type)

        switch (msg.type) {
            case 'CONNECTED':
                setPlayerId(msg.playerId)
                break
            case 'ROOM_CREATED':
            case 'ROOM_JOINED':
                setRoomInfo(msg.room)
                setScreen('lobby')
                break
            case 'PLAYER_JOINED':
            case 'PLAYER_READY':
            case 'ROOM_UPDATE':
                // Update room info for all room state changes
                setRoomInfo(msg.room)
                break
            case 'GAME_START':
                setGameState(msg)
                setScreen('game')
                break
            case 'STATE_UPDATE':
                setGameState(msg)
                break
            case 'GAME_OVER':
                // Store the result and keep showing game screen for death animation
                setGameResult(msg)
                // Update game state one more time to show death animation
                if (msg.players) {
                    setGameState(prev => ({ ...prev, players: msg.players }))
                }
                // Play victory sound for winner immediately
                if (msg.winner === playerId) {
                    playSFX('victory');
                }
                // Delay transition to results to allow death animation to play
                setTimeout(() => {
                    setScreen('results')
                }, 2000)
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

    const { send, connected } = useWebSocket(
        import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
        { onMessage: handleMessage }
    )

    const handleLogin = (name, token, userData) => {
        setUsername(name)
        if (token) setAuthToken(token)
        if (userData) setUser(userData)
        send({ type: 'SET_USERNAME', username: name, token })
        setScreen('lobby')
    }

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setAuthToken(null)
        setUser(null)
        setUsername('')
        setScreen('login')
    }

    const handleCreateRoom = () => {
        send({ type: 'CREATE_ROOM' })
    }

    const handleJoinRoom = (roomCode) => {
        send({ type: 'JOIN_ROOM', roomCode })
    }

    const handleQuickMatch = () => {
        send({ type: 'QUICK_MATCH' })
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

    return (
        <div className="app">
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
        </div>
    )
}

export default App
