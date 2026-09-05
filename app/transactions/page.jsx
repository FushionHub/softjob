'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
export default function TransactionsPage(){
  const [user,setUser]=useState(null);
  const [txs,setTxs]=useState([]);
  const [filter,setFilter]=useState('all');
  const [loading,setLoading]=useState(true);
  const fetchData = async (f=filter)=>{
    const [uR,tR]=await Promise.all([fetch('/api/user/me'), fetch(`/api/transactions?type=${f}`)]);
    if(uR.ok) setUser(await uR.json());
    if(tR.ok) setTxs((await tR.json()).transactions||[]);
    setLoading(false);
  };
  useEffect(()=>{ fetchData(filter); },[filter]);
  if(loading) return <div className="min-h-screen bg-[#010214] flex items-center justify-center"><div className="size-10 border-4 border-[#ef4d45] border-t-transparent rounded-full animate-spin"/></div>;
  const tabs = ['all','deposit','withdrawal','swap','trade'];
  return (
    <DashboardLayout title="Transactions" user={user}>
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t=> <button key={t} onClick={()=>setFilter(t)} className={`px-4 py-2 rounded-full text-xs font-bold capitalize border ${filter===t?'bg-[#ef4d45] border-[#ef4d45] text-white':'bg-white/5 border-white/10 text-white/60 hover:text-white'}`}>{t}</button>)}
      </div>
      <div className="bg-[#05081c] border border-white/5 rounded-2xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-xs"><thead><tr className="border-b border-white/5 text-white/40 text-[10px] uppercase tracking-wider"><th className="text-left py-3 px-3">Date</th><th className="text-left py-3 px-3">Type</th><th className="text-left py-3 px-3">Detail</th><th className="text-left py-3 px-3">Amount</th><th className="text-left py-3 px-3">Status</th></tr></thead>
          <tbody>{txs.length ? txs.map(tx=> <tr key={`${tx.type}-${tx.id}`} className="border-b border-white/5 hover:bg-white/[0.02]"><td className="py-3 px-3 text-white/60">{new Date(tx.created_at).toLocaleDateString()}</td><td className="py-3 px-3"><span className="px-2 py-1 rounded-full bg-white/5 text-white text-[10px] font-bold capitalize">{tx.type}</span></td><td className="py-3 px-3 text-white/70 font-mono text-[11px] truncate max-w-[200px]">{tx.method}{tx.to_amount ? ` → ${Number(tx.to_amount).toFixed(4)}`:''}</td><td className="py-3 px-3 font-bold text-white">${Number(tx.amount).toFixed(2)}</td><td className="py-3 px-3"><span className={`px-2 py-1 rounded-full text-[10px] font-bold ${tx.status==='approved' || tx.status==='completed' || tx.status==='closed' ?'bg-emerald-500/10 text-emerald-400': tx.status==='pending' || tx.status==='open'?'bg-yellow-500/10 text-yellow-400':'bg-red-500/10 text-red-400'}`}>{tx.status}</span></td></tr>) : <tr><td colSpan={5} className="py-10 text-center text-white/30">No transactions for {filter}</td></tr>}</tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
