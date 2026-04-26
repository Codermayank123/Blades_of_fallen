export const BRAND = {
    name: 'Code Arena',
    shortName: 'CODE',
    tagline: 'Code. Battle. Dominate.',
    hub: 'Battle Hub',
    quickPlay: 'Quick Match',
    hostArena: 'Host Room',
    enterArena: 'Enter Game',
    returnToHub: 'Back to Hub',
    matchComplete: 'Challenge Complete',
};

export const GAME_CATEGORIES = {
    action: { label: 'Action', icon: '⚔️', color: '#7B2FBE', gradient: 'linear-gradient(135deg, #7B2FBE, #5B21B6)' },
    coding: { label: 'Coding', icon: '🧠', color: '#00D4FF', gradient: 'linear-gradient(135deg, #00D4FF, #0891B2)' },
    fun: { label: 'Fun & Social', icon: '🎉', color: '#FF69B4', gradient: 'linear-gradient(135deg, #FF69B4, #FF1493)' },
};

export const GAME_MODE_META = {
    duel: { label: 'Arena Duel', icon: '⚔️', color: '#7B2FBE', desc: 'Classic 1v1 fighting duel — battle in real-time', category: 'action', players: '2', tag: 'CLASSIC' },
    pixel_code: { label: 'Pixel Code', icon: '🖼️', color: '#00FF88', desc: 'Read pixel art — pick the code that draws it', category: 'coding', players: '2-8', tag: 'VISUAL' },
    stack_smash: { label: 'Stack Smash', icon: '💥', color: '#FF6B6B', desc: 'Find the bug crashing the call stack', category: 'coding', players: '2-8', tag: 'DEBUG' },
    emoji_escape: { label: 'Emoji Escape', icon: '😂', color: '#FFDD00', desc: 'Decode emoji stories — fastest wins!', category: 'fun', players: '2-8', tag: 'FAST' },
    meme_wars: { label: 'Meme Wars', icon: '🏆', color: '#FF69B4', desc: 'Write the funniest caption. Community votes.', category: 'fun', players: '3-8', tag: 'VOTE' },
};

export const MODE_LABELS = Object.fromEntries(
    Object.entries(GAME_MODE_META).map(([k, v]) => [k, v.label])
);
