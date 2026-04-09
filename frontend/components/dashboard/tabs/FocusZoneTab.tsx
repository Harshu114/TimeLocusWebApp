'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { FocusStats, Task } from '../../../types';
import { api } from '../../../lib/api';
import { accentRgb, fmtDur } from '../../../lib/constants';
import { useTheme } from '../../../lib/ThemeContext';

type ModeKey = 'pomodoro' | 'deep' | 'sprint';
type Phase = 'focus' | 'break' | 'long_break';
type DayRecord = { date: string; sessions: number; minutes: number };
type FocusSettings = Record<ModeKey, { focus: number; break: number; longBreak: number }>;

const DEFAULT_MODES: Record<ModeKey, { label: string; focus: number; break: number; longBreak: number }> = {
  pomodoro: { label: 'Pomodoro', focus: 25, break: 5, longBreak: 15 },
  deep: { label: 'Deep', focus: 90, break: 20, longBreak: 30 },
  sprint: { label: 'Sprint', focus: 15, break: 3, longBreak: 10 },
};

const DEFAULT_SETTINGS: FocusSettings = {
  pomodoro: { focus: 25, break: 5, longBreak: 15 },
  deep: { focus: 90, break: 20, longBreak: 30 },
  sprint: { focus: 15, break: 3, longBreak: 10 },
};

const STORAGE_SETTINGS = 'tl_focus_settings';
const STORAGE_HISTORY = 'tl_focus_history';

const todayStr = () => new Date().toISOString().slice(0, 10);

function loadSettings(): FocusSettings {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: FocusSettings) {
  localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings));
}

function loadHistory(): DayRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_HISTORY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveHistory(history: DayRecord[]) {
  localStorage.setItem(STORAGE_HISTORY, JSON.stringify(history));
}

function addSessionToHistory(minutes: number): DayRecord[] {
  const history = loadHistory();
  const today = todayStr();
  const idx = history.findIndex((d) => d.date === today);
  if (idx >= 0) {
    history[idx].sessions += 1;
    history[idx].minutes += minutes;
  } else {
    history.push({ date: today, sessions: 1, minutes });
  }
  const trimmed = history.sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
  saveHistory(trimmed);
  return trimmed;
}

function calcStreak(history: DayRecord[]) {
  if (!history.length) return 0;
  const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date));
  const cursor = new Date(todayStr());
  let streak = 0;
  for (const rec of sorted) {
    const d = cursor.toISOString().slice(0, 10);
    if (rec.date === d && rec.sessions > 0) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (rec.date < d) break;
  }
  return streak;
}

export function FocusZoneTab({ accent }: { accent: string }) {
  const { isDark } = useTheme();
  const accentR = accentRgb(accent);

  const t = isDark ? '#fff' : '#1a2340';
  const t3 = isDark ? 'rgba(255,255,255,.5)' : '#64748b';
  const t4 = isDark ? 'rgba(255,255,255,.3)' : '#8090b0';
  const inputBg = isDark ? 'rgba(255,255,255,.05)' : '#fff';
  const cardBg = isDark ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.88)';
  const bd = isDark ? 'rgba(255,255,255,.12)' : 'rgba(100,130,200,.22)';
  const dashBg = isDark ? 'rgba(255,255,255,.08)' : 'rgba(100,130,200,.16)';

  const [mode, setMode] = useState<ModeKey>('pomodoro');
  const [phase, setPhase] = useState<Phase>('focus');
  const [secs, setSecs] = useState(DEFAULT_SETTINGS.pomodoro.focus * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [settings, setSettings] = useState<FocusSettings>(DEFAULT_SETTINGS);
  const [draftSettings, setDraftSettings] = useState<FocusSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [linkedTaskId, setLinkedTaskId] = useState('');
  const [showDonePrompt, setShowDonePrompt] = useState(false);
  const lastCompletedTask = useRef('');

  const [stats, setStats] = useState<FocusStats>({ sessions: 0, totalMinutes: 0 });
  const [history, setHistory] = useState<DayRecord[]>([]);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
    setDraftSettings(loaded);
    setSecs(loaded.pomodoro.focus * 60);
    const h = loadHistory();
    setHistory(h);
    setStreak(calcStreak(h));
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      const r = await api('/tasks');
      const all: Task[] = await r.json();
      setTasks(all.filter((x) => !x.done));
    } catch {}
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const r = await api('/focus/today');
      setStats(await r.json());
    } catch {}
  }, []);

  useEffect(() => {
    void loadTasks();
    void loadStats();
  }, [loadTasks, loadStats]);

  const cfg = settings[mode];
  const phaseColor = phase === 'focus' ? accent : phase === 'break' ? '#00c97e' : '#8c3cff';
  const total = (phase === 'focus' ? cfg.focus : phase === 'break' ? cfg.break : cfg.longBreak) * 60;
  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  const ring = 2 * Math.PI * 80;
  const linkedTask = tasks.find((x) => x.id === linkedTaskId);

  const handlePhaseEnd = useCallback(() => {
    if (phase === 'focus') {
      const next = sessions + 1;
      setSessions(next);
      const mins = settings[mode].focus;

      const h = addSessionToHistory(mins);
      setHistory(h);
      setStreak(calcStreak(h));

      void api('/focus/complete', {
        method: 'POST',
        body: JSON.stringify({ mode, durationMinutes: mins, linkedTaskId: linkedTaskId || undefined }),
      }).then(() => loadStats()).catch(() => {});

      if (linkedTaskId) {
        lastCompletedTask.current = linkedTaskId;
        setShowDonePrompt(true);
      }

      const nextPhase: Phase = next % 4 === 0 ? 'long_break' : 'break';
      setPhase(nextPhase);
      setSecs((nextPhase === 'long_break' ? settings[mode].longBreak : settings[mode].break) * 60);
      return;
    }

    setPhase('focus');
    setSecs(settings[mode].focus * 60);
  }, [linkedTaskId, loadStats, mode, phase, sessions, settings]);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setSecs((v) => {
          if (v <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setRunning(false);
            handlePhaseEnd();
            return 0;
          }
          return v - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [handlePhaseEnd, running]);

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
    if (!running) {
      const mins = phase === 'focus' ? draftSettings[mode].focus : phase === 'break' ? draftSettings[mode].break : draftSettings[mode].longBreak;
      setSecs(mins * 60);
    }
    setShowSettings(false);
  };

  const markTaskDone = async () => {
    try {
      await api(`/tasks/${lastCompletedTask.current}/toggle`, { method: 'PATCH' });
      setLinkedTaskId('');
      void loadTasks();
    } finally {
      setShowDonePrompt(false);
    }
  };

  const card: CSSProperties = { background: cardBg, border: `1px solid ${bd}`, borderRadius: 12, padding: 18 };
  const cardTitle: CSSProperties = { fontSize: '.72rem', fontWeight: 700, color: t3, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 12 };

  return (
    <>
      <style>{`
        .fz-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
        .fz-row{display:flex;align-items:center}
        .fz-gap{gap:8px}
        .fz-btn{padding:9px 12px;border-radius:8px;border:1px solid ${bd};background:${inputBg};color:${t3};cursor:pointer;transition:.15s;font-size:.82rem}
        .fz-btn:hover{color:${t};border-color:${accent}}
        .fz-tab{padding:7px 12px;border-radius:20px;border:1px solid ${bd};background:transparent;color:${t4};cursor:pointer;font-size:.78rem}
        .fz-tab.active{background:${accent};color:${isDark ? '#000' : '#fff'};border-color:${accent};font-weight:700}
        .fz-input{width:62px;padding:6px;border-radius:6px;border:1px solid ${bd};background:${inputBg};color:${t};text-align:center}
        .fz-select{width:100%;padding:9px;border-radius:8px;border:1px solid ${bd};background:${inputBg};color:${t}}
        @media (max-width: 980px){.fz-grid{grid-template-columns:1fr}}
      `}</style>

      {showDonePrompt && (
        <div style={{ ...card, marginBottom: 12, background: `rgba(${accentR},.09)`, borderColor: `rgba(${accentR},.28)` }}>
          <div className="fz-row" style={{ justifyContent: 'space-between', gap: 8 }}>
            <span style={{ color: t, fontSize: '.84rem' }}>
              Session complete. Mark <b style={{ color: accent }}>{tasks.find((t) => t.id === lastCompletedTask.current)?.title || 'task'}</b> done?
            </span>
            <div className="fz-row fz-gap">
              <button className="fz-btn" onClick={markTaskDone}>Mark Done</button>
              <button className="fz-btn" onClick={() => setShowDonePrompt(false)}>Skip</button>
            </div>
          </div>
        </div>
      )}

      <div className="fz-grid">
        <div style={card}>
          <div className="fz-row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={cardTitle}>Focus Timer</div>
            <button className="fz-btn" onClick={() => { setShowSettings((v) => !v); setDraftSettings(settings); }}>Settings</button>
          </div>

          {showSettings && (
            <div style={{ border: `1px solid ${bd}`, borderRadius: 10, background: inputBg, padding: 10, marginBottom: 12 }}>
              {(Object.keys(DEFAULT_MODES) as ModeKey[]).map((m) => (
                <div key={m} className="fz-row fz-gap" style={{ marginBottom: 8 }}>
                  <span style={{ minWidth: 84, color: t3, fontSize: '.82rem' }}>{DEFAULT_MODES[m].label}</span>
                  {(['focus', 'break', 'longBreak'] as const).map((k) => (
                    <input
                      key={k}
                      className="fz-input"
                      type="number"
                      min={1}
                      max={180}
                      value={draftSettings[m][k]}
                      onChange={(e) => setDraftSettings((p) => ({ ...p, [m]: { ...p[m], [k]: Math.max(1, parseInt(e.target.value, 10) || 1) } }))}
                    />
                  ))}
                </div>
              ))}
              <div className="fz-row fz-gap">
                <button className="fz-btn" onClick={applySettings}>Apply</button>
                <button className="fz-btn" onClick={() => setShowSettings(false)}>Cancel</button>
              </div>
            </div>
          )}

          <div className="fz-row fz-gap" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
            {(Object.keys(DEFAULT_MODES) as ModeKey[]).map((m) => (
              <button key={m} className={`fz-tab ${mode === m ? 'active' : ''}`} onClick={() => switchMode(m)}>{DEFAULT_MODES[m].label}</button>
            ))}
          </div>

          <div style={{ color: phaseColor, fontWeight: 700, fontSize: '.76rem', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 10 }}>
            {phase === 'focus' ? 'Focus Time' : phase === 'break' ? 'Break Time' : 'Long Break'}
          </div>

          <div style={{ position: 'relative', width: 200, height: 200, margin: '0 auto 14px' }}>
            <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="100" cy="100" r="80" stroke={dashBg} strokeWidth="8" fill="none" />
              <circle
                cx="100"
                cy="100"
                r="80"
                stroke={phaseColor}
                strokeWidth="8"
                fill="none"
                strokeDasharray={ring}
                strokeDashoffset={ring * (1 - secs / total)}
                strokeLinecap="round"
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
              <div>
                <div style={{ color: t, fontFamily: 'Orbitron,monospace', fontSize: '2.2rem', fontWeight: 700 }}>{mm}:{ss}</div>
                <div style={{ color: t3, fontSize: '.72rem' }}>{phase.replace('_', ' ')}</div>
                {running && linkedTask && <div style={{ color: accent, fontSize: '.72rem', marginTop: 4 }}>{linkedTask.title}</div>}
              </div>
            </div>
          </div>

          <div className="fz-row fz-gap" style={{ justifyContent: 'center', marginBottom: 12 }}>
            <button className="fz-btn" onClick={reset}>Reset</button>
            <button className="fz-btn" onClick={() => setRunning((v) => !v)} style={{ background: running ? 'rgba(255,60,80,.14)' : accent, color: running ? '#ff4060' : isDark ? '#000' : '#fff', borderColor: running ? 'rgba(255,60,80,.35)' : accent }}>
              {running ? 'Pause' : 'Start'}
            </button>
            <button className="fz-btn" onClick={skipPhase}>Skip</button>
          </div>

          <div className="fz-row" style={{ justifyContent: 'space-around', color: t3, fontSize: '.82rem' }}>
            <span>Sessions: <b style={{ color: accent }}>{stats.sessions}</b></span>
            <span>Focus: <b style={{ color: accent }}>{fmtDur(stats.totalMinutes)}</b></span>
            <span>Streak: <b style={{ color: streak > 0 ? '#ff9944' : t3 }}>{streak}d</b></span>
          </div>
        </div>

        <div style={card}>
          <div style={cardTitle}>Session Task</div>
          <div style={{ marginBottom: 10, color: t3, fontSize: '.82rem' }}>Link a task to this focus session:</div>
          <select className="fz-select" value={linkedTaskId} onChange={(e) => setLinkedTaskId(e.target.value)} disabled={running}>
            <option value="">No task linked</option>
            {tasks.map((tk) => (
              <option key={tk.id} value={tk.id}>
                {tk.priority === 'high' ? 'High' : tk.priority === 'medium' ? 'Medium' : 'Low'} - {tk.title}
              </option>
            ))}
          </select>

          {running && linkedTask && (
            <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: `rgba(${accentR},.08)`, border: `1px solid rgba(${accentR},.2)`, color: t }}>
              Active: {linkedTask.title}
            </div>
          )}

          <div style={{ ...cardTitle, marginTop: 14, marginBottom: 8 }}>Pending Tasks ({tasks.length})</div>
          <div style={{ display: 'grid', gap: 7, maxHeight: 260, overflowY: 'auto' }}>
            {tasks.length === 0 && <div style={{ color: t4, fontSize: '.86rem' }}>All tasks complete!</div>}
            {tasks.map((tk) => {
              const isLinked = tk.id === linkedTaskId;
              return (
                <button
                  key={tk.id}
                  onClick={() => !running && setLinkedTaskId(isLinked ? '' : tk.id)}
                  style={{
                    border: `1px solid ${isLinked ? `${accent}66` : bd}`,
                    background: isLinked ? `rgba(${accentR},.1)` : inputBg,
                    borderRadius: 8,
                    padding: '8px 10px',
                    textAlign: 'left',
                    color: t,
                    cursor: running ? 'default' : 'pointer',
                  }}
                >
                  {tk.title}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

