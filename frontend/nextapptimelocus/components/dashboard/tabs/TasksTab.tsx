'use client';
// components/dashboard/tabs/TasksTab.tsx

import { useState, useEffect, useCallback } from 'react';
import { Task } from '../../../types';
import { api } from '../../../lib/api';

const PRIORITY_COLOR: Record<string, string> = {
  high: '#ff4060', medium: '#ffcc00', low: '#00ff88'
};

export function TasksTab({ accent }: { accent: string }) {
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
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.06)', borderRadius:6, opacity:done ? .6 : 1, marginBottom:6 }}>
      <div
        onClick={() => toggle(t.id)}
        style={{ width:18, height:18, borderRadius:4, border:`1.5px solid ${done ? accent : 'rgba(255,255,255,.2)'}`, background: done ? accent : 'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
      >
        {done && (
          <svg width="10" height="10" viewBox="0 0 10 10">
            <polyline points="1,5 4,8 9,2" stroke="#000" strokeWidth="2" fill="none"/>
          </svg>
        )}
      </div>
      <span style={{ flex:1, color: done ? 'rgba(255,255,255,.4)' : '#fff', fontSize:'.9rem', textDecoration: done ? 'line-through' : 'none' }}>{t.title}</span>
      {!done && (
        <div style={{ width:8, height:8, borderRadius:'50%', background: PRIORITY_COLOR[t.priority] || '#888', boxShadow:`0 0 6px ${PRIORITY_COLOR[t.priority] || '#888'}` }}/>
      )}
      {!done && (
        <span style={{ fontSize:'.72rem', color:'rgba(255,255,255,.3)', textTransform:'capitalize' }}>{t.priority}</span>
      )}
      <button onClick={() => del(t.id)} style={{ background:'none', border:'none', color:'rgba(255,255,255,.25)', cursor:'pointer' }}>✕</button>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {/* Add task row */}
      <div style={{ display:'flex', gap:8 }}>
        <input
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="Add a new task..."
          style={{ flex:1, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.09)', borderRadius:4, padding:'12px 14px', color:'#fff', fontFamily:'inherit', fontSize:'.9rem', outline:'none' }}
        />
        <select
          value={priority}
          onChange={e => setPriority(e.target.value)}
          style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.09)', borderRadius:4, padding:'12px', color:'#fff', fontFamily:'inherit', fontSize:'.84rem', outline:'none' }}
        >
          <option value="high"   style={{ background:'#0a1020' }}>🔴 High</option>
          <option value="medium" style={{ background:'#0a1020' }}>🟡 Medium</option>
          <option value="low"    style={{ background:'#0a1020' }}>🟢 Low</option>
        </select>
        <button
          onClick={add}
          style={{ padding:'12px 20px', background:accent, border:'none', borderRadius:4, color:'#000', fontWeight:700, cursor:'pointer' }}
        >+ Add</button>
      </div>

      {tasks.length === 0 && (
        <p style={{ color:'rgba(255,255,255,.3)', textAlign:'center', padding:40 }}>No tasks yet. Add one above!</p>
      )}

      {pending.length > 0 && (
        <>
          <div style={{ fontSize:'.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.12em', color:'rgba(255,255,255,.35)', marginTop:4 }}>
            Pending ({pending.length})
          </div>
          {pending.map(t => <TaskRow key={t.id} t={t} done={false} />)}
        </>
      )}

      {completed.length > 0 && (
        <>
          <div style={{ fontSize:'.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.12em', color:'rgba(255,255,255,.2)', marginTop:8 }}>
            Completed ({completed.length})
          </div>
          {completed.map(t => <TaskRow key={t.id} t={t} done={true} />)}
        </>
      )}
    </div>
  );
}