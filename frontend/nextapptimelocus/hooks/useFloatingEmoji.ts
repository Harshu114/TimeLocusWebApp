'use client';
// hooks/useFloatingEmojis.ts
// Reusable hook for the floating emoji particle animation.
// Used by both Login and Signup pages.

import { useState, useEffect } from 'react';

const EMOJIS = ['⏱️','📅','🎯','✅','⚡','🧠','📊','🔥','💡','🚀','⏰','📌','🏆','💎','🌟','📈'];

export interface EmojiParticle {
  id: number;
  emoji: string;
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  opacity: number;
  rotation: number;
  rotSpeed: number;
}

export function useFloatingEmojis(count = 22): EmojiParticle[] {
  const [particles, setParticles] = useState<EmojiParticle[]>([]);

  // Initialise particles once on mount
  useEffect(() => {
    setParticles(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        emoji: EMOJIS[i % EMOJIS.length],
        x: Math.random() * 100,
        y: Math.random() * 120 - 20,
        size: Math.random() * 18 + 16,
        speed: Math.random() * 0.015 + 0.006,
        drift: (Math.random() - 0.5) * 0.02,
        opacity: Math.random() * 0.35 + 0.1,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 0.3,
      }))
    );
  }, [count]);

  // Animation loop
  useEffect(() => {
    let frame: number;
    const tick = () => {
      setParticles(prev =>
        prev.map(p => {
          let y = p.y - p.speed;
          let x = p.x + p.drift;
          if (y < -12) { y = 110; x = Math.random() * 100; }
          if (x < -5)   x = 105;
          if (x > 105)  x = -5;
          return { ...p, y, x, rotation: p.rotation + p.rotSpeed };
        })
      );
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return particles;
}
