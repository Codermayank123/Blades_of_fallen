import { useState } from 'react';
import { BRAND, GAME_MODE_META, GAME_CATEGORIES } from '../config/brand.js';
import { GAME_ICONS, LogoMain } from '../components/GameIcons.jsx';
import GameOptionsPanel from '../components/GameOptionsPanel.jsx';

// Game types that support solo play (min players = 1)
const SOLO_SUPPORTED_GAMES = new Set([]);

// Games organized by category
const GAMES_BY_CATEGORY = {
    action: [
        { id: 'duel', ...GAME_MODE_META.duel },
    ],
    coding: [
        { id: 'pixel_code', ...GAME_MODE_META.pixel_code },
        { id: 'stack_smash', ...GAME_MODE_META.stack_smash },
    ],
    fun: [
        { id: 'emoji_escape', ...GAME_MODE_META.emoji_escape },
        { id: 'meme_wars', ...GAME_MODE_META.meme_wars },
    ],
};

// Flat list for Quick Match lookup
const ALL_GAMES = Object.values(GAMES_BY_CATEGORY).flat();

export default function LobbyScreen({
    roomInfo, user, playerId, onCreateRoom, onJoinRoom, onReady,
    onLeaveRoom, onLogout, onNavigate,
    onQuickMatch, send,
}) {
    const [selectedMode, setSelectedMode] = useState(null);
    const [joinCode, setJoinCode] = useState('');
    const [showOptions, setShowOptions] = useState(false);
    const [gameOptions, setGameOptions] = useState({});

    const selectedGame = ALL_GAMES.find(g => g.id === selectedMode);
    const needsOptions = selectedMode && selectedMode !== 'duel';

    const handlePlay = (mode) => {
        // Always go directly to Quick Match — pass mode explicitly, never fallback to duel
        onQuickMatch(mode, {});
    };

    const handleHostWithOptions = (opts) => {
        setGameOptions(opts);
        setShowOptions(false);
        onCreateRoom(selectedMode, opts);
    };

    // Host room: show options panel for room creation only
    const handleHostRoom = (mode) => {
        setSelectedMode(mode);
        setShowOptions(true);
    };

    /* ─── Room View ──────────────────────────── */
    if (roomInfo) {
        const myPlayer = roomInfo.players?.find(p => p.id === playerId);
        const isReady = myPlayer?.ready;
        const meta = GAME_MODE_META[roomInfo.gameType] || {};
        const isCountingDown = (roomInfo.countdown > 0);
        const isCreator = playerId && roomInfo.host === playerId;
        const canStartNow = isCountingDown && SOLO_SUPPORTED_GAMES.has(roomInfo.gameType) && isCreator;

        return (
            <div className="screen fade-in" style={{ padding: 'var(--sp-4)', paddingTop: '80px' }}>
                <div className="panel" style={{ maxWidth: '520px', width: '100%', textAlign: 'center' }}>
                    <div className="section-label">Room</div>
                    <div style={{
                        fontFamily: 'var(--f-mono)', fontSize: '2rem', fontWeight: 700,
                        letterSpacing: '10px', padding: 'var(--sp-4) var(--sp-6)',
                        background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)',
                        borderRadius: 'var(--r-lg)', marginBottom: 'var(--sp-3)',
                        color: 'var(--c-amber)',
                    }}>
                        {roomInfo.roomCode || '????'}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--sp-4)', marginBottom: 'var(--sp-3)', fontSize: '0.78rem', color: 'var(--c-text-dim)' }}>
                        <span>Mode: <strong style={{ color: meta.color || 'var(--c-primary-l)' }}>{meta.label || roomInfo.gameType}</strong></span>
                        <span style={{ color: 'var(--c-border-h)' }}>|</span>
                        <span><strong style={{ color: 'var(--c-green)' }}>{roomInfo.players?.length || 0}</strong> / {roomInfo.maxPlayers || '?'} players joined</span>
                    </div>

                    {isCountingDown && (
                        <div style={{
                            padding: 'var(--sp-3) var(--sp-4)',
                            background: 'rgba(251,191,36,0.08)',
                            border: '1px solid rgba(251,191,36,0.25)',
                            borderRadius: 'var(--r-md)', marginBottom: 'var(--sp-3)',
                        }}>
                            <div style={{ fontFamily: 'var(--f-mono)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--c-amber)' }}>{roomInfo.countdown}s</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--c-text-dim)', marginTop: '2px' }}>
                                {roomInfo.countdownMessage || 'Starting soon...'}
                            </div>
                            {canStartNow && (
                                <button
                                    onClick={() => send?.({ type: 'START_NOW' })}
                                    style={{
                                        marginTop: 10, padding: '8px 24px',
                                        borderRadius: 999, border: 'none',
                                        background: `linear-gradient(135deg, ${meta.color || '#a855f7'}, ${meta.color || '#8b5cf6'}cc)`,
                                        color: '#fff', fontWeight: 700, fontSize: '0.8rem',
                                        letterSpacing: '1px', cursor: 'pointer',
                                        boxShadow: `0 0 20px ${meta.color || '#a855f7'}30`,
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                                >
                                    ▶ Start Now
                                </button>
                            )}
                        </div>
                    )}

                    {/* Live player list with avatars */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)', marginBottom: 'var(--sp-4)', textAlign: 'left' }}>
                        {(roomInfo.players || []).map((p, i) => (
                            <div key={p.id || i} style={{
                                display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
                                padding: 'var(--sp-2) var(--sp-3)',
                                background: p.id === playerId ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.02)',
                                borderRadius: 'var(--r-md)',
                                border: `1px solid ${p.id === playerId ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)'}`,
                                transition: 'all 0.2s',
                            }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                    background: `hsl(${((p.username?.charCodeAt(0) || 65) * 5) % 360}, 55%, 45%)`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.75rem', fontWeight: 800, color: '#fff',
                                    border: p.id === playerId ? '2px solid var(--c-primary)' : '2px solid transparent',
                                    overflow: 'hidden',
                                }}>
                                    {p.avatar
                                        ? <img src={p.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt=""/>
                                        : (p.username?.[0] || '?').toUpperCase()}
                                </div>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, flex: 1, color: p.id === playerId ? 'var(--c-primary-l)' : 'var(--c-text)' }}>
                                    {p.username || 'Player'}
                                    {p.id === roomInfo.host && <span style={{ color: 'var(--c-amber)', marginLeft: 6, fontSize: '0.65rem', fontWeight: 800 }}>HOST</span>}
                                    {p.id === playerId && <span style={{ color: 'var(--c-text-off)', marginLeft: 6, fontSize: '0.65rem' }}>(you)</span>}
                                </span>
                                <span style={{
                                    fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.5px',
                                    color: p.ready ? '#10B981' : '#F59E0B',
                                    padding: '2px 8px', borderRadius: 999,
                                    background: p.ready ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                                }}>
                                    {p.ready ? '✓ READY' : 'WAITING'}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--sp-3)', marginBottom: 'var(--sp-2)' }}>
                        <button className="btn2 btn2--ghost" onClick={onLeaveRoom} style={{ flex: 1 }}>Leave</button>
                        <button className={`btn2 ${isReady ? 'btn2--cyan' : 'btn2--primary'}`} onClick={onReady} style={{ flex: 2 }}>
                            {isReady ? 'Unready' : 'Ready Up'}
                        </button>
                    </div>
                    <button className="btn2 btn2--danger" onClick={onLeaveRoom}
                        style={{ width: '100%', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444', fontWeight: 700, padding: 'var(--sp-2)' }}>
                        Leave Match
                    </button>
                </div>
            </div>
        );
    }

    /* ─── Options Panel Overlay (host room only) ─────────────── */
    if (showOptions && selectedGame) {
        return (
            <div className="screen fade-in" style={{
                padding: 'var(--sp-4)', paddingTop: '80px',
                justifyContent: 'flex-start', minHeight: '100vh',
            }}>
                <div style={{ maxWidth: '600px', width: '100%', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 'var(--sp-6)' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                            {GAME_ICONS[selectedGame.id] ? (() => { const Icon = GAME_ICONS[selectedGame.id]; return <Icon size={48} />; })() : null}
                        </div>
                        <h2 style={{
                            margin: 0, fontFamily: 'var(--f-mono)', fontWeight: 800,
                            fontSize: '1.2rem', letterSpacing: 3, color: selectedGame.color,
                            textTransform: 'uppercase',
                        }}>{selectedGame.label}</h2>
                        <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: 'var(--c-text-dim)' }}>{selectedGame.desc}</p>
                    </div>

                    <GameOptionsPanel
                        gameType={selectedMode}
                        accentColor={selectedGame.color}
                        onStart={handleHostWithOptions}
                        startLabel="🏠 Create Room"
                    />

                    <div style={{ marginTop: 'var(--sp-4)', display: 'flex', gap: 'var(--sp-3)' }}>
                        <button className="btn2 btn2--ghost" style={{ flex: 1 }}
                            onClick={() => { setShowOptions(false); setSelectedMode(null); }}
                        >← Back</button>
                        <button className="btn2 btn2--primary" style={{ flex: 1 }}
                            onClick={() => { setShowOptions(false); onQuickMatch(selectedMode, {}); }}
                        >⚡ Quick Match</button>
                    </div>
                </div>
            </div>
        );
    }

    /* ─── Coding Arcade Dashboard ─────────────── */
    const featured = ALL_GAMES.find(m => m.featured);

    return (
        <div className="screen fade-in" style={{
            padding: 0, paddingTop: '60px',
            justifyContent: 'flex-start', minHeight: '100vh', alignItems: 'stretch',
        }}>
            <div style={{ maxWidth: '960px', width: '100%', margin: '0 auto', padding: '0 var(--sp-4) var(--sp-6)', flex: 1 }}>
                {/* Cinematic Hero */}
                <div style={{
                    position: 'relative', textAlign: 'center',
                    margin: 'var(--sp-4) 0 var(--sp-4)',
                    padding: 'var(--sp-5) var(--sp-4)',
                    borderRadius: '16px',
                    background: 'linear-gradient(145deg, rgba(124,58,237,0.08), rgba(6,182,212,0.04))',
                    border: '1px solid rgba(124,58,237,0.15)', overflow: 'hidden',
                }}>
                    <div style={{ position:'absolute', top:-40, left:-40, width:180, height:180, borderRadius:'50%', background:'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', pointerEvents:'none', animation:'orb-float 6s ease-in-out infinite' }}/>
                    <div style={{ position:'absolute', bottom:-40, right:-40, width:140, height:140, borderRadius:'50%', background:'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)', pointerEvents:'none', animation:'orb-float 8s ease-in-out infinite reverse' }}/>
                    <div style={{ display:'flex', justifyContent:'center', marginBottom:'var(--sp-2)', filter:'drop-shadow(0 0 20px rgba(168,85,247,0.3))' }}><LogoMain/></div>
                    <h1 style={{ fontFamily:'var(--f-mono)', fontSize:'clamp(1.2rem,4vw,1.8rem)', fontWeight:900, letterSpacing:'6px', background:'linear-gradient(135deg, #A855F7 0%, #06B6D4 50%, #34D399 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', margin:'0 0 var(--sp-1)' }}>
                        {BRAND.hub.toUpperCase()}
                    </h1>
                    <p style={{ color:'var(--c-text-off)', fontSize:'0.75rem', letterSpacing:'4px', textTransform:'uppercase', margin:0 }}>{BRAND.tagline}</p>
                    <div style={{ display:'inline-flex', alignItems:'center', gap:6, marginTop:'var(--sp-3)', padding:'4px 14px', borderRadius:999, background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)', fontSize:'0.7rem', color:'#10B981', fontWeight:600 }}>
                        <span style={{ width:6, height:6, borderRadius:'50%', background:'#10B981', boxShadow:'0 0 6px #10B981', animation:'pulse-dot 2s infinite', display:'inline-block' }}/>
                        LIVE · SELECT A GAME TO PLAY
                    </div>
                </div>

                {/* Featured Game Banner */}
                {featured && (
                    <div
                        onClick={() => handlePlay(featured.id)}
                        style={{
                            padding: 'var(--sp-6) var(--sp-8)',
                            borderRadius: 'var(--r-xl)',
                            background: `linear-gradient(135deg, ${featured.color}12, ${featured.color}06)`,
                            border: `1px solid ${featured.color}30`,
                            marginBottom: 'var(--sp-8)',
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                            position: 'relative', overflow: 'hidden',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 40px ${featured.color}15`; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${featured.color}50, transparent)` }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-5)' }}>
                            <div style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{GAME_ICONS[featured.id] ? (() => { const Icon = GAME_ICONS[featured.id]; return <Icon size={48} />; })() : featured.icon}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 4 }}>
                                    <span style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: 2, color: featured.color, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 999, background: `${featured.color}15`, border: `1px solid ${featured.color}25` }}>
                                        ⭐ FEATURED
                                    </span>
                                </div>
                                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--c-text)', marginBottom: 4 }}>{featured.label}</h2>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--c-text-dim)', lineHeight: 1.5 }}>{featured.desc}</p>
                            </div>
                            <div style={{
                                padding: '10px 24px', borderRadius: 999,
                                background: `linear-gradient(135deg, ${featured.color}, ${featured.color}cc)`,
                                color: '#fff', fontWeight: 700, fontSize: '0.8rem',
                                letterSpacing: 1, whiteSpace: 'nowrap',
                            }}>PLAY NOW</div>
                        </div>
                    </div>
                )}

                {/* Category Sections */}
                {Object.entries(GAMES_BY_CATEGORY).map(([catKey, games]) => {
                    const cat = GAME_CATEGORIES[catKey];
                    return (
                        <div key={catKey} style={{ marginBottom: 'var(--sp-6)' }}>
                            {/* Category Header */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
                                marginBottom: 'var(--sp-3)',
                            }}>
                                <span style={{ fontSize: '1.2rem' }}>{cat.icon}</span>
                                <span style={{
                                    fontFamily: 'var(--f-mono)', fontSize: '0.7rem',
                                    fontWeight: 800, letterSpacing: '3px',
                                    color: cat.color, textTransform: 'uppercase',
                                }}>{cat.label}</span>
                                <div style={{ flex: 1, height: 1, background: `${cat.color}20` }} />
                            </div>

                            {/* Game Cards */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: games.length === 1 ? '1fr' : games.length === 2 ? 'repeat(2,1fr)' : games.length === 3 ? 'repeat(3,1fr)' : 'repeat(2,1fr)',
                                gap: 'var(--sp-3)',
                            }}>
                                {games.map(mode => {
                                    const active = selectedMode === mode.id;
                                    return (
                                        <div
                                            key={mode.id}
                                            onClick={() => handlePlay(mode.id)}
                                            style={{
                                                padding: 'var(--sp-5) var(--sp-4) var(--sp-4)',
                                                borderRadius: 'var(--r-lg)',
                                                background: active
                                                    ? `linear-gradient(145deg, ${mode.color}10, ${mode.color}06)`
                                                    : 'linear-gradient(145deg, var(--c-surface), rgba(6,6,9,0.6))',
                                                border: `1.5px solid ${active ? mode.color : 'var(--c-border)'}`,
                                                cursor: 'pointer',
                                                transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                                                position: 'relative', overflow: 'hidden',
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.borderColor = `${mode.color}50`;
                                                e.currentTarget.style.transform = 'translateY(-3px)';
                                                e.currentTarget.style.boxShadow = `0 6px 24px ${mode.color}12`;
                                            }}
                                            onMouseLeave={e => {
                                                if (!active) {
                                                    e.currentTarget.style.borderColor = 'var(--c-border)';
                                                }
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        >
                                            {/* Icon */}
                                            <div style={{ marginBottom: 'var(--sp-2)', height: 36, display: 'flex', alignItems: 'center' }}>
                                                {GAME_ICONS[mode.id] ? (() => { const Icon = GAME_ICONS[mode.id]; return <Icon size={36} />; })() : <span style={{ fontSize: '1.8rem' }}>{mode.icon}</span>}
                                            </div>

                                            {/* Tag */}
                                            <div style={{
                                                fontSize: '0.55rem', fontWeight: 800, letterSpacing: '2px',
                                                color: mode.color, marginBottom: 'var(--sp-2)', opacity: 0.8,
                                            }}>{mode.tag}</div>

                                            {/* Title */}
                                            <div style={{
                                                fontWeight: 700, fontSize: '0.9rem',
                                                color: 'var(--c-text)',
                                                marginBottom: 'var(--sp-1)', transition: 'color 0.2s',
                                            }}>{mode.label}</div>

                                            {/* Desc */}
                                            <div style={{
                                                fontSize: '0.7rem', color: 'var(--c-text-off)', lineHeight: 1.5,
                                                marginBottom: 'var(--sp-2)',
                                            }}>{mode.desc}</div>

                                            {/* Footer */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                                                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: mode.color }}>
                                                    {mode.players} players
                                                </span>
                                                <div style={{ display: 'flex', gap: 4 }}>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleHostRoom(mode.id); }}
                                                        style={{
                                                            fontSize: '0.55rem', fontWeight: 700, letterSpacing: 0.5,
                                                            padding: '3px 8px', borderRadius: 999, cursor: 'pointer',
                                                            border: `1px solid ${mode.color}30`,
                                                            background: 'transparent', color: mode.color, opacity: 0.7,
                                                            transition: 'all 0.2s',
                                                        }}
                                                        onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = `${mode.color}15`; }}
                                                        onMouseLeave={e => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.background = 'transparent'; }}
                                                    >HOST</button>
                                                    <span style={{
                                                        fontSize: '0.6rem', fontWeight: 700, letterSpacing: 1,
                                                        color: mode.color,
                                                    }}>PLAY →</span>
                                                </div>
                                            </div>

                                            {/* Bottom accent */}
                                            <div style={{
                                                position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
                                                background: `linear-gradient(90deg, transparent, ${mode.color}40, transparent)`,
                                            }} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}

                <div className="divider2" style={{ margin: 'var(--sp-4) 0' }}>join with code</div>
                <div style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-4)', maxWidth: '400px' }}>
                    <input
                        className="input2"
                        placeholder="ROOM CODE"
                        value={joinCode}
                        onChange={e => setJoinCode(e.target.value.toUpperCase())}
                        maxLength={6}
                        style={{ fontFamily: 'var(--f-mono)', letterSpacing: '4px', textAlign: 'center' }}
                    />
                    <button
                        className="btn2 btn2--cyan"
                        onClick={() => { if (joinCode.length >= 4) onJoinRoom(joinCode); }}
                        disabled={joinCode.length < 4}
                    >Join</button>
                </div>

                <button className="btn2 btn2--ghost" onClick={onLogout}>Logout</button>
            </div>
        </div>
    );
}
