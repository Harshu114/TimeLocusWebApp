'use client';
// components/dashboard/Sidebar.tsx
// The left navigation sidebar of the dashboard.
// Receives user data and the active nav state from the parent.

import { User } from '../../types';
import { NAV_ITEMS, USER_TYPE_CONFIG, accentRgb } from '../../lib/constants';

interface SidebarProps {
  user: User;
  activeNav: string;
  onNavChange: (nav: string) => void;
  onSignOut: () => void;
}

export default function Sidebar({ user, activeNav, onNavChange, onSignOut }: SidebarProps) {
  const cfg      = USER_TYPE_CONFIG[user.userType] || USER_TYPE_CONFIG.student;
  const accent   = cfg.accent;
  const accentR  = accentRgb(accent);
  const navItems = NAV_ITEMS[user.userType] || NAV_ITEMS.student;

  return (
    <aside style={{
      width: 240, flexShrink: 0,
      background: 'rgba(6,12,24,.97)',
      borderRight: '1px solid rgba(255,255,255,.06)',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding:'22px 20px', borderBottom:'1px solid rgba(255,255,255,.06)', display:'flex', alignItems:'center', gap:10 }}>
        <svg width="30" height="30" viewBox="0 0 36 36" fill="none"
          style={{ filter:`drop-shadow(0 0 8px ${accent})` }}>
          <polygon points="18,2 33,10 33,26 18,34 3,26 3,10"
            stroke={accent} strokeWidth="1.5" fill={`${accent}11`} />
          <circle cx="18" cy="18" r="3" fill={accent} opacity=".9" />
        </svg>
        <span style={{
          fontFamily:'Orbitron,monospace', fontWeight:700, fontSize:'.88rem',
          letterSpacing:'.15em', color:accent, textShadow:`0 0 20px ${accent}88`,
        }}>TimeLocus</span>
      </div>

      {/* Navigation items */}
      <nav style={{ flex:1, padding:'12px 10px', display:'flex', flexDirection:'column', gap:3, overflowY:'auto' }}>
        {navItems.map(([label, emoji]) => {
          const active = activeNav === label;
          return (
            <button key={label} onClick={() => onNavChange(label)} style={{
              display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
              borderRadius:6, cursor:'pointer', fontFamily:"'Exo 2',sans-serif",
              fontSize:'.88rem', fontWeight: active ? 600 : 500,
              color: active ? accent : 'rgba(255,255,255,.45)',
              background: active ? `rgba(${accentR},.1)` : 'transparent',
              border: active ? `1px solid rgba(${accentR},.2)` : '1px solid transparent',
              textAlign:'left', transition:'.18s',
            }}>
              <span style={{ fontSize:'1rem' }}>{emoji}</span>
              <span>{label}</span>
              {active && (
                <span style={{ marginLeft:'auto', width:6, height:6, borderRadius:'50%', background:accent }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* User card + sign out */}
      <div style={{ padding:'14px 16px', borderTop:'1px solid rgba(255,255,255,.06)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
          <div style={{
            width:34, height:34, borderRadius:'50%',
            background:`linear-gradient(135deg,${accent},#8c3cff)`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontWeight:700, fontSize:'.85rem', flexShrink:0,
          }}>{user.firstName[0]}</div>
          <div>
            <div style={{ fontSize:'.85rem', fontWeight:600, color:'#fff' }}>
              {user.firstName} {user.lastName}
            </div>
            <div style={{ fontSize:'.7rem', color:'rgba(255,255,255,.3)' }}>
              {cfg.badge} {cfg.label}
            </div>
          </div>
        </div>
        <button onClick={onSignOut} style={{
          width:'100%', padding:'7px', background:'transparent',
          border:'1px solid rgba(255,255,255,.08)', borderRadius:4,
          color:'rgba(255,255,255,.35)', fontSize:'.75rem',
          cursor:'pointer', fontFamily:'inherit', transition:'.2s',
        }}>Sign Out</button>
      </div>
    </aside>
  );
}
