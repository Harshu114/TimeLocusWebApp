'use client';
// components/dashboard/tabs/JournalTab.tsx
// Mood journal — write entries, pick mood, view history, see mood stats.
// Calls: GET/POST/DELETE /journal  +  GET /journal/mood/stats

import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';

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

const moodFor = (key: string) => MOODS.find(m => m.key === key) || MOODS[2];

export function JournalTab({ accent }: { accent: string }) {
  const [entries,    setEntries]    = useState<JournalEntry[]>([]);
  const [stats,      setStats]      = useState<MoodStats>({ total:0, mostFrequent:null });
  const [text,       setText]       = useState('');
  const [mood,       setMood]       = useState('neutral');
  const [loading,    setLoading]    = useState(false);
  const [expanded,   setExpanded]   = useState<string|null>(null);
  const [showForm,   setShowForm]   = useState(false);

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
      setText(''); setMood('neutral'); setShowForm(false); load();
    } catch {} finally { setLoading(false); }
  };

  const del = async (id: string) => {
    try { await api(`/journal/${id}`, { method:'DELETE' }); load(); } catch {}
  };

  const selectedMood = moodFor(mood);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
        <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:8, padding:16 }}>
          <div style={{ fontSize:'1.2rem', marginBottom:6 }}>📖</div>
          <div style={{ fontFamily:'Orbitron,monospace', fontSize:'1.3rem', fontWeight:700, color:accent }}>{stats.total}</div>
          <div style={{ fontSize:'.72rem', color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:'.08em' }}>Total Entries</div>
        </div>
        <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:8, padding:16 }}>
          <div style={{ fontSize:'1.2rem', marginBottom:6 }}>{stats.mostFrequent ? moodFor(stats.mostFrequent).emoji : '😐'}</div>
          <div style={{ fontFamily:'Orbitron,monospace', fontSize:'1.1rem', fontWeight:700, color:stats.mostFrequent?moodFor(stats.mostFrequent).color:accent }}>
            {stats.mostFrequent ? moodFor(stats.mostFrequent).label : 'N/A'}
          </div>
          <div style={{ fontSize:'.72rem', color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:'.08em' }}>Most Common Mood</div>
        </div>
        <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:8, padding:16 }}>
          <div style={{ fontSize:'1.2rem', marginBottom:6 }}>📅</div>
          <div style={{ fontFamily:'Orbitron,monospace', fontSize:'1.3rem', fontWeight:700, color:accent }}>
            {entries.length > 0 ? new Date(entries[0].date+'T00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'}) : '—'}
          </div>
          <div style={{ fontSize:'.72rem', color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:'.08em' }}>Last Entry</div>
        </div>
      </div>

      {/* New entry button */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h3 style={{ color:'#fff', fontFamily:'Orbitron,monospace', fontSize:'1rem' }}>📝 My Journal</h3>
        <button onClick={() => setShowForm(v=>!v)} style={{ padding:'9px 20px', background:accent, border:'none', borderRadius:4, color:'#000', fontWeight:700, cursor:'pointer', fontSize:'.85rem' }}>
          {showForm ? '✕ Cancel' : '+ New Entry'}
        </button>
      </div>

      {/* Write entry form */}
      {showForm && (
        <div style={{ background:'rgba(255,255,255,.025)', border:`1px solid ${accent}44`, borderRadius:8, padding:20 }}>
          <div style={{ fontSize:'.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.12em', color:'rgba(255,255,255,.35)', marginBottom:14 }}>How are you feeling today?</div>

          {/* Mood picker */}
          <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
            {MOODS.map(m => (
              <button key={m.key} onClick={() => setMood(m.key)} style={{
                display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:20,
                border:`1.5px solid ${mood===m.key?m.color:'rgba(255,255,255,.1)'}`,
                background: mood===m.key?`${m.color}22`:'transparent',
                cursor:'pointer', fontSize:'.85rem', color: mood===m.key?m.color:'rgba(255,255,255,.5)',
                fontWeight: mood===m.key?700:400, transition:'.2s',
              }}>
                <span>{m.emoji}</span><span>{m.label}</span>
              </button>
            ))}
          </div>

          {/* Text area */}
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={`What's on your mind today? How was your day? What are you grateful for?`}
            rows={5}
            style={{ width:'100%', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.09)', borderRadius:6, padding:'13px 16px', color:'#fff', fontFamily:'inherit', fontSize:'.9rem', outline:'none', resize:'vertical', lineHeight:1.6, boxSizing:'border-box' }}
          />
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12 }}>
            <span style={{ fontSize:'.78rem', color:'rgba(255,255,255,.3)' }}>{text.length} characters</span>
            <button onClick={submit} disabled={loading||!text.trim()} style={{ padding:'10px 24px', background:accent, border:'none', borderRadius:4, color:'#000', fontWeight:700, cursor:'pointer', opacity:loading||!text.trim()?.6:1 }}>
              {loading ? 'Saving...' : `Save Entry ${selectedMood.emoji}`}
            </button>
          </div>
        </div>
      )}

      {/* Mood distribution */}
      {entries.length > 0 && (
        <div style={{ background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.07)', borderRadius:8, padding:18 }}>
          <div style={{ fontSize:'.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.12em', color:'rgba(255,255,255,.35)', marginBottom:14 }}>Mood Distribution</div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            {MOODS.map(m => {
              const count = entries.filter(e => e.mood === m.key).length;
              if (!count) return null;
              const pct = Math.round(count / entries.length * 100);
              return (
                <div key={m.key} style={{ flex:1, minWidth:80, textAlign:'center', padding:'12px 8px', background:'rgba(255,255,255,.03)', borderRadius:8, border:`1px solid ${m.color}33` }}>
                  <div style={{ fontSize:'1.4rem', marginBottom:4 }}>{m.emoji}</div>
                  <div style={{ fontWeight:700, color:m.color, fontSize:'.95rem' }}>{pct}%</div>
                  <div style={{ fontSize:'.7rem', color:'rgba(255,255,255,.4)' }}>{m.label}</div>
                  <div style={{ fontSize:'.65rem', color:'rgba(255,255,255,.25)', marginTop:2 }}>{count}x</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Entries list */}
      {entries.length === 0 ? (
        <p style={{ color:'rgba(255,255,255,.3)', textAlign:'center', padding:40, fontSize:'.9rem' }}>
          No journal entries yet. Write your first entry above! ✍️
        </p>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {entries.map(e => {
            const m   = moodFor(e.mood);
            const exp = expanded === e.id;
            return (
              <div key={e.id} style={{ background:'rgba(255,255,255,.025)', border:`1px solid rgba(255,255,255,.07)`, borderRadius:8, overflow:'hidden' }}>
                {/* Header */}
                <div
                  onClick={() => setExpanded(exp ? null : e.id)}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', cursor:'pointer' }}
                >
                  <span style={{ fontSize:'1.3rem' }}>{m.emoji}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ color:'#fff', fontSize:'.9rem', fontWeight:500 }}>
                      {e.entry.length > 80 && !exp ? e.entry.slice(0,80)+'...' : e.entry.slice(0,80)}
                    </div>
                    <div style={{ display:'flex', gap:10, marginTop:4 }}>
                      <span style={{ fontSize:'.72rem', color:m.color }}>{m.label}</span>
                      <span style={{ fontSize:'.72rem', color:'rgba(255,255,255,.3)' }}>
                        {new Date(e.date+'T00:00').toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}
                      </span>
                    </div>
                  </div>
                  <span style={{ color:'rgba(255,255,255,.3)', fontSize:'.8rem' }}>{exp ? '▲' : '▼'}</span>
                  <button onClick={ev=>{ev.stopPropagation();del(e.id);}} style={{ background:'none', border:'none', color:'rgba(255,255,255,.2)', cursor:'pointer', fontSize:'.9rem' }}>✕</button>
                </div>
                {/* Expanded content */}
                {exp && (
                  <div style={{ padding:'0 16px 16px', borderTop:'1px solid rgba(255,255,255,.05)' }}>
                    <p style={{ color:'rgba(255,255,255,.7)', lineHeight:1.7, fontSize:'.88rem', marginTop:12, whiteSpace:'pre-wrap' }}>{e.entry}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}