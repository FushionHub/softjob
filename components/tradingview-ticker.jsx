'use client';

import { useEffect, useRef } from 'react';

export default function TradingViewTicker() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      "symbols": [
        { "proName": "BINANCE:BTCUSDT", "title": "Bitcoin" },
        { "proName": "BINANCE:ETHUSDT", "title": "Ethereum" },
        { "proName": "BINANCE:SOLUSDT", "title": "Solana" },
        { "proName": "BINANCE:XRPUSDT", "title": "Ripple" },
        { "proName": "BINANCE:ADAUSDT", "title": "Cardano" },
        { "proName": "BINANCE:DOGEUSDT", "title": "Dogecoin" },
        { "proName": "BINANCE:DOTUSDT", "title": "Polkadot" },
        { "proName": "BINANCE:MATICUSDT", "title": "Polygon" }
      ],
      "showSymbolLogo": true,
      "colorTheme": "dark",
      "isTransparent": false,
      "displayMode": "adaptive",
      "locale": "en"
    });

    widgetDiv.appendChild(script);
    containerRef.current.appendChild(widgetDiv);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="tradingview-ticker-container w-full">
      <div className="tradingview-widget-container"></div>
    </div>
  );
}
