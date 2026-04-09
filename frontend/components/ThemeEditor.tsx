'use client';
// components/ThemeEditor.tsx
// Theme selector showing 10 complete color themes

import { useTheme, THEMES, type ThemePreset } from '../lib/ThemeContext';

interface ThemeEditorProps {
  onClose?: () => void;
  compact?: boolean;
}

export default function ThemeEditor({ onClose, compact = false }: ThemeEditorProps) {
  const { currentTheme, setTheme } = useTheme();
  
  const themeList = Object.entries(THEMES) as [ThemePreset, any][];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h3 style={{ 
          margin: '0 0 12px 0', 
          color: 'var(--text)', 
          fontSize: '.9rem', 
          fontWeight: 600, 
          textTransform: 'uppercase', 
          letterSpacing: '.08em' 
        }}>
          Select Theme
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {themeList.map(([themeKey, themeConfig]) => {
            const isActive = currentTheme === themeKey;

            return (
              <button
                key={themeKey}
                onClick={() => setTheme(themeKey)}
                title={themeConfig.name}
                style={{
                  padding: '12px',
                  borderRadius: 8,
                  border: isActive ? `2px solid ${themeConfig.colors.accent}` : `1px solid ${themeConfig.colors.border}`,
                  background: themeConfig.colors.cardBg,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? `0 0 12px ${themeConfig.colors.accent}40` : 'none',
                  textAlign: 'left',
                  position: 'relative',
                  color: themeConfig.colors.text,
                }}
              >
                {/* Emoji */}
                <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>
                  {themeConfig.emoji}
                </div>

                {/* Theme Name */}
                <div style={{
                  fontSize: '.85rem',
                  fontWeight: 600,
                  color: themeConfig.colors.text,
                  marginBottom: 4,
                }}>
                  {themeConfig.name}
                </div>

                {/* Description */}
                <div style={{
                  fontSize: '.7rem',
                  color: themeConfig.colors.text3,
                  marginBottom: 8,
                }}>
                  {themeConfig.description}
                </div>

                {/* Color Preview Bar (accent color) */}
                <div
                  style={{
                    height: 4,
                    borderRadius: 2,
                    background: themeConfig.colors.accent,
                    marginBottom: 8,
                  }}
                />

                {/* Active Checkmark */}
                {isActive && (
                  <span style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: themeConfig.colors.accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: '#fff',
                  }}>
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{
        padding: '10px 12px',
        borderRadius: 6,
        background: 'var(--button-bg)',
        border: '1px solid var(--border)',
        fontSize: '.75rem',
        color: 'var(--text3)',
        lineHeight: 1.4,
      }}>
        ✅ Click any theme to apply instantly. Background, text, buttons, and accent colors change together. Your choice is saved.
      </div>
    </div>
  );
}
