'use client';
// components/dashboard/tabs/TimeTrackerTab.tsx

import { useState, useEffect, useRef, useCallback } from 'react';
import { TimeEntry, DailySummary } from '../../../types';
import { api } from '../../../lib/api';
import { CATEGORY_COLOR, fmtDur, fmtSecs } from '../../../lib/constants';
import Card from '../Card';

const CATEGORIES = ['work','study','meeting','break','personal'];
const inputStyle: React.CSSProperties = { background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.09)', borderRadius:4, padding:'10px 12px', color:'#fff', fontFamily:'inherit', fontSize:'.88rem', outline:'none', width:'100%', boxSizing:'border-box' };

export default function TimeTrackerTab({ accent }: { accent: string }) {
  const [entries,  setEntries]  = useState<TimeEntry[]>([]);
  const [summary,  setSummary]  = useState<DailySummary | null>(null);
  const [running,  setRunning]  = useState(false);
  const [secs,     setSecs]     = useState(0);
  const [task,     setTask]     = useState('');
  const [category, setCategory] = useState('work');
  const [activeId, setActiveId] = useState<string|null>(null);
  const [showAdd,  setShowAdd]  = useState(false);
  const [newE, setNewE] = useState({ task:'', start:'', end:'', category:'work' });
  const [loading,  setLoading]  = useState(false);
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
    const [sh,sm]=newE.start.split(':').map(Number), [eh,em]=newE.end.split(':').map(Number);
    const dur=(eh*60+em)-(sh*60+sm); if (dur<=0) return;
    setLoading(true);
    try {
      await api('/time-entries', { method:'POST', body:JSON.stringify({ task:newE.task, startTime:newE.start, endTime:newE.end, duration:dur, category:newE.category }) });
      setNewE({ task:'', start:'', end:'', category:'work' }); setShowAdd(false); load();
    } catch {} finally { setLoading(false); }
  };

  const deleteEntry = async (id: string) => {
    try { await api(`/time-entries/${id}`, { method:'DELETE' }); load(); } catch {}
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Live Timer */}
      <Card title="⏱ Live Timer">
        <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
          <input value={task} onChange={e=>setTask(e.target.value)} placeholder="What are you working on?" disabled={running} style={{ ...inputStyle, flex:2, minWidth:200 }}/>
          <select value={category} onChange={e=>setCategory(e.target.value)} disabled={running} style={{ ...inputStyle, flex:1, minWidth:120, appearance:'none' }}>
            {CATEGORIES.map(c=><option key={c} value={c} style={{background:'#0a1020'}}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
          </select>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ fontFamily:'monospace', fontSize:'2.5rem', fontWeight:700, color:accent }}>{fmtSecs(secs)}</div>
          <button onClick={running?stopTimer:startTimer} disabled={loading} style={{ padding:'12px 28px', borderRadius:4, cursor:'pointer', fontWeight:700, fontSize:'.9rem', border:running?'1px solid rgba(255,60,80,.4)':'none', background:running?'rgba(255,60,80,.15)':accent, color:running?'#ff4060':'#000', opacity:loading?.6:1 }}>
            {running ? '⏹ Stop & Save' : '▶ Start Timer'}
          </button>
        </div>
      </Card>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <span style={{ fontSize:'1rem', fontWeight:600, color:'#fff' }}>Today's Entries</span>
          {summary && <span style={{ marginLeft:10, fontSize:'.82rem', color:'rgba(255,255,255,.35)' }}>Total: <b style={{color:accent}}>{fmtDur(summary.totalMinutes)}</b> · Score: <b style={{color:accent}}>{Math.round(summary.focusScore)}%</b></span>}
        </div>
        <button onClick={()=>setShowAdd(v=>!v)} style={{ padding:'8px 16px', background:accent, border:'none', borderRadius:4, color:'#000', fontWeight:700, fontSize:'.82rem', cursor:'pointer' }}>+ Manual Entry</button>
      </div>

      {showAdd && (
        <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.09)', borderRadius:8, padding:16, display:'flex', gap:10, flexWrap:'wrap', alignItems:'flex-end' }}>
          {[
            { label:'Task',     node:<input value={newE.task}  onChange={e=>setNewE(p=>({...p,task:e.target.value}))}  placeholder="Task name" style={inputStyle}/> },
            { label:'Start',    node:<input type="time" value={newE.start} onChange={e=>setNewE(p=>({...p,start:e.target.value}))} style={{...inputStyle,colorScheme:'dark'}}/> },
            { label:'End',      node:<input type="time" value={newE.end}   onChange={e=>setNewE(p=>({...p,end:e.target.value}))}   style={{...inputStyle,colorScheme:'dark'}}/> },
            { label:'Category', node:<select value={newE.category} onChange={e=>setNewE(p=>({...p,category:e.target.value}))} style={{...inputStyle,appearance:'none' as any}}>{CATEGORIES.map(c=><option key={c} value={c} style={{background:'#0a1020'}}>{c}</option>)}</select> },
          ].map(({label,node},i) => (
            <div key={i} style={{ flex:1, minWidth:110 }}>
              <div style={{ fontSize:'.67rem', color:'rgba(255,255,255,.35)', marginBottom:5, textTransform:'uppercase', letterSpacing:'.08em' }}>{label}</div>
              {node}
            </div>
          ))}
          <button onClick={addManual} disabled={loading} style={{ padding:'10px 20px', background:accent, border:'none', borderRadius:4, color:'#000', fontWeight:700, cursor:'pointer' }}>Save</button>
        </div>
      )}

      {entries.length === 0
        ? <p style={{ color:'rgba(255,255,255,.3)', textAlign:'center', padding:30 }}>No entries today. Start the timer or add a manual entry!</p>
        : entries.map(e => (
          <div key={e.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.06)', borderRadius:6 }}>
            <div style={{ width:10, height:10, borderRadius:2, background:CATEGORY_COLOR[e.category]||'#555', flexShrink:0 }}/>
            <span style={{ flex:1, color:'#fff', fontSize:'.9rem' }}>{e.task}</span>
            {e.startTime && <span style={{ fontSize:'.78rem', color:'rgba(255,255,255,.4)' }}>{e.startTime}{e.endTime?` – ${e.endTime}`:''}</span>}
            <span style={{ fontSize:'.82rem', fontWeight:600, color:accent }}>{fmtDur(e.duration||0)}</span>
            <span style={{ fontSize:'.72rem', padding:'2px 8px', borderRadius:20, background:`${CATEGORY_COLOR[e.category]||'#555'}22`, color:CATEGORY_COLOR[e.category]||'#888' }}>{e.category}</span>
            <button onClick={()=>deleteEntry(e.id)} style={{ background:'none', border:'none', color:'rgba(255,255,255,.25)', cursor:'pointer', fontSize:'1rem' }}>✕</button>
          </div>
        ))
      }

      {summary && summary.breakdown.length > 0 && (
        <Card title="Category Breakdown">
          {summary.breakdown.map(b => (
            <div key={b.category} style={{ marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:'.82rem' }}>
                <span style={{ color:'rgba(255,255,255,.6)', textTransform:'capitalize' }}>{b.category}</span>
                <span style={{ color:CATEGORY_COLOR[b.category]||'#888' }}>{fmtDur(b.minutes)} ({Math.round(b.percentage)}%)</span>
              </div>
              <div style={{ height:6, background:'rgba(255,255,255,.06)', borderRadius:3 }}>
                <div style={{ height:'100%', width:`${b.percentage}%`, background:CATEGORY_COLOR[b.category]||'#888', borderRadius:3, transition:'.5s' }}/>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
