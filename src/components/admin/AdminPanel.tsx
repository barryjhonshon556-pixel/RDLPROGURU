'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import AdminLogin from './AdminLogin';
import AdminLayout from './AdminLayout';

interface Admin {
  id: string;
  username: string;
}

interface AdminPanelProps {
  onGoHome?: () => void;
}

export default function AdminPanel({ onGoHome }: AdminPanelProps) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen for admin-unauthorized events from adminFetch
  useEffect(() => {
    const handleUnauthorized = () => {
      setAdmin(null);
      toast.error('Session expired. Please login again.');
    };
    window.addEventListener('admin-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('admin-unauthorized', handleUnauthorized);
  }, []);

  // Periodic auth check every 5 minutes
  useEffect(() => {
    if (!admin) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
        if (!res.ok) {
          setAdmin(null);
          toast.error('Session expired. Please login again.');
        }
      } catch {
        // Network error, don't log out
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [admin]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
      if (res.ok) {
        const data = await res.json();
        if (data.admin) {
          setAdmin(data.admin);
        }
      }
    } catch {
      // Not authenticated
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (loggedInAdmin: Admin) => {
    setAdmin(loggedInAdmin);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } catch {
      // Ignore
    }
    setAdmin(null);
  };

  const handleHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      window.location.href = '/';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-400 via-purple-500 to-indigo-700">
        <div className="bg-white rounded-xl shadow-xl p-8 flex flex-col items-center gap-3">
          <div className="size-8 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return <AdminLogin onLogin={handleLogin} onGoHome={handleHome} />;
  }

  return <AdminLayout onLogout={handleLogout} onHome={handleHome} />;
}
