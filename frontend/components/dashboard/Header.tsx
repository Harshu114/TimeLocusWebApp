'use client';
// components/dashboard/Header.tsx
// Top sticky header bar — theme-aware, includes ThemeToggle switch.

import { User } from '../../types';
import { USER_TYPE_CONFIG, accentRgb } from '../../lib/constants';
import { useTheme } from '../../lib/ThemeContext';
import ThemeToggle from '../ThemeToggle';

interface HeaderProps {
  user: User;
  activeNav: string;
  currentTime: Date;
}

export default function Header({ user, activeNav, currentTime }: HeaderProps) {
  const cfg     = USER_TYPE_CONFIG[user.userType] || USER_TYPE_CONFIG.student;
  const accent  = cfg.accent;
  const accentR = accentRgb(accent);
  const { isDark } = useTheme();

  return (
    <header style={{
      padding: '14px 28px',
      background: isDark
        ? 'linear-gradient(180deg, rgba(6,12,24,.97) 0%, rgba(6,12,24,.92) 100%)'
        : 'linear-gradient(180deg, rgba(240,244,255,.97) 0%, rgba(232,238,248,.95) 100%)',
      borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,.06)' : 'rgba(100,130,200,.15)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 50,
      backdropFilter: 'blur(16px)',
      transition: 'background 0.3s ease, border-color 0.3s ease',
      boxShadow: isDark
        ? '0 1px 20px rgba(0,0,0,0.3)'
        : '0 1px 20px rgba(100,130,200,0.10)',
    }}>
      {/* Tab title with accent underline */}
      <div style={{ position: 'relative' }}>
        <span style={{
          fontFamily: 'Orbitron, monospace',
          fontSize: '1rem', fontWeight: 700,
          color: isDark ? '#fff' : '#1a2340',
          letterSpacing: '0.05em',
        }}>{activeNav}</span>
        <div style={{
          position: 'absolute',
          bottom: -6, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, ${accent}, rgba(${accentR},0.3))`,
          borderRadius: 1,
        }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Live clock */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 14px',
          background: isDark ? 'rgba(255,255,255,.03)' : 'rgba(100,130,200,.08)',
          borderRadius: 6,
          border: `1px solid ${isDark ? 'rgba(255,255,255,.06)' : 'rgba(100,130,200,.15)'}`,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: accent,
            boxShadow: `0 0 8px ${accent}`,
            animation: 'pulse 2s infinite',
          }} />
          <span style={{
            fontFamily: 'monospace', fontSize: '.85rem', fontWeight: 500,
            color: isDark ? 'rgba(255,255,255,.5)' : '#4a5680',
          }}>
            {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        {/* Theme toggle */}
        <ThemeToggle size="sm" />

        {/* User type badge */}
        <div style={{
          padding: '6px 14px', borderRadius: 20,
          border: `1px solid rgba(${accentR},.25)`,
          background: `linear-gradient(135deg, rgba(${accentR},.1), rgba(${accentR},.02))`,
          fontSize: '.75rem', color: accent, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span>{cfg.badge}</span>
          <span>{cfg.label}</span>
        </div>

        {/* Avatar */}
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: `linear-gradient(135deg, ${accent}, #8c3cff)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '.85rem', color: '#fff',
          boxShadow: `0 0 12px rgba(${accentR},.3)`,
        }}>{user.firstName[0]}</div>
      </div>
    </header>
  );
}