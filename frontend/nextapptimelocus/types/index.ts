// types/index.ts
// All shared TypeScript types used across the app

export type UserType = 'student' | 'corporate' | 'self_employed';

export interface User {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: UserType;
}

export interface TimeEntry {
  id: string;
  task: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  category: string;
  manual: boolean;
}

export interface CategoryBreakdown {
  category: string;
  minutes: number;
  percentage: number;
}

export interface DailySummary {
  date: string;
  totalMinutes: number;
  focusScore: number;
  taskCount: number;
  breakdown: CategoryBreakdown[];
}

export interface Task {
  id: string;
  title: string;
  done: boolean;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
}

export interface TaskStats {
  total: number;
  done: number;
}

export interface PlannerEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  eventType: string;
  done: boolean;
}

export interface FocusStats {
  sessions: number;
  totalMinutes: number;
}

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

export type NavItem = [string, string]; // [label, emoji]
