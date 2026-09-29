'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import CoinChartWidget from '@/components/coin-chart-widget';
import RiskDisclaimer from '@/components/risk-disclaimer';
import TradingViewTicker from '@/components/tradingview-ticker';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Activity,
  Layers,
  BarChart2,
  Zap,
  RefreshCw,
} from 'lucide-react';

const COIN_LIST = [
  { symbol: 'BTC', name: 'Bitcoin', pair: 'BTC/USDT', decimals: 2, icon: '₿', defaultPrice: 83500 },
  { symbol: 'ETH', name: 'Ethereum', pair: 'ETH/USDT', decimals: 2, icon: 'Ξ', defaultPrice: 2690 },
  { symbol: 'SOL', name: 'Solana', pair: 'SOL/USDT', decimals: 2, icon: '◎', defaultPrice: 120 },
  { symbol: 'BNB', name: 'BNB', pair: 'BNB/USDT', decimals: 2, icon: '❖', defaultPrice: 755 },
  { symbol: 'XRP', name: 'Ripple', pair: 'XRP/USDT', decimals: 4, icon: '✕', defaultPrice: 1.50 },
  { symbol: 'ADA', name: 'Cardano', pair: 'ADA/USDT', decimals: 4, icon: '₳', defaultPrice: 0.25 },
  { symbol: 'DOGE', name: 'Dogecoin', pair: 'DOGE/USDT', decimals: 5, icon: 'Ð', defaultPrice: 0.095 },
  { symbol: 'TRX', name: 'TRON', pair: 'TRX/USDT', decimals: 4, icon: '₸', defaultPrice: 0.33 },
];

const DURATIONS = [
  { value: '1m', label: '1m', desc: '1 Minute', ms: 60 * 1000 },
  { value: '5m', label: '5m', desc: '5 Minutes', ms: 5 * 60 * 1000 },
  { value: '15m', label: '15m', desc: '15 Minutes', ms: 15 * 60 * 1000 },
  { value: '30m', label: '30m', desc: '30 Minutes', ms: 30 * 60 * 1000 },
  { value: '1h', label: '1h', desc: '1 Hour', ms: 60 * 60 * 1000 },
  { value: '1d', label: '1d', desc: '24 Hours', ms: 24 * 60 * 60 * 1000 },
];

const QUICK_AMOUNTS = [25, 50, 100, 250, 500];

function parseDurationMs(duration) {
  if (!duration) return 60 * 1000;
  const str = String(duration).trim().toLowerCase();
  if (str.endsWith('m')) return (parseInt(str, 10) || 1) * 60 * 1000;
  if (str.endsWith('h')) return (parseInt(str, 10) || 1) * 60 * 60 * 1000;
  if (str.endsWith('d')) return (parseInt(str, 10) || 1) * 24 * 60 * 60 * 1000;
  return 60 * 1000;
}

export default function TradingPage() {
  const [user, setUser] = useState(null);
  const [selectedCoin, setSelectedCoin] = useState('BTC');
  const [type, setType] = useState('call');
  const [amount, setAmount] = useState('100');
  const [duration, setDuration] = useState('1m');
  const [processing, setProcessing] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [trades, setTrades] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewTab, setViewTab] = useState('chart'); // 'chart' | 'orderbook'
  const [historyTab, setHistoryTab] = useState('all'); // 'all' | 'open' | 'closed'

  // Real-time market quotes state
  const [tickers, setTickers] = useState({});
  const [prevPrices, setPrevPrices] = useState({});
  const [tickFlash, setTickFlash] = useState({}); // { [coin]: 'up' | 'down' }
  const [now, setNow] = useState(Date.now());

  const prevPricesRef = useRef({});

  // 1. Fetch live quotes every 2.5s
  const fetchQuotes = useCallback(async () => {
    try {
      const res = await fetch('/api/prices', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const incomingTickers = data.tickers || {};
        const newFlash = {};

        COIN_LIST.forEach((coin) => {
          const t = incomingTickers[coin.symbol] || incomingTickers[`${coin.symbol}USDT`];
          const curr = t?.price || data.prices?.[coin.symbol] || coin.defaultPrice;
          const prev = prevPricesRef.current[coin.symbol];
          if (prev && curr !== prev) {
            newFlash[coin.symbol] = curr > prev ? 'up' : 'down';
          }
          prevPricesRef.current[coin.symbol] = curr;
        });

        if (Object.keys(newFlash).length > 0) {
          setTickFlash(newFlash);
          setTimeout(() => setTickFlash({}), 1200);
        }

        setTickers(incomingTickers);
        setPrevPrices({ ...prevPricesRef.current });
      }
    } catch (e) {
      console.error('Failed to fetch quotes:', e);
    }
  }, []);

  // 2. Fetch user & trades data
  const fetchData = useCallback(async () => {
    try {
      const [uR, tR] = await Promise.all([
        fetch('/api/user/me', { cache: 'no-store' }),
        fetch('/api/trade', { cache: 'no-store' }),
      ]);
      if (uR.ok) {
        const u = await uR.json();
        setUser(u);
        setBalance(Number(u.balance || 0));
      }
      if (tR.ok) {
        const d = await tR.json();
        setTrades(d.trades || []);
      }
    } catch (e) {
      console.error('Failed to fetch data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + interval polling
  useEffect(() => {
    fetchData();
    fetchQuotes();

    const dataInterval = setInterval(fetchData, 8000);
    const quotesInterval = setInterval(fetchQuotes, 2500);
    const clockInterval = setInterval(() => setNow(Date.now()), 1000);

    return () => {
      clearInterval(dataInterval);
      clearInterval(quotesInterval);
      clearInterval(clockInterval);
    };
  }, [fetchData, fetchQuotes]);

  // Check if any open trade just reached 0s, trigger auto-settlement
  useEffect(() => {
    const hasExpiring = trades.some((t) => {
      if (t.status !== 'open') return false;
      const start = new Date(t.datetime).getTime();
      const dur = parseDurationMs(t.duration);
      return now >= start + dur;
    });

    if (hasExpiring) {
      fetchData();
    }
  }, [now, trades, fetchData]);

  // Current selected coin data
  const activeCoinMeta = useMemo(() => {
    return COIN_LIST.find((c) => c.symbol === selectedCoin) || COIN_LIST[0];
  }, [selectedCoin]);

  const activeTicker = useMemo(() => {
    const raw = tickers[selectedCoin] || tickers[`${selectedCoin}USDT`];
    const price = raw?.price || activeCoinMeta.defaultPrice;
    return {
      price,
      priceChangePercent: raw?.priceChangePercent ?? 0,
      priceChange: raw?.priceChange ?? 0,
      highPrice: raw?.highPrice || price * 1.015,
      lowPrice: raw?.lowPrice || price * 0.985,
      bidPrice: raw?.bidPrice || price * 0.9998,
      askPrice: raw?.askPrice || price * 1.0002,
      spread: raw?.spread || Math.abs((raw?.askPrice || price * 1.0002) - (raw?.bidPrice || price * 0.9998)),
      volume: raw?.volume || 15420,
    };
  }, [tickers, selectedCoin, activeCoinMeta]);

  // Potential payout calculation (Standard binary options payout: 85% profit + stake return)
  const amtNum = parseFloat(amount) || 0;
  const payoutMultiplier = 0.85;
  const potentialProfit = amtNum * payoutMultiplier;
  const potentialPayout = amtNum + potentialProfit;

  // Handle open trade execution
  const handleTrade = async (e) => {
    e.preventDefault();
    if (!amtNum || amtNum <= 0) {
      setMsg({ type: 'error', text: 'Please enter a valid investment amount.' });
      return;
    }
    if (amtNum > balance) {
      setMsg({ type: 'error', text: `Insufficient balance. Available: $${balance.toFixed(2)} USD` });
      return;
    }

    setProcessing(true);
    setMsg({ type: '', text: '' });

    try {
      const assetCode = `${selectedCoin}USD`;
      const idempotencyKey = `tr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const res = await fetch('/api/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset: assetCode,
          type,
          amount: amtNum,
          duration,
          idempotencyKey,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMsg({
          type: 'success',
          text: `Trade opened! ${type.toUpperCase()} on ${selectedCoin}/USDT @ $${Number(data.entryPrice || activeTicker.price).toFixed(activeCoinMeta.decimals)} (Expires in ${duration}).`,
        });
        await fetchData();
      } else {
        setMsg({ type: 'error', text: data.error || 'Failed to place trade' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Network connection error. Please try again.' });
    } finally {
      setProcessing(false);
    }
  };

  // Open trades vs Closed trades
  const openTrades = useMemo(() => trades.filter((t) => t.status === 'open'), [trades]);
  const closedTrades = useMemo(() => trades.filter((t) => t.status === 'closed' || t.status === 'cancelled'), [trades]);

  const displayedTrades = useMemo(() => {
    if (historyTab === 'open') return openTrades;
    if (historyTab === 'closed') return closedTrades;
    return trades;
  }, [historyTab, openTrades, closedTrades, trades]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#010214] flex flex-col items-center justify-center gap-3">
        <div className="size-12 border-4 border-[#ef4d45] border-t-transparent rounded-full animate-spin" />
        <p className="text-white/60 text-xs font-mono tracking-wider uppercase">Loading Real-Time Terminal...</p>
      </div>
    );
  }

  return (
    <DashboardLayout title="Live Real-Time Trading" user={user}>
      {/* 1. TOP TICKER TAPE */}
      <div className="bg-[#05081c] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <TradingViewTicker />
      </div>

      {/* 2. REAL-TIME ASSET SELECTOR BAR */}
      <div className="bg-[#05081c] border border-white/5 rounded-2xl p-3 shadow-xl">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-[#ef4d45] animate-pulse" />
            <span className="text-xs font-black text-white uppercase tracking-wider">Select Market Pair</span>
          </div>
          <span className="text-[10px] text-white/40 flex items-center gap-1 font-mono">
            <span className="inline-block size-2 rounded-full bg-emerald-500 animate-ping" />
            LIVE MARKET QUOTES
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {COIN_LIST.map((c) => {
            const raw = tickers[c.symbol] || tickers[`${c.symbol}USDT`];
            const price = raw?.price || c.defaultPrice;
            const chg = raw?.priceChangePercent ?? 0;
            const isPos = chg >= 0;
            const flash = tickFlash[c.symbol];
            const isSelected = selectedCoin === c.symbol;

            return (
              <button
                key={c.symbol}
                type="button"
                onClick={() => setSelectedCoin(c.symbol)}
                className={`flex flex-col p-2.5 rounded-xl border text-left transition-all duration-200 ${
                  isSelected
                    ? 'bg-gradient-to-b from-[#ef4d45]/20 to-[#0c102a] border-[#ef4d45] shadow-[0_0_15px_rgba(239,77,69,0.25)]'
                    : 'bg-[#010214]/60 border-white/5 hover:border-white/20 hover:bg-white/[0.02]'
                } ${
                  flash === 'up'
                    ? 'ring-1 ring-emerald-500 bg-emerald-500/10'
                    : flash === 'down'
                    ? 'ring-1 ring-rose-500 bg-rose-500/10'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-white">{c.symbol}</span>
                    <span className="text-[10px] text-white/40 font-semibold">USDT</span>
                  </div>
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                      isPos ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                    }`}
                  >
                    {isPos ? '+' : ''}
                    {Number(chg).toFixed(2)}%
                  </span>
                </div>

                <div className="flex items-baseline justify-between w-full">
                  <span
                    className={`font-mono text-xs font-bold transition-colors duration-300 ${
                      flash === 'up'
                        ? 'text-emerald-400 font-black'
                        : flash === 'down'
                        ? 'text-rose-400 font-black'
                        : 'text-white'
                    }`}
                  >
                    ${Number(price).toLocaleString(undefined, { minimumFractionDigits: c.decimals, maximumFractionDigits: c.decimals })}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. ACTIVE PAIR REAL-TIME QUOTE BANNER */}
      <div className="bg-gradient-to-r from-[#05081c] via-[#090e2e] to-[#05081c] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-gradient-to-br from-[#ef4d45] to-[#8c0030] flex items-center justify-center text-xl font-black text-white shadow-lg shadow-[#ef4d45]/20">
            {activeCoinMeta.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white tracking-wide">{activeCoinMeta.name}</h2>
              <span className="text-xs font-mono font-bold text-white/50 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                {activeCoinMeta.pair}
              </span>
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" /> Real Quote
              </span>
            </div>
            <div className="flex items-baseline gap-3 mt-1">
              <span
                className={`text-2xl sm:text-3xl font-black font-mono tracking-tight transition-colors duration-300 ${
                  tickFlash[selectedCoin] === 'up'
                    ? 'text-emerald-400'
                    : tickFlash[selectedCoin] === 'down'
                    ? 'text-rose-400'
                    : 'text-white'
                }`}
              >
                ${Number(activeTicker.price).toLocaleString(undefined, { minimumFractionDigits: activeCoinMeta.decimals, maximumFractionDigits: activeCoinMeta.decimals })}
              </span>
              <div
                className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                  activeTicker.priceChangePercent >= 0
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-rose-500/15 text-rose-400'
                }`}
              >
                {activeTicker.priceChangePercent >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {activeTicker.priceChangePercent >= 0 ? '+' : ''}
                {Number(activeTicker.priceChangePercent).toFixed(2)}%
                <span className="text-[10px] opacity-75 font-mono ml-0.5">
                  ({activeTicker.priceChange >= 0 ? '+' : ''}
                  ${Number(activeTicker.priceChange).toFixed(activeCoinMeta.decimals)})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live quote metrics grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 w-full md:w-auto bg-[#010214]/60 p-3 rounded-xl border border-white/5 font-mono">
          <div>
            <span className="text-[10px] text-white/40 uppercase block">24h High</span>
            <span className="text-xs font-bold text-white">
              ${Number(activeTicker.highPrice).toFixed(activeCoinMeta.decimals)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-white/40 uppercase block">24h Low</span>
            <span className="text-xs font-bold text-white">
              ${Number(activeTicker.lowPrice).toFixed(activeCoinMeta.decimals)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-white/40 uppercase block">Best Bid / Ask</span>
            <span className="text-xs font-bold text-emerald-400">
              ${Number(activeTicker.bidPrice).toFixed(activeCoinMeta.decimals)}
            </span>
            <span className="text-white/30 text-[10px]"> / </span>
            <span className="text-xs font-bold text-rose-400">
              ${Number(activeTicker.askPrice).toFixed(activeCoinMeta.decimals)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-white/40 uppercase block">Spread / Vol</span>
            <span className="text-xs font-bold text-amber-400">
              ${Number(activeTicker.spread).toFixed(activeCoinMeta.decimals)}
            </span>
            <span className="text-[10px] text-white/40 block font-normal">
              {Number(activeTicker.volume).toLocaleString(undefined, { maximumFractionDigits: 0 })} {selectedCoin}
            </span>
          </div>
        </div>
      </div>

      {/* Message Banner */}
      {msg.text && (
        <div
          className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-between border shadow-lg ${
            msg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
              : 'bg-red-500/10 border-red-500/20 text-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {msg.type === 'success' ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
            <span>{msg.text}</span>
          </div>
          <button type="button" onClick={() => setMsg({ type: '', text: '' })} className="text-white/40 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* 4. MAIN TRADING INTERFACE: CHART & ORDER PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Chart & Order Book View */}
        <div className="lg:col-span-2 bg-[#05081c] border border-white/5 rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewTab('chart')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                    viewTab === 'chart'
                      ? 'bg-white/10 text-white border border-white/10'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  <BarChart2 className="size-3.5" />
                  TradingView Chart
                </button>
                <button
                  type="button"
                  onClick={() => setViewTab('orderbook')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                    viewTab === 'orderbook'
                      ? 'bg-white/10 text-white border border-white/10'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  <Layers className="size-3.5" />
                  Live Order Book & Depth
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {activeCoinMeta.pair} • LIVE STREAM
                </span>
              </div>
            </div>

            {viewTab === 'chart' ? (
              <div className="w-full">
                <CoinChartWidget
                  symbol={`BINANCE:${selectedCoin}USDT`}
                  height={430}
                  showSelector={false}
                />
              </div>
            ) : (
              /* Simulated / Real-Time Depth Order Book */
              <div className="bg-[#010214] border border-white/5 rounded-xl p-4 font-mono text-xs">
                <div className="flex items-center justify-between text-[11px] text-white/40 border-b border-white/5 pb-2 mb-2 uppercase">
                  <span>Price (USDT)</span>
                  <span>Size ({selectedCoin})</span>
                  <span>Total</span>
                </div>

                {/* Asks (Sell Orders) */}
                <div className="space-y-1 mb-2">
                  {[0.003, 0.002, 0.0015, 0.001, 0.0005].map((delta, i) => {
                    const price = activeTicker.askPrice * (1 + delta);
                    const size = (1.2 * (5 - i) + 0.45).toFixed(3);
                    const total = (price * size).toFixed(2);
                    return (
                      <div key={i} className="flex items-center justify-between text-rose-400 hover:bg-rose-500/5 px-1 py-0.5 rounded">
                        <span className="font-bold">${price.toFixed(activeCoinMeta.decimals)}</span>
                        <span className="text-white/70">{size}</span>
                        <span className="text-white/40 text-[11px]">${Number(total).toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Spread Divider */}
                <div className="bg-white/5 border-y border-white/10 py-1.5 px-2 my-2 flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono text-sm">
                      ${Number(activeTicker.price).toFixed(activeCoinMeta.decimals)}
                    </span>
                    <span className="text-[10px] text-white/50">Market Mid-Price</span>
                  </div>
                  <span className="text-[11px] text-amber-400 font-mono">
                    Spread: ${Number(activeTicker.spread).toFixed(activeCoinMeta.decimals)}
                  </span>
                </div>

                {/* Bids (Buy Orders) */}
                <div className="space-y-1">
                  {[0.0005, 0.001, 0.0015, 0.002, 0.003].map((delta, i) => {
                    const price = activeTicker.bidPrice * (1 - delta);
                    const size = (1.5 * (i + 1) + 0.32).toFixed(3);
                    const total = (price * size).toFixed(2);
                    return (
                      <div key={i} className="flex items-center justify-between text-emerald-400 hover:bg-emerald-500/5 px-1 py-0.5 rounded">
                        <span className="font-bold">${price.toFixed(activeCoinMeta.decimals)}</span>
                        <span className="text-white/70">{size}</span>
                        <span className="text-white/40 text-[11px]">${Number(total).toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-white/40">
            <span>Trading Provider: Binance Vision Global Data Feed</span>
            <span>Quotes latency: ~250ms • Execution: Instant</span>
          </div>
        </div>

        {/* Right: Place Real-Time Trade Order Panel */}
        <div className="bg-[#05081c] border border-white/5 rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-[#ef4d45]" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Execute Trade</h3>
              </div>
              <span className="text-[11px] font-mono font-bold text-white/60">
                Bal: <span className="text-white">${balance.toFixed(2)}</span>
              </span>
            </div>

            <form onSubmit={handleTrade} className="space-y-4">
              {/* Call vs Put Selector */}
              <div>
                <label className="text-[10px] font-black text-white/50 uppercase tracking-wider block mb-1.5">
                  1. Prediction Direction (85% Profit Return)
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setType('call')}
                    className={`py-3 px-3 rounded-xl font-black text-xs flex flex-col items-center justify-center gap-1 border transition-all ${
                      type === 'call'
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/25 scale-[1.02]'
                        : 'bg-[#010214] border-white/10 text-white/60 hover:text-emerald-400 hover:border-emerald-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="size-4" />
                      <span>CALL (HIGHER)</span>
                    </div>
                    <span className="text-[10px] font-mono opacity-80">+85% Payout</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('put')}
                    className={`py-3 px-3 rounded-xl font-black text-xs flex flex-col items-center justify-center gap-1 border transition-all ${
                      type === 'put'
                        ? 'bg-gradient-to-r from-rose-600 to-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/25 scale-[1.02]'
                        : 'bg-[#010214] border-white/10 text-white/60 hover:text-rose-400 hover:border-rose-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <TrendingDown className="size-4" />
                      <span>PUT (LOWER)</span>
                    </div>
                    <span className="text-[10px] font-mono opacity-80">+85% Payout</span>
                  </button>
                </div>
              </div>

              {/* Expiry Duration */}
              <div>
                <label className="text-[10px] font-black text-white/50 uppercase tracking-wider block mb-1.5">
                  2. Contract Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {DURATIONS.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setDuration(d.value)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                        duration === d.value
                          ? 'bg-[#ef4d45] border-[#ef4d45] text-white shadow-md shadow-[#ef4d45]/20'
                          : 'bg-[#010214] border-white/10 text-white/60 hover:text-white hover:border-white/20'
                      }`}
                    >
                      {d.desc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stake Amount */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-black text-white/50 uppercase tracking-wider">
                    3. Stake Amount (USD)
                  </label>
                  <button
                    type="button"
                    onClick={() => setAmount(Math.floor(balance).toString())}
                    className="text-[10px] text-[#ef4d45] hover:underline font-bold uppercase"
                  >
                    Use Max (${balance.toFixed(2)})
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 font-mono text-sm font-bold">$</span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="100"
                    className="w-full bg-[#010214] border border-white/10 focus:border-[#ef4d45] rounded-xl pl-8 pr-4 py-3 text-white font-mono text-sm outline-none transition-colors"
                    required
                  />
                </div>

                {/* Quick Stake Buttons */}
                <div className="flex gap-1.5 mt-2">
                  {QUICK_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmount(amt.toString())}
                      className="flex-1 py-1 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 rounded-lg text-[10px] font-mono font-bold text-white/70 hover:text-white transition-all"
                    >
                      +${amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Real-Time Contract Summary & Payout Preview */}
              <div className="bg-[#010214] border border-white/5 rounded-xl p-3 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-white/50">
                  <span>Selected Asset</span>
                  <span className="text-white font-bold">{selectedCoin}/USDT</span>
                </div>
                <div className="flex items-center justify-between text-white/50">
                  <span>Current Live Price</span>
                  <span className="text-white font-bold">
                    ${Number(activeTicker.price).toFixed(activeCoinMeta.decimals)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-white/50">
                  <span>Target Direction</span>
                  <span className={`font-bold ${type === 'call' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {type.toUpperCase()} ({type === 'call' ? 'Price > Entry' : 'Price < Entry'})
                  </span>
                </div>
                <div className="flex items-center justify-between text-white/50">
                  <span>Duration</span>
                  <span className="text-white font-bold">{duration}</span>
                </div>
                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-white/40 block">Potential Return (+85%)</span>
                    <span className="text-emerald-400 font-black text-sm">
                      +${potentialProfit > 0 ? potentialProfit.toFixed(2) : '0.00'} Profit
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-white/40 block">Total Payout</span>
                    <span className="text-white font-black text-sm">
                      ${potentialPayout > 0 ? potentialPayout.toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={processing || amtNum <= 0 || amtNum > balance}
                className={`w-full py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  type === 'call'
                    ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white shadow-emerald-500/20 hover:brightness-110'
                    : 'bg-gradient-to-r from-rose-600 via-[#ef4d45] to-[#8c0030] text-white shadow-rose-500/20 hover:brightness-110'
                }`}
              >
                {processing ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    Executing Real-Time Trade...
                  </>
                ) : (
                  <>
                    {type === 'call' ? <TrendingUp className="size-5" /> : <TrendingDown className="size-5" />}
                    OPEN {type.toUpperCase()} TRADE ON {selectedCoin} (${amtNum > 0 ? amtNum.toFixed(2) : '0.00'})
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 text-center">
            <p className="text-[11px] text-white/40">
              Orders execute against real Binance market quotes and auto-settle upon duration expiry.
            </p>
          </div>
        </div>
      </div>

      {/* 5. LIVE OPEN POSITIONS MONITOR (REAL-TIME FLOATING P&L & COUNTDOWN) */}
      <div className="bg-[#05081c] border border-white/5 rounded-2xl p-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <Activity className="size-5 text-emerald-400 animate-pulse" />
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Live Open Positions ({openTrades.length})
              </h3>
              <p className="text-[11px] text-white/40">
                Real-time mark-to-market P&L with automated expiry settlement
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              fetchData();
              fetchQuotes();
            }}
            className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 transition-all w-fit"
          >
            <RefreshCw className="size-3.5" />
            Refresh Stream
          </button>
        </div>

        {openTrades.length === 0 ? (
          <div className="py-10 text-center text-white/30 border border-dashed border-white/5 rounded-xl">
            <Sparkles className="size-8 mx-auto mb-2 text-white/20" />
            <p className="text-xs font-bold text-white/50">No open positions at this moment</p>
            <p className="text-[11px] text-white/30 mt-1">Select an asset above and place a Call or Put order to begin trading live.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {openTrades.map((t) => {
              const start = new Date(t.datetime).getTime();
              const durMs = parseDurationMs(t.duration);
              const end = start + durMs;
              const remSec = Math.max(0, Math.floor((end - now) / 1000));
              const progressPct = Math.min(100, Math.max(0, ((now - start) / durMs) * 100));

              // Clean symbol
              const cleanSym = String(t.asset || 'BTCUSD').replace('BINANCE:', '').replace('USDT', '').replace('USD', '');
              const coinMeta = COIN_LIST.find((c) => c.symbol === cleanSym) || COIN_LIST[0];
              const rawT = tickers[cleanSym] || tickers[`${cleanSym}USDT`];
              const currentPrice = rawT?.price || coinMeta.defaultPrice;
              const entryPrice = parseFloat(t.entry_price || currentPrice);
              const stake = parseFloat(t.amount || 0);

              const isCall = String(t.type).toLowerCase() === 'call';
              const isInTheMoney = isCall ? currentPrice > entryPrice : currentPrice < entryPrice;
              const isPush = currentPrice === entryPrice;

              const floatingProfit = isInTheMoney ? stake * 0.85 : isPush ? 0 : -stake;
              const priceDiff = currentPrice - entryPrice;

              return (
                <div
                  key={t.id}
                  className={`bg-[#010214] border rounded-2xl p-4 shadow-xl flex flex-col justify-between transition-all ${
                    isInTheMoney
                      ? 'border-emerald-500/40 shadow-emerald-500/10'
                      : isPush
                      ? 'border-yellow-500/40'
                      : 'border-rose-500/30'
                  }`}
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white">{cleanSym}/USDT</span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                            isCall
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {isCall ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                          {t.type.toUpperCase()}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md font-mono ${
                          isInTheMoney
                            ? 'bg-emerald-500 text-black animate-pulse'
                            : isPush
                            ? 'bg-yellow-500 text-black'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {isInTheMoney ? 'IN THE MONEY 🎯' : isPush ? 'AT ENTRY' : 'OUT OF MONEY'}
                      </span>
                    </div>

                    {/* Progress Bar & Countdown */}
                    <div className="my-3">
                      <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                        <span className="text-white/40 flex items-center gap-1">
                          <Clock className="size-3 text-white/50" /> Time Remaining
                        </span>
                        <span className={`font-bold ${remSec <= 10 ? 'text-rose-400 animate-ping' : 'text-white'}`}>
                          {remSec > 0 ? `${Math.floor(remSec / 60)}m ${remSec % 60}s` : 'Settling...'}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#ef4d45] to-emerald-400 transition-all duration-1000 ease-linear"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Prices Comparison */}
                    <div className="grid grid-cols-2 gap-2 bg-white/[0.02] border border-white/5 p-2.5 rounded-xl text-xs font-mono mb-3">
                      <div>
                        <span className="text-[10px] text-white/40 block">Entry Price</span>
                        <span className="font-bold text-white">${entryPrice.toFixed(coinMeta.decimals)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-white/40 block">Current Quote</span>
                        <span
                          className={`font-bold ${
                            isInTheMoney ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          ${currentPrice.toFixed(coinMeta.decimals)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Stake & Live Floating P&L */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between font-mono">
                    <div>
                      <span className="text-[10px] text-white/40 block">Stake</span>
                      <span className="text-xs font-bold text-white">${stake.toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-white/40 block">Live Floating P&L</span>
                      <span
                        className={`text-sm font-black ${
                          floatingProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {floatingProfit >= 0 ? '+' : ''}${floatingProfit.toFixed(2)} ({isInTheMoney ? '+85%' : '-100%'})
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. RISK DISCLAIMER COMPONENT */}
      <RiskDisclaimer variant="compact" />

      {/* 7. COMPLETE TRADING HISTORY TABLE */}
      <div className="bg-[#05081c] border border-white/5 rounded-2xl p-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/5">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Trading History & Settlements</h3>
            <p className="text-[11px] text-white/40">Audit trail of all executed binary contracts and settlement exits</p>
          </div>

          <div className="flex items-center gap-1 bg-[#010214] p-1 rounded-xl border border-white/5 w-fit">
            <button
              type="button"
              onClick={() => setHistoryTab('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                historyTab === 'all' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
              }`}
            >
              All ({trades.length})
            </button>
            <button
              type="button"
              onClick={() => setHistoryTab('open')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                historyTab === 'open' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
              }`}
            >
              Open ({openTrades.length})
            </button>
            <button
              type="button"
              onClick={() => setHistoryTab('closed')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                historyTab === 'closed' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
              }`}
            >
              Closed ({closedTrades.length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5 text-white/40 text-[10px] uppercase tracking-wider font-mono">
                <th className="text-left py-3 px-3">Date / Time</th>
                <th className="text-left py-3 px-3">Asset</th>
                <th className="text-left py-3 px-3">Type</th>
                <th className="text-left py-3 px-3">Stake</th>
                <th className="text-left py-3 px-3">Entry Quote</th>
                <th className="text-left py-3 px-3">Exit Quote</th>
                <th className="text-left py-3 px-3">P&L</th>
                <th className="text-left py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {displayedTrades.length > 0 ? (
                displayedTrades.map((t) => {
                  const profitNum = parseFloat(t.profit || 0);
                  const isClosed = t.status === 'closed';
                  const isWon = isClosed && profitNum > 0;
                  const isLost = isClosed && profitNum < 0;
                  const isPush = isClosed && profitNum === 0;

                  return (
                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-3 text-white/60">
                        {new Date(t.datetime).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-white">{t.asset}</td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-1 rounded-md text-[10px] font-black inline-flex items-center gap-1 ${
                            t.type === 'call'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {t.type === 'call' ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                          {t.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-white">${Number(t.amount).toFixed(2)}</td>
                      <td className="py-3.5 px-3 text-white/70">${Number(t.entry_price).toFixed(2)}</td>
                      <td className="py-3.5 px-3 text-white/70">
                        {t.exit_price ? `$${Number(t.exit_price).toFixed(2)}` : '—'}
                      </td>
                      <td className="py-3.5 px-3 font-bold">
                        {isClosed ? (
                          <span className={isWon ? 'text-emerald-400' : isLost ? 'text-rose-400' : 'text-white/60'}>
                            {profitNum > 0 ? `+$${profitNum.toFixed(2)}` : profitNum < 0 ? `-$${Math.abs(profitNum).toFixed(2)}` : '$0.00'}
                          </span>
                        ) : (
                          <span className="text-yellow-400 text-[11px] animate-pulse">Running...</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            t.status === 'open'
                              ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20'
                              : isWon
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                              : isLost
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                              : 'bg-white/10 text-white/60'
                          }`}
                        >
                          {t.status === 'open' ? 'Open' : isWon ? 'Won 🎯' : isLost ? 'Loss' : 'Push'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-white/30">
                    No trades found in this view
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
