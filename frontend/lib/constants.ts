// lib/constants.ts
// All app-wide constants. Change here once, reflects everywhere.

import { UserType, NavItem } from '../types';

/* ================= COLORS ================= */

export const CATEGORY_COLOR: Record<string, string> = {
  work:     '#00dcff',
  meeting:  '#8c3cff',
  break:    '#ff6b35',
  study:    '#00ff88',
  personal: '#ffcc00',
  other:    '#888888',
};

export const PLANNER_TYPE_COLOR: Record<string, string> = {
  meeting:  '#8c3cff',
  work:     '#00dcff',
  deadline: '#ff4060',
  personal: '#ff6b35',
  exam:     '#ffcc00',
};

/* ================= CORE ================= */

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/* ================= NAVIGATION ================= */

export const NAV_ITEMS: Record<UserType, NavItem[]> = {
  student: [
    ['Dashboard','🏠'],
    ['Time Tracker','⏱'],
    ['Planner','📅'],
    ['Focus Zone','🧠'],
    ['Tasks','✅'],
    ['Progress','📊'],
    ['AI Assistant','🤖']
  ],

  corporate: [
    ['Dashboard','🏠'],
    ['Time Tracker','⏱'],
    ['Meetings','💼'],
    ['Focus Zone','🧠'],
    ['Tasks','✅'],
    ['Reports','📊'],
    ['AI Assistant','🤖']
  ],

  self_employed: [
    ['Dashboard','🏠'],
    ['Time Tracker','⏱'],
    ['Projects','🚀'],
    ['Focus Zone','🧠'],
    ['Tasks','✅'],
    ['Goals','🎯'],
    ['AI Assistant','🤖']
  ],

  wellbeing: [
    ['Dashboard','🏠'],
    ['Habits','💪'],
    ['Journal','📖'],
    ['Focus Zone','🧠'],
    ['Tasks','✅'],
    ['Planner','📅'],
    ['AI Assistant','🤖']
  ],
};

/* ================= USER MODES ================= */

export const USER_TYPE_CONFIG: Record<
  UserType,
  { label: string; accent: string; badge: string; greeting: string }
> = {
  student: {
    label: 'Student Mode',
    accent: '#00dcff',
    badge: '🎓',
    greeting: 'Study hard, play smart',
  },

  corporate: {
    label: 'Corporate Mode',
    accent: '#8c3cff',
    badge: '💼',
    greeting: 'Lead with precision',
  },

  self_employed: {
    label: 'Entrepreneur Mode',
    accent: '#ff6b35',
    badge: '🚀',
    greeting: 'Build your empire',
  },

  wellbeing: {
    label: 'Wellbeing Mode',
    accent: '#00ff88',
    badge: '🌸',
    greeting: 'Take care of yourself',
  },
};

/* ================= HELPERS ================= */

// Convert HEX accent → RGB (for rgba usage)
export function accentRgb(accent: string): string {
  const map: Record<string, string> = {
    '#00dcff': '0,220,255',
    '#8c3cff': '140,60,255',
    '#00ff88': '0,255,136',
    '#ff6b35': '255,107,53',
  };

  return map[accent] || '255,107,53';
}

// Format minutes → "2h 30m"
export function fmtDur(minutes: number): string {
  if (!minutes || minutes <= 0) return '0m';
  if (minutes < 60) return `${minutes}m`;

  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// Format seconds → "01:23:45"
export function fmtSecs(seconds: number): string {
  return [
    Math.floor(seconds / 3600),
    Math.floor((seconds % 3600) / 60),
    seconds % 60,
  ]
    .map(n => String(n).padStart(2, '0'))
    .join(':');
}

