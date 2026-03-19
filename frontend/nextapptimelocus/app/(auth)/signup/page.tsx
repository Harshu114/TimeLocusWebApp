"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, User, Loader2 } from "lucide-react";
import styles from "../../auth.module.css";

export default function SignupPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- Cyberpunk Particle Animation ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2,
      size: Math.random() * 2 + 1,
      color: ["#ff0080", "#00ffff", "#ffff00"][Math.floor(Math.random() * 3)],
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // --- Form Logic ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      // Mock API Call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      router.push("/dashboard");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />

      <div className={styles.card}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⬡</span>
          <span className={styles.logoText}>TimeLocus</span>
        </div>

        <h1 className={styles.title}>Create Account</h1>
        {error && <div className={styles.errorBanner}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Name Fields */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="firstName">First Name</label>
              <div className={styles.inputWrap}>
                <User size={18} className={styles.icon} />
                <input id="firstName" type="text" required placeholder="Jane" onChange={handleChange} />
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="lastName">Last Name</label>
              <div className={styles.inputWrap}>
                <input id="lastName" type="text" required placeholder="Smith" onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Email */}
          <div className={styles.field}>
            <label htmlFor="email">Email Address</label>
            <div className={styles.inputWrap}>
              <Mail size={18} className={styles.icon} />
              <input id="email" type="email" required placeholder="name@company.com" onChange={handleChange} />
            </div>
          </div>

          {/* Password */}
          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <div className={styles.inputWrap}>
              <Lock size={18} className={styles.icon} />
              <input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                required 
                onChange={handleChange} 
              />
              <button 
                type="button" 
                className={styles.eyeBtn} 
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className={styles.field}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className={styles.inputWrap}>
              <Lock size={18} className={styles.icon} />
              <input id="confirmPassword" type="password" required onChange={handleChange} />
            </div>
          </div>

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? <Loader2 className={styles.spinner} /> : "Initialize Account"}
          </button>
        </form>

        <p className={styles.switchText}>
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
