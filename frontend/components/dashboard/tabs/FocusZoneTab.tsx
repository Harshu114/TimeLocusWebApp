'use client';
// components/dashboard/tabs/FocusZoneTab.tsx

import { useState, useEffect, useRef, useCallback } from 'react';
import { FocusStats, Task } from '../../../types';
import { api } from '../../../lib/api';
import { fmtDur, accentRgb } from '../../../lib/constants';
import { useTheme } from '../../../lib/ThemeContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type ModeKey = 'pomodoro' | 'deep' | 'sprint';
type Phase   = 'focus' | 'break' | 'long_break';

interface ModeConfig {
  label:     string;
  emoji:     string;
  focus:     number;
  break:     number;
  longBreak: number;
}

interface FocusSettings {
  pomodoro: { focus: number; break: number; longBreak: number };
  deep:     { focus: number; break: number; longBreak: number };
  sprint:   { focus: number; break: number; longBreak: number };
}

interface DayRecord {
  date:     string; // YYYY-MM-DD
  sessions: number;
  minutes:  number;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_MODES: Record<ModeKey, ModeConfig> = {
  pomodoro: { label: 'Pomodoro', emoji: '🍅', focus: 25, break: 5,  longBreak: 15 },
  deep:     { label: 'Deep',     emoji: '🧠', focus: 90, break: 20, longBreak: 30 },
  sprint:   { label: 'Sprint',   emoji: '⚡', focus: 15, break: 3,  longBreak: 10 },
};

const DEFAULT_SETTINGS: FocusSettings = {
  pomodoro: { focus: 25, break: 5,  longBreak: 15 },
  deep:     { focus: 90, break: 20, longBreak: 30 },
  sprint:   { focus: 15, break: 3,  longBreak: 10 },
};

const STORAGE_SETTINGS = 'tl_focus_settings';
const STORAGE_HISTORY  = 'tl_focus_history';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadSettings(): FocusSettings {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_SETTINGS;
}

function saveSettings(s: FocusSettings) {
  localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(s));
}

function loadHistory(): DayRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_HISTORY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveHistory(h: DayRecord[]) {
  localStorage.setItem(STORAGE_HISTORY, JSON.stringify(h));
}

function addSessionToHistory(minutes: number): DayRecord[] {
  const history = loadHistory();
  const today   = todayStr();
  const idx     = history.findIndex(d => d.date === today);
  if (idx >= 0) {
    history[idx].sessions += 1;
    history[idx].minutes  += minutes;
  } else {
    history.push({ date: today, sessions: 1, minutes });
  }
  // Keep last 30 days
  const trimmed = history.sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
  saveHistory(trimmed);
  return trimmed;
}

function calcStreak(history: DayRecord[]): number {
  if (!history.length) return 0;
  const today = todayStr();
  const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  let cursor = new Date(today);
  for (const rec of sorted) {
    const d = cursor.toISOString().slice(0, 10);
    if (rec.date === d && rec.sessions > 0) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (rec.date < d) {
      break;
    }
  }
  return streak;
}

function last7Days(): string[] {
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FocusZoneTab({ accent }: { accent: string }) {
  const accentR = accentRgb(accent);
  const { isDark } = useTheme();

  // Theme tokens
  const t      = isDark ? '#fff' : '#1a2340';
  const t2     = isDark ? 'rgba(255,255,255,.7)'  : '#334155';
  const t3     = isDark ? 'rgba(255,255,255,.45)' : '#64748b';
  const t4     = isDark ? 'rgba(255,255,255,.3)'  : '#8090b0';
  const t5     = isDark ? 'rgba(255,255,255,.2)'  : '#cbd5e1';
  const bgCard = isDark ? 'rgba(255,255,255,.025)': 'rgba(255,255,255,0.85)';
  const bgInput= isDark ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,0.95)';
  const btnBg  = isDark ? 'rgba(255,255,255,.06)' : 'rgba(100,130,200,.08)';
  const btnHov = isDark ? 'rgba(255,255,255,.12)' : 'rgba(100,130,200,.15)';
  const bd     = isDark ? 'rgba(255,255,255,.09)' : 'rgba(100,130,200,.2)';
  const bdCard = isDark ? 'rgba(255,255,255,.07)' : 'rgba(100,130,200,.18)';
  const sh     = isDark ? 'none' : '0 2px 10px rgba(100,130,200,.08)';
  const dashBg = isDark ? 'rgba(255,255,255,0.06)': 'rgba(100,130,200,0.15)';
  const ttBg   = isDark ? '#1a2340'               : '#fff';
  const ttColor= isDark ? '#fff'                  : '#1a2340';
  const ttBd   = isDark ? 'rgba(255,255,255,.1)'  : 'rgba(100,130,200,.2)';

  // Timer state
  const [mode,     setMode]     = useState<ModeKey>('pomodoro');
  const [phase,    setPhase]    = useState<Phase>('focus');
  const [secs,     setSecs]     = useState(DEFAULT_SETTINGS.pomodoro.focus * 60);
  const [running,  setRunning]  = useState(false);
  const [sessions, setSessions] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // Settings state
  const [settings,     setSettings]     = useState<FocusSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [draftSettings, setDraftSettings] = useState<FocusSettings>(DEFAULT_SETTINGS);

  // Task state
  const [tasks,          setTasks]          = useState<Task[]>([]);
  const [linkedTaskId,   setLinkedTaskId]   = useState<string>('');
  const [showDonePrompt, setShowDonePrompt] = useState(false);
  const lastCompletedTask = useRef<string>('');

  // Analytics state
  const [stats,       setStats]       = useState<FocusStats>({ sessions: 0, totalMinutes: 0 });
  const [history,     setHistory]     = useState<DayRecord[]>([]);
  const [streak,      setStreak]      = useState(0);

  // ── Boot ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    setDraftSettings(s);
    setSecs(s[mode].focus * 60);

    const h = loadHistory();
    setHistory(h);
    setStreak(calcStreak(h));
  }, []);

  // ── Load tasks & API stats ──────────────────────────────────────────────────

  const loadTasks = useCallback(async () => {
    try {
      const r = await api('/tasks');
      if (r.ok) {
        const all: Task[] = await r.json();
        setTasks(all.filter(t => !t.done));
      }
    } catch {}
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const r = await api('/focus/today');
      if (r.ok) setStats(await r.json());
    } catch {}
  }, []);

  useEffect(() => {
    loadTasks();
    loadStats();
  }, [loadTasks, loadStats]);

  // ── Timer tick ──────────────────────────────────────────────────────────────

  const cfg = settings[mode];
  const phaseColor = phase === 'focus' ? accent : phase === 'break' ? '#00ff88' : '#8c3cff';
  const total      = (phase === 'focus' ? cfg.focus : phase === 'break' ? cfg.break : cfg.longBreak) * 60;
  const r          = 80;
  const circ       = 2 * Math.PI * r;
  const mm         = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss         = String(secs % 60).padStart(2, '0');

  const handlePhaseEnd = useCallback(() => {
    if (phase === 'focus') {
      const newSessions = sessions + 1;
      setSessions(newSessions);
      const focusMins = settings[mode].focus;

      // Record to local history
      const h = addSessionToHistory(focusMins);
      setHistory(h);
      setStreak(calcStreak(h));

      // API call
      api('/focus/complete', {
        method: 'POST',
        body: JSON.stringify({ mode, durationMinutes: focusMins, linkedTaskId: linkedTaskId || undefined }),
      }).then(() => loadStats());

      // Prompt to mark task done
      if (linkedTaskId) {
        lastCompletedTask.current = linkedTaskId;
        setShowDonePrompt(true);
      }

      // Long break every 4 sessions
      if (newSessions % 4 === 0) {
        setPhase('long_break');
        setSecs(settings[mode].longBreak * 60);
      } else {
        setPhase('break');
        setSecs(settings[mode].break * 60);
      }
    } else {
      setPhase('focus');
      setSecs(settings[mode].focus * 60);
    }
  }, [phase, sessions, settings, mode, linkedTaskId, loadStats]);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setSecs(s => {
          if (s <= 1) {
            clearInterval(timerRef.current);
            setRunning(false);
            handlePhaseEnd();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [running, handlePhaseEnd]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const switchMode = (m: ModeKey) => {
    setMode(m);
    setRunning(false);
    setPhase('focus');
    setSecs(settings[m].focus * 60);
  };

  const reset = () => {
    setRunning(false);
    const mins = phase === 'focus' ? cfg.focus : phase === 'break' ? cfg.break : cfg.longBreak;
    setSecs(mins * 60);
  };

  const skipPhase = () => {
    setRunning(false);
    handlePhaseEnd();
  };

  const applySettings = () => {
    setSettings(draftSettings);
    saveSettings(draftSettings);
    // Reset timer to new value if not running
    if (!running) {
      const mins = phase === 'focus' ? draftSettings[mode].focus
                 : phase === 'break' ? draftSettings[mode].break
                 : draftSettings[mode].longBreak;
      setSecs(mins * 60);
    }
    setShowSettings(false);
  };

  const markTaskDone = async () => {
    try {
      await api(`/tasks/${lastCompletedTask.current}/toggle`, { method: 'PATCH' });
      setLinkedTaskId('');
      setShowDonePrompt(false);
      loadTasks();
    } catch {
      setShowDonePrompt(false);
    }
  };

  // ── Analytics helpers ───────────────────────────────────────────────────────

  const days7 = last7Days();
  const histMap: Record<string, DayRecord> = {};
  history.forEach(d => { histMap[d.date] = d; });
  const day7Data = days7.map(d => histMap[d] || { date: d, sessions: 0, minutes: 0 });
  const maxSessions = Math.max(...day7Data.map(d => d.sessions), 1);
  const totalSessions7 = day7Data.reduce((a, b) => a + b.sessions, 0);
  const totalMinutes7  = day7Data.reduce((a, b) => a + b.minutes, 0);

  function heatColor(s: number): string {
    if (s === 0) return 'rgba(255,255,255,.06)';
    const pct = Math.min(s / 4, 1); // 4+ = full saturation
    if (pct >= 1)    return accent;
    if (pct >= 0.6)  return `${accent}cc`;
    if (pct >= 0.3)  return `${accent}77`;
    return `${accent}33`;
  }

  const linkedTask = tasks.find(t => t.id === linkedTaskId);

  // ── Shared card style ───────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    background: bgCard,
    border: `1px solid ${bdCard}`,
    borderRadius: 10,
    padding: 24,
    boxShadow: sh,
  };
  const cardTitle: React.CSSProperties = {
    fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '.14em', color: t3, marginBottom: 18,
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes fz-pulse{0%,100%{opacity:.35;transform:scale(.85);}50%{opacity:1;transform:scale(1.1);}}
        @keyframes fz-fadein{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
        .fz-tab{padding:6px 14px;border-radius:20px;border:1px solid ${isDark ? 'rgba(255,255,255,.1)' : 'rgba(100,130,200,.2)'};background:transparent;
          color:${t4};font-family:inherit;font-size:.78rem;cursor:pointer;transition:.2s;}
        .fz-tab:hover{border-color:${isDark ? 'rgba(255,255,255,.25)' : 'rgba(100,130,200,.4)'};color:${t2};}
        .fz-tab.active{color:${isDark ? '#000' : '#fff'};border:none;font-weight:700;}
        .fz-btn-sm{padding:10px 14px;border-radius:6px;background:${btnBg};
          border:1px solid ${bd};color:${t3};font-size:.85rem;
          cursor:pointer;transition:.2s;font-family:inherit;}
        .fz-btn-sm:hover{background:${btnHov};color:${t};}
        .fz-icon-btn{width:32px;height:32px;display:flex;align-items:center;justify-content:center;
          border-radius:6px;background:${btnBg};border:1px solid ${bd};
          color:${t3};cursor:pointer;transition:.2s;font-size:.9rem;}
        .fz-icon-btn:hover{background:${btnHov};color:${t};}
        .fz-settings-panel{animation:fz-fadein .18s ease;}
        .fz-num-input{width:64px;background:${btnBg};border:1px solid ${bd};
          border-radius:5px;padding:6px 8px;color:${t};font-family:inherit;font-size:.88rem;outline:none;text-align:center;}
        .fz-num-input:focus{border-color:var(--accent);}
        .fz-task-select{flex:1;background:${bgInput};border:1px solid ${bd};
          border-radius:6px;padding:10px 12px;color:${t};font-family:inherit;font-size:.86rem;outline:none;cursor:pointer;}
        .fz-task-select:focus{border-color:var(--accent);}
        .fz-task-select option{background:${isDark ? '#0e1828' : '#fff'};}
        .fz-heatbox{width:30px;height:30px;border-radius:5px;transition:.3s;cursor:default;position:relative;}
        .fz-heatbox:hover .fz-tooltip{display:block;}
        .fz-tooltip{display:none;position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);
          background:${ttBg};border:1px solid ${ttBd};border-radius:5px;padding:5px 9px;
          font-size:.72rem;color:${ttColor};white-space:nowrap;z-index:10;pointer-events:none;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);}
        .fz-done-prompt{animation:fz-fadein .22s ease;}
        .fz-bar{border-radius:4px 4px 0 0;transition:.5s;min-height:3px;}
      `}</style>

      <div style={{ '--accent': accent } as React.CSSProperties}>

        {/* ── Done Prompt ────────────────────────────────────────────────── */}
        {showDonePrompt && (
          <div className="fz-done-prompt" style={{
            background: `rgba(${accentR},.1)`, border: `1px solid rgba(${accentR},.3)`,
            borderRadius: 8, padding: '14px 20px', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 14,
            boxShadow: sh,
          }}>
            <span style={{ fontSize: '1.1rem' }}>🎯</span>
            <span style={{ flex: 1, fontSize: '.9rem', color: t }}>
              Session complete! Mark <b style={{ color: accent }}>
                {tasks.find(t => t.id === lastCompletedTask.current)?.title || 'linked task'}
              </b> as done?
            </span>
            <button onClick={markTaskDone} style={{
              padding: '7px 16px', borderRadius: 6, background: accent, border: 'none',
              color: isDark ? '#000' : '#fff', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer',
            }}>✓ Mark Done</button>
            <button onClick={() => setShowDonePrompt(false)} style={{
              padding: '7px 12px', borderRadius: 6, background: btnBg,
              border: `1px solid ${bd}`, color: t3,
              fontSize: '.82rem', cursor: 'pointer',
            }}>Skip</button>
          </div>
        )}

        {/* ── Main Grid ──────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>

          {/* ── Timer Card ───────────────────────────────────────────────── */}
          <div style={card}>
            {/* Card header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={cardTitle as React.CSSProperties}>🧠 Focus Timer</div>
              <button
                className="fz-icon-btn"
                title="Timer settings"
                onClick={() => { setShowSettings(v => !v); setDraftSettings(settings); }}
              >⚙</button>
            </div>

            {/* Settings panel */}
            {showSettings && (
              <div className="fz-settings-panel" style={{
                background: bgInput, border: `1px solid ${bd}`,
                borderRadius: 8, padding: 16, marginBottom: 18,
              }}>
                <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: t3, marginBottom: 12 }}>
                  Customize Durations (minutes)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(Object.keys(DEFAULT_MODES) as ModeKey[]).map(m => (
                    <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 80, fontSize: '.82rem', color: t2 }}>
                        {DEFAULT_MODES[m].emoji} {DEFAULT_MODES[m].label}
                      </span>
                      {(['focus', 'break', 'longBreak'] as const).map(field => (
                        <div key={field} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                          <span style={{ fontSize: '.64rem', color: t4, textTransform: 'capitalize' }}>
                            {field === 'longBreak' ? 'Long Brk' : field}
                          </span>
                          <input
                            type="number"
                            className="fz-num-input"
                            min={1} max={180}
                            value={draftSettings[m][field]}
                            onChange={e => setDraftSettings(prev => ({
                              ...prev,
                              [m]: { ...prev[m], [field]: Math.max(1, parseInt(e.target.value) || 1) },
                            }))}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button onClick={applySettings} style={{
                    flex: 1, padding: '9px 0', borderRadius: 6, background: accent, border: 'none',
                    color: isDark ? '#000' : '#fff', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer',
                  }}>Apply</button>
                  <button onClick={() => setShowSettings(false)} style={{
                    padding: '9px 16px', borderRadius: 6, background: btnBg,
                    border: `1px solid ${bd}`, color: t3,
                    fontSize: '.82rem', cursor: 'pointer',
                  }}>Cancel</button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              {/* Mode tabs */}
              <div style={{ display: 'flex', gap: 8 }}>
                {(Object.keys(DEFAULT_MODES) as ModeKey[]).map(m => (
                  <button
                    key={m}
                    className={`fz-tab ${mode === m ? 'active' : ''}`}
                    style={mode === m ? { background: accent, color: isDark ? '#000' : '#fff' } : {}}
                    onClick={() => switchMode(m)}
                  >
                    {DEFAULT_MODES[m].emoji} {DEFAULT_MODES[m].label}
                  </button>
                ))}
              </div>

              {/* Phase badge */}
              <div style={{
                fontSize: '.68rem', fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase',
                color: phaseColor, background: `${phaseColor}18`, border: `1px solid ${phaseColor}44`,
                padding: '4px 14px', borderRadius: 20,
              }}>
                {phase === 'focus' ? '🎯 Focus Time' : phase === 'break' ? '☕ Break Time' : '🌙 Long Break'}
              </div>

              {/* Circular timer */}
              <div style={{ position: 'relative', width: 200, height: 200 }}>
                <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="100" cy="100" r={r} stroke={dashBg} strokeWidth="8" fill="none"/>
                  <circle cx="100" cy="100" r={r} stroke={phaseColor} strokeWidth="8" fill="none"
                    strokeDasharray={circ}
                    strokeDashoffset={circ * (1 - secs / total)}
                    strokeLinecap="round"
                    style={{ transition: '1s linear', filter: `drop-shadow(0 0 8px ${phaseColor})` }}
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <div style={{ fontFamily: 'Orbitron,monospace', fontSize: '2.4rem', fontWeight: 700, color: t }}>{mm}:{ss}</div>
                  <div style={{ fontSize: '.62rem', color: t3, textTransform: 'uppercase', letterSpacing: '.1em' }}>
                    {phase.replace('_', ' ')}
                  </div>
                  {running && linkedTask && (
                    <div style={{
                      fontSize: '.65rem', color: accent, background: `${accent}18`,
                      border: `1px solid ${accent}33`, borderRadius: 10, padding: '2px 10px',
                      maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {linkedTask.title}
                    </div>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="fz-btn-sm" onClick={reset} title="Reset">↺</button>
                <button
                  onClick={() => setRunning(v => !v)}
                  style={{
                    padding: '12px 28px', borderRadius: 6, cursor: 'pointer', fontWeight: 700,
                    fontFamily: 'Orbitron,monospace', fontSize: '.7rem', letterSpacing: '.1em',
                    border: running ? '1px solid rgba(255,60,80,.4)' : 'none',
                    background: running ? 'rgba(255,60,80,.15)' : `linear-gradient(105deg,${accent},${accent}cc)`,
                    color: running ? '#ff4060' : (isDark ? '#000' : '#fff'),
                    transition: '.2s',
                  }}
                >
                  {running ? '⏸ Pause' : '▶ Start'}
                </button>
                <button className="fz-btn-sm" onClick={skipPhase} title="Skip phase">⏭</button>
              </div>

              {/* Session dots */}
              <div style={{ display: 'flex', gap: 8 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: i < sessions % 4 ? accent : (isDark ? 'rgba(255,255,255,.1)' : 'rgba(100,130,200,.2)'),
                    boxShadow: i < sessions % 4 ? `0 0 8px ${accent}` : 'none',
                    transition: '.3s',
                  }}/>
                ))}
              </div>

              {/* Quick stats */}
              <div style={{ display: 'flex', gap: 24, fontSize: '.82rem', textAlign: 'center' }}>
                <div>
                  <div style={{ color: t3, marginBottom: 2 }}>Sessions today</div>
                  <div style={{ fontWeight: 700, color: accent, fontFamily: 'Orbitron,monospace' }}>{stats.sessions}</div>
                </div>
                <div>
                  <div style={{ color: t3, marginBottom: 2 }}>Focus time</div>
                  <div style={{ fontWeight: 700, color: accent, fontFamily: 'Orbitron,monospace' }}>{fmtDur(stats.totalMinutes)}</div>
                </div>
                <div>
                  <div style={{ color: t3, marginBottom: 2 }}>🔥 Streak</div>
                  <div style={{ fontWeight: 700, color: streak > 0 ? '#ff9944' : t3, fontFamily: 'Orbitron,monospace' }}>
                    {streak}d
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Task Integration Card ─────────────────────────────────────── */}
          <div style={card}>
            <div style={cardTitle as React.CSSProperties}>✅ Session Task</div>

            {/* Task picker */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '.8rem', color: t4, marginBottom: 8 }}>
                Link a task to this focus session:
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  className="fz-task-select"
                  value={linkedTaskId}
                  onChange={e => setLinkedTaskId(e.target.value)}
                  disabled={running}
                >
                  <option value="">— No task linked —</option>
                  {tasks.map(tk => (
                    <option key={tk.id} value={tk.id}>
                      {tk.priority === 'high' ? '🔴' : tk.priority === 'medium' ? '🟡' : '🟢'} {tk.title}
                    </option>
                  ))}
                </select>
                {tasks.length === 0 && (
                  <div style={{ fontSize: '.78rem', color: t3, alignSelf: 'center', whiteSpace: 'nowrap' }}>
                    No pending tasks
                  </div>
                )}
              </div>
              {running && linkedTask && (
                <div style={{
                  marginTop: 12, display: 'flex', alignItems: 'center', gap: 10,
                  background: `rgba(${accentR},.08)`, border: `1px solid rgba(${accentR},.2)`,
                  borderRadius: 8, padding: '10px 14px',
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: accent, boxShadow: `0 0 8px ${accent}`, flexShrink: 0 }}/>
                  <span style={{ fontSize: '.88rem', color: t, flex: 1 }}>{linkedTask.title}</span>
                  <span style={{
                    fontSize: '.68rem', color: accent, background: `${accent}18`, border: `1px solid ${accent}33`,
                    borderRadius: 10, padding: '2px 9px', textTransform: 'uppercase', letterSpacing: '.08em',
                  }}>Active</span>
                </div>
              )}
            </div>

            {/* Pending tasks mini-list */}
            <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: t4, marginBottom: 10 }}>
              Pending Tasks ({tasks.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 280, overflowY: 'auto' }}>
              {tasks.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px 0', color: t5, fontSize: '.86rem' }}>
                  All tasks complete! 🎉
                </div>
              )}
              {tasks.map(tk => {
                const isLinked = tk.id === linkedTaskId;
                const pColor = tk.priority === 'high' ? '#ff4060' : tk.priority === 'medium' ? '#ffcc00' : '#00ff88';
                return (
                  <div
                    key={tk.id}
                    onClick={() => !running && setLinkedTaskId(isLinked ? '' : tk.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                      background: isLinked ? `rgba(${accentR},.08)` : bgInput,
                      border: isLinked ? `1px solid rgba(${accentR},.25)` : `1px solid ${bd}`,
                      borderRadius: 7, cursor: running ? 'default' : 'pointer',
                      transition: '.18s',
                    }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: pColor, boxShadow: `0 0 6px ${pColor}`, flexShrink: 0 }}/>
                    <span style={{ flex: 1, fontSize: '.85rem', color: t }}>{tk.title}</span>
                    {isLinked && <span style={{ fontSize: '.68rem', color: accent }}>linked</span>}
                  </div>
                );
              })}
            </div>

            {/* Focus tips (compact) */}
            <div style={{ marginTop: 18, borderTop: `1px solid ${bd}`, paddingTop: 14 }}>
              <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: t3, marginBottom: 10 }}>
                💡 Focus Tips
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { icon: '📵', tip: 'Phone in another room' },
                  { icon: '🎯', tip: 'One clear goal per session' },
                  { icon: '🎵', tip: 'Lo-fi music or white noise' },
                  { icon: '💧', tip: 'Stay hydrated' },
                ].map((tp, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 10, alignItems: 'center', padding: '7px 10px',
                    background: btnBg, borderRadius: 5,
                    borderLeft: `2px solid ${accent}33`,
                  }}>
                    <span style={{ fontSize: '.95rem' }}>{tp.icon}</span>
                    <span style={{ fontSize: '.81rem', color: t3 }}>{tp.tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Analytics Strip ─────────────────────────────────────────────── */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={cardTitle as React.CSSProperties}>📊 Focus Analytics</div>
            <div style={{ display: 'flex', gap: 20, fontSize: '.82rem' }}>
              <span style={{ color: t3 }}>
                7-day total: <b style={{ color: accent, fontFamily: 'Orbitron,monospace' }}>{totalSessions7}</b> sessions
              </span>
              <span style={{ color: t3 }}>
                Focus time: <b style={{ color: accent, fontFamily: 'Orbitron,monospace' }}>{fmtDur(totalMinutes7)}</b>
              </span>
              <span style={{ color: '#ff9944' }}>
                🔥 Streak: <b style={{ fontFamily: 'Orbitron,monospace' }}>{streak} day{streak !== 1 ? 's' : ''}</b>
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Heatmap */}
            <div>
              <div style={{ fontSize: '.72rem', color: t4, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.1em' }}>
                7-Day Heatmap
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                {day7Data.map((d, i) => {
                  const label = new Date(d.date + 'T00:00').toLocaleDateString('en', { weekday: 'short' });
                  const isToday = d.date === new Date().toISOString().slice(0, 10);
                  return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <div
                        className="fz-heatbox"
                        style={{
                          background: d.sessions === 0 ? btnBg : heatColor(d.sessions),
                          boxShadow: d.sessions > 0 ? `0 0 10px ${accent}44` : 'none',
                          outline: isToday ? `2px solid ${accent}` : 'none',
                          outlineOffset: 2,
                        }}
                      >
                        <div className="fz-tooltip">
                          {d.date}<br/>
                          {d.sessions} session{d.sessions !== 1 ? 's' : ''}<br/>
                          {fmtDur(d.minutes)}
                        </div>
                      </div>
                      <span style={{ fontSize: '.62rem', color: isToday ? accent : t4 }}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Legend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14 }}>
                <span style={{ fontSize: '.65rem', color: t4 }}>Less</span>
                {[0, 1, 2, 3, 4].map(n => (
                  <div key={n} style={{ width: 14, height: 14, borderRadius: 3, background: n === 0 ? btnBg : heatColor(n) }}/>
                ))}
                <span style={{ fontSize: '.65rem', color: t4 }}>More</span>
              </div>
            </div>

            {/* Bar chart */}
            <div>
              <div style={{ fontSize: '.72rem', color: t4, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.1em' }}>
                Sessions per Day
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80 }}>
                {day7Data.map((d, i) => {
                  const label = new Date(d.date + 'T00:00').toLocaleDateString('en', { weekday: 'short' });
                  const pct   = d.sessions / maxSessions;
                  const isToday = d.date === new Date().toISOString().slice(0, 10);
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      {d.sessions > 0 && (
                        <span style={{ fontSize: '.6rem', color: t4 }}>{d.sessions}</span>
                      )}
                      <div
                        className="fz-bar"
                        style={{
                          width: '100%',
                          height: `${Math.max(pct * 60, d.sessions > 0 ? 8 : 3)}px`,
                          background: d.sessions > 0
                            ? `linear-gradient(180deg, ${accent}, ${accent}66)`
                            : dashBg,
                          boxShadow: d.sessions > 0 ? `0 0 8px ${accent}44` : 'none',
                          outline: isToday ? `1px solid ${accent}88` : 'none',
                        }}
                      />
                      <span style={{ fontSize: '.62rem', color: isToday ? accent : t4 }}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
              {totalSessions7 === 0 && (
                <div style={{ textAlign: 'center', paddingTop: 8, fontSize: '.82rem', color: t5 }}>
                  Complete your first session to see analytics!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}