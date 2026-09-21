'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard-layout';
import CoinChartWidget, { MiniChart } from '@/components/coin-chart-widget';
import TradingViewTicker from '@/components/tradingview-ticker';
import { Wallet, TrendingUp, DollarSign, ArrowUpCircle, Copy, Check, AlertCircle, Mail, Loader2, RefreshCw } from 'lucide-react';

export default function DashboardClient() {
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [resending, setResending] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [uRes, dRes] = await Promise.all([fetch('/api/user/me'), fetch('/api/dashboard')]);
      if (uRes.ok) setUser(await uRes.json());
      if (dRes.ok) setDashboardData(await dRes.json());
    } catch (e) { console.error(e); } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => {
    const id = setInterval(fetchAll, 15000); // real-time poll
    return () => clearInterval(id);
  }, [fetchAll]);

  const handleCopyReferral = () => {
    const code = user?.referral_code || user?.username || 'user';
    const base = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const link = `${base}/register?ref=${code}`;
    navigator.clipboard.writeText(link);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  const handleCopyCode = () => {
    const code = user?.referral_code || user?.username || '';
    navigator.clipboard.writeText(code);
    setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000);
  };
  const handleResend = async () => {
    setResending(true); setMsg({ type: '', text: '' });
    try {
      const r = await fetch('/api/auth/resend-verification', { method: 'POST' });
      const d = await r.json();
      const isAlreadyVerified = d.message === 'Email is already verified' || d.error === 'Email is already verified';
      if (r.ok || isAlreadyVerified) {
        // Real-time fix: backend says already verified but banner still shows due to stale user state — sync it
        if (isAlreadyVerified || d.message?.toLowerCase().includes('already verified')) {
          setUser(prev => prev ? { ...prev, email_verified: true } : prev);
          setMsg({ type: 'success', text: 'Email is already verified — banner dismissed.' });
          // also refresh from server to confirm
          try { const ur = await fetch('/api/user/me'); if (ur.ok) setUser(await ur.json()); } catch {}
          return;
        }
        setMsg({ type: 'success', text: d.message || 'Verification email sent' });
      } else {
        setMsg({ type: 'error', text: d.message || d.error });
      }
    } catch { setMsg({ type: 'error', text: 'Network error' }); } finally { setResending(false); }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#010214] flex items-center justify-center"><div className="size-10 border-4 border-[#ef4d45] border-t-transparent rounded-full animate-spin" /></div>;
  }

  const stats = [
    { label: 'Total Balance', value: Number(dashboardData?.balance || 0).toFixed(2), icon: Wallet, color: 'from-blue-500/10 to-blue-600/5 border-blue-500/20 text-blue-400' },
    { label: 'Total Profit', value: Number(dashboardData?.total_profit || 0).toFixed(2), icon: TrendingUp, color: 'from-green-500/10 to-green-600/5 border-green-500/20 text-green-400' },
    { label: 'Total Bonus', value: Number(dashboardData?.total_bonus || 0).toFixed(2), icon: DollarSign, color: 'from-purple-500/10 to-purple-600/5 border-purple-500/20 text-purple-400' },
    { label: 'Withdrawn', value: Number(dashboardData?.total_withdrawal || 0).toFixed(2), icon: ArrowUpCircle, color: 'from-orange-500/10 to-orange-600/5 border-orange-500/20 text-orange-400' },
  ];

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  const refCode = user?.referral_code || user?.username || '';
  const refLink = `${baseUrl}/register?ref=${refCode}`;

  return (
    <DashboardLayout title="Dashboard" user={user}>
      <div className="border border-white/5 rounded-2xl overflow-hidden bg-[#05081c]">
        <TradingViewTicker />
      </div>

      {!user?.email_verified && (
        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg"><AlertCircle className="size-5 text-yellow-400" /></div>
            <div><p className="text-sm font-bold text-white">Verify your email</p><p className="text-xs text-white/60">Unlock deposits, withdrawals & trading</p></div>
          </div>
          <button onClick={handleResend} disabled={resending} className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold rounded-lg disabled:opacity-50">
            {resending ? <><Loader2 className="size-4 animate-spin" />Sending...</> : <><Mail className="size-4" />Resend Email</>}
          </button>
        </div>
      )}
      {msg.text && <div className={`p-3 rounded-xl text-xs font-semibold ${msg.type==='success'?'bg-emerald-500/10 border border-emerald-500/20 text-emerald-200':'bg-red-500/10 border border-red-500/20 text-red-200'}`}>{msg.text}</div>}

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-wider text-white/70">Overview</h2>
        <button onClick={()=>{setRefreshing(true); fetchAll();}} className="flex items-center gap-2 text-xs text-white/60 hover:text-white bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
          <RefreshCw className={`size-3.5 ${refreshing?'animate-spin':''}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-5 border`}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/5 rounded-lg"><s.icon className={`size-5 ${s.color.split(' ').pop()}`} /></div>
              <span className="text-[10px] uppercase font-black text-white/40">{s.label}</span>
            </div>
            <p className="text-2xl font-black text-white">${s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#05081c] rounded-2xl border border-white/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Live Market Chart</h3>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full font-bold">● LIVE</span>
          </div>
          <CoinChartWidget height={380} />
        </div>
        <div className="space-y-4">
          <div className="bg-[#05081c] rounded-2xl border border-white/5 p-5">
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-3">Active Investments</h3>
            {dashboardData?.investments?.length ? (
              <div className="space-y-3 max-h-[180px] overflow-auto pr-1">
                {dashboardData.investments.map(inv=> (
                  <div key={inv.id} className="bg-[#010214] border border-white/5 rounded-xl p-3 flex justify-between items-center">
                    <div><p className="text-xs font-bold text-white">{inv.plan_name}</p><p className="text-[11px] text-white/50">${Number(inv.amount).toFixed(2)} • {inv.percentage}% • {inv.duration}</p></div>
                    <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full">{inv.status}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-white/40 py-6 text-center">No active investments</p>}
            <Link href="/packages" className="mt-3 block text-center text-xs font-bold bg-[#ef4d45] hover:bg-[#d03d35] text-white py-2.5 rounded-xl">Browse Plans</Link>
          </div>
          <div className="bg-[#05081c] rounded-2xl border border-white/5 p-5">
            <h3 className="text-xs font-black text-white uppercase tracking-wider mb-2">BTC Mini Trend</h3>
            <MiniChart symbol="BINANCE:BTCUSDT" height={120} />
          </div>
        </div>
      </div>

      <div className="bg-[#05081c] rounded-2xl border border-white/5 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-white uppercase tracking-wider">Recent Transactions</h3>
          <Link href="/transactions" className="text-xs text-[#ef4d45] font-bold hover:underline">View All →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-white/5 text-white/40 text-[10px] uppercase tracking-wider"><th className="text-left py-2 px-3">Date</th><th className="text-left py-2 px-3">Type</th><th className="text-left py-2 px-3">Amount</th><th className="text-left py-2 px-3">Status</th></tr></thead>
            <tbody>
              {dashboardData?.deposits?.length ? dashboardData.deposits.slice(0,5).map(d=> (
                <tr key={d.id} className="border-b border-white/5"><td className="py-3 px-3 text-white/70">{new Date(d.date).toLocaleDateString()}</td><td className="py-3 px-3 capitalize text-white/70">{d.type}</td><td className="py-3 px-3 font-bold text-white">${Number(d.amount).toFixed(2)}</td><td className="py-3 px-3"><span className={`px-2 py-1 rounded-full text-[10px] font-bold ${d.status==='approved'?'bg-emerald-500/10 text-emerald-400': d.status==='pending'?'bg-yellow-500/10 text-yellow-400':'bg-red-500/10 text-red-400'}`}>{d.status}</span></td></tr>
              )) : <tr><td colSpan={4} className="py-8 text-center text-white/30">No transactions</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-[#05081c] rounded-2xl border border-white/5 p-5">
        <h3 className="text-sm font-black text-white uppercase tracking-wider mb-3">Your Referral</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#010214] border border-white/5 rounded-xl p-4">
            <p className="text-[10px] uppercase font-black text-white/40 mb-1">Referral Code</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-white tracking-widest font-mono">{refCode}</span>
              <button onClick={handleCopyCode} className="ml-auto p-1.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10">{copiedCode ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4 text-white/60" />}</button>
            </div>
            <p className="text-[11px] text-white/30 mt-1">Generic • Auto-generated • Works instantly</p>
          </div>
          <div className="md:col-span-2 bg-[#010214] border border-white/5 rounded-xl p-4">
            <p className="text-[10px] uppercase font-black text-white/40 mb-1">Referral Link</p>
            <p className="text-xs text-white/60 font-mono break-all">{refLink}</p>
            <button onClick={handleCopyReferral} className="mt-3 w-full sm:w-auto bg-[#ef4d45] hover:bg-[#d03d35] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 justify-center">
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}{copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>
        <p className="text-[11px] text-white/30 mt-3">Share this link. When friends register with your code, you earn bonus instantly credited. Track in <Link href="/referrals" className="text-[#ef4d45] font-bold hover:underline">Referrals</Link>.</p>
      </div>
    </DashboardLayout>
  );
}
