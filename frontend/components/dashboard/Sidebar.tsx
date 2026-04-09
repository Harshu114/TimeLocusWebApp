'use client';
import { User } from '../../types';
import { NAV_ITEMS, USER_TYPE_CONFIG, accentRgb } from '../../lib/constants';
import { useTheme } from '../../lib/ThemeContext';

interface SidebarProps {
  user: User;
  activeNav: string;
  onNavChange: (nav: string) => void;
  onSignOut: () => void;
  expanded: boolean;
  onExpandedChange: (v: boolean) => void;
}

export default function Sidebar({ user, activeNav, onNavChange, onSignOut, expanded, onExpandedChange }: SidebarProps) {
  const effectiveType = user.userType || (user as any).user_type || 'student';
  const cfg      = USER_TYPE_CONFIG[effectiveType] || USER_TYPE_CONFIG.student;
  const navItems = NAV_ITEMS[effectiveType] || NAV_ITEMS.student;
  const { isDark, accent, themeConfig} = useTheme();
  
  // Use theme accent instead of user type accent
  const accentR  = accentRgb(accent);

  const borderClr = 'var(--border)';
  const textClr   = 'var(--text2)';
  const headClr   = 'var(--text)';
  const bgColor   = 'var(--sidebar-bg)';

  const collapsedWidth = 60;
  const expandedWidth = 240;

  return (
    <aside style={{
      width: expanded ? expandedWidth : collapsedWidth,
      flexShrink: 0,
      background: bgColor,
      borderRight: `1px solid ${borderClr}`,
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      zIndex: 100,
      transition: 'width .25s ease',
      overflow: 'hidden',
    }}>
      {/* Top bar with hamburger */}
      <div style={{
        padding: expanded ? '16px 16px' : '16px 12px',
        borderBottom: `1px solid ${borderClr}`,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        {/* Hamburger / Toggle */}
        <button
          onClick={() => onExpandedChange(!expanded)}
          style={{
            width: 32, height: 32,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 5,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: 6,
            flexShrink: 0,
          }}
        >
          <span style={{
            width: 18, height: 2,
            background: accent,
            borderRadius: 2,
            transition: '.2s',
            display: 'block',
          }}/>
          <span style={{
            width: 18, height: 2,
            background: accent,
            borderRadius: 2,
            transition: '.2s',
            display: 'block',
          }}/>
          <span style={{
            width: 18, height: 2,
            background: accent,
            borderRadius: 2,
            transition: '.2s',
            display: 'block',
          }}/>
        </button>

        {/* Logo - only visible when expanded */}
        {expanded && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
            <svg width="26" height="26" viewBox="0 0 36 36" fill="none" style={{ filter: `drop-shadow(0 0 6px ${accent})`, flexShrink: 0 }}>
              <polygon points="18,2 33,10 33,26 18,34 3,26 3,10" stroke={accent} strokeWidth="1.5" fill={`${accent}11`}/>
              <circle cx="18" cy="18" r="3" fill={accent} opacity=".9"/>
            </svg>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '.85rem', letterSpacing: '.08em', color: accent, whiteSpace: 'nowrap' }}>
              TimeLocus
            </span>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', overflowX: 'hidden' }}>
        {navItems.map(([label, emoji]) => {
          const active = activeNav === label;
          return (
            <button
              key={label}
              onClick={() => onNavChange(label)}
              title={!expanded ? label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: expanded ? 10 : 0,
                justifyContent: expanded ? 'flex-start' : 'center',
                padding: expanded ? '10px 12px' : '10px',
                borderRadius: 6,
                cursor: 'pointer',
                fontFamily: "'Exo 2',sans-serif",
                fontSize: '.88rem',
                fontWeight: active ? 600 : 500,
                color: active ? accent : textClr,
                background: active ? `rgba(${accentR},.1)` : 'transparent',
                border: active ? `1px solid rgba(${accentR},.2)` : '1px solid transparent',
                textAlign: 'left',
                transition: '.18s',
                width: '100%',
                minHeight: 42,
              }}
            >
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{emoji}</span>
              {expanded && (
                <>
                  <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{label}</span>
                  {active && <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent, flexShrink: 0 }}/>}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* User info + sign out */}
      <div style={{ padding: expanded ? '12px 14px' : '12px 8px', borderTop: `1px solid ${borderClr}` }}>
        {expanded ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: `linear-gradient(135deg,${accent},#8c3cff)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '.85rem', flexShrink: 0, color: '#fff'
              }}>
                {user.firstName[0]}
              </div>
              <div>
                <div style={{ fontSize: '.82rem', fontWeight: 600, color: headClr, whiteSpace: 'nowrap' }}>
                  {user.firstName} {user.lastName}
                </div>
                <div style={{ fontSize: '.68rem', color: textClr }}>{cfg.badge} {cfg.label}</div>
              </div>
            </div>
            <button onClick={onSignOut} style={{
              width: '100%', padding: '7px',
              background: 'transparent',
              border: `1px solid ${isDark ? 'rgba(255,255,255,.08)' : 'rgba(100,130,200,.2)'}`,
              borderRadius: 4, color: textClr, fontSize: '.75rem',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>Sign Out</button>
          </>
        ) : (
          <>
            {/* Collapsed: avatar only */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <div
                title={`${user.firstName} ${user.lastName}`}
                style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: `linear-gradient(135deg,${accent},#8c3cff)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '.85rem', color: '#fff',
                  cursor: 'pointer',
                }}
              >
                {user.firstName[0]}
              </div>
            </div>
            <button
              onClick={onSignOut}
              title="Sign Out"
              style={{
                width: '100%', padding: '8px',
                background: 'transparent',
                border: `1px solid ${isDark ? 'rgba(255,255,255,.08)' : 'rgba(100,130,200,.2)'}`,
                borderRadius: 4, color: textClr, fontSize: '.7rem',
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
