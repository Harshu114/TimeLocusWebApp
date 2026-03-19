'use client';

import { useState, useEffect, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
type UserType = 'student' | 'corporate' | 'self_employed';
interface User { firstName: string; lastName: string; email: string; userType: UserType; }
interface TimeEntry { id: string; task: string; startTime: string; endTime: string; duration: number; category: string; }
interface Task { id: string; title: string; done: boolean; priority: 'high' | 'medium' | 'low'; dueDate?: string; }

// ─── Mock data (replace with real API calls) ──────────────────────────────────
const MOCK_ENTRIES: TimeEntry[] = [
  { id:'1', task:'Deep Work - Coding', startTime:'09:00', endTime:'11:30', duration:150, category:'work' },
  { id:'2', task:'Team Standup',       startTime:'11:30', endTime:'12:00', duration:30,  category:'meeting' },
  { id:'3', task:'Lunch Break',        startTime:'12:00', endTime:'13:00', duration:60,  category:'break' },
  { id:'4', task:'Study - Algorithms', startTime:'14:00', endTime:'16:00', duration:120, category:'study' },
];

const CATEGORY_COLOR: Record<string,string> = {
  work:'#00dcff', meeting:'#8c3cff', break:'#ff6b35', study:'#00ff88', other:'#ffcc00'
};

const WEEKDAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const WEEK_DATA = [6.5, 7.2, 5.8, 8.1, 6.9, 4.2, 3.5]; // hours

// ─── Sidebar nav items by user type ──────────────────────────────────────────
const NAV_ITEMS = {
  student:       [['Dashboard','🏠'],['Time Tracker','⏱'],['Planner','📅'],['Focus Zone','🧠'],['Exams','📝'],['Progress','📊'],['AI Assistant','🤖']],
  corporate:     [['Dashboard','🏠'],['Time Tracker','⏱'],['Meetings','💼'],['Focus Zone','🧠'],['Reports','📊'],['Team','👥'],['AI Assistant','🤖']],
  self_employed: [['Dashboard','🏠'],['Time Tracker','⏱'],['Projects','🚀'],['Focus Zone','🧠'],['Revenue','💰'],['Goals','🎯'],['AI Assistant','🤖']],
};

const USER_TYPE_CONFIG = {
  student:       { label:'Student Mode',     accent:'#00dcff', badge:'🎓', greeting:'Study hard, play smart' },
  corporate:     { label:'Corporate Mode',   accent:'#8c3cff', badge:'💼', greeting:'Lead with precision'    },
  self_employed: { label:'Entrepreneur Mode',accent:'#ff6b35', badge:'🚀', greeting:'Build your empire'     },
};

// ─── Bar chart component ──────────────────────────────────────────────────────
function WeeklyBarChart({ accent }: { accent: string }) {
  const max = Math.max(...WEEK_DATA);
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:'6px', height:'80px', width:'100%' }}>
      {WEEK_DATA.map((h, i) => (
        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
          <div style={{
            width:'100%', height:`${(h/max)*70}px`, borderRadius:'3px 3px 0 0',
            background: i === new Date().getDay() - 1
              ? `linear-gradient(180deg,${accent},${accent}88)`
              : 'rgba(255,255,255,0.08)',
            transition:'.4s', minHeight:'4px',
          }}/>
          <span style={{ fontSize:'.6rem', color:'rgba(255,255,255,.3)' }}>{WEEKDAYS[i]}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Timeline component ───────────────────────────────────────────────────────
function TimelineBar({ entries }: { entries: TimeEntry[] }) {
  const total = 16 * 60; // 6am to 10pm = 16hrs
  const startHour = 6;
  const toPercent = (time: string) => {
    const [h,m] = time.split(':').map(Number);
    return ((h - startHour) * 60 + m) / total * 100;
  };
  return (
    <div style={{ position:'relative', height:'32px', background:'rgba(255,255,255,.04)', borderRadius:'4px', overflow:'hidden' }}>
      {entries.map(e => (
        <div key={e.id} style={{
          position:'absolute', height:'100%',
          left:`${toPercent(e.startTime)}%`,
          width:`${(e.duration / total) * 100}%`,
          background: CATEGORY_COLOR[e.category] || '#555',
          opacity:.8, borderRadius:'2px',
        }} title={`${e.task} (${e.duration}m)`}/>
      ))}
      {/* Hour markers */}
      {[6,9,12,15,18,21].map(h => (
        <div key={h} style={{ position:'absolute', left:`${((h-startHour)/16)*100}%`, top:0, bottom:0, width:'1px', background:'rgba(255,255,255,.1)' }}>
          <span style={{ position:'absolute', bottom:'-18px', fontSize:'.58rem', color:'rgba(255,255,255,.25)', transform:'translateX(-50%)' }}>{h}:00</span>
        </div>
      ))}
    </div>
  );
}

// ─── Todo widget ──────────────────────────────────────────────────────────────
function TodoWidget({ accent }: { accent: string }) {
  const [tasks, setTasks] = useState<Task[]>([
    { id:'1', title:'Review pull requests',      done:false, priority:'high'   },
    { id:'2', title:'Prepare presentation deck', done:false, priority:'medium' },
    { id:'3', title:'Team sync at 3pm',          done:true,  priority:'low'    },
    { id:'4', title:'Complete module 4',         done:false, priority:'high'   },
  ]);
  const [newTask, setNewTask] = useState('');
  const toggleDone = (id: string) => setTasks(ts => ts.map(t => t.id===id ? {...t, done:!t.done} : t));
  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks(ts => [...ts, { id:Date.now().toString(), title:newTask.trim(), done:false, priority:'medium' }]);
    setNewTask('');
  };
  const PRIORITY_COLOR = { high:'#ff4060', medium:'#ffcc00', low:'#00ff88' };
  return (
    <div>
      <div style={{ display:'flex', gap:'8px', marginBottom:'12px' }}>
        <input value={newTask} onChange={e=>setNewTask(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addTask()}
          placeholder="Add task..." style={{ flex:1, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.09)', borderRadius:'4px', padding:'8px 12px', color:'#fff', fontSize:'.84rem', outline:'none', fontFamily:'inherit' }}/>
        <button onClick={addTask} style={{ background:accent, border:'none', borderRadius:'4px', padding:'8px 14px', color:'#000', fontWeight:700, cursor:'pointer', fontSize:'.84rem' }}>+</button>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
        {tasks.map(t => (
          <div key={t.id} onClick={()=>toggleDone(t.id)} style={{
            display:'flex', alignItems:'center', gap:'10px', padding:'8px 10px',
            background:'rgba(255,255,255,.03)', borderRadius:'4px', cursor:'pointer',
            border:'1px solid rgba(255,255,255,.06)', transition:'.2s',
            opacity: t.done ? .5 : 1,
          }}>
            <div style={{
              width:'16px', height:'16px', borderRadius:'3px', flexShrink:0,
              border:`1.5px solid ${t.done ? accent : 'rgba(255,255,255,.2)'}`,
              background: t.done ? accent : 'transparent',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              {t.done && <svg width="9" height="9" viewBox="0 0 10 10"><polyline points="1,5 4,8 9,2" stroke="#000" strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>}
            </div>
            <span style={{ flex:1, fontSize:'.84rem', color:'#fff', textDecoration: t.done ? 'line-through' : 'none' }}>{t.title}</span>
            <div style={{ width:'6px', height:'6px', borderRadius:'50%', background: PRIORITY_COLOR[t.priority], flexShrink:0 }}/>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Focus Timer ──────────────────────────────────────────────────────────────
function FocusTimer({ accent }: { accent: string }) {
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState<'focus'|'break'>('focus');
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds(s => s > 0 ? s-1 : 0), 1000);
    } else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [running]);
  const mm = String(Math.floor(seconds/60)).padStart(2,'0');
  const ss = String(seconds%60).padStart(2,'0');
  const reset = () => { setRunning(false); setSeconds(mode === 'focus' ? 25*60 : 5*60); };
  const switchMode = (m: 'focus'|'break') => { setMode(m); setRunning(false); setSeconds(m==='focus' ? 25*60 : 5*60); };
  const progress = 1 - seconds / (mode === 'focus' ? 25*60 : 5*60);
  const r = 36, c = 2*Math.PI*r;
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'12px' }}>
      <div style={{ display:'flex', gap:'6px', marginBottom:'4px' }}>
        {(['focus','break'] as const).map(m => (
          <button key={m} onClick={()=>switchMode(m)} style={{
            padding:'4px 14px', borderRadius:'20px', border:'none', cursor:'pointer', fontSize:'.76rem', fontWeight:600,
            background: mode===m ? accent : 'rgba(255,255,255,.08)',
            color: mode===m ? '#000' : 'rgba(255,255,255,.5)',
          }}>{m==='focus'?'Focus':'Break'}</button>
        ))}
      </div>
      <div style={{ position:'relative', width:'100px', height:'100px' }}>
        <svg width="100" height="100" style={{ transform:'rotate(-90deg)' }}>
          <circle cx="50" cy="50" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="5" fill="none"/>
          <circle cx="50" cy="50" r={r} stroke={accent} strokeWidth="5" fill="none"
            strokeDasharray={c} strokeDashoffset={c*(1-progress)} strokeLinecap="round" style={{transition:'.5s'}}/>
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column' }}>
          <span style={{ fontFamily:'monospace', fontSize:'1.3rem', color:'#fff', fontWeight:700 }}>{mm}:{ss}</span>
          <span style={{ fontSize:'.6rem', color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:'.08em' }}>{mode}</span>
        </div>
      </div>
      <div style={{ display:'flex', gap:'8px' }}>
        <button onClick={()=>setRunning(v=>!v)} style={{
          padding:'7px 18px', borderRadius:'4px', border:'none', cursor:'pointer', fontWeight:600, fontSize:'.82rem',
          background: running ? 'rgba(255,255,255,.1)' : accent, color: running ? '#fff' : '#000',
        }}>{running ? '⏸ Pause' : '▶ Start'}</button>
        <button onClick={reset} style={{ padding:'7px 12px', borderRadius:'4px', border:'1px solid rgba(255,255,255,.12)', background:'transparent', color:'rgba(255,255,255,.5)', cursor:'pointer', fontSize:'.82rem' }}>↺</button>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [trackingTask, setTrackingTask] = useState('');
  const [tracking, setTracking] = useState(false);
  const [trackSeconds, setTrackSeconds] = useState(0);
  const trackRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const stored = localStorage.getItem('tl_user');
    if (stored) setUser(JSON.parse(stored));
    else window.location.href = '/login';
  }, []);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (tracking) {
      trackRef.current = setInterval(() => setTrackSeconds(s => s+1), 1000);
    } else clearInterval(trackRef.current);
    return () => clearInterval(trackRef.current);
  }, [tracking]);

  if (!user) return (
    <div style={{ minHeight:'100vh', background:'#080c14', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:'36px', height:'36px', border:'3px solid rgba(0,220,255,.2)', borderTopColor:'#00dcff', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );

  const cfg = USER_TYPE_CONFIG[user.userType] || USER_TYPE_CONFIG.student;
  const navItems = NAV_ITEMS[user.userType] || NAV_ITEMS.student;
  const accent = cfg.accent;
  const totalToday = MOCK_ENTRIES.reduce((s,e)=>s+e.duration, 0);
  const fmtDur = (m: number) => `${Math.floor(m/60)}h ${m%60}m`;
  const fmtTrack = (s: number) => `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700&family=Exo+2:wght@300;400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{background:#080c14;overflow-x:hidden;}
        ::-webkit-scrollbar{width:5px;} ::-webkit-scrollbar-track{background:rgba(255,255,255,.04);} ::-webkit-scrollbar-thumb{background:rgba(0,220,255,.25);border-radius:3px;}

        .db-root{display:flex;min-height:100vh;background:#080c14;font-family:'Exo 2',sans-serif;color:#fff;}

        /* sidebar */
        .db-sidebar{
          width:240px;flex-shrink:0;background:rgba(6,12,24,.95);
          border-right:1px solid rgba(0,220,255,.1);display:flex;flex-direction:column;
          position:fixed;top:0;left:0;bottom:0;z-index:100;
          transition:.3s;
        }
        .db-sidebar-logo{padding:24px 20px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;gap:10px;}
        .db-logo-name{font-family:'Orbitron',monospace;font-weight:700;font-size:.9rem;letter-spacing:.15em;color:#00dcff;text-shadow:0 0 20px rgba(0,220,255,.5);}
        .db-nav{flex:1;padding:16px 12px;display:flex;flex-direction:column;gap:4px;overflow-y:auto;}
        .db-nav-item{
          display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:5px;
          cursor:pointer;font-size:.88rem;font-weight:500;color:rgba(255,255,255,.45);
          transition:.2s;border:1px solid transparent;
        }
        .db-nav-item:hover{color:#fff;background:rgba(255,255,255,.05);}
        .db-nav-item.active{color:var(--accent);background:rgba(var(--accent-r),.1);border-color:rgba(var(--accent-r),.2);font-weight:600;}
        .db-nav-emoji{font-size:1rem;line-height:1;}
        .db-sidebar-footer{padding:16px 20px;border-top:1px solid rgba(255,255,255,.06);}
        .db-user-card{display:flex;align-items:center;gap:10px;}
        .db-avatar{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#00dcff,#8c3cff);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.85rem;color:#fff;flex-shrink:0;}
        .db-user-info .name{font-size:.85rem;font-weight:600;color:#fff;}
        .db-user-info .type{font-size:.7rem;color:rgba(255,255,255,.3);}

        /* main */
        .db-main{margin-left:240px;flex:1;display:flex;flex-direction:column;min-height:100vh;}
        .db-header{
          padding:16px 28px;background:rgba(6,12,24,.9);border-bottom:1px solid rgba(255,255,255,.06);
          display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50;
          backdrop-filter:blur(12px);
        }
        .db-header-title{font-family:'Orbitron',monospace;font-size:1rem;font-weight:700;color:#fff;}
        .db-header-right{display:flex;align-items:center;gap:16px;}
        .db-clock{font-family:monospace;font-size:.95rem;color:rgba(255,255,255,.4);}
        .db-badge{display:flex;align-items:center;gap:6px;padding:5px 12px;border-radius:20px;border:1px solid rgba(var(--accent-r),.3);background:rgba(var(--accent-r),.08);font-size:.75rem;color:var(--accent);font-weight:600;}

        .db-content{padding:24px 28px;flex:1;display:flex;flex-direction:column;gap:22px;}

        /* greeting */
        .db-greeting h2{font-family:'Orbitron',monospace;font-size:1.4rem;font-weight:700;color:#fff;margin-bottom:4px;}
        .db-greeting p{font-size:.9rem;color:rgba(255,255,255,.35);}

        /* stat cards */
        .db-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;}
        .db-stat{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:6px;padding:18px 16px;transition:.2s;}
        .db-stat:hover{border-color:rgba(var(--accent-r),.25);background:rgba(var(--accent-r),.04);}
        .db-stat-icon{font-size:1.3rem;margin-bottom:10px;}
        .db-stat-val{font-family:'Orbitron',monospace;font-size:1.3rem;font-weight:700;color:#fff;margin-bottom:3px;}
        .db-stat-label{font-size:.72rem;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:.08em;}
        .db-stat-change{font-size:.72rem;margin-top:4px;}

        /* cards grid */
        .db-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px;}
        .db-grid-wide{grid-template-columns:2fr 1fr;}
        .db-card{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:20px;}
        .db-card-title{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:rgba(255,255,255,.35);margin-bottom:14px;display:flex;align-items:center;gap:6px;}
        .db-card-title-accent{color:var(--accent);}

        /* tracker bar */
        .db-tracker{display:flex;align-items:center;gap:12px;padding:14px;background:rgba(var(--accent-r),.06);border:1px solid rgba(var(--accent-r),.18);border-radius:6px;}
        .db-tracker input{flex:1;background:transparent;border:none;color:#fff;font-family:'Exo 2',sans-serif;font-size:.9rem;outline:none;}
        .db-tracker input::placeholder{color:rgba(255,255,255,.25);}
        .db-tracker-time{font-family:monospace;font-size:1rem;font-weight:700;color:var(--accent);min-width:80px;text-align:center;}
        .db-tracker-btn{padding:8px 16px;border:none;border-radius:4px;cursor:pointer;font-weight:700;font-size:.82rem;transition:.2s;}

        @media(max-width:1100px){.db-stats{grid-template-columns:repeat(2,1fr);}.db-grid{grid-template-columns:1fr 1fr;}}
        @media(max-width:768px){.db-sidebar{transform:translateX(-100%);}.db-main{margin-left:0;}.db-stats{grid-template-columns:repeat(2,1fr);}.db-grid{grid-template-columns:1fr;}}
      `}</style>

      <div className="db-root" style={{ '--accent':accent, '--accent-r': accent==='#00dcff'?'0,220,255':accent==='#8c3cff'?'140,60,255':'255,107,53' } as React.CSSProperties}>

        {/* ── SIDEBAR ── */}
        <aside className="db-sidebar">
          <div className="db-sidebar-logo">
            <svg width="30" height="30" viewBox="0 0 36 36" fill="none" style={{filter:`drop-shadow(0 0 8px ${accent})`}}>
              <polygon points="18,2 33,10 33,26 18,34 3,26 3,10" stroke={accent} strokeWidth="1.5" fill={`${accent}11`} />
              <circle cx="18" cy="18" r="3" fill={accent} opacity=".9" />
            </svg>
            <span className="db-logo-name">TimeLocus</span>
          </div>

          <nav className="db-nav">
            {navItems.map(([label, emoji]) => (
              <div key={label} className={`db-nav-item ${activeNav===label?'active':''}`} onClick={()=>setActiveNav(label as string)}>
                <span className="db-nav-emoji">{emoji}</span>
                <span>{label}</span>
              </div>
            ))}
          </nav>

          <div className="db-sidebar-footer">
            <div className="db-user-card">
              <div className="db-avatar">{user.firstName[0]}</div>
              <div className="db-user-info">
                <div className="name">{user.firstName} {user.lastName}</div>
                <div className="type">{cfg.badge} {cfg.label}</div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="db-main">
          <header className="db-header">
            <span className="db-header-title">{activeNav}</span>
            <div className="db-header-right">
              <span className="db-clock">{currentTime.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</span>
              <div className="db-badge">{cfg.badge} {cfg.label}</div>
              <div className="db-avatar" style={{width:'32px',height:'32px',fontSize:'.8rem'}}>{user.firstName[0]}</div>
            </div>
          </header>

          <div className="db-content">

            {/* Greeting */}
            <div className="db-greeting">
              <h2>Good {currentTime.getHours()<12?'morning':currentTime.getHours()<17?'afternoon':'evening'}, {user.firstName}! 👋</h2>
              <p>{cfg.greeting} · {new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</p>
            </div>

            {/* Live tracker bar */}
            <div className="db-tracker">
              <span>⏱️</span>
              <input value={trackingTask} onChange={e=>setTrackingTask(e.target.value)} placeholder="What are you working on right now?"/>
              {tracking && <span className="db-tracker-time">{fmtTrack(trackSeconds)}</span>}
              <button className="db-tracker-btn" onClick={()=>setTracking(v=>!v)} style={{
                background: tracking ? 'rgba(255,60,80,.2)' : accent,
                color: tracking ? '#ff4060' : '#000',
                border: tracking ? '1px solid rgba(255,60,80,.4)' : 'none',
              }}>{tracking ? '⏹ Stop' : '▶ Start'}</button>
            </div>

            {/* Stat cards */}
            <div className="db-stats">
              {[
                { icon:'⏰', val: fmtDur(totalToday), label:'Tracked Today',   change:'+12% vs yesterday', up:true  },
                { icon:'🔥', val:'7 days',             label:'Current Streak',  change:'Personal best!',   up:true  },
                { icon:'🎯', val:'82%',                label:'Focus Score',     change:'-3% vs yesterday', up:false },
                { icon:'✅', val:'12/18',              label:'Tasks Done',      change:'6 remaining',      up:null  },
              ].map((s,i) => (
                <div key={i} className="db-stat">
                  <div className="db-stat-icon">{s.icon}</div>
                  <div className="db-stat-val">{s.val}</div>
                  <div className="db-stat-label">{s.label}</div>
                  <div className="db-stat-change" style={{color: s.up===true?'#00ff88':s.up===false?'#ff4060':'rgba(255,255,255,.3)'}}>{s.change}</div>
                </div>
              ))}
            </div>

            {/* Main grid row 1 */}
            <div className="db-grid">
              {/* Today's timeline */}
              <div className="db-card" style={{gridColumn:'span 2'}}>
                <div className="db-card-title">📅 Today's <span className="db-card-title-accent">Timeline</span></div>
                <TimelineBar entries={MOCK_ENTRIES}/>
                <div style={{display:'flex',gap:'12px',marginTop:'20px',flexWrap:'wrap'}}>
                  {MOCK_ENTRIES.map(e => (
                    <div key={e.id} style={{display:'flex',alignItems:'center',gap:'6px',padding:'6px 10px',background:'rgba(255,255,255,.04)',borderRadius:'4px',fontSize:'.78rem',color:'rgba(255,255,255,.6)'}}>
                      <div style={{width:'8px',height:'8px',borderRadius:'2px',background:CATEGORY_COLOR[e.category],flexShrink:0}}/>
                      <span>{e.task}</span>
                      <span style={{color:'rgba(255,255,255,.3)'}}>{fmtDur(e.duration)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Focus timer */}
              <div className="db-card">
                <div className="db-card-title">🧠 <span className="db-card-title-accent">Focus Zone</span></div>
                <FocusTimer accent={accent}/>
              </div>
            </div>

            {/* Main grid row 2 */}
            <div className="db-grid">
              {/* Todo */}
              <div className="db-card">
                <div className="db-card-title">✅ <span className="db-card-title-accent">Tasks</span></div>
                <TodoWidget accent={accent}/>
              </div>

              {/* Weekly chart */}
              <div className="db-card">
                <div className="db-card-title">📊 <span className="db-card-title-accent">This Week</span></div>
                <WeeklyBarChart accent={accent}/>
                <div style={{marginTop:'20px',display:'flex',justifyContent:'space-between',fontSize:'.78rem'}}>
                  <div><div style={{color:'rgba(255,255,255,.35)',marginBottom:'2px'}}>Total</div><div style={{fontWeight:700,color:'#fff'}}>{WEEK_DATA.reduce((a,b)=>a+b,0).toFixed(1)}h</div></div>
                  <div><div style={{color:'rgba(255,255,255,.35)',marginBottom:'2px'}}>Daily avg</div><div style={{fontWeight:700,color:'#fff'}}>{(WEEK_DATA.reduce((a,b)=>a+b,0)/7).toFixed(1)}h</div></div>
                  <div><div style={{color:'rgba(255,255,255,.35)',marginBottom:'2px'}}>Best day</div><div style={{fontWeight:700,color:accent}}>Thu · 8.1h</div></div>
                </div>
              </div>

              {/* Recent activity */}
              <div className="db-card">
                <div className="db-card-title">⚡ <span className="db-card-title-accent">Recent Activity</span></div>
                <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                  {[
                    {icon:'🎯',text:'Focus session completed',sub:'2h 15m · Deep work',time:'2h ago'},
                    {icon:'✅',text:'Daily goal achieved',sub:'8 hours tracked',time:'Yesterday'},
                    {icon:'🔥',text:'7-day streak!',sub:'Consistency milestone',time:'Today'},
                    {icon:'🤖',text:'AI insight generated',sub:'Your peak hours: 9–11am',time:'3h ago'},
                  ].map((a,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'flex-start',gap:'10px',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,.05)'}}>
                      <span style={{fontSize:'1rem',flexShrink:0}}>{a.icon}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:'.84rem',color:'#fff',fontWeight:500}}>{a.text}</div>
                        <div style={{fontSize:'.72rem',color:'rgba(255,255,255,.3)',marginTop:'2px'}}>{a.sub}</div>
                      </div>
                      <span style={{fontSize:'.7rem',color:'rgba(255,255,255,.25)',flexShrink:0}}>{a.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}