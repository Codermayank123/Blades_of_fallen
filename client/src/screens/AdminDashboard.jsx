import { useState, useEffect, useCallback } from 'react';
import { MODE_LABELS } from '../config/brand.js';

const MODE_COLORS = {
    duel:         '#7B2FBE',
    pixel_code:   '#00FF88',
    stack_smash:  '#FF6B6B',
    emoji_escape: '#FFDD00',
    meme_wars:    '#FF69B4',
    // legacy — kept for historical match records
    bug_bounty:   '#EF4444',
    algo_arena:   '#06B6D4',
    cipher_clash: '#F59E0B',
    query_quest:  '#10B981',
};

const DATE_RANGES = [
    { key: 'today', label: 'Today', days: 1 },
    { key: 'week', label: '7 Days', days: 7 },
    { key: 'month', label: '30 Days', days: 30 },
    { key: 'all', label: 'All Time', days: null },
];

export default function AdminDashboard({ onBack }) {
    const [analytics, setAnalytics] = useState(null);
    const [matches, setMatches] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [modeFilter, setModeFilter] = useState('all');
    const [dateRange, setDateRange] = useState('all');
    const [matchPage, setMatchPage] = useState(1);
    const [matchTotal, setMatchTotal] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [showWelcome, setShowWelcome] = useState(() => !sessionStorage.getItem('adminWelcomeSeen'));
    const [welcomeProgress, setWelcomeProgress] = useState(0);
    const [welcomeFading, setWelcomeFading] = useState(false);

    const isProduction = window.location.protocol === 'https:';
    const API_URL = import.meta.env.VITE_API_URL || (isProduction
        ? `https://${window.location.hostname.replace('frontend', 'backend')}/api`
        : 'http://localhost:3001/api');

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    const fetchAnalytics = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/admin/analytics`, { headers });
            if (res.ok) setAnalytics(await res.json());
        } catch (err) { console.error('Analytics fetch:', err); }
    }, [API_URL]);

    const fetchMatches = useCallback(async (page = 1, gameType = null, range = 'all') => {
        try {
            const params = new URLSearchParams({ page, limit: 20 });
            if (gameType && gameType !== 'all') params.set('gameType', gameType);

            const rangeObj = DATE_RANGES.find(r => r.key === range);
            if (rangeObj?.days) {
                const start = new Date(Date.now() - rangeObj.days * 86400000);
                params.set('startDate', start.toISOString());
            }

            const res = await fetch(`${API_URL}/admin/matches?${params}`, { headers });
            if (res.ok) {
                const data = await res.json();
                setMatches(data.matches || []);
                setMatchTotal(data.pagination?.total || 0);
            }
        } catch (err) { console.error('Matches fetch:', err); }
    }, [API_URL]);

    const fetchContacts = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/admin/contacts`, { headers });
            if (res.ok) { const d = await res.json(); setContacts(d.contacts || []); }
        } catch (err) { console.error('Contacts fetch:', err); }
    }, [API_URL]);

    useEffect(() => {
        Promise.all([fetchAnalytics(), fetchMatches(), fetchContacts()])
            .finally(() => setLoading(false));

        // Auto-refresh analytics every 30s (for live online players, tickets, etc.)
        const autoRefresh = setInterval(() => {
            fetchAnalytics();
        }, 30000);
        return () => clearInterval(autoRefresh);
    }, []);

    useEffect(() => {
        fetchMatches(matchPage, modeFilter, dateRange);
    }, [matchPage, modeFilter, dateRange]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchAnalytics(), fetchMatches(matchPage, modeFilter, dateRange), fetchContacts()]);
        setRefreshing(false);
    };

    const resolveContact = async (id) => {
        try {
            await fetch(`${API_URL}/admin/contacts/${id}`, {
                method: 'PATCH', headers
            });
            setContacts(prev => prev.map(c => c._id === id ? { ...c, resolved: !c.resolved } : c));
        } catch (err) { console.error('Resolve error:', err); }
    };

    const matchTotalPages = Math.ceil(matchTotal / 20) || 1;

    /* Live game stats from analytics API */
    const gameBreakdown = (analytics?.matchesByGame || []).reduce((acc, item) => {
        acc[item.gameType] = item.count;
        return acc;
    }, {});

    // Welcome animation progress
    useEffect(() => {
        if (!showWelcome) return;
        const start = Date.now();
        const duration = 3000;
        const interval = setInterval(() => {
            const elapsed = Date.now() - start;
            const progress = Math.min(100, (elapsed / duration) * 100);
            setWelcomeProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                setWelcomeFading(true);
                setTimeout(() => {
                    setShowWelcome(false);
                    sessionStorage.setItem('adminWelcomeSeen', 'true');
                }, 800);
            }
        }, 30);
        return () => clearInterval(interval);
    }, [showWelcome]);

    // Welcome animation overlay — themed to match main WelcomeScreen
    if (showWelcome) {
        const welcomeLines = Array.from({ length: 12 }, (_, i) => ({
            id: i,
            top: `${8 + i * 8}%`,
            rotate: i % 3 === 0 ? '0deg' : i % 3 === 1 ? '90deg' : '45deg',
        }));
        const welcomeParticles = Array.from({ length: 30 }, (_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            size: 2 + Math.random() * 4,
            color: ['var(--c-primary, #8b5cf6)', 'var(--c-cyan, #22d3ee)', 'var(--c-amber, #fbbf24)', 'var(--c-green, #34d399)', 'var(--c-rose, #fb7185)'][i % 5],
        }));

        return (
            <div style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'linear-gradient(135deg, var(--c-bg, #0a0e27) 0%, var(--c-surface, #1a1145) 40%, var(--c-bg, #0d1b2a) 100%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
                opacity: welcomeFading ? 0 : 1,
                transition: 'opacity 0.8s ease-out',
            }}>
                {/* Animated grid lines — same as WelcomeScreen */}
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    {welcomeLines.map(l => (
                        <div key={l.id} style={{
                            position: 'absolute', top: l.top, left: 0, right: 0,
                            height: '1px',
                            background: 'linear-gradient(90deg, transparent, var(--c-primary, #8b5cf6), transparent)',
                            transform: `rotate(${l.rotate})`, transformOrigin: 'center',
                            opacity: 0.15,
                            animation: `adminLineIn 1.2s ease-out ${l.id * 0.08}s both`,
                        }} />
                    ))}
                </div>

                {/* Central glow — same as WelcomeScreen */}
                <div style={{
                    position: 'absolute',
                    width: '500px', height: '500px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, rgba(34,211,238,0.05) 50%, transparent 70%)',
                    filter: 'blur(60px)',
                    pointerEvents: 'none',
                    animation: 'adminGlowPulse 2.5s ease-in-out infinite alternate',
                }} />

                {/* Floating particles — same as WelcomeScreen */}
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    {welcomeParticles.map(p => (
                        <div key={p.id} style={{
                            position: 'absolute', left: p.left, top: p.top,
                            width: p.size, height: p.size,
                            borderRadius: '50%',
                            background: p.color,
                            boxShadow: `0 0 ${p.size * 3}px ${p.color}66`,
                            animation: `adminFloat ${3 + Math.random() * 4}s ease-in-out infinite alternate`,
                            animationDelay: `${Math.random() * 2}s`,
                        }} />
                    ))}
                </div>

                {/* Crown icon */}
                <div style={{
                    fontSize: 'clamp(48px, 8vw, 72px)',
                    marginBottom: '16px',
                    animation: 'adminCrownBounce 2s ease-in-out infinite',
                    filter: 'drop-shadow(0 0 30px rgba(251,191,36,0.6))',
                    position: 'relative', zIndex: 2,
                }}>👑</div>

                {/* Welcome text — using same font as WelcomeScreen title */}
                <h1 style={{
                    fontFamily: 'var(--f-mono, Orbitron), sans-serif',
                    fontSize: 'clamp(24px, 5vw, 42px)',
                    fontWeight: 900,
                    background: 'linear-gradient(135deg, var(--c-primary, #8b5cf6), var(--c-cyan, #22d3ee), var(--c-amber, #fbbf24))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginBottom: '8px',
                    textAlign: 'center',
                    letterSpacing: '6px',
                    textShadow: 'none',
                    position: 'relative', zIndex: 2,
                }}>WELCOME, ADMIN</h1>

                <p style={{
                    fontFamily: 'var(--f-body, Inter), sans-serif',
                    fontSize: 'clamp(0.7rem, 2vw, 1rem)',
                    color: 'var(--c-text-off, rgba(226,232,240,0.5))',
                    letterSpacing: '6px',
                    textTransform: 'uppercase',
                    marginBottom: '40px',
                    position: 'relative', zIndex: 2,
                }}>Initializing Command Center</p>

                {/* Progress bar */}
                <div style={{
                    width: 'clamp(200px, 50vw, 360px)', height: '6px',
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '3px', overflow: 'hidden',
                    border: '1px solid rgba(139,92,246,0.2)',
                    position: 'relative', zIndex: 2,
                }}>
                    <div style={{
                        width: `${welcomeProgress}%`, height: '100%',
                        background: 'linear-gradient(90deg, var(--c-primary, #8b5cf6), var(--c-cyan, #22d3ee), var(--c-amber, #fbbf24))',
                        borderRadius: '3px',
                        transition: 'width 0.05s linear',
                        boxShadow: '0 0 12px rgba(139,92,246,0.6)',
                    }} />
                </div>

                <div style={{
                    color: 'var(--c-text-off, rgba(226,232,240,0.4))',
                    fontSize: '12px',
                    marginTop: '12px',
                    fontFamily: 'var(--f-mono, monospace)',
                    position: 'relative', zIndex: 2,
                }}>{Math.round(welcomeProgress)}%</div>

                {/* Bottom label — same as WelcomeScreen */}
                <div style={{
                    position: 'absolute', bottom: '32px',
                    fontSize: '0.65rem',
                    color: 'var(--c-text-off, rgba(226,232,240,0.4))',
                    letterSpacing: '3px',
                    textTransform: 'uppercase',
                }}>
                    ADMIN COMMAND CENTER
                </div>

                <style>{`
                    @keyframes adminLineIn {
                        0% { transform: scaleX(0); opacity: 0; }
                        100% { opacity: 0.15; }
                    }
                    @keyframes adminGlowPulse {
                        0% { transform: scale(1); opacity: 0.7; }
                        100% { transform: scale(1.1); opacity: 1; }
                    }
                    @keyframes adminFloat {
                        0% { transform: translateY(0) translateX(0); opacity: 0.3; }
                        100% { transform: translateY(-25px) translateX(15px); opacity: 0.6; }
                    }
                    @keyframes adminCrownBounce {
                        0%, 100% { transform: translateY(0) rotate(-5deg); }
                        50% { transform: translateY(-10px) rotate(5deg); }
                    }
                `}</style>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="screen fade-in" style={{ paddingTop: '80px' }}>
                <div className="panel" style={{ padding: 'var(--sp-12)', textAlign: 'center', maxWidth: '400px' }}>
                    <div className="anim-spin" style={{
                        width: '32px', height: '32px', border: '3px solid var(--c-border)',
                        borderTopColor: 'var(--c-primary-l)', borderRadius: '50%',
                        margin: '0 auto var(--sp-4)',
                    }} />
                    <div style={{ color: 'var(--c-text-off)', fontSize: '0.85rem' }}>Loading dashboard...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="screen fade-in" style={{
            padding: 'var(--sp-4)', paddingTop: '80px',
            justifyContent: 'flex-start', alignItems: 'stretch',
        }}>
            <div style={{ maxWidth: '1000px', width: '100%', margin: '0 auto' }}>
                {/* Header */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: 'var(--sp-5)', flexWrap: 'wrap', gap: 'var(--sp-3)',
                }}>
                    <h1 style={{
                        fontFamily: 'var(--f-mono)', fontSize: '1.1rem',
                        fontWeight: 800, letterSpacing: '3px', color: 'var(--c-primary-l)',
                    }}>
                        ADMIN DASHBOARD
                    </h1>
                    <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                        <button
                            className="btn2"
                            onClick={handleRefresh}
                            disabled={refreshing}
                            style={{ padding: '6px 14px', fontSize: '0.75rem' }}
                        >
                            {refreshing ? 'Refreshing...' : 'Refresh'}
                        </button>
                        <button className="btn2 btn2--ghost" onClick={onBack}>Hub</button>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex', gap: 0, marginBottom: 'var(--sp-5)',
                    borderBottom: '1px solid var(--c-border)',
                }}>
                    {['overview', 'matches', 'contacts'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '10px 20px', border: 'none', cursor: 'pointer',
                                fontFamily: 'var(--f-body)', fontWeight: 600, fontSize: '0.8rem',
                                background: activeTab === tab ? 'rgba(139,92,246,0.08)' : 'transparent',
                                borderBottom: activeTab === tab ? '2px solid var(--c-primary)' : '2px solid transparent',
                                color: activeTab === tab ? 'var(--c-primary-l)' : 'var(--c-text-off)',
                                transition: 'all 0.2s',
                                textTransform: 'capitalize',
                            }}
                        >
                            {tab}
                            {tab === 'contacts' && contacts.filter(c => !c.resolved).length > 0 && (
                                <span style={{
                                    marginLeft: '6px', fontSize: '0.6rem', fontWeight: 800,
                                    background: 'var(--c-red)', color: '#fff',
                                    padding: '1px 5px', borderRadius: '8px',
                                }}>
                                    {contacts.filter(c => !c.resolved).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ═══ OVERVIEW TAB ═══ */}
                {activeTab === 'overview' && (
                    <div className="anim-fadeIn">
                        {/* Stat Cards Row */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                            gap: 'var(--sp-3)', marginBottom: 'var(--sp-6)',
                        }}>
                            {[
                                { label: 'Total Users', value: analytics?.totalUsers ?? 0, color: 'var(--c-primary-l)', sub: `+${analytics?.recentUsers ?? 0} this week` },
                                { label: 'Total Matches', value: analytics?.totalMatches ?? 0, color: 'var(--c-cyan)', sub: `+${analytics?.recentMatches ?? 0} this week` },
                                { label: 'Online Now', value: analytics?.onlinePlayers ?? 0, color: 'var(--c-green)', sub: 'currently active' }
                            ].map((s, i) => (
                                <div className="stat-card" key={s.label} style={{
                                    animationDelay: `${i * 80}ms`,
                                    animation: 'fadeIn 0.4s ease both',
                                }}>
                                    <div className="stat-card__value" style={{ color: s.color, fontSize: '1.8rem' }}>{s.value}</div>
                                    <div className="stat-card__label">{s.label}</div>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--c-text-off)', marginTop: '4px' }}>{s.sub}</div>
                                </div>
                            ))}
                        </div>

                        {/* Matches By Game */}
                        <div className="section-label">Matches by Game</div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                            gap: 'var(--sp-3)', marginBottom: 'var(--sp-6)',
                        }}>
                        {['duel', 'pixel_code', 'stack_smash', 'emoji_escape', 'meme_wars'].map((mode, i) => {
                                const count = gameBreakdown[mode] || 0;
                                const color = MODE_COLORS[mode];
                                return (
                                    <div key={mode} style={{
                                        padding: 'var(--sp-4)',
                                        background: 'var(--c-surface)',
                                        border: '1px solid var(--c-border)',
                                        borderLeft: `3px solid ${color}`,
                                        borderRadius: 'var(--r-md)',
                                        animation: `fadeIn 0.4s ease ${i * 60}ms both`,
                                    }}>
                                        <div style={{
                                            marginBottom: 'var(--sp-2)',
                                        }}>
                                            <span style={{
                                                fontSize: '0.7rem', fontWeight: 700, letterSpacing: '1px',
                                                color, textTransform: 'uppercase',
                                            }}>
                                                {MODE_LABELS[mode] || mode}
                                            </span>
                                        </div>
                                        <div style={{
                                            fontFamily: 'var(--f-mono)', fontSize: '1.4rem', fontWeight: 800,
                                            color: 'var(--c-text)',
                                        }}>{count}</div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Top Players */}
                        {analytics?.topPlayers?.length > 0 && (
                            <>
                                <div className="section-label">Top Players</div>
                                <div className="panel" style={{ padding: 'var(--sp-4)', marginBottom: 'var(--sp-5)' }}>
                                    {analytics.topPlayers.map((p, i) => (
                                        <div key={i} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: 'var(--sp-2) 0',
                                            borderBottom: i < analytics.topPlayers.length - 1 ? '1px solid var(--c-border)' : 'none',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                                                <span style={{
                                                    fontFamily: 'var(--f-mono)', fontWeight: 800, fontSize: '0.85rem',
                                                    color: i === 0 ? '#fbbf24' : i === 1 ? '#cbd5e1' : i === 2 ? '#d97706' : 'var(--c-text-dim)',
                                                    width: '24px',
                                                }}>#{i + 1}</span>
                                                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.username}</span>
                                            </div>
                                            <span style={{
                                                fontFamily: 'var(--f-mono)', fontWeight: 700,
                                                color: 'var(--c-amber)', fontSize: '0.9rem',
                                            }}>{p.elo}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Most Played */}
                        {analytics?.mostPlayed && (
                            <div className="panel" style={{
                                padding: 'var(--sp-4)', textAlign: 'center',
                                background: `linear-gradient(135deg, ${MODE_COLORS[analytics.mostPlayed] || 'var(--c-primary)'}08, transparent)`,
                            }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--c-text-off)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 'var(--sp-1)' }}>
                                    Most Played Mode
                                </div>
                                <div style={{
                                    fontFamily: 'var(--f-mono)', fontSize: '1rem', fontWeight: 700,
                                    color: MODE_COLORS[analytics.mostPlayed] || 'var(--c-text)',
                                }}>
                                    {MODE_LABELS[analytics.mostPlayed] || analytics.mostPlayed}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ MATCHES TAB ═══ */}
                {activeTab === 'matches' && (
                    <div className="anim-fadeIn">
                        {/* Filters */}
                        <div style={{
                            display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-3)',
                            marginBottom: 'var(--sp-4)', alignItems: 'center',
                        }}>
                            {/* Date range */}
                            <div style={{ display: 'flex', gap: '2px', background: 'var(--c-surface)', borderRadius: 'var(--r-md)', border: '1px solid var(--c-border)', overflow: 'hidden' }}>
                                {DATE_RANGES.map(r => (
                                    <button
                                        key={r.key}
                                        onClick={() => { setDateRange(r.key); setMatchPage(1); }}
                                        style={{
                                            padding: '6px 12px', border: 'none', cursor: 'pointer',
                                            fontSize: '0.7rem', fontWeight: 600,
                                            fontFamily: 'var(--f-body)',
                                            background: dateRange === r.key ? 'var(--c-primary)' : 'transparent',
                                            color: dateRange === r.key ? '#fff' : 'var(--c-text-off)',
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        {r.label}
                                    </button>
                                ))}
                            </div>

                            {/* Mode filter */}
                            <div style={{ display: 'flex', gap: '2px', background: 'var(--c-surface)', borderRadius: 'var(--r-md)', border: '1px solid var(--c-border)', overflow: 'hidden' }}>
                                {['all', 'duel', 'pixel_code', 'stack_smash', 'emoji_escape', 'meme_wars'].map(mode => (
                                    <button
                                        key={mode}
                                        onClick={() => { setModeFilter(mode); setMatchPage(1); }}
                                        style={{
                                            padding: '6px 10px', border: 'none', cursor: 'pointer',
                                            fontSize: '0.65rem', fontWeight: 600,
                                            fontFamily: 'var(--f-body)',
                                            background: modeFilter === mode ? (MODE_COLORS[mode] || 'var(--c-primary)') : 'transparent',
                                            color: modeFilter === mode ? '#fff' : 'var(--c-text-off)',
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        {mode === 'all' ? 'All' : (MODE_LABELS[mode] || mode)}
                                    </button>
                                ))}
                            </div>

                            <span style={{ fontSize: '0.7rem', color: 'var(--c-text-off)', marginLeft: 'auto' }}>
                                {matchTotal} match{matchTotal !== 1 ? 'es' : ''}
                            </span>
                        </div>

                        {/* Table */}
                        <div className="panel" style={{ padding: 0, overflowX: 'auto' }}>
                            {matches.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 'var(--sp-12)', color: 'var(--c-text-off)', fontSize: '0.85rem' }}>
                                    No matches in this range
                                </div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr>
                                            {['Mode', 'Players', 'Winner', 'Duration', 'Date'].map(h => (
                                                <th key={h} style={{
                                                    padding: 'var(--sp-3) var(--sp-4)', textAlign: 'left',
                                                    fontSize: '0.6rem', fontWeight: 700,
                                                    color: 'var(--c-text-off)', textTransform: 'uppercase',
                                                    letterSpacing: '2px', borderBottom: '1px solid var(--c-border)',
                                                    position: 'sticky', top: 0,
                                                    background: 'var(--c-surface2)',
                                                }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {matches.map((m, i) => (
                                            <tr key={m._id || i} style={{
                                                borderBottom: '1px solid var(--c-border)',
                                                animation: `fadeIn 0.2s ease ${i * 30}ms both`,
                                            }}>
                                                <td style={{
                                                    padding: 'var(--sp-3) var(--sp-4)', fontSize: '0.8rem',
                                                    color: MODE_COLORS[m.gameType] || 'var(--c-primary-l)',
                                                    fontWeight: 600,
                                                }}>
                                                    {MODE_LABELS[m.gameType] || m.gameType}
                                                </td>
                                                <td style={{ padding: 'var(--sp-3) var(--sp-4)', fontSize: '0.78rem', color: 'var(--c-text-dim)' }}>
                                                    {(m.players || []).map(p => p.username || p).join(' vs ')}
                                                </td>
                                                <td style={{ padding: 'var(--sp-3) var(--sp-4)', fontSize: '0.8rem', color: 'var(--c-green)', fontWeight: 600 }}>
                                                    {m.winner?.username || m.winnerName || '—'}
                                                </td>
                                                <td style={{ padding: 'var(--sp-3) var(--sp-4)', fontSize: '0.75rem', color: 'var(--c-text-off)' }}>
                                                    {m.duration ? `${m.duration}s` : '—'}
                                                </td>
                                                <td style={{ padding: 'var(--sp-3) var(--sp-4)', fontSize: '0.72rem', color: 'var(--c-text-off)' }}>
                                                    {m.createdAt ? new Date(m.createdAt).toLocaleString(undefined, {
                                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                    }) : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Pagination */}
                        {matchTotalPages > 1 && (
                            <div style={{
                                display: 'flex', justifyContent: 'center', alignItems: 'center',
                                gap: 'var(--sp-4)', marginTop: 'var(--sp-4)',
                            }}>
                                <button className="btn2" disabled={matchPage <= 1} onClick={() => setMatchPage(p => p - 1)}
                                    style={{ padding: '5px 14px', fontSize: '0.75rem' }}>Prev</button>
                                <span style={{ fontSize: '0.75rem', color: 'var(--c-text-dim)', fontFamily: 'var(--f-mono)' }}>
                                    {matchPage} / {matchTotalPages}
                                </span>
                                <button className="btn2" disabled={matchPage >= matchTotalPages} onClick={() => setMatchPage(p => p + 1)}
                                    style={{ padding: '5px 14px', fontSize: '0.75rem' }}>Next</button>
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ CONTACTS TAB ═══ */}
                {activeTab === 'contacts' && (
                    <div className="anim-fadeIn">
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            marginBottom: 'var(--sp-4)',
                        }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--c-text-dim)' }}>
                                <strong style={{ color: 'var(--c-amber)' }}>{contacts.filter(c => !c.resolved).length}</strong> unresolved of {contacts.length} total
                            </span>
                        </div>

                        {contacts.length === 0 ? (
                            <div className="panel" style={{ textAlign: 'center', padding: 'var(--sp-12)', color: 'var(--c-text-off)' }}>
                                No contact messages yet
                            </div>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                                gap: 'var(--sp-3)',
                            }}>
                                {contacts.map((c, i) => (
                                    <div key={c._id} style={{
                                        padding: 'var(--sp-5)',
                                        background: c.resolved ? 'var(--c-surface)' : 'rgba(251,191,36,0.03)',
                                        border: `1px solid ${c.resolved ? 'var(--c-border)' : 'rgba(251,191,36,0.2)'}`,
                                        borderRadius: 'var(--r-lg)',
                                        opacity: c.resolved ? 0.5 : 1,
                                        transition: 'all 0.3s ease',
                                        animation: `fadeIn 0.3s ease ${i * 50}ms both`,
                                    }}>
                                        {/* Header */}
                                        <div style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                                            marginBottom: 'var(--sp-3)',
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '2px' }}>{c.name}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--c-text-off)' }}>{c.email}</div>
                                            </div>
                                            {c.resolved ? (
                                                <span className="badge" style={{
                                                    background: 'rgba(52,211,153,0.1)', color: 'var(--c-green)',
                                                    borderColor: 'rgba(52,211,153,0.2)', fontSize: '0.6rem',
                                                }}>Resolved</span>
                                            ) : (
                                                <button
                                                    className="btn2 btn2--primary"
                                                    onClick={() => resolveContact(c._id)}
                                                    style={{ padding: '5px 14px', fontSize: '0.7rem' }}
                                                >
                                                    Resolve
                                                </button>
                                            )}
                                        </div>

                                        {/* Subject */}
                                        <div style={{
                                            fontWeight: 600, fontSize: '0.85rem',
                                            color: 'var(--c-amber)', marginBottom: 'var(--sp-2)',
                                        }}>{c.subject}</div>

                                        {/* Message */}
                                        <div style={{
                                            fontSize: '0.78rem', color: 'var(--c-text-dim)',
                                            lineHeight: 1.6, padding: 'var(--sp-3)',
                                            background: 'rgba(0,0,0,0.2)',
                                            borderRadius: 'var(--r-sm)',
                                            maxHeight: '100px', overflow: 'auto',
                                            border: '1px solid var(--c-border)',
                                        }}>{c.message}</div>

                                        {/* Date */}
                                        {c.createdAt && (
                                            <div style={{
                                                fontSize: '0.6rem', color: 'var(--c-text-off)',
                                                marginTop: 'var(--sp-3)', textAlign: 'right',
                                            }}>
                                                {new Date(c.createdAt).toLocaleString(undefined, {
                                                    month: 'short', day: 'numeric', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit',
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
