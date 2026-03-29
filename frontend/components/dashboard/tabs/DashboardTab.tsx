'use client';
// components/dashboard/tabs/DashboardTab.tsx

import { useState, useEffect, useRef, useCallback } from 'react';
import { User, TimeEntry, DailySummary } from '../../../types';
import { api } from '../../../lib/api';
import { CATEGORY_COLOR, WEEKDAYS, accentRgb, fmtDur, fmtSecs } from '../../../lib/constants';
import { useTheme } from '../../../lib/ThemeContext';
import Card from '../Card';

interface Props { user: User; accent: string; }

export default function DashboardTab({ user, accent }: Props) {
  const [summary,   setSummary]   = useState<DailySummary | null>(null);
  const [weekHours, setWeekHours] = useState<number[]>([0,0,0,0,0,0,0]);
  const [entries,   setEntries]   = useState<TimeEntry[]>([]);
  const [taskStats, setTaskStats] = useState({ total:0, done:0 });
  const [agenda, setAgenda] = useState<any[]>([]);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [focusStats, setFocusStats] = useState({ sessions: 0 });
  const [tracking,  setTracking]  = useState(false);
  const [trackTask, setTrackTask] = useState('');
  const [trackSecs, setTrackSecs] = useState(0);
  const [activeId,  setActiveId]  = useState<string|null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const accentR  = accentRgb(accent);
  const { isDark } = useTheme();

  // Colors derived from theme
  const text      = isDark ? '#fff'                    : '#1a2340';
  const text2     = isDark ? 'rgba(255,255,255,.45)'   : '#4a5680';
  const text3     = isDark ? 'rgba(255,255,255,.3)'    : '#8090b0';
  const surface   = isDark ? 'rgba(255,255,255,.04)'   : 'rgba(255,255,255,0.75)';
  const border    = isDark ? 'rgba(255,255,255,.06)'   : 'rgba(100,130,200,0.15)';
  const barBg     = isDark ? 'rgba(255,255,255,.06)'   : 'rgba(100,130,200,0.10)';
  const chipBg    = isDark ? 'rgba(255,255,255,.04)'   : 'rgba(255,255,255,0.8)';
  const chipBdr   = isDark ? 'rgba(255,255,255,.05)'   : 'rgba(100,130,200,0.15)';
  const inactiveBr= isDark ? 'rgba(255,255,255,.1)'    : 'rgba(100,130,200,0.12)';

  const load = useCallback(async () => {
    try {
      const todayISO = new Date().toISOString().slice(0, 10);
      const [sumRes, entRes, taskRes, weekRes, plannerRes, tasksListRes, focusRes] = await Promise.all([
        api('/time-entries/summary/daily'),
        api('/time-entries'),
        api('/tasks/stats'),
        api('/productivity/weekly'),
        api('/planner'),
        api('/tasks'),
        api('/focus/today')
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
      if (plannerRes.ok) {
        const evs = await plannerRes.json() as any[];
        const todays = evs.filter(e => e.date === todayISO && !e.done)
                          .sort((a,b) => (a.time||'').localeCompare(b.time||''));
        setAgenda(todays.slice(0, 3));
      }
      if (tasksListRes.ok) {
        const tsk = await tasksListRes.json() as {id:string, title:string, done:boolean, priority:string}[];
        const pValues: Record<string,number> = { critical:4, high:3, medium:2, low:1 };
        const open = tsk.filter(t => !t.done)
                        .sort((a,b) => (pValues[b.priority] || 0) - (pValues[a.priority] || 0));
        setPendingTasks(open.slice(0, 3));
      }
      if (focusRes.ok) {
        const f = await focusRes.json();
        setFocusStats(f);
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
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <style>{`
        .dash-grid-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; }
        .dash-grid-halves { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .dash-grid-timeline { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
        
        @media (max-width: 900px) {
          .dash-grid-timeline { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .dash-grid-halves { grid-template-columns: 1fr; gap: 16px; }
          .dash-grid-stats { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); }
        }
        @media (max-width: 480px) {
          .dash-grid-stats { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
      {/* Greeting */}
      <div>
        <h2 style={{ fontFamily:'Orbitron,monospace', fontSize:'1.5rem', fontWeight:700, color:text, marginBottom:6, textShadow:`0 0 30px rgba(${accentR},.15)` }}>
          Good {greeting}, {user.firstName}! 👋
        </h2>
        <p style={{ color:text2, fontSize:'.9rem' }}>
          {now.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
        </p>
      </div>

      {/* Live tracker */}
      <div style={{
        display:'flex', alignItems:'center', gap:14, padding:'16px 18px',
        background:`linear-gradient(135deg, rgba(${accentR},.08), rgba(${accentR},.02))`,
        border:`1px solid rgba(${accentR},.2)`,
        borderRadius:10, position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', top:0, left:0, width:20, height:20, borderTop:`2px solid ${accent}`, borderLeft:`2px solid ${accent}`, opacity:.4 }} />
        <span style={{ fontSize:'1.2rem', filter: tracking ? `drop-shadow(0 0 8px ${accent})` : 'none' }}>⏱️</span>
        <input value={trackTask} onChange={e=>setTrackTask(e.target.value)}
          placeholder="What are you working on right now?" disabled={tracking}
          style={{ flex:1, background:'transparent', border:'none', color:text, fontFamily:'inherit', fontSize:'.92rem', outline:'none' }} />
        {tracking && (
          <span style={{ fontFamily:'Orbitron,monospace', fontWeight:700, fontSize:'1.1rem', color:accent, textShadow:`0 0 10px ${accent}` }}>{fmtSecs(trackSecs)}</span>
        )}
        <button onClick={tracking ? stopTimer : startTimer} style={{
          padding:'10px 22px', borderRadius:6, cursor:'pointer', fontFamily:'Orbitron,monospace', fontWeight:600, fontSize:'.75rem', letterSpacing:'.05em',
          background: tracking ? 'rgba(255,60,80,.15)' : accent,
          color: tracking ? '#ff4060' : '#000',
          border: tracking ? '1px solid rgba(255,60,80,.4)' : 'none',
          boxShadow: tracking ? 'none' : `0 0 20px rgba(${accentR},.3)`,
        }}>{tracking ? '⏹ Stop' : '▶ Start'}</button>
      </div>

      {/* Stats grid */}
      <div className="dash-grid-stats">
        {[
          { icon:'⏰', val: summary ? fmtDur(summary.totalMinutes) : '0m',  label:'Tracked Today' },
          { icon:'🍅', val: focusStats.sessions.toString(), label:'Focus Sessions' },
          { icon:'🎯', val: summary ? `${Math.round(summary.focusScore)}%` : '0%', label:'Focus Score' },
          { icon:'✅', val: `${taskStats.done} / ${taskStats.total}`, label:'Tasks Done' },
          { icon:'📊', val: `${weekHours.reduce((a,b)=>a+b,0).toFixed(1)}h`, label:'This Week' },
        ].map((s,i) => (
          <div key={i} style={{
            background: isDark ? 'linear-gradient(145deg, rgba(255,255,255,.04), rgba(255,255,255,.01))' : 'rgba(255,255,255,0.85)',
            border: isDark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(100,130,200,0.18)',
            borderRadius:12, padding:'20px 18px',
            position:'relative', overflow:'hidden',
            boxShadow: isDark ? 'none' : '0 2px 12px rgba(100,130,200,0.09)',
          }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:`linear-gradient(90deg, transparent, rgba(${accentR},.4), transparent)` }} />
            <div style={{ position:'absolute', top:-1, left:-1, width:10, height:10, borderTop:`2px solid ${accent}`, borderLeft:`2px solid ${accent}`, borderTopLeftRadius:8, opacity:.5 }} />
            <div style={{ fontSize:'1.3rem', marginBottom:10 }}>{s.icon}</div>
            <div style={{ fontFamily:'Orbitron,monospace', fontSize:'1.4rem', fontWeight:700, color:accent, marginBottom:4 }}>{s.val}</div>
            <div style={{ fontSize:'.72rem', color:text3, textTransform:'uppercase', letterSpacing:'.08em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Up Next & Priorities Row */}
      <div className="dash-grid-halves">
        {/* Agenda */}
        <Card title="📅 Up Next" accent={accent}>
          {agenda.length === 0 ? (
            <div style={{ color:text3, fontSize:'.85rem', textAlign:'center', padding:'20px 0' }}>No scheduled events remaining today! 🎉</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {agenda.map(e => (
                <div key={e.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:chipBg, border:`1px solid ${chipBdr}`, borderRadius:8 }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', border:`2px solid ${accent}`, background:'transparent' }} />
                  <div style={{ flex:1 }}>
                    <div style={{ color:text, fontSize:'.9rem', fontWeight:600 }}>{e.title}</div>
                    <div style={{ color:text2, fontSize:'.75rem' }}>{e.time ? `${e.time}` : 'Anytime'} • {e.estimatedMins ? `${e.estimatedMins}m` : 'Event'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Priorities */}
        <Card title="🚀 Top Priorities" accent={accent}>
          {pendingTasks.length === 0 ? (
            <div style={{ color:text3, fontSize:'.85rem', textAlign:'center', padding:'20px 0' }}>All caught up on tasks! ✅</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {pendingTasks.map(t => {
                const pColor = t.priority === 'high' ? '#ff4060' : t.priority === 'critical' ? '#e8334a' : t.priority === 'medium' ? '#ffcc00' : '#00ff88';
                return (
                  <div key={t.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:chipBg, border:`1px solid ${chipBdr}`, borderRadius:8 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:pColor, boxShadow:`0 0 6px ${pColor}` }} />
                    <div style={{ flex:1 }}>
                      <div style={{ color:text, fontSize:'.9rem', fontWeight:500 }}>{t.title}</div>
                      <div style={{ color:text3, fontSize:'.7rem', textTransform:'uppercase', marginTop:2 }}>{t.priority}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Timeline + Weekly */}
      <div className="dash-grid-timeline">
        <Card title="📅 Today's Timeline" accent={accent}>
          {entries.length === 0
            ? <p style={{ color:text3, fontSize:'.88rem', textAlign:'center', padding:'24px 0' }}>No entries yet. Start the timer above!</p>
            : <>
                <div style={{ position:'relative', height:36, background:barBg, borderRadius:6, overflow:'hidden', marginBottom:18 }}>
                  {entries.map(e => (
                    <div key={e.id} style={{ position:'absolute', height:'100%', left:`${toP(e.startTime)}%`, width:`${(e.duration/totalM)*100}%`, background:CATEGORY_COLOR[e.category]||'#555', opacity:.85, borderRadius:4 }} title={`${e.task} (${fmtDur(e.duration)})`}/>
                  ))}
                </div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {entries.map(e => (
                    <div key={e.id} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', background:chipBg, borderRadius:6, fontSize:'.8rem', color:text2, border:`1px solid ${chipBdr}` }}>
                      <div style={{ width:8, height:8, borderRadius:3, background:CATEGORY_COLOR[e.category]||'#555' }}/>
                      <span>{e.task}</span>
                      <span style={{ color:text3 }}>{fmtDur(e.duration)}</span>
                    </div>
                  ))}
                </div>
              </>
          }
        </Card>

        <Card title="📊 This Week" accent={accent}>
          <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:100 }}>
            {weekHours.map((h,i) => (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                {h > 0 && <span style={{ fontSize:'.6rem', color:text3, fontWeight:600 }}>{h}h</span>}
                <div style={{
                  width:'100%', height:`${Math.max((h/maxW)*72,h>0?4:2)}px`,
                  borderRadius:'4px 4px 0 0', minHeight:2,
                  background: i===(now.getDay()+6)%7
                    ? `linear-gradient(180deg,${accent},${accent}66)`
                    : isDark ? 'linear-gradient(180deg,rgba(255,255,255,.1),rgba(255,255,255,.02))' : inactiveBr,
                  boxShadow: i===(now.getDay()+6)%7 ? `0 0 12px rgba(${accentR},.3)` : 'none',
                }}/>
                <span style={{ fontSize:'.62rem', color: i===(now.getDay()+6)%7 ? accent : text3, fontWeight: i===(now.getDay()+6)%7 ? 600 : 400 }}>{WEEKDAYS[i]}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop:16, display:'flex', justifyContent:'space-between', fontSize:'.8rem' }}>
            <div><div style={{ color:text3, marginBottom:2 }}>Total</div><div style={{ fontWeight:700, color:text }}>{weekHours.reduce((a,b)=>a+b,0).toFixed(1)}h</div></div>
            <div><div style={{ color:text3, marginBottom:2 }}>Avg/day</div><div style={{ fontWeight:700, color:text }}>{(weekHours.reduce((a,b)=>a+b,0)/7).toFixed(1)}h</div></div>
          </div>
        </Card>
      </div>

      {/* Breakdown */}
      {summary && summary.breakdown.length > 0 && (
        <Card title="🗂️ Today's Breakdown" accent={accent}>
          <div className="dash-grid-halves" style={{ gap: 12 }}>
            {summary.breakdown.map(b => (
              <div key={b.category}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:'.84rem' }}>
                  <span style={{ color:text2, textTransform:'capitalize' }}>{b.category}</span>
                  <span style={{ color:CATEGORY_COLOR[b.category]||'#888', fontWeight:600 }}>{fmtDur(b.minutes)} ({Math.round(b.percentage)}%)</span>
                </div>
                <div style={{ height:8, background:barBg, borderRadius:4, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${b.percentage}%`, background:CATEGORY_COLOR[b.category]||'#888', borderRadius:4, transition:'.6s' }}/>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}