'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { DollarSign } from 'lucide-react';
export default function ProfitHistoryPage(){
  const [user,setUser]=useState(null);
  const [profits,setProfits]=useState([]);
  const [totals,setTotals]=useState({trades:0, investments:0});
  const [loading,setLoading]=useState(true);
  useEffect(()=>{(async()=>{
    const [uR,pR]=await Promise.all([fetch('/api/user/me'), fetch('/api/profit-history')]);
    if(uR.ok) setUser(await uR.json());
    if(pR.ok){ const d=await pR.json(); setProfits(d.profits||[]); setTotals(d.totals||{trades:0,investments:0}); }
    setLoading(false);
  })();},[]);
  if(loading) return <div className="min-h-screen bg-[#010214] flex items-center justify-center"><div className="size-10 border-4 border-[#ef4d45] border-t-transparent rounded-full animate-spin"/></div>;
  return (
    <DashboardLayout title="Profit History" user={user}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-2xl p-5"><p className="text-[11px] uppercase font-black text-white/40">Total Profit</p><p className="text-2xl font-black text-white mt-1">${(Number(totals.trades)+Number(totals.investments)+profits.reduce((a,c)=>a+Number(c.amount||0),0)).toFixed(2)}</p></div>
        <div className="bg-[#05081c] border border-white/5 rounded-2xl p-5"><p className="text-[11px] uppercase font-black text-white/40">Investment Profit</p><p className="text-xl font-black text-emerald-400 mt-1">${Number(totals.investments).toFixed(2)}</p></div>
        <div className="bg-[#05081c] border border-white/5 rounded-2xl p-5"><p className="text-[11px] uppercase font-black text-white/40">Trading Profit</p><p className="text-xl font-black text-blue-400 mt-1">${Number(totals.trades).toFixed(2)}</p></div>
      </div>
      <div className="bg-[#05081c] border border-white/5 rounded-2xl p-6">
        <h2 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2"><DollarSign className="size-4 text-emerald-400"/> Profit Log</h2>
        {profits.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs"><thead><tr className="border-b border-white/5 text-white/40 text-[10px] uppercase tracking-wider"><th className="text-left py-2 px-3">Date</th><th className="text-left py-2 px-3">Type</th><th className="text-left py-2 px-3">Description</th><th className="text-right py-2 px-3">Amount</th></tr></thead>
            <tbody>{profits.map(p=> <tr key={p.id} className="border-b border-white/5"><td className="py-3 px-3 text-white/60">{new Date(p.created_at).toLocaleDateString()}</td><td className="py-3 px-3"><span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full text-[10px] font-bold">{p.type}</span></td><td className="py-3 px-3 text-white/70">{p.description||'Profit accrual'}</td><td className="py-3 px-3 text-right font-black text-emerald-400">+${Number(p.amount).toFixed(2)}</td></tr>)}</tbody>
            </table>
          </div>
        ) : <p className="text-center py-10 text-white/30 text-sm">No profit history yet - profits appear as investments mature or trades close</p>}
      </div>
    </DashboardLayout>
  );
}
