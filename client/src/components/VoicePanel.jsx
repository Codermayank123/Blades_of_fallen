import { useState, useEffect, useRef } from 'react';

export default function VoicePanel({ gameState, playerId }) {
    const [isInVoice, setIsInVoice] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [voiceUsers, setVoiceUsers] = useState([]);
    const [micPermission, setMicPermission] = useState('prompt'); // 'prompt' | 'granted' | 'denied'
    const localStreamRef = useRef(null);

    useEffect(() => {
        if (!gameState?.lastMessage) return;
        const msg = gameState.lastMessage;

        if (msg.type === 'VOICE_JOIN' && msg.senderId) {
            setVoiceUsers(prev => prev.includes(msg.senderId) ? prev : [...prev, msg.senderId]);
        }
        if (msg.type === 'VOICE_LEAVE' && msg.senderId) {
            setVoiceUsers(prev => prev.filter(id => id !== msg.senderId));
        }
    }, [gameState?.lastMessage]);

    const joinVoice = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStreamRef.current = stream;
            setMicPermission('granted');
            setIsInVoice(true);
            gameState?.send?.({ type: 'VOICE_JOIN' });
            setVoiceUsers(prev => prev.includes(playerId) ? prev : [...prev, playerId]);
        } catch (err) {
            console.error('Mic access denied:', err);
            setMicPermission('denied');
        }
    };

    const leaveVoice = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
            localStreamRef.current = null;
        }
        setIsInVoice(false);
        setIsMuted(false);
        gameState?.send?.({ type: 'VOICE_LEAVE' });
        setVoiceUsers(prev => prev.filter(id => id !== playerId));
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            const track = localStreamRef.current.getAudioTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                setIsMuted(!track.enabled);
            }
        }
    };

    useEffect(() => () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
        }
    }, []);

    return (
        <div style={{
            position: 'fixed', bottom: 80, right: 80, zIndex: 45,
        }}>
            {!isInVoice ? (
                <button onClick={joinVoice} style={{
                    width: 44, height: 44, borderRadius: '50%',
                    border: '1px solid rgba(52,211,153,0.3)',
                    background: 'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(34,211,238,0.1))',
                    color: '#34d399', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.1rem',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                    transition: 'all 0.25s',
                }}
                title="Join Voice Chat"
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 20px rgba(52,211,153,0.3)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)'}
                >
                    🎤
                </button>
            ) : (
                <div style={{
                    background: 'linear-gradient(145deg, rgba(12,12,20,0.98), rgba(6,6,9,0.99))',
                    border: '1px solid rgba(52,211,153,0.2)',
                    borderRadius: 14, padding: '12px 16px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                    minWidth: 160,
                }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginBottom: 10,
                    }}>
                        <span style={{
                            fontSize: '0.7rem', fontWeight: 700, color: '#34d399',
                            fontFamily: 'var(--f-mono)', letterSpacing: 1.5,
                            textTransform: 'uppercase',
                        }}>🎤 Voice</span>
                        <span style={{
                            fontSize: '0.6rem', color: 'var(--c-text-off)',
                        }}>{voiceUsers.length} connected</span>
                    </div>

                    {/* Voice users */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                        {voiceUsers.map(id => (
                            <div key={id} style={{
                                fontSize: '0.75rem',
                                color: id === playerId ? '#34d399' : 'var(--c-text-dim)',
                                fontWeight: id === playerId ? 600 : 400,
                            }}>
                                {id === playerId ? '● You' : `● User ${id.slice(0, 5)}`}
                                {id === playerId && isMuted && <span style={{ color: '#ef4444', marginLeft: 4 }}>🔇</span>}
                            </div>
                        ))}
                    </div>

                    {/* Controls */}
                    <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={toggleMute} style={{
                            flex: 1, padding: '6px 0', borderRadius: 8,
                            border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                            background: isMuted ? 'rgba(239,68,68,0.15)' : 'rgba(52,211,153,0.15)',
                            color: isMuted ? '#ef4444' : '#34d399',
                        }}>
                            {isMuted ? '🔇 Muted' : '🔊 Mic On'}
                        </button>
                        <button onClick={leaveVoice} style={{
                            padding: '6px 12px', borderRadius: 8,
                            border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                            background: 'rgba(239,68,68,0.1)', color: '#f87171',
                        }}>Leave</button>
                    </div>

                    {micPermission === 'denied' && (
                        <p style={{ fontSize: '0.65rem', color: '#ef4444', marginTop: 6, margin: 0 }}>
                            Mic access denied. Check browser settings.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
