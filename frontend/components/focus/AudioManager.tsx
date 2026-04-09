'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  SoundPreset,
  SoundType,
  SOUND_PRESETS,
  initializeAudio,
  testSound,
  setMasterVolume,
  requestNotificationPermission,
  playAlert,
} from '../../lib/audio';

interface AudioManagerProps {
  onSettingsChange?: (settings: AudioSettings) => void;
}

export interface AudioSettings {
  enabled: boolean;
  volume: number;
  preset: SoundPreset;
  notificationsEnabled: boolean;
  sounds: {
    work_start: boolean;
    break_start: boolean;
    session_end: boolean;
    warning: boolean;
    click: boolean;
  };
}

const DEFAULT_SETTINGS: AudioSettings = {
  enabled: true,
  volume: 0.7,
  preset: 'digital',
  notificationsEnabled: true,
  sounds: {
    work_start: true,
    break_start: true,
    session_end: true,
    warning: true,
    click: true,
  },
};

const SOUND_LABELS: Record<SoundType, { label: string; emoji: string }> = {
  work_start: { label: 'Work Start', emoji: '🎯' },
  break_start: { label: 'Break Start', emoji: '☕' },
  session_end: { label: 'Session End', emoji: '✅' },
  warning: { label: 'Warning', emoji: '⚠️' },
  click: { label: 'Click', emoji: '🔘' },
};

const PRESET_LABELS: Record<SoundPreset, { label: string; emoji: string }> = {
  digital: { label: 'Digital', emoji: '🔊' },
  nature: { label: 'Nature', emoji: '🌿' },
  minimal: { label: 'Minimal', emoji: '🔇' },
  chime: { label: 'Chime', emoji: '🔔' },
  retro: { label: 'Retro', emoji: '👾' },
};

export function AudioManager({ onSettingsChange }: AudioManagerProps) {
  const [settings, setSettings] = useState<AudioSettings>(() => {
    try {
      const saved = localStorage.getItem('tl_audio_settings');
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_SETTINGS;
  });

  const [isOpen, setIsOpen] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    setNotifPermission('Notification' in window ? Notification.permission : 'denied');
  }, []);

  useEffect(() => {
    localStorage.setItem('tl_audio_settings', JSON.stringify(settings));
    setMasterVolume(settings.enabled ? settings.volume : 0);
    onSettingsChange?.(settings);
  }, [settings, onSettingsChange]);

  const updateSetting = <K extends keyof AudioSettings>(key: K, value: AudioSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateSoundSetting = (type: keyof typeof settings.sounds, enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      sounds: { ...prev.sounds, [type]: enabled },
    }));
  };

  const handleTestSound = (type: SoundType) => {
    initializeAudio();
    testSound(type, settings.preset);
  };

  const handleRequestNotifPermission = async () => {
    const granted = await requestNotificationPermission();
    setNotifPermission(granted ? 'granted' : 'denied');
    updateSetting('notificationsEnabled', granted);
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    overflow: 'hidden',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.02)',
    cursor: 'pointer',
    userSelect: 'none',
  };

  const sectionStyle: React.CSSProperties = {
    padding: 16,
    borderTop: '1px solid rgba(255,255,255,0.05)',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.72rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 12,
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  };

  const buttonStyle: React.CSSProperties = {
    padding: '6px 12px',
    borderRadius: 4,
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.05)',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '0.78rem',
    cursor: 'pointer',
    transition: '0.2s',
  };

  const toggleStyle: React.CSSProperties = {
    width: 40,
    height: 22,
    borderRadius: 11,
    background: settings.enabled ? 'rgba(0,220,255,0.3)' : 'rgba(255,255,255,0.1)',
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    transition: '0.2s',
  };

  const knobStyle: React.CSSProperties = {
    width: 18,
    height: 18,
    borderRadius: '50%',
    background: settings.enabled ? '#00dcff' : 'rgba(255,255,255,0.5)',
    position: 'absolute',
    top: 2,
    left: settings.enabled ? 20 : 2,
    transition: '0.2s',
  };

  return (
    <div style={cardStyle}>
      <div style={headerStyle} onClick={() => setIsOpen(!isOpen)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.1rem' }}>🔊</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>
            Audio & Notifications
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
            {settings.preset}
          </span>
          <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)', transition: '0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>
            ▼
          </span>
        </div>
      </div>

      {isOpen && (
        <div>
          {/* Master Controls */}
          <div style={sectionStyle}>
            <div style={labelStyle}>Master Controls</div>

            <div style={rowStyle}>
              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                Enable Sounds
              </span>
              <button style={toggleStyle} onClick={() => updateSetting('enabled', !settings.enabled)}>
                <div style={knobStyle} />
              </button>
            </div>

            <div style={rowStyle}>
              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                Volume
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', width: 30 }}>
                  {Math.round(settings.volume * 100)}%
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.volume * 100}
                  onChange={(e) => updateSetting('volume', parseInt(e.target.value) / 100)}
                  style={{
                    width: 120,
                    accentColor: '#00dcff',
                  }}
                />
              </div>
            </div>

            <div style={rowStyle}>
              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                Sound Preset
              </span>
              <select
                value={settings.preset}
                onChange={(e) => updateSetting('preset', e.target.value as SoundPreset)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 4,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {(Object.keys(PRESET_LABELS) as SoundPreset[]).map((p) => (
                  <option key={p} value={p}>
                    {PRESET_LABELS[p].emoji} {PRESET_LABELS[p].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Individual Sound Toggles */}
          <div style={sectionStyle}>
            <div style={labelStyle}>Sound Events</div>

            {(Object.entries(SOUND_LABELS) as [SoundType, typeof SOUND_LABELS[SoundType]][])
              .filter(([type]) => type !== 'click')
              .map(([type, { label, emoji }]) => (
                <div key={type} style={rowStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1rem' }}>{emoji}</span>
                    <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                      {label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={() => handleTestSound(type)}
                      style={{
                        ...buttonStyle,
                        padding: '4px 8px',
                        fontSize: '0.72rem',
                      }}
                    >
                      🔊 Test
                    </button>
                    <button
                      onClick={() => updateSoundSetting(type, !settings.sounds[type])}
                      style={{
                        ...toggleStyle,
                        width: 36,
                        height: 20,
                      }}
                    >
                      <div
                        style={{
                          ...knobStyle,
                          width: 16,
                          height: 16,
                          left: settings.sounds[type] ? 18 : 2,
                          background: settings.sounds[type] ? '#00dcff' : 'rgba(255,255,255,0.5)',
                        }}
                      />
                    </button>
                  </div>
                </div>
              ))}
          </div>

          {/* Notifications */}
          <div style={sectionStyle}>
            <div style={labelStyle}>Desktop Notifications</div>

            <div style={rowStyle}>
              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                Enable Notifications
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {notifPermission !== 'granted' && (
                  <button
                    onClick={handleRequestNotifPermission}
                    style={{
                      ...buttonStyle,
                      background: notifPermission === 'denied' ? 'rgba(255,80,80,0.12)' : 'rgba(0,220,255,0.1)',
                      borderColor: notifPermission === 'denied' ? 'rgba(255,80,80,0.3)' : 'rgba(0,220,255,0.3)',
                      color: notifPermission === 'denied' ? '#ff9a9a' : '#00dcff',
                    }}
                  >
                    {notifPermission === 'denied' ? '⚠️ Blocked' : '🔔 Enable'}
                  </button>
                )}
                <button
                  onClick={() => updateSetting('notificationsEnabled', !settings.notificationsEnabled)}
                  style={{
                    ...toggleStyle,
                    width: 36,
                    height: 20,
                  }}
                >
                  <div
                    style={{
                      ...knobStyle,
                      width: 16,
                      height: 16,
                      left: settings.notificationsEnabled ? 18 : 2,
                      background: settings.notificationsEnabled
                        ? '#00dcff'
                        : 'rgba(255,255,255,0.5)',
                    }}
                  />
                </button>
              </div>
            </div>

            {notifPermission === 'denied' && (
              <div
                style={{
                  marginTop: 10,
                  padding: 10,
                  background: 'rgba(255,100,100,0.1)',
                  border: '1px solid rgba(255,100,100,0.2)',
                  borderRadius: 4,
                  fontSize: '0.75rem',
                  color: 'rgba(255,255,255,0.6)',
                }}
              >
                ⚠️ Notifications are blocked. Enable them in your browser settings to receive
                alerts.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Hook for using audio in components
export function useAudioAlerts() {
  const [settings, setSettings] = useState<AudioSettings>(() => {
    try {
      const saved = localStorage.getItem('tl_audio_settings');
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem('tl_audio_settings');
      if (saved) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const playAlertSound = useCallback((type: SoundType, title: string, body: string) => {
    if (!settings.enabled || !settings.sounds[type]) return;
    initializeAudio();
    playAlert(type, title, body, settings.preset, settings.notificationsEnabled);
  }, [settings]);

  return { settings, playAlertSound };
}
