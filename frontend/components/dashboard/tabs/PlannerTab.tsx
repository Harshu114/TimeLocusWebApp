'use client';
// components/dashboard/tabs/PlannerTab.tsx
// Advanced planner: Smart Auto-Scheduling, Time-Blocking, Energy Planning,
// Habit Tracking, Goals, Quick-Capture Inbox, Repeating Tasks, AI Planning,
// Monthly/Weekly Calendar, Gantt Chart, Templates, Personal Development

import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../../lib/api';
import { PLANNER_TYPE_COLOR } from '../../../lib/constants';
import { useTheme } from '../../../lib/ThemeContext';
import { CalendarView, WeekView } from './planner/CalendarView';
import { TemplatesView } from './planner/TemplatesView';
import { PersonalView } from './planner/PersonalView';
import { NotesView } from './planner/NotesView';

/* ── Types ─────────────────────────────────────────── */
interface SubTask { id: string; text: string; done: boolean; estimatedMins?: number; }
interface RichEvent {
  id: string; title: string; description?: string; date: string; time?: string;
  eventType: string; done: boolean; priority?: string; notes?: string;
  subtasksJson?: string; tagsJson?: string; estimatedMins?: number;
  aiGenerated?: boolean; energy?: string; recurring?: string; endTime?: string;
  subtasks?: SubTask[]; tags?: string[];
}
interface InboxItem { id: string; text: string; captured: string; }
interface Habit { id: string; name: string; emoji: string; color: string; streak: number; log: string[]; }
interface Goal { id: string; title: string; period: 'yearly' | 'quarterly' | 'monthly'; progress: number; target: number; unit: string; color: string; }
interface TimeBlock { id: string; label: string; startHour: number; endHour: number; color: string; energy: 'peak' | 'normal' | 'low'; }
interface AIPlan { title: string; description: string; date: string; time: string; eventType: string; priority: string; estimatedMins: number; subtasks: { text: string; estimatedMins: number }[]; notes: string; tags: string[]; }

const PRI: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  low: { label: 'Low', color: '#00c97a', bg: 'rgba(0,201,122,.10)', icon: '▽' },
  medium: { label: 'Medium', color: '#f0b429', bg: 'rgba(240,180,41,.10)', icon: '◇' },
  high: { label: 'High', color: '#f07033', bg: 'rgba(240,112,51,.10)', icon: '△' },
  critical: { label: 'Critical', color: '#e8334a', bg: 'rgba(232,51,74,.10)', icon: '⚠' },
};
const ENERGY: Record<string, { label: string; color: string; icon: string; desc: string }> = {
  peak: { label: 'Peak', color: '#00dcff', icon: '⚡', desc: 'Deep focus' },
  normal: { label: 'Normal', color: '#00ff88', icon: '🌿', desc: 'Meetings' },
  low: { label: 'Low', color: '#ffcc00', icon: '🌙', desc: 'Admin' },
};
const TYPE_EMOJI: Record<string, string> = { work: '💼', study: '📚', meeting: '🤝', personal: '🌱', deadline: '🔥', health: '💪', exam: '🎓', project: '🚀', review: '🔍' };
const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtMins = (m?: number) => !m ? '' : m < 60 ? `${m}m` : `${Math.floor(m / 60)}h${m % 60 ? `${m % 60}m` : ''}`;
const parseEv = (e: RichEvent): RichEvent => ({ ...e, subtasks: (() => { try { return e.subtasksJson ? JSON.parse(e.subtasksJson) : []; } catch { return []; } })(), tags: (() => { try { return e.tagsJson ? JSON.parse(e.tagsJson) : []; } catch { return []; } })() });
const ls = (k: string, d: any) => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? d; } catch { return d; } };
const lsSet = (k: string, v: any) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } };

/* ─────────────────────────────────────────────────── */
export default function PlannerTab({ accent, label, user }: { accent: string; label: string; user: any }) {
  const { isDark } = useTheme();

  const [events, setEvents] = useState<RichEvent[]>([]);
  const [view, setView] = useState<'today' | 'calendar' | 'week' | 'schedule' | 'ai' | 'habits' | 'notes' | 'templates' | 'personal'>('today');
  const [isEditingBlocks, setIsEditingBlocks] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editNotes, setEditNotes] = useState<string | null>(null);
  const [notesVal, setNotesVal] = useState('');
  const [selectedCanvasGoal, setSelectedCanvasGoal] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [newSub, setNewSub] = useState('');
  const [aiGoal, setAiGoal] = useState('');
  const [aiDate, setAiDate] = useState(todayISO());
  const [aiHours, setAiHours] = useState(2);
  const [aiPlans, setAiPlans] = useState<AIPlan[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [inboxInput, setInboxInput] = useState('');
  const [newHabit, setNewHabit] = useState({ name: '', emoji: '⭐', color: '#00dcff' });
  const [newGoal, setNewGoal] = useState({ title: '', period: 'monthly' as const, target: 10, unit: 'tasks', color: '#00dcff' });
  const [newEv, setNewEv] = useState({ title: '', date: todayISO(), time: '', endTime: '', eventType: 'work', description: '', priority: 'medium', notes: '', estimatedMins: 60, energy: 'normal', recurring: 'none', subtasks: [] as SubTask[] });

  const [inbox, setInbox] = useState<InboxItem[]>(() => ls('tl_inbox', []));
  const [habits, setHabits] = useState<Habit[]>(() => ls('tl_habits', []));
  const [goals, setGoals] = useState<Goal[]>(() => ls('tl_goals', []));
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>(() => ls('tl_tblocks', [
    { id: '1', label: 'Deep Work', startHour: 6, endHour: 10, color: '#00dcff', energy: 'peak' },
    { id: '2', label: 'Collaboration', startHour: 10, endHour: 13, color: '#8c3cff', energy: 'normal' },
    { id: '3', label: 'Personal', startHour: 13, endHour: 15, color: '#ff6b35', energy: 'low' },
    { id: '4', label: 'Focus Block', startHour: 15, endHour: 18, color: '#00ff88', energy: 'peak' },
    { id: '5', label: 'Wind Down', startHour: 18, endHour: 22, color: '#ffcc00', energy: 'low' },
  ]));

  /* ── Theme tokens ── */
  const t = isDark ? '#fff' : '#1a2340';
  const t2 = isDark ? 'rgba(255,255,255,.6)' : '#4a5680';
  const t3 = isDark ? 'rgba(255,255,255,.32)' : '#8090b0';
  const sf = isDark ? 'rgba(255,255,255,.04)' : '#fff';
  const br = isDark ? 'rgba(255,255,255,.09)' : 'rgba(100,130,200,.18)';
  const s2 = isDark ? 'rgba(255,255,255,.06)' : 'rgba(230,238,255,.75)';
  const ib = isDark ? 'rgba(255,255,255,.07)' : '#fff';
  const id = isDark ? 'rgba(255,255,255,.12)' : 'rgba(100,130,200,.28)';
  const sh = isDark ? 'none' : '0 2px 16px rgba(100,130,200,.09)';
  const pb = isDark ? 'rgba(255,255,255,.025)' : 'rgba(240,245,255,.85)';
  const inp = useMemo(() => ({ background: ib, border: `1px solid ${id}`, borderRadius: 8, padding: '9px 13px', color: t, fontFamily: 'inherit', fontSize: '.88rem', outline: 'none', width: '100%', boxSizing: 'border-box' as const }), [ib, id, t]);

  /* ── Persist ── */
  const saveInbox = (v: InboxItem[]) => { setInbox(v); lsSet('tl_inbox', v); };
  const saveHabits = (v: Habit[]) => { setHabits(v); lsSet('tl_habits', v); };
  const saveGoals = (v: Goal[]) => { setGoals(v); lsSet('tl_goals', v); };
  const saveBlocks = (v: TimeBlock[]) => { setTimeBlocks(v); lsSet('tl_tblocks', v); };

  /* ── Load events ── */
  const load = useCallback(async () => { try { const r = await api('/planner'); if (r.ok) setEvents((await r.json()).map(parseEv)); } catch { } }, []);
  useEffect(() => { load(); }, [load]);

  /* ── Virtual Canvas Events ── */
  const [virtualEvs, setVirtualEvs] = useState<RichEvent[]>([]);
  useEffect(() => {
    try {
      const v: RichEvent[] = [];
      const now = new Date();
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('tl_canvas_nodes_')) {
          const arr = JSON.parse(localStorage.getItem(key) || '[]');
          const dailies = arr.filter((x: any) => x.data?.goalType === 'daily');
          if (dailies.length > 0) {
            dailies.forEach((n: any) => {
              for (let d = -30; d < 60; d++) {
                const date = new Date(now);
                date.setDate(now.getDate() + d);
                v.push({
                  id: `v-${n.id}-${d}`,
                  title: `🔁 ${n.data.label}`,
                  date: date.toISOString().slice(0, 10),
                  eventType: 'habit',
                  done: false
                });
              }
            });
          }
        }
      }
      setVirtualEvs(v);
    } catch { }
  }, [view, selectedCanvasGoal]);

  /* ── Derived ── */
  const expandedEvents = useMemo(() => {
    const list: RichEvent[] = [...events];
    const now = new Date();
    events.forEach(e => {
      if (!e.recurring || e.recurring === 'none') return;
      // Project 60 days into future
      for (let i = 1; i <= 60; i++) {
        const d = new Date(e.date + 'T00:00');
        if (e.recurring === 'daily') d.setDate(d.getDate() + i);
        else if (e.recurring === 'weekly') d.setDate(d.getDate() + i * 7);
        else if (e.recurring === 'monthly') d.setMonth(d.getMonth() + i);

        list.push({ ...e, id: `${e.id}-r${i}`, date: d.toISOString().slice(0, 10), recurring: 'none' });
      }
    });
    return list;
  }, [events]);

  const combinedEvents = [...expandedEvents, ...virtualEvs];
  const todayStr = todayISO();
  const todayEvs = combinedEvents.filter(e => e.date === todayStr).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const futureEvs = combinedEvents.filter(e => e.date > todayStr);
  const pastEvs = combinedEvents.filter(e => e.date < todayStr);
  const openToday = todayEvs.filter(e => !e.done).length;
  const doneToday = todayEvs.filter(e => e.done).length;
  const allSubs = todayEvs.reduce((a, e) => a + (e.subtasks?.length || 0), 0);
  const doneSubs = todayEvs.reduce((a, e) => a + (e.subtasks?.filter(s => s.done).length || 0), 0);

  /* ── API actions ── */
  const toggleEvent = async (id: string) => { try { await api(`/planner/${id}/toggle`, { method: 'PATCH' }); load(); } catch { } };
  const toggleSubtask = async (eid: string, sid: string) => { try { await api(`/planner/${eid}/subtask/${sid}`, { method: 'PATCH' }); load(); } catch { } };
  const deleteEvent = async (id: string) => { try { await api(`/planner/${id}`, { method: 'DELETE' }); load(); } catch { } };
  const saveNotesFn = async (id: string) => { try { await api(`/planner/${id}`, { method: 'PATCH', body: JSON.stringify({ notes: notesVal }) }); setEditNotes(null); load(); } catch { } };
  const toggleExp = (id: string) => setExpanded(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  /* ── Auto-schedule ── */
  const autoSchedule = async () => {
    const open = events.filter(e => !e.done && !e.time && e.estimatedMins && e.date <= todayStr);
    let cursor = 9;
    for (const ev of open) {
      const h = String(Math.floor(cursor)).padStart(2, '0'), m = String(Math.round((cursor % 1) * 60)).padStart(2, '0');
      await api(`/planner/${ev.id}`, { method: 'PATCH', body: JSON.stringify({ time: `${h}:${m}` }) });
      cursor += (ev.estimatedMins!) / 60;
      if (cursor >= 18) break;
    }
    load();
  };

  /* ── AI ── */
  const buildPrompt = (g: string, d: string, h: number) =>
    `Create a plan for: "${g}"\nDate: ${d}. Budget: ${h * 60} minutes.\nReturn JSON array of 1-3 tasks: {"title":"...","description":"one sentence","date":"${d}","time":"HH:MM","eventType":"study","priority":"medium","estimatedMins":60,"subtasks":[{"text":"step","estimatedMins":15}],"notes":"tips","tags":["tag"]}\npriority: low|medium|high|critical. Output ONLY the JSON array.`;

  const extractJSON = (raw: string): AIPlan[] => { const text = raw.replace(/```json|```/gi, '').trim(); try { const a = JSON.parse(text); if (Array.isArray(a)) return a; } catch { } const s = text.indexOf('['), e = text.lastIndexOf(']'); if (s !== -1 && e > s) { try { const a = JSON.parse(text.slice(s, e + 1)); if (Array.isArray(a)) return a; } catch { } } return []; };

  const generatePlan = async () => {
    if (!aiGoal.trim()) return;
    setAiLoading(true); setAiError(''); setAiPlans([]);
    try {
      const res = await api('/ai/chat', { method: 'POST', body: JSON.stringify({ message: buildPrompt(aiGoal, aiDate, aiHours), context: 'planner' }) });
      const d = await res.json(); const plans = extractJSON(d.reply || '');
      if (!plans.length) { setAiPlans([{ title: aiGoal, description: `Plan: ${aiGoal}`, date: aiDate, time: '09:00', eventType: 'work', priority: 'medium', estimatedMins: aiHours * 60, subtasks: [{ text: 'Setup & review', estimatedMins: 15 }, { text: 'Main work block', estimatedMins: Math.round(aiHours * 60 * 0.65) }, { text: 'Wrap up', estimatedMins: 15 }], notes: 'AI template — edit as needed.', tags: ['plan'] }]); setAiError('AI returned plain text — here is a starter template.'); }
      else setAiPlans(plans.map(p => ({ ...p, priority: ['low', 'medium', 'high', 'critical'].includes(p.priority) ? p.priority : 'medium', estimatedMins: Number(p.estimatedMins) || 60, subtasks: Array.isArray(p.subtasks) ? p.subtasks : [], tags: Array.isArray(p.tags) ? p.tags : [] })));
    } catch (e: any) { setAiError(`Error: ${e.message}`); }
    finally { setAiLoading(false); }
  };

  const savePlan = async (plan: AIPlan, idx: number) => {
    setSavingIdx(idx);
    try { await api('/planner', { method: 'POST', body: JSON.stringify({ title: plan.title, description: plan.description, date: plan.date, time: plan.time, eventType: plan.eventType, priority: plan.priority, notes: plan.notes, estimatedMins: plan.estimatedMins, aiGenerated: true, subtasksJson: JSON.stringify(plan.subtasks.map((s, i) => ({ id: `s${Date.now()}${i}`, text: s.text, done: false, estimatedMins: s.estimatedMins }))), tagsJson: JSON.stringify(plan.tags) }) }); load(); setAiPlans(p => p.filter((_, i) => i !== idx)); }
    catch { } finally { setSavingIdx(null); }
  };

  const addManual = async () => {
    if (!newEv.title.trim()) return; setAddLoading(true);
    try { await api('/planner', { method: 'POST', body: JSON.stringify({ ...newEv, subtasksJson: JSON.stringify(newEv.subtasks), tagsJson: '[]' }) }); setNewEv({ title: '', date: todayISO(), time: '', endTime: '', eventType: 'work', description: '', priority: 'medium', notes: '', estimatedMins: 60, energy: 'normal', recurring: 'none', subtasks: [] }); setShowAdd(false); load(); }
    catch { } finally { setAddLoading(false); }
  };

  /* ── Habit helpers ── */
  const calcStreak = (log: string[]) => { let s = 0, d = new Date(); while (true) { const ds = d.toISOString().slice(0, 10); if (!log.includes(ds)) break; s++; d.setDate(d.getDate() - 1); } return s; };
  const logHabit = (hid: string, day: string) => { saveHabits(habits.map(h => { if (h.id !== hid) return h; const a = h.log.includes(day); const nl = a ? h.log.filter(d => d !== day) : [...h.log, day]; return { ...h, log: nl, streak: calcStreak(nl) }; })); };
  const last7 = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); return d.toISOString().slice(0, 10); });

  /* ─── EVENT CARD ─── */
  const renderEventCard = (e: RichEvent, compact: boolean = false) => {
    const subs = e.subtasks || []; const done = subs.filter(s => s.done).length;
    const prog = subs.length > 0 ? Math.round((done / subs.length) * 100) : e.done ? 100 : 0;
    const pc = PRI[e.priority || 'medium'] || PRI.medium;
    const tc = PLANNER_TYPE_COLOR[e.eventType] || '#888';
    const ec = ENERGY[(e.energy || 'normal')] || ENERGY.normal;
    const isExp = expanded.has(e.id); const isEd = editNotes === e.id;

    return (
      <div key={e.id} style={{ background: sf, borderTop: `1px solid ${br}`, borderRight: `1px solid ${br}`, borderBottom: `1px solid ${br}`, borderLeft: `3px solid ${pc.color}`, borderRadius: 10, marginBottom: 8, overflow: 'hidden', boxShadow: sh, opacity: e.done ? .6 : 1, transition: 'opacity .2s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: compact ? '9px 14px' : '12px 16px' }}>
          <div onClick={() => toggleEvent(e.id)} style={{ width: 20, height: 20, borderRadius: 5, flexShrink: 0, border: `2px solid ${e.done ? accent : id}`, background: e.done ? accent : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '.2s' }}>
            {e.done && <svg width="11" height="11" viewBox="0 0 10 10"><polyline points="1,5 4,8 9,2" stroke={isDark ? '#000' : '#fff'} strokeWidth="2.5" fill="none" /></svg>}
          </div>
          <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => toggleExp(e.id)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginBottom: subs.length > 0 ? 4 : 0 }}>
              <span>{TYPE_EMOJI[e.eventType] || '📌'}</span>
              {e.aiGenerated && <span style={{ fontSize: '.6rem', padding: '1px 5px', borderRadius: 10, background: `${accent}22`, color: accent, fontWeight: 800 }}>✦AI</span>}
              {e.recurring && e.recurring !== 'none' && <span style={{ fontSize: '.6rem', padding: '1px 5px', borderRadius: 10, background: 'rgba(140,60,255,.15)', color: '#8c3cff', fontWeight: 700 }}>↻</span>}
              <span style={{ fontWeight: 600, color: t, fontSize: '.9rem', textDecoration: e.done ? 'line-through' : 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {e.time && <span style={{ fontSize: '.7rem', color: t3 }}>🕐 {e.time}{e.endTime ? ` – ${e.endTime}` : ''}</span>}
              {e.estimatedMins && <span style={{ fontSize: '.7rem', color: t3 }}>⏱ {fmtMins(e.estimatedMins)}</span>}
              <span style={{ fontSize: '.65rem', padding: '1px 6px', borderRadius: 12, background: `${tc}18`, color: tc, fontWeight: 600 }}>{e.eventType}</span>
              <span style={{ fontSize: '.65rem', padding: '1px 6px', borderRadius: 12, background: pc.bg, color: pc.color, fontWeight: 700 }}>{pc.icon} {pc.label}</span>
              <span style={{ fontSize: '.65rem', color: ec.color }} title={ec.desc}>{ec.icon}</span>
              {subs.length > 0 && <span style={{ fontSize: '.68rem', color: prog === 100 ? '#00c97a' : t3 }}>{done}/{subs.length} {prog === 100 ? '✓' : ''}</span>}
            </div>
            {subs.length > 0 && <div style={{ marginTop: 4, height: 3, background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(100,130,200,.10)', borderRadius: 2, overflow: 'hidden' }}><div style={{ height: '100%', width: `${prog}%`, background: prog === 100 ? '#00c97a' : accent, borderRadius: 2, transition: '.4s' }} /></div>}
          </div>
          <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
            <button onClick={() => toggleExp(e.id)} style={{ background: 'none', border: `1px solid ${br}`, borderRadius: 6, color: t3, cursor: 'pointer', padding: '3px 7px', fontSize: '.72rem' }}>{isExp ? '▴' : '▾'}</button>
            <button onClick={() => deleteEvent(e.id)} style={{ background: 'none', border: 'none', color: isDark ? 'rgba(255,255,255,.18)' : 'rgba(100,130,200,.3)', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
          </div>
        </div>

        {isExp && (
          <div style={{ borderTop: `1px solid ${br}`, padding: '12px 16px 14px 46px' }}>
            {e.description && <p style={{ color: t2, fontSize: '.85rem', lineHeight: 1.65, marginBottom: 10 }}>{e.description}</p>}
            {(e.tags || []).length > 0 && <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>{(e.tags || []).map(tg => <span key={tg} style={{ fontSize: '.65rem', padding: '2px 7px', borderRadius: 12, background: s2, color: t3, border: `1px solid ${br}` }}>#{tg}</span>)}</div>}
            {subs.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: '.66rem', fontWeight: 700, color: t3, textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: 7 }}>Steps — {done}/{subs.length} ({prog}%)</div>
                {subs.map((s, i) => (
                  <div key={s.id} onClick={() => toggleSubtask(e.id, s.id)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 7, marginBottom: 3, cursor: 'pointer', background: s.done ? (isDark ? 'rgba(0,201,122,.06)' : 'rgba(0,201,122,.04)') : 'transparent', border: `1px solid ${s.done ? 'rgba(0,201,122,.18)' : br}`, transition: '.18s' }}>
                    <div style={{ width: 17, height: 17, borderRadius: 4, flexShrink: 0, border: `2px solid ${s.done ? '#00c97a' : id}`, background: s.done ? '#00c97a' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '.2s' }}>
                      {s.done && <svg width="9" height="9" viewBox="0 0 10 10"><polyline points="1,5 4,8 9,2" stroke={isDark ? '#000' : '#fff'} strokeWidth="2.5" fill="none" /></svg>}
                    </div>
                    <span style={{ flex: 1, color: s.done ? t3 : t2, fontSize: '.84rem', textDecoration: s.done ? 'line-through' : 'none' }}>{s.text}</span>
                    {s.estimatedMins && <span style={{ fontSize: '.68rem', color: t3 }}>{s.estimatedMins}m</span>}
                  </div>
                ))}
              </div>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{ fontSize: '.66rem', fontWeight: 700, color: t3, textTransform: 'uppercase', letterSpacing: '.09em' }}>📝 Notes</span>
                <button onClick={() => { if (isEd) saveNotesFn(e.id); else { setEditNotes(e.id); setNotesVal(e.notes || ''); } }} style={{ background: 'none', border: `1px solid ${br}`, borderRadius: 5, color: accent, cursor: 'pointer', fontSize: '.68rem', padding: '2px 8px', fontFamily: 'inherit', fontWeight: 600 }}>{isEd ? 'Save' : 'Edit'}</button>
                {isEd && <button onClick={() => setEditNotes(null)} style={{ background: 'none', border: 'none', color: t3, cursor: 'pointer', fontSize: '.68rem', fontFamily: 'inherit' }}>Cancel</button>}
              </div>
              {isEd ? <textarea value={notesVal} onChange={e => setNotesVal(e.target.value)} rows={3} autoFocus style={{ ...inp, resize: 'vertical', fontSize: '.84rem', lineHeight: 1.6 }} />
                : e.notes ? <div style={{ background: pb, border: `1px solid ${br}`, borderRadius: 8, padding: '9px 13px' }}><p style={{ color: t2, fontSize: '.83rem', lineHeight: 1.65, whiteSpace: 'pre-wrap', margin: 0 }}>{e.notes}</p></div>
                  : <button onClick={() => { setEditNotes(e.id); setNotesVal(''); }} style={{ background: 'none', border: `1px dashed ${br}`, borderRadius: 8, padding: '7px 13px', color: t3, cursor: 'pointer', fontSize: '.8rem', fontFamily: 'inherit', width: '100%', textAlign: 'left' }}>+ Add planning notes…</button>}
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ─── VIEWS ─── */
  const renderTodayView = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
        {[{ icon: '✅', val: `${doneToday}/${todayEvs.length}`, label: 'Tasks', col: accent }, { icon: '🔥', val: `${openToday}`, label: 'Open', col: openToday > 0 ? '#f07033' : '#00c97a' }, { icon: '📋', val: `${doneSubs}/${allSubs}`, label: 'Steps', col: accent }, { icon: '⏱', val: fmtMins(todayEvs.reduce((a, e) => a + (e.estimatedMins || 0), 0)) || '0m', label: 'Planned', col: t2 }].map((s, i) => (
          <div key={i} style={{ background: sf, border: `1px solid ${br}`, borderRadius: 10, padding: '12px 14px', boxShadow: sh }}>
            <div style={{ fontSize: '1rem', marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: s.col, marginBottom: 1 }}>{s.val}</div>
            <div style={{ fontSize: '.67rem', color: t3, textTransform: 'uppercase', letterSpacing: '.07em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {todayEvs.length > 0 && (
        <div style={{ background: sf, border: `1px solid ${br}`, borderRadius: 10, padding: '11px 15px', marginBottom: 14, boxShadow: sh }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}><span style={{ fontSize: '.75rem', fontWeight: 700, color: t2 }}>Today's Progress</span><span style={{ fontSize: '.75rem', color: accent, fontWeight: 700 }}>{allSubs > 0 ? Math.round((doneSubs / allSubs) * 100) : Math.round((doneToday / Math.max(todayEvs.length, 1)) * 100)}%</span></div>
          <div style={{ height: 7, background: isDark ? 'rgba(255,255,255,.07)' : 'rgba(100,130,200,.10)', borderRadius: 4, overflow: 'hidden' }}><div style={{ height: '100%', width: `${allSubs > 0 ? (doneSubs / allSubs) * 100 : (doneToday / Math.max(todayEvs.length, 1)) * 100}%`, background: `linear-gradient(90deg,${accent},#00c97a)`, borderRadius: 4, transition: '.5s' }} /></div>
        </div>
      )}

      {todayEvs.some(e => !e.time && e.estimatedMins) && (
        <div style={{ background: isDark ? 'rgba(0,220,255,.06)' : 'rgba(0,220,255,.06)', border: `1px solid ${accent}33`, borderRadius: 10, padding: '11px 15px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div><div style={{ fontSize: '.77rem', fontWeight: 700, color: accent, marginBottom: 2 }}>⚡ Smart Auto-Schedule</div><div style={{ fontSize: '.73rem', color: t3 }}>{todayEvs.filter(e => !e.time && e.estimatedMins).length} tasks without a time slot — auto-place them in your day</div></div>
          <button onClick={autoSchedule} style={{ padding: '7px 16px', background: accent, border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '.8rem', flexShrink: 0 }}>Auto-Schedule</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {Object.entries(ENERGY).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px', background: s2, border: `1px solid ${br}`, borderRadius: 20, fontSize: '.68rem', color: t3 }}>
            <span style={{ color: v.color }}>{v.icon}</span><span>{v.label}</span><span>·</span><span>{v.desc}</span>
          </div>
        ))}
      </div>

      {todayEvs.length === 0 ? <div style={{ textAlign: 'center', padding: '34px 20px', color: t3 }}><div style={{ fontSize: '2rem', marginBottom: 10 }}>☀️</div><div style={{ fontSize: '.9rem', color: t2, marginBottom: 10 }}>Nothing planned yet</div><button onClick={() => setView('ai')} style={{ padding: '8px 20px', background: accent, border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '.84rem' }}>✦ Generate Plan</button></div>
        : <>{todayEvs.map(e => renderEventCard(e))}</>}

      {futureEvs.length > 0 && <div style={{ marginTop: 18 }}><div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}><div style={{ fontSize: '.68rem', fontWeight: 700, color: t3, textTransform: 'uppercase', letterSpacing: '.12em' }}>Upcoming</div><div style={{ flex: 1, height: 1, background: br }} /><button onClick={() => setView('schedule')} style={{ background: 'none', border: 'none', color: accent, fontSize: '.74rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>All →</button></div>{futureEvs.slice(0, 3).map(e => renderEventCard(e, true))}</div>}
    </div>
  );

  const renderScheduleView = () => (
    <div>
      <div style={{ background: sf, border: `1px solid ${br}`, borderRadius: 12, padding: 16, marginBottom: 18, boxShadow: sh }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: '.76rem', fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '.1em' }}>⚡ Visual Time-Blocking</div>
          <button onClick={() => setIsEditingBlocks(!isEditingBlocks)} style={{ background: s2, border: `1px solid ${br}`, borderRadius: 6, padding: '4px 10px', color: accent, cursor: 'pointer', fontSize: '.7rem', fontWeight: 700 }}>
            {isEditingBlocks ? 'Done Editing' : 'Manage Blocks'}
          </button>
        </div>

        {isEditingBlocks ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 15 }}>
            {timeBlocks.map((b, idx) => (
              <div key={b.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 40px', gap: 8, alignItems: 'center', background: pb, padding: 8, borderRadius: 8, border: `1px solid ${br}` }}>
                <input value={b.label} onChange={e => { const nb = [...timeBlocks]; nb[idx].label = e.target.value; saveBlocks(nb); }} style={{ ...inp, padding: '6px 10px' }} />
                <input type="number" value={b.startHour} onChange={e => { const nb = [...timeBlocks]; nb[idx].startHour = +e.target.value; saveBlocks(nb); }} style={{ ...inp, padding: '6px 10px' }} />
                <input type="number" value={b.endHour} onChange={e => { const nb = [...timeBlocks]; nb[idx].endHour = +e.target.value; saveBlocks(nb); }} style={{ ...inp, padding: '6px 10px' }} />
                <select value={b.energy} onChange={e => { const nb = [...timeBlocks]; nb[idx].energy = e.target.value as any; saveBlocks(nb); }} style={{ ...inp, padding: '6px 10px', appearance: 'none' }}>
                  <option value="peak">Peak</option><option value="normal">Normal</option><option value="low">Low</option>
                </select>
                <button onClick={() => { const nb = timeBlocks.filter((_, i) => i !== idx); saveBlocks(nb); }} style={{ background: 'none', border: 'none', color: '#ff4060', cursor: 'pointer' }}>✕</button>
              </div>
            ))}
            <button onClick={() => saveBlocks([...timeBlocks, { id: Date.now().toString(), label: 'New Block', startHour: 9, endHour: 12, color: accent, energy: 'normal' }])} style={{ padding: '8px', background: sf, border: `1px dashed ${br}`, borderRadius: 8, color: t3, cursor: 'pointer', fontSize: '.8rem' }}>+ Add Block</button>
          </div>
        ) : (
          <>
            <div style={{ position: 'relative', height: 56, background: isDark ? 'rgba(255,255,255,.03)' : 'rgba(100,130,200,.05)', borderRadius: 8, overflow: 'hidden', marginBottom: 10 }}>
              {timeBlocks.map(b => { const l = ((b.startHour - 6) / 18) * 100, w = ((b.endHour - b.startHour) / 18) * 100; return <div key={b.id} title={`${b.label}: ${b.startHour}:00–${b.endHour}:00`} style={{ position: 'absolute', left: `${l}%`, width: `${w}%`, top: 0, bottom: 0, background: `${b.color}33`, borderLeft: `2px solid ${b.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}><span style={{ fontSize: '.6rem', fontWeight: 700, color: b.color, whiteSpace: 'nowrap', overflow: 'hidden', padding: '0 3px' }}>{b.label}</span></div>; })}
              {[9, 12, 15, 18, 21].map(h => <div key={h} style={{ position: 'absolute', left: `${((h - 6) / 18) * 100}%`, top: 0, bottom: 0, borderLeft: `1px dashed ${br}`, paddingBottom: 2, display: 'flex', alignItems: 'flex-end' }}><span style={{ fontSize: '.54rem', color: t3, paddingLeft: 2 }}>{h}</span></div>)}
            </div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {timeBlocks.map(b => <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px', background: `${b.color}14`, border: `1px solid ${b.color}44`, borderRadius: 20, fontSize: '.7rem' }}><span style={{ color: b.color }}>{ENERGY[b.energy].icon}</span><span style={{ color: t2, fontWeight: 600 }}>{b.label}</span><span style={{ color: t3 }}>{b.startHour}–{b.endHour}</span></div>)}
            </div>
          </>
        )}
      </div>
      {[['Today', todayEvs], ['Upcoming', futureEvs], ['Past', pastEvs]].map(([title, items]) => {
        const evs = items as RichEvent[]; if (!evs.length) return null;
        return <div key={String(title)} style={{ marginBottom: 18 }}><div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}><div style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: t3 }}>{String(title)}</div><div style={{ flex: 1, height: 1, background: br }} /><span style={{ fontSize: '.68rem', color: t3 }}>{evs.length}</span></div>{evs.map(e => renderEventCard(e))}</div>;
      })}
    </div>
  );

  const renderInboxView = () => (
    <div>
      <div style={{ background: sf, border: `1px solid ${br}`, borderRadius: 12, padding: 18, marginBottom: 18, boxShadow: sh }}>
        <div style={{ fontSize: '.76rem', fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>📥 Quick-Capture Inbox</div>
        <p style={{ color: t3, fontSize: '.81rem', marginBottom: 12, lineHeight: 1.5 }}>Dump thoughts instantly — zero friction. Organize and schedule them later.</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <input value={inboxInput} onChange={e => setInboxInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && inboxInput.trim()) { saveInbox([...inbox, { id: Date.now().toString(), text: inboxInput.trim(), captured: new Date().toISOString() }]); setInboxInput(''); } }} placeholder="Capture a thought or task… (Enter)" style={{ ...inp, flex: 1, fontSize: '.9rem' }} />
          <button onClick={() => { if (inboxInput.trim()) { saveInbox([...inbox, { id: Date.now().toString(), text: inboxInput.trim(), captured: new Date().toISOString() }]); setInboxInput(''); } }} style={{ padding: '9px 16px', background: accent, border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Capture</button>
        </div>
      </div>
      {inbox.length === 0 ? <div style={{ textAlign: 'center', padding: '30px 0', color: t3 }}><div style={{ fontSize: '2rem', marginBottom: 8 }}>📥</div><div>Inbox empty — capture your first thought above</div></div>
        : <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}><div style={{ fontSize: '.68rem', fontWeight: 700, color: t3, textTransform: 'uppercase', letterSpacing: '.12em' }}>{inbox.length} captured</div><button onClick={() => saveInbox([])} style={{ background: 'none', border: 'none', color: t3, cursor: 'pointer', fontSize: '.72rem', fontFamily: 'inherit' }}>Clear all</button></div>
          {inbox.map(item => (
            <div key={item.id} style={{ background: sf, border: `1px solid ${br}`, borderRadius: 9, padding: '11px 15px', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 10, boxShadow: sh }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: accent, flexShrink: 0, boxShadow: `0 0 7px ${accent}` }} />
              <span style={{ flex: 1, color: t, fontSize: '.88rem' }}>{item.text}</span>
              <span style={{ fontSize: '.68rem', color: t3, whiteSpace: 'nowrap' }}>{new Date(item.captured).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
              <button onClick={() => { setAiGoal(item.text); setView('ai'); saveInbox(inbox.filter(i => i.id !== item.id)); }} style={{ padding: '3px 9px', background: s2, border: `1px solid ${br}`, borderRadius: 6, color: t2, cursor: 'pointer', fontFamily: 'inherit', fontSize: '.7rem', whiteSpace: 'nowrap' }}>→ Plan</button>
              <button onClick={() => { setNewEv(p => ({ ...p, title: item.text })); setShowAdd(true); saveInbox(inbox.filter(i => i.id !== item.id)); }} style={{ padding: '3px 9px', background: `${accent}18`, border: `1px solid ${accent}44`, borderRadius: 6, color: accent, cursor: 'pointer', fontFamily: 'inherit', fontSize: '.7rem', whiteSpace: 'nowrap' }}>+ Add</button>
              <button onClick={() => saveInbox(inbox.filter(i => i.id !== item.id))} style={{ background: 'none', border: 'none', color: t3, cursor: 'pointer', fontSize: '1rem' }}>✕</button>
            </div>
          ))}
        </div>}
    </div>
  );

  const renderHabitsView = () => (
    <div>
      <div style={{ background: sf, border: `1px solid ${br}`, borderRadius: 12, padding: 16, marginBottom: 18, boxShadow: sh }}>
        <div style={{ fontSize: '.76rem', fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12 }}>🌱 Habit & Goal Tracking — Add New Habit</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input value={newHabit.emoji} onChange={e => setNewHabit(p => ({ ...p, emoji: e.target.value }))} style={{ ...inp, width: 60, textAlign: 'center', fontSize: '1.2rem' }} />
          <input value={newHabit.name} onChange={e => setNewHabit(p => ({ ...p, name: e.target.value }))} placeholder="Habit name (Enter to save)" style={{ ...inp, flex: 1 }} onKeyDown={e => e.key === 'Enter' && newHabit.name.trim() && (saveHabits([...habits, { id: Date.now().toString(), ...newHabit, streak: 0, log: [] }]), setNewHabit({ name: '', emoji: '⭐', color: '#00dcff' }))} />
          <select value={newHabit.color} onChange={e => setNewHabit(p => ({ ...p, color: e.target.value }))} style={{ ...inp, width: 90, appearance: 'none' as any }}>
            {['#00dcff', '#8c3cff', '#00ff88', '#ff6b35', '#ffcc00', '#ff4060'].map(c => <option key={c} value={c} style={{ background: isDark ? '#0e1828' : '#fff' }}>{c}</option>)}
          </select>
          <button onClick={() => { if (newHabit.name.trim()) { saveHabits([...habits, { id: Date.now().toString(), ...newHabit, streak: 0, log: [] }]); setNewHabit({ name: '', emoji: '⭐', color: '#00dcff' }); } }} style={{ padding: '9px 16px', background: accent, border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Add</button>
        </div>
      </div>
      {habits.length === 0 ? <div style={{ textAlign: 'center', padding: '28px 0', color: t3 }}><div style={{ fontSize: '2rem', marginBottom: 8 }}>🌱</div><div>Add your first habit above</div></div>
        : habits.map(h => {
          const tod = h.log.includes(todayStr);
          return <div key={h.id} style={{ background: sf, borderTop: `1px solid ${br}`, borderRight: `1px solid ${br}`, borderBottom: `1px solid ${br}`, borderLeft: `3px solid ${h.color}`, borderRadius: 10, padding: '13px 15px', marginBottom: 9, boxShadow: sh }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 10 }}>
              <div onClick={() => logHabit(h.id, todayStr)} style={{ width: 36, height: 36, borderRadius: 9, border: `2px solid ${tod ? h.color : id}`, background: tod ? `${h.color}22` : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.25rem', transition: '.2s', flexShrink: 0 }}>{h.emoji}</div>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 600, color: t, fontSize: '.9rem' }}>{h.name}</div><div style={{ fontSize: '.72rem', color: h.color, fontWeight: 700 }}>🔥 {h.streak} day streak</div></div>
              <button onClick={() => saveHabits(habits.filter(x => x.id !== h.id))} style={{ background: 'none', border: 'none', color: t3, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              {last7.map(d => { const done = h.log.includes(d), isT = d === todayStr; return <div key={d} title={d} style={{ flex: 1, aspectRatio: '1', borderRadius: 5, background: done ? h.color : (isDark ? 'rgba(255,255,255,.06)' : 'rgba(100,130,200,.10)'), border: isT ? `2px solid ${h.color}` : `2px solid transparent`, cursor: 'pointer', transition: '.18s' }} onClick={() => logHabit(h.id, d)} />; })}
            </div>
            <div style={{ display: 'flex', gap: 3, marginTop: 3 }}>
              {last7.map(d => <div key={d} style={{ flex: 1, textAlign: 'center', fontSize: '.54rem', color: t3 }}>{new Date(d + 'T00:00').toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 1)}</div>)}
            </div>
          </div>;
        })}
    </div>
  );

  const renderGoalsView = () => null;

  const renderAIView = () => (
    <div>
      <div style={{ background: sf, border: `1px solid ${br}`, borderRadius: 14, padding: 20, marginBottom: 18, boxShadow: sh, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${accent},transparent)`, opacity: .5 }} />
        <div style={{ fontSize: '.76rem', fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 4 }}>✦ AI Plan Generator</div>
        <p style={{ color: t3, fontSize: '.81rem', marginBottom: 16, lineHeight: 1.5 }}>Describe your goal — AI creates steps, time estimates, energy tags, and notes.</p>
        <div style={{ marginBottom: 12 }}><label style={{ fontSize: '.64rem', color: t3, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.08em' }}>What do you want to accomplish?</label><textarea value={aiGoal} onChange={e => setAiGoal(e.target.value)} rows={3} placeholder={'e.g. "Prepare for Physics exam"\n"Plan a product launch"\n"Design a morning routine"'} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div><label style={{ fontSize: '.64rem', color: t3, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.08em' }}>Target Date</label><input type="date" value={aiDate} onChange={e => setAiDate(e.target.value)} style={{ ...inp, colorScheme: isDark ? 'dark' : 'light' }} /></div>
          <div><label style={{ fontSize: '.64rem', color: t3, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.08em' }}>Available Time</label><select value={aiHours} onChange={e => setAiHours(+e.target.value)} style={{ ...inp, appearance: 'none' as any }}>{[1, 2, 3, 4, 6, 8].map(h => <option key={h} value={h}>{h} hour{h > 1 ? 's' : ''}</option>)}</select></div>
        </div>
        <div style={{ marginBottom: 16 }}><div style={{ fontSize: '.64rem', color: t3, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '.08em' }}>Quick ideas</div><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{['Study session for exam', 'Weekly project review', 'Deep work block', 'Morning routine', 'Research & report', 'Prepare presentation'].map(q => <button key={q} onClick={() => setAiGoal(q)} style={{ padding: '4px 11px', background: s2, border: `1px solid ${br}`, borderRadius: 20, color: t2, fontSize: '.73rem', cursor: 'pointer', fontFamily: 'inherit' }}>{q}</button>)}</div></div>
        <button onClick={generatePlan} disabled={aiLoading || !aiGoal.trim()} style={{ padding: '10px 24px', background: aiLoading || !aiGoal.trim() ? s2 : accent, border: 'none', borderRadius: 9, color: aiLoading || !aiGoal.trim() ? t3 : '#000', fontWeight: 800, cursor: aiLoading || !aiGoal.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: '.88rem', display: 'flex', alignItems: 'center', gap: 10, transition: '.2s' }}>
          {aiLoading ? (<><span style={{ width: 15, height: 15, borderRight: `2px solid ${t3}44`, borderBottom: `2px solid ${t3}44`, borderLeft: `2px solid ${t3}44`, borderTop: `2px solid ${t3}`, borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} /> Generating…</>) : '✦ Generate AI Plan'}
        </button>
        {aiError && <div style={{ marginTop: 9, padding: '8px 12px', background: 'rgba(232,51,74,.07)', border: '1px solid rgba(232,51,74,.18)', borderRadius: 8 }}><p style={{ color: '#e8334a', fontSize: '.81rem', margin: 0 }}>⚠ {aiError}</p></div>}
      </div>

      {aiPlans.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}><div style={{ fontSize: '.74rem', fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '.1em' }}>✦ Your Plan ({aiPlans.length})</div><div style={{ flex: 1, height: 1, background: br }} />{aiPlans.length > 1 && <button onClick={async () => { for (let i = 0; i < aiPlans.length; i++)await savePlan(aiPlans[i], i); }} style={{ padding: '5px 14px', background: accent, border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, fontSize: '.78rem', cursor: 'pointer', fontFamily: 'inherit' }}>+ Save All</button>}</div>
          {aiPlans.map((plan, i) => {
            const pc = PRI[plan.priority as keyof typeof PRI] || PRI.medium; const tm = plan.subtasks.reduce((a, s) => a + s.estimatedMins, 0) || plan.estimatedMins; return (
              <div key={i} style={{ background: sf, borderTop: `1px solid ${br}`, borderRight: `1px solid ${br}`, borderBottom: `1px solid ${br}`, borderLeft: `3px solid ${pc.color}`, borderRadius: 10, marginBottom: 12, overflow: 'hidden', boxShadow: sh }}>
                <div style={{ padding: '7px 15px', background: pb, borderBottom: `1px solid ${br}`, display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '.62rem', fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: '.1em' }}>✦ AI Plan</span>
                  <span style={{ fontSize: '.67rem', padding: '2px 7px', borderRadius: 12, background: pc.bg, color: pc.color, fontWeight: 700 }}>{pc.icon} {pc.label}</span>
                  <span style={{ fontSize: '.67rem', color: t3 }}>⏱ ~{fmtMins(tm)}</span>
                  <span style={{ fontSize: '.67rem', color: t3 }}>📅 {new Date(plan.date + 'T00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                </div>
                <div style={{ padding: '13px 15px' }}>
                  <div style={{ fontWeight: 700, color: t, fontSize: '.94rem', marginBottom: 5 }}>{plan.title}</div>
                  {plan.description && <p style={{ color: t2, fontSize: '.84rem', lineHeight: 1.6, marginBottom: 11 }}>{plan.description}</p>}
                  {plan.subtasks.length > 0 && <div style={{ marginBottom: 11 }}><div style={{ fontSize: '.64rem', color: t3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Steps</div>{plan.subtasks.map((s, j) => <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '5px 0', borderBottom: j < plan.subtasks.length - 1 ? `1px solid ${br}` : 'none' }}><span style={{ fontSize: '.67rem', color: t3, minWidth: 17, textAlign: 'right', paddingTop: 2 }}>{j + 1}</span><div style={{ width: 10, height: 10, borderRadius: 3, border: `1.5px solid ${id}`, flexShrink: 0, marginTop: 3 }} /><span style={{ flex: 1, color: t2, fontSize: '.83rem', lineHeight: 1.5 }}>{s.text}</span><span style={{ fontSize: '.67rem', color: t3, whiteSpace: 'nowrap' }}>{s.estimatedMins}m</span></div>)}</div>}
                  {plan.notes && <div style={{ background: pb, border: `1px solid ${br}`, borderRadius: 8, padding: '8px 12px', marginBottom: 11 }}><div style={{ fontSize: '.62rem', color: accent, marginBottom: 3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>📝 Notes</div><p style={{ color: t2, fontSize: '.81rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>{plan.notes}</p></div>}
                  {plan.tags.length > 0 && <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 11 }}>{plan.tags.map(tg => <span key={tg} style={{ fontSize: '.64rem', padding: '2px 7px', borderRadius: 12, background: s2, color: t3, border: `1px solid ${br}` }}>#{tg}</span>)}</div>}
                  <button onClick={() => savePlan(plan, i)} disabled={savingIdx === i} style={{ padding: '7px 18px', background: accent, border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '.81rem', opacity: savingIdx === i ? .6 : 1 }}>{savingIdx === i ? 'Saving…' : '+ Add to My Plans'}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {events.length > 0 && aiPlans.length === 0 && !aiLoading && <div style={{ marginTop: 4 }}><div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11 }}><div style={{ fontSize: '.7rem', fontWeight: 700, color: t3, textTransform: 'uppercase', letterSpacing: '.1em' }}>Saved plans</div><div style={{ flex: 1, height: 1, background: br }} /><button onClick={() => setView('schedule')} style={{ background: 'none', border: 'none', color: accent, fontSize: '.74rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>See all →</button></div>{events.slice(0, 3).map(e => renderEventCard(e))}</div>}
    </div>
  );

  /* ─── MAIN RENDER ─── */
  /* ── Template application helper ── */
  const applyTemplate = async (tevents: any[], date: string) => {
    for (const ev of tevents) {
      try {
        await api('/planner', {
          method: 'POST',
          body: JSON.stringify({
            title: ev.title, date, time: ev.time, eventType: ev.eventType,
            priority: ev.priority, estimatedMins: ev.estimatedMins,
            energy: ev.energy || 'normal', recurring: 'none',
            subtasksJson: ev.subtasks
              ? JSON.stringify(ev.subtasks.map((s: string, i: number) => ({ id: `t${Date.now()}${i}`, text: s, done: false })))
              : '[]',
            tagsJson: '[]',
          }),
        });
      } catch { }
    }
    load();
  };

  const TABS = useMemo(() => [
    ['today', '☀️ Today'],
    ['calendar', '📅 Month'],
    ['week', '🗓 Week'],
    ['schedule', '📋 Schedule'],
    ['ai', '✦ AI'],
    ['habits', '🌱 Habits'],
    ['notes', '📝 Notes'],
    ['templates', '🗃 Templates'],
    ['personal', '🌸 Personal'],
  ], [inbox.length]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div><h3 style={{ color: t, fontFamily: "'DM Sans', sans-serif", fontSize: '1.05rem', marginBottom: 3 }}>{label}</h3><p style={{ color: t3, fontSize: '.79rem' }}>{openToday} open today · {futureEvs.length} upcoming · {inbox.length} in inbox</p></div>
        <button onClick={() => setShowAdd(p => !p)} style={{ padding: '7px 15px', background: 'transparent', border: `1px solid ${br}`, borderRadius: 8, color: t2, fontWeight: 600, fontSize: '.79rem', cursor: 'pointer' }}>+ Manual</button>
      </div>

      <div style={{ display: 'flex', gap: 3, marginBottom: 18, background: s2, border: `1px solid ${br}`, borderRadius: 10, padding: 3, flexWrap: 'wrap', overflowX: 'auto' }}>
        {TABS.map(([v, lbl]) => <button key={v} onClick={() => setView(v as any)} style={{ padding: '6px 12px', background: view === v ? accent : 'transparent', border: 'none', borderRadius: 7, color: view === v ? '#000' : t2, cursor: 'pointer', fontFamily: 'inherit', fontSize: '.75rem', fontWeight: 700, whiteSpace: 'nowrap', transition: '.18s', flexShrink: 0 }}>{lbl}</button>)}
      </div>

      {showAdd && (
        <div style={{ background: sf, border: `1px solid ${br}`, borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: sh }}>
          <div style={{ fontSize: '.74rem', fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12 }}>Add Event Manually</div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 9, marginBottom: 9 }}>
            <div><label style={{ fontSize: '.62rem', color: t3, display: 'block', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '.07em' }}>Title *</label><input value={newEv.title} onChange={e => setNewEv(p => ({ ...p, title: e.target.value }))} placeholder="What to do?" style={inp} /></div>
            <div><label style={{ fontSize: '.62rem', color: t3, display: 'block', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '.07em' }}>Date</label><input type="date" value={newEv.date} onChange={e => setNewEv(p => ({ ...p, date: e.target.value }))} style={{ ...inp, colorScheme: isDark ? 'dark' : 'light' }} /></div>
            <div><label style={{ fontSize: '.62rem', color: t3, display: 'block', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '.07em' }}>Start</label><input type="time" value={newEv.time} onChange={e => setNewEv(p => ({ ...p, time: e.target.value }))} style={{ ...inp, colorScheme: isDark ? 'dark' : 'light' }} /></div>
            <div><label style={{ fontSize: '.62rem', color: t3, display: 'block', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '.07em' }}>End</label><input type="time" value={newEv.endTime} onChange={e => setNewEv(p => ({ ...p, endTime: e.target.value }))} style={{ ...inp, colorScheme: isDark ? 'dark' : 'light' }} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 9, marginBottom: 9 }}>
            <div><label style={{ fontSize: '.62rem', color: t3, display: 'block', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '.07em' }}>Type</label><select value={newEv.eventType} onChange={e => setNewEv(p => ({ ...p, eventType: e.target.value }))} style={{ ...inp, appearance: 'none' as any }}>{['work', 'study', 'meeting', 'personal', 'exam', 'project', 'health', 'deadline'].map(tp => <option key={tp} value={tp}>{TYPE_EMOJI[tp] || '📌'} {tp.charAt(0).toUpperCase() + tp.slice(1)}</option>)}</select></div>
            <div><label style={{ fontSize: '.62rem', color: t3, display: 'block', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '.07em' }}>Priority</label><select value={newEv.priority} onChange={e => setNewEv(p => ({ ...p, priority: e.target.value }))} style={{ ...inp, appearance: 'none' as any }}>{Object.entries(PRI).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}</select></div>
            <div><label style={{ fontSize: '.62rem', color: t3, display: 'block', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '.07em' }}>Energy</label><select value={newEv.energy} onChange={e => setNewEv(p => ({ ...p, energy: e.target.value }))} style={{ ...inp, appearance: 'none' as any }}>{Object.entries(ENERGY).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}</select></div>
            <div><label style={{ fontSize: '.62rem', color: t3, display: 'block', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '.07em' }}>Repeat</label><select value={newEv.recurring} onChange={e => setNewEv(p => ({ ...p, recurring: e.target.value }))} style={{ ...inp, appearance: 'none' as any }}>{['none', 'daily', 'weekly', 'monthly'].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}</select></div>
          </div>
          <div style={{ marginBottom: 9 }}><label style={{ fontSize: '.62rem', color: t3, display: 'block', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '.07em' }}>Notes</label><textarea value={newEv.notes} onChange={e => setNewEv(p => ({ ...p, notes: e.target.value }))} rows={2} style={{ ...inp, resize: 'vertical' }} /></div>
          <div style={{ marginBottom: 13 }}><label style={{ fontSize: '.62rem', color: t3, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.07em' }}>Steps</label>{newEv.subtasks.map(s => <div key={s.id} style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'center' }}><span style={{ flex: 1, color: t2, fontSize: '.84rem' }}>{s.text}</span><button onClick={() => setNewEv(p => ({ ...p, subtasks: p.subtasks.filter(x => x.id !== s.id) }))} style={{ background: 'none', border: 'none', color: t3, cursor: 'pointer' }}>✕</button></div>)}<input value={newSub} onChange={e => setNewSub(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newSub.trim()) { setNewEv(p => ({ ...p, subtasks: [...p.subtasks, { id: Date.now().toString(), text: newSub.trim(), done: false }] })); setNewSub(''); } }} placeholder="Add step (Enter)" style={inp} /></div>
          <div style={{ display: 'flex', gap: 9, justifyContent: 'flex-end' }}><button onClick={() => setShowAdd(false)} style={{ padding: '7px 16px', background: 'transparent', border: `1px solid ${br}`, borderRadius: 8, color: t2, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button><button onClick={addManual} disabled={addLoading} style={{ padding: '7px 20px', background: accent, border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: addLoading ? .6 : 1 }}>{addLoading ? 'Saving…' : 'Save'}</button></div>
        </div>
      )}

      {view === 'today' && renderTodayView()}
      {view === 'calendar' && <CalendarView events={combinedEvents} accent={accent} isDark={isDark} onDayClick={(date) => { setNewEv(p => ({ ...p, date })); setShowAdd(true); }} />}
      {view === 'week' && <WeekView events={combinedEvents} accent={accent} isDark={isDark} onDayClick={(date) => { setNewEv(p => ({ ...p, date })); setShowAdd(true); }} />}
      {view === 'schedule' && renderScheduleView()}
      {view === 'ai' && renderAIView()}
      {view === 'habits' && renderHabitsView()}
      {view === 'notes' && <NotesView accent={accent} isDark={isDark} user={user} />}
      {view === 'templates' && <TemplatesView accent={accent} isDark={isDark} onApply={applyTemplate} />}
      {view === 'personal' && <PersonalView accent={accent} isDark={isDark} />}
    </div>
  );
}