'use client';
// components/dashboard/Card.tsx
// Reusable card — fully theme-aware via CSS variables.

import { useTheme } from '../../lib/ThemeContext';

interface CardProps {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  style?: React.CSSProperties;
}

export default function Card({ title, children, action, style }: CardProps) {
  const { isDark, accent } = useTheme();
  
  // Convert hex accent to RGB for gradients
  const accentR = accent.slice(1);
  const r = parseInt(accentR.substring(0, 2), 16);
  const g = parseInt(accentR.substring(2, 4), 16);
  const b = parseInt(accentR.substring(4, 6), 16);
  const accentRGB = `${r},${g},${b}`;

  return (
    <div style={{
      background: isDark
        ? 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)'
        : 'rgba(255,255,255,0.85)',
      border: isDark ? '1px solid rgba(255,255,255,.08)' : '1px solid var(--border)',
      borderRadius: 12,
      padding: 20,
      position: 'relative',
      overflow: 'hidden',
      boxShadow: isDark ? 'none' : 'var(--shadow)',
      ...style,
    }}>
      {/* Top accent line */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:`linear-gradient(90deg, transparent, rgba(${accentRGB},0.4), transparent)` }} />
      {/* Corner accents */}
      <div style={{ position:'absolute', top:-1, left:-1, width:12, height:12, borderTop:`2px solid var(--accent)`, borderLeft:`2px solid var(--accent)`, borderTopLeftRadius:8 }} />
      <div style={{ position:'absolute', top:-1, right:-1, width:12, height:12, borderTop:`2px solid rgba(${accentRGB},0.5)`, borderRight:`2px solid rgba(${accentRGB},0.5)`, borderTopRightRadius:8 }} />

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div style={{
          fontSize:'.72rem', fontWeight:700,
          textTransform:'uppercase', letterSpacing:'.12em',
          color: isDark ? 'rgba(255,255,255,.4)' : '#8090b0',
        }}>{title}</div>
        {action}
      </div>
      {children}
    </div>
  );
}