'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Particle canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const COLORS = ['#ff0080', '#00ffff', '#b060ff'];
    const particles = Array.from({ length: 70 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      r: Math.random() * 1.8 + 0.6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: Math.random() * 0.5 + 0.15,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error || 'Invalid credentials.'); return; }
      router.push('/dashboard');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Rajdhani:wght@300;400;500;600&display=swap');

        .tl-root {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #020810;
          position: relative;
          overflow: hidden;
          padding: 24px;
          box-sizing: border-box;
          font-family: 'Rajdhani', sans-serif;
        }

        /* dot grid */
        .tl-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(0,245,255,0.06) 1px, transparent 1px);
          background-size: 34px 34px;
          pointer-events: none;
          z-index: 0;
        }

        /* scan line sweep */
        .tl-root::after {
          content: '';
          position: absolute;
          left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(0,245,255,0.18), transparent);
          animation: scanline 6s linear infinite;
          z-index: 1;
          pointer-events: none;
        }

        @keyframes scanline {
          0%   { top: -2px; opacity: 0; }
          5%   { opacity: 1; }
          95%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }

        .tl-orb-a {
          position: absolute;
          width: 600px; height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(176,96,255,0.12) 0%, transparent 70%);
          top: -180px; right: -180px;
          filter: blur(60px);
          pointer-events: none;
          z-index: 0;
        }

        .tl-orb-b {
          position: absolute;
          width: 480px; height: 480px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0,245,255,0.08) 0%, transparent 70%);
          bottom: -160px; left: -160px;
          filter: blur(60px);
          pointer-events: none;
          z-index: 0;
        }

        .tl-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 420px;
          background: rgba(6, 14, 28, 0.88);
          border-radius: 4px;
          padding: 44px 40px 36px;
          box-sizing: border-box;
          backdrop-filter: blur(24px);
          /* sharp cyberpunk border with corner cuts via clip-path illusion */
          border: 1px solid rgba(0,245,255,0.12);
          box-shadow:
            0 0 0 1px rgba(176,96,255,0.08),
            0 32px 80px rgba(0,0,0,0.7),
            inset 0 1px 0 rgba(255,255,255,0.04);
          animation: cardIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }

        /* spinning conic border */
        .tl-ring {
          position: absolute;
          inset: -1px;
          border-radius: 4px;
          background: conic-gradient(
            from var(--angle, 0deg),
            transparent 0deg,
            #00f5ff 80deg,
            transparent 160deg,
            #b060ff 240deg,
            transparent 320deg
          );
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          padding: 1px;
          animation: spin-ring 5s linear infinite;
          pointer-events: none;
        }

        @property --angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }

        @keyframes spin-ring {
          to { --angle: 360deg; }
        }

        /* corner accents */
        .tl-corner {
          position: absolute;
          width: 16px; height: 16px;
          pointer-events: none;
        }
        .tl-corner-tl { top: -1px; left: -1px; border-top: 2px solid #00f5ff; border-left: 2px solid #00f5ff; }
        .tl-corner-tr { top: -1px; right: -1px; border-top: 2px solid #b060ff; border-right: 2px solid #b060ff; }
        .tl-corner-bl { bottom: -1px; left: -1px; border-bottom: 2px solid #b060ff; border-left: 2px solid #b060ff; }
        .tl-corner-br { bottom: -1px; right: -1px; border-bottom: 2px solid #00f5ff; border-right: 2px solid #00f5ff; }

        .tl-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 28px;
          animation: fadeUp 0.5s 0.1s both;
        }

        .tl-logo-hex {
          width: 34px; height: 34px;
          position: relative;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .tl-logo-hex svg {
          width: 34px; height: 34px;
          filter: drop-shadow(0 0 8px #00f5ff);
        }

        .tl-logo-text {
          font-family: 'Orbitron', monospace;
          font-weight: 700;
          font-size: 1.1rem;
          letter-spacing: 0.15em;
          color: #00f5ff;
          text-shadow: 0 0 20px rgba(0,245,255,0.5);
          text-transform: uppercase;
        }

        .tl-heading {
          font-family: 'Orbitron', monospace;
          font-weight: 700;
          font-size: 1.6rem;
          color: #fff;
          letter-spacing: -0.01em;
          margin: 0 0 6px;
          animation: fadeUp 0.5s 0.15s both;
        }

        .tl-sub {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.32);
          margin: 0 0 30px;
          font-weight: 400;
          letter-spacing: 0.02em;
          animation: fadeUp 0.5s 0.2s both;
        }

        .tl-error {
          background: rgba(255,40,80,0.09);
          border: 1px solid rgba(255,40,80,0.28);
          border-radius: 3px;
          color: #ff6080;
          font-size: 0.82rem;
          padding: 10px 14px;
          margin-bottom: 20px;
          letter-spacing: 0.02em;
          animation: shake 0.35s both;
        }

        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-4px); }
          60%      { transform: translateX(4px); }
        }

        .tl-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
          animation: fadeUp 0.5s 0.25s both;
        }

        .tl-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .tl-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .tl-label {
          font-size: 0.68rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: rgba(255,255,255,0.38);
        }

        .tl-forgot {
          font-size: 0.72rem;
          color: rgba(0,245,255,0.55);
          text-decoration: none;
          letter-spacing: 0.04em;
          transition: color 0.2s;
        }
        .tl-forgot:hover { color: #00f5ff; }

        .tl-input-wrap {
          position: relative;
        }

        .tl-input {
          width: 100%;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.09);
          padding: 13px 16px;
          border-radius: 3px;
          color: #fff;
          font-size: 0.92rem;
          font-family: 'Rajdhani', sans-serif;
          font-weight: 500;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.22s, background 0.22s, box-shadow 0.22s;
          letter-spacing: 0.02em;
        }

        .tl-input::placeholder { color: rgba(255,255,255,0.18); }

        .tl-input:focus {
          border-color: #00f5ff;
          background: rgba(0,245,255,0.035);
          box-shadow: 0 0 0 3px rgba(0,245,255,0.07), 0 0 18px rgba(0,245,255,0.06);
        }

        .tl-input-pr { padding-right: 46px; }

        .tl-eye {
          position: absolute;
          right: 13px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(255,255,255,0.28);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          transition: color 0.2s;
          line-height: 0;
        }
        .tl-eye:hover { color: #00f5ff; }

        /* focus glow line under input */
        .tl-input-glow {
          position: absolute;
          bottom: 0; left: 10%; width: 80%;
          height: 1px;
          background: linear-gradient(90deg, transparent, #00f5ff, transparent);
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
          border-radius: 9px;
        }
        .tl-input:focus ~ .tl-input-glow { opacity: 1; }

        .tl-btn {
          position: relative;
          overflow: hidden;
          background: linear-gradient(100deg, #00c8d4, #b060ff);
          border: none;
          padding: 15px;
          border-radius: 3px;
          color: #fff;
          font-family: 'Orbitron', monospace;
          font-weight: 600;
          font-size: 0.75rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          cursor: pointer;
          margin-top: 4px;
          transition: opacity 0.2s, transform 0.18s, box-shadow 0.25s;
          box-shadow: 0 0 24px rgba(0,200,212,0.2), 0 0 48px rgba(176,96,255,0.1);
        }

        .tl-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.14) 50%, transparent 65%);
          transform: translateX(-120%);
          transition: transform 0.55s ease;
        }
        .tl-btn:hover::before { transform: translateX(120%); }

        .tl-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 0 32px rgba(0,200,212,0.35), 0 0 64px rgba(176,96,255,0.18);
        }
        .tl-btn:active:not(:disabled) { transform: translateY(0); }
        .tl-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        .tl-btn-inner {
          display: flex; align-items: center; justify-content: center; gap: 9px;
          position: relative; z-index: 1;
        }

        .tl-spinner {
          width: 15px; height: 15px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.65s linear infinite;
          flex-shrink: 0;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .tl-footer {
          text-align: center;
          margin-top: 26px;
          font-size: 0.83rem;
          color: rgba(255,255,255,0.28);
          letter-spacing: 0.03em;
          animation: fadeUp 0.5s 0.35s both;
        }

        .tl-footer a {
          color: #00f5ff;
          text-decoration: none;
          margin-left: 5px;
          font-weight: 600;
          transition: text-shadow 0.2s;
        }
        .tl-footer a:hover { text-shadow: 0 0 12px #00f5ff; }

        /* divider */
        .tl-divider {
          display: flex; align-items: center; gap: 12px; margin: 2px 0;
        }
        .tl-divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.07); }
        .tl-divider-text { font-size: 0.7rem; color: rgba(255,255,255,0.2); letter-spacing: 0.08em; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="tl-root">
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
        <div className="tl-orb-a" />
        <div className="tl-orb-b" />

        <div className="tl-card">
          <div className="tl-ring" />
          <div className="tl-corner tl-corner-tl" />
          <div className="tl-corner tl-corner-tr" />
          <div className="tl-corner tl-corner-bl" />
          <div className="tl-corner tl-corner-br" />

          {/* Logo */}
          <div className="tl-logo">
            <div className="tl-logo-hex">
              <svg viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="17,2 31,9.5 31,24.5 17,32 3,24.5 3,9.5" stroke="#00f5ff" strokeWidth="1.5" fill="rgba(0,245,255,0.07)" />
                <polygon points="17,7 26,12 26,22 17,27 8,22 8,12" stroke="#b060ff" strokeWidth="1" fill="none" opacity="0.5" />
                <circle cx="17" cy="17" r="3" fill="#00f5ff" opacity="0.9" />
              </svg>
            </div>
            <span className="tl-logo-text">TimeLocus</span>
          </div>

          <h1 className="tl-heading">Welcome back</h1>
          <p className="tl-sub">Enter your credentials to access your vault</p>

          {error && <div className="tl-error">{error}</div>}

          <form onSubmit={handleSubmit} className="tl-form">
            {/* Email */}
            <div className="tl-field">
              <label className="tl-label">Email Address</label>
              <div className="tl-input-wrap">
                <input
                  type="email"
                  className="tl-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
                <span className="tl-input-glow" />
              </div>
            </div>

            {/* Password */}
            <div className="tl-field">
              <div className="tl-label-row">
                <label className="tl-label">Password</label>
                <Link href="/forgot-password" className="tl-forgot">Forgot?</Link>
              </div>
              <div className="tl-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="tl-input tl-input-pr"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="tl-eye"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
                <span className="tl-input-glow" />
              </div>
            </div>

            <button type="submit" className="tl-btn" disabled={loading}>
              <span className="tl-btn-inner">
                {loading ? <><span className="tl-spinner" /> Signing in...</> : 'Sign In'}
              </span>
            </button>
          </form>

          <p className="tl-footer">
            Don&apos;t have an account?
            <Link href="/signup">Create one</Link>
          </p>
        </div>
      </div>
    </>
  );
}