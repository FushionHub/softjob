'use client';

import { useEffect } from 'react';

export default function TradingViewTicker() {
  useEffect(() => {
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

    const container = document.querySelector('.tradingview-ticker-container');
    if (container) {
      container.appendChild(script);
    }

    return () => {
      if (container && container.contains(script)) {
        container.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="tradingview-ticker-container w-full">
      <div className="tradingview-widget-container"></div>
    </div>
  );
}
