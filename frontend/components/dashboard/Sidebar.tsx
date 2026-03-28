'use client';
import { User } from '../../types';
import { NAV_ITEMS, USER_TYPE_CONFIG, accentRgb } from '../../lib/constants';
import { useTheme } from '../../lib/ThemeContext';

interface SidebarProps {
  user: User;
  activeNav: string;
  onNavChange: (nav: string) => void;
  onSignOut: () => void;
}

export default function Sidebar({ user, activeNav, onNavChange, onSignOut }: SidebarProps) {
  // Check for both userType and user_type, default to 'student'
  const effectiveType = user.userType || (user as any).user_type || 'student';
  const cfg      = USER_TYPE_CONFIG[effectiveType] || USER_TYPE_CONFIG.student;
  const accent   = cfg.accent;
  const accentR  = accentRgb(accent);
  const navItems = NAV_ITEMS[effectiveType] || NAV_ITEMS.student;
  const { isDark } = useTheme();

  const borderClr = 'var(--border)';
  const textClr   = 'var(--text2)';
  const headClr   = 'var(--text)';
  const bgColor   = 'var(--sidebar-bg)';

  return (
    <aside style={{
      width: 240, flexShrink: 0, background: bgColor,
      borderRight: `1px solid ${borderClr}`,
      display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding:'22px 20px', borderBottom:`1px solid ${borderClr}`, display:'flex', alignItems:'center', gap:10 }}>
        <svg width="30" height="30" viewBox="0 0 36 36" fill="none" style={{ filter:`drop-shadow(0 0 8px ${accent})` }}>
          <polygon points="18,2 33,10 33,26 18,34 3,26 3,10" stroke={accent} strokeWidth="1.5" fill={`${accent}11`}/>
          <circle cx="18" cy="18" r="3" fill={accent} opacity=".9"/>
        </svg>
        <span style={{ fontFamily:'Orbitron,monospace', fontWeight:700, fontSize:'.88rem', letterSpacing:'.15em', color:accent }}>
          TimeLocus
        </span>
      </div>

      {/* Nav items */}
      <nav style={{ flex:1, padding:'12px 10px', display:'flex', flexDirection:'column', gap:3, overflowY:'auto' }}>
        {navItems.map(([label, emoji]) => {
          const active = activeNav === label;
          return (
            <button key={label} onClick={() => onNavChange(label)} style={{
              display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:6,
              cursor:'pointer', fontFamily:"'Exo 2',sans-serif", fontSize:'.88rem',
              fontWeight: active ? 600 : 500,
              color:      active ? accent : textClr,
              background: active ? `rgba(${accentR},.1)` : 'transparent',
              border:     active ? `1px solid rgba(${accentR},.2)` : '1px solid transparent',
              textAlign:'left', transition:'.18s',
            }}>
              <span style={{ fontSize:'1rem' }}>{emoji}</span>
              <span>{label}</span>
              {active && <span style={{ marginLeft:'auto', width:6, height:6, borderRadius:'50%', background:accent }}/>}
            </button>
          );
        })}
      </nav>

      {/* User info + sign out */}
      <div style={{ padding:'14px 16px', borderTop:`1px solid ${borderClr}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
          <div style={{ width:34, height:34, borderRadius:'50%', background:`linear-gradient(135deg,${accent},#8c3cff)`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'.85rem', flexShrink:0, color:'#fff' }}>
            {user.firstName[0]}
          </div>
          <div>
            <div style={{ fontSize:'.85rem', fontWeight:600, color:headClr }}>{user.firstName} {user.lastName}</div>
            <div style={{ fontSize:'.7rem', color:textClr }}>{cfg.badge} {cfg.label}</div>
          </div>
        </div>
        <button onClick={onSignOut} style={{
          width:'100%', padding:'7px', background:'transparent',
          border:`1px solid ${isDark ? 'rgba(255,255,255,.08)' : 'rgba(100,130,200,.2)'}`,
          borderRadius:4, color:textClr, fontSize:'.75rem', cursor:'pointer', fontFamily:'inherit',
        }}>Sign Out</button>
      </div>
    </aside>
  );
}