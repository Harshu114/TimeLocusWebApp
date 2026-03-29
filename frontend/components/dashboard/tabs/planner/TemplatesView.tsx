'use client';
// planner/TemplatesView.tsx — Pre-built planning templates

import { useState } from 'react';

interface TemplateEvent {
  title: string; time: string; eventType: string; priority: string;
  estimatedMins: number; energy: string; subtasks?: string[];
}
interface Template {
  id: string; icon: string; name: string; desc: string; color: string;
  events: TemplateEvent[];
}

const TEMPLATES: Template[] = [
  {
    id: 'daily', icon: '📋', name: 'Daily Agenda', color: '#00dcff',
    desc: '8 time-blocked productivity slots to structure your day',
    events: [
      { title: 'Morning Review',      time: '08:00', eventType: 'review',   priority: 'medium', estimatedMins: 15, energy: 'peak' },
      { title: 'Deep Work Block 1',   time: '09:00', eventType: 'work',     priority: 'high',   estimatedMins: 90, energy: 'peak' },
      { title: 'Email & Messages',    time: '10:30', eventType: 'work',     priority: 'medium', estimatedMins: 30, energy: 'normal' },
      { title: 'Team Sync',           time: '11:00', eventType: 'meeting',  priority: 'medium', estimatedMins: 60, energy: 'normal' },
      { title: 'Lunch & Break',       time: '12:00', eventType: 'personal', priority: 'low',    estimatedMins: 60, energy: 'low' },
      { title: 'Deep Work Block 2',   time: '13:30', eventType: 'work',     priority: 'high',   estimatedMins: 90, energy: 'peak' },
      { title: 'Admin & Follow-ups',  time: '15:00', eventType: 'work',     priority: 'low',    estimatedMins: 45, energy: 'low' },
      { title: 'End-of-Day Review',   time: '17:00', eventType: 'review',   priority: 'medium', estimatedMins: 15, energy: 'low' },
    ],
  },
  {
    id: 'meal', icon: '🥗', name: 'Meal Planning', color: '#00ff88',
    desc: 'Weekly nutrition prep, grocery and cooking blocks',
    events: [
      { title: 'Grocery Shopping',  time: '10:00', eventType: 'personal', priority: 'medium', estimatedMins: 60, energy: 'normal',
        subtasks: ['Vegetables & fruits', 'Proteins', 'Grains & pantry', 'Snacks'] },
      { title: 'Meal Prep & Cook',  time: '12:00', eventType: 'health',   priority: 'medium', estimatedMins: 90, energy: 'normal',
        subtasks: ['Chop & prep', 'Cook grains', 'Batch cook proteins', 'Pack portions'] },
      { title: 'Breakfast',         time: '07:30', eventType: 'health',   priority: 'low',    estimatedMins: 20, energy: 'normal' },
      { title: 'Lunch',             time: '13:00', eventType: 'health',   priority: 'low',    estimatedMins: 30, energy: 'low' },
      { title: 'Dinner Prep',       time: '18:30', eventType: 'health',   priority: 'medium', estimatedMins: 45, energy: 'normal' },
    ],
  },
  {
    id: 'budget', icon: '💰', name: 'Budget Review', color: '#ffcc00',
    desc: 'Monthly financial planning and expense tracking',
    events: [
      { title: 'Review Income Sources', time: '09:00', eventType: 'work', priority: 'high', estimatedMins: 30, energy: 'peak',
        subtasks: ['Salary & wages', 'Freelance income', 'Passive income', 'Total income'] },
      { title: 'Track Expenses',        time: '09:30', eventType: 'work', priority: 'high', estimatedMins: 45, energy: 'peak',
        subtasks: ['Fixed costs (rent, bills)', 'Variable costs', 'Subscriptions audit', 'Impulse spending'] },
      { title: 'Savings & Investments', time: '10:15', eventType: 'work', priority: 'high', estimatedMins: 30, energy: 'peak',
        subtasks: ['Emergency fund check', 'Investment portfolio', 'Next month targets'] },
      { title: 'Budget Summary Report', time: '10:45', eventType: 'review', priority: 'medium', estimatedMins: 20, energy: 'normal' },
    ],
  },
  {
    id: 'travel', icon: '✈️', name: 'Travel Prep', color: '#8c3cff',
    desc: 'Complete travel checklist — logistics, documents, packing',
    events: [
      { title: 'Book Flights & Hotels', time: '09:00', eventType: 'personal', priority: 'critical', estimatedMins: 60, energy: 'peak',
        subtasks: ['Search & compare flights', 'Book hotel/Airbnb', 'Confirm reservations'] },
      { title: 'Documents & Visa',      time: '10:00', eventType: 'personal', priority: 'high',     estimatedMins: 45, energy: 'peak',
        subtasks: ['Passport validity check', 'Visa application', 'Travel insurance', 'Copies of all docs'] },
      { title: 'Packing List',          time: '14:00', eventType: 'personal', priority: 'medium',   estimatedMins: 30, energy: 'normal',
        subtasks: ['Clothes & shoes', 'Electronics & chargers', 'Toiletries', 'Medications', 'Documents folder'] },
      { title: 'Itinerary Planning',    time: '15:00', eventType: 'personal', priority: 'medium',   estimatedMins: 60, energy: 'normal',
        subtasks: ['Day-by-day plan', 'Restaurant reservations', 'Activities & tickets'] },
    ],
  },
  {
    id: 'study', icon: '📚', name: 'Study Session', color: '#00dcff',
    desc: 'Pomodoro-based deep study blocks with active recall',
    events: [
      { title: '📚 Pomodoro 1 — Active Reading',   time: '08:00', eventType: 'study',  priority: 'high', estimatedMins: 25, energy: 'peak' },
      { title: '🛑 Short Break',                    time: '08:25', eventType: 'health', priority: 'low',  estimatedMins: 5,  energy: 'low' },
      { title: '📚 Pomodoro 2 — Practice Problems', time: '08:30', eventType: 'study',  priority: 'high', estimatedMins: 25, energy: 'peak' },
      { title: '🛑 Short Break',                    time: '08:55', eventType: 'health', priority: 'low',  estimatedMins: 5,  energy: 'low' },
      { title: '📚 Pomodoro 3 — Flashcards',        time: '09:00', eventType: 'study',  priority: 'high', estimatedMins: 25, energy: 'peak' },
      { title: '🛑 Short Break',                    time: '09:25', eventType: 'health', priority: 'low',  estimatedMins: 5,  energy: 'low' },
      { title: '📚 Pomodoro 4 — Review & Notes',    time: '09:30', eventType: 'study',  priority: 'high', estimatedMins: 25, energy: 'peak' },
      { title: '☕ Long Break',                      time: '09:55', eventType: 'health', priority: 'low',  estimatedMins: 15, energy: 'low' },
    ],
  },
  {
    id: 'adhd', icon: '🧠', name: 'ADHD Support', color: '#ff6b35',
    desc: 'Chunked micro-tasks, body doubles & mandatory movement breaks',
    events: [
      { title: '🧠 Micro-Focus 1 (10 min)',  time: '09:00', eventType: 'work',     priority: 'high',   estimatedMins: 10, energy: 'peak',
        subtasks: ['Pick ONE small task', 'Remove all distractions', 'Start the timer now'] },
      { title: '💆 Movement Break',          time: '09:10', eventType: 'health',   priority: 'high',   estimatedMins: 5,  energy: 'low' },
      { title: '🧠 Micro-Focus 2 (10 min)',  time: '09:15', eventType: 'work',     priority: 'high',   estimatedMins: 10, energy: 'peak' },
      { title: '💆 Movement Break',          time: '09:25', eventType: 'health',   priority: 'high',   estimatedMins: 5,  energy: 'low' },
      { title: '🧠 Micro-Focus 3 (10 min)',  time: '09:30', eventType: 'work',     priority: 'high',   estimatedMins: 10, energy: 'peak' },
      { title: '🎉 Big Break + Self-Reward', time: '09:40', eventType: 'personal', priority: 'high',   estimatedMins: 20, energy: 'low' },
      { title: '🧠 Micro-Focus 4 (10 min)',  time: '10:00', eventType: 'work',     priority: 'medium', estimatedMins: 10, energy: 'peak' },
      { title: '💆 Walk & Reset',            time: '10:10', eventType: 'health',   priority: 'high',   estimatedMins: 10, energy: 'low' },
    ],
  },
  {
    id: 'bujo', icon: '📓', name: 'Bullet Journal', color: '#ff4060',
    desc: 'Daily log, migration, gratitude and evening reflection',
    events: [
      { title: '📓 Morning Brain Dump',    time: '07:00', eventType: 'personal', priority: 'medium', estimatedMins: 15, energy: 'normal',
        subtasks: ['Tasks for today', 'Events & appointments', 'Notes & ideas'] },
      { title: '🔄 Migration Check',      time: '07:15', eventType: 'review',   priority: 'medium', estimatedMins: 10, energy: 'normal',
        subtasks: ['Carry forward incomplete tasks', 'Schedule future items', 'Delete what no longer matters'] },
      { title: '🌟 Gratitude & Intentions', time: '07:25', eventType: 'personal', priority: 'low', estimatedMins: 5,  energy: 'normal' },
      { title: '📓 Evening Reflection',   time: '21:00', eventType: 'review',   priority: 'medium', estimatedMins: 15, energy: 'low',
        subtasks: ['Review day tasks', 'Rate energy & mood', 'Plan tomorrow top 3', 'Free journal'] },
    ],
  },
];

export function TemplatesView({
  accent, isDark, onApply,
}: {
  accent: string;
  isDark: boolean;
  onApply: (events: TemplateEvent[], date: string) => Promise<void>;
}) {
  const [templateDate, setTemplateDate] = useState(() => new Date().toISOString().slice(0,10));
  const [applying, setApplying]         = useState<string | null>(null);
  const [applied, setApplied]           = useState<string | null>(null);

  const t  = isDark ? '#fff' : '#1a2340';
  const t2 = isDark ? 'rgba(255,255,255,.6)' : '#4a5680';
  const t3 = isDark ? 'rgba(255,255,255,.32)' : '#8090b0';
  const sf = isDark ? 'rgba(255,255,255,.025)' : '#fff';
  const br = isDark ? 'rgba(255,255,255,.09)' : 'rgba(100,130,200,.18)';
  const ib = isDark ? 'rgba(255,255,255,.07)' : '#fff';
  const id = isDark ? 'rgba(255,255,255,.12)' : 'rgba(100,130,200,.28)';

  const handleApply = async (tmpl: Template) => {
    setApplying(tmpl.id);
    await onApply(tmpl.events, templateDate);
    setApplying(null);
    setApplied(tmpl.id);
    setTimeout(() => setApplied(null), 2000);
  };

  return (
    <div>
      {/* Date picker */}
      <div style={{ background: sf, border: `1px solid ${br}`, borderRadius: 10, padding: 14,
        marginBottom: 18, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '.12em', color: t3 }}>📋 Apply Template to Date</div>
        <input type="date" value={templateDate} onChange={e => setTemplateDate(e.target.value)}
          style={{ background: ib, border: `1px solid ${id}`, borderRadius: 7, padding: '7px 12px',
            color: t, fontFamily: 'inherit', fontSize: '.86rem', outline: 'none', colorScheme: isDark ? 'dark' : 'light' }} />
        <span style={{ fontSize: '.78rem', color: t3 }}>Events will be added to this date</span>
      </div>

      {/* Template cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
        {TEMPLATES.map(tmpl => (
          <div key={tmpl.id} style={{ background: sf, borderTop: `1px solid ${br}`,
            borderRight: `1px solid ${br}`, borderBottom: `1px solid ${br}`,
            borderLeft: `3px solid ${tmpl.color}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: '1.5rem' }}>{tmpl.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '.94rem', color: t }}>{tmpl.name}</div>
                  <div style={{ fontSize: '.78rem', color: t3, marginTop: 2, lineHeight: 1.4 }}>{tmpl.desc}</div>
                </div>
                <span style={{ fontSize: '.68rem', color: tmpl.color, background: `${tmpl.color}18`,
                  border: `1px solid ${tmpl.color}44`, borderRadius: 10, padding: '2px 8px', whiteSpace: 'nowrap' }}>
                  {tmpl.events.length} events
                </span>
              </div>

              {/* Preview events */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 12 }}>
                {tmpl.events.slice(0, 4).map((ev, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: '.62rem', color: t3, minWidth: 38 }}>{ev.time}</span>
                    <span style={{ fontSize: '.78rem', color: t2, overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{ev.title}</span>
                    <span style={{ fontSize: '.6rem', color: t3 }}>
                      {ev.estimatedMins < 60 ? `${ev.estimatedMins}m` : `${Math.floor(ev.estimatedMins/60)}h`}
                    </span>
                  </div>
                ))}
                {tmpl.events.length > 4 && (
                  <div style={{ fontSize: '.68rem', color: t3, paddingLeft: 45 }}>
                    +{tmpl.events.length - 4} more events…
                  </div>
                )}
              </div>

              <button
                onClick={() => handleApply(tmpl)}
                disabled={applying === tmpl.id}
                style={{
                  width: '100%', padding: '9px 0', borderRadius: 7, cursor: 'pointer',
                  background: applied === tmpl.id ? '#00c97a' : applying === tmpl.id ? `${accent}66` : `${tmpl.color}22`,
                  color: applied === tmpl.id ? '#fff' : tmpl.color,
                  fontWeight: 700, fontSize: '.82rem', fontFamily: 'inherit',
                  border: `1px solid ${applied === tmpl.id ? '#00c97a44' : tmpl.color + '44'}`,
                  transition: '.2s',
                }}>
                {applied === tmpl.id ? '✓ Added!' : applying === tmpl.id ? 'Adding…' : `+ Use This Template`}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
