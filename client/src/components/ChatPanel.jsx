import { useState, useEffect, useRef } from 'react';

export default function ChatPanel({ gameState, playerId, playerName }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [unread, setUnread] = useState(0);
    const listRef = useRef(null);

    useEffect(() => {
        if (!gameState?.lastMessage) return;
        const msg = gameState.lastMessage;

        if (msg.type === 'CHAT_MESSAGE') {
            setMessages(prev => [...prev.slice(-50), {
                id: Date.now() + Math.random(),
                senderId: msg.senderId,
                username: msg.username,
                text: msg.text,
                timestamp: msg.timestamp,
                isMe: msg.senderId === playerId,
            }]);
            if (!isOpen) setUnread(u => u + 1);
        }
    }, [gameState?.lastMessage, playerId, isOpen]);

    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        const text = input.trim();
        if (!text) return;
        gameState?.send?.({ type: 'CHAT_MESSAGE', text });
        setInput('');
    };

    const toggleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen) setUnread(0);
    };

    return (
        <>
            {/* Toggle button */}
            <button
                onClick={toggleOpen}
                style={{
                    position: 'fixed', bottom: 20, right: 20, zIndex: 50,
                    width: 48, height: 48, borderRadius: '50%',
                    border: '1px solid rgba(139,92,246,0.3)',
                    background: isOpen
                        ? 'linear-gradient(135deg, #6d28d9, #4c1d95)'
                        : 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(109,40,217,0.15))',
                    color: '#a78bfa', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                    transition: 'all 0.25s',
                }}
            >
                💬
                {unread > 0 && (
                    <span style={{
                        position: 'absolute', top: -4, right: -4,
                        width: 20, height: 20, borderRadius: '50%',
                        background: '#ef4444', color: '#fff',
                        fontSize: '0.65rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{unread > 9 ? '9+' : unread}</span>
                )}
            </button>

            {/* Chat panel */}
            {isOpen && (
                <div style={{
                    position: 'fixed', bottom: 80, right: 20, zIndex: 50,
                    width: 320, maxHeight: 420,
                    background: 'linear-gradient(145deg, rgba(12,12,20,0.98), rgba(6,6,9,0.99))',
                    border: '1px solid rgba(139,92,246,0.2)',
                    borderRadius: 16,
                    boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
                    display: 'flex', flexDirection: 'column',
                    overflow: 'hidden',
                    animation: 'scaleIn 0.2s ease',
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--c-border)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        <span style={{
                            fontFamily: 'var(--f-mono)', fontSize: '0.75rem',
                            fontWeight: 700, color: '#a78bfa', letterSpacing: 2,
                            textTransform: 'uppercase',
                        }}>Room Chat</span>
                        <button onClick={toggleOpen} style={{
                            background: 'none', border: 'none', color: 'var(--c-text-off)',
                            cursor: 'pointer', fontSize: '1rem', padding: 4,
                        }}>✕</button>
                    </div>

                    {/* Messages */}
                    <div ref={listRef} style={{
                        flex: 1, overflowY: 'auto', padding: '12px 16px',
                        display: 'flex', flexDirection: 'column', gap: 8,
                        maxHeight: 280, minHeight: 200,
                    }}>
                        {messages.length === 0 && (
                            <p style={{ color: 'var(--c-text-off)', fontSize: '0.8rem', textAlign: 'center', marginTop: 40 }}>
                                No messages yet — say hello! 👋
                            </p>
                        )}
                        {messages.map((m) => (
                            <div key={m.id} style={{
                                display: 'flex', flexDirection: 'column',
                                alignItems: m.isMe ? 'flex-end' : 'flex-start',
                            }}>
                                {!m.isMe && (
                                    <span style={{ fontSize: '0.65rem', color: 'var(--c-text-off)', marginBottom: 2, fontWeight: 600 }}>
                                        {m.username?.split('_')[0]}
                                    </span>
                                )}
                                <div style={{
                                    padding: '8px 12px', borderRadius: 12,
                                    maxWidth: '85%', fontSize: '0.85rem', lineHeight: 1.4,
                                    wordBreak: 'break-word',
                                    background: m.isMe
                                        ? 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(109,40,217,0.2))'
                                        : 'rgba(255,255,255,0.04)',
                                    border: m.isMe
                                        ? '1px solid rgba(139,92,246,0.2)'
                                        : '1px solid var(--c-border)',
                                    color: 'var(--c-text)',
                                }}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSend} style={{
                        padding: '10px 12px',
                        borderTop: '1px solid var(--c-border)',
                        display: 'flex', gap: 8,
                    }}>
                        <input
                            type="text" value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Type a message..."
                            maxLength={200}
                            style={{
                                flex: 1, padding: '8px 12px', borderRadius: 8,
                                border: '1px solid var(--c-border)',
                                background: 'rgba(0,0,0,0.3)', color: 'var(--c-text)',
                                fontSize: '0.85rem', outline: 'none',
                                fontFamily: 'var(--f-body)',
                            }}
                            onFocus={e => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'}
                            onBlur={e => e.currentTarget.style.borderColor = 'var(--c-border)'}
                        />
                        <button type="submit" disabled={!input.trim()} style={{
                            padding: '8px 14px', borderRadius: 8,
                            border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                            background: input.trim() ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)',
                            color: input.trim() ? '#a78bfa' : 'var(--c-text-off)',
                            fontSize: '0.85rem', fontWeight: 600,
                            transition: 'all 0.2s',
                        }}>➤</button>
                    </form>
                </div>
            )}
        </>
    );
}
