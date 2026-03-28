'use client';
// components/dashboard/tabs/ProgressAndAITabs.tsx

import { useState, useEffect, useRef } from 'react';
import { DailySummary, User, ChatMessage } from '../../../types';
import { api } from '../../../lib/api';
import { CATEGORY_COLOR, WEEKDAYS, accentRgb, fmtDur } from '../../../lib/constants';
import Card from '../Card';

// ══════════════════════════════════════════════════════════════════════════════
// PROGRESS TAB
// ══════════════════════════════════════════════════════════════════════════════
export function ProgressTab({ accent }: { accent: string }) {
  const [weekly,    setWeekly]    = useState<DailySummary[]>([]);
  const [taskStats, setTaskStats] = useState({ total: 0, done: 0 });
  const [focusStat, setFocusStat] = useState({ sessions: 0, totalMinutes: 0 });

  useEffect(() => {
    Promise.all([
      api('/productivity/weekly').then(r => r.ok ? r.json() : []),
      api('/tasks/stats').then(r => r.ok ? r.json() : { total: 0, done: 0 }),
      api('/focus/today').then(r => r.ok ? r.json() : { sessions: 0, totalMinutes: 0 }),
    ]).then(([wk, ts, fs]) => {
      setWeekly(wk); setTaskStats(ts); setFocusStat(fs);
    }).catch(() => {});
  }, []);

  const weekHours = [0, 0, 0, 0, 0, 0, 0];
  weekly.forEach(d => {
    try {
      const idx = (new Date(d.date + 'T00:00').getDay() + 6) % 7;
      weekHours[idx] = Math.round(d.totalMinutes / 60 * 10) / 10;
    } catch {}
  });
  const maxW      = Math.max(...weekHours, 1);
  const weekTotal = weekHours.reduce((a, b) => a + b, 0);
  const bestDay   = WEEKDAYS[weekHours.indexOf(Math.max(...weekHours))];
  const avgScore  = weekly.length > 0
    ? Math.round(weekly.reduce((s, d) => s + (d.focusScore || 0), 0) / weekly.length)
    : 0;

  const breakdown: Record<string, number> = {};
  weekly.forEach(d => d.breakdown?.forEach((b: any) => {
    breakdown[b.category] = (breakdown[b.category] || 0) + b.minutes;
  }));
  const bTotal = Object.values(breakdown).reduce((a, b) => a + b, 0) || 1;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Summary stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
        {[
          { icon:'⏰', val:`${weekTotal.toFixed(1)}h`, label:'This Week' },
          { icon:'🎯', val:`${avgScore}%`,             label:'Avg Focus Score' },
          { icon:'✅', val:`${taskStats.done}/${taskStats.total}`, label:'Tasks Done' },
          { icon:'🧠', val:fmtDur(focusStat.totalMinutes), label:"Today's Focus" },
        ].map((s, i) => (
          <div key={i} style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:8, padding:'18px 16px' }}>
            <div style={{ fontSize:'1.2rem', marginBottom:8 }}>{s.icon}</div>
            <div style={{ fontFamily:'Orbitron,monospace', fontSize:'1.2rem', fontWeight:700, color:accent, marginBottom:3 }}>{s.val}</div>
            <div style={{ fontSize:'.72rem', color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:'.08em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
        {/* Weekly bar chart */}
        <Card title="📊 Weekly Hours">
          {weekTotal === 0
            ? <p style={{ color:'rgba(255,255,255,.3)', textAlign:'center', padding:'20px 0', fontSize:'.85rem' }}>No data yet. Start tracking!</p>
            : <>
                <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:120 }}>
                  {weekHours.map((h, i) => (
                    <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                      {h > 0 && <span style={{ fontSize:'.62rem', color:'rgba(255,255,255,.4)' }}>{h}h</span>}
                      <div style={{ width:'100%', height:`${Math.max((h / maxW) * 100, h > 0 ? 4 : 2)}px`, borderRadius:'4px 4px 0 0', background: h > 0 ? `linear-gradient(180deg,${accent},${accent}66)` : 'rgba(255,255,255,.06)', minHeight:2 }}/>
                      <span style={{ fontSize:'.62rem', color:'rgba(255,255,255,.3)' }}>{WEEKDAYS[i]}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:12, display:'flex', gap:16, fontSize:'.78rem' }}>
                  <span style={{ color:'rgba(255,255,255,.4)' }}>Total: <b style={{ color:'#fff' }}>{weekTotal.toFixed(1)}h</b></span>
                  <span style={{ color:'rgba(255,255,255,.4)' }}>Best: <b style={{ color:accent }}>{bestDay} · {Math.max(...weekHours)}h</b></span>
                </div>
              </>
          }
        </Card>

        {/* Category breakdown */}
        <Card title="🗂️ Time by Category">
          {Object.keys(breakdown).length === 0
            ? <p style={{ color:'rgba(255,255,255,.3)', textAlign:'center', padding:'20px 0', fontSize:'.85rem' }}>No tracked time this week.</p>
            : Object.entries(breakdown).map(([cat, mins]) => (
                <div key={cat} style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:'.82rem' }}>
                    <span style={{ color:'rgba(255,255,255,.6)', textTransform:'capitalize' }}>{cat}</span>
                    <span style={{ color:CATEGORY_COLOR[cat] || '#888', fontWeight:600 }}>
                      {fmtDur(mins as number)} ({Math.round((mins as number) / bTotal * 100)}%)
                    </span>
                  </div>
                  <div style={{ height:6, background:'rgba(255,255,255,.06)', borderRadius:3 }}>
                    <div style={{ height:'100%', width:`${(mins as number) / bTotal * 100}%`, background:CATEGORY_COLOR[cat] || '#888', borderRadius:3, transition:'.6s' }}/>
                  </div>
                </div>
              ))
          }
        </Card>
      </div>

      {/* Daily focus scores */}
      {weekly.length > 0 && (
        <Card title="🎯 Daily Focus Scores This Week">
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            {weekly.map((d, i) => {
              const score = Math.round(d.focusScore || 0);
              const color = score >= 70 ? '#00ff88' : score >= 40 ? accent : '#ff6b35';
              return (
                <div key={i} style={{ flex:1, minWidth:90, textAlign:'center', padding:'14px 8px', background:'rgba(255,255,255,.03)', borderRadius:6, border:`1px solid ${color}33` }}>
                  <div style={{ fontFamily:'Orbitron,monospace', fontSize:'1.2rem', fontWeight:700, color, marginBottom:4 }}>{score}%</div>
                  <div style={{ fontSize:'.7rem', color:'rgba(255,255,255,.4)' }}>
                    {new Date(d.date + 'T00:00').toLocaleDateString('en-IN', { weekday:'short', day:'numeric' })}
                  </div>
                  <div style={{ fontSize:'.7rem', color:'rgba(255,255,255,.3)', marginTop:2 }}>{fmtDur(d.totalMinutes)}</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// AI ASSISTANT TAB
// ══════════════════════════════════════════════════════════════════════════════
export function AIAssistantTab({ accent, user }: { accent: string; user: User }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'ai', text: `Hi ${user.firstName}! 👋 I'm your TimeLocus AI. Ask me anything about productivity, focus, planning, or study strategies.` }
  ]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const chatRef  = useRef<HTMLDivElement>(null);
  const accentR  = accentRgb(accent);

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  const send = async (msg?: string) => {
    const text = (msg || input).trim();
    if (!text || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setLoading(true);
    try {
      const res = await api('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: text,
          context: `${user.userType} user named ${user.firstName}`,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setMessages(prev => [...prev, { role: 'ai', text: d.reply || 'Sorry, I could not respond right now.' }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', text: '⚠️ AI service unavailable. Check your Groq API key in application.yml.' }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: '⚠️ Connection error. Check that your backend is running.' }]);
    } finally {
      setLoading(false);
    }
  };

  const QUICK = [
    'Give me a productivity tip',
    'Help me plan my study schedule',
    'How do I beat procrastination?',
    'What is the Pomodoro technique?',
    'How can I improve my focus score?',
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 160px)', gap:14 }}>
      {/* Quick prompts */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {QUICK.map(q => (
          <button
            key={q}
            onClick={() => send(q)}
            disabled={loading}
            style={{ padding:'6px 14px', background:'rgba(255,255,255,.04)', border:`1px solid rgba(${accentR},.2)`, borderRadius:20, color:'rgba(255,255,255,.6)', fontSize:'.78rem', cursor:'pointer', transition:'.2s' }}
          >{q}</button>
        ))}
      </div>

      {/* Chat window */}
      <div
        ref={chatRef}
        style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:14, padding:'4px 2px', minHeight:0 }}
      >
        {messages.map((m, i) => (
          <div key={i} style={{ display:'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth:'78%', padding:'12px 16px', borderRadius:10,
              fontSize:'.88rem', lineHeight:1.65,
              background: m.role === 'user' ? `rgba(${accentR},.15)` : 'rgba(255,255,255,.05)',
              border: m.role === 'user' ? `1px solid rgba(${accentR},.3)` : '1px solid rgba(255,255,255,.08)',
              color: m.role === 'user' ? '#fff' : 'rgba(255,255,255,.85)',
              borderBottomRightRadius: m.role === 'user' ? 2 : 10,
              borderBottomLeftRadius:  m.role === 'ai'   ? 2 : 10,
            }}>
              {m.role === 'ai' && (
                <span style={{ fontSize:'.7rem', color:accent, display:'block', marginBottom:5, fontWeight:600 }}>🤖 TimeLocus AI</span>
              )}
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display:'flex', gap:5, padding:'10px 14px', background:'rgba(255,255,255,.05)', borderRadius:10, alignSelf:'flex-start', border:'1px solid rgba(255,255,255,.08)' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width:7, height:7, borderRadius:'50%', background:accent, animation:`pulse 1.2s ${i * .2}s ease-in-out infinite` }}/>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ display:'flex', gap:10 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask me anything..."
          style={{ flex:1, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.09)', borderRadius:6, padding:'13px 16px', color:'#fff', fontFamily:'inherit', fontSize:'.9rem', outline:'none' }}
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          style={{ padding:'13px 22px', background:accent, border:'none', borderRadius:6, color:'#000', fontWeight:700, fontSize:'.88rem', cursor:'pointer', opacity: loading || !input.trim() ? .5 : 1 }}
        >Send →</button>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:.3;transform:scale(.8);} 50%{opacity:1;transform:scale(1.1);} }`}</style>
    </div>
  );
}