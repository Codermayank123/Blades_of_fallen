// SVG icons for Code Arena game modes — all crafted SVG, zero emoji as UI

export const LogoMain = () => (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="36" height="36" rx="8" stroke="url(#mainGrad)" strokeWidth="2" fill="rgba(0,212,255,0.06)" />
        <path d="M12 14L8 20L12 26" stroke="#00D4FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M28 14L32 20L28 26" stroke="#7B2FBE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M23 12L17 28" stroke="url(#mainGrad)" strokeWidth="2" strokeLinecap="round" />
        <defs>
            <linearGradient id="mainGrad" x1="0" y1="0" x2="40" y2="40">
                <stop stopColor="#00D4FF" />
                <stop offset="1" stopColor="#7B2FBE" />
            </linearGradient>
        </defs>
    </svg>
);

export const DuelIcon = ({ size = 32, color = '#7B2FBE' }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        {/* Two swords crossing */}
        <path d="M4 4L18 18" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <path d="M4 4l4 1M4 4l1 4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M28 4L14 18" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <path d="M28 4l-4 1M28 4l-1 4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M12 20l-4 4" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <path d="M20 20l4 4" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <circle cx="16" cy="18" r="2" fill={color} opacity="0.6"/>
        {/* Spark */}
        <path d="M16 14v-2M16 22v-2M14 18h-2M20 18h-2" stroke="#FFD700" strokeWidth="1" strokeLinecap="round"/>
    </svg>
);

export const PixelCodeIcon = ({ size = 32, color = '#00FF88' }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <rect x="2" y="5" width="28" height="22" rx="3" stroke={color} strokeWidth="1.5" fill="none"/>
        <rect x="2" y="5" width="28" height="5" rx="3" fill={`${color}18`}/>
        <circle cx="6" cy="7.5" r="1" fill="#EF4444"/>
        <circle cx="10" cy="7.5" r="1" fill="#F59E0B"/>
        <circle cx="14" cy="7.5" r="1" fill="#10B981"/>
        {/* Pixel grid */}
        {[0,1,2,3].map(r => [0,1,2,3,4,5].map(c => (
            <rect key={`${r}${c}`} x={4+c*4} y={13+r*3.2} width="3" height="2.5" rx="0.4"
                fill={color} opacity={(r+c)%3===0 ? 0.8 : 0.2}/>
        )))}
    </svg>
);

export const StackSmashIcon = ({ size = 32, color = '#FF6B6B' }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <rect x="2" y="4" width="28" height="24" rx="3" stroke={color} strokeWidth="1.5" fill="none"/>
        <path d="M2 9h28" stroke={color} strokeWidth="1" opacity="0.5"/>
        <circle cx="6" cy="6.5" r="1" fill={color} opacity="0.5"/>
        <circle cx="10" cy="6.5" r="1" fill={color} opacity="0.5"/>
        {/* Stack frames */}
        <rect x="5" y="12" width="22" height="3" rx="1" fill={`${color}35`} stroke={color} strokeWidth="0.8"/>
        <rect x="5" y="16.5" width="17" height="3" rx="1" fill={`${color}25`} stroke={color} strokeWidth="0.8"/>
        <rect x="5" y="21" width="12" height="3" rx="1" fill={`${color}15`} stroke={color} strokeWidth="0.8"/>
        {/* Explosion */}
        <path d="M19 10L23 6M21 10L25 7" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="22" cy="6" r="1.5" fill="#FFD700" opacity="0.7"/>
    </svg>
);

export const EmojiEscapeIcon = ({ size = 32, color = '#FFDD00' }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        {/* Chat bubble */}
        <path d="M4 6h24a2 2 0 012 2v12a2 2 0 01-2 2H18l-4 4-4-4H4a2 2 0 01-2-2V8a2 2 0 012-2z"
            stroke={color} strokeWidth="1.5" fill={`${color}10`}/>
        {/* Three dots representing emojis */}
        <circle cx="10" cy="14" r="2.5" fill={color} opacity="0.9"/>
        <circle cx="16" cy="14" r="2.5" fill={color} opacity="0.7"/>
        <circle cx="22" cy="14" r="2.5" fill={color} opacity="0.5"/>
        {/* Smile on first dot */}
        <path d="M9 14.5 Q10 15.5 11 14.5" stroke="#0A0E1A" strokeWidth="0.8" strokeLinecap="round"/>
        {/* Speed lines */}
        <path d="M26 8l2-1M27 10l2 0M26 12l2 1" stroke={color} strokeWidth="0.8" strokeLinecap="round" opacity="0.5"/>
    </svg>
);

export const MemeWarsIcon = ({ size = 32, color = '#FF69B4' }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        {/* Trophy body */}
        <path d="M11 4h10v11a5 5 0 01-10 0V4z" stroke={color} strokeWidth="1.5" fill={`${color}12`}/>
        {/* Handles */}
        <path d="M6 6H11" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M21 6H26" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M6 6Q5 10 9 11" stroke={color} strokeWidth="1" strokeLinecap="round" fill="none"/>
        <path d="M26 6Q27 10 23 11" stroke={color} strokeWidth="1" strokeLinecap="round" fill="none"/>
        {/* Stem */}
        <path d="M16 20v4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M11 24h10" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        {/* Star */}
        <path d="M16 8l.8 2h2l-1.6 1.2.6 2L16 12l-1.8 1.2.6-2L13.2 10h2z" fill={color} opacity="0.85"/>
    </svg>
);

// Alias for backward-compat with old names
export const IconDuel = DuelIcon;
export const IconBugBounty = StackSmashIcon;
export const IconAlgoArena = PixelCodeIcon;
export const IconCipherClash = EmojiEscapeIcon;
export const IconQueryQuest = MemeWarsIcon;

// Game mode icon map — updated for new games
export const GAME_ICONS = {
    duel: DuelIcon,
    pixel_code: PixelCodeIcon,
    stack_smash: StackSmashIcon,
    emoji_escape: EmojiEscapeIcon,
    meme_wars: MemeWarsIcon,
};
