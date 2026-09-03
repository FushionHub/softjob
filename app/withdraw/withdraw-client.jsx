'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { ArrowUpCircle, Copy, Check, X, AlertTriangle, Loader2 } from 'lucide-react';

export default function WithdrawClient(){
  const [user,setUser]=useState(null);
  const [amount,setAmount]=useState('');
  const [wallet,setWallet]=useState('');
  const [network,setNetwork]=useState('bitcoin');
  const [processing,setProcessing]=useState(false);
  const [msg,setMsg]=useState({type:'',text:''});
  const [withdrawals,setWithdrawals]=useState([]);
  const [loading,setLoading]=useState(true);

  const fetchData=async()=>{
    const [uR,wR]=await Promise.all([fetch('/api/user/me'), fetch('/api/withdraw')]);
    if(uR.ok) setUser(await uR.json());
    if(wR.ok) setWithdrawals((await wR.json()).withdrawals||[]);
    setLoading(false);
  };
  useEffect(()=>{ fetchData(); const id=setInterval(fetchData,15000); return()=>clearInterval(id); },[]);

  const handleWithdraw=async(e)=>{
    e.preventDefault();
    const amt=parseFloat(amount);
    if(!amt||amt<=0||!wallet){ setMsg({type:'error',text:'Fill all fields'}); return; }
    if(user && amt>Number(user.balance||0)){ setMsg({type:'error',text:'Insufficient balance'}); return; }
    setProcessing(true); setMsg({type:'',text:''});
    try{
      const r=await fetch('/api/withdraw',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({amount:amt,walletAddress:wallet,network})});
      const d=await r.json();
      if(r.ok){ setMsg({type:'success',text:'Withdrawal requested! Pending approval - you will be notified. Balance not debited until approved (real-time).'}); setAmount(''); setWallet(''); fetchData(); }
      else setMsg({type:'error',text:d.error});
    }catch{ setMsg({type:'error',text:'Network error'});} finally{ setProcessing(false);}
  };

  if(loading) return <div className="min-h-screen bg-[#010214] flex items-center justify-center"><div className="size-10 border-4 border-[#ef4d45] border-t-transparent rounded-full animate-spin"/></div>;
  const balance=Number(user?.balance||0);
  const statusColor=(s)=>{
    if(s==='approved') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if(s==='pending') return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    if(s==='rejected') return 'text-red-400 bg-red-500/10 border-red-500/20';
    return 'text-white/50 bg-white/5 border-white/10';
  };

  return (
    <DashboardLayout title="Withdraw" user={user}>
      {msg.text && <div className={`p-4 rounded-xl text-xs font-bold border flex items-center gap-2 ${msg.type==='success'?'bg-emerald-500/10 border-emerald-500/20 text-emerald-200':'bg-red-500/10 border-red-500/20 text-red-200'}`}>{msg.type==='success'?<Check className="size-4"/>:<AlertTriangle className="size-4"/>}{msg.text}<button onClick={()=>setMsg({type:'',text:''})} className="ml-auto"><X className="size-4"/></button></div>}

      <div className="bg-gradient-to-r from-[#ef4d45]/10 to-[#8c0030]/10 border border-[#ef4d45]/20 rounded-2xl p-6 flex justify-between items-center">
        <div><p className="text-[11px] uppercase font-black text-white/50">Available Balance</p><p className="text-3xl font-black text-white">${balance.toFixed(2)}</p><p className="text-[11px] text-white/30 mt-1">Withdrawals processed in 24-48h • Real-time status via Notifications</p></div>
        <div className="hidden sm:block text-right"><p className="text-xs text-white/50">Pending Withdrawals</p><p className="text-xl font-black text-yellow-400">{withdrawals.filter(w=>w.status==='pending').length}</p></div>
      </div>

      <div className="bg-[#05081c] border border-white/5 rounded-2xl p-6">
        <h2 className="text-sm font-black text-white uppercase tracking-wider mb-4">Request Withdrawal • Real-Time</h2>
        <form onSubmit={handleWithdraw} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-[11px] font-bold text-white/50 uppercase">Amount (USD)</label><input type="number" value={amount} onChange={e=>setAmount(e.target.value)} min="1" step="0.01" placeholder="100.00" className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#ef4d45]" required /></div>
            <div><label className="text-[11px] font-bold text-white/50 uppercase">Network</label><select value={network} onChange={e=>setNetwork(e.target.value)} className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-3 text-white outline-none"><option value="bitcoin">Bitcoin (BTC)</option><option value="ethereum">Ethereum (ERC20)</option><option value="usdt_trc20">USDT (TRC20)</option><option value="usdt_erc20">USDT (ERC20)</option><option value="bank">Bank Transfer</option></select></div>
          </div>
          <div><label className="text-[11px] font-bold text-white/50 uppercase">{network==='bank'?'Bank Account Details':'Wallet Address'}</label><input value={wallet} onChange={e=>setWallet(e.target.value)} placeholder={network==='bank'?'Account number':'0x... or bc1...'} className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-3 text-white outline-none font-mono text-sm" required /></div>
          {amount && Number(amount)>0 && <div className="bg-[#010214] border border-white/5 rounded-xl p-4 space-y-2 text-xs"><div className="flex justify-between"><span className="text-white/50">Amount</span><span className="text-white font-bold">${Number(amount).toFixed(2)}</span></div><div className="flex justify-between"><span className="text-white/50">Network</span><span className="text-white font-bold uppercase">{network.replace('_',' ')}</span></div><div className="flex justify-between"><span className="text-white/50">Fee</span><span className="text-white font-bold">Free</span></div><div className="h-px bg-white/5"/><div className="flex justify-between"><span className="text-white/50">You receive</span><span className="text-emerald-400 font-black">${Number(amount).toFixed(2)}</span></div></div>}
          <button disabled={processing||!amount||!wallet} className="w-full bg-gradient-to-r from-[#ef4d45] to-[#8c0030] text-white py-4 rounded-xl font-black flex items-center justify-center gap-2 disabled:opacity-50">{processing?<><Loader2 className="size-5 animate-spin"/>Processing...</>:'Submit Withdrawal Request'}</button>
        </form>
      </div>

      <div className="bg-[#05081c] border border-white/5 rounded-2xl p-6">
        <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">Withdrawal History</h3>
        {withdrawals.length ? <div className="space-y-3">{withdrawals.map(wd=> <div key={wd.id} className="bg-[#010214] border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="size-10 rounded-full bg-white/5 flex items-center justify-center"><ArrowUpCircle className="size-5 text-[#ef4d45]"/></div><div><p className="text-sm font-black text-white">${Number(wd.amount).toFixed(2)}</p><p className="text-[11px] text-white/40">{new Date(wd.created_at).toLocaleString()} • {wd.network||wd.wallet_address?.slice(0,20)}</p></div></div><div className="flex items-center gap-2"><span className="font-mono text-[11px] text-white/40 bg-white/5 px-2 py-1 rounded-full">{wd.wallet_address?.slice(0,12)}...{wd.wallet_address?.slice(-6)}</span><span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${statusColor(wd.status)}`}>{wd.status}</span></div></div>)}</div> : <p className="text-center py-8 text-white/30 text-sm">No withdrawals yet</p>}
      </div>
    </DashboardLayout>
  );
}
