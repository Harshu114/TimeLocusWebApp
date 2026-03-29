'use client';
// planner/CalendarView.tsx — Monthly + Weekly Calendar views

import { useState } from 'react';

interface RichEvent {
  id: string; title: string; date: string; time?: string;
  eventType: string; done: boolean; priority?: string; estimatedMins?: number;
}

const TYPE_COLOR: Record<string, string> = {
  work:'#00dcff', study:'#00ff88', meeting:'#8c3cff',
  personal:'#ff6b35', deadline:'#ff4060', health:'#00c97a',
  exam:'#ffcc00', project:'#ff6b35', review:'#8c3cff',
};
const WEEKDAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function isoDate(d: Date) { return d.toISOString().slice(0,10); }

/* ── Monthly Calendar ─────────────────────────────── */
export function CalendarView({
  events, accent, isDark, onDayClick,
}: {
  events: RichEvent[]; accent: string; isDark: boolean;
  onDayClick: (date: string) => void;
}) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(isoDate(new Date()));

  const t  = isDark ? '#fff' : '#1a2340';
  const t3 = isDark ? 'rgba(255,255,255,.3)' : '#8090b0';
  const sf = isDark ? 'rgba(255,255,255,.03)' : '#fff';
  const br = isDark ? 'rgba(255,255,255,.08)' : 'rgba(100,130,200,.18)';
  const s2 = isDark ? 'rgba(255,255,255,.06)' : 'rgba(230,238,255,.75)';

  const year  = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthLabel = cursor.toLocaleDateString('en', { month: 'long', year: 'numeric' });

  // Build grid: pad to Monday start
  const firstDay = new Date(year, month, 1);
  const startPad = (firstDay.getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const evMap: Record<string, RichEvent[]> = {};
  events.forEach(e => { (evMap[e.date] ||= []).push(e); });

  const todayStr = isoDate(new Date());
  const selectedEvs = selectedDay ? (evMap[selectedDay] || []) : [];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 18 }}>
      {/* Calendar Grid */}
      <div style={{ background: sf, border: `1px solid ${br}`, borderRadius: 12, padding: 18 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button onClick={() => setCursor(new Date(year, month - 1, 1))}
            style={{ background: s2, border: `1px solid ${br}`, borderRadius: 6, padding: '4px 12px', color: t, cursor: 'pointer', fontSize: '.9rem' }}>‹</button>
          <span style={{ fontFamily: 'Orbitron,monospace', fontSize: '.95rem', fontWeight: 700, color: t }}>{monthLabel}</span>
          <button onClick={() => setCursor(new Date(year, month + 1, 1))}
            style={{ background: s2, border: `1px solid ${br}`, borderRadius: 6, padding: '4px 12px', color: t, cursor: 'pointer', fontSize: '.9rem' }}>›</button>
        </div>

        {/* Weekday headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, marginBottom: 6 }}>
          {WEEKDAY_LABELS.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: '.65rem', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '.08em', color: t3, padding: '4px 0' }}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const ds = isoDate(day);
            const dayEvs = evMap[ds] || [];
            const isToday = ds === todayStr;
            const isSel   = ds === selectedDay;
            return (
              <div key={i} onClick={() => { setSelectedDay(ds); onDayClick(ds); }}
                style={{
                  borderRadius: 8, padding: '7px 4px', cursor: 'pointer', transition: '.15s',
                  background: isSel ? `${accent}22` : isToday ? `${accent}0f` : 'transparent',
                  border: isSel ? `1.5px solid ${accent}` : isToday ? `1.5px solid ${accent}55` : `1px solid ${br}`,
                  minHeight: 54,
                }}>
                <div style={{ textAlign: 'center', fontSize: '.78rem', fontWeight: isToday || isSel ? 700 : 400,
                  color: isToday || isSel ? accent : t, marginBottom: 4 }}>{day.getDate()}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                  {dayEvs.slice(0, 3).map((ev, j) => (
                    <div key={j} style={{ width: 6, height: 6, borderRadius: '50%',
                      background: ev.done ? 'rgba(255,255,255,.2)' : TYPE_COLOR[ev.eventType] || '#888',
                      opacity: ev.done ? .4 : 1 }} />
                  ))}
                  {dayEvs.length > 3 && (
                    <span style={{ fontSize: '.52rem', color: t3 }}>+{dayEvs.length - 3}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day detail panel */}
      <div style={{ background: sf, border: `1px solid ${br}`, borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '.12em', color: t3, marginBottom: 12 }}>
          {selectedDay
            ? new Date(selectedDay + 'T00:00').toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' })
            : 'Select a day'}
        </div>
        {selectedEvs.length === 0
          ? <div style={{ textAlign: 'center', padding: '30px 0', color: t3, fontSize: '.85rem' }}>Nothing planned</div>
          : selectedEvs.map((ev, i) => {
              const col = TYPE_COLOR[ev.eventType] || '#888';
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '10px 11px',
                  background: isDark ? 'rgba(255,255,255,.03)' : 'rgba(100,130,200,.04)',
                  border: `1px solid ${br}`, borderLeft: `3px solid ${col}`,
                  borderRadius: 8, marginBottom: 7, opacity: ev.done ? .55 : 1 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: col,
                    flexShrink: 0, marginTop: 4 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '.84rem', fontWeight: 600, color: t,
                      textDecoration: ev.done ? 'line-through' : 'none',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                    {ev.time && <div style={{ fontSize: '.7rem', color: t3, marginTop: 2 }}>🕐 {ev.time}</div>}
                  </div>
                </div>
              );
            })
        }
      </div>
    </div>
  );
}

/* ── Weekly View ──────────────────────────────────── */
export function WeekView({
  events, accent, isDark, onDayClick,
}: {
  events: RichEvent[]; accent: string; isDark: boolean;
  onDayClick: (date: string) => void;
}) {
  const [weekOffset, setWeekOffset] = useState(0);

  const t  = isDark ? '#fff' : '#1a2340';
  const t3 = isDark ? 'rgba(255,255,255,.3)' : '#8090b0';
  const sf = isDark ? 'rgba(255,255,255,.025)' : '#fff';
  const br = isDark ? 'rgba(255,255,255,.08)' : 'rgba(100,130,200,.18)';

  // Build Mon–Sun for current week + offset
  const getWeekDays = () => {
    const now = new Date();
    const dayOfWeek = (now.getDay() + 6) % 7; // Mon = 0
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };

  const weekDays = getWeekDays();
  const todayStr = isoDate(new Date());
  const weekLabel = `${weekDays[0].toLocaleDateString('en',{day:'numeric',month:'short'})} – ${weekDays[6].toLocaleDateString('en',{day:'numeric',month:'short',year:'numeric'})}`;

  const evMap: Record<string, RichEvent[]> = {};
  events.forEach(e => { (evMap[e.date] ||= []).push(e); });

  return (
    <div style={{ background: sf, border: `1px solid ${br}`, borderRadius: 12, padding: 18 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={() => setWeekOffset(w => w - 1)}
          style={{ background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(100,130,200,.08)', border: `1px solid ${br}`,
            borderRadius: 6, padding: '4px 12px', color: t, cursor: 'pointer', fontSize: '.9rem' }}>‹ Prev</button>
        <div>
          <span style={{ fontFamily: 'Orbitron,monospace', fontSize: '.88rem', fontWeight: 700, color: t }}>{weekLabel}</span>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)}
              style={{ marginLeft: 12, background: 'none', border: 'none', color: accent,
                cursor: 'pointer', fontSize: '.75rem', fontFamily: 'inherit' }}>Today</button>
          )}
        </div>
        <button onClick={() => setWeekOffset(w => w + 1)}
          style={{ background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(100,130,200,.08)', border: `1px solid ${br}`,
            borderRadius: 6, padding: '4px 12px', color: t, cursor: 'pointer', fontSize: '.9rem' }}>Next ›</button>
      </div>

      {/* 7-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 8 }}>
        {weekDays.map((day, i) => {
          const ds = isoDate(day);
          const dayEvs = (evMap[ds] || []).sort((a,b) => (a.time||'').localeCompare(b.time||''));
          const isToday = ds === todayStr;
          return (
            <div key={i} onClick={() => onDayClick(ds)}
              style={{ cursor: 'pointer', borderRadius: 10,
                border: isToday ? `2px solid ${accent}` : `1px solid ${br}`,
                background: isToday ? `${accent}08` : isDark ? 'rgba(255,255,255,.02)' : 'rgba(100,130,200,.04)',
                minHeight: 200, overflow: 'hidden' }}>
              {/* Day header */}
              <div style={{ padding: '8px 8px 6px', borderBottom: `1px solid ${br}`,
                background: isToday ? `${accent}14` : 'transparent', textAlign: 'center' }}>
                <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '.08em', color: isToday ? accent : t3 }}>{WEEKDAY_LABELS[i]}</div>
                <div style={{ fontFamily: 'Orbitron,monospace', fontSize: '1rem', fontWeight: 700,
                  color: isToday ? accent : t, marginTop: 2 }}>{day.getDate()}</div>
              </div>
              {/* Events */}
              <div style={{ padding: '6px 5px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {dayEvs.length === 0
                  ? <div style={{ textAlign: 'center', padding: '12px 0', fontSize: '.65rem', color: t3 }}>—</div>
                  : dayEvs.map((ev, j) => {
                      const col = TYPE_COLOR[ev.eventType] || '#888';
                      return (
                        <div key={j} style={{ borderRadius: 5, padding: '4px 6px',
                          background: `${col}1a`, border: `1px solid ${col}44`,
                          opacity: ev.done ? .5 : 1 }}>
                          {ev.time && <div style={{ fontSize: '.58rem', color: col, marginBottom: 1 }}>{ev.time}</div>}
                          <div style={{ fontSize: '.7rem', color: t, fontWeight: 600, lineHeight: 1.3,
                            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical' as any }}>{ev.title}</div>
                        </div>
                      );
                    })
                }
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
