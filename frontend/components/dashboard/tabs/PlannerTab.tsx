'use client';
// components/dashboard/tabs/PlannerTab.tsx
// Full-featured AI planner with: subtask toggling, today's schedule,
// progress bars, inline notes editing, priority management, day overview.

import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';
import { PLANNER_TYPE_COLOR } from '../../../lib/constants';
import { useTheme } from '../../../lib/ThemeContext';

/* ── Types ─────────────────────────────────────────────────── */
interface SubTask { id: string; text: string; done: boolean; estimatedMins?: number; }
interface RichEvent {
  id: string; title: string; description?: string;
  date: string; time?: string; eventType: string; done: boolean;
  priority?: string; notes?: string;
  subtasksJson?: string; tagsJson?: string;
  estimatedMins?: number; aiGenerated?: boolean;
  // parsed client-side
  subtasks?: SubTask[];
  tags?: string[];
}
interface AIPlan {
  title: string; description: string; date: string; time: string;
  eventType: string; priority: string; estimatedMins: number;
  subtasks: { text: string; estimatedMins: number }[];
  notes: string; tags: string[];
}

const PRI: Record<string,{label:string;color:string;bg:string;icon:string}> = {
  low:      { label:'Low',      color:'#00c97a', bg:'rgba(0,201,122,0.10)',  icon:'▽' },
  medium:   { label:'Medium',   color:'#f0b429', bg:'rgba(240,180,41,0.10)', icon:'◇' },
  high:     { label:'High',     color:'#f07033', bg:'rgba(240,112,51,0.10)', icon:'△' },
  critical: { label:'Critical', color:'#e8334a', bg:'rgba(232,51,74,0.10)',  icon:'⚠' },
};

const TYPE_EMOJI: Record<string,string> = {
  work:'💼', study:'📚', meeting:'🤝', personal:'🌱',
  deadline:'🔥', health:'💪', exam:'🎓', project:'🚀', review:'🔍'
};

const todayISO = () => new Date().toISOString().slice(0, 10);

function parseEvent(e: RichEvent): RichEvent {
  return {
    ...e,
    subtasks: (() => { try { return e.subtasksJson ? JSON.parse(e.subtasksJson) : []; } catch { return []; } })(),
    tags:     (() => { try { return e.tagsJson     ? JSON.parse(e.tagsJson)     : []; } catch { return []; } })(),
  };
}

function buildPrompt(goal: string, date: string, hours: number): string {
  const maxMins = hours * 60;
  return `Create a plan for: "${goal}"
Date: ${date}. Time budget: ${maxMins} minutes.
Return a JSON array of 1-3 tasks. Each task must be:
{"title":"...","description":"one sentence","date":"${date}","time":"HH:MM","eventType":"study","priority":"medium","estimatedMins":60,"subtasks":[{"text":"step","estimatedMins":15}],"notes":"tips and blockers","tags":["tag"]}
priority: low|medium|high|critical. eventType: work|study|meeting|personal|deadline|health|exam|project
subtasks: 3-5 steps. Total estimatedMins across all tasks <= ${maxMins}.
Output ONLY the JSON array. Start with [ end with ].`;
}

function extractJSON(raw: string): AIPlan[] {
  const text = raw.replace(/```json|```/gi, '').trim();
  try { const a = JSON.parse(text); if (Array.isArray(a)) return a; } catch {}
  const s = text.indexOf('['), e = text.lastIndexOf(']');
  if (s !== -1 && e > s) {
    try { const a = JSON.parse(text.slice(s, e+1)); if (Array.isArray(a)) return a; } catch {}
    const lb = text.slice(s, e+1).lastIndexOf('}');
    if (lb !== -1) try { const a = JSON.parse(text.slice(s, s+lb+1)+']'); if (Array.isArray(a)) return a; } catch {}
  }
  return [];
}

/* ─────────────────────────────────────────────────────────── */
export default function PlannerTab({ accent, label, user }: { accent:string; label:string; user:any }) {
  const { isDark } = useTheme();
  const [events,    setEvents]    = useState<RichEvent[]>([]);
  const [view,      setView]      = useState<'today'|'ai'|'all'>('today');
  const [expanded,  setExpanded]  = useState<Set<string>>(new Set());
  const [editNotes, setEditNotes] = useState<string|null>(null);
  const [notesVal,  setNotesVal]  = useState('');
  const [saving,    setSaving]    = useState<number|null>(null);
  const [aiGoal,    setAiGoal]    = useState('');
  const [aiDate,    setAiDate]    = useState(todayISO());
  const [aiHours,   setAiHours]   = useState(2);
  const [aiPlans,   setAiPlans]   = useState<AIPlan[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError,   setAiError]   = useState('');
  const [showAdd,   setShowAdd]   = useState(false);
  const [addLoading,setAddLoading]= useState(false);
  const [newSubtask,setNewSubtask]= useState('');
  const [newEv, setNewEv] = useState({ title:'', date:todayISO(), time:'', eventType:'work', description:'', priority:'medium', notes:'', estimatedMins:30, subtasks:[] as SubTask[] });

  /* ── Theme ── */
  const text    = isDark ? '#fff'                   : '#1a2340';
  const text2   = isDark ? 'rgba(255,255,255,.62)'  : '#4a5680';
  const text3   = isDark ? 'rgba(255,255,255,.35)'  : '#8090b0';
  const surface = isDark ? 'rgba(255,255,255,.04)'  : '#fff';
  const border  = isDark ? 'rgba(255,255,255,.09)'  : 'rgba(100,130,200,0.18)';
  const surface2= isDark ? 'rgba(255,255,255,.06)'  : 'rgba(230,238,255,0.75)';
  const inputBg = isDark ? 'rgba(255,255,255,.07)'  : '#fff';
  const inputBdr= isDark ? 'rgba(255,255,255,.13)'  : 'rgba(100,130,200,0.30)';
  const shadow  = isDark ? 'none'                   : '0 2px 16px rgba(100,130,200,0.09)';
  const panelBg = isDark ? 'rgba(255,255,255,.025)' : 'rgba(240,245,255,0.85)';

  const inp: React.CSSProperties = { background:inputBg, border:`1px solid ${inputBdr}`, borderRadius:8, padding:'9px 13px', color:text, fontFamily:'inherit', fontSize:'.88rem', outline:'none', width:'100%', boxSizing:'border-box' };

  const load = useCallback(async () => {
    try {
      const r = await api('/planner');
      if (r.ok) { const raw: RichEvent[] = await r.json(); setEvents(raw.map(parseEvent)); }
    } catch {}
  }, []);
  useEffect(() => { load(); }, [load]);

  /* ── Groupings ── */
  const todayStr  = todayISO();
  const todayEvs  = events.filter(e => e.date === todayStr).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
  const futureEvs = events.filter(e => e.date > todayStr);
  const pastEvs   = events.filter(e => e.date < todayStr);
  const openToday = todayEvs.filter(e => !e.done).length;
  const doneToday = todayEvs.filter(e => e.done).length;
  const totalSubtasks = todayEvs.reduce((a,e)=>(a+(e.subtasks?.length||0)),0);
  const doneSubtasks  = todayEvs.reduce((a,e)=>(a+(e.subtasks?.filter(s=>s.done).length||0)),0);

  /* ── Toggle expand ── */
  const toggleExpand = (id: string) => setExpanded(prev => { const n = new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });

  /* ── API actions ── */
  const toggleEvent = async (id: string) => {
    try { await api(`/planner/${id}/toggle`, {method:'PATCH'}); load(); } catch {}
  };
  const toggleSubtask = async (eventId: string, subtaskId: string) => {
    try { await api(`/planner/${eventId}/subtask/${subtaskId}`, {method:'PATCH'}); load(); } catch {}
  };
  const deleteEvent = async (id: string) => {
    try { await api(`/planner/${id}`, {method:'DELETE'}); load(); } catch {}
  };
  const saveNotes = async (id: string) => {
    try { await api(`/planner/${id}`, {method:'PATCH', body:JSON.stringify({notes:notesVal})}); setEditNotes(null); load(); } catch {}
  };

  /* ── AI generate ── */
  const generatePlan = async () => {
    if (!aiGoal.trim()) return;
    setAiLoading(true); setAiError(''); setAiPlans([]);
    try {
      const res = await api('/ai/chat', { method:'POST', body:JSON.stringify({ message:buildPrompt(aiGoal.trim(),aiDate,aiHours), context:'planner' }) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      const plans = extractJSON(d.reply || '');
      if (plans.length === 0) {
        // Fallback template
        setAiPlans([{ title:aiGoal, description:`Plan for: ${aiGoal}`, date:aiDate, time:'09:00', eventType:'work', priority:'medium', estimatedMins:aiHours*60, subtasks:[{text:'Review requirements',estimatedMins:15},{text:'Main work block',estimatedMins:aiHours*60*0.6},{text:'Review and wrap up',estimatedMins:15}], notes:'AI could not generate JSON. This is a starter template — edit as needed.', tags:['plan'] }]);
        setAiError('AI returned plain text — here is a starter template. Edit before saving.');
      } else {
        setAiPlans(plans.map(p=>({...p, priority:(['low','medium','high','critical'].includes(p.priority)?p.priority:'medium'), estimatedMins:Number(p.estimatedMins)||60, subtasks:Array.isArray(p.subtasks)?p.subtasks:[], tags:Array.isArray(p.tags)?p.tags:[] })));
      }
    } catch(e:any) { setAiError(`Error: ${e.message}`); }
    finally { setAiLoading(false); }
  };

  const savePlan = async (plan: AIPlan, idx: number) => {
    setSaving(idx);
    try {
      await api('/planner', { method:'POST', body:JSON.stringify({
        title:plan.title, description:plan.description, date:plan.date, time:plan.time,
        eventType:plan.eventType, priority:plan.priority, notes:plan.notes,
        estimatedMins:plan.estimatedMins, aiGenerated:true,
        subtasksJson: JSON.stringify(plan.subtasks.map((s,i)=>({id:`s${Date.now()}${i}`,text:s.text,done:false,estimatedMins:s.estimatedMins}))),
        tagsJson: JSON.stringify(plan.tags),
      })});
      load(); setAiPlans(p=>p.filter((_,i)=>i!==idx));
    } catch {} finally { setSaving(null); }
  };
  const saveAllPlans = async () => { for (let i=0;i<aiPlans.length;i++) await savePlan(aiPlans[i],i); };

  /* ── Manual add ── */
  const addManual = async () => {
    if (!newEv.title.trim()) return;
    setAddLoading(true);
    try {
      await api('/planner', { method:'POST', body:JSON.stringify({
        ...newEv,
        subtasksJson: JSON.stringify(newEv.subtasks),
        tagsJson: '[]',
      })});
      setNewEv({title:'',date:todayISO(),time:'',eventType:'work',description:'',priority:'medium',notes:'',estimatedMins:30,subtasks:[]});
      setShowAdd(false); load();
    } catch {} finally { setAddLoading(false); }
  };

  /* ── Shared event card ── */
  const EventCard = ({ e, compact=false }: { e:RichEvent; compact?:boolean }) => {
    const subs     = e.subtasks || [];
    const done     = subs.filter(s=>s.done).length;
    const prog     = subs.length>0 ? Math.round((done/subs.length)*100) : e.done ? 100 : 0;
    const priCfg   = PRI[e.priority||'medium'] || PRI.medium;
    const tc       = PLANNER_TYPE_COLOR[e.eventType] || '#888';
    const isExp    = expanded.has(e.id);
    const fmtMins  = (m?:number) => !m?'':m<60?`${m}m`:`${Math.floor(m/60)}h${m%60?`${m%60}m`:''}`;
    const isEditing= editNotes===e.id;

    return (
      <div style={{ background:surface, border:`1px solid ${border}`, borderLeft:`3px solid ${priCfg.color}`, borderRadius:10, marginBottom:10, overflow:'hidden', boxShadow:shadow, opacity:e.done?.65:1, transition:'opacity .2s' }}>

        {/* Main row */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding: compact?'10px 14px':'13px 16px' }}>
          {/* Checkbox */}
          <div onClick={()=>toggleEvent(e.id)} style={{ width:20,height:20,borderRadius:5,flexShrink:0,border:`2px solid ${e.done?accent:inputBdr}`,background:e.done?accent:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'.2s' }}>
            {e.done && <svg width="11" height="11" viewBox="0 0 10 10"><polyline points="1,5 4,8 9,2" stroke={isDark?'#000':'#fff'} strokeWidth="2.5" fill="none"/></svg>}
          </div>

          {/* Title & meta */}
          <div style={{ flex:1, minWidth:0, cursor:'pointer' }} onClick={()=>toggleExpand(e.id)}>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:subs.length>0||e.time?4:0 }}>
              <span style={{ fontSize:'.88rem' }}>{TYPE_EMOJI[e.eventType]||'📌'}</span>
              {e.aiGenerated && <span style={{ fontSize:'.62rem',padding:'1px 6px',borderRadius:10,background:`${accent}22`,color:accent,fontWeight:800,letterSpacing:'.05em' }}>✦AI</span>}
              <span style={{ fontWeight:600,color:text,fontSize:'.92rem',textDecoration:e.done?'line-through':'none',flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{e.title}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
              {e.time && <span style={{ fontSize:'.72rem',color:text3 }}>🕐 {e.time}</span>}
              {e.estimatedMins && <span style={{ fontSize:'.72rem',color:text3 }}>⏱ {fmtMins(e.estimatedMins)}</span>}
              <span style={{ fontSize:'.67rem',padding:'1px 7px',borderRadius:12,background:`${tc}18`,color:tc,fontWeight:600 }}>{e.eventType}</span>
              <span style={{ fontSize:'.67rem',padding:'1px 7px',borderRadius:12,background:priCfg.bg,color:priCfg.color,fontWeight:700 }}>{priCfg.icon} {priCfg.label}</span>
              {subs.length>0 && <span style={{ fontSize:'.7rem',color: prog===100?'#00c97a':text3 }}>{done}/{subs.length} steps {prog===100?'✓':''}</span>}
            </div>
            {/* Progress bar */}
            {subs.length>0 && (
              <div style={{ marginTop:5, height:3, background:isDark?'rgba(255,255,255,.06)':'rgba(100,130,200,0.10)', borderRadius:2, overflow:'hidden' }}>
                <div style={{ height:'100%',width:`${prog}%`,background:prog===100?'#00c97a':accent,borderRadius:2,transition:'.4s' }}/>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display:'flex',alignItems:'center',gap:6,flexShrink:0 }}>
            <button onClick={()=>toggleExpand(e.id)} title="Details" style={{ background:'none',border:`1px solid ${border}`,borderRadius:6,color:text3,cursor:'pointer',padding:'4px 8px',fontSize:'.75rem',transition:'.15s' }}>
              {isExp?'▴':'▾'}
            </button>
            <button onClick={()=>deleteEvent(e.id)} title="Delete" style={{ background:'none',border:'none',color:isDark?'rgba(255,255,255,.2)':'rgba(100,130,200,.3)',cursor:'pointer',fontSize:'1.1rem',lineHeight:1 }}>✕</button>
          </div>
        </div>

        {/* Expanded panel */}
        {isExp && (
          <div style={{ borderTop:`1px solid ${border}`, padding:'14px 16px 16px 46px' }}>

            {/* Description */}
            {e.description && <p style={{ color:text2,fontSize:'.86rem',lineHeight:1.65,marginBottom:12 }}>{e.description}</p>}

            {/* Tags */}
            {(e.tags||[]).length>0 && (
              <div style={{ display:'flex',gap:6,flexWrap:'wrap',marginBottom:12 }}>
                {(e.tags||[]).map(t=><span key={t} style={{ fontSize:'.67rem',padding:'2px 8px',borderRadius:12,background:surface2,color:text3,border:`1px solid ${border}` }}>#{t}</span>)}
              </div>
            )}

            {/* Subtasks */}
            {subs.length>0 && (
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:'.67rem',fontWeight:700,color:text3,textTransform:'uppercase',letterSpacing:'.09em',marginBottom:8 }}>
                  Steps — {done}/{subs.length} done ({prog}%)
                </div>
                {subs.map((s,i)=>(
                  <div key={s.id} onClick={()=>toggleSubtask(e.id,s.id)} style={{ display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderRadius:7,marginBottom:4,cursor:'pointer',background:s.done?(isDark?'rgba(0,201,122,0.06)':'rgba(0,201,122,0.05)'):'transparent',border:`1px solid ${s.done?'rgba(0,201,122,0.15)':border}`,transition:'.2s' }}>
                    <div style={{ width:18,height:18,borderRadius:4,flexShrink:0,border:`2px solid ${s.done?'#00c97a':inputBdr}`,background:s.done?'#00c97a':'transparent',display:'flex',alignItems:'center',justifyContent:'center',transition:'.2s' }}>
                      {s.done && <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1,5 4,8 9,2" stroke={isDark?'#000':'#fff'} strokeWidth="2.5" fill="none"/></svg>}
                    </div>
                    <span style={{ flex:1,color:s.done?text3:text2,fontSize:'.85rem',textDecoration:s.done?'line-through':'none',lineHeight:1.4 }}>{s.text}</span>
                    {s.estimatedMins && <span style={{ fontSize:'.7rem',color:text3,flexShrink:0 }}>{s.estimatedMins}m</span>}
                    <span style={{ fontSize:'.7rem',color:text3,flexShrink:0 }}>#{i+1}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Notes */}
            <div>
              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:6 }}>
                <span style={{ fontSize:'.67rem',fontWeight:700,color:text3,textTransform:'uppercase',letterSpacing:'.09em' }}>📝 Notes</span>
                <button onClick={()=>{ if(isEditing){saveNotes(e.id);}else{setEditNotes(e.id);setNotesVal(e.notes||'');} }} style={{ background:'none',border:`1px solid ${border}`,borderRadius:5,color:accent,cursor:'pointer',fontSize:'.7rem',padding:'2px 8px',fontFamily:'inherit',fontWeight:600 }}>
                  {isEditing?'Save':'Edit'}
                </button>
                {isEditing && <button onClick={()=>setEditNotes(null)} style={{ background:'none',border:'none',color:text3,cursor:'pointer',fontSize:'.7rem',fontFamily:'inherit' }}>Cancel</button>}
              </div>
              {isEditing ? (
                <textarea value={notesVal} onChange={e=>setNotesVal(e.target.value)} rows={4} autoFocus style={{...inp,resize:'vertical',fontSize:'.85rem',lineHeight:1.6}}/>
              ) : e.notes ? (
                <div style={{ background:panelBg,border:`1px solid ${border}`,borderRadius:8,padding:'10px 13px' }}>
                  <p style={{ color:text2,fontSize:'.84rem',lineHeight:1.65,whiteSpace:'pre-wrap',margin:0 }}>{e.notes}</p>
                </div>
              ) : (
                <button onClick={()=>{ setEditNotes(e.id); setNotesVal(''); }} style={{ background:'none',border:`1px dashed ${border}`,borderRadius:8,padding:'8px 14px',color:text3,cursor:'pointer',fontSize:'.82rem',fontFamily:'inherit',width:'100%',textAlign:'left' }}>+ Add planning notes…</button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ── Today overview panel ── */
  const TodayView = () => (
    <div>
      {/* Day summary strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { icon:'✅', val:`${doneToday}/${todayEvs.length}`, label:'Tasks Done', color:accent },
          { icon:'🔥', val:`${openToday}`, label:'Still Open', color: openToday>0?'#f07033':'#00c97a' },
          { icon:'📋', val:`${doneSubtasks}/${totalSubtasks}`, label:'Steps Done', color:accent },
          { icon:'⏱', val: (() => { const m=todayEvs.reduce((a,e)=>a+(e.estimatedMins||0),0); return m<60?`${m}m`:`${(m/60).toFixed(1)}h`; })(), label:'Planned Time', color:text2 },
        ].map((s,i)=>(
          <div key={i} style={{ background:surface,border:`1px solid ${border}`,borderRadius:10,padding:'14px 16px',boxShadow:shadow }}>
            <div style={{ fontSize:'1.1rem',marginBottom:6 }}>{s.icon}</div>
            <div style={{ fontFamily:'Orbitron,monospace',fontWeight:700,fontSize:'1.2rem',color:s.color,marginBottom:2 }}>{s.val}</div>
            <div style={{ fontSize:'.7rem',color:text3,textTransform:'uppercase',letterSpacing:'.07em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Overall today progress */}
      {todayEvs.length>0 && (
        <div style={{ background:surface,border:`1px solid ${border}`,borderRadius:10,padding:'14px 18px',marginBottom:20,boxShadow:shadow }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8 }}>
            <span style={{ fontSize:'.78rem',fontWeight:700,color:text2 }}>Today's Progress</span>
            <span style={{ fontSize:'.78rem',color:accent,fontWeight:700 }}>{totalSubtasks>0?Math.round((doneSubtasks/totalSubtasks)*100):Math.round((doneToday/todayEvs.length)*100)}%</span>
          </div>
          <div style={{ height:8,background:isDark?'rgba(255,255,255,.07)':'rgba(100,130,200,0.10)',borderRadius:4,overflow:'hidden' }}>
            <div style={{ height:'100%',width:`${totalSubtasks>0?(doneSubtasks/totalSubtasks)*100:(doneToday/todayEvs.length)*100}%`,background:`linear-gradient(90deg,${accent},#00c97a)`,borderRadius:4,transition:'.5s' }}/>
          </div>
        </div>
      )}

      {/* Today's schedule */}
      {todayEvs.length===0 ? (
        <div style={{ textAlign:'center',padding:'40px 20px',color:text3 }}>
          <div style={{ fontSize:'2.5rem',marginBottom:12 }}>☀️</div>
          <div style={{ fontSize:'1rem',color:text2,marginBottom:6 }}>Nothing planned for today</div>
          <div style={{ fontSize:'.85rem',marginBottom:18 }}>Use the AI Planner to build your day</div>
          <button onClick={()=>setView('ai')} style={{ padding:'10px 24px',background:accent,border:'none',borderRadius:8,color:'#000',fontWeight:700,cursor:'pointer',fontFamily:'inherit',fontSize:'.88rem' }}>✦ Generate Today's Plan</button>
        </div>
      ) : (
        <>
          <div style={{ fontSize:'.72rem',fontWeight:700,color:text3,textTransform:'uppercase',letterSpacing:'.12em',marginBottom:10 }}>Today's Schedule</div>
          {todayEvs.map(e=><EventCard key={e.id} e={e}/>)}
        </>
      )}

      {/* Upcoming quick peek */}
      {futureEvs.length>0 && (
        <div style={{ marginTop:24 }}>
          <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:10 }}>
            <div style={{ fontSize:'.72rem',fontWeight:700,color:text3,textTransform:'uppercase',letterSpacing:'.12em' }}>Coming Up</div>
            <div style={{ flex:1,height:1,background:border }}/>
            <button onClick={()=>setView('all')} style={{ background:'none',border:'none',color:accent,fontSize:'.75rem',cursor:'pointer',fontFamily:'inherit',fontWeight:600 }}>All →</button>
          </div>
          {futureEvs.slice(0,3).map(e=><EventCard key={e.id} e={e} compact/>)}
        </div>
      )}
    </div>
  );

  /* ── All plans view ── */
  const AllView = () => {
    const Section = ({title,items}:{title:string;items:RichEvent[]}) => items.length===0?null:(
      <div style={{ marginBottom:20 }}>
        <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:10 }}>
          <div style={{ fontSize:'.7rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.12em',color:text3 }}>{title}</div>
          <div style={{ flex:1,height:1,background:border }}/>
          <span style={{ fontSize:'.7rem',color:text3 }}>{items.length}</span>
        </div>
        {items.map(e=><EventCard key={e.id} e={e}/>)}
      </div>
    );
    return events.length===0?(
      <div style={{ textAlign:'center',padding:56,color:text3 }}>
        <div style={{ fontSize:'3rem',marginBottom:14 }}>🗓️</div>
        <div style={{ fontSize:'1rem',color:text2,marginBottom:8 }}>No plans yet</div>
        <button onClick={()=>setView('ai')} style={{ padding:'10px 24px',background:accent,border:'none',borderRadius:8,color:'#000',fontWeight:700,cursor:'pointer',fontFamily:'inherit',fontSize:'.88rem' }}>✦ Open AI Planner</button>
      </div>
    ):(
      <>
        <Section title="Today"    items={todayEvs}  />
        <Section title="Upcoming" items={futureEvs} />
        <Section title="Past"     items={pastEvs}   />
      </>
    );
  };

  /* ── AI Planner view ── */
  const AIView = () => (
    <div>
      <div style={{ background:surface,border:`1px solid ${border}`,borderRadius:14,padding:24,marginBottom:24,boxShadow:shadow,position:'relative',overflow:'hidden' }}>
        <div style={{ position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${accent},transparent)`,opacity:.5 }}/>
        <div style={{ fontSize:'.78rem',fontWeight:800,color:accent,textTransform:'uppercase',letterSpacing:'.12em',marginBottom:4 }}>✦ AI Plan Generator</div>
        <p style={{ color:text3,fontSize:'.83rem',marginBottom:20,lineHeight:1.5 }}>Describe your goal — AI breaks it into actionable steps with time estimates.</p>

        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:'.67rem',color:text3,display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'.08em' }}>What do you want to accomplish?</label>
          <textarea value={aiGoal} onChange={e=>setAiGoal(e.target.value)} rows={3} placeholder={'e.g. "Prepare for my Physics exam"\n"Plan a product launch"\n"Build a morning workout routine"'} style={{...inp,resize:'vertical',lineHeight:1.6}}/>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16 }}>
          <div>
            <label style={{ fontSize:'.67rem',color:text3,display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.08em' }}>Target Date</label>
            <input type="date" value={aiDate} onChange={e=>setAiDate(e.target.value)} style={{...inp,colorScheme:isDark?'dark':'light'}}/>
          </div>
          <div>
            <label style={{ fontSize:'.67rem',color:text3,display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.08em' }}>Available Time</label>
            <select value={aiHours} onChange={e=>setAiHours(+e.target.value)} style={{...inp,appearance:'none' as any}}>
              {[1,2,3,4,6,8].map(h=><option key={h} value={h}>{h} hour{h>1?'s':''}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom:18 }}>
          <div style={{ fontSize:'.67rem',color:text3,marginBottom:8,textTransform:'uppercase',letterSpacing:'.08em' }}>Quick ideas</div>
          <div style={{ display:'flex',gap:7,flexWrap:'wrap' }}>
            {['Study session for exam','Weekly project review','Deep work block','Morning routine','Prepare a presentation','Research and report'].map(q=>(
              <button key={q} onClick={()=>setAiGoal(q)} style={{ padding:'5px 12px',background:surface2,border:`1px solid ${border}`,borderRadius:20,color:text2,fontSize:'.75rem',cursor:'pointer',fontFamily:'inherit' }}>{q}</button>
            ))}
          </div>
        </div>
        <button onClick={generatePlan} disabled={aiLoading||!aiGoal.trim()} style={{ padding:'12px 28px',background:aiLoading||!aiGoal.trim()?surface2:accent,border:'none',borderRadius:9,color:aiLoading||!aiGoal.trim()?text3:'#000',fontWeight:800,cursor:aiLoading||!aiGoal.trim()?'not-allowed':'pointer',fontFamily:'inherit',fontSize:'.9rem',display:'flex',alignItems:'center',gap:10,transition:'.2s' }}>
          {aiLoading?(<><span style={{ width:16,height:16,border:`2px solid ${text3}44`,borderTopColor:text3,borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite' }}/> Generating…</>):'✦ Generate AI Plan'}
        </button>
        {aiError && <div style={{ marginTop:12,padding:'10px 14px',background:'rgba(255,64,96,0.07)',border:'1px solid rgba(255,64,96,0.18)',borderRadius:8 }}><p style={{ color:'#e8334a',fontSize:'.83rem',margin:0 }}>⚠ {aiError}</p></div>}
      </div>

      {aiPlans.length>0 && (
        <div>
          <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:16 }}>
            <div style={{ fontSize:'.78rem',fontWeight:700,color:accent,textTransform:'uppercase',letterSpacing:'.1em' }}>✦ Your Plan ({aiPlans.length} item{aiPlans.length>1?'s':''})</div>
            <div style={{ flex:1,height:1,background:border }}/>
            {aiPlans.length>1 && <button onClick={saveAllPlans} style={{ padding:'7px 16px',background:accent,border:'none',borderRadius:8,color:'#000',fontWeight:700,fontSize:'.8rem',cursor:'pointer',fontFamily:'inherit' }}>+ Save All</button>}
          </div>
          {aiPlans.map((plan,i)=>{
            const priCfg=PRI[plan.priority as keyof typeof PRI]||PRI.medium;
            const totalMins=plan.subtasks.reduce((a,s)=>a+s.estimatedMins,0)||plan.estimatedMins;
            const fmtM=(m:number)=>m<60?`${m}m`:`${(m/60).toFixed(1)}h`;
            return (
              <div key={i} style={{ background:surface,border:`1px solid ${border}`,borderLeft:`3px solid ${priCfg.color}`,borderRadius:10,marginBottom:14,overflow:'hidden',boxShadow:shadow }}>
                <div style={{ padding:'8px 16px',background:panelBg,borderBottom:`1px solid ${border}`,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap' }}>
                  <span style={{ fontSize:'.65rem',fontWeight:800,color:accent,textTransform:'uppercase',letterSpacing:'.1em' }}>✦ AI Plan</span>
                  <span style={{ fontSize:'.7rem',padding:'2px 8px',borderRadius:12,background:priCfg.bg,color:priCfg.color,fontWeight:700 }}>{priCfg.icon} {priCfg.label}</span>
                  <span style={{ fontSize:'.7rem',color:text3 }}>⏱ ~{fmtM(totalMins)}</span>
                  <span style={{ fontSize:'.7rem',color:text3 }}>📅 {new Date(plan.date+'T00:00').toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}</span>
                  {plan.time&&<span style={{ fontSize:'.7rem',color:text3 }}>🕐 {plan.time}</span>}
                </div>
                <div style={{ padding:'16px' }}>
                  <div style={{ fontWeight:700,color:text,fontSize:'1rem',marginBottom:6 }}>{plan.title}</div>
                  {plan.description&&<p style={{ color:text2,fontSize:'.86rem',lineHeight:1.6,marginBottom:14 }}>{plan.description}</p>}
                  {plan.subtasks.length>0&&(
                    <div style={{ marginBottom:14 }}>
                      <div style={{ fontSize:'.67rem',color:text3,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:8 }}>Steps</div>
                      {plan.subtasks.map((s,j)=>(
                        <div key={j} style={{ display:'flex',alignItems:'flex-start',gap:10,padding:'6px 0',borderBottom:j<plan.subtasks.length-1?`1px solid ${border}`:'none' }}>
                          <span style={{ fontSize:'.7rem',color:text3,minWidth:20,textAlign:'right',paddingTop:2 }}>{j+1}</span>
                          <div style={{ width:12,height:12,borderRadius:3,border:`1.5px solid ${inputBdr}`,flexShrink:0,marginTop:3 }}/>
                          <span style={{ flex:1,color:text2,fontSize:'.85rem',lineHeight:1.5 }}>{s.text}</span>
                          <span style={{ fontSize:'.7rem',color:text3,whiteSpace:'nowrap' }}>{s.estimatedMins}m</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {plan.notes&&(
                    <div style={{ background:panelBg,border:`1px solid ${border}`,borderRadius:8,padding:'10px 14px',marginBottom:14 }}>
                      <div style={{ fontSize:'.65rem',color:accent,marginBottom:4,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em' }}>📝 Notes</div>
                      <p style={{ color:text2,fontSize:'.83rem',lineHeight:1.6,whiteSpace:'pre-wrap',margin:0 }}>{plan.notes}</p>
                    </div>
                  )}
                  {plan.tags.length>0&&(
                    <div style={{ display:'flex',gap:6,flexWrap:'wrap',marginBottom:14 }}>
                      {plan.tags.map(t=><span key={t} style={{ fontSize:'.67rem',padding:'2px 8px',borderRadius:12,background:surface2,color:text3,border:`1px solid ${border}` }}>#{t}</span>)}
                    </div>
                  )}
                  <button onClick={()=>savePlan(plan,i)} disabled={saving===i} style={{ padding:'9px 22px',background:accent,border:'none',borderRadius:8,color:'#000',fontWeight:700,cursor:'pointer',fontFamily:'inherit',fontSize:'.84rem',opacity:saving===i?.6:1,transition:'.2s' }}>
                    {saving===i?'Saving…':'+ Add to My Plans'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {events.length>0&&aiPlans.length===0&&!aiLoading&&(
        <div>
          <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:12 }}>
            <div style={{ fontSize:'.72rem',fontWeight:700,color:text3,textTransform:'uppercase',letterSpacing:'.1em' }}>Saved plans</div>
            <div style={{ flex:1,height:1,background:border }}/>
            <button onClick={()=>setView('all')} style={{ background:'none',border:'none',color:accent,fontSize:'.78rem',cursor:'pointer',fontFamily:'inherit',fontWeight:600 }}>See all →</button>
          </div>
          {events.slice(0,3).map(e=><EventCard key={e.id} e={e}/>)}
        </div>
      )}
    </div>
  );

  /* ─── Main render ─────────────────────────────────── */
  return (
    <div style={{ display:'flex',flexDirection:'column',gap:0 }}>

      {/* Header */}
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
        <div>
          <h3 style={{ color:text,fontFamily:'Orbitron,monospace',fontSize:'1.05rem',marginBottom:4 }}>{label}</h3>
          <p style={{ color:text3,fontSize:'.82rem' }}>{openToday} open today · {futureEvs.length} upcoming · {events.filter(e=>!e.done).length} total open</p>
        </div>
        <div style={{ display:'flex',gap:8 }}>
          <div style={{ display:'flex',background:surface2,border:`1px solid ${border}`,borderRadius:8,overflow:'hidden' }}>
            {([['today','☀️ Today'],['ai','✦ AI Planner'],['all','☰ All Plans']] as const).map(([v,lbl])=>(
              <button key={v} onClick={()=>setView(v)} style={{ padding:'8px 14px',background:view===v?accent:'transparent',border:'none',color:view===v?'#000':text2,cursor:'pointer',fontFamily:'inherit',fontSize:'.8rem',fontWeight:700,whiteSpace:'nowrap' }}>{lbl}</button>
            ))}
          </div>
          <button onClick={()=>setShowAdd(p=>!p)} style={{ padding:'8px 14px',background:'transparent',border:`1px solid ${border}`,borderRadius:8,color:text2,fontWeight:600,fontSize:'.8rem',cursor:'pointer' }}>+ Manual</button>
        </div>
      </div>

      {/* Manual add form */}
      {showAdd&&(
        <div style={{ background:surface,border:`1px solid ${border}`,borderRadius:12,padding:20,marginBottom:20,boxShadow:shadow }}>
          <div style={{ fontSize:'.78rem',fontWeight:700,color:accent,textTransform:'uppercase',letterSpacing:'.1em',marginBottom:14 }}>Add Plan Manually</div>
          <div style={{ display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:10,marginBottom:10 }}>
            <div>
              <label style={{ fontSize:'.66rem',color:text3,display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.07em' }}>Title *</label>
              <input value={newEv.title} onChange={e=>setNewEv(p=>({...p,title:e.target.value}))} placeholder="What to do?" style={inp}/>
            </div>
            <div>
              <label style={{ fontSize:'.66rem',color:text3,display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.07em' }}>Date</label>
              <input type="date" value={newEv.date} onChange={e=>setNewEv(p=>({...p,date:e.target.value}))} style={{...inp,colorScheme:isDark?'dark':'light'}}/>
            </div>
            <div>
              <label style={{ fontSize:'.66rem',color:text3,display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.07em' }}>Time</label>
              <input type="time" value={newEv.time} onChange={e=>setNewEv(p=>({...p,time:e.target.value}))} style={{...inp,colorScheme:isDark?'dark':'light'}}/>
            </div>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:10 }}>
            <div>
              <label style={{ fontSize:'.66rem',color:text3,display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.07em' }}>Type</label>
              <select value={newEv.eventType} onChange={e=>setNewEv(p=>({...p,eventType:e.target.value}))} style={{...inp,appearance:'none' as any}}>
                {['work','study','meeting','personal','exam','project','health','deadline'].map(t=><option key={t} value={t}>{TYPE_EMOJI[t]||'📌'} {t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:'.66rem',color:text3,display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.07em' }}>Priority</label>
              <select value={newEv.priority} onChange={e=>setNewEv(p=>({...p,priority:e.target.value}))} style={{...inp,appearance:'none' as any}}>
                {Object.entries(PRI).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:'.66rem',color:text3,display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.07em' }}>Est. (min)</label>
              <input type="number" min={5} step={5} value={newEv.estimatedMins} onChange={e=>setNewEv(p=>({...p,estimatedMins:+e.target.value}))} style={inp}/>
            </div>
          </div>
          <div style={{ marginBottom:10 }}>
            <label style={{ fontSize:'.66rem',color:text3,display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.07em' }}>Notes</label>
            <textarea value={newEv.notes} onChange={e=>setNewEv(p=>({...p,notes:e.target.value}))} rows={2} placeholder="Notes..." style={{...inp,resize:'vertical'}}/>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:'.66rem',color:text3,display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'.07em' }}>Steps</label>
            {newEv.subtasks.map(s=>(
              <div key={s.id} style={{ display:'flex',gap:8,marginBottom:4,alignItems:'center' }}>
                <span style={{ flex:1,color:text2,fontSize:'.84rem' }}>{s.text}</span>
                <button onClick={()=>setNewEv(p=>({...p,subtasks:p.subtasks.filter(x=>x.id!==s.id)}))} style={{ background:'none',border:'none',color:text3,cursor:'pointer' }}>✕</button>
              </div>
            ))}
            <input value={newSubtask} onChange={e=>setNewSubtask(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter'&&newSubtask.trim()){ setNewEv(p=>({...p,subtasks:[...p.subtasks,{id:Date.now().toString(),text:newSubtask.trim(),done:false}]})); setNewSubtask(''); }}}
              placeholder="Add step (press Enter)" style={inp}/>
          </div>
          <div style={{ display:'flex',gap:10,justifyContent:'flex-end' }}>
            <button onClick={()=>setShowAdd(false)} style={{ padding:'8px 18px',background:'transparent',border:`1px solid ${border}`,borderRadius:8,color:text2,cursor:'pointer',fontFamily:'inherit' }}>Cancel</button>
            <button onClick={addManual} disabled={addLoading} style={{ padding:'8px 22px',background:accent,border:'none',borderRadius:8,color:'#000',fontWeight:700,cursor:'pointer',fontFamily:'inherit',opacity:addLoading?.6:1 }}>{addLoading?'Saving…':'Save Plan'}</button>
          </div>
        </div>
      )}

      {view==='today' && <TodayView/>}
      {view==='ai'    && <AIView/>}
      {view==='all'   && <AllView/>}
    </div>
  );
}