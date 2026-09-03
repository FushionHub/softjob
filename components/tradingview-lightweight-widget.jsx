'use client';

import { useEffect, useRef } from 'react';

export default function TradingViewLightweightWidget() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;
    try {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-chart-overview.js';
      script.type = 'text/javascript';
      script.async = true;
      script.innerHTML = JSON.stringify({
        "symbol": "BINANCE:BTCUSDT",
        "width": "100%",
        "height": 400,
        "locale": "en",
        "dateRange": "12M",
        "colorTheme": "dark",
        "trendLineColor": "rgba(239, 83, 80, 1)",
        "underLineColor": "rgba(239, 83, 80, 0.3)",
        "isTransparent": false,
        "autosize": false,
        "largeChartUrl": ""
      });
      
      if (containerRef.current) containerRef.current.appendChild(script);

      return () => {
        try {
          if (containerRef.current) {
            containerRef.current.innerHTML = '';
          }
        } catch {}
      };
    } catch {}
  }, []);

  return (
    <div className="tradingview-widget-container" ref={containerRef}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  );
}
