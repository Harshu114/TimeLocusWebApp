'use client';
// components/dashboard/tabs/TasksTab.tsx

import { useState, useEffect, useCallback } from 'react';
import { Task } from '../../../types';
import { api } from '../../../lib/api';
import { accentRgb } from '../../../lib/constants';

const PRIORITY_COLOR: Record<string, string> = {
  high: '#ff4060', medium: '#ffcc00', low: '#00ff88'
};

export function TasksTab({ accent }: { accent: string }) {
  const accentR = accentRgb(accent);
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
      await api('/tasks', {
        method: 'POST',
        body: JSON.stringify({ title: newTask, priority }),
      });
      setNewTask('');
      load();
    } catch {}
  };

  const toggle = async (id: string) => {
    try { await api(`/tasks/${id}/toggle`, { method: 'PATCH' }); load(); } catch {}
  };

  const del = async (id: string) => {
    try { await api(`/tasks/${id}`, { method: 'DELETE' }); load(); } catch {}
  };

  const pending   = tasks.filter(t => !t.done);
  const completed = tasks.filter(t =>  t.done);

  const TaskRow = ({ t, done }: { t: Task; done: boolean }) => (
    <div style={{
      display:'flex', alignItems:'center', gap:12, padding:'14px 18px',
      background:'linear-gradient(145deg, rgba(255,255,255,.03), rgba(255,255,255,.01))',
      border: done ? '1px solid rgba(255,255,255,.05)' : `1px solid rgba(${accentR},.1)`,
      borderRadius:8, opacity:done ? .55 : 1, marginBottom:8,
      transition:'transform .15s, box-shadow .15s',
    }}>
      <div
        onClick={() => toggle(t.id)}
        style={{
          width:22, height:22, borderRadius:5,
          border: `2px solid ${done ? accent : 'rgba(255,255,255,.2)'}`,
          background: done ? accent : 'transparent',
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
          boxShadow: done ? `0 0 10px rgba(${accentR},.4)` : 'none',
          transition: 'all .2s',
        }}
      >
        {done && (
          <svg width="12" height="12" viewBox="0 0 10 10">
            <polyline points="1,5 4,8 9,2" stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round"/>
          </svg>
        )}
      </div>
      <span style={{ flex:1, color: done ? 'rgba(255,255,255,.4)' : '#fff', fontSize:'.92rem', textDecoration: done ? 'line-through' : 'none' }}>{t.title}</span>
      {!done && (
        <>
          <div style={{
            width:10, height:10, borderRadius:'50%',
            background: PRIORITY_COLOR[t.priority] || '#888',
            boxShadow: `0 0 8px ${PRIORITY_COLOR[t.priority] || '#888'}`,
          }}/>
          <span style={{
            fontSize:'.72rem', color:'rgba(255,255,255,.4)', textTransform:'capitalize',
            padding:'4px 10px', background:'rgba(255,255,255,.04)', borderRadius:4, fontWeight:500,
          }}>{t.priority}</span>
        </>
      )}
      <button onClick={() => del(t.id)} style={{
        background:'none', border:'none', color:'rgba(255,255,255,.2)', cursor:'pointer', fontSize:'1rem',
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
            flex:1, background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.08)',
            borderRadius:8, padding:'14px 16px', color:'#fff', fontFamily:'inherit', fontSize:'.92rem', outline:'none',
            transition: 'border-color .2s, box-shadow .2s',
          }}
        />
        <select
          value={priority}
          onChange={e => setPriority(e.target.value)}
          style={{
            background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.08)',
            borderRadius:8, padding:'14px', color:'#fff', fontFamily:'inherit', fontSize:'.86rem', outline:'none',
            cursor:'pointer',
          }}
        >
          <option value="high"   style={{ background:'#0a1020' }}>🔴 High</option>
          <option value="medium" style={{ background:'#0a1020' }}>🟡 Medium</option>
          <option value="low"    style={{ background:'#0a1020' }}>🟢 Low</option>
        </select>
        <button
          onClick={add}
          style={{
            padding:'14px 24px', background: accent, border:'none', borderRadius:8, color:'#000', fontWeight:700, cursor:'pointer',
            fontFamily:'Orbitron,monospace', fontSize:'.75rem', letterSpacing:'.05em',
            boxShadow:`0 0 15px rgba(${accentR},.3)`,
          }}
        >+ Add</button>
      </div>

      {tasks.length === 0 && (
        <p style={{ color:'rgba(255,255,255,.3)', textAlign:'center', padding:50, fontSize:'.9rem' }}>No tasks yet. Add one above!</p>
      )}

      {pending.length > 0 && (
        <>
          <div style={{
            fontSize:'.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.12em',
            color:`rgba(${accentR},.7)`, marginTop:8,
            display:'flex', alignItems:'center', gap:8,
          }}>
            <div style={{ width:8, height:8, borderRadius:2, background:accent }} />
            Pending ({pending.length})
          </div>
          {pending.map(t => <TaskRow key={t.id} t={t} done={false} />)}
        </>
      )}

      {completed.length > 0 && (
        <>
          <div style={{
            fontSize:'.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.12em',
            color:'rgba(255,255,255,.25)', marginTop:12,
            display:'flex', alignItems:'center', gap:8,
          }}>
            <div style={{ width:8, height:8, borderRadius:2, background:'rgba(255,255,255,.2)' }} />
            Completed ({completed.length})
          </div>
          {completed.map(t => <TaskRow key={t.id} t={t} done={true} />)}
        </>
      )}
    </div>
  );
}