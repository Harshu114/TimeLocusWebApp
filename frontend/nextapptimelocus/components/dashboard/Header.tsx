'use client';
// components/dashboard/Header.tsx
// Top sticky header bar showing current tab name, clock, and user badge.

import { User } from '../../types';
import { USER_TYPE_CONFIG, accentRgb } from '../../lib/constants';

interface HeaderProps {
  user: User;
  activeNav: string;
  currentTime: Date;
}

export default function Header({ user, activeNav, currentTime }: HeaderProps) {
  const cfg    = USER_TYPE_CONFIG[user.userType] || USER_TYPE_CONFIG.student;
  const accent = cfg.accent;
  const accentR= accentRgb(accent);

  return (
    <header style={{
      padding: '14px 28px',
      background: 'rgba(6,12,24,.9)',
      borderBottom: '1px solid rgba(255,255,255,.06)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 50,
      backdropFilter: 'blur(12px)',
    }}>
      <span style={{
        fontFamily: 'Orbitron,monospace',
        fontSize: '.95rem', fontWeight: 700, color: '#fff',
      }}>{activeNav}</span>

      <div style={{ display:'flex', alignItems:'center', gap:16 }}>
        {/* Live clock */}
        <span style={{ fontFamily:'monospace', fontSize:'.9rem', color:'rgba(255,255,255,.4)' }}>
          {currentTime.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit' })}
        </span>

        {/* User type badge */}
        <div style={{
          padding: '4px 12px', borderRadius: 20,
          border: `1px solid rgba(${accentR},.3)`,
          background: `rgba(${accentR},.08)`,
          fontSize: '.75rem', color: accent, fontWeight: 600,
        }}>{cfg.badge} {cfg.label}</div>

        {/* Avatar */}
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: `linear-gradient(135deg,${accent},#8c3cff)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '.8rem',
        }}>{user.firstName[0]}</div>
      </div>
    </header>
  );
}
