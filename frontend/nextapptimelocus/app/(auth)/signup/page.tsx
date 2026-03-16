// app/(auth)/signup/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react';



export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/login?message=Account created successfully');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to create account');
      }
    } catch (error) {
      setError('Unable to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
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
      <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-pink-950/10 opacity-60"></div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-sm px-4">
        {/* Centered card with neon border */}
        <div className="bg-black border-2 border-pink-400 shadow-lg shadow-pink-400/20 p-8">
          {/* Decorative corners */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-yellow-400"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-yellow-400"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400"></div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-pink-400 mb-2 tracking-wider">TIMELOCUS</h1>
            <div className="h-1 w-12 bg-gradient-to-r from-cyan-400 via-pink-400 to-yellow-400 mx-auto mb-4"></div>
            <p className="text-cyan-400 text-sm font-light tracking-widest">JOIN THE NETWORK</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Names */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-pink-400 text-xs font-semibold mb-2 block">FIRST</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  className="w-full bg-transparent border-b-2 border-pink-400/50 text-pink-400 placeholder-pink-400/30 py-2 focus:outline-none focus:border-pink-400 transition-colors text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-cyan-400 text-xs font-semibold mb-2 block">LAST</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  className="w-full bg-transparent border-b-2 border-cyan-400/50 text-cyan-400 placeholder-cyan-400/30 py-2 focus:outline-none focus:border-cyan-400 transition-colors text-sm"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-yellow-400 text-xs font-semibold mb-2 block">EMAIL</label>
              <div className="relative group">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="user@example.com"
                  className="w-full bg-transparent border-b-2 border-yellow-400/50 text-yellow-400 placeholder-yellow-400/30 py-2 pr-8 focus:outline-none focus:border-yellow-400 transition-colors text-sm"
                  required
                />
                <Mail className="absolute right-0 top-2 h-4 w-4 text-yellow-400/50 group-focus-within:text-yellow-400 transition-colors" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-pink-400 text-xs font-semibold mb-2 block">PASSWORD</label>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-transparent border-b-2 border-pink-400/50 text-pink-400 placeholder-pink-400/30 py-2 pr-8 focus:outline-none focus:border-pink-400 transition-colors text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-2 text-pink-400/50 hover:text-pink-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-pink-400/60 mt-1">Min 8 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-cyan-400 text-xs font-semibold mb-2 block">CONFIRM PASSWORD</label>
              <div className="relative group">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-transparent border-b-2 border-cyan-400/50 text-cyan-400 placeholder-cyan-400/30 py-2 pr-8 focus:outline-none focus:border-cyan-400 transition-colors text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-0 top-2 text-cyan-400/50 hover:text-cyan-400 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-950/50 border border-red-500/50 text-red-300 px-4 py-3 text-sm">
                ⚠ {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-pink-400 hover:bg-pink-300 disabled:opacity-50 text-black font-bold py-3 px-4 mt-6 transition-all duration-300 transform hover:scale-105 tracking-wider text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                  SIGNING UP...
                </span>
              ) : (
                'CREATE ACCOUNT'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-pink-400/20 mt-6">
            <p className="text-pink-400/70 text-sm">
              ALREADY REGISTERED?{' '}
              <a href="/login" className="text-pink-400 hover:text-cyan-400 font-bold transition-colors">
                LOGIN
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>