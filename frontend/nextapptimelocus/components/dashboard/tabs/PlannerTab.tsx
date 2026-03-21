'use client';
// components/dashboard/tabs/PlannerTab.tsx

import { useState, useEffect, useCallback } from 'react';
import { PlannerEvent } from '../../../types';
import { api } from '../../../lib/api';
import { PLANNER_TYPE_COLOR } from '../../../lib/constants';

const inputStyle: React.CSSProperties = { background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.09)', borderRadius:4, padding:'10px 12px', color:'#fff', fontFamily:'inherit', fontSize:'.88rem', outline:'none', width:'100%', boxSizing:'border-box' };

export default function PlannerTab({ accent, label }: { accent: string; label: string }) {
  const [events,  setEvents]  = useState<PlannerEvent[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newEv, setNewEv] = useState({ title:'', date:'', time:'', eventType:'work', description:'' });

  const load = useCallback(async () => {
    try { const r = await api('/planner'); if (r.ok) setEvents(await r.json()); } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!newEv.title.trim() || !newEv.date) return;
    setLoading(true);
    try { await api('/planner', { method:'POST', body:JSON.stringify(newEv) }); setNewEv({ title:'', date:'', time:'', eventType:'work', description:'' }); setShowAdd(false); load(); }
    catch {} finally { setLoading(false); }
  };

  const toggle = async (id: string) => { try { await api(`/planner/${id}/toggle`, { method:'PATCH' }); load(); } catch {} };
  const del    = async (id: string) => { try { await api(`/planner/${id}`, { method:'DELETE' }); load(); } catch {} };

  const today     = new Date().toISOString().slice(0,10);
  const todayEvs  = events.filter(e => e.date === today);
  const futureEvs = events.filter(e => e.date >  today);
  const pastEvs   = events.filter(e => e.date <  today);

  const EventRow = ({ e }: { e: PlannerEvent }) => (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'rgba(255,255,255,.025)', border:`1px solid ${(PLANNER_TYPE_COLOR[e.eventType]||'rgba(255,255,255,.06)')}33`, borderRadius:6, opacity:e.done?.6:1, marginBottom:6 }}>
      <div onClick={()=>toggle(e.id)} style={{ width:18, height:18, borderRadius:4, border:`1.5px solid ${e.done?accent:'rgba(255,255,255,.2)'}`, background:e.done?accent:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        {e.done && <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1,5 4,8 9,2" stroke="#000" strokeWidth="2" fill="none"/></svg>}
      </div>
      <span style={{ flex:1, color:e.done?'rgba(255,255,255,.4)':'#fff', fontSize:'.9rem', textDecoration:e.done?'line-through':'none' }}>{e.title}</span>
      {e.date !== today && <span style={{ fontSize:'.75rem', color:'rgba(255,255,255,.4)' }}>{new Date(e.date+'T00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>}
      {e.time && <span style={{ fontSize:'.75rem', color:'rgba(255,255,255,.35)' }}>{e.time}</span>}
      <span style={{ fontSize:'.7rem', padding:'2px 8px', borderRadius:20, background:`${PLANNER_TYPE_COLOR[e.eventType]||'#555'}22`, color:PLANNER_TYPE_COLOR[e.eventType]||'#888' }}>{e.eventType}</span>
      <button onClick={()=>del(e.id)} style={{ background:'none', border:'none', color:'rgba(255,255,255,.25)', cursor:'pointer' }}>✕</button>
    </div>
  );

  const Section = ({ title, items }: { title: string; items: PlannerEvent[] }) => (
    <>
      <div style={{ fontSize:'.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.12em', color:'rgba(255,255,255,.35)', marginBottom:8, marginTop:12 }}>{title}</div>
      {items.map(e => <EventRow key={e.id} e={e} />)}
    </>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <h3 style={{ color:'#fff', fontFamily:'Orbitron,monospace', fontSize:'1rem', marginBottom:4 }}>{label}</h3>
          <p style={{ color:'rgba(255,255,255,.35)', fontSize:'.85rem' }}>{todayEvs.length} today · {futureEvs.length} upcoming</p>
        </div>
        <button onClick={()=>setShowAdd(v=>!v)} style={{ padding:'9px 18px', background:accent, border:'none', borderRadius:4, color:'#000', fontWeight:700, fontSize:'.84rem', cursor:'pointer' }}>+ Add Event</button>
      </div>

      {showAdd && (
        <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.09)', borderRadius:8, padding:16, display:'flex', flexDirection:'column', gap:10, marginBottom:12 }}>
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
      {todayEvs.length  > 0 && <Section title="Today"    items={todayEvs} />}
      {futureEvs.length > 0 && <Section title="Upcoming" items={futureEvs} />}
      {pastEvs.length   > 0 && <Section title="Past"     items={pastEvs} />}
    </div>
  );
}
