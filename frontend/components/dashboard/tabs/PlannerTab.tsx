'use client';
// components/dashboard/tabs/PlannerTab.tsx
// Full planning suite: calendar view, events with subtasks, priorities,
// notes, time estimates, tags — all theme-aware.

import { useState, useEffect, useCallback } from 'react';
import { PlannerEvent } from '../../../types';
import { api } from '../../../lib/api';
import { PLANNER_TYPE_COLOR } from '../../../lib/constants';
import { useTheme } from '../../../lib/ThemeContext';

interface SubTask { id: string; text: string; done: boolean; }
interface RichEvent extends PlannerEvent {
  priority?: 'low' | 'medium' | 'high' | 'critical';
  subtasks?: SubTask[];
  notes?: string;
  estimatedMins?: number;
  tags?: string[];
}

const PRI = {
  low:      { label:'Low',      color:'#00ff88', bg:'rgba(0,255,136,0.12)' },
  medium:   { label:'Medium',   color:'#ffcc00', bg:'rgba(255,204,0,0.12)' },
  high:     { label:'High',     color:'#ff6b35', bg:'rgba(255,107,53,0.12)' },
  critical: { label:'Critical', color:'#ff4060', bg:'rgba(255,64,96,0.12)' },
};

const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const todayISO = () => new Date().toISOString().slice(0,10);

export default function PlannerTab({ accent, label }: { accent: string; label: string }) {
  const { isDark } = useTheme();
  const [events,      setEvents]      = useState<RichEvent[]>([]);
  const [view,        setView]        = useState<'calendar'|'list'>('calendar');
  const [calDate,     setCalDate]     = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(todayISO());
  const [showAdd,     setShowAdd]     = useState(false);
  const [expanded,    setExpanded]    = useState<string|null>(null);
  const [loading,     setLoading]     = useState(false);
  const [newSubtask,  setNewSubtask]  = useState('');
  const [newTag,      setNewTag]      = useState('');

  const blankEv = { title:'', date:todayISO(), time:'', eventType:'work', description:'', priority:'medium' as const, subtasks:[] as SubTask[], notes:'', estimatedMins:30, tags:[] as string[] };
  const [newEv, setNewEv] = useState({ ...blankEv });

  // Theme tokens
  const text    = isDark ? '#fff'                  : '#1a2340';
  const text2   = isDark ? 'rgba(255,255,255,.55)' : '#4a5680';
  const text3   = isDark ? 'rgba(255,255,255,.3)'  : '#8090b0';
  const surface = isDark ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,0.90)';
  const border  = isDark ? 'rgba(255,255,255,.08)' : 'rgba(100,130,200,0.18)';
  const surface2= isDark ? 'rgba(255,255,255,.05)' : 'rgba(100,130,200,0.07)';
  const inputBg = isDark ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,0.95)';
  const inputBdr= isDark ? 'rgba(255,255,255,.10)' : 'rgba(100,130,200,0.28)';
  const shadow  = isDark ? 'none' : '0 2px 16px rgba(100,130,200,0.10)';

  const inp: React.CSSProperties = { background:inputBg, border:`1px solid ${inputBdr}`, borderRadius:6, padding:'9px 12px', color:text, fontFamily:'inherit', fontSize:'.88rem', outline:'none', width:'100%', boxSizing:'border-box' };

  const load = useCallback(async () => {
    try { const r = await api('/planner'); if (r.ok) setEvents(await r.json()); } catch {}
  }, []);
  useEffect(() => { load(); }, [load]);

  const addEvent = async () => {
    if (!newEv.title.trim() || !newEv.date) return;
    setLoading(true);
    try { await api('/planner', { method:'POST', body:JSON.stringify(newEv) }); setNewEv({...blankEv}); setShowAdd(false); load(); }
    catch {} finally { setLoading(false); }
  };
  const toggle = async (id: string) => { try { await api(`/planner/${id}/toggle`,{method:'PATCH'}); load(); } catch {} };
  const del    = async (id: string) => { try { await api(`/planner/${id}`,{method:'DELETE'}); load(); } catch {} };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setNewEv(p => ({ ...p, subtasks:[...p.subtasks,{id:Date.now().toString(),text:newSubtask.trim(),done:false}] }));
    setNewSubtask('');
  };
  const addTag = () => {
    if (!newTag.trim() || newEv.tags.includes(newTag.trim())) return;
    setNewEv(p => ({ ...p, tags:[...p.tags,newTag.trim()] }));
    setNewTag('');
  };

  // Calendar
  const cy = calDate.getFullYear(), cm = calDate.getMonth();
  const daysInMonth = new Date(cy,cm+1,0).getDate();
  const firstDOW    = new Date(cy,cm,1).getDay();
  const dayStr  = (d: number) => `${cy}-${String(cm+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const byDay: Record<string,RichEvent[]> = {};
  events.forEach(e => { if (!byDay[e.date]) byDay[e.date]=[]; byDay[e.date].push(e); });

  const todayStr  = todayISO();
  const todayEvs  = events.filter(e=>e.date===todayStr);
  const futureEvs = events.filter(e=>e.date>todayStr);
  const pastEvs   = events.filter(e=>e.date<todayStr);
  const selEvs    = byDay[selectedDay]||[];

  // Event card (shared)
  const EventCard = ({ e }: { e: RichEvent }) => {
    const tc      = PLANNER_TYPE_COLOR[e.eventType]||'#888';
    const priCfg  = PRI[(e.priority||'medium') as keyof typeof PRI];
    const subs    = e.subtasks||[];
    const subDone = subs.filter(s=>s.done).length;
    const prog    = subs.length>0 ? (subDone/subs.length)*100 : e.done?100:0;
    const isExp   = expanded===e.id;

    return (
      <div style={{ background:surface, border:`1px solid ${border}`, borderLeft:`3px solid ${priCfg.color}`, borderRadius:8, marginBottom:8, overflow:'hidden', opacity:e.done?.65:1, boxShadow:shadow }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', cursor:'pointer' }} onClick={()=>setExpanded(isExp?null:e.id)}>
          <div onClick={ev=>{ev.stopPropagation();toggle(e.id);}} style={{ width:18,height:18,borderRadius:4,flexShrink:0,border:`1.5px solid ${e.done?accent:inputBdr}`,background:e.done?accent:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
            {e.done && <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1,5 4,8 9,2" stroke="#000" strokeWidth="2" fill="none"/></svg>}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom: subs.length>0?6:0 }}>
              <span style={{ fontWeight:600,color:text,fontSize:'.9rem',textDecoration:e.done?'line-through':'none' }}>{e.title}</span>
              <span style={{ fontSize:'.67rem',padding:'2px 7px',borderRadius:12,background:`${tc}20`,color:tc,fontWeight:600 }}>{e.eventType}</span>
              <span style={{ fontSize:'.67rem',padding:'2px 7px',borderRadius:12,background:priCfg.bg,color:priCfg.color,fontWeight:600 }}>{priCfg.label}</span>
              {(e.tags||[]).map(t=><span key={t} style={{ fontSize:'.64rem',padding:'2px 6px',borderRadius:12,background:surface2,color:text3,border:`1px solid ${border}` }}>#{t}</span>)}
            </div>
            {subs.length>0 && (
              <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                <div style={{ flex:1,height:3,background:isDark?'rgba(255,255,255,.08)':'rgba(100,130,200,0.12)',borderRadius:2,overflow:'hidden' }}>
                  <div style={{ height:'100%',width:`${prog}%`,background:accent,borderRadius:2,transition:'.4s' }}/>
                </div>
                <span style={{ fontSize:'.67rem',color:text3,whiteSpace:'nowrap' }}>{subDone}/{subs.length}</span>
              </div>
            )}
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:8,flexShrink:0 }}>
            {e.time && <span style={{ fontSize:'.73rem',color:text3 }}>🕐 {e.time}</span>}
            {e.estimatedMins && <span style={{ fontSize:'.73rem',color:text3 }}>⏱ {e.estimatedMins}m</span>}
            <span style={{ fontSize:'.72rem',color:text3 }}>{new Date(e.date+'T00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>
            <span style={{ fontSize:'.7rem',color:text3,display:'inline-block',transition:'.2s',transform:isExp?'rotate(180deg)':'none' }}>▾</span>
            <button onClick={ev=>{ev.stopPropagation();del(e.id);}} style={{ background:'none',border:'none',color:isDark?'rgba(255,255,255,.2)':'rgba(100,130,200,.35)',cursor:'pointer',fontSize:'1rem' }}>✕</button>
          </div>
        </div>
        {isExp && (
          <div style={{ padding:'0 14px 14px 42px', borderTop:`1px solid ${border}` }}>
            {e.description && <p style={{ color:text2,fontSize:'.85rem',marginTop:10,marginBottom:10,lineHeight:1.6 }}>{e.description}</p>}
            {e.notes && (
              <div style={{ background:surface2,border:`1px solid ${border}`,borderRadius:6,padding:'10px 12px',marginBottom:10 }}>
                <div style={{ fontSize:'.66rem',color:text3,marginBottom:4,textTransform:'uppercase',letterSpacing:'.08em' }}>📝 Notes</div>
                <p style={{ color:text2,fontSize:'.83rem',lineHeight:1.6,whiteSpace:'pre-wrap' }}>{e.notes}</p>
              </div>
            )}
            {subs.length>0 && (
              <div>
                <div style={{ fontSize:'.66rem',color:text3,marginBottom:8,textTransform:'uppercase',letterSpacing:'.08em' }}>✅ Subtasks</div>
                {subs.map(s=>(
                  <div key={s.id} style={{ display:'flex',alignItems:'center',gap:8,padding:'4px 0' }}>
                    <div style={{ width:14,height:14,borderRadius:3,border:`1.5px solid ${s.done?accent:inputBdr}`,background:s.done?accent:'transparent',flexShrink:0 }}/>
                    <span style={{ color:s.done?text3:text2,fontSize:'.83rem',textDecoration:s.done?'line-through':'none' }}>{s.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const SectionHead = ({ title, count }: { title:string; count:number }) => (
    <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:10,marginTop:16 }}>
      <div style={{ fontSize:'.7rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.12em',color:text3 }}>{title}</div>
      <div style={{ height:1,flex:1,background:border }}/>
      <div style={{ fontSize:'.7rem',color:text3 }}>{count}</div>
    </div>
  );

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:0 }}>

      {/* Header */}
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
        <div>
          <h3 style={{ color:text,fontFamily:'Orbitron,monospace',fontSize:'1rem',marginBottom:4 }}>{label}</h3>
          <p style={{ color:text3,fontSize:'.83rem' }}>{todayEvs.length} today · {futureEvs.length} upcoming · {events.filter(e=>!e.done).length} open</p>
        </div>
        <div style={{ display:'flex',gap:10 }}>
          <div style={{ display:'flex',background:surface2,border:`1px solid ${border}`,borderRadius:6,overflow:'hidden' }}>
            {(['calendar','list'] as const).map(v=>(
              <button key={v} onClick={()=>setView(v)} style={{ padding:'7px 14px',background:view===v?accent:'transparent',border:'none',color:view===v?'#000':text2,cursor:'pointer',fontFamily:'inherit',fontSize:'.8rem',fontWeight:600 }}>
                {v==='calendar'?'📅 Calendar':'☰ List'}
              </button>
            ))}
          </div>
          <button onClick={()=>setShowAdd(v=>!v)} style={{ padding:'9px 18px',background:accent,border:'none',borderRadius:6,color:'#000',fontWeight:700,fontSize:'.84rem',cursor:'pointer' }}>+ Plan</button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{ background:surface,border:`1px solid ${border}`,borderRadius:10,padding:20,marginBottom:20,boxShadow:shadow }}>
          <div style={{ fontSize:'.78rem',fontWeight:700,color:accent,textTransform:'uppercase',letterSpacing:'.1em',marginBottom:16 }}>📋 New Plan</div>

          <div style={{ display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:12,marginBottom:12 }}>
            <div>
              <label style={{ fontSize:'.67rem',color:text3,display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.08em' }}>Title *</label>
              <input value={newEv.title} onChange={e=>setNewEv(p=>({...p,title:e.target.value}))} placeholder="What are you planning?" style={inp}/>
            </div>
            <div>
              <label style={{ fontSize:'.67rem',color:text3,display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.08em' }}>Date *</label>
              <input type="date" value={newEv.date} onChange={e=>setNewEv(p=>({...p,date:e.target.value}))} style={{...inp,colorScheme:isDark?'dark':'light'}}/>
            </div>
            <div>
              <label style={{ fontSize:'.67rem',color:text3,display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.08em' }}>Time</label>
              <input type="time" value={newEv.time} onChange={e=>setNewEv(p=>({...p,time:e.target.value}))} style={{...inp,colorScheme:isDark?'dark':'light'}}/>
            </div>
          </div>

          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:12 }}>
            <div>
              <label style={{ fontSize:'.67rem',color:text3,display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.08em' }}>Type</label>
              <select value={newEv.eventType} onChange={e=>setNewEv(p=>({...p,eventType:e.target.value}))} style={{...inp,appearance:'none' as any}}>
                {['work','meeting','deadline','personal','exam','project','study','health','review'].map(t=>(
                  <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize:'.67rem',color:text3,display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.08em' }}>Priority</label>
              <select value={newEv.priority} onChange={e=>setNewEv(p=>({...p,priority:e.target.value as any}))} style={{...inp,appearance:'none' as any}}>
                {Object.entries(PRI).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:'.67rem',color:text3,display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.08em' }}>Est. Duration (min)</label>
              <input type="number" min={5} step={5} value={newEv.estimatedMins} onChange={e=>setNewEv(p=>({...p,estimatedMins:+e.target.value}))} style={inp}/>
            </div>
          </div>

          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:'.67rem',color:text3,display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.08em' }}>Description</label>
            <textarea value={newEv.description} onChange={e=>setNewEv(p=>({...p,description:e.target.value}))} rows={2} placeholder="What's this event about?" style={{...inp,resize:'vertical'}}/>
          </div>

          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:'.67rem',color:text3,display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.08em' }}>📝 Planning Notes</label>
            <textarea value={newEv.notes} onChange={e=>setNewEv(p=>({...p,notes:e.target.value}))} rows={3} placeholder="Detailed steps, blockers, resources, context — anything you need to remember..." style={{...inp,resize:'vertical'}}/>
          </div>

          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:'.67rem',color:text3,display:'block',marginBottom:8,textTransform:'uppercase',letterSpacing:'.08em' }}>✅ Subtasks / Steps</label>
            {newEv.subtasks.map(s=>(
              <div key={s.id} style={{ display:'flex',alignItems:'center',gap:8,marginBottom:5 }}>
                <div onClick={()=>setNewEv(p=>({...p,subtasks:p.subtasks.map(x=>x.id===s.id?{...x,done:!x.done}:x)}))} style={{ width:14,height:14,borderRadius:3,flexShrink:0,cursor:'pointer',border:`1.5px solid ${s.done?accent:inputBdr}`,background:s.done?accent:'transparent' }}/>
                <span style={{ flex:1,color:s.done?text3:text2,fontSize:'.83rem',textDecoration:s.done?'line-through':'none' }}>{s.text}</span>
                <button onClick={()=>setNewEv(p=>({...p,subtasks:p.subtasks.filter(x=>x.id!==s.id)}))} style={{ background:'none',border:'none',color:text3,cursor:'pointer' }}>✕</button>
              </div>
            ))}
            <div style={{ display:'flex',gap:8 }}>
              <input value={newSubtask} onChange={e=>setNewSubtask(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addSubtask()} placeholder="Add a step (Enter to add)" style={{...inp,flex:1}}/>
              <button onClick={addSubtask} style={{ padding:'9px 16px',background:surface2,border:`1px solid ${border}`,borderRadius:6,color:text2,cursor:'pointer',fontFamily:'inherit',fontSize:'.84rem',whiteSpace:'nowrap' }}>+ Step</button>
            </div>
          </div>

          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:'.67rem',color:text3,display:'block',marginBottom:8,textTransform:'uppercase',letterSpacing:'.08em' }}>🏷️ Tags</label>
            <div style={{ display:'flex',gap:6,flexWrap:'wrap',marginBottom:8 }}>
              {newEv.tags.map(t=>(
                <span key={t} style={{ padding:'3px 10px',background:surface2,border:`1px solid ${border}`,borderRadius:12,color:text2,fontSize:'.75rem',display:'flex',alignItems:'center',gap:4 }}>
                  #{t} <button onClick={()=>setNewEv(p=>({...p,tags:p.tags.filter(x=>x!==t)}))} style={{ background:'none',border:'none',color:text3,cursor:'pointer',padding:0 }}>✕</button>
                </span>
              ))}
            </div>
            <div style={{ display:'flex',gap:8 }}>
              <input value={newTag} onChange={e=>setNewTag(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addTag()} placeholder="Tag (Enter to add)" style={{...inp,flex:1}}/>
              <button onClick={addTag} style={{ padding:'9px 16px',background:surface2,border:`1px solid ${border}`,borderRadius:6,color:text2,cursor:'pointer',fontFamily:'inherit',fontSize:'.84rem' }}>+ Tag</button>
            </div>
          </div>

          <div style={{ display:'flex',gap:10,justifyContent:'flex-end' }}>
            <button onClick={()=>setShowAdd(false)} style={{ padding:'9px 20px',background:'transparent',border:`1px solid ${border}`,borderRadius:6,color:text2,cursor:'pointer',fontFamily:'inherit',fontSize:'.84rem' }}>Cancel</button>
            <button onClick={addEvent} disabled={loading} style={{ padding:'9px 24px',background:accent,border:'none',borderRadius:6,color:'#000',fontWeight:700,cursor:'pointer',fontFamily:'inherit',fontSize:'.84rem',opacity:loading?.6:1 }}>
              {loading?'Saving…':'💾 Save Plan'}
            </button>
          </div>
        </div>
      )}

      {/* Calendar view */}
      {view==='calendar' && (
        <div style={{ display:'grid',gridTemplateColumns:'1fr 320px',gap:20 }}>
          <div style={{ background:surface,border:`1px solid ${border}`,borderRadius:12,padding:20,boxShadow:shadow }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16 }}>
              <button onClick={()=>setCalDate(d=>new Date(d.getFullYear(),d.getMonth()-1,1))} style={{ background:'none',border:`1px solid ${border}`,borderRadius:6,color:text2,cursor:'pointer',padding:'6px 12px',fontSize:'1.1rem' }}>‹</button>
              <span style={{ fontFamily:'Orbitron,monospace',fontWeight:700,color:text,fontSize:'.9rem',letterSpacing:'.06em' }}>{MONTHS[cm]} {cy}</span>
              <button onClick={()=>setCalDate(d=>new Date(d.getFullYear(),d.getMonth()+1,1))} style={{ background:'none',border:`1px solid ${border}`,borderRadius:6,color:text2,cursor:'pointer',padding:'6px 12px',fontSize:'1.1rem' }}>›</button>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4,marginBottom:8 }}>
              {DAYS.map(d=><div key={d} style={{ textAlign:'center',fontSize:'.63rem',color:text3,fontWeight:700,textTransform:'uppercase',letterSpacing:'.05em',padding:'4px 0' }}>{d}</div>)}
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4 }}>
              {Array.from({length:firstDOW}).map((_,i)=><div key={`e${i}`}/>)}
              {Array.from({length:daysInMonth}).map((_,i)=>{
                const d=i+1, ds=dayStr(d), isT=ds===todayStr, isSel=ds===selectedDay, evs=byDay[ds]||[];
                return (
                  <div key={d} onClick={()=>setSelectedDay(ds)} style={{ borderRadius:8,padding:'6px 4px',cursor:'pointer',minHeight:60,position:'relative',background:isSel?`rgba(0,0,0,0.05)`:isT?surface2:'transparent',border:isSel?`1.5px solid ${accent}`:isT?`1.5px solid ${border}`:`1px solid transparent`,transition:'.15s' }}>
                    <div style={{ textAlign:'center',fontSize:'.8rem',fontWeight:isT||isSel?700:400,color:isSel?accent:isT?text:text2,marginBottom:4 }}>{d}</div>
                    <div style={{ display:'flex',flexDirection:'column',gap:2 }}>
                      {evs.slice(0,3).map(e=>{
                        const tc=PLANNER_TYPE_COLOR[e.eventType]||'#888';
                        return <div key={e.id} style={{ fontSize:'.57rem',padding:'2px 4px',borderRadius:3,background:`${tc}22`,color:tc,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textDecoration:e.done?'line-through':'none',opacity:e.done?.6:1 }}>{e.title}</div>;
                      })}
                      {evs.length>3 && <div style={{ fontSize:'.55rem',color:text3,paddingLeft:4 }}>+{evs.length-3}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day panel */}
          <div style={{ background:surface,border:`1px solid ${border}`,borderRadius:12,padding:20,overflowY:'auto',maxHeight:560,boxShadow:shadow }}>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontWeight:700,color:text,fontSize:'.95rem' }}>{new Date(selectedDay+'T00:00').toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</div>
              <div style={{ color:text3,fontSize:'.78rem',marginTop:2 }}>{selEvs.length===0?'Nothing planned':selEvs.length+` event${selEvs.length>1?'s':''}`}</div>
            </div>
            {selEvs.length===0
              ? <div style={{ textAlign:'center',padding:'28px 0',color:text3 }}>
                  <div style={{ fontSize:'2rem',marginBottom:8 }}>📅</div>
                  <div style={{ fontSize:'.85rem',marginBottom:12 }}>Nothing here yet</div>
                  <button onClick={()=>{setNewEv(p=>({...p,date:selectedDay}));setShowAdd(true);}} style={{ padding:'8px 18px',background:accent,border:'none',borderRadius:6,color:'#000',fontWeight:700,cursor:'pointer',fontFamily:'inherit',fontSize:'.8rem' }}>+ Add Plan</button>
                </div>
              : selEvs.map(e=><EventCard key={e.id} e={e}/>)
            }
          </div>
        </div>
      )}

      {/* List view */}
      {view==='list' && (
        <div>
          {events.length===0 && (
            <div style={{ textAlign:'center',padding:48,color:text3 }}>
              <div style={{ fontSize:'2.5rem',marginBottom:12 }}>🗓️</div>
              <div style={{ fontSize:'1rem',color:text2,marginBottom:6 }}>Nothing planned yet</div>
              <div style={{ fontSize:'.85rem' }}>Hit "+ Plan" to start organizing</div>
            </div>
          )}
          {todayEvs.length>0  && <><SectionHead title="Today"    count={todayEvs.length} />{todayEvs.map(e=><EventCard key={e.id} e={e}/>)}</>}
          {futureEvs.length>0 && <><SectionHead title="Upcoming" count={futureEvs.length}/>{futureEvs.map(e=><EventCard key={e.id} e={e}/>)}</>}
          {pastEvs.length>0   && <><SectionHead title="Past"     count={pastEvs.length}  />{pastEvs.map(e=><EventCard key={e.id} e={e}/>)}</>}
        </div>
      )}
    </div>
  );
}