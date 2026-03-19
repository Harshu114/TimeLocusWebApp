'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
type UserType = 'student' | 'corporate' | 'self_employed';
interface User { firstName: string; lastName: string; email: string; userType: UserType; }
interface TimeEntry { id: string; task: string; date: string; startTime: string; endTime: string; duration: number; category: string; manual: boolean; }
interface DailySummary { date: string; totalMinutes: number; focusScore: number; taskCount: number; breakdown: { category: string; minutes: number; percentage: number }[]; }
interface Task { id: string; title: string; done: boolean; priority: string; dueDate?: string; }
interface PlannerEvent { id: string; title: string; description: string; date: string; time: string; eventType: string; done: boolean; }
interface ChatMsg { role: 'user' | 'ai'; text: string; }

// ─── Constants ────────────────────────────────────────────────────────────────
const CAT_COLOR: Record<string,string> = { work:'#00dcff', meeting:'#8c3cff', break:'#ff6b35', study:'#00ff88', personal:'#ffcc00', other:'#888' };
const WEEKDAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const NAV: Record<UserType, string[][]> = {
  student:       [['Dashboard','🏠'],['Time Tracker','⏱'],['Planner','📅'],['Focus Zone','🧠'],['Tasks','✅'],['Progress','📊'],['AI Assistant','🤖']],
  corporate:     [['Dashboard','🏠'],['Time Tracker','⏱'],['Meetings','💼'],['Focus Zone','🧠'],['Tasks','✅'],['Reports','📊'],['AI Assistant','🤖']],
  self_employed: [['Dashboard','🏠'],['Time Tracker','⏱'],['Projects','🚀'],['Focus Zone','🧠'],['Tasks','✅'],['Goals','🎯'],['AI Assistant','🤖']],
};
const CFG: Record<UserType, { label: string; accent: string; badge: string }> = {
  student:       { label:'Student Mode',      accent:'#00dcff', badge:'🎓' },
  corporate:     { label:'Corporate Mode',    accent:'#8c3cff', badge:'💼' },
  self_employed: { label:'Entrepreneur Mode', accent:'#ff6b35', badge:'🚀' },
};

// ─── API helper ───────────────────────────────────────────────────────────────
async function api(path: string, opts: RequestInit = {}) {
  const token = localStorage.getItem('tl_token');
  const res = await fetch(`/api${path}`, {
    ...opts,
    headers: { 'Content-Type':'application/json', ...(token ? { Authorization:`Bearer ${token}` } : {}), ...(opts.headers||{}) },
  });
  if (res.status === 401) { localStorage.clear(); window.location.href = '/login'; throw new Error('Unauthorized'); }
  return res;
}

const fmtDur = (m: number) => m >= 60 ? `${Math.floor(m/60)}h ${m%60}m` : `${m}m`;
const fmtSecs = (s: number) => `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

// ══════════════════════════════════════════════════════════════════════════════
// SHARED: Card wrapper
// ══════════════════════════════════════════════════════════════════════════════
function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.07)', borderRadius:8, padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div style={{ fontSize:'.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.12em', color:'rgba(255,255,255,.35)' }}>{title}</div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function DashboardTab({ user, accent }: { user: User; accent: string }) {
  const [summary, setSummary]   = useState<DailySummary | null>(null);
  const [weekHours, setWeekHours] = useState<number[]>([0,0,0,0,0,0,0]);
  const [entries, setEntries]   = useState<TimeEntry[]>([]);
  const [taskStats, setTaskStats] = useState({ total:0, done:0 });
  const [tracking, setTracking] = useState(false);
  const [trackTask, setTrackTask] = useState('');
  const [trackSecs, setTrackSecs] = useState(0);
  const [activeEntryId, setActiveEntryId] = useState<string|null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const accentR = accent==='#00dcff'?'0,220,255':accent==='#8c3cff'?'140,60,255':'255,107,53';

  const load = useCallback(async () => {
    try {
      const [sumRes, entriesRes, taskRes, weekRes] = await Promise.all([
        api('/time-entries/summary/daily'),
        api('/time-entries'),
        api('/tasks/stats'),
        api('/productivity/weekly'),
      ]);
      if (sumRes.ok)     setSummary(await sumRes.json());
      if (entriesRes.ok) setEntries(await entriesRes.json());
      if (taskRes.ok)    setTaskStats(await taskRes.json());
      if (weekRes.ok) {
        const wk = await weekRes.json() as DailySummary[];
        const arr = [0,0,0,0,0,0,0];
        wk.forEach(d => {
          const date = new Date(d.date+'T00:00');
          const idx  = (date.getDay() + 6) % 7; // Mon=0
          arr[idx] = Math.round(d.totalMinutes / 60 * 10) / 10;
        });
        setWeekHours(arr);
      }
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (tracking) { timerRef.current = setInterval(()=>setTrackSecs(s=>s+1),1000); }
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [tracking]);

  const startTimer = async () => {
    if (!trackTask.trim()) return;
    try {
      const res = await api('/time-entries/start', { method:'POST', body:JSON.stringify({ task:trackTask, category:'work' }) });
      if (res.ok) { const d = await res.json(); setActiveEntryId(d.id); setTracking(true); setTrackSecs(0); }
    } catch {}
  };

  const stopTimer = async () => {
    if (!activeEntryId) return;
    try {
      await api(`/time-entries/${activeEntryId}/stop`, { method:'POST' });
      setTracking(false); setTrackTask(''); setTrackSecs(0); setActiveEntryId(null);
      load();
    } catch {}
  };

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const maxW = Math.max(...weekHours, 1);
  const startH = 6; const totalM = 16*60;
  const toP = (t: string) => { if (!t) return 0; const [h,m]=t.split(':').map(Number); return Math.max(0,Math.min(100,((h-startH)*60+m)/totalM*100)); };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div>
        <h2 style={{ fontFamily:'Orbitron,monospace', fontSize:'1.35rem', fontWeight:700, color:'#fff', marginBottom:4 }}>
          Good {greeting}, {user.firstName}! 👋
        </h2>
        <p style={{ color:'rgba(255,255,255,.35)', fontSize:'.88rem' }}>
          {now.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
        </p>
      </div>

      {/* Live tracker */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:14, background:`rgba(${accentR},.06)`, border:`1px solid rgba(${accentR},.2)`, borderRadius:6 }}>
        <span>⏱️</span>
        <input value={trackTask} onChange={e=>setTrackTask(e.target.value)}
          placeholder="What are you working on right now?" disabled={tracking}
          style={{ flex:1, background:'transparent', border:'none', color:'#fff', fontFamily:'inherit', fontSize:'.9rem', outline:'none' }} />
        {tracking && <span style={{ fontFamily:'monospace', fontSize:'1rem', fontWeight:700, color:accent }}>{fmtSecs(trackSecs)}</span>}
        <button onClick={tracking ? stopTimer : startTimer} style={{
          padding:'8px 18px', borderRadius:4, border: tracking ? '1px solid rgba(255,60,80,.4)' : 'none',
          cursor:'pointer', fontWeight:700, fontSize:'.82rem',
          background: tracking ? 'rgba(255,60,80,.15)' : accent, color: tracking ? '#ff4060' : '#000',
        }}>{tracking ? '⏹ Stop' : '▶ Start'}</button>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
        {[
          { icon:'⏰', val: summary ? fmtDur(summary.totalMinutes) : '0m',  label:'Tracked Today' },
          { icon:'🎯', val: summary ? `${Math.round(summary.focusScore)}%` : '0%', label:'Focus Score' },
          { icon:'✅', val: `${taskStats.done} / ${taskStats.total}`, label:'Tasks Done' },
          { icon:'📊', val: `${weekHours.reduce((a,b)=>a+b,0).toFixed(1)}h`, label:'This Week' },
        ].map((s,i) => (
          <div key={i} style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:8, padding:'18px 16px' }}>
            <div style={{ fontSize:'1.2rem', marginBottom:8 }}>{s.icon}</div>
            <div style={{ fontFamily:'Orbitron,monospace', fontSize:'1.2rem', fontWeight:700, color:accent, marginBottom:3 }}>{s.val}</div>
            <div style={{ fontSize:'.72rem', color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:'.08em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:18 }}>
        {/* Timeline */}
        <Card title="📅 Today's Timeline">
          {entries.length === 0
            ? <p style={{ color:'rgba(255,255,255,.3)', fontSize:'.85rem', textAlign:'center', padding:'20px 0' }}>No entries yet today. Start tracking!</p>
            : <>
                <div style={{ position:'relative', height:32, background:'rgba(255,255,255,.04)', borderRadius:4, overflow:'hidden', marginBottom:20 }}>
                  {entries.map(e => (
                    <div key={e.id} style={{ position:'absolute', height:'100%', left:`${toP(e.startTime)}%`, width:`${(e.duration/totalM)*100}%`, background:CAT_COLOR[e.category]||'#555', opacity:.8, borderRadius:2 }} title={`${e.task} (${fmtDur(e.duration)})`} />
                  ))}
                </div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {entries.map(e => (
                    <div key={e.id} style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px', background:'rgba(255,255,255,.04)', borderRadius:4, fontSize:'.78rem', color:'rgba(255,255,255,.6)' }}>
                      <div style={{ width:8, height:8, borderRadius:2, background:CAT_COLOR[e.category]||'#555' }}/>
                      <span>{e.task}</span>
                      <span style={{ color:'rgba(255,255,255,.3)' }}>{fmtDur(e.duration)}</span>
                    </div>
                  ))}
                </div>
              </>
          }
        </Card>

        {/* Weekly chart */}
        <Card title="📊 This Week">
          <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:90 }}>
            {weekHours.map((h,i) => (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <span style={{ fontSize:'.58rem', color:'rgba(255,255,255,.35)' }}>{h > 0 ? `${h}h` : ''}</span>
                <div style={{ width:'100%', height:`${Math.max((h/maxW)*72,h>0?4:2)}px`, borderRadius:'3px 3px 0 0', background: i===(now.getDay()+6)%7 ? `linear-gradient(180deg,${accent},${accent}88)` : 'rgba(255,255,255,.08)', transition:'.4s', minHeight:2 }}/>
                <span style={{ fontSize:'.6rem', color:'rgba(255,255,255,.3)' }}>{WEEKDAYS[i]}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop:14, display:'flex', justifyContent:'space-between', fontSize:'.78rem' }}>
            <div><div style={{ color:'rgba(255,255,255,.35)' }}>Total</div><div style={{ fontWeight:700, color:'#fff' }}>{weekHours.reduce((a,b)=>a+b,0).toFixed(1)}h</div></div>
            <div><div style={{ color:'rgba(255,255,255,.35)' }}>Daily avg</div><div style={{ fontWeight:700, color:'#fff' }}>{(weekHours.reduce((a,b)=>a+b,0)/7).toFixed(1)}h</div></div>
          </div>
        </Card>
      </div>

      {/* Breakdown */}
      {summary && summary.breakdown.length > 0 && (
        <Card title="🗂️ Today's Breakdown">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
            {summary.breakdown.map(b => (
              <div key={b.category}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:'.82rem' }}>
                  <span style={{ color:'rgba(255,255,255,.6)', textTransform:'capitalize' }}>{b.category}</span>
                  <span style={{ color:CAT_COLOR[b.category]||'#888', fontWeight:600 }}>{fmtDur(b.minutes)} ({Math.round(b.percentage)}%)</span>
                </div>
                <div style={{ height:6, background:'rgba(255,255,255,.06)', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${b.percentage}%`, background:CAT_COLOR[b.category]||'#888', borderRadius:3, transition:'.6s' }}/>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: TIME TRACKER
// ══════════════════════════════════════════════════════════════════════════════
function TimeTrackerTab({ accent }: { accent: string }) {
  const [entries, setEntries]   = useState<TimeEntry[]>([]);
  const [summary, setSummary]   = useState<DailySummary | null>(null);
  const [running, setRunning]   = useState(false);
  const [secs, setSecs]         = useState(0);
  const [task, setTask]         = useState('');
  const [category, setCategory] = useState('work');
  const [activeId, setActiveId] = useState<string|null>(null);
  const [showAdd, setShowAdd]   = useState(false);
  const [newE, setNewE]         = useState({ task:'', start:'', end:'', category:'work' });
  const [loading, setLoading]   = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const load = useCallback(async () => {
    try {
      const [eRes, sRes] = await Promise.all([api('/time-entries'), api('/time-entries/summary/daily')]);
      if (eRes.ok) setEntries(await eRes.json());
      if (sRes.ok) setSummary(await sRes.json());
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (running) { timerRef.current = setInterval(()=>setSecs(s=>s+1),1000); }
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [running]);

  const startTimer = async () => {
    if (!task.trim()) return;
    setLoading(true);
    try {
      const res = await api('/time-entries/start', { method:'POST', body:JSON.stringify({ task, category }) });
      if (res.ok) { const d = await res.json(); setActiveId(d.id); setRunning(true); setSecs(0); }
    } catch {} finally { setLoading(false); }
  };

  const stopTimer = async () => {
    if (!activeId) return;
    setLoading(true);
    try {
      await api(`/time-entries/${activeId}/stop`, { method:'POST' });
      setRunning(false); setTask(''); setSecs(0); setActiveId(null); load();
    } catch {} finally { setLoading(false); }
  };

  const addManual = async () => {
    if (!newE.task.trim() || !newE.start || !newE.end) return;
    const [sh,sm] = newE.start.split(':').map(Number);
    const [eh,em] = newE.end.split(':').map(Number);
    const dur = (eh*60+em)-(sh*60+sm);
    if (dur <= 0) return;
    setLoading(true);
    try {
      await api('/time-entries', { method:'POST', body:JSON.stringify({ task:newE.task, startTime:newE.start, endTime:newE.end, duration:dur, category:newE.category }) });
      setNewE({ task:'', start:'', end:'', category:'work' }); setShowAdd(false); load();
    } catch {} finally { setLoading(false); }
  };

  const deleteEntry = async (id: string) => {
    try { await api(`/time-entries/${id}`, { method:'DELETE' }); load(); } catch {}
  };

  const inputStyle = { background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.09)', borderRadius:4, padding:'10px 12px', color:'#fff', fontFamily:'inherit', fontSize:'.88rem', outline:'none', width:'100%', boxSizing:'border-box' as const };
  const selectStyle = { ...inputStyle, appearance:'none' as const };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Timer card */}
      <Card title="⏱ Live Timer">
        <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
          <input value={task} onChange={e=>setTask(e.target.value)} placeholder="What are you working on?" disabled={running}
            style={{ ...inputStyle, flex:2, minWidth:200 }} />
          <select value={category} onChange={e=>setCategory(e.target.value)} disabled={running} style={{ ...selectStyle, flex:1, minWidth:120 }}>
            {['work','study','meeting','break','personal'].map(c=><option key={c} value={c} style={{background:'#0a1020'}}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
          </select>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ fontFamily:'monospace', fontSize:'2.5rem', fontWeight:700, color:accent }}>{fmtSecs(secs)}</div>
          <button onClick={running ? stopTimer : startTimer} disabled={loading} style={{
            padding:'12px 28px', borderRadius:4, border: running?'1px solid rgba(255,60,80,.4)':'none', cursor:'pointer', fontWeight:700, fontSize:'.9rem',
            background: running ? 'rgba(255,60,80,.15)' : accent, color: running ? '#ff4060' : '#000', opacity:loading?.6:1,
          }}>{running ? '⏹ Stop & Save' : '▶ Start Timer'}</button>
        </div>
      </Card>

      {/* Header + add button */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <span style={{ fontSize:'1rem', fontWeight:600, color:'#fff' }}>Today's Entries</span>
          {summary && <span style={{ marginLeft:10, fontSize:'.82rem', color:'rgba(255,255,255,.35)' }}>Total: <b style={{color:accent}}>{fmtDur(summary.totalMinutes)}</b> · Score: <b style={{color:accent}}>{Math.round(summary.focusScore)}%</b></span>}
        </div>
        <button onClick={()=>setShowAdd(v=>!v)} style={{ padding:'8px 16px', background:accent, border:'none', borderRadius:4, color:'#000', fontWeight:700, fontSize:'.82rem', cursor:'pointer' }}>+ Manual Entry</button>
      </div>

      {/* Manual entry form */}
      {showAdd && (
        <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.09)', borderRadius:8, padding:16, display:'flex', gap:10, flexWrap:'wrap', alignItems:'flex-end' }}>
          {[
            { label:'Task', node: <input value={newE.task} onChange={e=>setNewE(p=>({...p,task:e.target.value}))} placeholder="Task name" style={inputStyle}/> },
            { label:'Start', node: <input type="time" value={newE.start} onChange={e=>setNewE(p=>({...p,start:e.target.value}))} style={{...inputStyle,colorScheme:'dark'}}/> },
            { label:'End', node: <input type="time" value={newE.end} onChange={e=>setNewE(p=>({...p,end:e.target.value}))} style={{...inputStyle,colorScheme:'dark'}}/> },
            { label:'Category', node: <select value={newE.category} onChange={e=>setNewE(p=>({...p,category:e.target.value}))} style={selectStyle}>{['work','study','meeting','break','personal'].map(c=><option key={c} value={c} style={{background:'#0a1020'}}>{c}</option>)}</select> },
          ].map(({label,node},i) => (
            <div key={i} style={{ flex:1, minWidth:110 }}>
              <div style={{ fontSize:'.67rem', color:'rgba(255,255,255,.35)', marginBottom:5, textTransform:'uppercase', letterSpacing:'.08em' }}>{label}</div>
              {node}
            </div>
          ))}
          <button onClick={addManual} disabled={loading} style={{ padding:'10px 20px', background:accent, border:'none', borderRadius:4, color:'#000', fontWeight:700, cursor:'pointer' }}>Save</button>
        </div>
      )}

      {/* Entries */}
      {entries.length === 0
        ? <p style={{ color:'rgba(255,255,255,.3)', textAlign:'center', padding:30 }}>No entries today. Start the timer or add a manual entry!</p>
        : entries.map(e => (
          <div key={e.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.06)', borderRadius:6 }}>
            <div style={{ width:10, height:10, borderRadius:2, background:CAT_COLOR[e.category]||'#555', flexShrink:0 }}/>
            <span style={{ flex:1, color:'#fff', fontSize:'.9rem' }}>{e.task}</span>
            {e.startTime && <span style={{ fontSize:'.78rem', color:'rgba(255,255,255,.4)' }}>{e.startTime}{e.endTime ? ` – ${e.endTime}` : ''}</span>}
            <span style={{ fontSize:'.82rem', fontWeight:600, color:accent }}>{fmtDur(e.duration||0)}</span>
            <span style={{ fontSize:'.72rem', padding:'2px 8px', borderRadius:20, background:`${CAT_COLOR[e.category]||'#555'}22`, color:CAT_COLOR[e.category]||'#888' }}>{e.category}</span>
            <button onClick={()=>deleteEntry(e.id)} style={{ background:'none', border:'none', color:'rgba(255,255,255,.25)', cursor:'pointer', fontSize:'1rem' }}>✕</button>
          </div>
        ))
      }

      {/* Breakdown */}
      {summary && summary.breakdown.length > 0 && (
        <Card title="Category Breakdown">
          {summary.breakdown.map(b => (
            <div key={b.category} style={{ marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:'.82rem' }}>
                <span style={{ color:'rgba(255,255,255,.6)', textTransform:'capitalize' }}>{b.category}</span>
                <span style={{ color:CAT_COLOR[b.category]||'#888' }}>{fmtDur(b.minutes)} ({Math.round(b.percentage)}%)</span>
              </div>
              <div style={{ height:6, background:'rgba(255,255,255,.06)', borderRadius:3 }}>
                <div style={{ height:'100%', width:`${b.percentage}%`, background:CAT_COLOR[b.category]||'#888', borderRadius:3, transition:'.5s' }}/>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: PLANNER
// ══════════════════════════════════════════════════════════════════════════════
function PlannerTab({ accent, label }: { accent: string; label: string }) {
  const [events, setEvents]   = useState<PlannerEvent[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newEv, setNewEv]     = useState({ title:'', date:'', time:'', eventType:'work', description:'' });
  const [loading, setLoading] = useState(false);
  const TYPE_COLOR: Record<string,string> = { meeting:'#8c3cff', work:'#00dcff', deadline:'#ff4060', personal:'#ff6b35', exam:'#ffcc00' };

  const load = useCallback(async () => {
    try {
      const res = await api('/planner');
      if (res.ok) setEvents(await res.json());
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!newEv.title.trim() || !newEv.date) return;
    setLoading(true);
    try {
      await api('/planner', { method:'POST', body:JSON.stringify(newEv) });
      setNewEv({ title:'', date:'', time:'', eventType:'work', description:'' }); setShowAdd(false); load();
    } catch {} finally { setLoading(false); }
  };

  const toggle = async (id: string) => {
    try { await api(`/planner/${id}/toggle`, { method:'PATCH' }); load(); } catch {}
  };

  const del = async (id: string) => {
    try { await api(`/planner/${id}`, { method:'DELETE' }); load(); } catch {}
  };

  const today = new Date().toISOString().slice(0,10);
  const todayEvs  = events.filter(e => e.date === today);
  const futureEvs = events.filter(e => e.date > today);
  const pastEvs   = events.filter(e => e.date < today);

  const inputStyle = { background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.09)', borderRadius:4, padding:'10px 12px', color:'#fff', fontFamily:'inherit', fontSize:'.88rem', outline:'none', width:'100%', boxSizing:'border-box' as const };

  const EventRow = ({ e }: { e: PlannerEvent }) => (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'rgba(255,255,255,.025)', border:`1px solid ${(TYPE_COLOR[e.eventType]||'rgba(255,255,255,.06)')}33`, borderRadius:6, opacity:e.done?.6:1 }}>
      <div onClick={()=>toggle(e.id)} style={{ width:18, height:18, borderRadius:4, border:`1.5px solid ${e.done?accent:'rgba(255,255,255,.2)'}`, background:e.done?accent:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        {e.done && <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1,5 4,8 9,2" stroke="#000" strokeWidth="2" fill="none"/></svg>}
      </div>
      <span style={{ flex:1, color:e.done?'rgba(255,255,255,.4)':'#fff', fontSize:'.9rem', textDecoration:e.done?'line-through':'none' }}>{e.title}</span>
      {e.date !== today && <span style={{ fontSize:'.75rem', color:'rgba(255,255,255,.4)' }}>{new Date(e.date+'T00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>}
      {e.time && <span style={{ fontSize:'.75rem', color:'rgba(255,255,255,.35)' }}>{e.time}</span>}
      <span style={{ fontSize:'.7rem', padding:'2px 8px', borderRadius:20, background:`${TYPE_COLOR[e.eventType]||'#555'}22`, color:TYPE_COLOR[e.eventType]||'#888' }}>{e.eventType}</span>
      <button onClick={()=>del(e.id)} style={{ background:'none', border:'none', color:'rgba(255,255,255,.25)', cursor:'pointer' }}>✕</button>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <h3 style={{ color:'#fff', fontFamily:'Orbitron,monospace', fontSize:'1rem', marginBottom:4 }}>{label}</h3>
          <p style={{ color:'rgba(255,255,255,.35)', fontSize:'.85rem' }}>{todayEvs.length} today · {futureEvs.length} upcoming</p>
        </div>
        <button onClick={()=>setShowAdd(v=>!v)} style={{ padding:'9px 18px', background:accent, border:'none', borderRadius:4, color:'#000', fontWeight:700, fontSize:'.84rem', cursor:'pointer' }}>+ Add Event</button>
      </div>

      {showAdd && (
        <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.09)', borderRadius:8, padding:16, display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <div style={{ flex:2, minWidth:200 }}>
              <div style={{ fontSize:'.67rem', color:'rgba(255,255,255,.35)', marginBottom:5, textTransform:'uppercase', letterSpacing:'.08em' }}>Title</div>
              <input value={newEv.title} onChange={e=>setNewEv(p=>({...p,title:e.target.value}))} placeholder="Event title" style={inputStyle}/>
            </div>
            <div style={{ flex:1, minWidth:130 }}>
              <div style={{ fontSize:'.67rem', color:'rgba(255,255,255,.35)', marginBottom:5, textTransform:'uppercase', letterSpacing:'.08em' }}>Date</div>
              <input type="date" value={newEv.date} onChange={e=>setNewEv(p=>({...p,date:e.target.value}))} style={{...inputStyle,colorScheme:'dark'}}/>
            </div>
            <div style={{ flex:1, minWidth:110 }}>
              <div style={{ fontSize:'.67rem', color:'rgba(255,255,255,.35)', marginBottom:5, textTransform:'uppercase', letterSpacing:'.08em' }}>Time</div>
              <input type="time" value={newEv.time} onChange={e=>setNewEv(p=>({...p,time:e.target.value}))} style={{...inputStyle,colorScheme:'dark'}}/>
            </div>
            <div style={{ flex:1, minWidth:120 }}>
              <div style={{ fontSize:'.67rem', color:'rgba(255,255,255,.35)', marginBottom:5, textTransform:'uppercase', letterSpacing:'.08em' }}>Type</div>
              <select value={newEv.eventType} onChange={e=>setNewEv(p=>({...p,eventType:e.target.value}))} style={{...inputStyle,appearance:'none' as any}}>
                {['work','meeting','deadline','personal','exam'].map(t=><option key={t} value={t} style={{background:'#0a1020'}}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <input value={newEv.description} onChange={e=>setNewEv(p=>({...p,description:e.target.value}))} placeholder="Description (optional)" style={{...inputStyle,flex:1}}/>
            <button onClick={add} disabled={loading} style={{ padding:'10px 24px', background:accent, border:'none', borderRadius:4, color:'#000', fontWeight:700, cursor:'pointer' }}>Save</button>
          </div>
        </div>
      )}

      {events.length === 0 && <p style={{ color:'rgba(255,255,255,.3)', textAlign:'center', padding:40 }}>No events yet. Click "Add Event" to get started!</p>}
      {todayEvs.length > 0 && <><div style={{ fontSize:'.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.12em', color:'rgba(255,255,255,.35)' }}>Today</div>{todayEvs.map(e=><EventRow key={e.id} e={e}/>)}</>}
      {futureEvs.length > 0 && <><div style={{ fontSize:'.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.12em', color:'rgba(255,255,255,.35)', marginTop:8 }}>Upcoming</div>{futureEvs.map(e=><EventRow key={e.id} e={e}/>)}</>}
      {pastEvs.length > 0 && <><div style={{ fontSize:'.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.12em', color:'rgba(255,255,255,.2)', marginTop:8 }}>Past</div>{pastEvs.map(e=><EventRow key={e.id} e={e}/>)}</>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: TASKS
// ══════════════════════════════════════════════════════════════════════════════
function TasksTab({ accent }: { accent: string }) {
  const [tasks, setTasks]   = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [priority, setPriority] = useState('medium');
  const PCOL: Record<string,string> = { high:'#ff4060', medium:'#ffcc00', low:'#00ff88' };

  const load = useCallback(async () => {
    try { const r = await api('/tasks'); if (r.ok) setTasks(await r.json()); } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!newTask.trim()) return;
    try { await api('/tasks', { method:'POST', body:JSON.stringify({ title:newTask, priority }) }); setNewTask(''); load(); } catch {}
  };

  const toggle = async (id: string) => {
    try { await api(`/tasks/${id}/toggle`, { method:'PATCH' }); load(); } catch {}
  };

  const del = async (id: string) => {
    try { await api(`/tasks/${id}`, { method:'DELETE' }); load(); } catch {}
  };

  const pending   = tasks.filter(t => !t.done);
  const completed = tasks.filter(t => t.done);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', gap:8 }}>
        <input value={newTask} onChange={e=>setNewTask(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()}
          placeholder="Add a new task..." style={{ flex:1, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.09)', borderRadius:4, padding:'12px 14px', color:'#fff', fontFamily:'inherit', fontSize:'.9rem', outline:'none' }} />
        <select value={priority} onChange={e=>setPriority(e.target.value)} style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.09)', borderRadius:4, padding:'12px', color:'#fff', fontFamily:'inherit', fontSize:'.84rem', outline:'none' }}>
          <option value="high" style={{background:'#0a1020'}}>🔴 High</option>
          <option value="medium" style={{background:'#0a1020'}}>🟡 Medium</option>
          <option value="low" style={{background:'#0a1020'}}>🟢 Low</option>
        </select>
        <button onClick={add} style={{ padding:'12px 20px', background:accent, border:'none', borderRadius:4, color:'#000', fontWeight:700, cursor:'pointer' }}>+ Add</button>
      </div>

      {pending.length === 0 && completed.length === 0 && (
        <p style={{ color:'rgba(255,255,255,.3)', textAlign:'center', padding:40 }}>No tasks yet. Add one above!</p>
      )}

      {pending.length > 0 && (
        <>
          <div style={{ fontSize:'.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.12em', color:'rgba(255,255,255,.35)' }}>Pending ({pending.length})</div>
          {pending.map(t => (
            <div key={t.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.06)', borderRadius:6 }}>
              <div onClick={()=>toggle(t.id)} style={{ width:18, height:18, borderRadius:4, border:`1.5px solid rgba(255,255,255,.2)`, background:'transparent', cursor:'pointer', flexShrink:0 }}/>
              <span style={{ flex:1, color:'#fff', fontSize:'.9rem' }}>{t.title}</span>
              <div style={{ width:8, height:8, borderRadius:'50%', background:PCOL[t.priority]||'#888', boxShadow:`0 0 6px ${PCOL[t.priority]||'#888'}` }}/>
              <span style={{ fontSize:'.72rem', color:'rgba(255,255,255,.3)', textTransform:'capitalize' }}>{t.priority}</span>
              <button onClick={()=>del(t.id)} style={{ background:'none', border:'none', color:'rgba(255,255,255,.25)', cursor:'pointer' }}>✕</button>
            </div>
          ))}
        </>
      )}

      {completed.length > 0 && (
        <>
          <div style={{ fontSize:'.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.12em', color:'rgba(255,255,255,.2)', marginTop:8 }}>Completed ({completed.length})</div>
          {completed.map(t => (
            <div key={t.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'rgba(255,255,255,.015)', border:'1px solid rgba(255,255,255,.04)', borderRadius:6, opacity:.6 }}>
              <div onClick={()=>toggle(t.id)} style={{ width:18, height:18, borderRadius:4, border:`1.5px solid ${accent}`, background:accent, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1,5 4,8 9,2" stroke="#000" strokeWidth="2" fill="none"/></svg>
              </div>
              <span style={{ flex:1, color:'rgba(255,255,255,.4)', fontSize:'.9rem', textDecoration:'line-through' }}>{t.title}</span>
              <button onClick={()=>del(t.id)} style={{ background:'none', border:'none', color:'rgba(255,255,255,.2)', cursor:'pointer' }}>✕</button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: FOCUS ZONE
// ══════════════════════════════════════════════════════════════════════════════
function FocusZoneTab({ accent }: { accent: string }) {
  const [mode, setMode]       = useState<'pomodoro'|'deep'|'sprint'>('pomodoro');
  const [phase, setPhase]     = useState<'focus'|'break'>('focus');
  const [secs, setSecs]       = useState(25*60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [todayMins, setTodayMins] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const MODES = { pomodoro:{focus:25,break:5,emoji:'🍅'}, deep:{focus:90,break:20,emoji:'🧠'}, sprint:{focus:15,break:3,emoji:'⚡'} };
  const cfg = MODES[mode];
  const phaseColor = phase==='focus' ? accent : '#00ff88';
  const r = 80; const circ = 2*Math.PI*r;
  const total = (phase==='focus'?cfg.focus:cfg.break)*60;
  const progress = 1 - secs/total;
  const mm = String(Math.floor(secs/60)).padStart(2,'0');
  const ss = String(secs%60).padStart(2,'0');

  const loadStats = useCallback(async () => {
    try {
      const res = await api('/focus/today');
      if (res.ok) { const d = await res.json(); setSessions(d.sessions||0); setTodayMins(d.totalMinutes||0); }
    } catch {}
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setSecs(s => {
          if (s <= 1) {
            clearInterval(timerRef.current);
            setRunning(false);
            if (phase === 'focus') {
              // Save to backend
              api('/focus/complete', { method:'POST', body:JSON.stringify({ mode, durationMinutes:cfg.focus }) }).then(()=>loadStats());
              setSessions(n=>n+1);
              setPhase('break'); setSecs(cfg.break*60);
            } else { setPhase('focus'); setSecs(cfg.focus*60); }
            return 0;
          }
          return s-1;
        });
      }, 1000);
    } else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [running, phase, mode]);

  const switchMode = (m: typeof mode) => { setMode(m); setRunning(false); setPhase('focus'); setSecs(MODES[m].focus*60); };

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
      <Card title="🧠 Focus Timer">
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
          <div style={{ display:'flex', gap:8 }}>
            {(Object.keys(MODES) as (typeof mode)[]).map(m => (
              <button key={m} onClick={()=>switchMode(m)} style={{ padding:'6px 14px', borderRadius:20, border:'none', cursor:'pointer', fontSize:'.78rem', fontWeight:600, background:mode===m?accent:'rgba(255,255,255,.08)', color:mode===m?'#000':'rgba(255,255,255,.5)' }}>
                {MODES[m].emoji} {m.charAt(0).toUpperCase()+m.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ fontSize:'.68rem', fontWeight:700, letterSpacing:'.18em', textTransform:'uppercase', color:phaseColor, background:`${phaseColor}18`, border:`1px solid ${phaseColor}44`, padding:'4px 14px', borderRadius:20 }}>
            {phase==='focus'?'🎯 Focus Time':'☕ Break Time'}
          </div>
          <div style={{ position:'relative', width:200, height:200 }}>
            <svg width="200" height="200" style={{ transform:'rotate(-90deg)' }}>
              <circle cx="100" cy="100" r={r} stroke="rgba(255,255,255,0.06)" strokeWidth="8" fill="none" />
              <circle cx="100" cy="100" r={r} stroke={phaseColor} strokeWidth="8" fill="none"
                strokeDasharray={circ} strokeDashoffset={circ*(1-progress)} strokeLinecap="round"
                style={{ transition:'1s linear', filter:`drop-shadow(0 0 8px ${phaseColor})` }} />
            </svg>
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
              <div style={{ fontFamily:'monospace', fontSize:'2.4rem', fontWeight:700, color:'#fff' }}>{mm}:{ss}</div>
              <div style={{ fontSize:'.65rem', color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:'.1em' }}>{phase}</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={()=>{ setRunning(false); setSecs((phase==='focus'?cfg.focus:cfg.break)*60); }} style={{ padding:'10px 14px', borderRadius:4, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', color:'rgba(255,255,255,.5)', cursor:'pointer' }}>↺</button>
            <button onClick={()=>setRunning(v=>!v)} style={{ padding:'12px 28px', borderRadius:4, border:running?'1px solid rgba(255,60,80,.4)':'none', cursor:'pointer', fontWeight:700, background:running?'rgba(255,60,80,.15)':`linear-gradient(105deg,${accent},${accent}cc)`, color:running?'#ff4060':'#000' }}>
              {running ? '⏸ Pause' : '▶ Start'}
            </button>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {Array.from({length:4}).map((_,i) => (
              <div key={i} style={{ width:10, height:10, borderRadius:'50%', background:i<sessions%4?accent:'rgba(255,255,255,.1)', boxShadow:i<sessions%4?`0 0 8px ${accent}`:'none', transition:'.3s' }}/>
            ))}
          </div>
          <div style={{ display:'flex', gap:20, fontSize:'.82rem', textAlign:'center' }}>
            <div><div style={{ color:'rgba(255,255,255,.35)' }}>Sessions</div><div style={{ fontWeight:700, color:accent }}>{sessions}</div></div>
            <div><div style={{ color:'rgba(255,255,255,.35)' }}>Focus Time</div><div style={{ fontWeight:700, color:accent }}>{fmtDur(todayMins)}</div></div>
          </div>
        </div>
      </Card>

      <Card title="💡 Focus Tips">
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {[
            { icon:'📵', tip:'Put your phone in another room' },
            { icon:'🌐', tip:'Close all non-essential browser tabs' },
            { icon:'🎯', tip:'Set one clear goal before starting' },
            { icon:'☕', tip:'Take a proper break when timer ends' },
            { icon:'💧', tip:'Keep water nearby' },
            { icon:'🎵', tip:'Try lo-fi music or white noise' },
            { icon:'📝', tip:'Write distracting thoughts down, deal later' },
            { icon:'⏰', tip:'25 minutes focus = 1 Pomodoro session' },
          ].map((t,i) => (
            <div key={i} style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'10px 12px', background:'rgba(255,255,255,.03)', borderRadius:6, borderLeft:`2px solid ${accent}44` }}>
              <span style={{ fontSize:'1.1rem' }}>{t.icon}</span>
              <span style={{ fontSize:'.85rem', color:'rgba(255,255,255,.55)', lineHeight:1.5 }}>{t.tip}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: PROGRESS / REPORTS
// ══════════════════════════════════════════════════════════════════════════════
function ProgressTab({ accent }: { accent: string }) {
  const [weekly, setWeekly]   = useState<any[]>([]);
  const [taskStats, setTaskStats] = useState({ total:0, done:0 });
  const [focusStats, setFocusStats] = useState({ sessions:0, totalMinutes:0 });

  useEffect(() => {
    Promise.all([
      api('/productivity/weekly').then(r=>r.ok?r.json():[]),
      api('/tasks/stats').then(r=>r.ok?r.json():{total:0,done:0}),
      api('/focus/today').then(r=>r.ok?r.json():{sessions:0,totalMinutes:0}),
    ]).then(([wk,ts,fs]) => {
      setWeekly(wk); setTaskStats(ts); setFocusStats(fs);
    }).catch(()=>{});
  }, []);

  const weekHours = [0,0,0,0,0,0,0];
  weekly.forEach(d => {
    try {
      const date = new Date(d.date+'T00:00');
      const idx  = (date.getDay()+6)%7;
      weekHours[idx] = Math.round(d.totalMinutes/60*10)/10;
    } catch {}
  });
  const maxW = Math.max(...weekHours, 1);
  const weekTotal = weekHours.reduce((a,b)=>a+b,0);
  const bestDay   = WEEKDAYS[weekHours.indexOf(Math.max(...weekHours))];

  const breakdown: Record<string,number> = {};
  weekly.forEach(d => d.breakdown?.forEach((b: any) => { breakdown[b.category] = (breakdown[b.category]||0) + b.minutes; }));
  const bTotal = Object.values(breakdown).reduce((a,b)=>a+b,0)||1;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
        {[
          { icon:'⏰', val:`${weekTotal.toFixed(1)}h`, label:'This Week' },
          { icon:'🎯', val:weekly.length>0?`${Math.round(weekly.reduce((s:number,d:any)=>s+(d.focusScore||0),0)/weekly.length)}%`:'0%', label:'Avg Focus Score' },
          { icon:'✅', val:`${taskStats.done}/${taskStats.total}`, label:'Tasks Done' },
          { icon:'🧠', val:`${fmtDur(focusStats.totalMinutes)}`, label:"Today's Focus" },
        ].map((s,i) => (
          <div key={i} style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:8, padding:'18px 16px' }}>
            <div style={{ fontSize:'1.2rem', marginBottom:8 }}>{s.icon}</div>
            <div style={{ fontFamily:'Orbitron,monospace', fontSize:'1.2rem', fontWeight:700, color:accent, marginBottom:3 }}>{s.val}</div>
            <div style={{ fontSize:'.72rem', color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:'.08em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
        {/* Weekly chart */}
        <Card title="📊 Weekly Hours">
          {weekTotal === 0
            ? <p style={{ color:'rgba(255,255,255,.3)', textAlign:'center', padding:'20px 0', fontSize:'.85rem' }}>No data yet. Start tracking your time!</p>
            : <>
                <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:120 }}>
                  {weekHours.map((h,i) => (
                    <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                      {h > 0 && <span style={{ fontSize:'.62rem', color:'rgba(255,255,255,.4)' }}>{h}h</span>}
                      <div style={{ width:'100%', height:`${Math.max((h/maxW)*100,h>0?4:2)}px`, borderRadius:'4px 4px 0 0', background:h>0?`linear-gradient(180deg,${accent},${accent}66)`:'rgba(255,255,255,.06)', minHeight:2 }}/>
                      <span style={{ fontSize:'.62rem', color:'rgba(255,255,255,.3)' }}>{WEEKDAYS[i]}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:12, display:'flex', gap:16, fontSize:'.78rem' }}>
                  <span style={{ color:'rgba(255,255,255,.4)' }}>Total: <b style={{color:'#fff'}}>{weekTotal.toFixed(1)}h</b></span>
                  <span style={{ color:'rgba(255,255,255,.4)' }}>Best: <b style={{color:accent}}>{bestDay} · {Math.max(...weekHours)}h</b></span>
                </div>
              </>
          }
        </Card>

        {/* Category breakdown */}
        <Card title="🗂️ Time by Category">
          {Object.keys(breakdown).length === 0
            ? <p style={{ color:'rgba(255,255,255,.3)', textAlign:'center', padding:'20px 0', fontSize:'.85rem' }}>No tracked time this week.</p>
            : Object.entries(breakdown).map(([cat,mins]) => (
                <div key={cat} style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:'.82rem' }}>
                    <span style={{ color:'rgba(255,255,255,.6)', textTransform:'capitalize' }}>{cat}</span>
                    <span style={{ color:CAT_COLOR[cat]||'#888', fontWeight:600 }}>{fmtDur(mins as number)} ({Math.round((mins as number)/bTotal*100)}%)</span>
                  </div>
                  <div style={{ height:6, background:'rgba(255,255,255,.06)', borderRadius:3 }}>
                    <div style={{ height:'100%', width:`${(mins as number)/bTotal*100}%`, background:CAT_COLOR[cat]||'#888', borderRadius:3, transition:'.6s' }}/>
                  </div>
                </div>
              ))
          }
        </Card>
      </div>

      {/* Daily focus scores */}
      {weekly.length > 0 && (
        <Card title="🎯 Daily Focus Scores This Week">
          <div style={{ display:'flex', gap:12 }}>
            {weekly.map((d: any, i: number) => {
              const score = Math.round(d.focusScore||0);
              const color = score>=70?'#00ff88':score>=40?accent:'#ff6b35';
              return (
                <div key={i} style={{ flex:1, textAlign:'center', padding:'14px 8px', background:'rgba(255,255,255,.03)', borderRadius:6, border:`1px solid ${color}33` }}>
                  <div style={{ fontFamily:'Orbitron,monospace', fontSize:'1.2rem', fontWeight:700, color, marginBottom:4 }}>{score}%</div>
                  <div style={{ fontSize:'.7rem', color:'rgba(255,255,255,.4)' }}>{new Date(d.date+'T00:00').toLocaleDateString('en-IN',{weekday:'short',day:'numeric'})}</div>
                  <div style={{ fontSize:'.7rem', color:'rgba(255,255,255,.3)', marginTop:2 }}>{fmtDur(d.totalMinutes)}</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: AI ASSISTANT
// ══════════════════════════════════════════════════════════════════════════════
function AIAssistantTab({ accent, user }: { accent: string; user: User }) {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role:'ai', text:`Hi ${user.firstName}! 👋 I'm your TimeLocus AI. I can help with productivity tips, study strategies, time management, goal planning, and more. What's on your mind?` }
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const accentR = accent==='#00dcff'?'0,220,255':accent==='#8c3cff'?'140,60,255':'255,107,53';

  useEffect(() => { chatRef.current?.scrollTo(0, chatRef.current.scrollHeight); }, [messages]);

  const send = async (msg?: string) => {
    const text = (msg || input).trim();
    if (!text || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role:'user', text }]);
    setLoading(true);
    try {
      const res = await api('/ai/chat', { method:'POST', body:JSON.stringify({ message:text, context:`${user.userType} user named ${user.firstName}` }) });
      if (res.ok) {
        const d = await res.json();
        setMessages(prev => [...prev, { role:'ai', text: d.reply || 'Sorry, I could not respond right now.' }]);
      } else {
        setMessages(prev => [...prev, { role:'ai', text:'⚠️ AI service unavailable. Make sure your Groq API key is set in application.yml.' }]);
      }
    } catch {
      setMessages(prev => [...prev, { role:'ai', text:'⚠️ Connection error. Please check that your backend is running.' }]);
    } finally { setLoading(false); }
  };

  const QUICK = [
    'Give me a productivity tip for today',
    'Help me plan my study schedule',
    'How do I beat procrastination?',
    'What is the Pomodoro technique?',
    'How can I improve my focus score?',
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 160px)', gap:14 }}>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {QUICK.map(q => (
          <button key={q} onClick={()=>send(q)} disabled={loading} style={{ padding:'6px 14px', background:'rgba(255,255,255,.04)', border:`1px solid rgba(${accentR},.2)`, borderRadius:20, color:'rgba(255,255,255,.6)', fontSize:'.78rem', cursor:'pointer', transition:'.2s' }}>{q}</button>
        ))}
      </div>

      <div ref={chatRef} style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:14, padding:'4px 2px', minHeight:0 }}>
        {messages.map((m,i) => (
          <div key={i} style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start' }}>
            <div style={{ maxWidth:'78%', padding:'12px 16px', borderRadius:10, fontSize:'.88rem', lineHeight:1.65, background:m.role==='user'?`rgba(${accentR},.15)`:'rgba(255,255,255,.05)', border:m.role==='user'?`1px solid rgba(${accentR},.3)`:'1px solid rgba(255,255,255,.08)', color:m.role==='user'?'#fff':'rgba(255,255,255,.85)', borderBottomRightRadius:m.role==='user'?2:10, borderBottomLeftRadius:m.role==='ai'?2:10 }}>
              {m.role==='ai' && <span style={{ fontSize:'.7rem', color:accent, display:'block', marginBottom:5, fontWeight:600 }}>🤖 TimeLocus AI</span>}
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display:'flex', gap:5, padding:'10px 14px', background:'rgba(255,255,255,.05)', borderRadius:10, alignSelf:'flex-start', border:'1px solid rgba(255,255,255,.08)' }}>
            {[0,1,2].map(i => <div key={i} style={{ width:7, height:7, borderRadius:'50%', background:accent, animation:`pulse 1.2s ${i*.2}s ease-in-out infinite` }}/>)}
          </div>
        )}
      </div>

      <div style={{ display:'flex', gap:10 }}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()}
          placeholder="Ask me anything about productivity, focus, planning..."
          style={{ flex:1, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.09)', borderRadius:6, padding:'13px 16px', color:'#fff', fontFamily:'inherit', fontSize:'.9rem', outline:'none' }} />
        <button onClick={()=>send()} disabled={loading||!input.trim()} style={{ padding:'13px 22px', background:accent, border:'none', borderRadius:6, color:'#000', fontWeight:700, fontSize:'.88rem', cursor:'pointer', opacity:loading||!input.trim()?.5:1 }}>Send →</button>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8);}50%{opacity:1;transform:scale(1.1);}}`}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
export default function DashboardPage() {
  const [user, setUser]           = useState<User | null>(null);
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [time, setTime]           = useState(new Date());

  useEffect(() => {
    const stored = localStorage.getItem('tl_user');
    if (stored) setUser(JSON.parse(stored));
    else window.location.href = '/login';
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!user) return (
    <div style={{ minHeight:'100vh', background:'#080c14', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:36, height:36, border:'3px solid rgba(0,220,255,.2)', borderTopColor:'#00dcff', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );

  const cfg   = CFG[user.userType] || CFG.student;
  const accent = cfg.accent;
  const accentR = accent==='#00dcff'?'0,220,255':accent==='#8c3cff'?'140,60,255':'255,107,53';
  const navItems = NAV[user.userType] || NAV.student;

  const renderTab = () => {
    if (activeNav==='Dashboard')                                                  return <DashboardTab user={user} accent={accent}/>;
    if (activeNav==='Time Tracker')                                               return <TimeTrackerTab accent={accent}/>;
    if (['Planner','Meetings','Projects'].includes(activeNav))                    return <PlannerTab accent={accent} label={activeNav}/>;
    if (activeNav==='Focus Zone')                                                 return <FocusZoneTab accent={accent}/>;
    if (activeNav==='Tasks')                                                      return <TasksTab accent={accent}/>;
    if (['Progress','Reports','Goals','Revenue','Exams','Team'].includes(activeNav)) return <ProgressTab accent={accent}/>;
    if (activeNav==='AI Assistant')                                               return <AIAssistantTab accent={accent} user={user}/>;
    return <div style={{ color:'rgba(255,255,255,.4)', padding:40, textAlign:'center' }}>Coming soon...</div>;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700&family=Exo+2:wght@300;400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{background:#080c14;overflow-x:hidden;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:rgba(255,255,255,.03);}
        ::-webkit-scrollbar-thumb{background:rgba(${accentR},.2);border-radius:3px;}
        select option{background:#0e1828;color:#fff;}
        input[type=date]::-webkit-calendar-picker-indicator,
        input[type=time]::-webkit-calendar-picker-indicator{filter:invert(1);opacity:.5;cursor:pointer;}
      `}</style>

      <div style={{ display:'flex', minHeight:'100vh', background:'#080c14', fontFamily:"'Exo 2',sans-serif", color:'#fff' }}>

        {/* SIDEBAR */}
        <aside style={{ width:240, flexShrink:0, background:'rgba(6,12,24,.97)', borderRight:'1px solid rgba(255,255,255,.06)', display:'flex', flexDirection:'column', position:'fixed', top:0, left:0, bottom:0, zIndex:100 }}>
          <div style={{ padding:'22px 20px', borderBottom:'1px solid rgba(255,255,255,.06)', display:'flex', alignItems:'center', gap:10 }}>
            <svg width="30" height="30" viewBox="0 0 36 36" fill="none" style={{ filter:`drop-shadow(0 0 8px ${accent})` }}>
              <polygon points="18,2 33,10 33,26 18,34 3,26 3,10" stroke={accent} strokeWidth="1.5" fill={`${accent}11`}/>
              <circle cx="18" cy="18" r="3" fill={accent} opacity=".9"/>
            </svg>
            <span style={{ fontFamily:'Orbitron,monospace', fontWeight:700, fontSize:'.88rem', letterSpacing:'.15em', color:accent, textShadow:`0 0 20px ${accent}88` }}>TimeLocus</span>
          </div>

          <nav style={{ flex:1, padding:'12px 10px', display:'flex', flexDirection:'column', gap:3, overflowY:'auto' }}>
            {navItems.map(([label,emoji]) => {
              const active = activeNav === label;
              return (
                <button key={label} onClick={()=>setActiveNav(label)} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:6, cursor:'pointer', fontFamily:"'Exo 2',sans-serif", fontSize:'.88rem', fontWeight:active?600:500, color:active?accent:'rgba(255,255,255,.45)', background:active?`rgba(${accentR},.1)`:'transparent', border:active?`1px solid rgba(${accentR},.2)`:'1px solid transparent', textAlign:'left', transition:'.18s' }}>
                  <span style={{ fontSize:'1rem' }}>{emoji}</span>
                  <span>{label}</span>
                  {active && <span style={{ marginLeft:'auto', width:6, height:6, borderRadius:'50%', background:accent }}/>}
                </button>
              );
            })}
          </nav>

          <div style={{ padding:'14px 16px', borderTop:'1px solid rgba(255,255,255,.06)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{ width:34, height:34, borderRadius:'50%', background:`linear-gradient(135deg,${accent},#8c3cff)`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'.85rem', flexShrink:0 }}>{user.firstName[0]}</div>
              <div>
                <div style={{ fontSize:'.85rem', fontWeight:600, color:'#fff' }}>{user.firstName} {user.lastName}</div>
                <div style={{ fontSize:'.7rem', color:'rgba(255,255,255,.3)' }}>{cfg.badge} {cfg.label}</div>
              </div>
            </div>
            <button onClick={()=>{ localStorage.clear(); window.location.href='/login'; }} style={{ width:'100%', padding:'7px', background:'transparent', border:'1px solid rgba(255,255,255,.08)', borderRadius:4, color:'rgba(255,255,255,.35)', fontSize:'.75rem', cursor:'pointer', fontFamily:'inherit', transition:'.2s' }}>Sign Out</button>
          </div>
        </aside>

        {/* MAIN */}
        <main style={{ marginLeft:240, flex:1, display:'flex', flexDirection:'column', minHeight:'100vh' }}>
          <header style={{ padding:'14px 28px', background:'rgba(6,12,24,.9)', borderBottom:'1px solid rgba(255,255,255,.06)', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50, backdropFilter:'blur(12px)' }}>
            <span style={{ fontFamily:'Orbitron,monospace', fontSize:'.95rem', fontWeight:700, color:'#fff' }}>{activeNav}</span>
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <span style={{ fontFamily:'monospace', fontSize:'.9rem', color:'rgba(255,255,255,.4)' }}>{time.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</span>
              <div style={{ padding:'4px 12px', borderRadius:20, border:`1px solid rgba(${accentR},.3)`, background:`rgba(${accentR},.08)`, fontSize:'.75rem', color:accent, fontWeight:600 }}>{cfg.badge} {cfg.label}</div>
              <div style={{ width:32, height:32, borderRadius:'50%', background:`linear-gradient(135deg,${accent},#8c3cff)`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'.8rem' }}>{user.firstName[0]}</div>
            </div>
          </header>
          <div style={{ padding:'24px 28px', flex:1 }}>{renderTab()}</div>
        </main>
      </div>
    </>
  );
}
