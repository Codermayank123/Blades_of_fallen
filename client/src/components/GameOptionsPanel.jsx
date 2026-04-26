import { useState } from 'react';

const PIXEL_CODE_OPTIONS = {
  difficulty: [
    { value: null, label: 'Progressive', emoji: '📈' },
    { value: 'beginner', label: 'Beginner', emoji: '🟢' },
    { value: 'intermediate', label: 'Intermediate', emoji: '🟡' },
    { value: 'expert', label: 'Expert', emoji: '🔴' },
  ],
  language: [
    { value: null, label: 'Mixed', emoji: '🌍' },
    { value: 'javascript', label: 'JavaScript', emoji: '⚡' },
    { value: 'python', label: 'Python', emoji: '🐍' },
    { value: 'rust', label: 'Rust', emoji: '⚙️' },
  ],
};

const STACK_SMASH_OPTIONS = {
  difficulty: [
    { value: null, label: 'Progressive', emoji: '📈' },
    { value: 'rookie', label: 'Rookie', emoji: '🟢' },
    { value: 'elite', label: 'Elite', emoji: '🟡' },
    { value: 'legend', label: 'Legend', emoji: '🔴' },
  ],
  language: [
    { value: null, label: 'Mixed', emoji: '🌍' },
    { value: 'javascript', label: 'JavaScript', emoji: '⚡' },
    { value: 'python', label: 'Python', emoji: '🐍' },
    { value: 'java', label: 'Java', emoji: '☕' },
    { value: 'rust', label: 'Rust', emoji: '⚙️' },
  ],
};

const EMOJI_ESCAPE_OPTIONS = {
  category: [
    { value: null, label: 'Mixed', emoji: '🎲' },
    { value: 'movies', label: 'Movies', emoji: '🎬' },
    { value: 'songs', label: 'Songs', emoji: '🎵' },
    { value: 'coding', label: 'Coding Jokes', emoji: '👨‍💻' },
    { value: 'proverbs', label: 'Proverbs', emoji: '📜' },
  ],
};

const MEME_WARS_OPTIONS = {
  rounds: [
    { value: 4, label: '4 Rounds', emoji: '⚡' },
    { value: 6, label: '6 Rounds', emoji: '🎯' },
    { value: 8, label: '8 Rounds', emoji: '🏆' },
  ],
};

// Backward-compat: keep old game IDs in case server sends them
const BUG_BOUNTY_OPTIONS = {
  difficulty: [
    { value: null, label: 'Progressive', emoji: '📈' },
    { value: 'rookie', label: 'Rookie', emoji: '🟢' },
    { value: 'elite', label: 'Elite', emoji: '🟡' },
    { value: 'legend', label: 'Legend', emoji: '🔴' },
  ],
  language: [
    { value: null, label: 'Mixed', emoji: '🌍' },
    { value: 'javascript', label: 'JavaScript', emoji: '⚡' },
    { value: 'python', label: 'Python', emoji: '🐍' },
    { value: 'java', label: 'Java', emoji: '☕' },
  ],
};

export default function GameOptionsPanel({ gameType, accentColor = '#00D4FF', onStart, startLabel = 'Start Game' }) {
  const [options, setOptions] = useState({});

  const handleOption = (key, value) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleStart = () => onStart?.(options);

  // Map game type → option sets for new games
  let optionSets = [];
  if (gameType === 'pixel_code') {
    optionSets = [
      { key: 'difficulty', label: 'Difficulty', items: PIXEL_CODE_OPTIONS.difficulty },
      { key: 'language', label: 'Language', items: PIXEL_CODE_OPTIONS.language },
    ];
  } else if (gameType === 'stack_smash') {
    optionSets = [
      { key: 'difficulty', label: 'Difficulty', items: STACK_SMASH_OPTIONS.difficulty },
      { key: 'language', label: 'Language', items: STACK_SMASH_OPTIONS.language },
    ];
  } else if (gameType === 'emoji_escape') {
    optionSets = [
      { key: 'category', label: 'Category', items: EMOJI_ESCAPE_OPTIONS.category },
    ];
  } else if (gameType === 'meme_wars') {
    optionSets = [
      { key: 'rounds', label: 'Rounds', items: MEME_WARS_OPTIONS.rounds },
    ];
  } else if (gameType === 'bug_bounty') {
    optionSets = [
      { key: 'difficulty', label: 'Difficulty', items: BUG_BOUNTY_OPTIONS.difficulty },
      { key: 'language', label: 'Language', items: BUG_BOUNTY_OPTIONS.language },
    ];
  }

  const pillStyle = (isActive) => ({
    padding: '8px 16px', borderRadius: 999,
    border: `1.5px solid ${isActive ? accentColor : 'rgba(255,255,255,0.08)'}`,
    background: isActive ? `${accentColor}18` : 'rgba(255,255,255,0.02)',
    color: isActive ? accentColor : 'var(--c-text-dim)',
    cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
    letterSpacing: '0.5px', transition: 'all 0.2s',
    display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }}>
      {optionSets.length === 0 && (
        <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--c-text-dim)', padding: '12px 0' }}>
          No extra options for this game. Ready to play!
        </div>
      )}
      {optionSets.map(set => (
        <div key={set.key}>
          <div style={{ fontFamily: 'var(--f-heading)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--c-text-off)', marginBottom: '10px' }}>{set.label}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {set.items.map(item => (
              <button key={String(item.value)} onClick={() => handleOption(set.key, item.value)} style={pillStyle(options[set.key] === item.value)}>
                <span>{item.emoji}</span> {item.label}
              </button>
            ))}
          </div>
        </div>
      ))}

      <button onClick={handleStart} className="btn-neon" style={{ alignSelf: 'center', marginTop: '8px', borderColor: accentColor, color: accentColor }}>
        {startLabel}
      </button>
    </div>
  );
}
