import { useState } from 'react';
import { BRAND, MODE_LABELS } from '../config/brand.js';

const GAME_MODES = [
    { id: 'duel', label: 'Arena Duel', desc: '1v1 combat — reduce HP to zero', color: '#ef4444', players: '2', tag: 'PVP' },
    { id: 'bomb_relay', label: 'Bomb Relay Royale', desc: 'Pass the bomb — last survivor wins!', color: '#FF3D81', players: '3–10', tag: 'SURVIVAL' },
    { id: 'territory', label: 'Gem Heist Arena', desc: 'Collect & deposit gems — steal from rivals!', color: '#7B61FF', players: '2–8', tag: 'ACTION' },
    { id: 'neon_drift', label: 'Neon Drift Racing', desc: 'Race 3 laps — first to finish wins!', color: '#00F5FF', players: '2–12', tag: 'RACING' },
    { id: 'cricket_pro', label: 'Cricket Clash Pro', desc: 'Bowl & bat — outsmart your opponent!', color: '#00FF9C', players: '2', tag: 'CRICKET' },
];

export default function LobbyScreen({
    roomInfo, user, onCreateRoom, onJoinRoom, onReady,
    onLeaveRoom, onLogout, onNavigate,
    onQuickMatch,
}) {
    const [selectedMode, setSelectedMode] = useState(null);
    const [joinCode, setJoinCode] = useState('');

    /* ─── Room View ──────────────────────────── */
    if (roomInfo) {
        const myPlayer = roomInfo.players?.find(p => p.id === user?.id);
        const isReady = myPlayer?.ready;

        return (
            <div className="screen fade-in" style={{ padding: 'var(--sp-4)', paddingTop: '80px' }}>
                <div className="panel" style={{ maxWidth: '520px', width: '100%', textAlign: 'center' }}>
                    <div className="section-label">Room</div>
                    {/* Room Code */}
                    <div style={{
                        fontFamily: 'var(--f-mono)', fontSize: '2rem', fontWeight: 700,
                        letterSpacing: '10px', padding: 'var(--sp-5) var(--sp-8)',
                        background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)',
                        borderRadius: 'var(--r-lg)', marginBottom: 'var(--sp-5)',
                        color: 'var(--c-amber)',
                    }}>
                        {roomInfo.roomCode || '????'}
                    </div>

                    <p style={{ color: 'var(--c-text-dim)', fontSize: '0.8rem', marginBottom: 'var(--sp-3)' }}>
                        Mode: <strong style={{ color: 'var(--c-primary-l)' }}>
                            {MODE_LABELS[roomInfo.gameType] || roomInfo.gameType}
                        </strong>
                    </p>

                    {/* Player count */}
                    <p style={{ color: 'var(--c-text-off)', fontSize: '0.75rem', marginBottom: 'var(--sp-3)' }}>
                        Players: <strong style={{ color: 'var(--c-primary-l)' }}>
                            {roomInfo.playerCount || roomInfo.players?.length || 0}
                        </strong> / {roomInfo.maxPlayers || '?'}
                    </p>

                    {/* Countdown timer */}
                    {roomInfo.countdown > 0 && (
                        <div style={{
                            padding: 'var(--sp-3) var(--sp-4)',
                            background: 'rgba(251,191,36,0.08)',
                            border: '1px solid rgba(251,191,36,0.25)',
                            borderRadius: 'var(--r-md)',
                            marginBottom: 'var(--sp-4)',
                            textAlign: 'center',
                        }}>
                            <div style={{
                                fontFamily: 'var(--f-mono)', fontSize: '1.5rem',
                                fontWeight: 800, color: 'var(--c-amber)',
                            }}>
                                {roomInfo.countdown}s
                            </div>
                            <div style={{
                                fontSize: '0.7rem', color: 'var(--c-text-dim)', marginTop: '2px',
                            }}>
                                {roomInfo.countdownMessage || 'Waiting for players...'}
                            </div>
                        </div>
                    )}

                    {/* Player list */}
                    <div style={{
                        display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)',
                        marginBottom: 'var(--sp-5)',
                    }}>
                        {(roomInfo.players || []).map(p => (
                            <div key={p.id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: 'var(--sp-3) var(--sp-4)',
                                background: p.ready ? 'rgba(52,211,153,0.06)' : 'var(--c-surface)',
                                border: `1px solid ${p.ready ? 'rgba(52,211,153,0.15)' : 'var(--c-border)'}`,
                                borderRadius: 'var(--r-md)',
                            }}>
                                <span style={{
                                    fontWeight: 600,
                                    color: p.id === user?.id ? 'var(--c-green)' : 'var(--c-text)',
                                    fontSize: '0.875rem',
                                }}>
                                    {p.username?.split('_')[0] || p.username}
                                    {p.id === roomInfo.host && <span style={{ color: 'var(--c-amber)', marginLeft: '6px', fontSize: '0.7rem' }}>HOST</span>}
                                </span>
                                <span style={{
                                    fontSize: '0.7rem', fontWeight: 600, letterSpacing: '1px',
                                    color: p.ready ? 'var(--c-green)' : 'var(--c-text-off)',
                                    textTransform: 'uppercase',
                                }}>
                                    {p.ready ? 'Ready' : 'Waiting'}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
                        <button className="btn2 btn2--ghost" onClick={onLeaveRoom} style={{ flex: 1 }}>
                            Leave
                        </button>
                        <button
                            className={`btn2 ${isReady ? 'btn2--cyan' : 'btn2--primary'}`}
                            onClick={onReady}
                            style={{ flex: 2 }}
                        >
                            {isReady ? 'Unready' : 'Ready Up'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    /* ─── Main Lobby ─────────────────────────── */
    return (
        <div className="screen fade-in" style={{
            padding: 'var(--sp-4)', paddingTop: '80px',
            justifyContent: 'flex-start', minHeight: '100vh',
        }}>
            <div style={{ maxWidth: '860px', width: '100%', margin: '0 auto' }}>
                {/* Welcome */}
                <div style={{ textAlign: 'center', marginBottom: 'var(--sp-6)' }}>
                    <h1 style={{
                        fontFamily: 'var(--f-mono)', fontSize: 'clamp(1.1rem, 4vw, 1.5rem)',
                        fontWeight: 800, letterSpacing: '4px', color: 'var(--c-primary-l)',
                        marginBottom: 'var(--sp-1)',
                    }}>
                        {BRAND.hub.toUpperCase()}
                    </h1>
                    <p style={{
                        color: 'var(--c-text-off)', fontSize: '0.75rem',
                        letterSpacing: '2px', textTransform: 'uppercase',
                    }}>
                        {BRAND.tagline}
                    </p>
                </div>

                {/* Mode Grid — 2 col on mobile, 3 col on desktop */}
                <div className="section-label">Select Mode</div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                    gap: 'var(--sp-3)',
                    marginBottom: 'var(--sp-5)',
                }}>
                    {GAME_MODES.map(mode => {
                        const active = selectedMode === mode.id;
                        return (
                            <div
                                key={mode.id}
                                onClick={() => setSelectedMode(active ? null : mode.id)}
                                style={{
                                    padding: 'var(--sp-4) var(--sp-4) var(--sp-3)',
                                    borderRadius: 'var(--r-lg)',
                                    background: active
                                        ? `linear-gradient(135deg, ${mode.color}11, ${mode.color}08)`
                                        : 'var(--c-surface)',
                                    border: `1.5px solid ${active ? mode.color : 'var(--c-border)'}`,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    transform: active ? 'scale(1.02)' : 'scale(1)',
                                }}
                                onMouseEnter={e => {
                                    if (!active) e.currentTarget.style.borderColor = `${mode.color}60`;
                                }}
                                onMouseLeave={e => {
                                    if (!active) e.currentTarget.style.borderColor = 'var(--c-border)';
                                }}
                            >
                                {/* Tag */}
                                <div style={{
                                    fontSize: '0.55rem', fontWeight: 800, letterSpacing: '2px',
                                    color: mode.color, marginBottom: 'var(--sp-2)', opacity: 0.8,
                                }}>
                                    {mode.tag}
                                </div>

                                {/* Title */}
                                <div style={{
                                    fontWeight: 700, fontSize: '0.9rem',
                                    color: active ? mode.color : 'var(--c-text)',
                                    marginBottom: 'var(--sp-1)',
                                    transition: 'color 0.2s',
                                }}>
                                    {mode.label}
                                </div>

                                {/* Desc */}
                                <div style={{
                                    fontSize: '0.7rem', color: 'var(--c-text-off)', lineHeight: 1.4,
                                    marginBottom: 'var(--sp-2)',
                                }}>
                                    {mode.desc}
                                </div>

                                {/* Footer row */}
                                <div style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                }}>
                                    <span style={{
                                        fontSize: '0.65rem', fontWeight: 600, color: mode.color,
                                    }}>
                                        {mode.players} players
                                    </span>
                                    {active && (
                                        <span style={{
                                            width: '6px', height: '6px', borderRadius: '50%',
                                            background: mode.color,
                                            boxShadow: `0 0 8px ${mode.color}`,
                                        }} />
                                    )}
                                </div>

                                {/* Active glow line */}
                                {active && (
                                    <div style={{
                                        position: 'absolute', bottom: 0, left: 0, right: 0,
                                        height: '2px',
                                        background: `linear-gradient(90deg, transparent, ${mode.color}, transparent)`,
                                    }} />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Actions — always visible, disabled when no mode selected */}
                <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)',
                }}>
                    <button
                        className="btn2 btn2--primary btn2--lg"
                        onClick={() => selectedMode && onQuickMatch(selectedMode)}
                        disabled={!selectedMode}
                        style={{ opacity: selectedMode ? 1 : 0.4 }}
                    >
                        {BRAND.quickPlay}
                    </button>
                    <button
                        className="btn2 btn2--lg"
                        onClick={() => selectedMode && onCreateRoom(selectedMode)}
                        disabled={!selectedMode}
                        style={{ opacity: selectedMode ? 1 : 0.4 }}
                    >
                        {BRAND.hostArena}
                    </button>
                </div>

                {/* Join room */}
                <div className="divider2" style={{ margin: 'var(--sp-4) 0' }} />
                <div className="section-label">Join a Room</div>
                <div style={{
                    display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-8)',
                    maxWidth: '400px',
                }}>
                    <input
                        className="input2"
                        placeholder="Room code"
                        value={joinCode}
                        onChange={e => setJoinCode(e.target.value.toUpperCase())}
                        maxLength={6}
                        style={{ fontFamily: 'var(--f-mono)', letterSpacing: '4px', textAlign: 'center' }}
                    />
                    <button
                        className="btn2 btn2--cyan"
                        onClick={() => { if (joinCode.length >= 4) onJoinRoom(joinCode); }}
                        disabled={joinCode.length < 4}
                    >
                        Join
                    </button>
                </div>

                <button className="btn2 btn2--ghost" onClick={onLogout}>Logout</button>
            </div>
        </div>
    );
}
