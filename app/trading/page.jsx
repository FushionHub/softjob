'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import CoinChartWidget from '@/components/coin-chart-widget';
import { TrendingUp, TrendingDown, AlertTriangle, Loader2 } from 'lucide-react';
import TradingViewTicker from '@/components/tradingview-ticker';

export default function TradingPage(){
  const [user,setUser]=useState(null);
  const [asset,setAsset]=useState('BINANCE:BTCUSDT');
  const [type,setType]=useState('call');
  const [amount,setAmount]=useState('');
  const [duration,setDuration]=useState('1m');
  const [processing,setProcessing]=useState(false);
  const [msg,setMsg]=useState({type:'',text:''});
  const [trades,setTrades]=useState([]);
  const [balance,setBalance]=useState(0);
  const [loading,setLoading]=useState(true);

  const fetchData = async()=>{
    const [uR,tR]=await Promise.all([fetch('/api/user/me'), fetch('/api/trade')]);
    if(uR.ok){ const u=await uR.json(); setUser(u); setBalance(Number(u.balance||0));}
    if(tR.ok) setTrades((await tR.json()).trades||[]);
    setLoading(false);
  };
  useEffect(()=>{ fetchData(); const id=setInterval(fetchData,10000); return()=>clearInterval(id); },[]);

  const handleTrade = async(e)=>{
    e.preventDefault();
    const amt = parseFloat(amount);
    if(!amt || amt<=0){ setMsg({type:'error', text:'Enter valid amount'}); return; }
    if(amt > balance){ setMsg({type:'error', text:'Insufficient balance'}); return; }
    setProcessing(true); setMsg({type:'',text:''});
    try{
      const r=await fetch('/api/trade',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({asset: asset.replace('BINANCE:','').replace('USDT','USD'), type, amount:amt, duration})});
      const d=await r.json();
      if(r.ok){ setMsg({type:'success', text:'Trade opened! Live P&L will update. Check Profit History on close.'}); setAmount(''); fetchData(); }
      else setMsg({type:'error', text:d.error});
    }catch{ setMsg({type:'error', text:'Network error'});} finally{ setProcessing(false);}
  };

  if(loading) return <div className="min-h-screen bg-[#010214] flex items-center justify-center"><div className="size-10 border-4 border-[#ef4d45] border-t-transparent rounded-full animate-spin"/></div>;

  const mappedAsset = asset;

  return (
    <DashboardLayout title="Live Trading" user={user}>
      <div className="bg-[#05081c] border border-white/5 rounded-2xl overflow-hidden">
        <TradingViewTicker />
      </div>
      {msg.text && <div className={`p-3 rounded-xl text-xs font-bold border ${msg.type==='success'?'bg-emerald-500/10 border-emerald-500/20 text-emerald-200':'bg-red-500/10 border-red-500/20 text-red-200'}`}>{msg.text}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#05081c] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Advanced Chart • Real-Time</h3>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full font-bold">● LIVE • {balance.toFixed(2)} USD</span>
          </div>
          <CoinChartWidget symbol={mappedAsset} height={380} />
        </div>

        <div className="bg-[#05081c] border border-white/5 rounded-2xl p-5">
          <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">Place Trade</h3>
          <form onSubmit={handleTrade} className="space-y-4">
            <div><label className="text-[11px] font-bold text-white/50 uppercase">Asset</label>
              <select value={asset} onChange={e=>setAsset(e.target.value)} className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-3 text-white outline-none">
                <option value="BINANCE:BTCUSDT">BTC/USDT</option>
                <option value="BINANCE:ETHUSDT">ETH/USDT</option>
                <option value="BINANCE:SOLUSDT">SOL/USDT</option>
                <option value="BINANCE:BNBUSDT">BNB/USDT</option>
                <option value="BINANCE:XRPUSDT">XRP/USDT</option>
                <option value="BINANCE:ADAUSDT">ADA/USDT</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[11px] font-bold text-white/50 uppercase">Duration</label>
                <select value={duration} onChange={e=>setDuration(e.target.value)} className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-3 py-3 text-white outline-none">
                  <option value="1m">1 Minute</option><option value="5m">5 Minutes</option><option value="15m">15 Minutes</option><option value="1h">1 Hour</option><option value="1d">1 Day</option>
                </select>
              </div>
              <div><label className="text-[11px] font-bold text-white/50 uppercase">Amount (USD)</label>
                <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="100" className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-3 text-white outline-none" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={()=>setType('call')} className={`py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 border ${type==='call'?'bg-emerald-500 border-emerald-500 text-white':'bg-[#010214] border-white/10 text-white/60 hover:text-emerald-400'}`}><TrendingUp className="size-4"/> Call (Up)</button>
              <button type="button" onClick={()=>setType('put')} className={`py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 border ${type==='put'?'bg-red-500 border-red-500 text-white':'bg-[#010214] border-white/10 text-white/60 hover:text-red-400'}`}><TrendingDown className="size-4"/> Put (Down)</button>
            </div>
            <button disabled={processing} className="w-full bg-gradient-to-r from-[#ef4d45] to-[#8c0030] text-white py-3.5 rounded-xl font-black flex items-center justify-center gap-2 disabled:opacity-50">
              {processing ? <><Loader2 className="size-5 animate-spin"/> Opening...</> : `Open ${type.toUpperCase()} Trade`}
            </button>
            <p className="text-[11px] text-white/30 text-center">Balance: ${balance.toFixed(2)} • Trades settle automatically</p>
          </form>
        </div>
      </div>

      <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex gap-3">
        <AlertTriangle className="size-5 text-amber-400 shrink-0"/><div><p className="text-xs font-black text-amber-300 uppercase">Risk Warning</p><p className="text-xs text-amber-200/70">Trading is high-risk. Real-time prices from Binance. Only trade with funds you can afford to lose.</p></div>
      </div>

      <div className="bg-[#05081c] border border-white/5 rounded-2xl p-5">
        <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">Live Trades & History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs"><thead><tr className="border-b border-white/5 text-white/40 text-[10px] uppercase tracking-wider"><th className="text-left py-2 px-3">Date</th><th className="text-left py-2 px-3">Asset</th><th className="text-left py-2 px-3">Type</th><th className="text-left py-2 px-3">Amount</th><th className="text-left py-2 px-3">Entry</th><th className="text-left py-2 px-3">Status</th></tr></thead>
          <tbody>{trades.length ? trades.map(t=> <tr key={t.id} className="border-b border-white/5"><td className="py-3 px-3 text-white/60">{new Date(t.datetime).toLocaleString()}</td><td className="py-3 px-3 font-bold text-white">{t.asset}</td><td className="py-3 px-3"><span className={`px-2 py-1 rounded-full text-[10px] font-black ${t.type==='call'?'bg-emerald-500/10 text-emerald-400':'bg-red-500/10 text-red-400'}`}>{t.type.toUpperCase()}</span></td><td className="py-3 px-3 font-bold text-white">${Number(t.amount).toFixed(2)}</td><td className="py-3 px-3 font-mono text-white/60">${Number(t.entry_price).toFixed(2)}</td><td className="py-3 px-3"><span className={`px-2 py-1 rounded-full text-[10px] font-black ${t.status==='open'?'bg-yellow-500/10 text-yellow-400': t.status==='closed'?'bg-emerald-500/10 text-emerald-400':'bg-white/10 text-white/60'}`}>{t.status}</span></td></tr>) : <tr><td colSpan={6} className="py-8 text-center text-white/30">No trades yet - open your first real-time trade above</td></tr>}</tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
