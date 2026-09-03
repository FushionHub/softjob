'use client';

import { useEffect, useRef, useState } from 'react';

const SYMBOLS = [
  { value: 'BINANCE:BTCUSDT', label: 'BTC/USDT' },
  { value: 'BINANCE:ETHUSDT', label: 'ETH/USDT' },
  { value: 'BINANCE:SOLUSDT', label: 'SOL/USDT' },
  { value: 'BINANCE:BNBUSDT', label: 'BNB/USDT' },
  { value: 'BINANCE:XRPUSDT', label: 'XRP/USDT' },
  { value: 'BINANCE:ADAUSDT', label: 'ADA/USDT' },
];

export default function CoinChartWidget({ symbol = 'BINANCE:BTCUSDT', height = 400, showSelector = true }) {
  const containerRef = useRef(null);
  const [currentSymbol, setCurrentSymbol] = useState(symbol);

  useEffect(() => {
    setCurrentSymbol(symbol);
  }, [symbol]);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: currentSymbol,
      interval: '60',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      enable_publishing: false,
      allow_symbol_change: false,
      calendar: false,
      support_host: 'https://www.tradingview.com',
      backgroundColor: '#05081c',
      gridColor: 'rgba(255,255,255,0.05)',
    });
    const widget = document.createElement('div');
    widget.className = 'tradingview-widget-container__widget';
    widget.style.height = '100%';
    widget.style.width = '100%';
    widget.appendChild(script);
    containerRef.current.appendChild(widget);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [currentSymbol]);

  return (
    <div className="w-full">
      {showSelector && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {SYMBOLS.map(s => (
            <button
              key={s.value}
              onClick={() => setCurrentSymbol(s.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${currentSymbol === s.value ? 'bg-[#ef4d45] border-[#ef4d45] text-white' : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/20'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
      <div ref={containerRef} className="w-full bg-[#05081c] rounded-2xl border border-white/5 overflow-hidden" style={{ height }} />
    </div>
  );
}

// Lightweight mini chart for dashboard cards
export function MiniChart({ symbol = 'BINANCE:BTCUSDT', height = 220 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = '';
    const s = document.createElement('script');
    s.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-chart.js';
    s.async = true;
    s.innerHTML = JSON.stringify({
      symbol,
      width: '100%',
      height,
      locale: 'en',
      dateRange: '1M',
      colorTheme: 'dark',
      isTransparent: true,
      autosize: false,
      largeChartUrl: '',
      trendLineColor: 'rgba(239, 77, 69, 1)',
      underLineColor: 'rgba(239, 77, 69, 0.15)',
    });
    ref.current.appendChild(s);
    return () => { if (ref.current) ref.current.innerHTML = ''; };
  }, [symbol, height]);
  return <div ref={ref} className="w-full overflow-hidden rounded-xl" style={{ height }} />;
}
