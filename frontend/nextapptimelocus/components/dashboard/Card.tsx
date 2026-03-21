'use client';
// components/dashboard/Card.tsx
// Reusable card container used across all dashboard tabs.
// Keeps consistent styling in one place.

interface CardProps {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  style?: React.CSSProperties;
}

export default function Card({ title, children, action, style }: CardProps) {
  return (
    <div style={{
      background: 'rgba(255,255,255,.025)',
      border: '1px solid rgba(255,255,255,.07)',
      borderRadius: 8, padding: 20, ...style,
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div style={{
          fontSize: '.72rem', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '.12em',
          color: 'rgba(255,255,255,.35)',
        }}>{title}</div>
        {action}
      </div>
      {children}
    </div>
  );
}
