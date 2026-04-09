'use client';

import { useState, useEffect, useRef } from 'react';

type FocusMode = 'pomodoro' | 'deep' | 'short';
type PomodoroSubMode = 'custom' | 'random';
type Phase = 'focus' | 'break' | 'long_break';

const CUSTOM_TIMES = [25, 30, 35, 40, 45, 50, 60, 75, 90];

const MODES: Record<FocusMode, { label: string; focus: number; break: number; longBreak: number; emoji: string }> = {
  pomodoro: { label: 'Pomodoro',   focus: 25, break: 5,  longBreak: 15, emoji: '🍅' },
  deep:     { label: 'Deep Work',  focus: 90, break: 20, longBreak: 30, emoji: '🧠' },
  short:    { label: 'Sprint',     focus: 15, break: 3,  longBreak: 10, emoji: '⚡' },
};

const DIFFICULTY = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

const FOCUS_TIPS = [
  'Stay hydrated—drink water during breaks',
  'Minimize notifications and distractions',
  'Break tasks into smaller chunks',
  'Take short walks between sessions',
  'Use the Pomodoro timer to maintain rhythm',
  'Document what you complete',
];

const MOTIVATIONAL_MSGS = [
  'You\'ve got this! 💪',
  'Stay focused, stay strong 🎯',
  'Every minute counts 📈',
  'Keep the momentum going ⚡',
  'Crush your goals today 🚀',
  'One session at a time 🎪',
  'Your future self thanks you 🌟',
  'Progress over perfection ✨',
];

interface FocusSession {
  date: string;
  minutes: number;
  completed: boolean;
}

interface StreakData {
  current: number;
  longest: number;
  lastDate: string;
}

export default function FocusZonePage() {
  const [mode, setMode]         = useState<FocusMode>('pomodoro');
  const [pomodoroSubMode, setPomodoroSubMode] = useState<PomodoroSubMode>('custom');
  const [customTime, setCustomTime] = useState(25); // custom pomodoro time
  const [phase, setPhase]       = useState<Phase>('focus');
  const [seconds, setSeconds]   = useState(25 * 60);
  const [running, setRunning]   = useState(false);
  const [sessions, setSessions] = useState(0);
  const [totalFocus, setTotalFocus] = useState(0);
  const [currentTask, setCurrentTask] = useState('');
  
  // Timestamp-based timer to prevent drift
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Sessions and streak
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [streakData, setStreakData] = useState<StreakData>({ current: 0, longest: 0, lastDate: '' });

  // Study companion state
  const [companionMsg, setCompanionMsg] = useState('Ready to focus? Let\'s go! 🧠');
  const [companionEmoji, setCompanionEmoji] = useState('🧠');
  const [showCompanion, setShowCompanion] = useState(true);

  // AI Recall
  const [topic, setTopic]         = useState('');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers]     = useState<string[]>([]);
  const [loadingQ, setLoadingQ]   = useState(false);
  const [activeQ, setActiveQ]     = useState<number | null>(null);
  const [chatMsg, setChatMsg]     = useState('');
  const [chatHistory, setChatHistory] = useState<{role:'user'|'ai'; text:string}[]>([
    { role: 'ai', text: "Hi! I'm your focus companion 🧠 During breaks, chat with me for motivation or questions!" }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('fz_sessions');
    const savedStreak = localStorage.getItem('fz_streak');
    
    if (saved) setFocusSessions(JSON.parse(saved));
    if (savedStreak) setStreakData(JSON.parse(savedStreak));
  }, []);

  // Save sessions to localStorage
  useEffect(() => {
    localStorage.setItem('fz_sessions', JSON.stringify(focusSessions));
  }, [focusSessions]);

  // Save streak to localStorage
  useEffect(() => {
    localStorage.setItem('fz_streak', JSON.stringify(streakData));
  }, [streakData]);

  // Calculate today's focus minutes from localStorage
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = focusSessions.filter(s => s.date === today);
    const total = todaySessions.reduce((acc, s) => acc + s.minutes, 0);
    setTotalFocus(total);
  }, [focusSessions]);

  const cfg = MODES[mode];
  const phaseMin = phase === 'focus' 
    ? (mode === 'pomodoro' ? customTime : cfg.focus)
    : phase === 'break' ? cfg.break : cfg.longBreak;
  const total = phaseMin * 60;
  const progress = 1 - seconds / total;
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  // Timestamp-based timer to prevent drift
  useEffect(() => {
    if (running) {
      lastUpdateRef.current = Date.now();
      
      const tick = () => {
        const now = Date.now();
        const elapsed = Math.floor((now - lastUpdateRef.current) / 1000);
        
        if (elapsed >= 1) {
          lastUpdateRef.current = now - ((now - lastUpdateRef.current) % 1000);
          
          setSeconds(s => {
            const newSeconds = Math.max(0, s - elapsed);
            if (newSeconds <= 0) {
              setRunning(false);
              handlePhaseEnd();
              return 0;
            }
            return newSeconds;
          });
        }
        
        timeoutRef.current = setTimeout(tick, 100);
      };
      
      timeoutRef.current = setTimeout(tick, 100);
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [running, phase, mode]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);

  const updateStreak = () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (streakData.lastDate === today) return; // already counted today
    
    if (streakData.lastDate === yesterday) {
      // Consecutive day
      const newCurrent = streakData.current + 1;
      setStreakData({
        current: newCurrent,
        longest: Math.max(newCurrent, streakData.longest),
        lastDate: today,
      });
    } else {
      // Streak broken or first day
      setStreakData({
        current: 1,
        longest: streakData.longest,
        lastDate: today,
      });
    }
  };

  const handlePhaseEnd = () => {
    if (phase === 'focus') {
      // Save session
      const today = new Date().toISOString().split('T')[0];
      const pomodoroTime = mode === 'pomodoro' ? customTime : cfg.focus;
      
      setFocusSessions(prev => [...prev, { date: today, minutes: pomodoroTime, completed: true }]);
      setSessions(s => s + 1);
      updateStreak();

      // Show motivational message
      const msg = MOTIVATIONAL_MSGS[Math.floor(Math.random() * MOTIVATIONAL_MSGS.length)];
      setCompanionMsg(msg);
      setCompanionEmoji('🎉');

      // Next phase: break or long break
      const newSessions = sessions + 1;
      if (newSessions % 4 === 0) {
        setPhase('long_break');
        setSeconds(cfg.longBreak * 60);
      } else {
        setPhase('break');
        setSeconds(cfg.break * 60);
      }
    } else {
      // Break ended, back to focus
      setPhase('focus');
      const pomodoroTime = mode === 'pomodoro' ? customTime : cfg.focus;
      setSeconds(pomodoroTime * 60);
      setCompanionMsg('Ready to focus again? You\'ve got this! 💪');
      setCompanionEmoji('🧠');
    }
  };

  const switchMode = (m: FocusMode) => {
    setMode(m);
    setRunning(false);
    setPhase('focus');
    const time = m === 'pomodoro' ? customTime : MODES[m].focus;
    setSeconds(time * 60);
  };

  const reset = () => {
    setRunning(false);
    const time = mode === 'pomodoro' ? customTime : phaseMin;
    setSeconds(time * 60);
  };

  const skipPhase = () => {
    setRunning(false);
    handlePhaseEnd();
  };

  // Timer companion animations
  useEffect(() => {
    if (running && phase === 'focus') {
      const interval = setInterval(() => {
        const msgs = [
          'Keep going! 💪',
          'You\'re crushing it! 🔥',
          'Stay focused 🎯',
          'Great work! ⭐',
          'Almost there! 🏁',
        ];
        setCompanionMsg(msgs[Math.floor(Math.random() * msgs.length)]);
      }, 30000); // Every 30 seconds during focus
      
      return () => clearInterval(interval);
    }
  }, [running, phase]);

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
    // Only allow chat during breaks
    if (phase === 'focus') {
      setCompanionMsg('Focus time! Chat during breaks 🧠');
      return;
    }

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
        body: JSON.stringify({ message: msg, context: `Break time. Current task: ${currentTask || 'general'}` }),
      });
      const data = await res.json();
      setChatHistory(h => [...h, { role: 'ai', text: data.reply }]);
    } catch {
      setChatHistory(h => [...h, { role: 'ai', text: 'Connection error. Please try again.' }]);
    } finally { setChatLoading(false); }
  };

  // Get 7-day activity
  const getLast7DaysActivity = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
      const dayFocus = focusSessions.filter(s => s.date === date).reduce((acc, s) => acc + s.minutes, 0);
      days.push({ date: date.split('-')[2], minutes: dayFocus });
    }
    return days;
  };

  const activityDays = getLast7DaysActivity();
  const totalLastWeek = activityDays.reduce((a, d) => a + d.minutes, 0);

  const accent = '#00dcff';
  const phaseColor = phase === 'focus' ? '#00dcff' : phase === 'break' ? '#00ff88' : '#8c3cff';
  const r = 90, circ = 2 * Math.PI * r;

  const isChatDisabled = phase === 'focus';
  const chatPlaceholder = isChatDisabled ? 'Chat available during breaks' : 'Ask me anything...';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{background:#080c14;}
        
        .fz-root{min-height:100vh;background:#080c14;font-family:'Plus Jakarta Sans',sans-serif;color:#fff;padding:28px;}
        .fz-main{display:grid;grid-template-columns:1fr 1fr;gap:20px;max-width:1300px;margin:0 auto;}
        .fz-card{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:24px;}
        .fz-card-title{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.14em;color:rgba(255,255,255,.3);margin-bottom:18px;}

        /* Timer */
        .fz-timer-wrap{display:flex;flex-direction:column;align-items:center;gap:20px;}
        .fz-mode-tabs{display:flex;gap:8px;flex-wrap:wrap;}
        .fz-tab{padding:6px 14px;border-radius:20px;border:1px solid rgba(255,255,255,.1);background:transparent;color:rgba(255,255,255,.4);font-family:'Plus Jakarta Sans',sans-serif;font-size:.8rem;cursor:pointer;transition:.2s;}
        .fz-tab.active{border-color:var(--pc);background:rgba(var(--pcr),.12);color:var(--pc);}
        
        .fz-pomodoro-opts{display:flex;gap:10px;align-items:center;padding:12px;background:rgba(0,220,255,.05);border:1px solid rgba(0,220,255,.15);border-radius:6px;}
        .fz-sub-select{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);padding:8px 12px;border-radius:4px;color:#fff;font-family:'Plus Jakarta Sans',sans-serif;font-size:.84rem;cursor:pointer;outline:none;}
        .fz-sub-select:focus{border-color:#00dcff;}

        .fz-phase-badge{font-size:.68rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--pc);background:rgba(var(--pcr),.1);border:1px solid rgba(var(--pcr),.25);padding:4px 14px;border-radius:20px;}

        .fz-task-input{width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);padding:12px 14px;border-radius:4px;color:#fff;font-family:'Plus Jakarta Sans',sans-serif;font-size:.88rem;outline:none;transition:.22s;margin-bottom:12px;}
        .fz-task-input:focus{border-color:#00dcff;background:rgba(0,220,255,.04);}

        .fz-svg-wrap{position:relative;width:220px;height:220px;}
        .fz-time-display{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;}
        .fz-time{font-family:'DM+Sans',sans-serif;font-size:2.6rem;font-weight:700;color:#fff;letter-spacing:.04em;}
        .fz-time-sub{font-size:.7rem;color:rgba(255,255,255,.3);letter-spacing:.1em;text-transform:uppercase;}

        .fz-controls{display:flex;gap:10px;align-items:center;}
        .fz-btn-play{padding:12px 28px;border:none;border-radius:4px;font-family:'DM+Sans',sans-serif;font-weight:600;font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;cursor:pointer;transition:.2s;}
        .fz-btn-sm{padding:10px 14px;border-radius:4px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.5);font-size:.8rem;cursor:pointer;transition:.2s;font-family:'Plus Jakarta Sans',sans-serif;}
        .fz-btn-sm:hover{background:rgba(255,255,255,.1);color:#fff;}

        .fz-session-dots{display:flex;gap:6px;}
        .fz-dot{width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,.1);transition:.4s;}
        .fz-dot.done{background:var(--pc);box-shadow:0 0 8px var(--pc);}

        /* Companion */
        .fz-companion{display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center;}
        .fz-char{font-size:6rem;animation:studying 2s ease-in-out infinite;}
        @keyframes studying{0%,100%{transform:scale(1)}50%{transform:scale(1.05) translateY(-5px)}}
        @keyframes breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.02)}}
        .fz-companion-msg{background:rgba(0,220,255,.12);border:1px solid rgba(0,220,255,.25);padding:12px 16px;border-radius:6px;font-size:.85rem;color:#fff;line-height:1.5;max-width:200px;}

        /* Activity & Stats */
        .fz-stats-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px;}
        .fz-stat{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:6px;padding:12px;text-align:center;}
        .fz-stat-val{font-family:'DM+Sans',sans-serif;font-size:1.3rem;font-weight:700;color:#00dcff;}
        .fz-stat-label{font-size:.68rem;color:rgba(255,255,255,.3);text-transform:uppercase;margin-top:4px;}

        .fz-activity-chart{display:flex;align-items:flex-end;gap:6px;height:80px;margin-top:12px;}
        .fz-bar{flex:1;background:rgba(0,220,255,.3);border-radius:4px;border:1px solid rgba(0,220,255,.2);min-height:8px;transition:.3s;position:relative;}
        .fz-bar:hover{background:rgba(0,220,255,.5);box-shadow:0 0 8px rgba(0,220,255,.3);}
        .fz-bar-label{position:absolute;bottom:-20px;left:50%;transform:translateX(-50%);font-size:.65rem;color:rgba(255,255,255,.3);}

        /* Tips */
        .fz-tips{display:flex;flex-direction:column;gap:8px;margin-top:12px;}
        .fz-tip{padding:10px 12px;background:rgba(255,255,255,.03);border-left:3px solid #00dcff;border-radius:2px;font-size:.8rem;color:rgba(255,255,255,.7);line-height:1.4;}

        /* Chat */
        .fz-chat-history{height:280px;overflow-y:auto;display:flex;flex-direction:column;gap:12px;margin-bottom:14px;padding-right:4px;border-radius:6px;padding:8px;}
        .fz-chat-history::-webkit-scrollbar{width:4px;}
        .fz-chat-history::-webkit-scrollbar-thumb{background:rgba(0,220,255,.2);border-radius:2px;}
        .fz-chat-disabled{color:rgba(255,255,255,.3);text-align:center;padding:40px 20px;font-size:.84rem;}
        .fz-msg{max-width:85%;padding:10px 14px;border-radius:6px;font-size:.86rem;line-height:1.55;}
        .fz-msg.user{align-self:flex-end;background:rgba(0,220,255,.12);border:1px solid rgba(0,220,255,.2);color:#fff;}
        .fz-msg.ai{align-self:flex-start;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.85);}
        .fz-chat-input-row{display:flex;gap:8px;}
        .fz-chat-input{flex:1;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);padding:10px 14px;border-radius:4px;color:#fff;font-family:'Plus Jakarta Sans',sans-serif;font-size:.88rem;outline:none;transition:.22s;}
        .fz-chat-input:focus{border-color:#00dcff;}
        .fz-chat-input:disabled{opacity:.5;}
        .fz-send-btn{padding:10px 18px;background:#00dcff;border:none;border-radius:4px;color:#000;font-weight:700;font-size:.84rem;cursor:pointer;transition:.2s;}
        .fz-send-btn:hover:not(:disabled){opacity:.85;}
        .fz-send-btn:disabled{opacity:.3;cursor:not-allowed;}

        /* Recall */
        .fz-recall-top{display:flex;gap:10px;margin-bottom:16px;}
        .fz-recall-input{flex:1;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);padding:10px 14px;border-radius:4px;color:#fff;font-family:'Plus Jakarta Sans',sans-serif;font-size:.88rem;outline:none;transition:.22s;}
        .fz-recall-input:focus{border-color:#00dcff;background:rgba(0,220,255,.04);}
        .fz-diff-select{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);padding:10px 12px;border-radius:4px;color:#fff;font-family:'Plus Jakarta Sans',sans-serif;font-size:.84rem;outline:none;cursor:pointer;}
        .fz-gen-btn{padding:10px 18px;background:linear-gradient(105deg,#00b8d4,#8c3cff);border:none;border-radius:4px;color:#fff;font-weight:700;font-size:.8rem;cursor:pointer;transition:.2s;white-space:nowrap;}
        .fz-gen-btn:hover{opacity:.88;transform:translateY(-1px);}
        .fz-gen-btn:disabled{opacity:.5;cursor:not-allowed;transform:none;}

        .fz-questions{display:flex;flex-direction:column;gap:10px;}
        .fz-q-item{border:1px solid rgba(255,255,255,.08);border-radius:6px;overflow:hidden;transition:.2s;}
        .fz-q-header{display:flex;align-items:flex-start;gap:10px;padding:12px 14px;cursor:pointer;}
        .fz-q-num{width:22px;height:22px;border-radius:50%;background:rgba(0,220,255,.12);border:1px solid rgba(0,220,255,.3);color:#00dcff;font-size:.72rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;}
        .fz-q-text{flex:1;font-size:.88rem;color:#fff;line-height:1.5;}
        .fz-q-chevron{color:rgba(255,255,255,.3);font-size:.8rem;transition:.2s;margin-top:2px;}
        .fz-q-answer{padding:0 14px 14px 46px;}
        .fz-answer-area{width:100%;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:4px;padding:10px 12px;color:#fff;font-family:'Plus Jakarta Sans',sans-serif;font-size:.84rem;resize:vertical;min-height:70px;outline:none;transition:.2s;}
        .fz-answer-area:focus{border-color:#00dcff;background:rgba(0,220,255,.04);}

        @media(max-width:900px){.fz-main{grid-template-columns:1fr;}}
      `}</style>

      <div className="fz-root" style={{ '--pc': phaseColor, '--pcr': phaseColor === '#00dcff' ? '0,220,255' : phaseColor === '#00ff88' ? '0,255,136' : '140,60,255' } as React.CSSProperties}>

        {/* Main grid: Left (timer) and Right (companion) */}
        <div className="fz-main">

          {/* ─── LEFT: TIMER ─── */}
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

              {/* Pomodoro sub-modes */}
              {mode === 'pomodoro' && (
                <div className="fz-pomodoro-opts">
                  <button className={`fz-tab ${pomodoroSubMode === 'custom' ? 'active' : ''}`} 
                    onClick={() => setPomodoroSubMode('custom')} style={{padding:'4px 12px',fontSize:'.75rem'}}>
                    Custom
                  </button>
                  <button className={`fz-tab ${pomodoroSubMode === 'random' ? 'active' : ''}`} 
                    onClick={() => setPomodoroSubMode('random')} style={{padding:'4px 12px',fontSize:'.75rem'}}>
                    Random
                  </button>
                  {pomodoroSubMode === 'custom' && (
                    <select className="fz-sub-select" value={customTime} onChange={(e) => {
                      setCustomTime(Number(e.target.value));
                      const time = Number(e.target.value);
                      setSeconds(phase === 'focus' ? time * 60 : (phase === 'break' ? cfg.break * 60 : cfg.longBreak * 60));
                    }}>
                      {CUSTOM_TIMES.map(t => <option key={t} value={t}>{t} min</option>)}
                    </select>
                  )}
                  {pomodoroSubMode === 'random' && (
                    <span style={{fontSize:'.8rem',color:'rgba(255,255,255,.6)'}}>
                      {Math.floor(Math.random() * (60 - 25 + 1)) + 25} min
                    </span>
                  )}
                </div>
              )}

              {/* Task input */}
              <input className="fz-task-input" placeholder="What are you working on?" value={currentTask} onChange={(e) => setCurrentTask(e.target.value)} />

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
                    strokeLinecap="round" style={{ transition: '0.1s linear', filter: `drop-shadow(0 0 8px ${phaseColor})` }} />
                </svg>
                <div className="fz-time-display">
                  <div className="fz-time">{mm}:{ss}</div>
                  <div className="fz-time-sub">{phase.replace('_', ' ')}</div>
                </div>
              </div>

              {/* Controls */}
              <div className="fz-controls">
                <button className="fz-btn-sm" onClick={reset}>↺ Reset</button>
                <button className="fz-btn-play" onClick={() => setRunning(v => !v)}
                  style={{ background: running ? 'rgba(255,60,80,.15)' : `linear-gradient(105deg,${phaseColor}cc,${phaseColor})`, color: running ? '#ff4060' : '#000', border: running ? '1px solid rgba(255,60,80,.4)' : 'none' }}>
                  {running ? '⏸ Pause' : '▶ Start'}
                </button>
                <button className="fz-btn-sm" onClick={skipPhase}>⏭ Skip</button>
              </div>

              {/* Session dots */}
              <div className="fz-session-dots">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={`fz-dot ${i < sessions % 4 ? 'done' : ''}`} />
                ))}
              </div>
            </div>
          </div>

          {/* ─── RIGHT: STUDY COMPANION ─── */}
          <div className="fz-card">
            <div className="fz-card-title">📚 Study Companion</div>
            <div className="fz-companion">
              <div className="fz-char">{companionEmoji}</div>
              <div className="fz-companion-msg">{companionMsg}</div>
              
              {/* Stats & Activity */}
              <div className="fz-stats-grid">
                <div className="fz-stat">
                  <div className="fz-stat-label">Today</div>
                  <div className="fz-stat-val">{totalFocus}m</div>
                </div>
                <div className="fz-stat">
                  <div className="fz-stat-label">Streak</div>
                  <div className="fz-stat-val">{streakData.current}</div>
                </div>
                <div className="fz-stat">
                  <div className="fz-stat-label">Best</div>
                  <div className="fz-stat-val">{streakData.longest}</div>
                </div>
                <div className="fz-stat">
                  <div className="fz-stat-label">This Week</div>
                  <div className="fz-stat-val">{totalLastWeek}m</div>
                </div>
              </div>

              {/* 7-day activity */}
              <div style={{width:'100%'}}>
                <div style={{fontSize:'.7rem',color:'rgba(255,255,255,.3)',textTransform:'uppercase',marginBottom:'8px',letterSpacing:'.08em'}}>7-Day Activity</div>
                <div className="fz-activity-chart">
                  {activityDays.map((day, i) => (
                    <div key={i} className="fz-bar" style={{height: day.minutes > 0 ? `${Math.max(20, (day.minutes / 120) * 100)}%` : '8px'}}>
                      <div className="fz-bar-label">{day.date}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Focus Tips */}
              <div className="fz-tips">
                <div style={{fontSize:'.7rem',color:'rgba(255,255,255,.3)',textTransform:'uppercase',letterSpacing:'.08em'}}>💡 Today's Tip</div>
                <div className="fz-tip">
                  {FOCUS_TIPS[Math.floor(Math.random() * FOCUS_TIPS.length)]}
                </div>
              </div>

              {/* Chat */}
              <div style={{width:'100%',marginTop:'16px'}}>
                <div style={{fontSize:'.7rem',color:'rgba(255,255,255,.3)',textTransform:'uppercase',marginBottom:'8px',letterSpacing:'.08em'}}>
                  🤖 Chat {phase === 'focus' ? '(breaks only)' : ''}
                </div>
                {isChatDisabled ? (
                  <div className="fz-chat-history">
                    <div className="fz-chat-disabled">💪 Focus time! Chat during breaks</div>
                  </div>
                ) : (
                  <div className="fz-chat-history">
                    {chatHistory.map((m, i) => (
                      <div key={i} className={`fz-msg ${m.role}`}>{m.text}</div>
                    ))}
                    {chatLoading && (
                      <div style={{display:'flex',gap:'4px',alignSelf:'flex-start',padding:'10px 14px'}}>
                        <div style={{width:'7px',height:'7px',borderRadius:'50%',background:'#00dcff',animation:'pulse 1.2s ease-in-out infinite'}} />
                        <div style={{width:'7px',height:'7px',borderRadius:'50%',background:'#00dcff',animation:'pulse 1.2s ease-in-out infinite 0.2s'}} />
                        <div style={{width:'7px',height:'7px',borderRadius:'50%',background:'#00dcff',animation:'pulse 1.2s ease-in-out infinite 0.4s'}} />
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                )}
                {!isChatDisabled && (
                  <div className="fz-chat-input-row">
                    <input className="fz-chat-input" placeholder={chatPlaceholder} value={chatMsg}
                      onChange={e => setChatMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} disabled={isChatDisabled} />
                    <button className="fz-send-btn" onClick={sendChat} disabled={isChatDisabled || chatLoading || !chatMsg.trim()}>Send</button>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* ─── BOTTOM: ACTIVE RECALL ─── */}
        <div className="fz-card" style={{ marginTop: '20px' }}>
          <div className="fz-card-title">📝 Active Recall Practice</div>
          <div className="fz-recall-top">
            <input className="fz-recall-input" placeholder="Topic to practice (e.g. 'React hooks', 'Data Structures')"
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
    </>
  );
}