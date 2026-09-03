'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { History, TrendingUp } from 'lucide-react';
export default function InvestmentHistoryPage() {
  const [user,setUser]=useState(null);
  const [investments,setInvestments]=useState([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{(async()=>{
    const [uR,iR]=await Promise.all([fetch('/api/user/me'), fetch('/api/investments')]);
    if(uR.ok) setUser(await uR.json());
    if(iR.ok) setInvestments((await iR.json()).investments||[]);
    setLoading(false);
  })();},[]);
  if(loading) return <div className="min-h-screen bg-[#010214] flex items-center justify-center"><div className="size-10 border-4 border-[#ef4d45] border-t-transparent rounded-full animate-spin"/></div>;
  return (
    <DashboardLayout title="Investment History" user={user}>
      <div className="bg-[#05081c] border border-white/5 rounded-2xl p-6">
        <h2 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2"><History className="size-4 text-[#ef4d45]"/> All Investments</h2>
        {investments.length ? (
          <div className="space-y-3">
            {investments.map(inv=> (
              <div key={inv.id} className="bg-[#010214] border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2"><span className="size-2 rounded-full" style={{background: inv.color||'#ef4d45'}}/><p className="text-sm font-black text-white">{inv.plan_name} • {inv.percentage}%</p><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${inv.status==='active'?'bg-emerald-500/10 text-emerald-400':'bg-white/10 text-white/60'}`}>{inv.status}</span></div>
                  <p className="text-xs text-white/50 mt-1">${Number(inv.amount).toFixed(2)} • {new Date(inv.start_date).toLocaleDateString()} → {new Date(inv.end_date).toLocaleDateString()}</p>
                  <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#ef4d45] to-[#8c0030]" style={{width:`${inv.progress}%`}}/></div>
                </div>
                <div className="text-right"><p className="text-xs text-white/40">Progress</p><p className="text-lg font-black text-white">{inv.progress}%</p><p className="text-xs text-emerald-400 font-bold">+${Number(inv.profit||0).toFixed(2)}</p></div>
              </div>
            ))}
          </div>
        ) : <div className="text-center py-12 text-white/30"><TrendingUp className="size-8 mx-auto mb-2 opacity-50"/><p className="text-sm font-bold">No investments yet</p><p className="text-xs">Start investing from Deposits or Packages</p></div>}
      </div>
    </DashboardLayout>
  );
}
