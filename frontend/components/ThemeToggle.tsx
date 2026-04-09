'use client';
// components/ThemeToggle.tsx
// Theme cycle button

import { useTheme, THEMES, type ThemePreset } from '../lib/ThemeContext';

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg';
}

export default function ThemeToggle({ size = 'md' }: ThemeToggleProps) {
  const { currentTheme, setTheme } = useTheme();
  const themeList = (Object.keys(THEMES) as ThemePreset[]);
  const currentIndex = themeList.indexOf(currentTheme);

  const handleClick = () => {
    const nextIndex = (currentIndex + 1) % themeList.length;
    setTheme(themeList[nextIndex]);
  };

  const dims = {
    sm: 32,
    md: 40,
    lg: 48,
  }[size];

  return (
    <button
      onClick={handleClick}
      title="Click to cycle themes"
      aria-label="Cycle themes"
      style={{
        width: dims,
        height: dims,
        borderRadius: 6,
        border: `1px solid var(--border)`,
        background: `var(--button-bg)`,
        color: `var(--accent)`,
        cursor: 'pointer',
        padding: 0,
        flexShrink: 0,
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${dims * 0.4}px`,
        fontWeight: 'bold',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--button-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--button-bg)')}
    >
      🎨
    </button>
  );
}