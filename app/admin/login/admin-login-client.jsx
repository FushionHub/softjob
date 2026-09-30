'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Lock, Mail, Eye, EyeOff, AlertCircle, Shield, ArrowLeft } from 'lucide-react';

export default function AdminLoginClient() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || 'Invalid admin credentials');
        setLoading(false);
        return;
      }

      // Hard redirect ensures all browser cookies and tokens are cleanly loaded
      window.location.href = data.redirect || '/admin';
    } catch (err) {
      console.error('Admin login error:', err);
      setError('An error occurred connecting to the admin service. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#010214] flex flex-col items-center justify-center px-4 py-8 relative">
      {/* Top back navigation */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Switch to Investor Login
        </Link>
        <span className="text-[10px] font-mono uppercase bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-bold">
          Restricted Portal
        </span>
      </div>

      <div className="w-full max-w-md">
        <div className="bg-[#05081c] border border-[#1a1f3d] rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle glow background */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#ef4d45]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center mb-8 relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ef4d45] to-[#8c0030] shadow-lg shadow-[#ef4d45]/25 mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-wide">Admin Command Desk</h1>
            <p className="text-gray-400 text-xs mt-1.5">Sign in to manage users, deposits, withdrawals, and trades</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-6 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-xs text-red-400 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 bg-[#010214] border border-[#1a1f3d] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#ef4d45] text-sm transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">Admin Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-11 py-3 bg-[#010214] border border-[#1a1f3d] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#ef4d45] text-sm transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-[#ef4d45] to-[#8c0030] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-lg shadow-[#ef4d45]/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Authenticating Admin...
                </>
              ) : (
                'Sign In to Admin Portal'
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#1a1f3d] text-center">
            <p className="text-[11px] text-gray-500">
              Only authorized staff with active administrator credentials may access this desk.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
