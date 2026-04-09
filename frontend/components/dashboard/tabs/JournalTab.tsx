'use client';
// components/dashboard/tabs/JournalTab.tsx

import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';
import { useTheme } from '../../../lib/ThemeContext';

interface JournalEntry {
  id: string;
  entry: string;
  mood: string;
  date: string;
}
interface MoodStats { total: number; mostFrequent: string | null; }

const MOODS = [
  { key:'happy',   emoji:'😊', label:'Happy',    color:'#00ff88' },
  { key:'excited', emoji:'🤩', label:'Excited',  color:'#ffcc00' },
  { key:'neutral', emoji:'😐', label:'Neutral',  color:'#00dcff' },
  { key:'anxious', emoji:'😟', label:'Anxious',  color:'#ff6b35' },
  { key:'sad',     emoji:'😢', label:'Sad',      color:'#8c3cff' },
  { key:'tired',   emoji:'😴', label:'Tired',    color:'#888888' },
];

const PROMPTS = [
  "What's on your mind today?",
  "How was your day? What are you grateful for?",
  "Describe a moment that made you smile today.",
  "What challenged you today and how did you handle it?",
  "What are three things you accomplished today?",
  "How are you feeling right now and why?",
  "What would you like to improve tomorrow?",
  "Describe something you learned today.",
  "What made you laugh or feel light today?",
  "How did you practice self-care today?",
  "What's something you're looking forward to?",
  "Write about a person who made a positive impact on you.",
  "What's one small win you had today?",
  "Describe your emotions in three words.",
  "What would your ideal day look like?",
];

const moodFor = (key: string) => MOODS.find(m => m.key === key) || MOODS[2];

const getRandomPrompt = () => PROMPTS[Math.floor(Math.random() * PROMPTS.length)];

const calculateStreak = (entries: JournalEntry[]): number => {
  if (entries.length === 0) return 0;
  const sortedDates = [...new Set(entries.map(e => e.date))].sort().reverse();
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < sortedDates.length; i++) {
    const entryDate = new Date(sortedDates[i] + 'T00:00');
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    if (entryDate.toDateString() === expectedDate.toDateString()) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};

const calculateTotalWords = (entries: JournalEntry[]): number => {
  return entries.reduce((sum, e) => sum + e.entry.trim().split(/\s+/).length, 0);
};

const calculateAvgWordsPerEntry = (entries: JournalEntry[]): number => {
  if (entries.length === 0) return 0;
  return Math.round(calculateTotalWords(entries) / entries.length);
};

export function JournalTab({ accent }: { accent: string }) {
  const { isDark } = useTheme();
  const [entries,    setEntries]    = useState<JournalEntry[]>([]);
  const [stats,      setStats]      = useState<MoodStats>({ total:0, mostFrequent:null });
  const [text,       setText]       = useState('');
  const [mood,       setMood]       = useState('neutral');
  const [loading,    setLoading]    = useState(false);
  const [expanded,   setExpanded]   = useState<string|null>(null);
  const [showForm,   setShowForm]   = useState(false);
  const [viewMode,   setViewMode]   = useState<'list' | 'timeline'>('list');
  const [randomPrompt, setRandomPrompt] = useState(getRandomPrompt());

  // Theme-aware colors
  const txt       = isDark ? '#fff'                  : '#1a2340';
  const text3     = isDark ? 'rgba(255,255,255,.3)'  : '#8090b0';
  const text4     = isDark ? 'rgba(255,255,255,.4)'  : '#6a7a9a';
  const text5     = isDark ? 'rgba(255,255,255,.5)'  : '#4a5680';
  const surface   = isDark ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,0.85)';
  const surface2  = isDark ? 'rgba(255,255,255,.025)': 'rgba(255,255,255,0.85)';
  const border    = isDark ? 'rgba(255,255,255,.07)' : 'rgba(100,130,200,0.18)';
  const inputBg   = isDark ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,0.95)';
  const inputBdr  = isDark ? 'rgba(255,255,255,.09)' : 'rgba(100,130,200,0.2)';
  const moodBdr   = isDark ? 'rgba(255,255,255,.1)'  : 'rgba(100,130,200,0.2)';
  const moodText  = isDark ? 'rgba(255,255,255,.5)'  : '#4a5680';
  const distBg    = isDark ? 'rgba(255,255,255,.03)' : 'rgba(100,130,200,0.04)';
  const distText  = isDark ? 'rgba(255,255,255,.4)'  : '#6a7a9a';
  const distSub   = isDark ? 'rgba(255,255,255,.25)' : '#8090b0';
  const shadow    = isDark ? 'none'                  : '0 2px 12px rgba(100,130,200,0.09)';
  const delClr    = isDark ? 'rgba(255,255,255,.2)'  : 'rgba(100,130,200,.35)';

  const load = useCallback(async () => {
    try {
      const [eRes, sRes] = await Promise.all([api('/journal'), api('/journal/mood/stats')]);
      if (eRes.ok) setEntries(await eRes.json());
      if (sRes.ok) setStats(await sRes.json());
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      await api('/journal', {
        method: 'POST',
        body: JSON.stringify({ entry:text.trim(), mood, date:new Date().toISOString().slice(0,10) }),
      });
      setText(''); setMood('neutral'); setShowForm(false); setRandomPrompt(getRandomPrompt()); load();
    } catch {} finally { setLoading(false); }
  };

  const del = async (id: string) => {
    try { await api(`/journal/${id}`, { method:'DELETE' }); load(); } catch {}
  };

  const selectedMood = moodFor(mood);
  const streakCount = calculateStreak(entries);
  const totalWords = calculateTotalWords(entries);
  const avgWords = calculateAvgWordsPerEntry(entries);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* Stats Grid - Enhanced Dashboard */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))', gap:12 }}>
        <div style={{ background: surface, border: `1px solid ${border}`, borderRadius:8, padding:14, boxShadow: shadow }}>
          <div style={{ fontSize:'1rem', marginBottom:4 }}>📖</div>
          <div style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'1.2rem', fontWeight:700, color:accent }}>{stats.total}</div>
          <div style={{ fontSize:'.65rem', color: text3, textTransform:'uppercase', letterSpacing:'.06em', marginTop:2 }}>Entries</div>
        </div>
        <div style={{ background: surface, border: `1px solid ${border}`, borderRadius:8, padding:14, boxShadow: shadow }}>
          <div style={{ fontSize:'1rem', marginBottom:4 }}>{stats.mostFrequent ? moodFor(stats.mostFrequent).emoji : '😐'}</div>
          <div style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'.95rem', fontWeight:700, color:stats.mostFrequent?moodFor(stats.mostFrequent).color:accent, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {stats.mostFrequent ? moodFor(stats.mostFrequent).label : 'N/A'}
          </div>
          <div style={{ fontSize:'.65rem', color: text3, textTransform:'uppercase', letterSpacing:'.06em', marginTop:2 }}>Mood</div>
        </div>
        <div style={{ background: surface, border: `1px solid ${border}`, borderRadius:8, padding:14, boxShadow: shadow }}>
          <div style={{ fontSize:'1rem', marginBottom:4 }}>🔥</div>
          <div style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'1.2rem', fontWeight:700, color:streakCount>0?accent:text3 }}>{streakCount}</div>
          <div style={{ fontSize:'.65rem', color: text3, textTransform:'uppercase', letterSpacing:'.06em', marginTop:2 }}>Streak</div>
        </div>
        <div style={{ background: surface, border: `1px solid ${border}`, borderRadius:8, padding:14, boxShadow: shadow }}>
          <div style={{ fontSize:'1rem', marginBottom:4 }}>📝</div>
          <div style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'1.2rem', fontWeight:700, color:accent }}>{totalWords}</div>
          <div style={{ fontSize:'.65rem', color: text3, textTransform:'uppercase', letterSpacing:'.06em', marginTop:2 }}>Words</div>
        </div>
        <div style={{ background: surface, border: `1px solid ${border}`, borderRadius:8, padding:14, boxShadow: shadow }}>
          <div style={{ fontSize:'1rem', marginBottom:4 }}>✍️</div>
          <div style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'1.2rem', fontWeight:700, color:accent }}>{avgWords}</div>
          <div style={{ fontSize:'.65rem', color: text3, textTransform:'uppercase', letterSpacing:'.06em', marginTop:2 }}>Avg/Entry</div>
        </div>
        <div style={{ background: surface, border: `1px solid ${border}`, borderRadius:8, padding:14, boxShadow: shadow }}>
          <div style={{ fontSize:'1rem', marginBottom:4 }}>📅</div>
          <div style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'.9rem', fontWeight:700, color:accent, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {entries.length > 0 ? new Date(entries[0].date+'T00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'}) : '—'}
          </div>
          <div style={{ fontSize:'.65rem', color: text3, textTransform:'uppercase', letterSpacing:'.06em', marginTop:2 }}>Last</div>
        </div>
      </div>

      {/* New entry button & View toggle */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
        <h3 style={{ color: txt, fontFamily:"'DM Sans', sans-serif", fontSize:'1rem', margin:0 }}>📝 My Journal</h3>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {entries.length > 0 && (
            <div style={{ display:'flex', gap:4, background: surface2, border: `1px solid ${border}`, borderRadius:4, padding:4 }}>
              <button onClick={() => setViewMode('list')} style={{
                padding:'6px 12px', background: viewMode==='list'?accent:'transparent', border:'none', borderRadius:3,
                color: viewMode==='list'?'#000':txt, fontWeight: viewMode==='list'?700:500, cursor:'pointer', fontSize:'.8rem', transition:'.2s'
              }}>📋 List</button>
              <button onClick={() => setViewMode('timeline')} style={{
                padding:'6px 12px', background: viewMode==='timeline'?accent:'transparent', border:'none', borderRadius:3,
                color: viewMode==='timeline'?'#000':txt, fontWeight: viewMode==='timeline'?700:500, cursor:'pointer', fontSize:'.8rem', transition:'.2s'
              }}>📅 Timeline</button>
            </div>
          )}
          <button onClick={() => setShowForm(v=>!v)} style={{ padding:'8px 16px', background:accent, border:'none', borderRadius:4, color:'#000', fontWeight:700, cursor:'pointer', fontSize:'.85rem', whiteSpace:'nowrap' }}>
            {showForm ? '✕ Cancel' : '+ New Entry'}
          </button>
        </div>
      </div>

      {/* Write entry form */}
      {showForm && (
        <div style={{ background: surface2, border:`1px solid ${accent}44`, borderRadius:8, padding:20, boxShadow: shadow }}>
          <div style={{ fontSize:'.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.12em', color: text3, marginBottom:14 }}>How are you feeling today?</div>

          {/* Mood picker */}
          <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
            {MOODS.map(m => (
              <button key={m.key} onClick={() => setMood(m.key)} style={{
                display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:20,
                border:`1.5px solid ${mood===m.key?m.color:moodBdr}`,
                background: mood===m.key?`${m.color}22`:'transparent',
                cursor:'pointer', fontSize:'.85rem', color: mood===m.key?m.color:moodText,
                fontWeight: mood===m.key?700:400, transition:'.2s',
              }}>
                <span>{m.emoji}</span><span>{m.label}</span>
              </button>
            ))}
          </div>

          {/* Prompt suggestion */}
          <div style={{ background: `${accent}11`, border: `1px solid ${accent}33`, borderRadius:6, padding:10, marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:'.8rem', color: text5, fontStyle:'italic' }}>💡 {randomPrompt}</span>
            <button onClick={() => setRandomPrompt(getRandomPrompt())} style={{
              background:'none', border:'none', color: accent, cursor:'pointer', fontSize:'.85rem', fontWeight:600, padding:'0 8px'
            }}>↻ New</button>
          </div>

          {/* Text area */}
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Start writing your thoughts here..."
            rows={5}
            style={{ width:'100%', background: inputBg, border: `1px solid ${inputBdr}`, borderRadius:6, padding:'13px 16px', color: txt, fontFamily:'inherit', fontSize:'.9rem', outline:'none', resize:'vertical', lineHeight:1.6, boxSizing:'border-box' }}
          />
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12 }}>
            <span style={{ fontSize:'.78rem', color: text3 }}>{text.length} characters</span>
            <button onClick={submit} disabled={loading||!text.trim()} style={{ padding:'10px 24px', background:accent, border:'none', borderRadius:4, color:'#000', fontWeight:700, cursor:'pointer', opacity:loading||!text.trim()?0.6:1 }}>
              {loading ? 'Saving...' : `Save Entry ${selectedMood.emoji}`}
            </button>
          </div>
        </div>
      )}

      {/* Mood distribution */}
      {entries.length > 0 && (
        <div style={{ background: surface2, border: `1px solid ${border}`, borderRadius:8, padding:18, boxShadow: shadow }}>
          <div style={{ fontSize:'.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.12em', color: text3, marginBottom:14 }}>Mood Distribution</div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            {MOODS.map(m => {
              const count = entries.filter(e => e.mood === m.key).length;
              if (!count) return null;
              const pct = Math.round(count / entries.length * 100);
              return (
                <div key={m.key} style={{ flex:1, minWidth:80, textAlign:'center', padding:'12px 8px', background: distBg, borderRadius:8, border:`1px solid ${m.color}33` }}>
                  <div style={{ fontSize:'1.4rem', marginBottom:4 }}>{m.emoji}</div>
                  <div style={{ fontWeight:700, color:m.color, fontSize:'.95rem' }}>{pct}%</div>
                  <div style={{ fontSize:'.7rem', color: distText }}>{m.label}</div>
                  <div style={{ fontSize:'.65rem', color: distSub, marginTop:2 }}>{count}x</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Entries display - List or Timeline view */}
      {entries.length === 0 ? (
        <p style={{ color: text3, textAlign:'center', padding:40, fontSize:'.9rem' }}>
          No journal entries yet. Write your first entry above! ✍️
        </p>
      ) : viewMode === 'list' ? (
        /* LIST VIEW */
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {entries.map(e => {
            const m   = moodFor(e.mood);
            const exp = expanded === e.id;
            return (
              <div key={e.id} style={{ background: surface2, border: `1px solid ${border}`, borderRadius:8, overflow:'hidden', boxShadow: shadow }}>
                {/* Header */}
                <div
                  onClick={() => setExpanded(exp ? null : e.id)}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', cursor:'pointer' }}
                >
                  <span style={{ fontSize:'1.3rem' }}>{m.emoji}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ color: txt, fontSize:'.9rem', fontWeight:500 }}>
                      {e.entry.length > 80 && !exp ? e.entry.slice(0,80)+'...' : e.entry.slice(0,80)}
                    </div>
                    <div style={{ display:'flex', gap:10, marginTop:4 }}>
                      <span style={{ fontSize:'.72rem', color:m.color }}>{m.label}</span>
                      <span style={{ fontSize:'.72rem', color: text3 }}>
                        {new Date(e.date+'T00:00').toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize:'.7rem', color: text3, display:'inline-block', transition:'.2s', transform:exp?'rotate(180deg)':'none' }}>▾</span>
                  <button onClick={ev=>{ev.stopPropagation();del(e.id);}} style={{ background:'none', border:'none', color: delClr, cursor:'pointer', fontSize:'1rem' }}>✕</button>
                </div>
                {exp && (
                  <div style={{ padding:'0 16px 16px 56px', borderTop: `1px solid ${border}` }}>
                    <p style={{ color: text5, fontSize:'.88rem', lineHeight:1.7, marginTop:10, whiteSpace:'pre-wrap' }}>{e.entry}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* TIMELINE VIEW */
        <div style={{ position:'relative', paddingLeft:24 }}>
          {/* Timeline line */}
          <div style={{ position:'absolute', left:8, top:0, bottom:0, width:'2px', background: `linear-gradient(180deg, ${accent} 0%, ${accent}44 100%)` }} />
          
          {/* Group entries by date */}
          {Object.entries(
            entries.reduce((acc, entry) => {
              const date = entry.date;
              if (!acc[date]) acc[date] = [];
              acc[date].push(entry);
              return acc;
            }, {} as Record<string, JournalEntry[]>)
          ).sort(([dateA], [dateB]) => dateB.localeCompare(dateA)).map(([date, dateEntries]) => {
            const dateObj = new Date(date + 'T00:00');
            const isToday = new Date().toDateString() === dateObj.toDateString();
            const isYesterday = new Date(Date.now() - 86400000).toDateString() === dateObj.toDateString();
            const dateLabel = isToday ? 'Today' : isYesterday ? 'Yesterday' : dateObj.toLocaleDateString('en-IN', { month:'short', day:'numeric', year: dateObj.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });
            
            return (
              <div key={date} style={{ marginBottom:28 }}>
                {/* Date marker */}
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                  <div style={{ position:'absolute', left:0, width:'18px', height:'18px', background: accent, border: `2px solid ${isDark?'#0a0e27':'#fff'}`, borderRadius:'50%', zIndex:2 }} />
                  <div>
                    <div style={{ fontSize:'.75rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color: accent }}>
                      {dateLabel}
                    </div>
                    <div style={{ fontSize:'.7rem', color:text3, marginTop:2 }}>
                      {dateEntries.length} {dateEntries.length===1?'entry':'entries'}
                    </div>
                  </div>
                </div>

                {/* Entries for this date */}
                <div style={{ display:'flex', flexDirection:'column', gap:8, marginLeft:4 }}>
                  {dateEntries.map(e => {
                    const m = moodFor(e.mood);
                    const exp = expanded === e.id;
                    return (
                      <div key={e.id} style={{ background: surface2, border: `1px solid ${m.color}44`, borderRadius:6, overflow:'hidden', cursor:'pointer' }}>
                        <div onClick={() => setExpanded(exp ? null : e.id)} style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px' }}>
                          <span style={{ fontSize:'1.2rem' }}>{m.emoji}</span>
                          <div style={{ flex:1 }}>
                            <div style={{ color: txt, fontSize:'.85rem', fontWeight:500 }}>
                              {e.entry.length > 60 && !exp ? e.entry.slice(0,60)+'...' : e.entry.slice(0,60)}
                            </div>
                            <div style={{ fontSize:'.7rem', color:m.color, marginTop:3 }}>{m.label}</div>
                          </div>
                          <button onClick={ev=>{ev.stopPropagation();del(e.id);}} style={{ background:'none', border:'none', color: delClr, cursor:'pointer', fontSize:'.9rem' }}>✕</button>
                        </div>
                        {exp && (
                          <div style={{ padding:'0 14px 12px 44px', borderTop: `1px solid ${border}`, background: `${accent}08` }}>
                            <p style={{ color: text5, fontSize:'.8rem', lineHeight:1.6, marginTop:8, whiteSpace:'pre-wrap' }}>{e.entry}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
