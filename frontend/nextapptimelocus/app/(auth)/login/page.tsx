// app/(auth)/login/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';



export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Only run on client after hydration
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Cyberpunk particle system - client only
  useEffect(() => {
    if (!hydrated) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      color: string;
      type: 'dot' | 'line' | 'triangle';
    }> = [];

    const colors = ['#ff0080', '#00ffff', '#ffff00'];

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: Math.random() * 3 + 1.5,
        opacity: Math.random() * 0.6 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: ['dot', 'line', 'triangle'][Math.floor(Math.random() * 3)] as 'dot' | 'line' | 'triangle'
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        ctx.globalAlpha = particle.opacity;
        ctx.strokeStyle = particle.color;
        ctx.fillStyle = particle.color;
        ctx.lineWidth = 1.5;

        if (particle.type === 'dot') {
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (particle.type === 'line') {
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(particle.x + particle.vx * 8, particle.y + particle.vy * 8);
          ctx.stroke();
        } else if (particle.type === 'triangle') {
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(particle.x + particle.size, particle.y + particle.size);
          ctx.lineTo(particle.x - particle.size, particle.y + particle.size);
          ctx.closePath();
          ctx.fill();
        }
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [hydrated]);

  const handleEmailSubmit = async () => {
    if (!identifier.trim()) {
      setError('Please enter your email or username');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/auth/check-user?identifier=${encodeURIComponent(identifier)}`);
      const data = await response.json();

      if (data.exists) {
        setStep('password');
        setError('');
      } else {
        setError('Account not found in the system');
      }
    } catch (error) {
      setError('Unable to verify user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token and redirect
        localStorage.setItem('token', data.token);
        router.push('/dashboard');
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetToEmail = () => {
    setStep('email');
    setPassword('');
    setError('');
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-cyan-400 text-center">
          <div className="w-12 h-12 border-2 border-cyan-400 border-t-pink-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p>Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-black flex items-center justify-center">
      {/* Canvas particles background */}
      <canvas ref={canvasRef} className="absolute inset-0 opacity-40" />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-cyan-950/10 opacity-60"></div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-sm px-4">
        {/* Centered card with neon border */}
        <div className="bg-black border-2 border-cyan-400 shadow-lg shadow-cyan-400/20 p-8">
          {/* Decorative corners */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-pink-400"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-yellow-400"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-yellow-400"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-pink-400"></div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-cyan-400 mb-2 tracking-wider">TIMELOCUS</h1>
            <div className="h-1 w-12 bg-gradient-to-r from-pink-400 via-cyan-400 to-yellow-400 mx-auto mb-4"></div>
            <p className="text-pink-400 text-sm font-light tracking-widest">WELCOME BACK</p>
          </div>

          {/* Form content */}
          <div className="space-y-6">
            {/* Email step */}
            {step === 'email' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div>
                  <label className="text-cyan-400 text-sm font-semibold mb-3 block">EMAIL / USERNAME</label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleEmailSubmit()}
                      placeholder="user@example.com"
                      className="w-full bg-transparent border-b-2 border-cyan-400/50 text-cyan-400 placeholder-cyan-400/30 py-3 focus:outline-none focus:border-cyan-400 transition-colors text-sm"
                    />
                    <Mail className="absolute right-0 top-3 h-5 w-5 text-cyan-400/50 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                </div>

                <button
                  onClick={handleEmailSubmit}
                  disabled={loading}
                  className="w-full bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-black font-bold py-3 px-4 transition-all duration-300 transform hover:scale-105 tracking-wider text-sm"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                      CHECKING...
                    </span>
                  ) : (
                    'CONTINUE'
                  )}
                </button>
              </div>
            )}

            {/* Password step */}
            {step === 'password' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="bg-cyan-400/10 border border-cyan-400/30 p-3">
                  <p className="text-cyan-400 text-xs font-mono">ACCESS GRANTED FOR:</p>
                  <p className="text-yellow-400 font-bold text-sm mt-1">&gt; {identifier}</p>
                </div>

                <div>
                  <label className="text-cyan-400 text-sm font-semibold mb-3 block">PASSWORD</label>
                  <div className="relative group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handlePasswordLogin()}
                      placeholder="••••••••"
                      className="w-full bg-transparent border-b-2 border-pink-400/50 text-cyan-400 placeholder-cyan-400/30 py-3 pr-10 focus:outline-none focus:border-pink-400 transition-colors text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-3 text-pink-400/50 hover:text-pink-400 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handlePasswordLogin}
                  disabled={loading}
                  className="w-full bg-pink-400 hover:bg-pink-300 disabled:opacity-50 text-black font-bold py-3 px-4 transition-all duration-300 transform hover:scale-105 tracking-wider text-sm"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                      LOGGING IN...
                    </span>
                  ) : (
                    'LOGIN'
                  )}
                </button>

                <button
                  onClick={resetToEmail}
                  className="w-full text-cyan-400 hover:text-pink-400 text-sm py-2 transition-colors underline-offset-2 hover:underline"
                >
                  CHANGE ACCOUNT
                </button>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="bg-red-950/50 border border-red-500/50 text-red-300 px-4 py-3 text-sm">
                ⚠ {error}
              </div>
            )}

            {/* Sign up link */}
            {step === 'email' && (
              <div className="text-center pt-4 border-t border-cyan-400/20">
                <p className="text-cyan-400/70 text-sm">
                  NO ACCOUNT?{' '}
                  <a href="/signup" className="text-cyan-400 hover:text-pink-400 font-bold transition-colors">
                    INITIALIZE ONE
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}