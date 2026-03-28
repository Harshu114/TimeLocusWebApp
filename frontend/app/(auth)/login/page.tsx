'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../../lib/ThemeContext';
import ThemeToggle from '../../../components/ThemeToggle';

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = 'email' | 'password' | 'forgot';

// ─── Floating emoji particle ──────────────────────────────────────────────────
const EMOJIS = ['⏱️','📅','🎯','✅','⚡','🧠','📊','🔥','💡','🚀','⏰','📌','🏆','💎','🌟','📈'];
interface EmojiParticle { id: number; emoji: string; x: number; y: number; size: number; speed: number; drift: number; opacity: number; rotation: number; rotSpeed: number; }

function useFloatingEmojis(count = 22) {
  const [particles, setParticles] = useState<EmojiParticle[]>([]);
  useEffect(() => {
    setParticles(Array.from({ length: count }, (_, i) => ({
      id: i,
      emoji: EMOJIS[i % EMOJIS.length],
      x: Math.random() * 100,
      y: Math.random() * 120 - 20,
      size: Math.random() * 18 + 16,
      speed: Math.random() * 0.015 + 0.006,
      drift: (Math.random() - 0.5) * 0.02,
      opacity: Math.random() * 0.35 + 0.1,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 0.3,
    })));
  }, [count]);

  useEffect(() => {
    let frame: number;
    const tick = () => {
      setParticles(prev => prev.map(p => {
        let y = p.y - p.speed;
        let x = p.x + p.drift;
        if (y < -12) { y = 110; x = Math.random() * 100; }
        if (x < -5) x = 105;
        if (x > 105) x = -5;
        return { ...p, y, x, rotation: p.rotation + p.rotSpeed };
      }));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return particles;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LoginPage() {
  const [step, setStep] = useState<Step>('email');
  const { isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [userName, setUserName] = useState('');
  const particles = useFloatingEmojis(22);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, [step]);

const checkEmail = async () => {
  if (!email.trim() || !email.includes('@')) { 
    setError('Please enter a valid email address.'); 
    return; 
  }
  setError(''); 
  setLoading(true);
  try {
    const res = await fetch(`/api/auth/check-user?identifier=${encodeURIComponent(email)}`);
    if (!res.ok) throw new Error('Server error');
    
    const data = await res.json();
    if (data.exists) {
      setUserName(data.firstName || '');
      setStep('password');
    } else {
      // Nice UX: Passing email to signup page
      window.location.href = `/signup?email=${encodeURIComponent(email)}`;
    }
  } catch (err) {
    setError('System offline. Please try again later.');
  } finally { setLoading(false); }
};

  const handleLogin = async () => {
    if (!password) { setError('Enter your password.'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Invalid credentials.'); return; }
      localStorage.setItem('tl_token', data.token);
      localStorage.setItem('tl_user', JSON.stringify(data.user));
      window.location.href = '/dashboard';
    } catch {
      setError('Connection error. Please try again.');
    } finally { setLoading(false); }
  };

  const handleForgot = async () => {
    if (!forgotEmail.includes('@')) { setError('Enter a valid email.'); return; }
    setError(''); setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setInfo('If that email exists, a reset link has been sent.');
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (step === 'email') checkEmail();
      else if (step === 'password') handleLogin();
      else if (step === 'forgot') handleForgot();
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Exo+2:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg, #080c14); }

        .lp-root {
          min-height: 100vh; width: 100%; display: flex; align-items: center;
          justify-content: center; background: var(--bg, #080c14); position: relative;
          overflow: hidden; font-family: 'Exo 2', sans-serif;
        }

        /* radial mesh background */
        .lp-bg {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 80% 60% at 20% 20%, rgba(0,220,255,0.05) 0%, transparent 60%),
            radial-gradient(ellipse 60% 80% at 80% 80%, rgba(140,60,255,0.06) 0%, transparent 60%),
            radial-gradient(ellipse 100% 100% at 50% 50%, rgba(255,20,100,0.03) 0%, transparent 70%);
        }

        /* grid lines */
        .lp-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(0,220,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,220,255,0.04) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        /* floating emoji */
        .lp-emoji {
          position: absolute; pointer-events: none; user-select: none;
          filter: drop-shadow(0 0 6px rgba(0,220,255,0.3));
          will-change: transform;
          font-style: normal;
        }

        /* card */
        .lp-card {
          position: relative; z-index: 10; width: 100%; max-width: 420px;
          margin: 24px;
          background: rgba(8, 16, 32, 0.92);
          border: 1px solid rgba(0,220,255,0.15);
          border-radius: 6px;
          padding: 48px 40px 40px;
          backdrop-filter: blur(28px);
          box-shadow:
            0 0 0 1px rgba(140,60,255,0.08),
            0 40px 100px rgba(0,0,0,0.75),
            inset 0 1px 0 rgba(255,255,255,0.05);
          animation: cardIn .55s cubic-bezier(.22,1,.36,1) both;
        }
        @keyframes cardIn { from { opacity:0; transform: translateY(28px) scale(.96); } to { opacity:1; transform: none; } }

        /* spinning ring */
        .lp-ring {
          position: absolute; inset: -1px; border-radius: 6px;
          background: conic-gradient(from var(--a,0deg), transparent, #00dcff 80deg, transparent 160deg, #8c3cff 240deg, transparent 320deg);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude; padding: 1px;
          animation: spin-r 6s linear infinite; pointer-events: none;
        }
        @property --a { syntax:'<angle>'; initial-value:0deg; inherits:false; }
        @keyframes spin-r { to { --a:360deg; } }

        /* corners */
        .lp-c { position:absolute; width:14px; height:14px; pointer-events:none; }
        .lp-c-tl { top:-1px; left:-1px; border-top:2px solid #00dcff; border-left:2px solid #00dcff; }
        .lp-c-tr { top:-1px; right:-1px; border-top:2px solid #8c3cff; border-right:2px solid #8c3cff; }
        .lp-c-bl { bottom:-1px; left:-1px; border-bottom:2px solid #8c3cff; border-left:2px solid #8c3cff; }
        .lp-c-br { bottom:-1px; right:-1px; border-bottom:2px solid #00dcff; border-right:2px solid #00dcff; }

        /* logo */
        .lp-logo { display:flex; align-items:center; gap:10px; margin-bottom:32px; }
        .lp-logo-icon { width:36px; height:36px; }
        .lp-logo-icon svg { filter: drop-shadow(0 0 10px #00dcff); }
        .lp-logo-name { font-family:'Orbitron',monospace; font-weight:700; font-size:1.05rem; letter-spacing:.18em; color:#00dcff; text-shadow:0 0 24px rgba(0,220,255,.55); }

        /* step labels */
        .lp-step-label { font-size:.66rem; font-weight:600; letter-spacing:.22em; text-transform:uppercase; color:rgba(0,220,255,.45); margin-bottom:12px; }

        .lp-heading { font-family:'Orbitron',monospace; font-weight:700; font-size:1.55rem; color:#fff; margin-bottom:6px; letter-spacing:-.01em; }
        .lp-sub { font-size:.88rem; color:rgba(255,255,255,.3); margin-bottom:28px; }

        /* user greeting */
        .lp-user-badge {
          display:inline-flex; align-items:center; gap:8px;
          background:rgba(0,220,255,.08); border:1px solid rgba(0,220,255,.18);
          border-radius:20px; padding:5px 14px 5px 8px; margin-bottom:22px;
        }
        .lp-user-avatar {
          width:26px; height:26px; border-radius:50%;
          background:linear-gradient(135deg,#00dcff,#8c3cff);
          display:flex; align-items:center; justify-content:center;
          font-size:.75rem; font-weight:700; color:#fff;
        }
        .lp-user-name { font-size:.82rem; color:#00dcff; font-weight:500; }

        /* error / info */
        .lp-error { background:rgba(255,40,80,.09); border:1px solid rgba(255,40,80,.28); border-radius:4px; color:#ff6080; font-size:.82rem; padding:10px 14px; margin-bottom:18px; animation:shake .35s both; }
        .lp-info  { background:rgba(0,220,255,.08); border:1px solid rgba(0,220,255,.25); border-radius:4px; color:#00dcff; font-size:.82rem; padding:10px 14px; margin-bottom:18px; }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 60%{transform:translateX(5px)} }

        /* field */
        .lp-field { display:flex; flex-direction:column; gap:7px; margin-bottom:18px; }
        .lp-label { font-size:.67rem; font-weight:600; text-transform:uppercase; letter-spacing:.12em; color:rgba(255,255,255,.35); }
        .lp-input-wrap { position:relative; }
        .lp-input {
          width:100%; background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.09);
          padding:13px 16px; border-radius:4px; color:#fff; font-family:'Exo 2',sans-serif;
          font-size:.92rem; font-weight:500; outline:none; transition:.22s;
        }
        .lp-input::placeholder { color:rgba(255,255,255,.18); }
        .lp-input:focus { border-color:#00dcff; background:rgba(0,220,255,.04); box-shadow:0 0 0 3px rgba(0,220,255,.08),0 0 20px rgba(0,220,255,.07); }
        .lp-input-pr { padding-right:46px; }
        .lp-glow { position:absolute; bottom:0; left:10%; width:80%; height:1px; background:linear-gradient(90deg,transparent,#00dcff,transparent); opacity:0; transition:.3s; pointer-events:none; border-radius:9px; }
        .lp-input:focus ~ .lp-glow { opacity:1; }
        .lp-eye { position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; color:rgba(255,255,255,.28); cursor:pointer; padding:4px; display:flex; align-items:center; transition:.2s; line-height:0; }
        .lp-eye:hover { color:#00dcff; }

        /* button */
        .lp-btn {
          width:100%; position:relative; overflow:hidden;
          background:linear-gradient(105deg,#00b8d4,#8c3cff);
          border:none; padding:15px; border-radius:4px; color:#fff;
          font-family:'Orbitron',monospace; font-weight:600; font-size:.72rem;
          letter-spacing:.18em; text-transform:uppercase; cursor:pointer;
          transition:.2s; box-shadow:0 0 30px rgba(0,184,212,.2),0 0 60px rgba(140,60,255,.1);
        }
        .lp-btn::before { content:''; position:absolute; inset:0; background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.14) 50%,transparent 65%); transform:translateX(-120%); transition:.55s ease; }
        .lp-btn:hover::before { transform:translateX(120%); }
        .lp-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 0 40px rgba(0,184,212,.35),0 0 80px rgba(140,60,255,.2); }
        .lp-btn:disabled { opacity:.55; cursor:not-allowed; }
        .lp-btn-inner { display:flex; align-items:center; justify-content:center; gap:9px; position:relative; z-index:1; }

        /* spinner */
        .lp-spin { width:15px; height:15px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .65s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }

        /* links */
        .lp-links { display:flex; justify-content:space-between; margin-top:22px; }
        .lp-link { font-size:.8rem; color:rgba(0,220,255,.6); text-decoration:none; cursor:pointer; background:none; border:none; font-family:inherit; transition:.2s; }
        .lp-link:hover { color:#00dcff; text-shadow:0 0 10px #00dcff; }
        .lp-divider { flex:1; height:1px; background:rgba(255,255,255,.06); margin:0 12px; align-self:center; }

        /* back button */
        .lp-back { display:inline-flex; align-items:center; gap:6px; background:none; border:none; color:rgba(255,255,255,.3); font-size:.78rem; cursor:pointer; font-family:'Exo 2',sans-serif; margin-bottom:20px; transition:.2s; padding:0; }
        .lp-back:hover { color:#00dcff; }

        /* step transition */
        .lp-step-enter { animation:stepIn .3s cubic-bezier(.22,1,.36,1) both; }
        @keyframes stepIn { from { opacity:0; transform:translateX(16px); } to { opacity:1; transform:none; } }

        /* signup hint */
        .lp-signup-hint { text-align:center; margin-top:24px; font-size:.82rem; color:rgba(255,255,255,.25); }
        .lp-signup-hint a { color:#00dcff; text-decoration:none; margin-left:4px; font-weight:600; }
        .lp-signup-hint a:hover { text-shadow:0 0 10px #00dcff; }
      `}</style>

      <div className="lp-root">
        <div className="lp-bg" />
        <div className="lp-grid" />

        {/* Floating emojis */}
        <div style={{ position:'fixed', top:16, right:16, zIndex:200 }}><ThemeToggle /></div>
        {particles.map(p => (
          <span key={p.id} className="lp-emoji" style={{
            left: `${p.x}%`, top: `${p.y}%`,
            fontSize: `${p.size}px`, opacity: p.opacity,
            transform: `rotate(${p.rotation}deg)`,
          }}>{p.emoji}</span>
        ))}

        <div className="lp-card">
          <div className="lp-ring" />
          <div className="lp-c lp-c-tl" /><div className="lp-c lp-c-tr" />
          <div className="lp-c lp-c-bl" /><div className="lp-c lp-c-br" />

          {/* Logo */}
          <div className="lp-logo">
            <div className="lp-logo-icon">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <polygon points="18,2 33,10 33,26 18,34 3,26 3,10" stroke="#00dcff" strokeWidth="1.5" fill="rgba(0,220,255,0.07)" />
                <polygon points="18,8 27,13 27,23 18,28 9,23 9,13" stroke="#8c3cff" strokeWidth="1" fill="none" opacity=".5" />
                <circle cx="18" cy="18" r="3.5" fill="#00dcff" opacity=".9" />
                <line x1="18" y1="8" x2="18" y2="12" stroke="#00dcff" strokeWidth="1.5" />
                <line x1="18" y1="24" x2="18" y2="28" stroke="#00dcff" strokeWidth="1.5" />
                <line x1="9" y1="18" x2="13" y2="18" stroke="#00dcff" strokeWidth="1.5" />
                <line x1="23" y1="18" x2="27" y2="18" stroke="#00dcff" strokeWidth="1.5" />
              </svg>
            </div>
            <span className="lp-logo-name">TimeLocus</span>
          </div>

          {/* ── STEP: EMAIL ── */}
          {step === 'email' && (
            <div className="lp-step-enter">
              <p className="lp-step-label">Step 1 of 2 · Identify</p>
              <h1 className="lp-heading">Welcome back</h1>
              <p className="lp-sub">Enter your email to continue</p>
              {error && <div className="lp-error">{error}</div>}
              <div className="lp-field">
                <label className="lp-label">Email Address</label>
                <div className="lp-input-wrap">
                  <input ref={inputRef} type="email" className="lp-input" placeholder="name@example.com"
                    value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKey} autoComplete="email" />
                  <span className="lp-glow" />
                </div>
              </div>
              <button className="lp-btn" onClick={checkEmail} disabled={loading}>
                <span className="lp-btn-inner">{loading ? <><span className="lp-spin"/>Checking...</> : 'Continue →'}</span>
              </button>
              <p className="lp-signup-hint">New here? <a href="/signup">Create account</a></p>
            </div>
          )}

          {/* ── STEP: PASSWORD ── */}
          {step === 'password' && (
            <div className="lp-step-enter">
              <button className="lp-back" onClick={() => { setStep('email'); setError(''); setPassword(''); }}>
                ← Back
              </button>
              <p className="lp-step-label">Step 2 of 2 · Authenticate</p>
              <h1 className="lp-heading">Enter password</h1>
              {userName && (
                <div className="lp-user-badge">
                  <div className="lp-user-avatar">{userName[0]?.toUpperCase()}</div>
                  <span className="lp-user-name">{userName}</span>
                </div>
              )}
              {error && <div className="lp-error">{error}</div>}
              <div className="lp-field">
                <label className="lp-label">Password</label>
                <div className="lp-input-wrap">
                  <input ref={inputRef} type={showPassword ? 'text' : 'password'} className="lp-input lp-input-pr"
                    placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKey} autoComplete="current-password" />
                  <button type="button" className="lp-eye" onClick={() => setShowPassword(v => !v)}>
                    {showPassword
                      ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10 10 0 0112 20c-7 0-11-8-11-8a18 18 0 015.06-5.94M9.9 4.24A9 9 0 0112 4c7 0 11 8 11 8a18 18 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                  <span className="lp-glow" />
                </div>
              </div>
              <button className="lp-btn" onClick={handleLogin} disabled={loading}>
                <span className="lp-btn-inner">{loading ? <><span className="lp-spin"/>Signing in...</> : 'Sign In →'}</span>
              </button>
              <div className="lp-links">
                <button className="lp-link" onClick={() => { setStep('forgot'); setForgotEmail(email); setError(''); }}>Forgot password?</button>
              </div>
            </div>
          )}

          {/* ── STEP: FORGOT ── */}
          {step === 'forgot' && (
            <div className="lp-step-enter">
              <button className="lp-back" onClick={() => { setStep('password'); setError(''); setInfo(''); }}>
                ← Back to sign in
              </button>
              <p className="lp-step-label">Password Reset</p>
              <h1 className="lp-heading">Reset password</h1>
              <p className="lp-sub">We'll send a reset link to your email</p>
              {error && <div className="lp-error">{error}</div>}
              {info  && <div className="lp-info">{info}</div>}
              {!info && <>
                <div className="lp-field">
                  <label className="lp-label">Email Address</label>
                  <div className="lp-input-wrap">
                    <input ref={inputRef} type="email" className="lp-input" placeholder="name@example.com"
                      value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} onKeyDown={handleKey} />
                    <span className="lp-glow" />
                  </div>
                </div>
                <button className="lp-btn" onClick={handleForgot} disabled={loading}>
                  <span className="lp-btn-inner">{loading ? <><span className="lp-spin"/>Sending...</> : 'Send Reset Link'}</span>
                </button>
              </>}
            </div>
          )}
        </div>
      </div>
    </>
  );
}