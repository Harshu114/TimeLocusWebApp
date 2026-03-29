'use client';
// planner/PersonalView.tsx — Mood tracker, Affirmations, Quarterly Review

import { useState, useEffect } from 'react';

interface MoodEntry  { date: string; mood: number; note?: string; }
interface QReview    { id: string; quarter: string; wentWell: string; improve: string; wins: string; goals: string; date: string; }

const MOODS = [
  { value: 1, emoji: '😢', label: 'Rough',   color: '#ff4060' },
  { value: 2, emoji: '😟', label: 'Low',     color: '#ff6b35' },
  { value: 3, emoji: '😐', label: 'Okay',    color: '#ffcc00' },
  { value: 4, emoji: '🙂', label: 'Good',    color: '#00ff88' },
  { value: 5, emoji: '🤩', label: 'Amazing', color: '#00dcff' },
];

const ls    = (k: string, d: any) => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? d; } catch { return d; } };
const lsSet = (k: string, v: any) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

function isoDate(d = new Date()) { return d.toISOString().slice(0, 10); }

export function PersonalView({ accent, isDark }: { accent: string; isDark: boolean }) {
  const [sub, setSub] = useState<'mood' | 'affirmations' | 'review'>('mood');

  const t  = isDark ? '#fff' : '#1a2340';
  const t2 = isDark ? 'rgba(255,255,255,.6)' : '#4a5680';
  const t3 = isDark ? 'rgba(255,255,255,.32)' : '#8090b0';
  const sf = isDark ? 'rgba(255,255,255,.025)' : '#fff';
  const br = isDark ? 'rgba(255,255,255,.09)' : 'rgba(100,130,200,.18)';
  const ib = isDark ? 'rgba(255,255,255,.07)' : '#fff';
  const id = isDark ? 'rgba(255,255,255,.12)' : 'rgba(100,130,200,.28)';
  const inp = { background: ib, border: `1px solid ${id}`, borderRadius: 8, padding: '9px 13px',
    color: t, fontFamily: 'inherit', fontSize: '.88rem', outline: 'none', width: '100%', boxSizing: 'border-box' as const };

  const PILL_TABS = [
    { key: 'mood', label: '😊 Mood Tracker' },
    { key: 'affirmations', label: '✨ Affirmations' },
    { key: 'review', label: '🎯 Quarterly Review' },
  ] as const;

  return (
    <div>
      {/* Sub-nav pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {PILL_TABS.map(tab => (
          <button key={tab.key} onClick={() => setSub(tab.key)}
            style={{ padding: '7px 16px', borderRadius: 20, border: `1px solid ${br}`, cursor: 'pointer',
              background: sub === tab.key ? accent : 'transparent',
              color: sub === tab.key ? '#000' : t2,
              fontWeight: 700, fontSize: '.8rem', fontFamily: 'inherit', transition: '.18s' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {sub === 'mood'         && <MoodTracker    accent={accent} isDark={isDark} t={t} t2={t2} t3={t3} sf={sf} br={br} inp={inp} />}
      {sub === 'affirmations' && <Affirmations   accent={accent} isDark={isDark} t={t} t2={t2} t3={t3} sf={sf} br={br} inp={inp} />}
      {sub === 'review'       && <QuarterlyReview accent={accent} isDark={isDark} t={t} t2={t2} t3={t3} sf={sf} br={br} inp={inp} />}
    </div>
  );
}

/* ── Mood Tracker ──────────────────────────────────── */
function MoodTracker({ accent, isDark, t, t2, t3, sf, br, inp }: any) {
  const [moodLog,  setMoodLog]  = useState<MoodEntry[]>(() => ls('tl_mood_log', []));
  const [noteText, setNoteText] = useState('');
  const todayStr = isoDate();
  const todayMood = moodLog.find(m => m.date === todayStr);

  const logMood = (value: number) => {
    const updated = moodLog.filter(m => m.date !== todayStr);
    const entry: MoodEntry = { date: todayStr, mood: value, note: noteText || undefined };
    const newLog = [...updated, entry].sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
    setMoodLog(newLog);
    lsSet('tl_mood_log', newLog);
  };

  // Build 30-day grid
  const days30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return isoDate(d);
  });
  const moodMap: Record<string, MoodEntry> = {};
  moodLog.forEach(m => { moodMap[m.date] = m; });

  return (
    <div>
      {/* Today's mood picker */}
      <div style={{ background: sf, border: `1px solid ${br}`, borderRadius: 12, padding: 20, marginBottom: 18 }}>
        <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '.12em', color: t3, marginBottom: 14 }}>How are you feeling today?</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
          {MOODS.map(m => {
            const isSelected = todayMood?.mood === m.value;
            return (
              <button key={m.value} onClick={() => logMood(m.value)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  background: isSelected ? `${m.color}22` : 'transparent',
                  border: isSelected ? `2px solid ${m.color}` : `2px solid transparent`,
                  borderRadius: 12, padding: '10px 12px', cursor: 'pointer', transition: '.2s',
                  boxShadow: isSelected ? `0 0 12px ${m.color}44` : 'none' }}>
                <span style={{ fontSize: '2rem' }}>{m.emoji}</span>
                <span style={{ fontSize: '.68rem', color: isSelected ? m.color : t3, fontWeight: 600 }}>{m.label}</span>
              </button>
            );
          })}
        </div>
        {todayMood && (
          <div style={{ textAlign: 'center', padding: '8px 0', fontSize: '.84rem', color: MOODS[todayMood.mood - 1].color }}>
            Today: {MOODS[todayMood.mood - 1].emoji} {MOODS[todayMood.mood - 1].label}
            {todayMood.note && <span style={{ color: t3, marginLeft: 8 }}>— {todayMood.note}</span>}
          </div>
        )}
        <input value={noteText} onChange={e => setNoteText(e.target.value)}
          placeholder="Add a note about today (optional)…"
          style={{ ...inp, marginTop: 10, fontSize: '.84rem' }} />
      </div>

      {/* 30-day mood history */}
      <div style={{ background: sf, border: `1px solid ${br}`, borderRadius: 12, padding: 18 }}>
        <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '.12em', color: t3, marginBottom: 14 }}>30-Day Mood History</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10,1fr)', gap: 5 }}>
          {days30.map(d => {
            const entry  = moodMap[d];
            const mood   = entry ? MOODS[entry.mood - 1] : null;
            const isToday = d === todayStr;
            return (
              <div key={d} title={`${d}${mood ? `: ${mood.label}` : ''}`}
                style={{ aspectRatio: '1', borderRadius: 6, transition: '.2s',
                  background: mood ? `${mood.color}55` : isDark ? 'rgba(255,255,255,.05)' : 'rgba(100,130,200,.08)',
                  border: isToday ? `2px solid ${accent}` : '2px solid transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.8rem' }}>
                {mood ? mood.emoji : ''}
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
          {MOODS.map(m => (
            <div key={m.value} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: `${m.color}55` }} />
              <span style={{ fontSize: '.65rem', color: t3 }}>{m.emoji} {m.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Affirmations ──────────────────────────────────── */
function Affirmations({ accent, isDark, t, t2, t3, sf, br, inp }: any) {
  const [list,    setList]    = useState<string[]>(() => ls('tl_affirmations', [
    'I am capable of achieving my goals.', 'Progress is more important than perfection.',
    'I take things one step at a time.', 'My effort today builds my success tomorrow.',
  ]));
  const [newText, setNewText] = useState('');
  const [shown,   setShown]   = useState<string | null>(null);

  const showRandom = () => {
    if (!list.length) return;
    const idx = Math.floor(Math.random() * list.length);
    setShown(list[idx]);
  };

  const addAffirmation = () => {
    if (!newText.trim()) return;
    const updated = [...list, newText.trim()];
    setList(updated); lsSet('tl_affirmations', updated); setNewText('');
  };

  const remove = (i: number) => {
    const updated = list.filter((_, j) => j !== i);
    setList(updated); lsSet('tl_affirmations', updated);
    if (shown === list[i]) setShown(null);
  };

  return (
    <div>
      {/* Show affirmation */}
      {shown && (
        <div style={{ background: `${accent}12`, border: `1.5px solid ${accent}44`, borderRadius: 12,
          padding: 24, marginBottom: 18, textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>✨</div>
          <p style={{ color: t, fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.6, margin: 0 }}>"{shown}"</p>
          <button onClick={showRandom} style={{ marginTop: 12, background: 'none', border: `1px solid ${accent}44`,
            borderRadius: 20, padding: '5px 16px', color: accent, cursor: 'pointer', fontSize: '.78rem', fontFamily: 'inherit' }}>
            Show Another ✦
          </button>
        </div>
      )}

      {!shown && (
        <div style={{ background: sf, border: `1px solid ${br}`, borderRadius: 12, padding: 20, marginBottom: 18, textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>✨</div>
          <p style={{ color: t3, fontSize: '.88rem', marginBottom: 14 }}>
            {list.length === 0 ? 'Add your first affirmation below' : 'Reveal a daily affirmation to set your intention'}
          </p>
          {list.length > 0 && (
            <button onClick={showRandom} style={{ padding: '9px 24px', background: accent, border: 'none',
              borderRadius: 20, color: '#000', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '.86rem' }}>
              ✨ Show Today's Affirmation
            </button>
          )}
        </div>
      )}

      {/* Add new */}
      <div style={{ background: sf, border: `1px solid ${br}`, borderRadius: 12, padding: 16, marginBottom: 18 }}>
        <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '.12em', color: t3, marginBottom: 10 }}>Add Affirmation</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={newText} onChange={e => setNewText(e.target.value)} style={{ ...inp, flex: 1 }}
            placeholder="I am…" onKeyDown={e => e.key === 'Enter' && addAffirmation()} />
          <button onClick={addAffirmation} style={{ padding: '9px 16px', background: accent, border: 'none',
            borderRadius: 8, color: '#000', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>Add</button>
        </div>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {list.map((a, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
            background: sf, border: `1px solid ${br}`, borderRadius: 9, borderLeft: `3px solid ${accent}` }}>
            <span style={{ fontSize: '.9rem' }}>✦</span>
            <span style={{ flex: 1, color: t2, fontSize: '.87rem', lineHeight: 1.5 }}>{a}</span>
            <button onClick={() => remove(i)} style={{ background: 'none', border: 'none', color: t3, cursor: 'pointer', fontSize: '.9rem' }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Quarterly Review ──────────────────────────────── */
function QuarterlyReview({ accent, isDark, t, t2, t3, sf, br, inp }: any) {
  const [reviews,    setReviews]    = useState<QReview[]>(() => ls('tl_q_reviews', []));
  const [expanded,   setExpanded]   = useState<string | null>(null);
  const [showNew,    setShowNew]    = useState(false);
  const [form, setForm] = useState({ wentWell: '', improve: '', wins: '', goals: '' });

  const currentQuarter = () => {
    const now = new Date();
    const q = Math.ceil((now.getMonth() + 1) / 3);
    return `Q${q} ${now.getFullYear()}`;
  };

  const saveReview = () => {
    const review: QReview = {
      id: Date.now().toString(),
      quarter: currentQuarter(),
      ...form,
      date: new Date().toISOString().slice(0, 10),
    };
    const updated = [...reviews, review];
    setReviews(updated); lsSet('tl_q_reviews', updated);
    setForm({ wentWell: '', improve: '', wins: '', goals: '' });
    setShowNew(false);
  };

  const PROMPTS: {field: keyof typeof form; icon: string; label: string; placeholder: string}[] = [
    { field: 'wentWell', icon: '✅', label: 'What went well this quarter?', placeholder: 'Projects completed, habits maintained, relationships improved…' },
    { field: 'improve',  icon: '🔧', label: 'What could be improved?',       placeholder: 'Time management, focus, communication, health…' },
    { field: 'wins',     icon: '🏆', label: 'Key wins & achievements',        placeholder: 'Your proudest accomplishments, milestones reached…' },
    { field: 'goals',    icon: '🎯', label: 'Goals for next quarter',         placeholder: 'Specific, measurable targets for the next 3 months…' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '.95rem', color: t }}>Quarterly Review</div>
          <div style={{ fontSize: '.78rem', color: t3, marginTop: 2 }}>
            Reflect every 3 months to stay aligned with your long-term vision
          </div>
        </div>
        <button onClick={() => setShowNew(v => !v)}
          style={{ padding: '8px 18px', background: showNew ? 'transparent' : accent,
            border: `1px solid ${showNew ? br : accent}`, borderRadius: 8,
            color: showNew ? t3 : '#000', fontWeight: 700, fontSize: '.82rem',
            cursor: 'pointer', fontFamily: 'inherit', transition: '.2s' }}>
          {showNew ? 'Cancel' : `+ ${currentQuarter()} Review`}
        </button>
      </div>

      {/* New review form */}
      {showNew && (
        <div style={{ background: sf, border: `1px solid ${br}`, borderRadius: 12, padding: 20, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <div style={{ fontFamily: 'Orbitron,monospace', fontSize: '.88rem', fontWeight: 700, color: accent }}>
              {currentQuarter()} Review
            </div>
            <div style={{ flex: 1, height: 1, background: br }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {PROMPTS.map(({ field, icon, label, placeholder }) => (
              <div key={field}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: '.78rem', fontWeight: 700, color: t2, marginBottom: 6 }}>
                  <span>{icon}</span>{label}
                </label>
                <textarea value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                  placeholder={placeholder} rows={3}
                  style={{ ...inp, resize: 'vertical', lineHeight: 1.6, fontSize: '.85rem' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <button onClick={() => setShowNew(false)}
              style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${br}`,
                borderRadius: 8, color: t3, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={saveReview}
              style={{ padding: '8px 20px', background: accent, border: 'none', borderRadius: 8,
                color: '#000', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Save Review</button>
          </div>
        </div>
      )}

      {/* Past reviews */}
      {reviews.length === 0 && !showNew && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: t3 }}>
          <div style={{ fontSize: '2rem', marginBottom: 10 }}>🎯</div>
          <div style={{ fontSize: '.9rem' }}>Start your first quarterly review above</div>
        </div>
      )}
      {[...reviews].reverse().map(r => (
        <div key={r.id} style={{ background: sf, border: `1px solid ${br}`, borderRadius: 10, marginBottom: 10, overflow: 'hidden' }}>
          <div onClick={() => setExpanded(expanded === r.id ? null : r.id)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', cursor: 'pointer' }}>
            <div>
              <div style={{ fontFamily: 'Orbitron,monospace', fontWeight: 700, fontSize: '.88rem', color: accent }}>{r.quarter}</div>
              <div style={{ fontSize: '.72rem', color: t3, marginTop: 2 }}>{r.date}</div>
            </div>
            <span style={{ color: t3, fontSize: '.8rem' }}>{expanded === r.id ? '▴' : '▾'}</span>
          </div>
          {expanded === r.id && (
            <div style={{ borderTop: `1px solid ${br}`, padding: '14px 16px' }}>
              {PROMPTS.map(({ field, icon, label }) => r[field] && (
                <div key={field} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: '.72rem', fontWeight: 700, color: t3, marginBottom: 5 }}>{icon} {label}</div>
                  <p style={{ color: t2, fontSize: '.85rem', lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap' }}>{r[field]}</p>
                </div>
              ))}
              <button onClick={() => {
                const updated = reviews.filter(x => x.id !== r.id);
                setReviews(updated); lsSet('tl_q_reviews', updated);
                if (expanded === r.id) setExpanded(null);
              }} style={{ background: 'none', border: 'none', color: t3, cursor: 'pointer', fontSize: '.76rem', fontFamily: 'inherit' }}>
                Delete review
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
