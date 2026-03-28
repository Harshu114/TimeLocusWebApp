'use client';
// components/dashboard/tabs/FocusZoneTab.tsx

import { useState, useEffect, useRef, useCallback } from 'react';
import { FocusStats } from '../../../types';
import { api } from '../../../lib/api';
import { fmtDur } from '../../../lib/constants';

const MODES = {
  pomodoro: { focus: 25, break: 5,  emoji: '🍅' },
  deep:     { focus: 90, break: 20, emoji: '🧠' },
  sprint:   { focus: 15, break: 3,  emoji: '⚡' },
};

export function FocusZoneTab({ accent }: { accent: string }) {
  const [mode,     setMode]     = useState<'pomodoro' | 'deep' | 'sprint'>('pomodoro');
  const [phase,    setPhase]    = useState<'focus' | 'break'>('focus');
  const [secs,     setSecs]     = useState(25 * 60);
  const [running,  setRunning]  = useState(false);
  const [sessions, setSessions] = useState(0);
  const [stats,    setStats]    = useState<FocusStats>({ sessions: 0, totalMinutes: 0 });
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const cfg        = MODES[mode];
  const phaseColor = phase === 'focus' ? accent : '#00ff88';
  const r          = 80;
  const circ       = 2 * Math.PI * r;
  const total      = (phase === 'focus' ? cfg.focus : cfg.break) * 60;
  const mm         = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss         = String(secs % 60).padStart(2, '0');

  const loadStats = useCallback(async () => {
    try {
      const r = await api('/focus/today');
      if (r.ok) setStats(await r.json());
    } catch {}
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setSecs(s => {
          if (s <= 1) {
            clearInterval(timerRef.current);
            setRunning(false);
            if (phase === 'focus') {
              api('/focus/complete', {
                method: 'POST',
                body: JSON.stringify({ mode, durationMinutes: cfg.focus }),
              }).then(() => loadStats());
              setSessions(n => n + 1);
              setPhase('break');
              setSecs(cfg.break * 60);
            } else {
              setPhase('focus');
              setSecs(cfg.focus * 60);
            }
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [running, phase, mode]);

  const switchMode = (m: typeof mode) => {
    setMode(m); setRunning(false); setPhase('focus'); setSecs(MODES[m].focus * 60);
  };

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
      {/* Timer card */}
      <div style={{ background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.07)', borderRadius:8, padding:28 }}>
        <div style={{ fontSize:'.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.12em', color:'rgba(255,255,255,.35)', marginBottom:18 }}>🧠 Focus Timer</div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>

          {/* Mode buttons */}
          <div style={{ display:'flex', gap:8 }}>
            {(Object.keys(MODES) as (typeof mode)[]).map(m => (
              <button key={m} onClick={() => switchMode(m)} style={{ padding:'6px 14px', borderRadius:20, border:'none', cursor:'pointer', fontSize:'.78rem', fontWeight:600, background: mode === m ? accent : 'rgba(255,255,255,.08)', color: mode === m ? '#000' : 'rgba(255,255,255,.5)' }}>
                {MODES[m].emoji} {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>

          {/* Phase badge */}
          <div style={{ fontSize:'.68rem', fontWeight:700, letterSpacing:'.18em', textTransform:'uppercase', color:phaseColor, background:`${phaseColor}18`, border:`1px solid ${phaseColor}44`, padding:'4px 14px', borderRadius:20 }}>
            {phase === 'focus' ? '🎯 Focus Time' : '☕ Break Time'}
          </div>

          {/* Circular timer */}
          <div style={{ position:'relative', width:200, height:200 }}>
            <svg width="200" height="200" style={{ transform:'rotate(-90deg)' }}>
              <circle cx="100" cy="100" r={r} stroke="rgba(255,255,255,0.06)" strokeWidth="8" fill="none"/>
              <circle cx="100" cy="100" r={r} stroke={phaseColor} strokeWidth="8" fill="none"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - secs / total)}
                strokeLinecap="round"
                style={{ transition:'1s linear', filter:`drop-shadow(0 0 8px ${phaseColor})` }}
              />
            </svg>
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
              <div style={{ fontFamily:'monospace', fontSize:'2.4rem', fontWeight:700, color:'#fff' }}>{mm}:{ss}</div>
              <div style={{ fontSize:'.65rem', color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:'.1em' }}>{phase}</div>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display:'flex', gap:10 }}>
            <button
              onClick={() => { setRunning(false); setSecs((phase === 'focus' ? cfg.focus : cfg.break) * 60); }}
              style={{ padding:'10px 14px', borderRadius:4, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', color:'rgba(255,255,255,.5)', cursor:'pointer' }}
            >↺</button>
            <button
              onClick={() => setRunning(v => !v)}
              style={{ padding:'12px 28px', borderRadius:4, cursor:'pointer', fontWeight:700, border: running ? '1px solid rgba(255,60,80,.4)' : 'none', background: running ? 'rgba(255,60,80,.15)' : `linear-gradient(105deg,${accent},${accent}cc)`, color: running ? '#ff4060' : '#000' }}
            >{running ? '⏸ Pause' : '▶ Start'}</button>
          </div>

          {/* Session dots */}
          <div style={{ display:'flex', gap:8 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ width:10, height:10, borderRadius:'50%', background: i < sessions % 4 ? accent : 'rgba(255,255,255,.1)', boxShadow: i < sessions % 4 ? `0 0 8px ${accent}` : 'none', transition:'.3s' }}/>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display:'flex', gap:20, fontSize:'.82rem', textAlign:'center' }}>
            <div>
              <div style={{ color:'rgba(255,255,255,.35)' }}>Sessions today</div>
              <div style={{ fontWeight:700, color:accent }}>{stats.sessions}</div>
            </div>
            <div>
              <div style={{ color:'rgba(255,255,255,.35)' }}>Focus time</div>
              <div style={{ fontWeight:700, color:accent }}>{fmtDur(stats.totalMinutes)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tips card */}
      <div style={{ background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.07)', borderRadius:8, padding:24 }}>
        <div style={{ fontSize:'.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.12em', color:'rgba(255,255,255,.35)', marginBottom:16 }}>💡 Focus Tips</div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[
            { icon:'📵', tip:'Put your phone in another room' },
            { icon:'🌐', tip:'Close all non-essential browser tabs' },
            { icon:'🎯', tip:'Set one clear goal before starting' },
            { icon:'☕', tip:'Take a proper break when the timer ends' },
            { icon:'💧', tip:'Keep water nearby' },
            { icon:'🎵', tip:'Try lo-fi music or white noise' },
            { icon:'📝', tip:'Write distracting thoughts down, deal later' },
            { icon:'⏰', tip:'25 minutes of focus = 1 Pomodoro session' },
          ].map((t, i) => (
            <div key={i} style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'10px 12px', background:'rgba(255,255,255,.03)', borderRadius:6, borderLeft:`2px solid ${accent}44` }}>
              <span style={{ fontSize:'1.1rem' }}>{t.icon}</span>
              <span style={{ fontSize:'.85rem', color:'rgba(255,255,255,.55)', lineHeight:1.5 }}>{t.tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}