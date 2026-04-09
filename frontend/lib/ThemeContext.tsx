'use client';
// lib/ThemeContext.tsx

import { createContext, useContext, useState, useEffect } from 'react';

type ThemePreset = 'daylight-blue' | 'lavender-dreams' | 'minty-fresh' | 'blush' | 'citrus' | 'crystal-clear' | 'neon-night' | 'midnight' | 'sunset' | 'forest';

interface ThemeConfig {
  name: string;
  emoji: string;
  description: string;
  isDark: boolean;
  colors: {
    bg: string;
    bg2: string;
    bg3: string;
    surface: string;
    surface2: string;
    border: string;
    text: string;
    text2: string;
    text3: string;
    sidebarBg: string;
    headerBg: string;
    cardBg: string;
    inputBg: string;
    scrollbarThumb: string;
    shadow: string;
    accent: string;
    accentLight: string;
    buttonBg: string;
    buttonHover: string;
  };
}

interface ThemeContextType {
  currentTheme: ThemePreset;
  setTheme: (t: ThemePreset) => void;
  themeConfig: ThemeConfig;
  isDark: boolean;
  accent: string;
}

const THEMES: Record<ThemePreset, ThemeConfig> = {
  'daylight-blue': {
    name: 'Daylight Blue',
    emoji: '☀️',
    description: 'Bright light mode',
    isDark: false,
    colors: {
      bg: '#f0f4ff',
      bg2: '#e8eef8',
      bg3: '#dce5f5',
      surface: 'rgba(59,130,246,0.05)',
      surface2: 'rgba(59,130,246,0.08)',
      border: 'rgba(59,130,246,0.20)',
      text: '#1a2340',
      text2: '#334155',
      text3: '#64748b',
      sidebarBg: 'rgba(230,238,255,0.97)',
      headerBg: 'rgba(240,244,255,0.95)',
      cardBg: 'rgba(255,255,255,0.85)',
      inputBg: 'rgba(255,255,255,0.95)',
      scrollbarThumb: 'rgba(59,130,246,0.3)',
      shadow: '0 2px 16px rgba(59,130,246,0.12)',
      accent: '#3b82f6',
      accentLight: 'rgba(59,130,246,0.15)',
      buttonBg: 'rgba(59,130,246,0.08)',
      buttonHover: 'rgba(59,130,246,0.15)',
    },
  },
  'lavender-dreams': {
    name: 'Lavender Dreams',
    emoji: '💜',
    description: 'Soft light mode',
    isDark: false,
    colors: {
      bg: '#f5f1ff',
      bg2: '#ede9fb',
      bg3: '#e5dff8',
      surface: 'rgba(139,92,246,0.05)',
      surface2: 'rgba(139,92,246,0.08)',
      border: 'rgba(139,92,246,0.20)',
      text: '#3b2667',
      text2: '#5a4e7a',
      text3: '#7c6fa1',
      sidebarBg: 'rgba(237,233,251,0.97)',
      headerBg: 'rgba(245,241,255,0.95)',
      cardBg: 'rgba(255,255,255,0.88)',
      inputBg: 'rgba(255,255,255,0.95)',
      scrollbarThumb: 'rgba(139,92,246,0.3)',
      shadow: '0 2px 16px rgba(139,92,246,0.12)',
      accent: '#a855f7',
      accentLight: 'rgba(139,92,246,0.15)',
      buttonBg: 'rgba(139,92,246,0.08)',
      buttonHover: 'rgba(139,92,246,0.15)',
    },
  },
  'minty-fresh': {
    name: 'Minty Fresh',
    emoji: '🌿',
    description: 'Fresh green light',
    isDark: false,
    colors: {
      bg: '#f0fdf9',
      bg2: '#ebfdf5',
      bg3: '#dffbf0',
      surface: 'rgba(16,185,129,0.05)',
      surface2: 'rgba(16,185,129,0.08)',
      border: 'rgba(16,185,129,0.20)',
      text: '#064e3b',
      text2: '#1e6b56',
      text3: '#3a8672',
      sidebarBg: 'rgba(236,254,245,0.97)',
      headerBg: 'rgba(240,255,252,0.96)',
      cardBg: 'rgba(255,255,255,0.88)',
      inputBg: 'rgba(255,255,255,0.95)',
      scrollbarThumb: 'rgba(16,185,129,0.3)',
      shadow: '0 2px 16px rgba(16,185,129,0.12)',
      accent: '#10b981',
      accentLight: 'rgba(16,185,129,0.15)',
      buttonBg: 'rgba(16,185,129,0.08)',
      buttonHover: 'rgba(16,185,129,0.15)',
    },
  },
  'blush': {
    name: 'Blush',
    emoji: '💗',
    description: 'Soft pink light',
    isDark: false,
    colors: {
      bg: '#fff1f8',
      bg2: '#ffecf3',
      bg3: '#ffe4ed',
      surface: 'rgba(236,72,153,0.05)',
      surface2: 'rgba(236,72,153,0.08)',
      border: 'rgba(236,72,153,0.20)',
      text: '#6b1d47',
      text2: '#903a62',
      text3: '#b85a8a',
      sidebarBg: 'rgba(255,228,243,0.97)',
      headerBg: 'rgba(255,241,248,0.96)',
      cardBg: 'rgba(255,255,255,0.88)',
      inputBg: 'rgba(255,255,255,0.95)',
      scrollbarThumb: 'rgba(236,72,153,0.3)',
      shadow: '0 2px 16px rgba(236,72,153,0.12)',
      accent: '#ec4899',
      accentLight: 'rgba(236,72,153,0.15)',
      buttonBg: 'rgba(236,72,153,0.08)',
      buttonHover: 'rgba(236,72,153,0.15)',
    },
  },
  'citrus': {
    name: 'Citrus',
    emoji: '🍊',
    description: 'Energetic light',
    isDark: false,
    colors: {
      bg: '#fff7ed',
      bg2: '#ffead5',
      bg3: '#fed7aa',
      surface: 'rgba(249,115,22,0.05)',
      surface2: 'rgba(249,115,22,0.08)',
      border: 'rgba(249,115,22,0.20)',
      text: '#7c2d12',
      text2: '#b84a1f',
      text3: '#d97706',
      sidebarBg: 'rgba(255,237,213,0.97)',
      headerBg: 'rgba(255,247,237,0.96)',
      cardBg: 'rgba(255,255,255,0.88)',
      inputBg: 'rgba(255,255,255,0.95)',
      scrollbarThumb: 'rgba(249,115,22,0.3)',
      shadow: '0 2px 16px rgba(249,115,22,0.12)',
      accent: '#f97316',
      accentLight: 'rgba(249,115,22,0.15)',
      buttonBg: 'rgba(249,115,22,0.08)',
      buttonHover: 'rgba(249,115,22,0.15)',
    },
  },
  'crystal-clear': {
    name: 'Crystal Clear',
    emoji: '💎',
    description: 'Clean cyan light',
    isDark: false,
    colors: {
      bg: '#f0fdfa',
      bg2: '#e0f9f7',
      bg3: '#ccf2f0',
      surface: 'rgba(20,184,166,0.05)',
      surface2: 'rgba(20,184,166,0.08)',
      border: 'rgba(20,184,166,0.20)',
      text: '#134e4a',
      text2: '#216967',
      text3: '#2d8a88',
      sidebarBg: 'rgba(240,253,250,0.97)',
      headerBg: 'rgba(240,253,250,0.96)',
      cardBg: 'rgba(255,255,255,0.88)',
      inputBg: 'rgba(255,255,255,0.95)',
      scrollbarThumb: 'rgba(20,184,166,0.3)',
      shadow: '0 2px 16px rgba(20,184,166,0.12)',
      accent: '#14b8a6',
      accentLight: 'rgba(20,184,166,0.15)',
      buttonBg: 'rgba(20,184,166,0.08)',
      buttonHover: 'rgba(20,184,166,0.15)',
    },
  },
  'neon-night': {
    name: 'Neon Night',
    emoji: '🌙',
    description: 'Bright green glow',
    isDark: true,
    colors: {
      bg: '#080c10',
      bg2: '#0d1420',
      bg3: '#111a28',
      surface: 'rgba(16,185,129,0.02)',
      surface2: 'rgba(16,185,129,0.03)',
      border: 'rgba(16,185,129,0.2)',
      text: '#ffffff',
      text2: 'rgba(255,255,255,0.65)',
      text3: 'rgba(255,255,255,0.35)',
      sidebarBg: 'rgba(8,12,16,0.98)',
      headerBg: 'rgba(8,12,16,0.96)',
      cardBg: 'rgba(255,255,255,0.03)',
      inputBg: 'rgba(255,255,255,0.05)',
      scrollbarThumb: 'rgba(16,185,129,0.3)',
      shadow: '0 4px 16px rgba(16,185,129,0.2)',
      accent: '#10b981',
      accentLight: 'rgba(16,185,129,0.35)',
      buttonBg: 'rgba(16,185,129,0.12)',
      buttonHover: 'rgba(16,185,129,0.22)',
    },
  },
  'midnight': {
    name: 'Midnight',
    emoji: '⭐',
    description: 'Deep blue dark',
    isDark: true,
    colors: {
      bg: '#0a0e27',
      bg2: '#0f1532',
      bg3: '#151e42',
      surface: 'rgba(59,130,246,0.02)',
      surface2: 'rgba(59,130,246,0.03)',
      border: 'rgba(59,130,246,0.18)',
      text: '#ffffff',
      text2: 'rgba(255,255,255,0.60)',
      text3: 'rgba(255,255,255,0.30)',
      sidebarBg: 'rgba(10,14,39,0.98)',
      headerBg: 'rgba(10,14,39,0.96)',
      cardBg: 'rgba(255,255,255,0.025)',
      inputBg: 'rgba(255,255,255,0.04)',
      scrollbarThumb: 'rgba(59,130,246,0.25)',
      shadow: '0 2px 16px rgba(59,130,246,0.15)',
      accent: '#3b82f6',
      accentLight: 'rgba(59,130,246,0.25)',
      buttonBg: 'rgba(59,130,246,0.1)',
      buttonHover: 'rgba(59,130,246,0.18)',
    },
  },
  'sunset': {
    name: 'Sunset',
    emoji: '🌅',
    description: 'Warm orange dark',
    isDark: true,
    colors: {
      bg: '#1a0f0a',
      bg2: '#2d1810',
      bg3: '#3d2415',
      surface: 'rgba(249,115,22,0.02)',
      surface2: 'rgba(249,115,22,0.03)',
      border: 'rgba(249,115,22,0.18)',
      text: '#fff8f3',
      text2: 'rgba(255,255,255,0.62)',
      text3: 'rgba(255,255,255,0.35)',
      sidebarBg: 'rgba(26,15,10,0.98)',
      headerBg: 'rgba(26,15,10,0.96)',
      cardBg: 'rgba(255,255,255,0.025)',
      inputBg: 'rgba(255,255,255,0.04)',
      scrollbarThumb: 'rgba(249,115,22,0.25)',
      shadow: '0 2px 16px rgba(249,115,22,0.15)',
      accent: '#f97316',
      accentLight: 'rgba(249,115,22,0.25)',
      buttonBg: 'rgba(249,115,22,0.1)',
      buttonHover: 'rgba(249,115,22,0.18)',
    },
  },
  'forest': {
    name: 'Forest',
    emoji: '🌲',
    description: 'Deep green dark',
    isDark: true,
    colors: {
      bg: '#0a1a13',
      bg2: '#0f241a',
      bg3: '#152f25',
      surface: 'rgba(16,185,129,0.02)',
      surface2: 'rgba(16,185,129,0.03)',
      border: 'rgba(16,185,129,0.18)',
      text: '#f0f9f6',
      text2: 'rgba(255,255,255,0.62)',
      text3: 'rgba(255,255,255,0.35)',
      sidebarBg: 'rgba(10,26,19,0.98)',
      headerBg: 'rgba(10,26,19,0.96)',
      cardBg: 'rgba(255,255,255,0.025)',
      inputBg: 'rgba(255,255,255,0.04)',
      scrollbarThumb: 'rgba(16,185,129,0.25)',
      shadow: '0 2px 16px rgba(16,185,129,0.15)',
      accent: '#059669',
      accentLight: 'rgba(16,185,129,0.25)',
      buttonBg: 'rgba(16,185,129,0.1)',
      buttonHover: 'rgba(16,185,129,0.18)',
    },
  },
};

const ThemeContext = createContext<ThemeContextType>({
  currentTheme: 'daylight-blue',
  setTheme: () => {},
  themeConfig: THEMES['daylight-blue'],
  isDark: false,
  accent: '#3b82f6',
});

function applyTheme(config: ThemeConfig) {
  const root = document.documentElement;
  const { colors } = config;

  root.style.setProperty('--bg', colors.bg);
  root.style.setProperty('--bg2', colors.bg2);
  root.style.setProperty('--bg3', colors.bg3);
  root.style.setProperty('--surface', colors.surface);
  root.style.setProperty('--surface2', colors.surface2);
  root.style.setProperty('--border', colors.border);
  root.style.setProperty('--text', colors.text);
  root.style.setProperty('--text2', colors.text2);
  root.style.setProperty('--text3', colors.text3);
  root.style.setProperty('--sidebar-bg', colors.sidebarBg);
  root.style.setProperty('--header-bg', colors.headerBg);
  root.style.setProperty('--card-bg', colors.cardBg);
  root.style.setProperty('--input-bg', colors.inputBg);
  root.style.setProperty('--scrollbar-thumb', colors.scrollbarThumb);
  root.style.setProperty('--shadow', colors.shadow);
  root.style.setProperty('--accent', colors.accent);
  root.style.setProperty('--accent-light', colors.accentLight);
  root.style.setProperty('--button-bg', colors.buttonBg);
  root.style.setProperty('--button-hover', colors.buttonHover);

  document.body.style.background = colors.bg;
  document.body.style.color = colors.text;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ThemePreset>('daylight-blue');

  useEffect(() => {
    const saved = localStorage.getItem('tl_theme_preset') as ThemePreset;
    const theme = (saved && saved in THEMES) ? saved : 'daylight-blue';
    setCurrentTheme(theme);
    applyTheme(THEMES[theme]);
  }, []);

  useEffect(() => {
    applyTheme(THEMES[currentTheme]);
    localStorage.setItem('tl_theme_preset', currentTheme);
  }, [currentTheme]);

  const handleSetTheme = (theme: ThemePreset) => {
    setCurrentTheme(theme);
  };

  const config = THEMES[currentTheme];

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        setTheme: handleSetTheme,
        themeConfig: config,
        isDark: config.isDark,
        accent: config.colors.accent,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export type { ThemePreset };
export { THEMES };
export const useTheme = () => useContext(ThemeContext);
