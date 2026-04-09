'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../../lib/ThemeContext';
import ThemeToggle from '../../../components/ThemeToggle';

type UserType = 'student' | 'corporate' | 'self_employed' | 'wellbeing' | '';
type Step = 'info' | 'type' | 'credentials';

const EMOJIS = ['⏱️','📅','🎯','✅','⚡','🧠','📊','🔥','💡','🚀','⏰','📌','🏆','💎','🌟','📈'];

interface EmojiParticle { id: number; emoji: string; x: number; y: number; size: number; speed: number; drift: number; opacity: number; rotation: number; rotSpeed: number; }

function useFloatingEmojis(count = 22) {
  const [particles, setParticles] = useState<EmojiParticle[]>([]);
  useEffect(() => {
    setParticles(Array.from({ length: count }, (_, i) => ({
      id: i, emoji: EMOJIS[i % EMOJIS.length],
      x: Math.random() * 100, y: Math.random() * 120 - 20,
      size: Math.random() * 18 + 16, speed: Math.random() * 0.015 + 0.006,
      drift: (Math.random() - 0.5) * 0.02, opacity: Math.random() * 0.35 + 0.1,
      rotation: Math.random() * 360, rotSpeed: (Math.random() - 0.5) * 0.3,
    })));
  }, [count]);
  useEffect(() => {
    let frame: number;
    const tick = () => {
      setParticles(prev => prev.map(p => {
        let y = p.y - p.speed, x = p.x + p.drift;
        if (y < -12) { y = 110; x = Math.random() * 100; }
        if (x < -5) x = 105; if (x > 105) x = -5;
        return { ...p, y, x, rotation: p.rotation + p.rotSpeed };
      }));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
  return particles;
}

const USER_TYPES: { key: UserType; label: string; emoji: string; desc: string; color: string }[] = [
  { key: 'student',       label: 'Student',          emoji: '🎓', desc: 'Track study sessions, exams & assignments', color: '#00dcff' },
  { key: 'corporate',     label: 'Corporate',         emoji: '💼', desc: 'Meetings, KPIs, work logs & team goals',   color: '#8c3cff' },
  { key: 'self_employed', label: 'Self-Employed',     emoji: '🚀', desc: 'Projects, clients, income & growth plan',  color: '#ff6b35' },
  { key: 'wellbeing',     label: 'Wellbeing',         emoji: '🌱', desc: 'Habits, journaling, mindfulness & growth', color: '#00ff88' },
];

export default function SignupPage() {
  const [step, setStep] = useState<Step>('info');
  const { isDark } = useTheme();
  const [form, setForm] = useState({ firstName: '', lastName: '', age: '', gender: '', profession: '', aim: '', email: '', password: '', confirmPassword: '' });
  const [userType, setUserType] = useState<UserType>('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const particles = useFloatingEmojis(22);

  // Pre-fill email from URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (emailParam) setForm(f => ({ ...f, email: emailParam }));
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const validateInfo = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) return 'Enter your full name.';
    if (!form.age || isNaN(+form.age) || +form.age < 10 || +form.age > 100) return 'Enter a valid age.';
    if (!form.gender) return 'Select your gender.';
    if (!form.aim.trim()) return 'Tell us your aim for joining TimeLocus.';
    return '';
  };

  const validateCreds = () => {
    if (!form.email.includes('@')) return 'Enter a valid email.';
    if (form.password.length < 8) return 'Password must be at least 8 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    return '';
  };

  const goToType = () => { const e = validateInfo(); if (e) { setError(e); return; } setError(''); setStep('type'); };
  const goToCreds = () => { if (!userType) { setError('Please select your profile type.'); return; } setError(''); setStep('credentials'); };

  const handleSubmit = async () => {
    const e = validateCreds(); if (e) { setError(e); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, userType, age: +form.age }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Registration failed.'); return; }
      localStorage.setItem('tl_token', data.token);
      localStorage.setItem('tl_user', JSON.stringify(data.user));
      window.location.href = '/dashboard';
    } catch {
      setError('Connection error. Please try again.');
    } finally { setLoading(false); }
  };

  const strengthScore = () => {
    const p = form.password;
    let s = 0;
    if (p.length >= 8) s++;
    if (p.length >= 12) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const strength = strengthScore();
  const strengthLabel = ['', 'Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'][strength];
  const strengthColor = ['', '#ff4060', '#ff8040', '#ffcc00', '#00dcff', '#00ff88'][strength];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Inter:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg, #080c14); }

        .sp-root {
          min-height: 100vh; width: 100%; display: flex; align-items: center;
          justify-content: center; background: #080c14; position: relative;
          overflow: hidden; font-family: 'DM Sans', sans-serif; padding: 24px;
        }
        .sp-bg { position:absolute; inset:0; pointer-events:none;
          background: radial-gradient(ellipse 80% 60% at 20% 20%, rgba(0,220,255,.05) 0%, transparent 60%),
            radial-gradient(ellipse 60% 80% at 80% 80%, rgba(140,60,255,.06) 0%, transparent 60%); }
        .sp-grid { position:absolute; inset:0; pointer-events:none;
          background-image: linear-gradient(rgba(0,220,255,.04) 1px,transparent 1px), linear-gradient(90deg,rgba(0,220,255,.04) 1px,transparent 1px);
          background-size: 60px 60px; }
        .sp-emoji { position:absolute; pointer-events:none; user-select:none; filter:drop-shadow(0 0 6px rgba(0,220,255,.3)); }

        .sp-card {
          position:relative; z-index:10; width:100%; max-width:460px;
          background:rgba(8,16,32,.92); border:1px solid rgba(0,220,255,.15); border-radius:6px;
          padding:44px 40px 38px; backdrop-filter:blur(28px);
          box-shadow: 0 0 0 1px rgba(140,60,255,.08), 0 40px 100px rgba(0,0,0,.75), inset 0 1px 0 rgba(255,255,255,.05);
          animation: cardIn .55s cubic-bezier(.22,1,.36,1) both;
        }
        @keyframes cardIn { from{opacity:0;transform:translateY(28px) scale(.96)} to{opacity:1;transform:none} }

        .sp-ring { position:absolute; inset:-1px; border-radius:6px;
          background:conic-gradient(from var(--a,0deg),transparent,#00dcff 80deg,transparent 160deg,#8c3cff 240deg,transparent 320deg);
          -webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0); mask-composite:exclude; padding:1px;
          animation:spin-r 6s linear infinite; pointer-events:none; }
        @property --a { syntax:'<angle>'; initial-value:0deg; inherits:false; }
        @keyframes spin-r { to{--a:360deg;} }

        .sp-c { position:absolute; width:14px; height:14px; pointer-events:none; }
        .sp-c-tl { top:-1px;left:-1px;border-top:2px solid #00dcff;border-left:2px solid #00dcff; }
        .sp-c-tr { top:-1px;right:-1px;border-top:2px solid #8c3cff;border-right:2px solid #8c3cff; }
        .sp-c-bl { bottom:-1px;left:-1px;border-bottom:2px solid #8c3cff;border-left:2px solid #8c3cff; }
        .sp-c-br { bottom:-1px;right:-1px;border-bottom:2px solid #00dcff;border-right:2px solid #00dcff; }

        .sp-logo { display:flex;align-items:center;gap:10px;margin-bottom:28px; }
        .sp-logo-icon svg { filter:drop-shadow(0 0 10px #00dcff); }
        .sp-logo-name { font-family:'Sora',sans-serif;font-weight:700;font-size:1.05rem;letter-spacing:.18em;color:#00dcff;text-shadow:0 0 24px rgba(0,220,255,.55); }

        /* progress bar */
        .sp-progress { display:flex;gap:6px;margin-bottom:28px; }
        .sp-prog-dot { flex:1;height:3px;border-radius:2px;transition:.4s; }

        .sp-step-label { font-size:.66rem;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:rgba(0,220,255,.45);margin-bottom:10px; }
        .sp-heading { font-family:'Sora',sans-serif;font-weight:700;font-size:1.45rem;color:#fff;margin-bottom:6px;letter-spacing:-.01em; }
        .sp-sub { font-size:.86rem;color:rgba(255,255,255,.3);margin-bottom:22px; }

        .sp-error { background:rgba(255,40,80,.09);border:1px solid rgba(255,40,80,.28);border-radius:4px;color:#ff6080;font-size:.82rem;padding:10px 14px;margin-bottom:16px;animation:shake .35s both; }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 60%{transform:translateX(5px)} }

        .sp-form { display:flex;flex-direction:column;gap:15px; }
        .sp-row { display:flex;gap:12px; }
        .sp-row .sp-field { flex:1;min-width:0; }
        .sp-field { display:flex;flex-direction:column;gap:6px; }
        .sp-label { font-size:.67rem;font-weight:600;text-transform:uppercase;letter-spacing:.12em;color:rgba(255,255,255,.35); }
        .sp-input-wrap { position:relative; }
        .sp-input {
          width:100%;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.09);
          padding:12px 15px;border-radius:4px;color:#fff;font-family:'Exo 2',sans-serif;
          font-size:.9rem;font-weight:500;outline:none;transition:.22s;appearance:none;
        }
        .sp-input::placeholder{color:rgba(255,255,255,.18);}
        .sp-input:focus{border-color:#00dcff;background:rgba(0,220,255,.04);box-shadow:0 0 0 3px rgba(0,220,255,.08);}
        .sp-input-pr { padding-right:44px; }
        .sp-glow { position:absolute;bottom:0;left:10%;width:80%;height:1px;background:linear-gradient(90deg,transparent,#00dcff,transparent);opacity:0;transition:.3s;pointer-events:none;border-radius:9px; }
        .sp-input:focus~.sp-glow { opacity:1; }
        .sp-eye { position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:rgba(255,255,255,.28);cursor:pointer;padding:4px;display:flex;align-items:center;transition:.2s;line-height:0; }
        .sp-eye:hover{color:#00dcff;}

        /* user type cards */
        .sp-types { display:flex;flex-direction:column;gap:10px;margin-bottom:4px; }
        .sp-type-card {
          display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:5px;
          border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.02);
          cursor:pointer;transition:.25s;
        }
        .sp-type-card:hover { border-color:rgba(0,220,255,.25);background:rgba(0,220,255,.04); }
        .sp-type-card.active { border-color:var(--tc);background:rgba(var(--tcr),0.08);box-shadow:0 0 18px rgba(var(--tcr),.12); }
        .sp-type-emoji { font-size:1.6rem;line-height:1;filter:drop-shadow(0 0 8px currentColor); }
        .sp-type-info { flex:1; }
        .sp-type-label { font-weight:600;color:#fff;font-size:.95rem;margin-bottom:3px; }
        .sp-type-desc { font-size:.76rem;color:rgba(255,255,255,.3);line-height:1.4; }
        .sp-type-check { width:20px;height:20px;border-radius:50%;border:2px solid rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:.25s; }
        .sp-type-card.active .sp-type-check { border-color:var(--tc);background:var(--tc); }

        /* strength bar */
        .sp-strength-bar { height:3px;border-radius:2px;background:rgba(255,255,255,.07);overflow:hidden;margin-top:5px; }
        .sp-strength-fill { height:100%;border-radius:2px;transition:.4s; }
        .sp-strength-label { font-size:.7rem;color:rgba(255,255,255,.3);margin-top:4px; }

        /* buttons */
        .sp-btn {
          width:100%;position:relative;overflow:hidden;
          background:linear-gradient(105deg,#00b8d4,#8c3cff);
          border:none;padding:15px;border-radius:4px;color:#fff;
          font-family:'Sora',sans-serif;font-weight:600;font-size:.72rem;
          letter-spacing:.18em;text-transform:uppercase;cursor:pointer;
          transition:.2s;box-shadow:0 0 30px rgba(0,184,212,.2),0 0 60px rgba(140,60,255,.1);
          margin-top:6px;
        }
        .sp-btn::before { content:'';position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.14) 50%,transparent 65%);transform:translateX(-120%);transition:.55s ease; }
        .sp-btn:hover::before{transform:translateX(120%);}
        .sp-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 0 40px rgba(0,184,212,.35);}
        .sp-btn:disabled{opacity:.55;cursor:not-allowed;}
        .sp-btn-inner{display:flex;align-items:center;justify-content:center;gap:9px;position:relative;z-index:1;}
        .sp-btn-outline {
          width:100%;background:transparent;border:1px solid rgba(0,220,255,.25);
          padding:13px;border-radius:4px;color:rgba(0,220,255,.7);
          font-family:'Exo 2',sans-serif;font-weight:500;font-size:.88rem;
          cursor:pointer;transition:.2s;margin-top:10px;letter-spacing:.03em;
        }
        .sp-btn-outline:hover{border-color:#00dcff;color:#00dcff;background:rgba(0,220,255,.05);}

        .sp-spin{width:15px;height:15px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .65s linear infinite;}
        @keyframes spin{to{transform:rotate(360deg);}}

        .sp-back { display:inline-flex;align-items:center;gap:6px;background:none;border:none;color:rgba(255,255,255,.3);font-size:.78rem;cursor:pointer;font-family:'Exo 2',sans-serif;margin-bottom:18px;transition:.2s;padding:0; }
        .sp-back:hover{color:#00dcff;}

        .sp-signin { text-align:center;margin-top:22px;font-size:.82rem;color:rgba(255,255,255,.25); }
        .sp-signin a{color:#00dcff;text-decoration:none;margin-left:4px;font-weight:600;}
        .sp-signin a:hover{text-shadow:0 0 10px #00dcff;}

        .sp-step-enter{animation:stepIn .3s cubic-bezier(.22,1,.36,1) both;}
        @keyframes stepIn{from{opacity:0;transform:translateX(16px);}to{opacity:1;transform:none;}}
      `}</style>

      <div className="sp-root">
        <div className="sp-bg" /><div className="sp-grid" />
        <div style={{ position:'fixed', top:16, right:16, zIndex:9999, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)', borderRadius:40, padding:'5px 8px', border:'1px solid rgba(255,255,255,0.18)', display:'flex', alignItems:'center' }}><ThemeToggle size="sm" /></div>
        {particles.map(p => (
          <span key={p.id} className="sp-emoji" style={{ left:`${p.x}%`,top:`${p.y}%`,fontSize:`${p.size}px`,opacity:p.opacity,transform:`rotate(${p.rotation}deg)` }}>{p.emoji}</span>
        ))}

        <div className="sp-card">
          <div className="sp-ring" />
          <div className="sp-c sp-c-tl"/><div className="sp-c sp-c-tr"/>
          <div className="sp-c sp-c-bl"/><div className="sp-c sp-c-br"/>

          {/* Logo */}
          <div className="sp-logo">
            <svg width="34" height="34" viewBox="0 0 36 36" fill="none" style={{filter:'drop-shadow(0 0 10px #00dcff)'}}>
              <polygon points="18,2 33,10 33,26 18,34 3,26 3,10" stroke="#00dcff" strokeWidth="1.5" fill="rgba(0,220,255,0.07)" />
              <polygon points="18,8 27,13 27,23 18,28 9,23 9,13" stroke="#8c3cff" strokeWidth="1" fill="none" opacity=".5" />
              <circle cx="18" cy="18" r="3.5" fill="#00dcff" opacity=".9" />
            </svg>
            <span className="sp-logo-name">TimeLocus</span>
          </div>

          {/* Progress */}
          <div className="sp-progress">
            {(['info','type','credentials'] as Step[]).map((s, i) => (
              <div key={s} className="sp-prog-dot" style={{
                background: i <= (['info','type','credentials'] as Step[]).indexOf(step)
                  ? 'linear-gradient(90deg,#00dcff,#8c3cff)' : 'rgba(255,255,255,.08)'
              }}/>
            ))}
          </div>

          {error && <div className="sp-error">{error}</div>}

          {/* ── STEP 1: BASIC INFO ── */}
          {step === 'info' && (
            <div className="sp-step-enter">
              <p className="sp-step-label">Step 1 of 3 · About You</p>
              <h1 className="sp-heading">Create account</h1>
              <p className="sp-sub">Let's start with the basics</p>
              <div className="sp-form">
                <div className="sp-row">
                  <div className="sp-field">
                    <label className="sp-label">First Name</label>
                    <div className="sp-input-wrap">
                      <input className="sp-input" placeholder="Jane" value={form.firstName} onChange={set('firstName')} autoComplete="given-name"/>
                      <span className="sp-glow"/>
                    </div>
                  </div>
                  <div className="sp-field">
                    <label className="sp-label">Last Name</label>
                    <div className="sp-input-wrap">
                      <input className="sp-input" placeholder="Smith" value={form.lastName} onChange={set('lastName')} autoComplete="family-name"/>
                      <span className="sp-glow"/>
                    </div>
                  </div>
                </div>
                <div className="sp-row">
                  <div className="sp-field">
                    <label className="sp-label">Age</label>
                    <div className="sp-input-wrap">
                      <input className="sp-input" type="number" placeholder="22" min="10" max="100" value={form.age} onChange={set('age')}/>
                      <span className="sp-glow"/>
                    </div>
                  </div>
                  <div className="sp-field">
                    <label className="sp-label">Gender</label>
                    <div className="sp-input-wrap">
                     <select className="sp-input" value={form.gender} onChange={set('gender')}
                      style={{color: form.gender ? '#fff' : 'rgba(255,255,255,0.18)'}}>
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="non_binary">Non-binary</option>
                      <option value="prefer_not">Prefer not to say</option>
                    </select>
                      <span className="sp-glow"/>
                    </div>
                  </div>
                </div>
                <div className="sp-field">
                  <label className="sp-label">Profession / Field</label>
                  <div className="sp-input-wrap">
                    <input className="sp-input" placeholder="e.g. Software Engineer, Student, Freelancer" value={form.profession} onChange={set('profession')} autoComplete="organization-title"/>
                    <span className="sp-glow"/>
                  </div>
                </div>
                <div className="sp-field">
                  <label className="sp-label">What's your aim to join TimeLocus?</label>
                  <div className="sp-input-wrap">
                    <textarea 
                      className="sp-input" 
                      placeholder="e.g. Improve productivity, Build better habits, Track time effectively..." 
                      value={form.aim} 
                      onChange={(e) => setForm(f => ({ ...f, aim: e.target.value }))}
                      style={{ minHeight: '80px', resize: 'vertical', fontFamily: "'DM Sans', sans-serif" }}
                    />
                    <span className="sp-glow"/>
                  </div>
                </div>
                <button className="sp-btn" onClick={goToType}>
                  <span className="sp-btn-inner">Continue →</span>
                </button>
              </div>
              <p className="sp-signin">Already have an account? <a href="/login">Sign in</a></p>
            </div>
          )}

          {/* ── STEP 2: USER TYPE ── */}
          {step === 'type' && (
            <div className="sp-step-enter">
              <button className="sp-back" onClick={()=>{setStep('info');setError('');}}>← Back</button>
              <p className="sp-step-label">Step 2 of 3 · Your Profile</p>
              <h1 className="sp-heading">Choose your path</h1>
              <p className="sp-sub">Your dashboard will be tailored to your needs</p>
              <div className="sp-types">
                {USER_TYPES.map(t => {
                  const rgb = t.color === '#00dcff' ? '0,220,255' : t.color === '#8c3cff' ? '140,60,255' : t.color === '#00ff88' ? '0,255,136' : '255,107,53';
                  return (
                    <div key={t.key} className={`sp-type-card ${userType === t.key ? 'active' : ''}`}
                      style={{ '--tc': t.color, '--tcr': rgb } as React.CSSProperties}
                      onClick={() => { setUserType(t.key); setError(''); }}>
                      <span className="sp-type-emoji">{t.emoji}</span>
                      <div className="sp-type-info">
                        <div className="sp-type-label">{t.label}</div>
                        <div className="sp-type-desc">{t.desc}</div>
                      </div>
                      <div className="sp-type-check">
                        {userType === t.key && <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1,5 4,8 9,2" stroke="#000" strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button className="sp-btn" onClick={goToCreds}>
                <span className="sp-btn-inner">Continue →</span>
              </button>
            </div>
          )}

          {/* ── STEP 3: CREDENTIALS ── */}
          {step === 'credentials' && (
            <div className="sp-step-enter">
              <button className="sp-back" onClick={()=>{setStep('type');setError('');}}>← Back</button>
              <p className="sp-step-label">Step 3 of 3 · Secure Access</p>
              <h1 className="sp-heading">Set credentials</h1>
              <p className="sp-sub">Your email and a strong password</p>
              <div className="sp-form">
                <div className="sp-field">
                  <label className="sp-label">Email Address</label>
                  <div className="sp-input-wrap">
                    <input type="email" className="sp-input" placeholder="name@example.com" value={form.email} onChange={set('email')} autoComplete="email"/>
                    <span className="sp-glow"/>
                  </div>
                </div>
                <div className="sp-field">
                  <label className="sp-label">Password</label>
                  <div className="sp-input-wrap">
                    <input type={showPass?'text':'password'} className="sp-input sp-input-pr" placeholder="Min. 8 characters" value={form.password} onChange={set('password')} autoComplete="new-password"/>
                    <button type="button" className="sp-eye" onClick={()=>setShowPass(v=>!v)}>
                      {showPass
                        ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10 10 0 0112 20c-7 0-11-8-11-8a18 18 0 015.06-5.94M9.9 4.24A9 9 0 0112 4c7 0 11 8 11 8a18 18 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                    <span className="sp-glow"/>
                  </div>
                  {form.password && <>
                    <div className="sp-strength-bar">
                      <div className="sp-strength-fill" style={{ width:`${(strength/5)*100}%`, background:strengthColor }}/>
                    </div>
                    <div className="sp-strength-label" style={{color:strengthColor}}>{strengthLabel}</div>
                  </>}
                </div>
                <div className="sp-field">
                  <label className="sp-label">Confirm Password</label>
                  <div className="sp-input-wrap">
                    <input type={showConfirm?'text':'password'} className="sp-input sp-input-pr" placeholder="••••••••" value={form.confirmPassword} onChange={set('confirmPassword')} autoComplete="new-password"/>
                    <button type="button" className="sp-eye" onClick={()=>setShowConfirm(v=>!v)}>
                      {showConfirm
                        ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10 10 0 0112 20c-7 0-11-8-11-8a18 18 0 015.06-5.94M9.9 4.24A9 9 0 0112 4c7 0 11 8 11 8a18 18 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                    <span className="sp-glow"/>
                  </div>
                </div>
                <button className="sp-btn" onClick={handleSubmit} disabled={loading}>
                  <span className="sp-btn-inner">{loading ? <><span className="sp-spin"/>Creating account...</> : 'Initialize Account 🚀'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}