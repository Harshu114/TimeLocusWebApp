// app/dashboard/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  Calendar,
  Users,
  Settings,
  Play,
  Pause,
  Square,
  BarChart3,
  Timer,
  Moon,
  Sun,
  Menu,
  X,
  Home,
  Activity,
  User,
  Zap,
  Target,
  TrendingUp,
  Award,
  Star,
  Sparkles,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(7);
  const [weeklyGoal, setWeeklyGoal] = useState(40);
  const [completedTasks, setCompletedTasks] = useState(23);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          router.push('/login');
        }
      } catch (error) {
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Cyberpunk particle system
  useEffect(() => {
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

    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: Math.random() * 4 + 2,
        opacity: Math.random() * 0.8 + 0.2,
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
        ctx.lineWidth = 2;

        if (particle.type === 'dot') {
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (particle.type === 'line') {
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(particle.x + particle.vx * 10, particle.y + particle.vy * 10);
          ctx.stroke();
        } else if (particle.type === 'triangle') {
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(particle.x + particle.size, particle.y + particle.size);
          ctx.lineTo(particle.x - particle.size, particle.y + particle.size);
          ctx.closePath();
          ctx.stroke();
        }
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-cyan-950/10 opacity-60"></div>
        <div className="text-center relative z-10">
          <div className="w-12 h-12 border-2 border-cyan-400 border-t-pink-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-cyan-400 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Cyberpunk Background */}
      <canvas ref={canvasRef} className="absolute inset-0 opacity-40" />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-cyan-950/10 opacity-60"></div>

      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-80 bg-black/90 border-r-2 border-cyan-400 shadow-2xl transform lg:translate-x-0 lg:static lg:inset-0">
        <div className="flex items-center justify-between p-8 border-b border-pink-400/50">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-linear-to-r from-pink-500 to-cyan-500 border-2 border-yellow-400 flex items-center justify-center shadow-lg neon-glow">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 border border-black rounded-full animate-neon-pulse"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-cyan-400 animate-glitch">TimeLocus</h1>
              <p className="text-pink-400 text-sm">Cyber Suite</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 border border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-6 space-y-3">
          {[
            { icon: Home, label: 'Dashboard', active: true },
            { icon: Timer, label: 'Time Tracking' },
            { icon: Calendar, label: 'Calendar' },
            { icon: BarChart3, label: 'Reports' },
            { icon: Users, label: 'Team' },
            { icon: User, label: 'Profile' },
            { icon: Settings, label: 'Settings' }
          ].map((item, index) => (
            <button
              key={item.label}
              className={`w-full flex items-center gap-4 px-4 py-4 border-2 transition-all duration-300 group ${
                item.active
                  ? 'bg-linear-to-r from-pink-500 to-cyan-500 text-black border-yellow-400 shadow-lg shadow-yellow-400/50 neon-glow'
                  : 'border-cyan-400/50 text-cyan-400 hover:border-cyan-400 hover:bg-cyan-400/10 hover:text-cyan-300'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <item.icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${item.active ? 'text-black' : ''}`} />
              <span className="font-medium">{item.label}</span>
              {item.active && <ChevronRight className="h-4 w-4 ml-auto" />}
            </button>
          ))}
        </nav>

        {/* User Stats */}
        <div className="absolute bottom-8 left-6 right-6">
          <div className="bg-black/80 border-2 border-pink-400/50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-linear-to-r from-cyan-500 to-yellow-500 border border-cyan-400 rounded-full flex items-center justify-center text-black font-bold">
                {user.firstName?.[0] || 'U'}
              </div>
              <div>
                <p className="font-semibold text-cyan-400">{user.firstName || 'User'}</p>
                <p className="text-pink-400 text-xs">Premium Member</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-cyan-400">This Week</span>
                <span className="font-medium text-yellow-400">32h 15m</span>
              </div>
              <div className="w-full bg-gray-800 border border-cyan-400/50 rounded-none h-2">
                <div className="bg-linear-to-r from-pink-500 to-cyan-500 h-2 transition-all duration-500"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-80 relative z-10">
        {/* Header */}
        <header className="bg-black/80 border-b-2 border-cyan-400/50 shadow-2xl">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-3 border border-pink-400 text-pink-400 hover:bg-pink-400 hover:text-black transition-all duration-200"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <div className="animate-in slide-in-from-left duration-500">
                  <h2 className="text-3xl font-bold text-cyan-400 animate-glitch">
                    Welcome back, {user.firstName || 'User'}!
                  </h2>
                  <p className="text-pink-400 text-lg mt-1">
                    Ready to conquer your goals today? 🚀
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-3 border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black transition-all duration-200 group"
                >
                  {isDarkMode ? (
                    <Sun className="h-6 w-6 group-hover:scale-110 transition-transform" />
                  ) : (
                    <Moon className="h-6 w-6 group-hover:scale-110 transition-transform" />
                  )}
                </button>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-linear-to-r from-pink-500 to-cyan-500 border-2 border-yellow-400 rounded-none flex items-center justify-center text-black font-bold shadow-lg neon-glow">
                      {user.firstName?.[0] || 'U'}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border border-black rounded-none animate-neon-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Timer Section */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="bg-black/80 border-2 border-yellow-400 shadow-2xl p-8 mb-8 relative overflow-hidden">
            {/* Cyberpunk Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 border-t-2 border-r-2 border-pink-400"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 border-b-2 border-l-2 border-cyan-400"></div>

            <div className="relative z-10">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 border-2 border-cyan-400 bg-cyan-400/10 mb-6">
                  <Zap className="h-4 w-4 text-cyan-400 animate-neon-pulse" />
                  <span className="text-sm font-medium text-cyan-400">Focus Timer</span>
                </div>
                <div className="text-8xl font-mono font-bold text-yellow-400 mb-4 animate-glitch">
                  {formatTime(timerSeconds)}
                </div>
                <div className="flex justify-center gap-4 mb-8">
                  <button
                    onClick={toggleTimer}
                    className={`px-8 py-4 border-2 font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
                      isTimerRunning
                        ? 'bg-linear-to-r from-red-500 to-pink-600 text-black border-pink-400 shadow-lg shadow-pink-400/50 neon-glow'
                        : 'bg-linear-to-r from-green-500 to-cyan-600 text-black border-cyan-400 shadow-lg shadow-cyan-400/50 neon-glow'
                    }`}
                  >
                    {isTimerRunning ? <Pause className="h-6 w-6 inline mr-3" /> : <Play className="h-6 w-6 inline mr-3" />}
                    {isTimerRunning ? 'Pause' : 'Start Focus'}
                  </button>
                  <button
                    onClick={resetTimer}
                    className="px-8 py-4 bg-gray-800 border-2 border-pink-400 text-pink-400 hover:bg-pink-400 hover:text-black font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-pink-400/25"
                  >
                    <Square className="h-6 w-6 inline mr-3" />
                    Reset
                  </button>
                </div>
                <p className="text-cyan-400 text-lg">
                  {isTimerRunning ? 'Stay focused and productive! 💪' : 'Click start to begin your focus session'}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              {
                icon: Target,
                label: 'Weekly Goal',
                value: `${weeklyGoal}h`,
                progress: 80,
                color: 'from-blue-500 to-cyan-500',
                bgColor: 'from-blue-500/10 to-cyan-500/10',
                borderColor: 'border-blue-500/20'
              },
              {
                icon: TrendingUp,
                label: 'This Week',
                value: '32h 15m',
                progress: 80,
                color: 'from-green-500 to-emerald-500',
                bgColor: 'from-green-500/10 to-emerald-500/10',
                borderColor: 'border-green-500/20'
              },
              {
                icon: Award,
                label: 'Current Streak',
                value: `${currentStreak} days`,
                progress: 100,
                color: 'from-purple-500 to-pink-500',
                bgColor: 'from-purple-500/10 to-pink-500/10',
                borderColor: 'border-purple-500/20'
              },
              {
                icon: Star,
                label: 'Tasks Done',
                value: completedTasks,
                progress: 65,
                color: 'from-orange-500 to-red-500',
                bgColor: 'from-orange-500/10 to-red-500/10',
                borderColor: 'border-orange-500/20'
              }
            ].map((stat, index) => (
              <div
                key={stat.label}
                className="bg-black/80 border-2 border-cyan-400 p-6 hover:border-pink-400 transition-all duration-300 transform hover:-translate-y-2 animate-in slide-in-from-bottom shadow-lg shadow-cyan-400/25"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-linear-to-r from-pink-500/20 to-cyan-500/20 border border-cyan-400">
                    <stat.icon className="h-6 w-6 text-cyan-400" />
                  </div>
                  <MoreHorizontal className="h-5 w-5 text-pink-400 hover:text-yellow-400 transition-colors cursor-pointer" />
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-cyan-400">{stat.label}</p>
                    <p className="text-2xl font-bold text-yellow-400">{stat.value}</p>
                  </div>
                  <div className="w-full bg-gray-800 border border-pink-400 h-2">
                    <div className="bg-linear-to-r from-pink-500 to-cyan-500 h-2 transition-all duration-1000" style={{ width: `${stat.progress}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Main Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Time Tracking Card */}
            <div className="bg-black/80 border-2 border-cyan-400 p-8 hover:border-pink-400 transition-all duration-300 transform hover:-translate-y-2 animate-in slide-in-from-left duration-500 shadow-lg shadow-cyan-400/25">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-linear-to-r from-pink-500/20 to-cyan-500/20 border border-cyan-400">
                  <Clock className="h-8 w-8 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-cyan-400">Time Tracking</h3>
                  <p className="text-pink-400">Track your productivity</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-cyan-400">Today's Progress</span>
                  <span className="font-bold text-lg text-yellow-400">6h 32m</span>
                </div>
                <div className="w-full bg-gray-800 border border-pink-400 h-3">
                  <div className="bg-linear-to-r from-pink-500 to-cyan-500 h-3 transition-all duration-500" style={{ width: '75%' }}></div>
                </div>
                <button className="w-full bg-linear-to-r from-pink-500 to-cyan-500 text-black py-3 border-2 border-yellow-400 font-semibold hover:shadow-lg hover:shadow-yellow-400/25 transition-all duration-300 transform hover:scale-105 neon-glow">
                  Start New Session
                </button>
              </div>
            </div>

            {/* Calendar Card */}
            <div className="bg-black/80 border-2 border-cyan-400 p-8 hover:border-pink-400 transition-all duration-300 transform hover:-translate-y-2 animate-in slide-in-from-bottom duration-500 shadow-lg shadow-cyan-400/25">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-linear-to-r from-pink-500/20 to-cyan-500/20 border border-cyan-400">
                  <Calendar className="h-8 w-8 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-cyan-400">Calendar</h3>
                  <p className="text-pink-400">View your schedule</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-black/50 border-2 border-green-400">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 bg-green-400 border border-black"></div>
                    <span className="font-semibold text-green-400">Team Standup</span>
                  </div>
                  <p className="text-cyan-400 text-sm">Today, 10:00 AM - 10:30 AM</p>
                </div>
                <button className="w-full bg-linear-to-r from-pink-500 to-cyan-500 text-black py-3 border-2 border-yellow-400 font-semibold hover:shadow-lg hover:shadow-yellow-400/25 transition-all duration-300 transform hover:scale-105 neon-glow">
                  Open Calendar
                </button>
              </div>
            </div>

            {/* Team Card */}
            <div className="bg-black/80 border-2 border-cyan-400 p-8 hover:border-pink-400 transition-all duration-300 transform hover:-translate-y-2 animate-in slide-in-from-right duration-500 shadow-lg shadow-cyan-400/25">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-linear-to-r from-pink-500/20 to-cyan-500/20 border border-cyan-400">
                  <Users className="h-8 w-8 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-cyan-400">Team</h3>
                  <p className="text-pink-400">Collaborate together</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex -space-x-3 mb-4">
                  {['JD', 'SM', 'AL', '+5'].map((member, index) => (
                    <div
                      key={index}
                      className="w-10 h-10 border-2 border-cyan-400 flex items-center justify-center text-xs font-bold shadow-lg bg-linear-to-r from-pink-500 to-cyan-500 text-black"
                    >
                      {member}
                    </div>
                  ))}
                </div>
                <button className="w-full bg-linear-to-r from-pink-500 to-cyan-500 text-black py-3 border-2 border-yellow-400 font-semibold hover:shadow-lg hover:shadow-yellow-400/25 transition-all duration-300 transform hover:scale-105 neon-glow">
                  View Team Dashboard
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-black/80 border-2 border-cyan-400 p-8 animate-in slide-in-from-bottom duration-500 shadow-lg shadow-cyan-400/25">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-cyan-400 mb-2 animate-glitch">Recent Activity</h2>
                <p className="text-pink-400">Your productivity journey</p>
              </div>
              <Activity className="h-8 w-8 text-cyan-400" />
            </div>
            <div className="space-y-6">
              {[
                {
                  icon: Clock,
                  action: 'Completed focus session',
                  detail: '2 hours 15 minutes',
                  time: '2 hours ago',
                  color: 'text-cyan-400',
                  bgColor: 'border-cyan-400'
                },
                {
                  icon: Target,
                  action: 'Achieved daily goal',
                  detail: '8 hours tracked',
                  time: 'Yesterday',
                  color: 'text-pink-400',
                  bgColor: 'border-pink-400'
                },
                {
                  icon: Users,
                  action: 'Joined team project',
                  detail: 'TimeLocus v2.0',
                  time: '3 days ago',
                  color: 'text-yellow-400',
                  bgColor: 'border-yellow-400'
                }
              ].map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-6 p-4 border-2 border-cyan-400/50 hover:border-pink-400 transition-all duration-200 cursor-pointer group"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div className={`p-3 border-2 ${activity.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                    <activity.icon className={`h-6 w-6 ${activity.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-cyan-400 group-hover:text-yellow-400 transition-colors">
                      {activity.action}
                    </p>
                    <p className="text-pink-400 text-sm">{activity.detail}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-cyan-400">{activity.time}</p>
                    <div className={`w-2 h-2 bg-cyan-400 rounded-none mt-2`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
