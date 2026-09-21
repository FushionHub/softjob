'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard-layout';
import { Check, Loader2, AlertTriangle, Wallet, CreditCard, Coins, TrendingUp, TrendingDown, Search, Info, ArrowRight, RefreshCw, Copy, ExternalLink } from 'lucide-react';

const AMOUNT_SUGGESTIONS = [100, 250, 500, 1000, 2500, 5000, 10000, 25000];

export default function DepositPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [amount, setAmount] = useState('');
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [prices, setPrices] = useState({});
  const [changes, setChanges] = useState({});
  const [processing, setProcessing] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [deposits, setDeposits] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [bachsCfg, setBachsCfg] = useState({ configured: false, mode: 'not-configured' });
  const [depositMode, setDepositMode] = useState('crypto');
  const [copiedAddr, setCopiedAddr] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [searchCoin, setSearchCoin] = useState('');

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch('/api/prices', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.prices) {
          setPrices(data.prices);
          setChanges(data.changes || {});
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [uRes, dRes, bRes, wRes] = await Promise.all([
          fetch('/api/user/me'),
          fetch('/api/deposit'),
          fetch('/api/bachs/config'),
          fetch('/api/wallets'),
        ]);
        if (uRes.status === 401) { router.push('/login'); return; }
        if (uRes.ok) setUser(await uRes.json());
        if (dRes.ok) setDeposits((await dRes.json()).deposits || []);
        if (bRes.ok) setBachsCfg(await bRes.json());
        if (wRes.ok) {
          const wData = await wRes.json();
          setWallets(wData.wallets || []);
          if (wData.wallets?.length) setSelectedCoin(wData.wallets[0]);
        }
      } finally { setLoading(false); }
    })();
    fetchPrices();
    const id = setInterval(fetchPrices, 5000);
    return () => clearInterval(id);
  }, [router, fetchPrices]);

  useEffect(() => {
    if (!selectedCoin) return;
    const price = prices[selectedCoin.id + 'USDT'];
    const amt = parseFloat(amount);
    if (price && amt) setCryptoAmount((amt / price).toFixed(6));
    else setCryptoAmount('');
  }, [amount, selectedCoin, prices]);

  const copyAddress = (addr) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddr(addr);
    setTimeout(() => setCopiedAddr(''), 2000);
  };

  const filteredWallets = wallets.filter(w =>
    w.name.toLowerCase().includes(searchCoin.toLowerCase()) || w.id.toLowerCase().includes(searchCoin.toLowerCase())
  );

  const handleBachsDeposit = async (e) => {
    e.preventDefault();
    if (!amount) { setMsg({ type: 'error', text: 'Enter an amount.' }); return; }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 10) { setMsg({ type: 'error', text: 'Minimum deposit is $10.' }); return; }
    setProcessing(true); setMsg({ type: '', text: '' });
    try {
      const res = await fetch('/api/bachs/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amt,
          paymentMethod: 'bachs-hosted',
          currency: 'USD',
          coin: selectedCoin?.id || 'USDT',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const detail = data.details?.errors ? ` — ${data.details.errors.map(er=>`${er.field}: ${er.message}`).join(', ')}` : data.details ? ` — ${JSON.stringify(data.details).slice(0,300)}` : '';
        setMsg({ type: 'error', text: (data.error || 'Failed to create live checkout.') + detail });
        return;
      }
      window.location.href = data.checkout_url;
    } catch (err) {
      setMsg({ type: 'error', text: 'Network error. Try again.' });
    } finally { setProcessing(false); }
  };

  if (loading) return <div className="min-h-screen bg-[#010214] flex items-center justify-center"><div className="size-10 border-4 border-[#ef4d45] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <DashboardLayout title="Deposit" user={user}>

      {/* Top header */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0a0e2a] via-[#101642] to-[#1a0b2e] border border-white/10 p-6 md:p-8">
        <div className="absolute -top-24 -right-24 size-96 bg-[#ef4d45]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 size-96 bg-[#627eea]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-2 space-y-3">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs font-bold">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" /> Live Prices • Powered by Binance
              <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-black ${bachsCfg.configured ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>{bachsCfg.configured ? 'Bachs LIVE ✓' : 'Bachs NOT CONFIGURED'}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">Deposit <span className="bg-gradient-to-r from-[#ef4d45] to-[#ff8a5b] bg-clip-text text-transparent">Crypto</span> Instantly</h1>
            <p className="text-sm text-white/60 max-w-2xl">Send crypto directly to your wallet address below. Once we detect your deposit on the blockchain, your balance is credited in real time. You can also pay with card via Bachs.io.</p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-white/70 flex items-center gap-2"><Wallet className="size-3.5"/> Direct Crypto Deposit</span>
              <span className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-white/70 flex items-center gap-2"><CreditCard className="size-3.5"/> Card via Bachs.io</span>
            </div>
          </div>
          <div className="bg-white/[0.04] backdrop-blur border border-white/10 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between"><p className="text-xs font-black uppercase tracking-widest text-white/40">Your Wallet</p><span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full font-bold flex items-center gap-1"><span className="size-1.5 rounded-full bg-emerald-400 animate-pulse"/> Live</span></div>
            <div>
              <p className="text-xs text-white/50">Available Balance</p>
              <p suppressHydrationWarning className="text-3xl font-black text-white">${Number(user?.balance||0).toLocaleString(undefined,{minimumFractionDigits:2})}</p>
              <p suppressHydrationWarning className="text-xs text-white/30 mt-1">Deposits pending: {deposits.filter(d=>d.status==='pending').length} • Approved: {deposits.filter(d=>d.status==='approved').length}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/5 rounded-xl p-3 border border-white/5"><p className="text-white/40 text-[11px] uppercase font-bold">Total Deposit</p><p className="text-white font-black">${Number(user?.total_deposit||0).toFixed(2)}</p></div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/5"><p className="text-white/40 text-[11px] uppercase font-bold">Referral Code</p><p className="text-white font-mono font-bold text-xs">{user?.referral_code||user?.username}</p></div>
            </div>
          </div>
        </div>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-start gap-3 ${msg.type==='success'?'bg-emerald-500/10 border-emerald-500/20 text-emerald-200': msg.type==='info'?'bg-blue-500/10 border-blue-500/20 text-blue-200':'bg-red-500/10 border-red-500/20 text-red-200'}`}>
          {msg.type==='success' ? <Check className="size-4 shrink-0 mt-0.5"/> : msg.type==='info' ? <Info className="size-4 shrink-0 mt-0.5"/> : <AlertTriangle className="size-4 shrink-0 mt-0.5"/>}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Deposit mode tabs */}
      <div className="flex gap-2">
        <button onClick={() => setDepositMode('crypto')} className={`px-5 py-3 rounded-xl text-xs font-black border transition-all ${depositMode === 'crypto' ? 'bg-[#ef4d45] border-[#ef4d45] text-white shadow-lg shadow-[#ef4d45]/20' : 'bg-white/5 border-white/10 text-white/70 hover:border-[#ef4d45]/50'}`}>
          <Wallet className="size-3.5 inline mr-2"/> Direct Crypto
        </button>
        <button onClick={() => setDepositMode('bachs')} className={`px-5 py-3 rounded-xl text-xs font-black border transition-all ${depositMode === 'bachs' ? 'bg-[#ef4d45] border-[#ef4d45] text-white shadow-lg shadow-[#ef4d45]/20' : 'bg-white/5 border-white/10 text-white/70 hover:border-[#ef4d45]/50'}`}>
          <CreditCard className="size-3.5 inline mr-2"/> Card / Bachs.io
        </button>
      </div>

      {depositMode === 'crypto' ? (
        <>
          {/* Live coin strip */}
          <div className="bg-[#05081c] border border-white/5 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3 gap-3">
              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2"><Coins className="size-4 text-[#ef4d45]"/> Select Deposit Coin</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-white/40"/>
                  <input value={searchCoin} onChange={e=>setSearchCoin(e.target.value)} placeholder="Search coin..." autoComplete="off" className="pl-8 pr-3 py-2 bg-[#010214] border border-white/10 rounded-full text-xs text-white placeholder:text-white/30 outline-none focus:border-[#ef4d45] w-36 md:w-48"/>
                </div>
                <button onClick={fetchPrices} className="size-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:border-[#ef4d45]"><RefreshCw className="size-3.5 text-white/60"/></button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {filteredWallets.map(wallet => {
                const price = prices[wallet.id + 'USDT'];
                const change = changes[wallet.id + 'USDT'];
                const isSelected = selectedCoin?.id === wallet.id;
                const up = (change || 0) >= 0;
                return (
                  <button
                    key={wallet.id}
                    onClick={() => setSelectedCoin(wallet)}
                    className={`text-left p-4 rounded-2xl border-2 transition-all relative overflow-hidden group ${isSelected ? 'border-[#ef4d45] bg-gradient-to-br from-[#ef4d45]/15 to-[#8c0030]/15 shadow-lg shadow-[#ef4d45]/10' : 'border-white/5 bg-[#010214] hover:border-white/10 hover:bg-white/[0.02]'}`}
                  >
                    {isSelected && <div className="absolute top-2 right-2 size-5 rounded-full bg-[#ef4d45] flex items-center justify-center"><Check className="size-3 text-white"/></div>}
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0" style={{background: `${wallet.color}20`, border: `1px solid ${wallet.color}40`, color: wallet.color}}>{wallet.icon}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-white leading-none">{wallet.id}</p>
                        <p className="text-[11px] text-white/50 truncate">{wallet.name} • {wallet.network}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm font-black text-white font-mono">{price ? `$${Number(price).toLocaleString(undefined,{minimumFractionDigits: price<1?4:2, maximumFractionDigits: price<1?4:2})}` : '—'}</p>
                      <div className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full mt-1 ${up ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {up ? <TrendingUp className="size-3"/> : <TrendingDown className="size-3"/>}{change != null ? `${Math.abs(change).toFixed(2)}%` : '—'} <span className="text-[11px] opacity-60">24h</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-white/30 mt-3 flex items-center gap-1"><Info className="size-3"/> Prices live from Binance every 5s. Select a coin to see your deposit address below.</p>
          </div>

          {/* Wallet address display */}
          {selectedCoin && (
            <div className="bg-[#05081c] border border-white/5 rounded-2xl p-6">
              <div className="bg-[#010214] border border-white/10 rounded-[1.5rem] p-6 space-y-5 shadow-2xl">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="size-8 rounded-lg flex items-center justify-center text-xs font-black" style={{background: `${selectedCoin.color}20`, border: `1px solid ${selectedCoin.color}40`, color: selectedCoin.color}}>{selectedCoin.icon}</span>
                    {selectedCoin.name} Deposit Address
                  </h3>
                  <span className="text-[11px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full px-3 py-1.5">Live • {selectedCoin.network}</span>
                </div>

                <div className="bg-[#0a0e2a] border border-white/10 rounded-2xl p-5 space-y-4">
                  <div>
                    <label className="text-[11px] font-black text-white/50 uppercase tracking-wider">Send Only {selectedCoin.id} ({selectedCoin.network}) to This Address</label>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-[#05081c] border border-white/10 rounded-xl px-4 py-3 font-mono text-sm text-white break-all select-all">
                        {selectedCoin.address}
                      </div>
                      <button onClick={() => copyAddress(selectedCoin.address)} className="shrink-0 size-10 rounded-xl bg-[#ef4d45] hover:bg-[#ff5a4a] flex items-center justify-center transition-colors">
                        {copiedAddr === selectedCoin.address ? <Check className="size-4 text-white"/> : <Copy className="size-4 text-white"/>}
                      </button>
                    </div>
                    {copiedAddr === selectedCoin.address && <p className="text-xs text-emerald-400 mt-1 font-bold">Copied to clipboard!</p>}
                  </div>

                  {/* QR Code */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="bg-white p-3 rounded-2xl">
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selectedCoin.address)}`} alt={`${selectedCoin.id} QR Code`} width={200} height={200} className="rounded-lg" />
                    </div>
                    <p className="text-[11px] text-white/40 text-center">Scan QR code with your wallet app</p>
                  </div>
                </div>

                <div className="bg-[#0a0e2a] border border-amber-500/20 rounded-2xl p-4 flex gap-3">
                  <div className="size-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0"><AlertTriangle className="size-4 text-amber-400"/></div>
                  <div className="text-xs leading-relaxed text-white/60">
                    <p className="font-black text-white text-sm">Important Instructions</p>
                    <ul className="mt-1 space-y-1 list-disc list-inside">
                      <li>Send <b className="text-white">only {selectedCoin.id}</b> ({selectedCoin.network}) to this address</li>
                      <li>Sending any other asset may result in <b className="text-white">permanent loss</b></li>
                      <li>Deposits are credited after network confirmation (typically 1-15 minutes)</li>
                      <li>Minimum deposit: $10 equivalent</li>
                      <li>Your balance updates in real time once confirmed</li>
                    </ul>
                    <p className="mt-2 text-[11px] text-white/40">Need help? <a href="/support" className="underline hover:text-white">Contact Support</a></p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Amount input for reference */}
          <div className="bg-[#05081c] border border-white/5 rounded-2xl p-6">
            <div className="bg-[#010214] border border-white/10 rounded-[1.5rem] p-6 space-y-5 shadow-2xl">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Expected Deposit Amount (Optional)</h3>
              <div>
                <label className="text-[11px] font-black text-white/50 uppercase tracking-wider">Amount (USD) — for your reference only</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
                  <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} min="10" placeholder="Enter amount e.g. 500" autoComplete="amount" inputMode="decimal" className="w-full bg-[#05081c] border border-white/10 rounded-xl pl-8 pr-4 py-3.5 text-white outline-none focus:border-[#ef4d45] focus:ring-1 focus:ring-[#ef4d45]/20 font-mono font-bold text-lg" />
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {AMOUNT_SUGGESTIONS.map(val => (
                    <button key={val} type="button" onClick={()=>setAmount(String(val))} className={`px-4 py-2 rounded-full text-xs font-black border transition-all ${amount===String(val) ? 'bg-[#ef4d45] border-[#ef4d45] text-white shadow' : 'bg-white/5 border-white/10 text-white/70 hover:border-[#ef4d45]/50 hover:text-white'}`}>
                      ${val.toLocaleString()}
                    </button>
                  ))}
                </div>
                {amount && cryptoAmount && selectedCoin && (
                  <p className="text-xs text-white/40 mt-2 font-mono">≈ {cryptoAmount} {selectedCoin.id} @ ${prices[selectedCoin.id + 'USDT']?.toLocaleString() || '—'} / {selectedCoin.id}</p>
                )}
              </div>
              <p className="text-[11px] text-white/40">This amount is for your reference. Send any amount of {selectedCoin?.id || 'crypto'} to the address above — we credit what we receive.</p>
            </div>
          </div>
        </>
      ) : (
        /* Bachs.io alternative deposit */
        <div className="bg-[#05081c] border border-white/5 rounded-2xl p-6">
          <form onSubmit={handleBachsDeposit} className="bg-[#010214] border border-white/10 rounded-[1.5rem] p-6 space-y-5 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Deposit via Bachs.io</h3>
              <span className="text-[11px] font-bold bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-white/60">Card • Mobile Money • Bank</span>
            </div>

            <div>
              <label className="text-[11px] font-black text-white/50 uppercase tracking-wider">Amount (USD)</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
                <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} min="10" placeholder="Enter amount e.g. 500" autoComplete="amount" inputMode="decimal" className="w-full bg-[#05081c] border border-white/10 rounded-xl pl-8 pr-4 py-3.5 text-white outline-none focus:border-[#ef4d45] focus:ring-1 focus:ring-[#ef4d45]/20 font-mono font-bold text-lg" required />
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {AMOUNT_SUGGESTIONS.map(val => (
                  <button key={val} type="button" onClick={()=>setAmount(String(val))} className={`px-4 py-2 rounded-full text-xs font-black border transition-all ${amount===String(val) ? 'bg-[#ef4d45] border-[#ef4d45] text-white shadow' : 'bg-white/5 border-white/10 text-white/70 hover:border-[#ef4d45]/50 hover:text-white'}`}>
                    ${val.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-black text-white/50 uppercase tracking-wider">Payment Coin / Rail</label>
              <div className="mt-1 w-full bg-[#05081c] border border-white/10 rounded-xl px-4 py-3 text-white flex items-center gap-3">
                <span className="size-8 rounded-lg flex items-center justify-center text-xs font-black" style={{background: `${selectedCoin?.color || '#26a17b'}20`, border: `1px solid ${selectedCoin?.color || '#26a17b'}40`, color: selectedCoin?.color || '#26a17b'}}>{selectedCoin?.icon || '$'}</span>
                <div>
                  <p className="text-sm font-black leading-none">{selectedCoin?.id || 'USDT'} • {selectedCoin?.name || 'Tether'}</p>
                  <p className="text-[11px] text-white/40">{selectedCoin?.network || 'TRC20'} • Will show in live Bachs as preferred crypto</p>
                </div>
                <span className="ml-auto text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-full font-bold">Live via Bachs</span>
              </div>
            </div>

            {amount && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-[11px] font-black uppercase tracking-wider text-white/50">You Pay</p>
                  <p className="text-2xl font-black text-white">${Number(amount).toLocaleString(undefined,{minimumFractionDigits:2})}</p>
                  <p className="text-[11px] text-white/40">USD • Card or Crypto</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-[11px] font-black uppercase tracking-wider text-white/50">You Receive</p>
                  <p className="text-lg font-black text-white font-mono">{cryptoAmount || '—'} {selectedCoin?.id || 'USDT'}</p>
                  <p className="text-[11px] text-white/40">Approx. at current price</p>
                </div>
              </div>
            )}

            <button disabled={processing} className="w-full bg-gradient-to-r from-[#ef4d45] to-[#8c0030] hover:from-[#ff5a4a] hover:to-[#a60039] text-white py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#ef4d45]/20 disabled:opacity-50 transition-all">
              {processing ? <><Loader2 className="size-5 animate-spin"/> Processing...</> : <>Pay with Card / Mobile Money <ArrowRight className="size-4"/></>}
            </button>
            {!bachsCfg.configured && <p className="text-center text-xs text-amber-300 flex items-center justify-center gap-1"><AlertTriangle className="size-3"/> Live key not set — set <span className="font-mono">BACHS_API_KEY=sk_live_...</span> in .env to enable real payments.</p>}
            <p className="text-center text-[11px] text-white/30">Payments processed via Bachs.io. Funds credited after live webhook confirmation.</p>
          </form>
        </div>
      )}

      {/* Risk Disclaimer */}
      <div className="bg-[#05081c] border border-white/5 rounded-2xl p-4 flex gap-3">
        <div className="size-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0"><AlertTriangle className="size-4 text-amber-400"/></div>
        <div className="text-xs leading-relaxed text-white/60">
          <p className="font-black text-white text-sm">Emporium Capitals — Deposits & Risk Disclaimer</p>
          <p>Deposits credit your <b className="text-white">Emporium investment wallet</b> and are allocated at your direction on the <b className="text-white">Re-Invest</b> page to active plans. Returns shown per plan are <b className="text-white">projections, not guarantees</b> — all trading/investment carries risk and capital can be lost. Only deposit what you can afford to risk. This is not financial advice. By depositing you agree to our <a href="/terms" target="_blank" className="underline hover:text-white">Terms</a> and <a href="/privacy" target="_blank" className="underline hover:text-white">Privacy Policy</a>.</p>
        </div>
      </div>

      {/* Recent Deposits */}
      <div className="bg-[#05081c] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-white uppercase tracking-wider">Recent Deposits</h3>
          <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded-full border border-white/10">{deposits.length} total</span>
        </div>
        {deposits.length ? (
          <div className="space-y-2">
            {deposits.slice(0,8).map(d=> (
              <div key={d.id} className="bg-[#010214] border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center"><Wallet className="size-4 text-white/60"/></div>
                  <div>
                    <p className="text-sm font-black text-white">${Number(d.amount).toFixed(2)} <span className="text-white/40 font-normal">• {d.payment}</span></p>
                    <p suppressHydrationWarning className="text-[11px] text-white/30 font-mono">{d.reference} • {new Date(d.date).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-black px-3 py-1 rounded-full border ${d.status==='approved'?'bg-emerald-500/10 text-emerald-400 border-emerald-500/20': d.status==='pending'?'bg-yellow-500/10 text-yellow-400 border-yellow-500/20':'bg-red-500/10 text-red-400 border-red-500/20'}`}>{d.status.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : <div className="text-center py-10"><div className="size-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mx-auto mb-3"><Wallet className="size-6 text-white/20"/></div><p className="text-sm font-bold text-white/40">No deposits yet</p><p className="text-xs text-white/30">Select a coin above and send crypto to your deposit address.</p></div>}
      </div>
    </DashboardLayout>
  );
}
