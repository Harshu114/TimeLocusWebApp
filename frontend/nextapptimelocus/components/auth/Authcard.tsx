'use client';
// components/auth/AuthCard.tsx
// The glowing cyberpunk card container used by both Login and Signup.
// Keeps all the shared card styling in one place.

import { useFloatingEmojis } from '../../hooks/useFloatingEmojis';

interface AuthCardProps {
  children: React.ReactNode;
  maxWidth?: number;
}

export default function AuthCard({ children, maxWidth = 420 }: AuthCardProps) {
  const particles = useFloatingEmojis(22);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Exo+2:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080c14; }

        .ac-root {
          min-height: 100vh; width: 100%; display: flex; align-items: center;
          justify-content: center; background: #080c14; position: relative;
          overflow: hidden; font-family: 'Exo 2', sans-serif; padding: 24px;
        }
        .ac-bg { position:absolute;inset:0;pointer-events:none;
          background:radial-gradient(ellipse 80% 60% at 20% 20%,rgba(0,220,255,.05) 0%,transparent 60%),
            radial-gradient(ellipse 60% 80% at 80% 80%,rgba(140,60,255,.06) 0%,transparent 60%); }
        .ac-grid { position:absolute;inset:0;pointer-events:none;
          background-image:linear-gradient(rgba(0,220,255,.04) 1px,transparent 1px),
            linear-gradient(90deg,rgba(0,220,255,.04) 1px,transparent 1px);
          background-size:60px 60px; }
        .ac-emoji { position:absolute;pointer-events:none;user-select:none;
          filter:drop-shadow(0 0 6px rgba(0,220,255,.3)); }

        .ac-card {
          position:relative;z-index:10;width:100%;
          background:rgba(8,16,32,.92);border:1px solid rgba(0,220,255,.15);border-radius:6px;
          padding:44px 40px 38px;backdrop-filter:blur(28px);
          box-shadow:0 0 0 1px rgba(140,60,255,.08),0 40px 100px rgba(0,0,0,.75),
            inset 0 1px 0 rgba(255,255,255,.05);
          animation:cardIn .55s cubic-bezier(.22,1,.36,1) both;
        }
        @keyframes cardIn { from{opacity:0;transform:translateY(28px) scale(.96)} to{opacity:1;transform:none} }

        .ac-ring { position:absolute;inset:-1px;border-radius:6px;
          background:conic-gradient(from var(--a,0deg),transparent,#00dcff 80deg,transparent 160deg,#8c3cff 240deg,transparent 320deg);
          -webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);
          mask-composite:exclude;padding:1px;animation:spin-r 6s linear infinite;pointer-events:none; }
        @property --a { syntax:'<angle>';initial-value:0deg;inherits:false; }
        @keyframes spin-r { to{--a:360deg;} }

        .ac-c { position:absolute;width:14px;height:14px;pointer-events:none; }
        .ac-c-tl { top:-1px;left:-1px;border-top:2px solid #00dcff;border-left:2px solid #00dcff; }
        .ac-c-tr { top:-1px;right:-1px;border-top:2px solid #8c3cff;border-right:2px solid #8c3cff; }
        .ac-c-bl { bottom:-1px;left:-1px;border-bottom:2px solid #8c3cff;border-left:2px solid #8c3cff; }
        .ac-c-br { bottom:-1px;right:-1px;border-bottom:2px solid #00dcff;border-right:2px solid #00dcff; }

        .ac-logo { display:flex;align-items:center;gap:10px;margin-bottom:28px; }
        .ac-logo-name { font-family:'Orbitron',monospace;font-weight:700;font-size:1.05rem;
          letter-spacing:.18em;color:#00dcff;text-shadow:0 0 24px rgba(0,220,255,.55); }
      `}</style>

      <div className="ac-root">
        <div className="ac-bg" />
        <div className="ac-grid" />

        {particles.map(p => (
          <span key={p.id} className="ac-emoji" style={{
            left:`${p.x}%`, top:`${p.y}%`,
            fontSize:`${p.size}px`, opacity:p.opacity,
            transform:`rotate(${p.rotation}deg)`,
          }}>{p.emoji}</span>
        ))}

        <div className="ac-card" style={{ maxWidth }}>
          <div className="ac-ring" />
          <div className="ac-c ac-c-tl"/><div className="ac-c ac-c-tr"/>
          <div className="ac-c ac-c-bl"/><div className="ac-c ac-c-br"/>

          {/* Logo — same on every auth page */}
          <div className="ac-logo">
            <svg width="34" height="34" viewBox="0 0 36 36" fill="none"
              style={{ filter:'drop-shadow(0 0 10px #00dcff)' }}>
              <polygon points="18,2 33,10 33,26 18,34 3,26 3,10"
                stroke="#00dcff" strokeWidth="1.5" fill="rgba(0,220,255,0.07)" />
              <polygon points="18,8 27,13 27,23 18,28 9,23 9,13"
                stroke="#8c3cff" strokeWidth="1" fill="none" opacity=".5" />
              <circle cx="18" cy="18" r="3.5" fill="#00dcff" opacity=".9" />
            </svg>
            <span className="ac-logo-name">TimeLocus</span>
          </div>

          {children}
        </div>
      </div>
    </>
  );
}
