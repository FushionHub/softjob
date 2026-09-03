'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { ArrowLeftRight, Loader2, TrendingUp, AlertTriangle, Wallet, ShieldCheck } from 'lucide-react';

const ASSETS = ['BTC','ETH','USDT','SOL','BNB','XRP','ADA','DOGE'];

function genIdempotencyKey() {
  return `swap_${Date.now()}_${Math.random().toString(36).slice(2,10)}`;
}

export default function SwapPage() {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [from, setFrom] = useState('BTC');
  const [to, setTo] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState(0);
  const [fee, setFee] = useState(0);
  const [feeUsd, setFeeUsd] = useState(0);
  const [usdValue, setUsdValue] = useState(0);
  const [toAmount, setToAmount] = useState(0);
  const [swaps, setSwaps] = useState([]);
  const [msg, setMsg] = useState({ type:'', text:'' });
  const [processing, setProcessing] = useState(false);
  const [liveRates, setLiveRates] = useState({});
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [uRes, sRes] = await Promise.all([fetch('/api/user/me'), fetch('/api/swap')]);
      if (uRes.ok) {
        const u = await uRes.json();
        setUser(u);
        setBalance(Number(u.balance||0));
      }
      if (sRes.ok) {
        const d = await sRes.json();
        setSwaps(d.swaps||[]);
        setLiveRates(d.liveRates||{});
        if (d.balance != null) setBalance(Number(d.balance||0));
        setLastUpdate(new Date());
        // also update static rates mapping for preview
      }
    } catch {}
  }, []);

  useEffect(()=>{ fetchData(); const id=setInterval(fetchData, 3000); return()=>clearInterval(id); }, [fetchData]);

  // real-time preview using liveRates
  useEffect(()=> {
    const getPrice = (asset) => {
      if (asset==='USDT' || asset==='USDC') return 1;
      return liveRates[`${asset}USDT`] || null;
    };
    let r = 1;
    const fromPrice = getPrice(from);
    const toPrice = getPrice(to);
    if (fromPrice && toPrice) r = fromPrice / toPrice;
    else {
      // fallback static via USDT
      const map = { BTC_USDT: liveRates.BTCUSDT||67000, ETH_USDT: liveRates.ETHUSDT||3500, SOL_USDT: liveRates.SOLUSDT||149, BNB_USDT: liveRates.BNBUSDT||600, XRP_USDT: liveRates.XRPUSDT||0.6, ADA_USDT: liveRates.ADAUSDT||0.45, DOGE_USDT: liveRates.DOGEUSDT||0.12 };
      const get = (a) => map[`${a}_USDT`] || 1;
      if (from==='USDT') r = 1 / (get(to));
      else if (to==='USDT') r = get(from);
      else r = get(from)/get(to);
      if (!fromPrice || !toPrice) r = r || 1;
    }
    const amt = parseFloat(amount||0);
    const f = amt*0.005;
    const usd = from === 'USDT' ? amt : (getPrice(from) ? amt * getPrice(from) : amt*1000);
    const fUsd = from === 'USDT' ? f : (getPrice(from) ? f * getPrice(from) : f*1000);
    setRate(r); setFee(f); setFeeUsd(fUsd); setUsdValue(usd); setToAmount((amt-f)*r);
  }, [from,to,amount,liveRates]);

  const flip = ()=> { setFrom(to); setTo(from); };

  const insufficient = usdValue > balance && usdValue > 0;
  const canSwap = amount && parseFloat(amount)>0 && !insufficient && from!==to && !processing;

  const handleSwap = async (e)=> {
    e.preventDefault();
    if (!amount || parseFloat(amount)<=0) { setMsg({type:'error', text:'Enter amount'}); return; }
    if (from===to) { setMsg({type:'error', text:'Cannot swap same asset'}); return; }
    if (insufficient) { setMsg({type:'error', text:`Insufficient balance. Need $${usdValue.toFixed(2)} but you have $${balance.toFixed(2)}.`}); return; }
    const key = genIdempotencyKey();
    setProcessing(true); setMsg({type:'',text:''});
    try {
      const r = await fetch('/api/swap', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ fromAsset: from, toAsset: to, fromAmount: parseFloat(amount), idempotencyKey: key }) });
      const d = await r.json();
      if (r.ok) {
        if (d.duplicate) setMsg({type:'info', text: d.message || 'Duplicate prevented — this swap was already processed.'});
        else setMsg({type:'success', text: d.message + (d.feeUsd ? ` Fee $${Number(d.feeUsd).toFixed(2)} deducted.` : '') + ' Email confirmation sent.'});
        setAmount('');
        fetchData();
      } else {
        if (r.status===409) setMsg({type:'error', text: d.error || 'Duplicate transaction — please wait before retrying.'});
        else setMsg({type:'error', text: d.error || 'Swap failed'});
      }
    } catch { setMsg({type:'error', text:'Network error'}); } finally { setProcessing(false); }
  };

  return (
    <DashboardLayout title="Swap" user={user}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/40">Live rates every 3s • Balance ${balance.toFixed(2)} • Fee 0.5% • Email on every swap • {lastUpdate ? `Updated ${lastUpdate.toLocaleTimeString()}` : ''}</p>
        {insufficient && <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full font-bold flex items-center gap-1"><AlertTriangle className="size-3"/> Insufficient</span>}
      </div>

      {msg.text && <div className={`p-3 rounded-xl text-xs font-bold border flex items-start gap-2 ${msg.type==='success'?'bg-emerald-500/10 border-emerald-500/20 text-emerald-200': msg.type==='info'?'bg-blue-500/10 border-blue-500/20 text-blue-200':'bg-red-500/10 border-red-500/20 text-red-200'}`}>{msg.text.includes('Insufficient') ? <AlertTriangle className="size-4 shrink-0"/> : <ShieldCheck className="size-4 shrink-0"/>}<span>{msg.text}</span></div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#05081c] border border-white/5 rounded-2xl p-6">
          <h2 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2"><ArrowLeftRight className="size-4 text-[#ef4d45]" /> Real-Time Swap • Live Bachs-grade</h2>

          {balance === 0 && <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-200 flex gap-2 mb-4"><AlertTriangle className="size-4 shrink-0"/> No balance — deposit via Bachs (card/crypto) first. Swap is disabled until you have funds.</div>}

          <form onSubmit={handleSwap} className="space-y-4">
            <div className="bg-[#010214] border border-white/5 rounded-2xl p-4">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-white/50 uppercase">From</label>
                <span className="text-[11px] text-white/30">≈ ${usdValue ? usdValue.toFixed(2) : '0.00'} USD • Fee ${feeUsd.toFixed(2)}</span>
              </div>
              <div className="flex gap-3 mt-2">
                <select value={from} onChange={e=>setFrom(e.target.value)} className="bg-[#05081c] border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none flex-1">
                  {ASSETS.map(a=> <option key={a} value={a}>{a}</option>)}
                </select>
                <input type="number" step="0.000001" min="0" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" className={`flex-1 bg-[#05081c] border rounded-xl px-4 py-3 text-white outline-none font-mono ${insufficient ? 'border-red-500/50' : 'border-white/10'}`} required />
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-[11px] text-white/30">Balance: ${balance.toFixed(2)} • {insufficient ? <span className="text-red-400 font-bold">Insufficient for this swap</span> : <span className="text-emerald-400">Sufficient</span>}</p>
                <button type="button" onClick={()=> setAmount(balance > 0 ? (from==='USDT' ? String(Math.min(balance*0.99, balance-0.01).toFixed(2)) : String(((balance/ (liveRates[`${from}USDT`]||1000))*0.99).toFixed(6))) : '')} className="text-[11px] bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 rounded-full text-white font-bold">MAX</button>
              </div>
            </div>

            <div className="flex justify-center -my-2 relative z-10">
              <button type="button" onClick={flip} className="size-10 rounded-full bg-[#ef4d45] hover:bg-[#d03d35] text-white flex items-center justify-center shadow-lg border-4 border-[#05081c]">
                <ArrowLeftRight className="size-4 rotate-90" />
              </button>
            </div>

            <div className="bg-[#010214] border border-white/5 rounded-2xl p-4">
              <label className="text-[11px] font-bold text-white/50 uppercase">To (live estimate)</label>
              <div className="flex gap-3 mt-2">
                <select value={to} onChange={e=>setTo(e.target.value)} className="bg-[#05081c] border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none flex-1">
                  {ASSETS.map(a=> <option key={a} value={a}>{a}</option>)}
                </select>
                <div className="flex-1 bg-[#05081c] border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm flex items-center">{toAmount ? toAmount.toFixed(6) : '0.00'} <span className="ml-2 text-white/40 text-xs">{to}</span></div>
              </div>
              <p className="text-[11px] text-white/30 mt-2">Live rate {rate ? `1 ${from} ≈ ${rate.toFixed(6)} ${to}` : '—'} • Updates every 3s from Binance</p>
            </div>

            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-white/50">USD Value</span><span className="text-white font-mono font-bold">${usdValue.toFixed(2)} {insufficient ? '(exceeds balance)' : ''}</span></div>
              <div className="flex justify-between"><span className="text-white/50">Rate (live)</span><span className="text-white font-mono font-bold">1 {from} ≈ {rate.toFixed(6)} {to}</span></div>
              <div className="flex justify-between"><span className="text-white/50">Fee (0.5%)</span><span className="text-white font-mono">{fee.toFixed(6)} {from} ≈ ${feeUsd.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-white/50">You receive</span><span className="text-[#ef4d45] font-black font-mono">{toAmount.toFixed(6)} {to}</span></div>
              <div className="flex justify-between"><span className="text-white/50">Balance after</span><span className={`font-mono font-bold ${balance - feeUsd < 0 ? 'text-red-400' : 'text-emerald-400'}`}>${(balance - feeUsd).toFixed(2)}</span></div>
            </div>

            <button disabled={!canSwap} className={`w-full py-3.5 rounded-xl font-black flex items-center justify-center gap-2 border ${!canSwap ? 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed' : 'bg-gradient-to-r from-[#ef4d45] to-[#8c0030] border-transparent text-white hover:from-[#ff5a4d] hover:to-[#a00035]'}`}>
              {processing ? <><Loader2 className="size-5 animate-spin" />Swapping live...</> : insufficient ? 'Insufficient Balance' : balance===0 ? 'Deposit Required' : `Swap ${from} → ${to} • Live`}
            </button>
            <p className="text-[11px] text-white/30 text-center flex items-center justify-center gap-1"><Wallet className="size-3"/> Every swap sends instant email + notification • Idempotency prevents double-spend • Failed swaps are marked failed and can be retried</p>
          </form>
        </div>

        <div className="bg-[#05081c] border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2"><TrendingUp className="size-4 text-emerald-400" /> Live Rates (Binance 3s)</h3>
          <div className="space-y-2 text-xs">
            {Object.entries(liveRates).length ? Object.entries(liveRates).map(([k,v])=> <div key={k} className="flex justify-between bg-[#010214] border border-white/5 rounded-xl p-3"><span className="text-white/60 font-bold">{k}</span><span className="text-white font-mono font-bold">${Number(v).toLocaleString()}</span></div>) : <p className="text-white/30 text-center py-6">Loading live prices...</p>}
          </div>
          <div className="mt-6">
            <h4 className="text-xs font-black text-white uppercase tracking-wider mb-3">Recent Swaps • Live History</h4>
            {swaps.length ? <div className="space-y-2 max-h-[320px] overflow-auto pr-1">{swaps.slice(0,12).map(s=> <div key={s.id} className={`bg-[#010214] border rounded-xl p-3 flex justify-between text-xs ${s.status==='failed' ? 'border-red-500/20' : 'border-white/5'}`}><span className="text-white font-bold">{Number(s.from_amount).toFixed(4)} {s.from_asset} → {Number(s.to_amount).toFixed(4)} {s.to_asset} <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] ${s.status==='failed' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>{s.status}</span></span><span className="text-white/40">{new Date(s.created_at).toLocaleString()}</span></div>)}</div> : <p className="text-xs text-white/30 text-center py-4">No swaps yet — real swaps email instantly</p>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
