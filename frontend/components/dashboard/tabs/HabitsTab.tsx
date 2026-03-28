'use client';
// components/dashboard/tabs/HabitsTab.tsx
// Habit tracker — add habits, mark complete daily, track streaks.
// Calls: GET/POST/PATCH/DELETE /habits

import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';

interface Habit {
  id: string;
  name: string;
  currentStreak: number;
  bestStreak: number;
  completedDates: string[];
}

const HABIT_ICONS = ['💪','📚','🧘','🏃','💧','🥗','😴','✍️','🎯','🌱','🎵','🧹'];

export function HabitsTab({ accent }: { accent: string }) {
  const [habits,   setHabits]   = useState<Habit[]>([]);
  const [newHabit, setNewHabit] = useState('');
  const [icon,     setIcon]     = useState('💪');
  const [loading,  setLoading]  = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const load = useCallback(async () => {
    try {
      const r = await api('/habits');
      if (r.ok) setHabits(await r.json());
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const addHabit = async () => {
    if (!newHabit.trim()) return;
    setLoading(true);
    try {
      await api('/habits', {
        method: 'POST',
        body: JSON.stringify({ name: `${icon} ${newHabit.trim()}` }),
      });
      setNewHabit(''); load();
    } catch {} finally { setLoading(false); }
  };

  const complete = async (id: string) => {
    try {
      await api(`/habits/${id}/complete`, { method: 'PATCH', body: JSON.stringify(today) });
      load();
    } catch {}
  };

  const del = async (id: string) => {
    try { await api(`/habits/${id}`, { method: 'DELETE' }); load(); } catch {}
  };

  const isDoneToday = (h: Habit) =>
    h.completedDates?.includes(today);

  // Last 7 days for mini calendar
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  const completedToday = habits.filter(isDoneToday).length;
  const totalHabits    = habits.length;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
        {[
          { icon:'✅', val:`${completedToday}/${totalHabits}`, label:'Done Today' },
          { icon:'🔥', val: totalHabits > 0 ? `${Math.max(...habits.map(h=>h.currentStreak))}d` : '0d', label:'Longest Streak' },
          { icon:'🏆', val: totalHabits > 0 ? `${Math.max(...habits.map(h=>h.bestStreak))}d` : '0d', label:'Best Ever' },
        ].map((s,i) => (
          <div key={i} style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:8, padding:'16px' }}>
            <div style={{ fontSize:'1.2rem', marginBottom:6 }}>{s.icon}</div>
            <div style={{ fontFamily:'Orbitron,monospace', fontSize:'1.3rem', fontWeight:700, color:accent }}>{s.val}</div>
            <div style={{ fontSize:'.72rem', color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:'.08em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add habit */}
      <div style={{ background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.07)', borderRadius:8, padding:18 }}>
        <div style={{ fontSize:'.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.12em', color:'rgba(255,255,255,.35)', marginBottom:12 }}>➕ Add New Habit</div>
        {/* Icon picker */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
          {HABIT_ICONS.map(ic => (
            <button key={ic} onClick={() => setIcon(ic)} style={{ width:36, height:36, borderRadius:8, border:`1.5px solid ${icon===ic?accent:'rgba(255,255,255,.1)'}`, background:icon===ic?`${accent}22`:'transparent', cursor:'pointer', fontSize:'1.1rem' }}>{ic}</button>
          ))}
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <input
            value={newHabit}
            onChange={e => setNewHabit(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addHabit()}
            placeholder="e.g. Drink 8 glasses of water"
            style={{ flex:1, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.09)', borderRadius:4, padding:'11px 14px', color:'#fff', fontFamily:'inherit', fontSize:'.9rem', outline:'none' }}
          />
          <button onClick={addHabit} disabled={loading} style={{ padding:'11px 22px', background:accent, border:'none', borderRadius:4, color:'#000', fontWeight:700, cursor:'pointer' }}>Add</button>
        </div>
      </div>

      {/* Habits list */}
      {habits.length === 0 ? (
        <p style={{ color:'rgba(255,255,255,.3)', textAlign:'center', padding:40, fontSize:'.9rem' }}>
          No habits yet. Add one above to start building your routine! 🌱
        </p>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {habits.map(h => {
            const done = isDoneToday(h);
            return (
              <div key={h.id} style={{ background:'rgba(255,255,255,.025)', border:`1px solid ${done ? accent+'44' : 'rgba(255,255,255,.07)'}`, borderRadius:8, padding:16, transition:'.2s' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                  {/* Complete button */}
                  <button
                    onClick={() => !done && complete(h.id)}
                    style={{ width:32, height:32, borderRadius:'50%', border:`2px solid ${done?accent:'rgba(255,255,255,.2)'}`, background:done?accent:'transparent', cursor:done?'default':'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'.2s' }}
                  >
                    {done && <svg width="12" height="12" viewBox="0 0 10 10"><polyline points="1,5 4,8 9,2" stroke="#000" strokeWidth="2.5" fill="none"/></svg>}
                  </button>
                  <span style={{ flex:1, fontSize:'1rem', fontWeight:600, color: done ? accent : '#fff' }}>{h.name}</span>
                  {/* Streak badges */}
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{ fontSize:'.78rem', color:'rgba(255,255,255,.5)', padding:'3px 10px', borderRadius:20, background:'rgba(255,255,255,.06)' }}>🔥 {h.currentStreak}d</span>
                    <span style={{ fontSize:'.78rem', color:'rgba(255,255,255,.35)', padding:'3px 10px', borderRadius:20, background:'rgba(255,255,255,.04)' }}>🏆 {h.bestStreak}d</span>
                  </div>
                  <button onClick={() => del(h.id)} style={{ background:'none', border:'none', color:'rgba(255,255,255,.2)', cursor:'pointer', fontSize:'1rem', padding:'0 4px' }}>✕</button>
                </div>

                {/* 7-day mini calendar */}
                <div style={{ display:'flex', gap:5 }}>
                  {last7.map(date => {
                    const completed = h.completedDates?.includes(date);
                    const isToday   = date === today;
                    return (
                      <div key={date} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                        <div style={{ width:'100%', height:28, borderRadius:5, background:completed?accent:isToday?'rgba(255,255,255,.08)':'rgba(255,255,255,.04)', border:isToday?`1px solid ${accent}55`:'1px solid transparent', display:'flex', alignItems:'center', justifyContent:'center', transition:'.2s' }}>
                          {completed && <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1,5 4,8 9,2" stroke="#000" strokeWidth="2" fill="none"/></svg>}
                        </div>
                        <span style={{ fontSize:'.55rem', color:'rgba(255,255,255,.3)' }}>
                          {new Date(date+'T00:00').toLocaleDateString('en',{weekday:'narrow'})}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Daily progress bar */}
      {habits.length > 0 && (
        <div style={{ background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.07)', borderRadius:8, padding:18 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10, fontSize:'.85rem' }}>
            <span style={{ color:'rgba(255,255,255,.5)' }}>Today's Progress</span>
            <span style={{ color:accent, fontWeight:700 }}>{completedToday}/{totalHabits} habits</span>
          </div>
          <div style={{ height:10, background:'rgba(255,255,255,.06)', borderRadius:5, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${totalHabits>0?(completedToday/totalHabits)*100:0}%`, background:`linear-gradient(90deg,${accent},${accent}cc)`, borderRadius:5, transition:'.5s', boxShadow:`0 0 10px ${accent}66` }}/>
          </div>
          {completedToday === totalHabits && totalHabits > 0 && (
            <p style={{ textAlign:'center', color:accent, marginTop:10, fontSize:'.9rem', fontWeight:600 }}>🎉 All habits done today! Amazing!</p>
          )}
        </div>
      )}
    </div>
  );
}