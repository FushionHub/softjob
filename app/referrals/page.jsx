'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { Users, Copy, Check, Gift, TrendingUp } from 'lucide-react';
export default function ReferralsPage(){
  const [user,setUser]=useState(null);
  const [data,setData]=useState({ referralCode:'', referralLink:'', stats:{total:0,total_bonus:0,active_count:0}, referrals:[] });
  const [copied,setCopied]=useState(''); 
  const [loading,setLoading]=useState(true);
  useEffect(()=>{(async()=>{
    const [uR,rR]=await Promise.all([fetch('/api/user/me'), fetch('/api/referrals')]);
    if(uR.ok) setUser(await uR.json());
    if(rR.ok) setData(await rR.json());
    setLoading(false);
  })(); const id=setInterval(async()=>{
    const r=await fetch('/api/referrals'); if(r.ok) setData(await r.json());
  },10000); return()=>clearInterval(id);
  },[]);
  const copy = (text,key)=>{ navigator.clipboard.writeText(text); setCopied(key); setTimeout(()=>setCopied(''),2000); };
  if(loading) return <div className="min-h-screen bg-[#010214] flex items-center justify-center"><div className="size-10 border-4 border-[#ef4d45] border-t-transparent rounded-full animate-spin"/></div>;
  return (
    <DashboardLayout title="Referrals" user={user}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-[#ef4d45]/20 to-[#8c0030]/20 border border-[#ef4d45]/20 rounded-2xl p-5"><p className="text-[11px] uppercase font-black text-white/60">Total Referrals</p><p className="text-3xl font-black text-white mt-1">{data.stats.total||0}</p><p className="text-xs text-white/50">{data.stats.active_count||0} active</p></div>
        <div className="bg-[#05081c] border border-white/5 rounded-2xl p-5"><p className="text-[11px] uppercase font-black text-white/40">Bonus Earned</p><p className="text-2xl font-black text-emerald-400 mt-1">${Number(data.stats.total_bonus||0).toFixed(2)}</p><p className="text-xs text-white/30">Real-time credited</p></div>
        <div className="bg-[#05081c] border border-white/5 rounded-2xl p-5 flex flex-col justify-center"><p className="text-[11px] uppercase font-black text-white/40">Your Code</p><div className="flex items-center gap-2 mt-1"><span className="text-xl font-black text-white tracking-widest font-mono">{data.referralCode}</span><button onClick={()=>copy(data.referralCode,'code')} className="p-1.5 bg-white/5 rounded-lg border border-white/10">{copied==='code'?<Check className="size-4 text-emerald-400"/>:<Copy className="size-4 text-white/60"/>}</button></div></div>
      </div>

      <div className="bg-[#05081c] border border-white/5 rounded-2xl p-6">
        <h3 className="text-sm font-black text-white uppercase tracking-wider mb-3 flex items-center gap-2"><Gift className="size-4 text-[#ef4d45]"/> Your Referral Link (Generic & Live)</h3>
        <div className="bg-[#010214] border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <p className="text-sm font-mono text-white/70 break-all flex-1">{data.referralLink}</p>
          <button onClick={()=>copy(data.referralLink,'link')} className="shrink-0 bg-[#ef4d45] hover:bg-[#d03d35] text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2">{copied==='link'?<Check className="size-4"/>:<Copy className="size-4"/>}{copied==='link'?'Copied':'Copy Link'}</button>
        </div>
        <p className="text-xs text-white/30 mt-2">Generic: works for any user, instant tracking. Share on WhatsApp, Telegram, social. Bonus auto-credited when referral deposits.</p>
      </div>

      <div className="bg-[#05081c] border border-white/5 rounded-2xl p-6">
        <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2"><Users className="size-4 text-white/60"/> Referred Users</h3>
        {data.referrals.length ? (
          <div className="space-y-2">
            {data.referrals.map(r=> <div key={r.id} className="bg-[#010214] border border-white/5 rounded-xl p-4 flex justify-between items-center"><div><p className="text-sm font-bold text-white">{r.name} <span className="text-white/40 font-normal">@{r.username}</span></p><p className="text-xs text-white/40">{r.email} • Joined {new Date(r.joined_at).toLocaleDateString()}</p></div><div className="text-right"><p className="text-sm font-black text-emerald-400">+${Number(r.bonus_amount||0).toFixed(2)}</p><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.status==='active'?'bg-emerald-500/10 text-emerald-400':'bg-yellow-500/10 text-yellow-400'}`}>{r.status}</span></div></div>)}
          </div>
        ) : <div className="text-center py-10 text-white/30"><TrendingUp className="size-8 mx-auto mb-2 opacity-40"/><p className="text-sm font-bold">No referrals yet</p><p className="text-xs">Share your link to start earning 5% per deposit</p></div>}
      </div>
    </DashboardLayout>
  );
}
