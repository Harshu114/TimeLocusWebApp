// lib/constants.ts
// All app-wide constants. Change here once, reflects everywhere.

import { UserType, NavItem } from '../types';

export const CATEGORY_COLOR: Record<string, string> = {
  work:     '#00dcff',
  meeting:  '#8c3cff',
  break:    '#ff6b35',
  study:    '#00ff88',
  personal: '#ffcc00',
  other:    '#888888',
};

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const NAV_ITEMS: Record<UserType, NavItem[]> = {
  student:       [['Dashboard','🏠'],['Time Tracker','⏱'],['Planner','📅'],['Focus Zone','🧠'],['Tasks','✅'],['Progress','📊'],['AI Assistant','🤖']],
  corporate:     [['Dashboard','🏠'],['Time Tracker','⏱'],['Meetings','💼'],['Focus Zone','🧠'],['Tasks','✅'],['Reports','📊'],['AI Assistant','🤖']],
  self_employed: [['Dashboard','🏠'],['Time Tracker','⏱'],['Projects','🚀'],['Focus Zone','🧠'],['Tasks','✅'],['Goals','🎯'],['AI Assistant','🤖']],
};

export const USER_TYPE_CONFIG: Record<UserType, { label: string; accent: string; badge: string; greeting: string }> = {
  student:       { label: 'Student Mode',      accent: '#00dcff', badge: '🎓', greeting: 'Study hard, play smart' },
  corporate:     { label: 'Corporate Mode',    accent: '#8c3cff', badge: '💼', greeting: 'Lead with precision' },
  self_employed: { label: 'Entrepreneur Mode', accent: '#ff6b35', badge: '🚀', greeting: 'Build your empire' },
};

export const PLANNER_TYPE_COLOR: Record<string, string> = {
  meeting:  '#8c3cff',
  work:     '#00dcff',
  deadline: '#ff4060',
  personal: '#ff6b35',
  exam:     '#ffcc00',
};

// Helper: get accent RGB string for CSS rgba()
export function accentRgb(accent: string): string {
  if (accent === '#00dcff') return '0,220,255';
  if (accent === '#8c3cff') return '140,60,255';
  return '255,107,53';
}

// Helper: format minutes as "2h 30m"
export function fmtDur(minutes: number): string {
  if (!minutes || minutes <= 0) return '0m';
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

// Helper: format seconds as "01:23:45"
export function fmtSecs(seconds: number): string {
  return [
    Math.floor(seconds / 3600),
    Math.floor((seconds % 3600) / 60),
    seconds % 60,
  ].map(n => String(n).padStart(2, '0')).join(':');
}
