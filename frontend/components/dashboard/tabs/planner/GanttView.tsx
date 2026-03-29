'use client';
// planner/GanttView.tsx — 14-day Gantt chart

interface RichEvent {
  id: string; title: string; date: string; time?: string;
  eventType: string; done: boolean; priority?: string; estimatedMins?: number;
}

const TYPE_COLOR: Record<string, string> = {
  work:'#00dcff', study:'#00ff88', meeting:'#8c3cff',
  personal:'#ff6b35', deadline:'#ff4060', health:'#00c97a',
  exam:'#ffcc00', project:'#ff6b35', review:'#8c3cff',
};

function isoDate(d: Date) { return d.toISOString().slice(0,10); }
function fmtM(m?: number) { return !m ? '' : m < 60 ? `${m}m` : `${Math.floor(m/60)}h${m%60?`${m%60}m`:''}`; }

export function GanttView({ events, accent, isDark }: { events: RichEvent[]; accent: string; isDark: boolean }) {
  const t  = isDark ? '#fff' : '#1a2340';
  const t3 = isDark ? 'rgba(255,255,255,.3)' : '#8090b0';
  const sf = isDark ? 'rgba(255,255,255,.025)' : '#fff';
  const br = isDark ? 'rgba(255,255,255,.08)' : 'rgba(100,130,200,.18)';
  const rowBg = isDark ? 'rgba(255,255,255,.02)' : 'rgba(100,130,200,.03)';

  const DAYS = 14;
  const today = new Date();
  const days = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
  const todayStr = isoDate(today);

  // Only show events within the 14-day window
  const dayStrs = days.map(isoDate);
  const visible = events
    .filter(e => dayStrs.includes(e.date))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time||'').localeCompare(b.time||''));

  if (visible.length === 0) return (
    <div style={{ background: sf, border: `1px solid ${br}`, borderRadius: 12, padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', marginBottom: 10 }}>📊</div>
      <div style={{ color: t3, fontSize: '.9rem' }}>No events in the next 14 days</div>
    </div>
  );

  return (
    <div style={{ background: sf, border: `1px solid ${br}`, borderRadius: 12, padding: 18, overflowX: 'auto' }}>
      <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '.14em', color: t3, marginBottom: 16 }}>📊 Gantt — Next 14 Days</div>

      {/* Column headers */}
      <div style={{ display: 'flex', marginBottom: 8, paddingLeft: 160 }}>
        {days.map((d, i) => {
          const dStr = isoDate(d);
          const isToday = dStr === todayStr;
          return (
            <div key={i} style={{ flex: 1, textAlign: 'center', minWidth: 36 }}>
              <div style={{ fontSize: '.58rem', color: isToday ? accent : t3,
                fontWeight: isToday ? 700 : 400 }}>
                {d.toLocaleDateString('en', { weekday: 'short' })}
              </div>
              <div style={{ fontSize: '.62rem', color: isToday ? accent : t3,
                fontWeight: isToday ? 700 : 400 }}>
                {d.getDate()}
              </div>
              {isToday && <div style={{ height: 2, background: accent, borderRadius: 1, margin: '2px auto', width: '60%' }} />}
            </div>
          );
        })}
      </div>

      {/* Event rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {visible.map((ev, idx) => {
          const col = TYPE_COLOR[ev.eventType] || '#888';
          const dayIdx = dayStrs.indexOf(ev.date);
          const barPct = Math.min(100, ((ev.estimatedMins || 60) / 480) * 100); // 8h max = full day

          // Is this a deadline/milestone?
          const isMilestone = ev.eventType === 'deadline' || ev.eventType === 'exam';

          return (
            <div key={ev.id} style={{ display: 'flex', alignItems: 'center',
              background: idx % 2 === 0 ? rowBg : 'transparent',
              borderRadius: 6, padding: '4px 0' }}>
              {/* Label */}
              <div style={{ width: 160, flexShrink: 0, paddingRight: 10, overflow: 'hidden' }}>
                <div style={{ fontSize: '.76rem', fontWeight: 600, color: ev.done ? t3 : t,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  textDecoration: ev.done ? 'line-through' : 'none' }}>
                  {ev.title}
                </div>
                <div style={{ fontSize: '.62rem', color: col }}>
                  {ev.eventType} {ev.estimatedMins ? `· ${fmtM(ev.estimatedMins)}` : ''}
                </div>
              </div>

              {/* Bar area — DAYS columns */}
              <div style={{ flex: 1, display: 'flex', position: 'relative', alignItems: 'center' }}>
                {/* Today line */}
                <div style={{ position: 'absolute', left: `${(0 / DAYS) * 100}%`,
                  top: 0, bottom: 0, width: 1, background: `${accent}44`, zIndex: 0 }} />

                {/* The bar */}
                {isMilestone ? (
                  <div style={{
                    position: 'absolute',
                    left: `${(dayIdx / DAYS) * 100}%`,
                    transform: 'translateX(-50%)',
                    width: 12, height: 12,
                    background: col,
                    clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                    zIndex: 1,
                    boxShadow: `0 0 8px ${col}`,
                    flexShrink: 0,
                  }} title={`${ev.title} — ${ev.date}`} />
                ) : (
                  <div style={{
                    position: 'absolute',
                    left: `${(dayIdx / DAYS) * 100}%`,
                    width: `${Math.max(barPct / DAYS * 100, 2)}%`,
                    height: 18,
                    background: ev.done ? `${col}44` : `linear-gradient(90deg, ${col}, ${col}99)`,
                    borderRadius: 4,
                    border: `1px solid ${col}66`,
                    zIndex: 1,
                    display: 'flex', alignItems: 'center',
                    padding: '0 5px',
                    overflow: 'hidden',
                    boxShadow: ev.done ? 'none' : `0 0 6px ${col}44`,
                  }} title={`${ev.title} · ${fmtM(ev.estimatedMins)}`}>
                    <span style={{ fontSize: '.58rem', color: '#fff', fontWeight: 600,
                      whiteSpace: 'nowrap', overflow: 'hidden' }}>
                      {ev.time ? ev.time : ''}
                    </span>
                  </div>
                )}

                {/* Column grid lines */}
                {days.map((_, ci) => (
                  <div key={ci} style={{ flex: 1, minWidth: 36, height: 28,
                    borderLeft: ci > 0 ? `1px dashed ${br}` : 'none', zIndex: 0 }} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 16, paddingTop: 12,
        borderTop: `1px solid ${br}`, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 28, height: 10, background: accent, borderRadius: 3 }} />
          <span style={{ fontSize: '.68rem', color: t3 }}>Task (bar = estimated time)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, background: '#ff4060',
            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
          <span style={{ fontSize: '.68rem', color: t3 }}>Milestone / Deadline</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 28, height: 10, background: 'rgba(255,255,255,.15)', borderRadius: 3 }} />
          <span style={{ fontSize: '.68rem', color: t3 }}>Completed</span>
        </div>
      </div>
    </div>
  );
}
