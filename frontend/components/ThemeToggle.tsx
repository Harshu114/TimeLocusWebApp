'use client';
// components/ThemeToggle.tsx
// Always renders — no mounted guard needed.

import { useTheme } from '../lib/ThemeContext';

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg';
}

export default function ThemeToggle({ size = 'md' }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();

  const dims = {
    sm: { w: 52, h: 26, knob: 20, pad: 3, icon: 11 },
    md: { w: 62, h: 32, knob: 24, pad: 4, icon: 13 },
    lg: { w: 72, h: 38, knob: 28, pad: 5, icon: 15 },
  }[size];

  const knobTravel = dims.w - dims.knob - dims.pad * 2;

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      style={{
        position: 'relative',
        width: dims.w,
        height: dims.h,
        borderRadius: dims.h / 2,
        border: isDark
          ? '1.5px solid rgba(255,255,255,0.18)'
          : '1.5px solid rgba(100,130,200,0.45)',
        background: isDark
          ? 'linear-gradient(135deg, #0e1828 0%, #111a2c 100%)'
          : 'linear-gradient(135deg, #c8d8f8 0%, #deeaff 100%)',
        cursor: 'pointer',
        padding: 0,
        flexShrink: 0,
        transition: 'all 0.3s ease',
        boxShadow: isDark
          ? '0 2px 12px rgba(0,0,0,0.5)'
          : '0 2px 12px rgba(100,130,200,0.35)',
        overflow: 'hidden',
        display: 'block',
      }}
    >
      {/* Background dots */}
      {isDark ? (
        <>
          <span style={{ position:'absolute', width:2, height:2, borderRadius:'50%', background:'rgba(255,255,255,0.7)', top:'28%', left:'18%', pointerEvents:'none' }} />
          <span style={{ position:'absolute', width:1.5, height:1.5, borderRadius:'50%', background:'rgba(255,255,255,0.45)', top:'58%', left:'26%', pointerEvents:'none' }} />
          <span style={{ position:'absolute', width:1, height:1, borderRadius:'50%', background:'rgba(255,255,255,0.55)', top:'38%', left:'12%', pointerEvents:'none' }} />
        </>
      ) : (
        <>
          <span style={{ position:'absolute', width:9, height:5, borderRadius:4, background:'rgba(255,255,255,0.8)', top:'20%', left:'10%', pointerEvents:'none' }} />
          <span style={{ position:'absolute', width:6, height:3, borderRadius:3, background:'rgba(255,255,255,0.6)', top:'55%', left:'16%', pointerEvents:'none' }} />
        </>
      )}

      {/* Sliding knob */}
      <div
        style={{
          position: 'absolute',
          top: dims.pad,
          left: dims.pad,
          width: dims.knob,
          height: dims.knob,
          borderRadius: '50%',
          background: isDark
            ? 'linear-gradient(135deg, #c0c8e0 0%, #8090b8 100%)'
            : 'linear-gradient(135deg, #ffe066 0%, #ffbb00 100%)',
          boxShadow: isDark
            ? '0 2px 8px rgba(0,0,0,0.6)'
            : '0 2px 8px rgba(255,160,0,0.5), 0 0 14px rgba(255,200,0,0.3)',
          transform: isDark
            ? `translateX(${knobTravel}px)`
            : 'translateX(0px)',
          transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), background 0.3s ease, box-shadow 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isDark ? (
          <svg width={dims.icon} height={dims.icon} viewBox="0 0 24 24" fill="none">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="rgba(255,255,255,0.9)" />
          </svg>
        ) : (
          <svg width={dims.icon} height={dims.icon} viewBox="0 0 24 24" fill="none" stroke="#b8600a" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="4" fill="#b8600a" stroke="none" />
            <line x1="12" y1="2"   x2="12" y2="5" />
            <line x1="12" y1="19"  x2="12" y2="22" />
            <line x1="4.22"  y1="4.22"  x2="6.34"  y2="6.34" />
            <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
            <line x1="2"  y1="12" x2="5"  y2="12" />
            <line x1="19" y1="12" x2="22" y2="12" />
            <line x1="4.22"  y1="19.78" x2="6.34"  y2="17.66" />
            <line x1="17.66" y1="6.34"  x2="19.78" y2="4.22" />
          </svg>
        )}
      </div>
    </button>
  );
}