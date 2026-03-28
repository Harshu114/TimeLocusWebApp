'use client';

import { useState, useEffect, useRef } from 'react';

type FocusMode = 'pomodoro' | 'deep' | 'short';
type Phase = 'focus' | 'break' | 'long_break';

const MODES: Record<FocusMode, { label: string; focus: number; break: number; longBreak: number; emoji: string }> = {
  pomodoro: { label: 'Pomodoro',   focus: 25, break: 5,  longBreak: 15, emoji: '🍅' },
  deep:     { label: 'Deep Work',  focus: 90, break: 20, longBreak: 30, emoji: '🧠' },
  short:    { label: 'Sprint',     focus: 15, break: 3,  longBreak: 10, emoji: '⚡' },
};

const DIFFICULTY = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

export default function FocusZonePage() {
  const [mode, setMode]         = useState<FocusMode>('pomodoro');
  const [phase, setPhase]       = useState<Phase>('focus');
  const [seconds, setSeconds]   = useState(25 * 60);
  const [running, setRunning]   = useState(false);
  const [sessions, setSessions] = useState(0);
  const [totalFocus, setTotalFocus] = useState(0); // minutes

  // AI Recall
  const [topic, setTopic]         = useState('');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers]     = useState<string[]>([]);
  const [loadingQ, setLoadingQ]   = useState(false);
  const [activeQ, setActiveQ]     = useState<number | null>(null);
  const [chatMsg, setChatMsg]     = useState('');
  const [chatHistory, setChatHistory] = useState<{role:'user'|'ai'; text:string}[]>([
    { role: 'ai', text: "Hi! I'm your focus companion 🧠 Tell me what you're studying and I'll help with active recall, explanations, or just staying accountable." }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const cfg = MODES[mode];
  const phaseMin = phase === 'focus' ? cfg.focus : phase === 'break' ? cfg.break : cfg.longBreak;
  const total = phaseMin * 60;
  const progress = 1 - seconds / total;
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            handlePhaseEnd();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [running, phase, mode]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);

  const handlePhaseEnd = () => {
    if (phase === 'focus') {
      const newSessions = sessions + 1;
      setSessions(newSessions);
      setTotalFocus(f => f + cfg.focus);
      if (newSessions % 4 === 0) {
        setPhase('long_break');
        setSeconds(cfg.longBreak * 60);
      } else {
        setPhase('break');
        setSeconds(cfg.break * 60);
      }
    } else {
      setPhase('focus');
      setSeconds(cfg.focus * 60);
    }
  };

  const switchMode = (m: FocusMode) => {
    setMode(m); setRunning(false); setPhase('focus');
    setSeconds(MODES[m].focus * 60);
  };

  const reset = () => { setRunning(false); setSeconds(phaseMin * 60); };

  const skipPhase = () => { setRunning(false); handlePhaseEnd(); };

  const generateQuestions = async () => {
    if (!topic.trim()) return;
    setLoadingQ(true); setQuestions([]); setAnswers([]);
    try {
      const token = localStorage.getItem('tl_token');
      const res = await fetch('/api/ai/recall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ topic, difficulty, count: 5 }),
      });
      const data = await res.json();
      setQuestions(data.questions || []);
      setAnswers(new Array(data.questions?.length || 0).fill(''));
    } catch {
      setQuestions(['Could not load questions. Check your connection.']);
    } finally { setLoadingQ(false); }
  };

  const sendChat = async () => {
    if (!chatMsg.trim()) return;
    const msg = chatMsg.trim();
    setChatMsg('');
    setChatHistory(h => [...h, { role: 'user', text: msg }]);
    setChatLoading(true);
    try {
      const token = localStorage.getItem('tl_token');
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message: msg, context: `Focus zone, topic: ${topic || 'general productivity'}` }),
      });
      const data = await res.json();
      setChatHistory(h => [...h, { role: 'ai', text: data.reply }]);
    } catch {
      setChatHistory(h => [...h, { role: 'ai', text: 'Connection error. Please try again.' }]);
    } finally { setChatLoading(false); }
  };

  const accent = '#00dcff';
  const phaseColor = phase === 'focus' ? '#00dcff' : phase === 'break' ? '#00ff88' : '#8c3cff';
  const r = 90, circ = 2 * Math.PI * r;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700&family=Exo+2:wght@300;400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{background:#080c14;}
        .fz-root{min-height:100vh;background:#080c14;font-family:'Exo 2',sans-serif;color:#fff;padding:28px;}
        .fz-grid{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:auto auto;gap:20px;max-width:1100px;margin:0 auto;}
        .fz-card{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:24px;}
        .fz-card-title{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.14em;color:rgba(255,255,255,.3);margin-bottom:18px;}

        /* timer */
        .fz-timer-wrap{display:flex;flex-direction:column;align-items:center;gap:20px;}
        .fz-mode-tabs{display:flex;gap:8px;}
        .fz-tab{padding:6px 14px;border-radius:20px;border:1px solid rgba(255,255,255,.1);background:transparent;color:rgba(255,255,255,.4);font-family:'Exo 2',sans-serif;font-size:.8rem;cursor:pointer;transition:.2s;}
        .fz-tab.active{border-color:var(--pc);background:rgba(var(--pcr),.12);color:var(--pc);}

        .fz-phase-badge{font-size:.68rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--pc);background:rgba(var(--pcr),.1);border:1px solid rgba(var(--pcr),.25);padding:4px 14px;border-radius:20px;}

        .fz-svg-wrap{position:relative;width:220px;height:220px;}
        .fz-time-display{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;}
        .fz-time{font-family:'Orbitron',monospace;font-size:2.6rem;font-weight:700;color:#fff;letter-spacing:.04em;}
        .fz-time-sub{font-size:.7rem;color:rgba(255,255,255,.3);letter-spacing:.1em;text-transform:uppercase;}

        .fz-controls{display:flex;gap:10px;align-items:center;}
        .fz-btn-play{padding:12px 28px;border:none;border-radius:4px;font-family:'Orbitron',monospace;font-weight:600;font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;cursor:pointer;transition:.2s;}
        .fz-btn-sm{padding:10px 14px;border-radius:4px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.5);font-size:.8rem;cursor:pointer;transition:.2s;font-family:'Exo 2',sans-serif;}
        .fz-btn-sm:hover{background:rgba(255,255,255,.1);color:#fff;}

        .fz-session-dots{display:flex;gap:6px;}
        .fz-dot{width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,.1);transition:.4s;}
        .fz-dot.done{background:var(--pc);box-shadow:0 0 8px var(--pc);}

        /* recall */
        .fz-recall-top{display:flex;gap:10px;margin-bottom:16px;}
        .fz-recall-input{flex:1;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);padding:10px 14px;border-radius:4px;color:#fff;font-family:'Exo 2',sans-serif;font-size:.88rem;outline:none;transition:.22s;}
        .fz-recall-input:focus{border-color:#00dcff;background:rgba(0,220,255,.04);}
        .fz-diff-select{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);padding:10px 12px;border-radius:4px;color:#fff;font-family:'Exo 2',sans-serif;font-size:.84rem;outline:none;cursor:pointer;}
        .fz-gen-btn{padding:10px 18px;background:linear-gradient(105deg,#00b8d4,#8c3cff);border:none;border-radius:4px;color:#fff;font-weight:700;font-size:.8rem;cursor:pointer;transition:.2s;white-space:nowrap;}
        .fz-gen-btn:hover{opacity:.88;transform:translateY(-1px);}
        .fz-gen-btn:disabled{opacity:.5;cursor:not-allowed;transform:none;}

        .fz-questions{display:flex;flex-direction:column;gap:10px;}
        .fz-q-item{border:1px solid rgba(255,255,255,.08);border-radius:6px;overflow:hidden;transition:.2s;}
        .fz-q-item:hover{border-color:rgba(0,220,255,.2);}
        .fz-q-header{display:flex;align-items:flex-start;gap:10px;padding:12px 14px;cursor:pointer;}
        .fz-q-num{width:22px;height:22px;border-radius:50%;background:rgba(0,220,255,.12);border:1px solid rgba(0,220,255,.3);color:#00dcff;font-size:.72rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;}
        .fz-q-text{flex:1;font-size:.88rem;color:#fff;line-height:1.5;}
        .fz-q-chevron{color:rgba(255,255,255,.3);font-size:.8rem;transition:.2s;margin-top:2px;}
        .fz-q-answer{padding:0 14px 14px 46px;}
        .fz-answer-area{width:100%;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:4px;padding:10px 12px;color:#fff;font-family:'Exo 2',sans-serif;font-size:.84rem;resize:vertical;min-height:70px;outline:none;transition:.2s;}
        .fz-answer-area:focus{border-color:#00dcff;background:rgba(0,220,255,.04);}

        /* chat */
        .fz-chat-history{height:280px;overflow-y:auto;display:flex;flex-direction:column;gap:12px;margin-bottom:14px;padding-right:4px;}
        .fz-chat-history::-webkit-scrollbar{width:4px;}
        .fz-chat-history::-webkit-scrollbar-thumb{background:rgba(0,220,255,.2);border-radius:2px;}
        .fz-msg{max-width:85%;padding:10px 14px;border-radius:6px;font-size:.86rem;line-height:1.55;}
        .fz-msg.user{align-self:flex-end;background:rgba(0,220,255,.12);border:1px solid rgba(0,220,255,.2);color:#fff;}
        .fz-msg.ai{align-self:flex-start;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.85);}
        .fz-chat-input-row{display:flex;gap:8px;}
        .fz-chat-input{flex:1;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);padding:10px 14px;border-radius:4px;color:#fff;font-family:'Exo 2',sans-serif;font-size:.88rem;outline:none;transition:.22s;}
        .fz-chat-input:focus{border-color:#00dcff;}
        .fz-send-btn{padding:10px 18px;background:#00dcff;border:none;border-radius:4px;color:#000;font-weight:700;font-size:.84rem;cursor:pointer;transition:.2s;}
        .fz-send-btn:hover:not(:disabled){opacity:.85;}
        .fz-send-btn:disabled{opacity:.5;cursor:not-allowed;}
        .fz-ai-typing{display:flex;gap:4px;align-items:center;padding:10px 14px;background:rgba(255,255,255,.04);border-radius:6px;align-self:flex-start;}
        .fz-dot-pulse{width:7px;height:7px;border-radius:50%;background:#00dcff;animation:pulse 1.2s ease-in-out infinite;}
        .fz-dot-pulse:nth-child(2){animation-delay:.2s;}
        .fz-dot-pulse:nth-child(3){animation-delay:.4s;}
        @keyframes pulse{0%,100%{opacity:.3;transform:scale(.8);}50%{opacity:1;transform:scale(1.1);}}

        /* stats row */
        .fz-stats{display:flex;gap:14px;grid-column:1/-1;}
        .fz-stat{flex:1;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:6px;padding:16px;text-align:center;}
        .fz-stat-val{font-family:'Orbitron',monospace;font-size:1.4rem;font-weight:700;color:#00dcff;margin-bottom:4px;}
        .fz-stat-label{font-size:.7rem;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:.08em;}

        @media(max-width:768px){.fz-grid{grid-template-columns:1fr;}.fz-stats{flex-wrap:wrap;}.fz-recall-top{flex-wrap:wrap;}}
      `}</style>

      <div className="fz-root" style={{ '--pc': phaseColor, '--pcr': phaseColor === '#00dcff' ? '0,220,255' : phaseColor === '#00ff88' ? '0,255,136' : '140,60,255' } as React.CSSProperties}>

        {/* Stats row */}
        <div className="fz-stats" style={{ maxWidth: '1100px', margin: '0 auto 20px' }}>
          {[
            { val: sessions,               label: 'Sessions Today',  emoji: '🍅' },
            { val: `${totalFocus}m`,        label: 'Focus Time',      emoji: '⏱️' },
            { val: sessions >= 4 ? '✓' : `${4 - sessions % 4} left`, label: 'To Long Break', emoji: '☕' },
            { val: `${cfg.focus}m`,         label: 'Session Length',  emoji: '⚙️' },
          ].map((s, i) => (
            <div key={i} className="fz-stat">
              <div style={{ fontSize: '1.2rem', marginBottom: '6px' }}>{s.emoji}</div>
              <div className="fz-stat-val">{s.val}</div>
              <div className="fz-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="fz-grid">
          {/* ── Timer ── */}
          <div className="fz-card">
            <div className="fz-card-title">🧠 Focus Timer</div>
            <div className="fz-timer-wrap">
              {/* Mode tabs */}
              <div className="fz-mode-tabs">
                {(Object.keys(MODES) as FocusMode[]).map(m => (
                  <button key={m} className={`fz-tab ${mode === m ? 'active' : ''}`} onClick={() => switchMode(m)}>
                    {MODES[m].emoji} {MODES[m].label}
                  </button>
                ))}
              </div>

              {/* Phase badge */}
              <div className="fz-phase-badge">
                {phase === 'focus' ? '🎯 Focus' : phase === 'break' ? '☕ Break' : '🌙 Long Break'}
              </div>

              {/* Circular timer */}
              <div className="fz-svg-wrap">
                <svg width="220" height="220" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="110" cy="110" r={r} stroke="rgba(255,255,255,0.06)" strokeWidth="8" fill="none" />
                  <circle cx="110" cy="110" r={r} stroke={phaseColor} strokeWidth="8" fill="none"
                    strokeDasharray={circ} strokeDashoffset={circ * (1 - progress)}
                    strokeLinecap="round" style={{ transition: '1s linear', filter: `drop-shadow(0 0 8px ${phaseColor})` }} />
                </svg>
                <div className="fz-time-display">
                  <div className="fz-time">{mm}:{ss}</div>
                  <div className="fz-time-sub">{phase.replace('_', ' ')}</div>
                </div>
              </div>

              {/* Controls */}
              <div className="fz-controls">
                <button className="fz-btn-sm" onClick={reset}>↺</button>
                <button className="fz-btn-play" onClick={() => setRunning(v => !v)}
                  style={{ background: running ? 'rgba(255,60,80,.15)' : `linear-gradient(105deg,${phaseColor}cc,${phaseColor})`, color: running ? '#ff4060' : '#000', border: running ? '1px solid rgba(255,60,80,.4)' : 'none' }}>
                  {running ? '⏸ Pause' : '▶ Start'}
                </button>
                <button className="fz-btn-sm" onClick={skipPhase}>⏭</button>
              </div>

              {/* Session dots */}
              <div className="fz-session-dots">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={`fz-dot ${i < sessions % 4 ? 'done' : ''}`} />
                ))}
              </div>
            </div>
          </div>

          {/* ── AI Chat ── */}
          <div className="fz-card">
            <div className="fz-card-title">🤖 AI Focus Companion</div>
            <div className="fz-chat-history">
              {chatHistory.map((m, i) => (
                <div key={i} className={`fz-msg ${m.role}`}>{m.text}</div>
              ))}
              {chatLoading && (
                <div className="fz-ai-typing">
                  <div className="fz-dot-pulse" /><div className="fz-dot-pulse" /><div className="fz-dot-pulse" />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="fz-chat-input-row">
              <input className="fz-chat-input" placeholder="Ask me anything..." value={chatMsg}
                onChange={e => setChatMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} />
              <button className="fz-send-btn" onClick={sendChat} disabled={chatLoading || !chatMsg.trim()}>Send</button>
            </div>
          </div>

          {/* ── Active Recall ── */}
          <div className="fz-card" style={{ gridColumn: '1 / -1' }}>
            <div className="fz-card-title">📝 Active Recall Practice</div>
            <div className="fz-recall-top">
              <input className="fz-recall-input" placeholder="Topic to practice (e.g. 'React hooks', 'Data Structures', 'Marketing strategies')"
                value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && generateQuestions()} />
              <select className="fz-diff-select" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                {DIFFICULTY.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <button className="fz-gen-btn" onClick={generateQuestions} disabled={loadingQ || !topic.trim()}>
                {loadingQ ? '⏳ Loading...' : '⚡ Generate'}
              </button>
            </div>
            {questions.length > 0 && (
              <div className="fz-questions">
                {questions.map((q, i) => (
                  <div key={i} className="fz-q-item">
                    <div className="fz-q-header" onClick={() => setActiveQ(activeQ === i ? null : i)}>
                      <div className="fz-q-num">{i + 1}</div>
                      <div className="fz-q-text">{q}</div>
                      <div className="fz-q-chevron">{activeQ === i ? '▲' : '▼'}</div>
                    </div>
                    {activeQ === i && (
                      <div className="fz-q-answer">
                        <textarea className="fz-answer-area" placeholder="Write your answer here..."
                          value={answers[i]} onChange={e => setAnswers(ans => { const n = [...ans]; n[i] = e.target.value; return n; })} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {questions.length === 0 && !loadingQ && (
              <div style={{ textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,.2)', fontSize: '.88rem' }}>
                Enter a topic above and click Generate to start your active recall session
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}