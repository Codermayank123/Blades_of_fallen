import { useState, useEffect, useMemo } from 'react';

const GAME_MODE_META = {
  duel: { label: 'Arena Duel', color: '#7B2FBE', icon: '⚔️' },
  pixel_code: { label: 'Pixel Code', color: '#00FF88', icon: '🖼️' },
  stack_smash: { label: 'Stack Smash', color: '#FF6B6B', icon: '💥' },
  emoji_escape: { label: 'Emoji Escape', color: '#FFDD00', icon: '😂' },
  meme_wars: { label: 'Meme Wars', color: '#FF69B4', icon: '🏆' },
};

// ── Avatar Builder ────────────────────────────
const AVATAR_OPTIONS = {
  face: ['round','square','oval','heart'],
  skin: ['#FDBCB4','#F1C27D','#E0AC69','#C68642','#8D5524','#2D1B0E'],
  eyes: ['normal','sleepy','star','glasses'],
  mouth: ['smile','smirk','grin','straight'],
  hair: ['short','long','curly','bald','mohawk'],
  hairColor: ['#1a1a1a','#6B3A2A','#D4A017','#C0392B','#2471A3','#E91E8C','#FFFFFF'],
  top: ['hoodie','tshirt','suit'],
  topColor: ['#7B2FBE','#00D4FF','#FF6B6B','#10B981','#F59E0B'],
  accessory: ['none','crown','headphones','halo'],
};

const DEFAULT_AVATAR = { face:'round', skin:'#F1C27D', eyes:'normal', mouth:'smile', hair:'short', hairColor:'#1a1a1a', top:'hoodie', topColor:'#7B2FBE', accessory:'none' };

function AvatarSVG({ opts, size = 120 }) {
  const o = { ...DEFAULT_AVATAR, ...opts };
  const faceRx = { round:50, square:15, oval:40, heart:45 };
  const faceH = o.face === 'oval' ? 70 : 60;
  const hairPaths = {
    short: <rect x="22" y="14" width="76" height="22" rx="14" fill={o.hairColor}/>,
    long: <><rect x="22" y="14" width="76" height="22" rx="14" fill={o.hairColor}/><rect x="15" y="30" width="14" height="50" rx="7" fill={o.hairColor}/><rect x="91" y="30" width="14" height="50" rx="7" fill={o.hairColor}/></>,
    curly: <ellipse cx="60" cy="20" rx="38" ry="16" fill={o.hairColor}/>,
    bald: null,
    mohawk: <rect x="50" y="4" width="20" height="28" rx="10" fill={o.hairColor}/>,
  };
  const eyeSvg = {
    normal: <><circle cx="45" cy="52" r="6" fill="#1a1a1a"/><circle cx="75" cy="52" r="6" fill="#1a1a1a"/><circle cx="47" cy="50" r="2" fill="#fff"/><circle cx="77" cy="50" r="2" fill="#fff"/></>,
    sleepy: <><path d="M39 52 Q45 48 51 52" stroke="#1a1a1a" strokeWidth="2.5" fill="none"/><path d="M69 52 Q75 48 81 52" stroke="#1a1a1a" strokeWidth="2.5" fill="none"/></>,
    star: <><text x="39" y="56" fontSize="13" fill="#FFD700">⭐</text><text x="69" y="56" fontSize="13" fill="#FFD700">⭐</text></>,
    glasses: <><rect x="35" y="46" width="22" height="14" rx="6" fill="none" stroke="#555" strokeWidth="2"/><rect x="63" y="46" width="22" height="14" rx="6" fill="none" stroke="#555" strokeWidth="2"/><line x1="57" y1="53" x2="63" y2="53" stroke="#555" strokeWidth="2"/><circle cx="46" cy="53" r="4" fill="#00D4FF" opacity={0.3}/><circle cx="74" cy="53" r="4" fill="#00D4FF" opacity={0.3}/></>,
  };
  const mouthSvg = {
    smile: <path d="M46 68 Q60 78 74 68" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round"/>,
    smirk: <path d="M46 68 Q56 74 68 66" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round"/>,
    grin: <path d="M44 68 Q60 80 76 68 Q60 76 44 68Z" fill="#1a1a1a"/>,
    straight: <line x1="46" y1="70" x2="74" y2="70" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"/>,
  };
  const topSvg = {
    hoodie: <><rect x="10" y="98" width="100" height="40" rx="10" fill={o.topColor}/><rect x="35" y="98" width="50" height="30" rx="5" fill={`${o.topColor}cc`}/><ellipse cx="60" cy="98" rx="22" ry="10" fill={`${o.topColor}aa`}/></>,
    tshirt: <><rect x="12" y="98" width="96" height="38" rx="8" fill={o.topColor}/><path d="M12 98 L25 88 L35 98" fill={`${o.topColor}cc`}/><path d="M108 98 L95 88 L85 98" fill={`${o.topColor}cc`}/></>,
    suit: <><rect x="12" y="98" width="96" height="38" rx="8" fill="#1F2937"/><rect x="48" y="98" width="24" height="38" fill="#fff" opacity={0.08}/><rect x="56" y="98" width="8" height="38" fill={o.topColor} opacity={0.7}/></>,
  };
  const accessories = {
    none: null,
    crown: <text x="37" y="24" fontSize="28">👑</text>,
    headphones: <text x="32" y="52" fontSize="26">🎧</text>,
    halo: <ellipse cx="60" cy="12" rx="26" ry="7" fill="none" stroke="#FFD700" strokeWidth="3" opacity={0.8}/>,
  };
  return (
    <svg viewBox="0 0 120 138" width={size} height={size * 138/120} style={{ display:'block' }}>
      {/* neck */}
      <rect x="48" y="86" width="24" height="18" rx="6" fill={o.skin}/>
      {/* body */}
      {topSvg[o.top] || topSvg.hoodie}
      {/* hair back */}
      {hairPaths[o.hair]}
      {/* face */}
      <ellipse cx="60" cy="52" rx="38" ry={faceH/2} fill={o.skin}/>
      {/* eyes */}
      {eyeSvg[o.eyes] || eyeSvg.normal}
      {/* mouth */}
      {mouthSvg[o.mouth] || mouthSvg.smile}
      {/* nose */}
      <ellipse cx="60" cy="62" rx="4" ry="3" fill={o.skin} stroke="rgba(0,0,0,0.15)" strokeWidth="1"/>
      {/* accessory */}
      {accessories[o.accessory]}
    </svg>
  );
}

function AvatarBuilder({ initial, onSave }) {
  const [opts, setOpts] = useState({ ...DEFAULT_AVATAR, ...initial });
  const [activeSection, setActiveSection] = useState('face');
  const [saving, setSaving] = useState(false);

  const sections = [
    { id:'face', label:'Face', fields:[
      { key:'face', label:'Shape', type:'text', options: AVATAR_OPTIONS.face },
      { key:'skin', label:'Skin', type:'color', options: AVATAR_OPTIONS.skin },
      { key:'eyes', label:'Eyes', type:'text', options: AVATAR_OPTIONS.eyes },
      { key:'mouth', label:'Mouth', type:'text', options: AVATAR_OPTIONS.mouth },
    ]},
    { id:'hair', label:'Hair', fields:[
      { key:'hair', label:'Style', type:'text', options: AVATAR_OPTIONS.hair },
      { key:'hairColor', label:'Color', type:'color', options: AVATAR_OPTIONS.hairColor },
    ]},
    { id:'outfit', label:'Outfit', fields:[
      { key:'top', label:'Top', type:'text', options: AVATAR_OPTIONS.top },
      { key:'topColor', label:'Color', type:'color', options: AVATAR_OPTIONS.topColor },
    ]},
    { id:'extras', label:'Extras', fields:[
      { key:'accessory', label:'Accessory', type:'text', options: AVATAR_OPTIONS.accessory },
    ]},
  ];

  const randomize = () => {
    const rand = (arr) => arr[Math.floor(Math.random()*arr.length)];
    setOpts({
      face: rand(AVATAR_OPTIONS.face), skin: rand(AVATAR_OPTIONS.skin),
      eyes: rand(AVATAR_OPTIONS.eyes), mouth: rand(AVATAR_OPTIONS.mouth),
      hair: rand(AVATAR_OPTIONS.hair), hairColor: rand(AVATAR_OPTIONS.hairColor),
      top: rand(AVATAR_OPTIONS.top), topColor: rand(AVATAR_OPTIONS.topColor),
      accessory: rand(AVATAR_OPTIONS.accessory),
    });
  };

  const handleSave = async () => {
    setSaving(true);
    // Serialize avatar to data URL string
    const svgStr = `<svg viewBox="0 0 120 138" xmlns="http://www.w3.org/2000/svg"><!-- avatar:${JSON.stringify(opts)} --></svg>`;
    const avatarData = `data:application/json;base64,${btoa(JSON.stringify(opts))}`;
    await onSave(avatarData, opts);
    setSaving(false);
  };

  const sec = sections.find(s => s.id === activeSection) || sections[0];

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, alignItems:'start' }}>
      {/* Preview */}
      <div style={{ textAlign:'center' }}>
        <div style={{ display:'inline-flex', padding:20, borderRadius:24, background:'linear-gradient(135deg,rgba(123,47,190,0.1),rgba(0,212,255,0.08))', border:'1px solid rgba(255,255,255,0.08)', marginBottom:16, position:'relative' }}>
          <AvatarSVG opts={opts} size={140}/>
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          <button className="btn2" onClick={randomize} style={{ flex:1 }}>🎲 Randomize</button>
          <button className="btn2 btn2--primary" onClick={handleSave} disabled={saving} style={{ flex:1 }}>
            {saving ? '...' : '✅ Save Avatar'}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div>
        {/* Section Tabs */}
        <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
          {sections.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              style={{ padding:'6px 14px', borderRadius:20, cursor:'pointer', fontSize:'0.75rem', fontWeight:700, border:`1px solid ${activeSection===s.id ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.08)'}`, background: activeSection===s.id ? 'rgba(0,212,255,0.1)' : 'transparent', color: activeSection===s.id ? 'var(--c-cyan)' : 'var(--c-text-dim)', transition:'all 0.2s' }}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Fields */}
        {sec.fields.map(f => (
          <div key={f.key} style={{ marginBottom:16 }}>
            <div style={{ fontSize:'0.65rem', color:'var(--c-text-off)', textTransform:'uppercase', letterSpacing:2, marginBottom:8 }}>{f.label}</div>
            {f.type === 'color' ? (
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {f.options.map(c => (
                  <button key={c} onClick={() => setOpts(p=>({...p,[f.key]:c}))}
                    style={{ width:32, height:32, borderRadius:'50%', background:c, border:`2.5px solid ${opts[f.key]===c ? '#fff' : 'transparent'}`, cursor:'pointer', boxShadow: opts[f.key]===c ? `0 0 10px ${c}80` : 'none', transition:'all 0.2s' }}/>
                ))}
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(80px,1fr))', gap:6 }}>
                {f.options.map(v => (
                  <button key={v} onClick={() => setOpts(p=>({...p,[f.key]:v}))}
                    style={{ padding:'8px 4px', borderRadius:8, cursor:'pointer', fontSize:'0.7rem', fontWeight:600, textTransform:'capitalize', border:`1.5px solid ${opts[f.key]===v ? 'var(--c-cyan)' : 'rgba(255,255,255,0.08)'}`, background: opts[f.key]===v ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.02)', color: opts[f.key]===v ? 'var(--c-cyan)' : 'var(--c-text-dim)', transition:'all 0.2s' }}>
                    {v}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Screen ────────────────────────────────
export default function ProfileScreen({ user, onBack }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState('');
  const [avatarTab, setAvatarTab] = useState('build'); // 'build' | 'upload'

  const isProduction = window.location.protocol === 'https:';
  const API_URL = import.meta.env.VITE_API_URL || (isProduction
    ? `https://${window.location.hostname.replace('frontend','backend')}/api`
    : 'http://localhost:3001/api');

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/user/profile`, { headers: { Authorization: `Bearer ${token}` } });
      setProfile(res.ok ? (await res.json()).user || null : user);
    } catch { setProfile(user); }
    finally { setLoading(false); }
  };

  const saveAvatar = async (avatarData) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/user/avatar`, {
        method:'PATCH',
        headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
        body: JSON.stringify({ avatar: avatarData }),
      });
      if (res.ok) {
        const data = await res.json();
        const av = data.user?.avatar || avatarData;
        setProfile(p => ({...p, avatar: av}));
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        stored.avatar = av;
        localStorage.setItem('user', JSON.stringify(stored));
        setToast('Avatar saved!');
      } else setToast('Save failed');
    } catch { setToast('Save failed'); }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500_000) { setToast('File too large — max 500KB'); return; }
    const reader = new FileReader();
    reader.onload = async () => { setUploading(true); await saveAvatar(reader.result); setUploading(false); };
    reader.readAsDataURL(file);
  };

  useEffect(() => { if (toast) { const t = setTimeout(()=>setToast(''), 3000); return ()=>clearTimeout(t); } }, [toast]);

  const p = profile || user || {};
  const displayName = p.username || 'Player';
  const wins = p.stats?.wins || p.wins || 0;
  const losses = p.stats?.losses || p.losses || 0;
  const total = wins + losses;
  const winRate = total ? ((wins/total)*100).toFixed(1) : '0.0';
  const elo = p.stats?.elo || p.elo || 1000;
  const level = p.level || Math.floor((p.stats?.xp || p.xp || 0)/100)+1;
  const matchHistory = p.matchHistory || [];
  const rawGameStats = p.gameStats || {};
  const gameStatsEntries = Object.entries(rawGameStats).filter(([,s])=>s&&(s.wins||s.losses||s.total));

  const getRankName = (e) => e>=2200?'Master':e>=1800?'Diamond':e>=1500?'Platinum':e>=1200?'Gold':e>=900?'Silver':'Bronze';
  const getRankColor = (n) => ({Master:'#fb7185',Diamond:'#67e8f9',Platinum:'#a5b4fc',Gold:'#fbbf24',Silver:'#cbd5e1',Bronze:'#d97706'}[n]||'#d97706');
  const rankName = getRankName(elo);
  const rankColor = getRankColor(rankName);
  const initials = displayName.slice(0,2).toUpperCase();

  // Parse stored avatar opts if data URI
  const storedOpts = useMemo(() => {
    if (!p.avatar) return null;
    try {
      if (p.avatar.startsWith('data:application/json;base64,')) return JSON.parse(atob(p.avatar.split(',')[1]));
    } catch {}
    return null;
  }, [p.avatar]);

  if (loading) return (
    <div className="screen fade-in">
      <div className="panel" style={{ maxWidth:500, width:'100%', textAlign:'center', padding:'var(--sp-12)' }}>
        <div style={{ color:'var(--c-text-off)' }}>Loading profile...</div>
      </div>
    </div>
  );

  return (
    <div className="screen fade-in" style={{ padding:'var(--sp-4)', paddingTop:'64px', justifyContent:'flex-start' }}>
      <div style={{ maxWidth:620, width:'100%', margin:'0 auto' }}>
        {toast && <div className={`toast ${toast.includes('fail')?'toast--error':'toast--success'}`}>{toast}</div>}

        {/* Avatar + Name */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:'var(--sp-6)' }}>
          <div style={{ width:88, height:88, borderRadius:'50%', overflow:'hidden', marginBottom:'var(--sp-4)', border:`2px solid ${rankColor}`, boxShadow:`0 0 20px ${rankColor}33`, display:'flex', alignItems:'center', justifyContent:'center', background: p.avatar ? 'transparent' : 'var(--c-surface2)' }}>
            {storedOpts ? (
              <AvatarSVG opts={storedOpts} size={88}/>
            ) : p.avatar ? (
              <img src={p.avatar} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
            ) : (
              <span style={{ fontFamily:'var(--f-mono)', fontSize:'1.4rem', fontWeight:800, color:rankColor }}>{initials}</span>
            )}
          </div>
          <h2 style={{ fontFamily:'var(--f-mono)', fontSize:'1.2rem', fontWeight:700, letterSpacing:'2px', marginBottom:'var(--sp-1)' }}>{displayName.toUpperCase()}</h2>
          <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-2)' }}>
            <span className="badge" style={{ background:`${rankColor}18`, color:rankColor, borderColor:`${rankColor}33` }}>{rankName}</span>
            <span style={{ fontSize:'0.75rem', color:'var(--c-text-off)' }}>Level {level}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="section-label">Stats</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'var(--sp-3)', marginBottom:'var(--sp-6)' }}>
          {[{label:'ELO',value:elo,color:'var(--c-amber)'},{label:'Wins',value:wins,color:'var(--c-green)'},{label:'Losses',value:losses,color:'var(--c-red)'},{label:'Win %',value:`${winRate}%`,color:'var(--c-cyan)'}].map(s=>(
            <div className="stat-card" key={s.label}>
              <div className="stat-card__value" style={{color:s.color}}>{s.value}</div>
              <div className="stat-card__label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Avatar Builder */}
        <div className="section-label">Avatar</div>
        <div className="panel" style={{ padding:'var(--sp-5)', marginBottom:'var(--sp-5)' }}>
          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            {['build','upload'].map(t=>(
              <button key={t} onClick={()=>setAvatarTab(t)}
                style={{ padding:'6px 16px', borderRadius:20, cursor:'pointer', fontSize:'0.75rem', fontWeight:700, border:`1px solid ${avatarTab===t?'rgba(0,212,255,0.4)':'rgba(255,255,255,0.08)'}`, background:avatarTab===t?'rgba(0,212,255,0.1)':'transparent', color:avatarTab===t?'var(--c-cyan)':'var(--c-text-dim)', transition:'all 0.2s' }}>
                {t === 'build' ? '🎨 Build Avatar' : '📷 Upload Photo'}
              </button>
            ))}
          </div>
          {avatarTab === 'build' ? (
            <AvatarBuilder initial={storedOpts || DEFAULT_AVATAR} onSave={saveAvatar}/>
          ) : (
            <div style={{ textAlign:'center', padding:'var(--sp-6)' }}>
              <div style={{ width:80, height:80, borderRadius:'50%', overflow:'hidden', margin:'0 auto var(--sp-4)', border:`2px solid ${rankColor}`, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--c-surface2)', position:'relative' }}>
                {p.avatar && !p.avatar.startsWith('data:application/json') ? (
                  <img src={p.avatar} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                ) : (<span style={{ fontFamily:'var(--f-mono)', fontSize:'1.4rem', fontWeight:800, color:rankColor }}>{initials}</span>)}
                {uploading && <div style={{ position:'absolute',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.7rem',color:'var(--c-text)' }}>...</div>}
              </div>
              <label className="btn2 btn2--primary" style={{ cursor:'pointer', display:'inline-block' }}>
                📷 Choose Photo
                <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display:'none' }}/>
              </label>
              <div style={{ marginTop:8, fontSize:'0.7rem', color:'var(--c-text-off)' }}>Max 500KB · JPG/PNG/GIF</div>
            </div>
          )}
        </div>

        {/* Per-Game Breakdown */}
        {gameStatsEntries.length > 0 && (
          <>
            <div className="section-label">Per-Game Breakdown</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:'var(--sp-3)', marginBottom:'var(--sp-6)' }}>
              {gameStatsEntries.map(([mode,s]) => {
                const meta = GAME_MODE_META[mode] || { label:mode, color:'#94a3b8', icon:'🎮' };
                const gW=s.wins||0, gL=s.losses||0, gT=s.total||(gW+gL);
                const gWR=gT?((gW/gT)*100).toFixed(0):'0';
                return (
                  <div key={mode} className="panel" style={{ padding:'var(--sp-4)', borderLeft:`3px solid ${meta.color}`, background:'var(--c-surface)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-2)', marginBottom:'var(--sp-3)' }}>
                      <span style={{ fontSize:'1.3rem' }}>{meta.icon}</span>
                      <span style={{ fontFamily:'var(--f-mono)', fontWeight:700, fontSize:'0.85rem', color:meta.color }}>{meta.label}</span>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'var(--sp-2)', textAlign:'center' }}>
                      {[{l:'W',v:gW,c:'var(--c-green)'},{l:'L',v:gL,c:'var(--c-red)'},{l:'Total',v:gT,c:'var(--c-text)'},{l:'Win%',v:`${gWR}%`,c:'var(--c-cyan)'}].map(st=>(
                        <div key={st.l}>
                          <div style={{ fontSize:'1rem', fontWeight:700, fontFamily:'var(--f-mono)', color:st.c }}>{st.v}</div>
                          <div style={{ fontSize:'0.6rem', color:'var(--c-text-off)', textTransform:'uppercase', letterSpacing:'1px' }}>{st.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Match History */}
        <div className="section-label">Recent Matches</div>
        <div className="panel" style={{ padding:'var(--sp-4)', marginBottom:'var(--sp-6)' }}>
          {matchHistory.length === 0 ? (
            <div style={{ textAlign:'center', padding:'var(--sp-8)', color:'var(--c-text-off)', fontSize:'0.85rem' }}>No matches played yet</div>
          ) : matchHistory.slice(0,10).map((m,i) => {
            const isWin = m.result==='win', isDraw = m.result==='draw';
            return (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'var(--sp-3) 0', borderBottom: i<matchHistory.length-1?'1px solid var(--c-border)':'none' }}>
                <div>
                  <div style={{ fontSize:'0.85rem', fontWeight:600 }}>{m.gameType||'Unknown'}</div>
                  <div style={{ fontSize:'0.7rem', color:'var(--c-text-off)' }}>vs {m.opponent||'Unknown'}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:'0.8rem', fontWeight:700, color:isDraw?'var(--c-amber)':(isWin?'var(--c-green)':'var(--c-red)') }}>{isDraw?'Draw':(isWin?'Victory':'Defeat')}</div>
                  {m.eloChange!==undefined && <div style={{ fontSize:'0.7rem', color:m.eloChange>=0?'var(--c-green)':'var(--c-red)' }}>{m.eloChange>=0?'+':''}{m.eloChange} ELO</div>}
                </div>
              </div>
            );
          })}
        </div>

        <button className="btn2 btn2--ghost btn2--block" onClick={onBack}>Back to Arcade</button>
      </div>
    </div>
  );
}
