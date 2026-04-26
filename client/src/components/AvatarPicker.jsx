const PRESET_AVATARS = [
    { id: 'dev_ninja', emoji: '🥷', label: 'Dev Ninja', bg: '#6d28d9' },
    { id: 'bug_hunter', emoji: '🐛', label: 'Bug Hunter', bg: '#dc2626' },
    { id: 'code_wizard', emoji: '🧙', label: 'Code Wizard', bg: '#7c3aed' },
    { id: 'hacker', emoji: '💻', label: 'Hacker', bg: '#059669' },
    { id: 'rocket_dev', emoji: '🚀', label: 'Rocket Dev', bg: '#0891b2' },
    { id: 'brain', emoji: '🧠', label: 'Big Brain', bg: '#c026d3' },
    { id: 'robot', emoji: '🤖', label: 'AI Coder', bg: '#475569' },
    { id: 'lightning', emoji: '⚡', label: 'Speed Coder', bg: '#d97706' },
    { id: 'fire', emoji: '🔥', label: 'Firestarter', bg: '#ea580c' },
    { id: 'gem', emoji: '💎', label: 'Gem Dev', bg: '#2563eb' },
    { id: 'ghost', emoji: '👻', label: 'Phantom', bg: '#4b5563' },
    { id: 'alien', emoji: '👾', label: 'Bit Invader', bg: '#16a34a' },
];

export default function AvatarPicker({ selectedId, onSelect, size = 48 }) {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fill, minmax(${size + 16}px, 1fr))`,
            gap: 10,
        }}>
            {PRESET_AVATARS.map(av => {
                const isActive = selectedId === av.id;
                return (
                    <button
                        key={av.id}
                        onClick={() => onSelect(av.id)}
                        title={av.label}
                        style={{
                            width: size + 12, height: size + 12,
                            borderRadius: 14,
                            border: isActive
                                ? '2px solid #a855f7'
                                : '1px solid var(--c-border)',
                            background: isActive
                                ? 'rgba(168,85,247,0.12)'
                                : 'rgba(255,255,255,0.02)',
                            cursor: 'pointer',
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            gap: 2,
                            transition: 'all 0.2s',
                            boxShadow: isActive ? '0 0 16px rgba(168,85,247,0.2)' : 'none',
                            transform: isActive ? 'scale(1.06)' : 'scale(1)',
                        }}
                        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = 'rgba(168,85,247,0.3)'; e.currentTarget.style.transform = 'scale(1.04)'; } }}
                        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.transform = 'scale(1)'; } }}
                    >
                        <span style={{ fontSize: size * 0.55 }}>{av.emoji}</span>
                        <span style={{
                            fontSize: '0.55rem', fontWeight: 600,
                            color: isActive ? '#a855f7' : 'var(--c-text-off)',
                            letterSpacing: 0.5,
                        }}>{av.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

export function getAvatarById(id) {
    return PRESET_AVATARS.find(a => a.id === id) || PRESET_AVATARS[0];
}

export function AvatarDisplay({ avatarId, size = 36 }) {
    const av = getAvatarById(avatarId);
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%',
            background: `linear-gradient(135deg, ${av.bg}40, ${av.bg}20)`,
            border: `1px solid ${av.bg}50`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: size * 0.5, flexShrink: 0,
        }}>
            {av.emoji}
        </div>
    );
}

export { PRESET_AVATARS };
