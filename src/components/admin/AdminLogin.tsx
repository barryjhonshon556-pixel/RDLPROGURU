'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { BarChart3, LogIn, Eye, EyeOff, ArrowLeft, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface AdminLoginProps {
  onLogin: (admin: { id: string; username: string }) => void;
  onGoHome?: () => void;
}

// Animated star field for login background (purple/blue tones)
function LoginStarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const stars: {
      x: number;
      y: number;
      size: number;
      opacity: number;
      twinkle: number;
      twinkleSpeed: number;
      drift: number;
      driftSpeed: number;
    }[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 60; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.04 + 0.01,
        drift: 0,
        driftSpeed: Math.random() * 0.008 + 0.003,
      });
    }

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      stars.forEach((star) => {
        star.twinkle += star.twinkleSpeed;
        star.drift += star.driftSpeed;
        const alpha = star.opacity * (0.4 + 0.6 * Math.sin(star.twinkle));
        const driftX = Math.sin(star.drift) * 8;

        // Mix of purple and blue star colors
        const colors = [
          `rgba(168, 85, 247, ${alpha})`,  // purple-500
          `rgba(139, 92, 246, ${alpha})`,   // violet-500
          `rgba(99, 102, 241, ${alpha})`,    // indigo-500
          `rgba(79, 70, 229, ${alpha})`,     // indigo-600
          `rgba(192, 132, 252, ${alpha})`,   // purple-400
        ];
        const color = colors[Math.floor(star.twinkle * 0.5) % colors.length];

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(star.x + driftX, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Subtle cross sparkle on brighter stars
        if (star.size > 1.5 && alpha > 0.3) {
          ctx.strokeStyle = color;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(star.x + driftX - star.size * 2, star.y);
          ctx.lineTo(star.x + driftX + star.size * 2, star.y);
          ctx.moveTo(star.x + driftX, star.y - star.size * 2);
          ctx.lineTo(star.x + driftX, star.y + star.size * 2);
          ctx.stroke();
        }
      });

      animationId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

export default function AdminLogin({ onLogin, onGoHome }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);

  // Check if initial setup is needed
  useEffect(() => {
    fetch('/api/setup')
      .then((res) => res.json())
      .then((data) => {
        if (data.needsSetup) {
          setNeedsSetup(true);
        } else {
          setNeedsSetup(false);
        }
      })
      .catch(() => setNeedsSetup(false));
  }, []);

  const handleSetup = async () => {
    setSetupLoading(true);
    try {
      const res = await fetch('/api/setup', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Setup failed');
        return;
      }
      toast.success('Setup complete! You can now login with admin / admin123');
      setNeedsSetup(false);
      setUsername('admin');
      setPassword('admin123');
    } catch {
      toast.error('Network error during setup');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast.error('Please enter both username and password');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
        credentials: 'same-origin',
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Login failed');
        return;
      }

      toast.success('Login successful!');
      onLogin(data.admin);
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-indigo-600 to-purple-800 p-4 relative overflow-hidden">
      {/* Animated star field background */}
      <LoginStarField />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Decorative gradient orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-purple-900/30 border border-white/20 overflow-hidden">
          {/* Top gradient accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600" />

          <CardHeader className="text-center pb-2 pt-6">
            {/* RDL PRO Logo/Branding */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="flex flex-col items-center gap-3 mb-3"
            >
              <div className="relative">
                <div className="flex items-center justify-center size-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/30">
                  <BarChart3 className="size-7 text-white" />
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -top-1 -right-1 size-4 rounded-full bg-purple-400 border-2 border-white"
                />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">
                  RDL PRO
                </h1>
                <p className="text-xs text-purple-600/80 font-semibold tracking-widest uppercase mt-0.5">
                  Admin Panel
                </p>
              </div>
            </motion.div>
            <p className="text-sm text-gray-500">Sign in to manage results</p>
          </CardHeader>
          <CardContent className="pt-2 pb-6">
            {/* Setup banner - shown when no admin exists */}
            {needsSetup && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm font-medium text-amber-800 mb-1">🔧 First Time Setup</p>
                <p className="text-xs text-amber-700 mb-2">No admin account found. Click below to create the default admin account.</p>
                <Button
                  type="button"
                  onClick={handleSetup}
                  disabled={setupLoading}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white text-sm h-9"
                >
                  {setupLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Setting up...
                    </span>
                  ) : (
                    'Create Admin Account (admin / admin123)'
                  )}
                </Button>
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-700 font-medium">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="h-11 border-gray-200 focus:border-purple-400 focus:ring-purple-400/20 transition-colors"
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="h-11 pr-10 border-gray-200 focus:border-purple-400 focus:ring-purple-400/20 transition-colors"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="size-4" />
                    Login
                  </span>
                )}
              </Button>
            </form>

            {/* Back to Site link */}
            {onGoHome && (
              <motion.button
                type="button"
                onClick={onGoHome}
                whileHover={{ x: -3 }}
                whileTap={{ scale: 0.97 }}
                className="w-full mt-5 flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-purple-600 transition-colors py-2.5 rounded-lg hover:bg-purple-50/50"
              >
                <ArrowLeft className="size-4" />
                Back to Site
              </motion.button>
            )}
          </CardContent>

          {/* Bottom branding accent */}
          <div className="border-t border-gray-100 px-6 py-3 flex items-center justify-center gap-1.5">
            <Zap className="size-3 text-purple-400" />
            <span className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">
              RDL PRO Matka
            </span>
            <Zap className="size-3 text-purple-400" />
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
