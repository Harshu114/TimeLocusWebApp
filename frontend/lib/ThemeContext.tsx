'use client';
// lib/ThemeContext.tsx

import { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  isDark: true,
});

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  if (theme === 'light') {
    root.style.setProperty('--bg',              '#f0f4ff');
    root.style.setProperty('--bg2',             '#e8eef8');
    root.style.setProperty('--bg3',             '#dce5f5');
    root.style.setProperty('--surface',         'rgba(255,255,255,0.90)');
    root.style.setProperty('--surface2',        'rgba(255,255,255,0.70)');
    root.style.setProperty('--border',          'rgba(100,130,200,0.20)');
    root.style.setProperty('--text',            '#1a2340');
    root.style.setProperty('--text2',           '#4a5680');
    root.style.setProperty('--text3',           '#8090b0');
    root.style.setProperty('--sidebar-bg',      'rgba(230,238,255,0.97)');
    root.style.setProperty('--header-bg',       'rgba(240,244,255,0.95)');
    root.style.setProperty('--card-bg',         'rgba(255,255,255,0.85)');
    root.style.setProperty('--input-bg',        'rgba(255,255,255,0.75)');
    root.style.setProperty('--scrollbar-thumb', 'rgba(100,130,200,0.3)');
    root.style.setProperty('--shadow',          '0 2px 16px rgba(100,130,200,0.12)');
    document.body.style.background = '#f0f4ff';
    document.body.style.color      = '#1a2340';
  } else {
    root.style.setProperty('--bg',              '#080c14');
    root.style.setProperty('--bg2',             '#0e1828');
    root.style.setProperty('--bg3',             '#111a2c');
    root.style.setProperty('--surface',         'rgba(255,255,255,0.025)');
    root.style.setProperty('--surface2',        'rgba(255,255,255,0.04)');
    root.style.setProperty('--border',          'rgba(255,255,255,0.07)');
    root.style.setProperty('--text',            '#ffffff');
    root.style.setProperty('--text2',           'rgba(255,255,255,0.60)');
    root.style.setProperty('--text3',           'rgba(255,255,255,0.30)');
    root.style.setProperty('--sidebar-bg',      'rgba(6,12,24,0.97)');
    root.style.setProperty('--header-bg',       'rgba(6,12,24,0.95)');
    root.style.setProperty('--card-bg',         'rgba(255,255,255,0.025)');
    root.style.setProperty('--input-bg',        'rgba(255,255,255,0.04)');
    root.style.setProperty('--scrollbar-thumb', 'rgba(0,220,255,0.20)');
    root.style.setProperty('--shadow',          '0 2px 16px rgba(0,0,0,0.4)');
    document.body.style.background = '#080c14';
    document.body.style.color      = '#ffffff';
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    // Read saved preference and apply immediately
    const saved = localStorage.getItem('tl_theme') as Theme;
    const initial = (saved === 'light' || saved === 'dark') ? saved : 'dark';
    setTheme(initial);
    applyTheme(initial);
  }, []);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('tl_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);