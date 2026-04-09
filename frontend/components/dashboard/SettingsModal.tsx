'use client';
// components/dashboard/SettingsModal.tsx
// Modal for user settings including theme customization

import { useState } from 'react';
import ThemeEditor from '../ThemeEditor';
import { useTheme } from '../../lib/ThemeContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'theme' | 'general'>('theme');
  const { isDark, accent } = useTheme();

  const accentRgb = (hex: string) => {
    const rgb = parseInt(hex.slice(1), 16);
    return `${(rgb >> 16) & 255},${(rgb >> 8) & 255},${rgb & 255}`;
  };

  if (!isOpen) return null;

  const bg = isDark ? '#080c14' : '#eef2fc';
  const surfaceBg = isDark ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.8)';
  const textColor = isDark ? '#fff' : '#1a2340';
  const textSecondary = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(26,35,64,0.6)';

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 999,
          animation: 'fadeIn 0.2s ease-out',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '500px',
          maxHeight: '80vh',
          background: bg,
          border: `1px solid rgba(${accentRgb(accent)},0.2)`,
          borderRadius: 12,
          boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(${accentRgb(accent)},0.1)`,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.3s cubic-bezier(.22,1,.36,1)',
        }}
      >
        <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideUp { from { opacity: 0; transform: translate(-50%, -40%); } to { opacity: 1; transform: translate(-50%, -50%); } }
          
          .sm-tab-btn {
            padding: 12px 16px;
            border: none;
            background: none;
            color: inherit;
            fontWeight: 500;
            fontSize: .9rem;
            letterSpacing: .02em;
            cursor: pointer;
            position: relative;
            transition: color 0.2s;
            borderBottom: 2px solid transparent;
          }
          .sm-tab-btn.active {
            color: currentColor;
            borderBottomColor: currentColor;
          }
        `}</style>

        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid rgba(${accentRgb(accent)},0.1)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: textColor }}>
            Settings ⚙️
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.4rem',
              cursor: 'pointer',
              padding: 0,
              color: textSecondary,
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: `1px solid rgba(${accentRgb(accent)},0.1)`,
            paddingLeft: 16,
            background: surfaceBg,
          }}
        >
          <button
            className={`sm-tab-btn ${activeTab === 'theme' ? 'active' : ''}`}
            onClick={() => setActiveTab('theme')}
            style={{ color: activeTab === 'theme' ? accent : textSecondary }}
          >
            🎨 Appearance
          </button>
          <button
            className={`sm-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
            style={{ color: activeTab === 'general' ? accent : textSecondary }}
          >
            ⚙️ General
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            color: textColor,
          }}
        >
          {activeTab === 'theme' && (
            <div>
              <p style={{ fontSize: '.9rem', color: textSecondary, marginBottom: 20 }}>
                Customize colors and light/dark mode to match your style
              </p>
              <ThemeEditor onClose={onClose} />
            </div>
          )}

          {activeTab === 'general' && (
            <div>
              <p style={{ fontSize: '.9rem', color: textSecondary, marginBottom: 20 }}>
                More settings coming soon...
              </p>
              <div
                style={{
                  padding: '16px',
                  borderRadius: 8,
                  background: `rgba(${accentRgb(accent)},0.08)`,
                  border: `1px solid rgba(${accentRgb(accent)},0.15)`,
                  color: textSecondary,
                  fontSize: '.85rem',
                }}
              >
                Additional features being developed 🚀
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
