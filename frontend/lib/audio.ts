// Audio utilities for focus timer
// Uses Web Audio API for better control and lower latency

export type SoundType = 'work_start' | 'break_start' | 'session_end' | 'warning' | 'click';
export type SoundPreset = 'digital' | 'nature' | 'minimal' | 'chime' | 'retro';

interface SoundConfig {
  work_start: string;
  break_start: string;
  session_end: string;
  warning: string;
  click: string;
}

export const SOUND_PRESETS: Record<SoundPreset, SoundConfig> = {
  digital: {
    work_start: 'digital_work',
    break_start: 'digital_break',
    session_end: 'digital_end',
    warning: 'digital_warning',
    click: 'digital_click',
  },
  nature: {
    work_start: 'nature_bird',
    break_start: 'nature_wind',
    session_end: 'nature_water',
    warning: 'nature_alert',
    click: 'nature_soft',
  },
  minimal: {
    work_start: 'minimal_work',
    break_start: 'minimal_break',
    session_end: 'minimal_end',
    warning: 'minimal_warning',
    click: 'minimal_click',
  },
  chime: {
    work_start: 'chime_work',
    break_start: 'chime_break',
    session_end: 'chime_end',
    warning: 'chime_warning',
    click: 'chime_click',
  },
  retro: {
    work_start: 'retro_work',
    break_start: 'retro_break',
    session_end: 'retro_end',
    warning: 'retro_warning',
    click: 'retro_click',
  },
};

// Audio context singleton
let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
const preloadedSounds: Map<string, AudioBuffer> = new Map();

// Initialize audio context
export function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = audioContext.createGain();
    masterGain.connect(audioContext.destination);
  }
  return audioContext;
}

// Set master volume (0-1)
export function setMasterVolume(volume: number): void {
  const ctx = getAudioContext();
  if (masterGain) {
    masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), ctx.currentTime);
  }
}

// Generate synthesized sounds (fallback when files not available)
function generateTone(
  frequency: number,
  type: OscillatorType,
  duration: number,
  startTime: number = 0
): AudioBuffer {
  const ctx = getAudioContext();
  const sampleRate = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < sampleRate * duration; i++) {
    const t = (i + startTime * sampleRate) / sampleRate;
    const envelope = Math.exp(-3 * t / duration);
    data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope;
  }

  return buffer;
}

// Synthesized sound effects
export function playSynthesizedSound(type: SoundType, preset: SoundPreset = 'digital'): void {
  const ctx = getAudioContext();
  if (!ctx || !masterGain) return;

  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(masterGain);

  switch (type) {
    case 'work_start':
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, now);
      oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.3);
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      oscillator.start(now);
      oscillator.stop(now + 0.5);
      break;

    case 'break_start':
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, now);
      oscillator.frequency.exponentialRampToValueAtTime(440, now + 0.3);
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      oscillator.start(now);
      oscillator.stop(now + 0.5);
      break;

    case 'session_end':
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(523.25, now);
      oscillator.frequency.setValueAtTime(659.25, now + 0.15);
      oscillator.frequency.setValueAtTime(783.99, now + 0.3);
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      oscillator.start(now);
      oscillator.stop(now + 0.6);
      break;

    case 'warning':
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(880, now);
      oscillator.frequency.setValueAtTime(880, now + 0.1);
      oscillator.frequency.setValueAtTime(880, now + 0.2);
      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.setValueAtTime(0.15, now + 0.3);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      oscillator.start(now);
      oscillator.stop(now + 0.4);
      break;

    case 'click':
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1200, now);
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      oscillator.start(now);
      oscillator.stop(now + 0.05);
      break;
  }
}

// Play sound from preset
export function playSound(type: SoundType, preset: SoundPreset = 'digital'): void {
  // Try to play from loaded buffer first
  const config = SOUND_PRESETS[preset];
  const soundKey = config[type];
  const buffer = preloadedSounds.get(soundKey);

  if (buffer) {
    const ctx = getAudioContext();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(masterGain || ctx.destination);
    source.start(0);
  } else {
    // Fallback to synthesized sounds
    playSynthesizedSound(type, preset);
  }
}

// Preload sound files
export async function preloadSounds(preset: SoundPreset): Promise<void> {
  const ctx = getAudioContext();
  const config = SOUND_PRESETS[preset];
  const soundsToLoad = Object.values(config);

  const loadPromises = soundsToLoad.map(async (soundName) => {
    try {
      const response = await fetch(`/sounds/${preset}/${soundName}.mp3`);
      if (!response.ok) throw new Error('Sound not found');
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      preloadedSounds.set(soundName, audioBuffer);
    } catch {
      // Sound file not available, will use synthesized fallback
    }
  });

  await Promise.all(loadPromises);
}

// Request desktop notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;

  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch {
    return false;
  }
}

// Show desktop notification
export function showNotification(title: string, body: string, icon?: string): void {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  new Notification(title, {
    body,
    icon: icon || '/favicon.ico',
    badge: '/favicon.ico',
    requireInteraction: false,
    silent: false,
  });
}

// Combined alert with sound and notification
export function playAlert(
  type: SoundType,
  title: string,
  body: string,
  preset: SoundPreset = 'digital',
  showNotif: boolean = true
): void {
  playSound(type, preset);
  if (showNotif) {
    showNotification(title, body);
  }
}

// Initialize audio on user interaction (required by browsers)
export function initializeAudio(): void {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
}

// Test sound playback
export function testSound(type: SoundType, preset: SoundPreset = 'digital'): void {
  initializeAudio();
  playSound(type, preset);
}
