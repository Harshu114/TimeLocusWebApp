'use client';
// components/dashboard/tabs/TasksTab.tsx

import { useState, useEffect, useCallback } from 'react';
import { Task } from '../../../types';
import { api } from '../../../lib/api';
import { accentRgb } from '../../../lib/constants';
import { useTheme } from '../../../lib/ThemeContext';

const PRIORITY_COLOR: Record<string, string> = {
  high: '#ff4060', medium: '#ffcc00', low: '#00ff88'
};

export function TasksTab({ accent }: { accent: string }) {
  const { isDark } = useTheme();
  const accentR = accentRgb(accent);

  // Theme tokens
  const t      = isDark ? '#fff'                    : '#1a2340';
  const t3     = isDark ? 'rgba(255,255,255,.3)'    : '#8090b0';
  const t4     = isDark ? 'rgba(255,255,255,.4)'    : '#6a7a9a';
  const sf     = isDark ? 'rgba(255,255,255,.03)'   : 'rgba(255,255,255,0.9)';
  const sf2    = isDark ? 'rgba(255,255,255,.01)'   : 'rgba(255,255,255,0.7)';
  const br     = isDark ? 'rgba(255,255,255,.08)'   : 'rgba(100,130,200,.18)';
  const br2    = isDark ? 'rgba(255,255,255,.05)'   : 'rgba(100,130,200,.1)';
  const ib     = isDark ? 'rgba(255,255,255,.03)'   : 'rgba(255,255,255,0.95)';
  const id     = isDark ? 'rgba(255,255,255,.08)'   : 'rgba(100,130,200,.2)';
  const id2    = isDark ? 'rgba(255,255,255,.2)'    : 'rgba(100,130,200,.3)';
  const chipBg = isDark ? 'rgba(255,255,255,.04)'   : 'rgba(100,130,200,.06)';
  const delClr = isDark ? 'rgba(255,255,255,.2)'    : 'rgba(100,130,200,.35)';
  const optBg  = isDark ? '#0a1020'                 : '#fff';
  const sh     = isDark ? 'none'                    : '0 1px 8px rgba(100,130,200,.08)';

  const [tasks,    setTasks]    = useState<Task[]>([]);
  const [newTask,  setNewTask]  = useState('');
  const [priority, setPriority] = useState('medium');

  const load = useCallback(async () => {
    try {
      const r = await api('/tasks');
      if (r.ok) setTasks(await r.json());
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!newTask.trim()) return;
    try {
      await api('/tasks', { method: 'POST', body: JSON.stringify({ title: newTask, priority }) });
      setNewTask(''); load();
    } catch {}
  };

  const toggle = async (id: string) => {
    try { await api(`/tasks/${id}/toggle`, { method: 'PATCH' }); load(); } catch {}
  };

  const del = async (id: string) => {
    try { await api(`/tasks/${id}`, { method: 'DELETE' }); load(); } catch {}
  };

  const pending   = tasks.filter(tk => !tk.done);
  const completed = tasks.filter(tk =>  tk.done);

  const TaskRow = ({ t: task, done }: { t: Task; done: boolean }) => (
    <div style={{
      display:'flex', alignItems:'center', gap:12, padding:'14px 18px',
      background: `linear-gradient(145deg, ${sf}, ${sf2})`,
      border: done ? `1px solid ${br2}` : `1px solid rgba(${accentR},.12)`,
      borderRadius:8, opacity: done ? .6 : 1, marginBottom:8,
      transition:'transform .15s, box-shadow .15s', boxShadow: sh,
    }}>
      <div
        onClick={() => toggle(task.id)}
        style={{
          width:22, height:22, borderRadius:5,
          border: `2px solid ${done ? accent : id2}`,
          background: done ? accent : 'transparent',
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
          boxShadow: done ? `0 0 10px rgba(${accentR},.4)` : 'none',
          transition: 'all .2s',
        }}
      >
        {done && (
          <svg width="12" height="12" viewBox="0 0 10 10">
            <polyline points="1,5 4,8 9,2" stroke={isDark ? '#000' : '#fff'} strokeWidth="2" fill="none" strokeLinecap="round"/>
          </svg>
        )}
      </div>
      <span style={{ flex:1, color: done ? t3 : t, fontSize:'.92rem', textDecoration: done ? 'line-through' : 'none' }}>{task.title}</span>
      {!done && (
        <>
          <div style={{
            width:10, height:10, borderRadius:'50%',
            background: PRIORITY_COLOR[task.priority] || '#888',
            boxShadow: `0 0 8px ${PRIORITY_COLOR[task.priority] || '#888'}`,
          }}/>
          <span style={{
            fontSize:'.72rem', color: t4, textTransform:'capitalize',
            padding:'4px 10px', background: chipBg, borderRadius:4, fontWeight:500,
            border: `1px solid ${br}`,
          }}>{task.priority}</span>
        </>
      )}
      <button onClick={() => del(task.id)} style={{
        background:'none', border:'none', color: delClr, cursor:'pointer', fontSize:'1rem',
        padding:'4px', transition:'.2s',
      }}>✕</button>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Add task row */}
      <div style={{ display:'flex', gap:10 }}>
        <input
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="Add a new task..."
          style={{
            flex:1, background: ib, border:`1px solid ${id}`,
            borderRadius:8, padding:'14px 16px', color: t, fontFamily:'inherit', fontSize:'.92rem', outline:'none',
            transition: 'border-color .2s, box-shadow .2s',
          }}
        />
        <select
          value={priority}
          onChange={e => setPriority(e.target.value)}
          style={{
            background: ib, border:`1px solid ${id}`,
            borderRadius:8, padding:'14px', color: t, fontFamily:'inherit', fontSize:'.86rem', outline:'none',
            cursor:'pointer',
          }}
        >
          <option value="high"   style={{ background: optBg }}>🔴 High</option>
          <option value="medium" style={{ background: optBg }}>🟡 Medium</option>
          <option value="low"    style={{ background: optBg }}>🟢 Low</option>
        </select>
        <button
          onClick={add}
          style={{
            padding:'14px 24px', background: accent, border:'none', borderRadius:8, color:'#000', fontWeight:700, cursor:'pointer',
            fontFamily:"'DM Sans', sans-serif", fontSize:'.75rem', letterSpacing:'.05em',
            boxShadow:`0 0 15px rgba(${accentR},.3)`,
          }}
        >+ Add</button>
      </div>

      {tasks.length === 0 && (
        <p style={{ color: t3, textAlign:'center', padding:50, fontSize:'.9rem' }}>No tasks yet. Add one above!</p>
      )}

      {pending.length > 0 && (
        <>
          <div style={{
            fontSize:'.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.12em',
            color:`rgba(${accentR},.8)`, marginTop:8,
            display:'flex', alignItems:'center', gap:8,
          }}>
            <div style={{ width:8, height:8, borderRadius:2, background:accent }} />
            Pending ({pending.length})
          </div>
          {pending.map(tk => <TaskRow key={tk.id} t={tk} done={false} />)}
        </>
      )}

      {completed.length > 0 && (
        <>
          <div style={{
            fontSize:'.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.12em',
            color: t3, marginTop:12,
            display:'flex', alignItems:'center', gap:8,
          }}>
            <div style={{ width:8, height:8, borderRadius:2, background: isDark ? 'rgba(255,255,255,.2)' : 'rgba(100,130,200,.3)' }} />
            Completed ({completed.length})
          </div>
          {completed.map(tk => <TaskRow key={tk.id} t={tk} done={true} />)}
        </>
      )}
    </div>
  );
}