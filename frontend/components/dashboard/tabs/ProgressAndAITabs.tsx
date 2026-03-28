'use client';
// components/dashboard/tabs/ProgressAndAITabs.tsx

import { useState, useEffect, useRef } from 'react';
import { DailySummary, User, ChatMessage } from '../../../types';
import { api } from '../../../lib/api';
import { CATEGORY_COLOR, WEEKDAYS, accentRgb, fmtDur } from '../../../lib/constants';
import { useTheme } from '../../../lib/ThemeContext';
import Card from '../Card';

// ══════════════════════════════════════════════════════════════════════════════
// PROGRESS TAB
// ══════════════════════════════════════════════════════════════════════════════
export function ProgressTab({ accent }: { accent: string }) {
  const { isDark } = useTheme();
  const [weekly,    setWeekly]    = useState<DailySummary[]>([]);
  const [taskStats, setTaskStats] = useState({ total: 0, done: 0 });
  const [focusStat, setFocusStat] = useState({ sessions: 0, totalMinutes: 0 });

  // Theme-aware colors
  const text      = isDark ? '#fff'                  : '#1a2340';
  const text3     = isDark ? 'rgba(255,255,255,.3)'  : '#8090b0';
  const text4     = isDark ? 'rgba(255,255,255,.4)'  : '#6a7a9a';
  const text5     = isDark ? 'rgba(255,255,255,.6)'  : '#4a5680';
  const surface   = isDark ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,0.85)';
  const border    = isDark ? 'rgba(255,255,255,.07)' : 'rgba(100,130,200,0.18)';
  const barEmpty  = isDark ? 'rgba(255,255,255,.06)' : 'rgba(100,130,200,0.1)';
  const shadow    = isDark ? 'none'                  : '0 2px 12px rgba(100,130,200,0.09)';

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
          <div key={i} style={{ background: surface, border: `1px solid ${border}`, borderRadius:8, padding:'18px 16px', boxShadow: shadow }}>
            <div style={{ fontSize:'1.2rem', marginBottom:8 }}>{s.icon}</div>
            <div style={{ fontFamily:'Orbitron,monospace', fontSize:'1.2rem', fontWeight:700, color:accent, marginBottom:3 }}>{s.val}</div>
            <div style={{ fontSize:'.72rem', color: text3, textTransform:'uppercase', letterSpacing:'.08em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
        {/* Weekly bar chart */}
        <Card title="📊 Weekly Hours" accent={accent}>
          {weekTotal === 0
            ? <p style={{ color: text3, textAlign:'center', padding:'20px 0', fontSize:'.85rem' }}>No data yet. Start tracking!</p>
            : <>
                <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:120 }}>
                  {weekHours.map((h, i) => (
                    <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                      {h > 0 && <span style={{ fontSize:'.62rem', color: text4 }}>{h}h</span>}
                      <div style={{ width:'100%', height:`${Math.max((h / maxW) * 100, h > 0 ? 4 : 2)}px`, borderRadius:'4px 4px 0 0', background: h > 0 ? `linear-gradient(180deg,${accent},${accent}66)` : barEmpty, minHeight:2 }}/>
                      <span style={{ fontSize:'.62rem', color: text3 }}>{WEEKDAYS[i]}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:12, display:'flex', gap:16, fontSize:'.78rem' }}>
                  <span style={{ color: text4 }}>Total: <b style={{ color: text }}>{weekTotal.toFixed(1)}h</b></span>
                  <span style={{ color: text4 }}>Best: <b style={{ color:accent }}>{bestDay} · {Math.max(...weekHours)}h</b></span>
                </div>
              </>
          }
        </Card>

        {/* Category breakdown */}
        <Card title="🗂️ Time by Category" accent={accent}>
          {Object.keys(breakdown).length === 0
            ? <p style={{ color: text3, textAlign:'center', padding:'20px 0', fontSize:'.85rem' }}>No tracked time this week.</p>
            : Object.entries(breakdown).map(([cat, mins]) => (
                <div key={cat} style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:'.82rem' }}>
                    <span style={{ color: text5, textTransform:'capitalize' }}>{cat}</span>
                    <span style={{ color:CATEGORY_COLOR[cat] || '#888', fontWeight:600 }}>
                      {fmtDur(mins as number)} ({Math.round((mins as number) / bTotal * 100)}%)
                    </span>
                  </div>
                  <div style={{ height:6, background: barEmpty, borderRadius:3 }}>
                    <div style={{ height:'100%', width:`${(mins as number) / bTotal * 100}%`, background:CATEGORY_COLOR[cat] || '#888', borderRadius:3, transition:'.6s' }}/>
                  </div>
                </div>
              ))
          }
        </Card>
      </div>

      {/* Daily focus scores */}
      {weekly.length > 0 && (
        <Card title="🎯 Daily Focus Scores This Week" accent={accent}>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            {weekly.map((d, i) => {
              const score = Math.round(d.focusScore || 0);
              const color = score >= 70 ? '#00ff88' : score >= 40 ? accent : '#ff6b35';
              return (
                <div key={i} style={{ flex:1, minWidth:90, textAlign:'center', padding:'14px 8px', background: isDark ? 'rgba(255,255,255,.03)' : 'rgba(100,130,200,0.04)', borderRadius:6, border:`1px solid ${color}33` }}>
                  <div style={{ fontFamily:'Orbitron,monospace', fontSize:'1.2rem', fontWeight:700, color, marginBottom:4 }}>{score}%</div>
                  <div style={{ fontSize:'.7rem', color: text4 }}>
                    {new Date(d.date + 'T00:00').toLocaleDateString('en-IN', { weekday:'short', day:'numeric' })}
                  </div>
                  <div style={{ fontSize:'.7rem', color: text3, marginTop:2 }}>{fmtDur(d.totalMinutes)}</div>
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
  const { isDark } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'ai', text: `Hi ${user.firstName}! 👋 I'm your TimeLocus AI. Ask me anything about productivity, focus, planning, or study strategies.` }
  ]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const chatRef  = useRef<HTMLDivElement>(null);
  const accentR  = accentRgb(accent);

  // Theme-aware colors
  const text      = isDark ? '#fff'                  : '#1a2340';
  const text3     = isDark ? 'rgba(255,255,255,.3)'  : '#8090b0';
  const text4     = isDark ? 'rgba(255,255,255,.4)'  : '#6a7a9a';
  const surface   = isDark ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,0.85)';
  const border    = isDark ? 'rgba(255,255,255,.08)' : 'rgba(100,130,200,0.18)';
  const inputBg   = isDark ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,0.95)';
  const inputBdr  = isDark ? 'rgba(255,255,255,.1)'  : 'rgba(100,130,200,0.2)';
  const aiBubble  = isDark ? 'rgba(255,255,255,.04)' : 'rgba(100,130,200,0.06)';
  const userBubble = `rgba(${accentR},.12)`;
  const chipBg    = isDark ? 'rgba(255,255,255,.04)' : 'rgba(100,130,200,0.08)';
  const chipBdr   = isDark ? 'rgba(255,255,255,.08)' : 'rgba(100,130,200,0.15)';
  const chipText  = isDark ? 'rgba(255,255,255,.5)'  : '#4a5680';
  const shadow    = isDark ? 'none'                  : '0 2px 12px rgba(100,130,200,0.09)';

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  const send = async (msg?: string) => {
    const t = (msg || input).trim();
    if (!t || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: t }]);
    setLoading(true);
    try {
      const res = await api('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: t,
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
            style={{
              padding:'7px 14px', borderRadius:20,
              background: chipBg,
              border: `1px solid ${chipBdr}`,
              color: chipText,
              fontSize:'.78rem', cursor:'pointer', fontFamily:'inherit',
              transition:'.2s',
            }}
          >{q}</button>
        ))}
      </div>

      {/* Chat area */}
      <div
        ref={chatRef}
        style={{
          flex:1, overflowY:'auto', padding:16,
          background: surface,
          border: `1px solid ${border}`,
          borderRadius:8,
          display:'flex', flexDirection:'column', gap:12,
          boxShadow: shadow,
        }}
      >
        {messages.map((m, i) => (
          <div key={i} style={{ display:'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth:'75%', padding:'12px 16px', borderRadius:12,
              background: m.role === 'user' ? userBubble : aiBubble,
              border: `1px solid ${m.role === 'user' ? `rgba(${accentR},.2)` : border}`,
              color: text, fontSize:'.9rem', lineHeight:1.6,
              whiteSpace:'pre-wrap',
            }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display:'flex', gap:6, padding:'8px 0' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:accent, opacity:.4, animation:`pulse 1s ${i * 0.2}s infinite` }}/>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ display:'flex', gap:10 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask me anything..."
          style={{
            flex:1, background: inputBg, border: `1px solid ${inputBdr}`,
            borderRadius:8, padding:'14px 16px', color: text,
            fontFamily:'inherit', fontSize:'.92rem', outline:'none',
          }}
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          style={{
            padding:'14px 24px', background: accent, border:'none',
            borderRadius:8, color:'#000', fontWeight:700, cursor:'pointer',
            fontFamily:'Orbitron,monospace', fontSize:'.75rem', letterSpacing:'.05em',
            opacity: loading || !input.trim() ? .5 : 1,
          }}
        >Send</button>
      </div>
    </div>
  );
}
