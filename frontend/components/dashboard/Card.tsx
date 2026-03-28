'use client';
// components/dashboard/Card.tsx
// Reusable card — fully theme-aware via CSS variables.

import { useTheme } from '../../lib/ThemeContext';

interface CardProps {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  style?: React.CSSProperties;
  accent?: string;
}

export default function Card({ title, children, action, style, accent = '#00dcff' }: CardProps) {
  const { isDark } = useTheme();
  const accentR = accent === '#00dcff' ? '0,220,255'
    : accent === '#8c3cff' ? '140,60,255'
    : accent === '#00ff88' ? '0,255,136'
    : '255,107,53';

  return (
    <div style={{
      background: isDark
        ? 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)'
        : 'rgba(255,255,255,0.85)',
      border: isDark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(100,130,200,0.18)',
      borderRadius: 12,
      padding: 20,
      position: 'relative',
      overflow: 'hidden',
      boxShadow: isDark ? 'none' : '0 2px 16px rgba(100,130,200,0.10)',
      ...style,
    }}>
      {/* Top accent line */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:`linear-gradient(90deg, transparent, rgba(${accentR},0.4), transparent)` }} />
      {/* Corner accents */}
      <div style={{ position:'absolute', top:-1, left:-1, width:12, height:12, borderTop:`2px solid ${accent}`, borderLeft:`2px solid ${accent}`, borderTopLeftRadius:8 }} />
      <div style={{ position:'absolute', top:-1, right:-1, width:12, height:12, borderTop:'2px solid rgba(140,60,255,0.5)', borderRight:'2px solid rgba(140,60,255,0.5)', borderTopRightRadius:8 }} />

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