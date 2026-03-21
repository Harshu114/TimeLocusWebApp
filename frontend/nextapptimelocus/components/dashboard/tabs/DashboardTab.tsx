'use client';
// components/dashboard/tabs/DashboardTab.tsx
// Main overview tab — live timer, stats, timeline, weekly chart, breakdown.

import { useState, useEffect, useRef, useCallback } from 'react';
import { User, TimeEntry, DailySummary } from '../../../types';
import { api } from '../../../lib/api';
import { CATEGORY_COLOR, WEEKDAYS, accentRgb, fmtDur, fmtSecs } from '../../../lib/constants';
import Card from '../Card';

interface Props { user: User; accent: string; }

export default function DashboardTab({ user, accent }: Props) {
  const [summary,    setSummary]    = useState<DailySummary | null>(null);
  const [weekHours,  setWeekHours]  = useState<number[]>([0,0,0,0,0,0,0]);
  const [entries,    setEntries]    = useState<TimeEntry[]>([]);
  const [taskStats,  setTaskStats]  = useState({ total:0, done:0 });
  const [tracking,   setTracking]   = useState(false);
  const [trackTask,  setTrackTask]  = useState('');
  const [trackSecs,  setTrackSecs]  = useState(0);
  const [activeId,   setActiveId]   = useState<string|null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const accentR  = accentRgb(accent);

  const load = useCallback(async () => {
    try {
      const [sumRes, entRes, taskRes, weekRes] = await Promise.all([
        api('/time-entries/summary/daily'),
        api('/time-entries'),
        api('/tasks/stats'),
        api('/productivity/weekly'),
      ]);
      if (sumRes.ok)  setSummary(await sumRes.json());
      if (entRes.ok)  setEntries(await entRes.json());
      if (taskRes.ok) setTaskStats(await taskRes.json());
      if (weekRes.ok) {
        const wk = await weekRes.json() as DailySummary[];
        const arr = [0,0,0,0,0,0,0];
        wk.forEach(d => {
          const idx = (new Date(d.date+'T00:00').getDay()+6)%7;
          arr[idx] = Math.round(d.totalMinutes/60*10)/10;
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
      if (res.ok) { const d = await res.json(); setActiveId(d.id); setTracking(true); setTrackSecs(0); }
    } catch {}
  };

  const stopTimer = async () => {
    if (!activeId) return;
    try {
      await api(`/time-entries/${activeId}/stop`, { method:'POST' });
      setTracking(false); setTrackTask(''); setTrackSecs(0); setActiveId(null); load();
    } catch {}
  };

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const maxW = Math.max(...weekHours, 1);
  const totalM = 16*60; const startH = 6;
  const toP = (t: string) => { if (!t) return 0; const [h,m]=t.split(':').map(Number); return Math.max(0,Math.min(100,((h-startH)*60+m)/totalM*100)); };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Greeting */}
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
        {tracking && <span style={{ fontFamily:'monospace', fontWeight:700, color:accent }}>{fmtSecs(trackSecs)}</span>}
        <button onClick={tracking ? stopTimer : startTimer} style={{
          padding:'8px 18px', borderRadius:4, cursor:'pointer', fontWeight:700, fontSize:'.82rem',
          background: tracking ? 'rgba(255,60,80,.15)' : accent,
          color: tracking ? '#ff4060' : '#000',
          border: tracking ? '1px solid rgba(255,60,80,.4)' : 'none',
        }}>{tracking ? '⏹ Stop' : '▶ Start'}</button>
      </div>

      {/* Stats grid */}
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

      {/* Timeline + Weekly chart */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:18 }}>
        <Card title="📅 Today's Timeline">
          {entries.length === 0
            ? <p style={{ color:'rgba(255,255,255,.3)', fontSize:'.85rem', textAlign:'center', padding:'20px 0' }}>No entries yet. Start the timer above!</p>
            : <>
                <div style={{ position:'relative', height:32, background:'rgba(255,255,255,.04)', borderRadius:4, overflow:'hidden', marginBottom:16 }}>
                  {entries.map(e => (
                    <div key={e.id} style={{ position:'absolute', height:'100%', left:`${toP(e.startTime)}%`, width:`${(e.duration/totalM)*100}%`, background:CATEGORY_COLOR[e.category]||'#555', opacity:.8, borderRadius:2 }} title={`${e.task} (${fmtDur(e.duration)})`}/>
                  ))}
                </div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {entries.map(e => (
                    <div key={e.id} style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px', background:'rgba(255,255,255,.04)', borderRadius:4, fontSize:'.78rem', color:'rgba(255,255,255,.6)' }}>
                      <div style={{ width:8, height:8, borderRadius:2, background:CATEGORY_COLOR[e.category]||'#555' }}/>
                      <span>{e.task}</span>
                      <span style={{ color:'rgba(255,255,255,.3)' }}>{fmtDur(e.duration)}</span>
                    </div>
                  ))}
                </div>
              </>
          }
        </Card>

        <Card title="📊 This Week">
          <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:90 }}>
            {weekHours.map((h,i) => (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                {h > 0 && <span style={{ fontSize:'.58rem', color:'rgba(255,255,255,.35)' }}>{h}h</span>}
                <div style={{ width:'100%', height:`${Math.max((h/maxW)*72,h>0?4:2)}px`, borderRadius:'3px 3px 0 0', background:i===(now.getDay()+6)%7?`linear-gradient(180deg,${accent},${accent}88)`:'rgba(255,255,255,.08)', minHeight:2 }}/>
                <span style={{ fontSize:'.6rem', color:'rgba(255,255,255,.3)' }}>{WEEKDAYS[i]}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop:14, display:'flex', justifyContent:'space-between', fontSize:'.78rem' }}>
            <div><div style={{ color:'rgba(255,255,255,.35)' }}>Total</div><div style={{ fontWeight:700, color:'#fff' }}>{weekHours.reduce((a,b)=>a+b,0).toFixed(1)}h</div></div>
            <div><div style={{ color:'rgba(255,255,255,.35)' }}>Avg/day</div><div style={{ fontWeight:700, color:'#fff' }}>{(weekHours.reduce((a,b)=>a+b,0)/7).toFixed(1)}h</div></div>
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
                  <span style={{ color:CATEGORY_COLOR[b.category]||'#888', fontWeight:600 }}>{fmtDur(b.minutes)} ({Math.round(b.percentage)}%)</span>
                </div>
                <div style={{ height:6, background:'rgba(255,255,255,.06)', borderRadius:3 }}>
                  <div style={{ height:'100%', width:`${b.percentage}%`, background:CATEGORY_COLOR[b.category]||'#888', borderRadius:3, transition:'.6s' }}/>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
