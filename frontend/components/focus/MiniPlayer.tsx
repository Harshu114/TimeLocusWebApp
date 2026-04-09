'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface MiniPlayerProps {
  isVisible: boolean;
  onClose: () => void;
  // Timer state
  mm: string;
  ss: string;
  phase: 'focus' | 'break' | 'long_break';
  running: boolean;
  // Controls
  onToggle: () => void;
  onSkip: () => void;
  onReset: () => void;
}

const PHASE_EMOJIS = {
  focus: '🎯',
  break: '☕',
  long_break: '🌙',
};

const PHASE_COLORS = {
  focus: '#00dcff',
  break: '#00ff88',
  long_break: '#8c3cff',
};

export function MiniPlayer({
  isVisible,
  onClose,
  mm,
  ss,
  phase,
  running,
  onToggle,
  onSkip,
  onReset,
}: MiniPlayerProps) {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load saved position
    try {
      const saved = localStorage.getItem('tl_miniplayer_position');
      if (saved) {
        setPosition(JSON.parse(saved));
      }
    } catch {}
  }, []);

  useEffect(() => {
    // Save position on change
    if (!isDragging) {
      localStorage.setItem('tl_miniplayer_position', JSON.stringify(position));
    }
  }, [position, isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newX = e.clientX - dragStartRef.current.x;
      const newY = e.clientY - dragStartRef.current.y;

      // Constrain to viewport
      const maxX = window.innerWidth - (elementRef.current?.offsetWidth || 200);
      const maxY = window.innerHeight - (elementRef.current?.offsetHeight || 100);

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Picture-in-Picture functionality
  const openPiP = async () => {
    try {
      // Create a canvas for PiP
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      // Draw timer on canvas
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, 400, 300);

      // Draw phase
      ctx.fillStyle = PHASE_COLORS[phase];
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(PHASE_EMOJIS[phase] + ' ' + phase.replace('_', ' ').toUpperCase(), 200, 40);

      // Draw timer
      ctx.font = 'bold 80px monospace';
      ctx.fillStyle = '#fff';
      ctx.fillText(`${mm}:${ss}`, 200, 180);

      // Draw status
      ctx.font = '14px sans-serif';
      ctx.fillStyle = running ? '#00ff88' : '#ff6464';
      ctx.fillText(running ? '▶ Running' : '⏸ Paused', 200, 240);

      // Request PiP
      const video = document.createElement('video');
      (video as any).srcObject = canvas.captureStream(30);
      await (video as any).play();

      if ((document as any).pictureInPictureElement) {
        await (document as any).exitPictureInPicture();
      }
      await video.requestPictureInPicture();
    } catch (err) {
      console.error('PiP error:', err);
    }
  };

  if (!isVisible) return null;

  const phaseColor = PHASE_COLORS[phase];

  return (
    <>
      <style>{`
        @keyframes mini-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .mini-player-dragging {
          cursor: grabbing !important;
        }
      `}</style>

      <div
        ref={elementRef}
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          zIndex: 9999,
          background: 'rgba(20,20,30,0.95)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${phaseColor}44`,
          borderRadius: 12,
          padding: '12px 16px',
          boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${phaseColor}22`,
          minWidth: 180,
          userSelect: 'none',
          transition: isDragging ? 'none' : 'box-shadow 0.3s',
        }}
        className={isDragging ? 'mini-player-dragging' : ''}
      >
        {/* Drag handle / Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
            cursor: 'grab',
          }}
          onMouseDown={handleMouseDown}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1rem' }}>{PHASE_EMOJIS[phase]}</span>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: phaseColor,
              }}
            >
              {phase.replace('_', ' ')}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={openPiP}
              title="Picture-in-Picture"
              style={{
                width: 24,
                height: 24,
                borderRadius: 4,
                background: 'rgba(255,255,255,0.05)',
                border: 'none',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.7rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              📺
            </button>
            <button
              onClick={onClose}
              title="Close"
              style={{
                width: 24,
                height: 24,
                borderRadius: 4,
                background: 'rgba(255,100,100,0.1)',
                border: '1px solid rgba(255,100,100,0.2)',
                color: '#ff6464',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Timer Display */}
        <div
          style={{
            textAlign: 'center',
            padding: '8px 0',
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '2.5rem',
              fontWeight: 700,
              color: '#fff',
              letterSpacing: '0.05em',
            }}
          >
            {mm}:{ss}
          </div>
          {running && (
            <div
              style={{
                fontSize: '0.6rem',
                color: phaseColor,
                animation: 'mini-pulse 1s ease-in-out infinite',
              }}
            >
              ● {running ? 'Running' : 'Paused'}
            </div>
          )}
        </div>

        {/* Controls */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            justifyContent: 'center',
          }}
        >
          <button
            onClick={onReset}
            title="Reset"
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ↺
          </button>
          <button
            onClick={onToggle}
            title={running ? 'Pause' : 'Start'}
            style={{
              padding: '0 16px',
              height: 32,
              borderRadius: 6,
              background: running
                ? 'rgba(255,100,100,0.15)'
                : `linear-gradient(105deg, ${phaseColor}, ${phaseColor}cc)`,
              border: running ? '1px solid rgba(255,100,100,0.3)' : 'none',
              color: running ? '#ff6464' : '#000',
              fontWeight: 700,
              fontSize: '0.7rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {running ? '⏸' : '▶'} {running ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={onSkip}
            title="Skip"
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ⏭
          </button>
        </div>
      </div>
    </>
  );
}

// Hook for managing mini player state
export function useMiniPlayer() {
  const [isVisible, setIsVisible] = useState(false);
  const [timerState, setTimerState] = useState({
    mm: '25',
    ss: '00',
    phase: 'focus' as 'focus' | 'break' | 'long_break',
    running: false,
  });

  const showMiniPlayer = () => setIsVisible(true);
  const hideMiniPlayer = () => setIsVisible(false);
  const toggleMiniPlayer = () => setIsVisible(v => !v);

  const updateTimerState = useCallback((state: typeof timerState) => {
    setTimerState(prev => {
      if (
        prev.mm === state.mm &&
        prev.ss === state.ss &&
        prev.phase === state.phase &&
        prev.running === state.running
      ) {
        return prev;
      }
      return state;
    });
  }, []);

  return {
    isVisible,
    showMiniPlayer,
    hideMiniPlayer,
    toggleMiniPlayer,
    timerState,
    updateTimerState,
  };
}
