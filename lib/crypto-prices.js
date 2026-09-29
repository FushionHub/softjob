// Shared crypto price fetching engine with multiple fallback tiers and caching.

export const STATIC_RATES = {
  'BTC_USDT': 83500,
  'USDT_BTC': 0.0000119,
  'ETH_USDT': 2690,
  'USDT_ETH': 0.000371,
  'SOL_USDT': 120,
  'USDT_SOL': 0.00833,
  'BNB_USDT': 755,
  'USDT_BNB': 0.00132,
  'XRP_USDT': 1.50,
  'USDT_XRP': 0.666,
  'ADA_USDT': 0.25,
  'USDT_ADA': 4.00,
  'DOGE_USDT': 0.095,
  'USDT_DOGE': 10.52,
  'TRX_USDT': 0.33,
  'USDT_TRX': 3.03,
  'BTC_ETH': 31.04,
  'ETH_BTC': 0.0322,
  'BTC_SOL': 695.8,
  'SOL_BTC': 0.00143,
};

const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 'TRXUSDT'];

const SHORT_NAMES = {
  BTCUSDT: 'BTC',
  ETHUSDT: 'ETH',
  SOLUSDT: 'SOL',
  BNBUSDT: 'BNB',
  XRPUSDT: 'XRP',
  ADAUSDT: 'ADA',
  DOGEUSDT: 'DOGE',
  TRXUSDT: 'TRX',
};

// In-memory cache
let cachedPrices = {
  BTCUSDT: 83500,
  ETHUSDT: 2690,
  SOLUSDT: 120,
  BNBUSDT: 755,
  XRPUSDT: 1.50,
  ADAUSDT: 0.25,
  DOGEUSDT: 0.095,
  TRXUSDT: 0.33,
  USDTUSDT: 1,
  USDCUSDT: 1,
  BTC: 83500,
  ETH: 2690,
  SOL: 120,
  BNB: 755,
  XRP: 1.50,
  ADA: 0.25,
  DOGE: 0.095,
  TRX: 0.33,
  USDT: 1,
  USDC: 1,
};

let cachedChanges = {
  BTCUSDT: 0.5,
  ETHUSDT: 0.2,
  SOLUSDT: -0.4,
  BNBUSDT: -0.8,
  XRPUSDT: 0.1,
  ADAUSDT: -0.5,
  DOGEUSDT: 0.3,
  TRXUSDT: 0.1,
  USDTUSDT: 0,
  USDCUSDT: 0,
  BTC: 0.5,
  ETH: 0.2,
  SOL: -0.4,
  BNB: -0.8,
  XRP: 0.1,
  ADA: -0.5,
  DOGE: 0.3,
  TRX: 0.1,
  USDT: 0,
  USDC: 0,
};

let cachedTickers = {
  BTCUSDT: { symbol: 'BTCUSDT', shortName: 'BTC', name: 'Bitcoin', price: 83500, priceChangePercent: 0.5, priceChange: 415, highPrice: 84500, lowPrice: 82500, bidPrice: 83495, askPrice: 83505, spread: 10, volume: 13500, quoteVolume: 1125000000 },
  ETHUSDT: { symbol: 'ETHUSDT', shortName: 'ETH', name: 'Ethereum', price: 2690, priceChangePercent: 0.2, priceChange: 5.4, highPrice: 2750, lowPrice: 2650, bidPrice: 2689.5, askPrice: 2690.5, spread: 1, volume: 85000, quoteVolume: 228000000 },
  SOLUSDT: { symbol: 'SOLUSDT', shortName: 'SOL', name: 'Solana', price: 120, priceChangePercent: -0.4, priceChange: -0.48, highPrice: 123, lowPrice: 116, bidPrice: 119.9, askPrice: 120.1, spread: 0.2, volume: 450000, quoteVolume: 54000000 },
  BNBUSDT: { symbol: 'BNBUSDT', shortName: 'BNB', name: 'BNB', price: 755, priceChangePercent: -0.8, priceChange: -6.04, highPrice: 770, lowPrice: 750, bidPrice: 754.8, askPrice: 755.2, spread: 0.4, volume: 60000, quoteVolume: 45300000 },
  XRPUSDT: { symbol: 'XRPUSDT', shortName: 'XRP', name: 'Ripple', price: 1.50, priceChangePercent: 0.1, priceChange: 0.0015, highPrice: 1.56, lowPrice: 1.46, bidPrice: 1.502, askPrice: 1.503, spread: 0.001, volume: 12000000, quoteVolume: 18000000 },
  ADAUSDT: { symbol: 'ADAUSDT', shortName: 'ADA', name: 'Cardano', price: 0.25, priceChangePercent: -0.5, priceChange: -0.0012, highPrice: 0.26, lowPrice: 0.24, bidPrice: 0.249, askPrice: 0.251, spread: 0.002, volume: 9500000, quoteVolume: 2375000 },
  DOGEUSDT: { symbol: 'DOGEUSDT', shortName: 'DOGE', name: 'Dogecoin', price: 0.095, priceChangePercent: 0.3, priceChange: 0.0003, highPrice: 0.098, lowPrice: 0.091, bidPrice: 0.0949, askPrice: 0.0951, spread: 0.0002, volume: 25000000, quoteVolume: 2375000 },
  TRXUSDT: { symbol: 'TRXUSDT', shortName: 'TRX', name: 'TRON', price: 0.33, priceChangePercent: 0.1, priceChange: 0.0003, highPrice: 0.34, lowPrice: 0.33, bidPrice: 0.335, askPrice: 0.336, spread: 0.001, volume: 15000000, quoteVolume: 4950000 },
};

// Mirror short names
Object.keys(cachedTickers).forEach(sym => {
  const short = SHORT_NAMES[sym];
  if (short) cachedTickers[short] = cachedTickers[sym];
});

let lastFetchTime = 0;
let ongoingFetchPromise = null;

const ENDPOINTS = [
  'https://data-api.binance.vision', // Official Binance global CDN (unrestricted)
  'https://api.binance.com',
];

async function executeFetch() {
  const symbolsParam = encodeURIComponent(JSON.stringify(SYMBOLS));

  for (const host of ENDPOINTS) {
    try {
      const url = `${host}/api/v3/ticker/24hr?symbols=${symbolsParam}`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(3500),
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const newPrices = { ...cachedPrices };
          const newChanges = { ...cachedChanges };
          const newTickers = { ...cachedTickers };

          data.forEach(item => {
            const sym = item.symbol;
            const p = parseFloat(item.lastPrice);
            const c = parseFloat(item.priceChangePercent);
            const chg = parseFloat(item.priceChange || 0);
            const high = parseFloat(item.highPrice || p);
            const low = parseFloat(item.lowPrice || p);
            const bid = parseFloat(item.bidPrice || p);
            const ask = parseFloat(item.askPrice || p);
            const vol = parseFloat(item.volume || 0);
            const qVol = parseFloat(item.quoteVolume || 0);
            const shortName = SHORT_NAMES[sym];

            if (!isNaN(p) && p > 0) {
              newPrices[sym] = p;
              if (shortName) newPrices[shortName] = p;
            }
            if (!isNaN(c)) {
              newChanges[sym] = c;
              if (shortName) newChanges[shortName] = c;
            }

            const tickerObj = {
              symbol: sym,
              shortName: shortName || sym,
              name: shortName === 'BTC' ? 'Bitcoin' : shortName === 'ETH' ? 'Ethereum' : shortName === 'SOL' ? 'Solana' : shortName === 'BNB' ? 'BNB' : shortName === 'XRP' ? 'Ripple' : shortName === 'ADA' ? 'Cardano' : shortName === 'DOGE' ? 'Dogecoin' : shortName === 'TRX' ? 'TRON' : sym,
              price: p,
              priceChangePercent: c,
              priceChange: chg,
              highPrice: high,
              lowPrice: low,
              bidPrice: bid,
              askPrice: ask,
              spread: Math.max(0, ask - bid),
              volume: vol,
              quoteVolume: qVol,
              updatedAt: Date.now(),
            };

            newTickers[sym] = tickerObj;
            if (shortName) newTickers[shortName] = tickerObj;
          });

          // Ensure stablecoins
          newPrices['USDTUSDT'] = 1;
          newPrices['USDCUSDT'] = 1;
          newPrices['USDT'] = 1;
          newPrices['USDC'] = 1;
          newChanges['USDTUSDT'] = 0;
          newChanges['USDCUSDT'] = 0;
          newChanges['USDT'] = 0;
          newChanges['USDC'] = 0;

          cachedPrices = newPrices;
          cachedChanges = newChanges;
          cachedTickers = newTickers;
          lastFetchTime = Date.now();
          return { prices: newPrices, changes: newChanges, tickers: newTickers, source: host };
        }
      }
    } catch {}
  }

  // Fallback to individual fetches on Binance Vision
  try {
    const host = ENDPOINTS[0];
    const results = await Promise.allSettled(
      SYMBOLS.map(s =>
        fetch(`${host}/api/v3/ticker/24hr?symbol=${s}`, {
          signal: AbortSignal.timeout(2000),
          cache: 'no-store',
        }).then(r => (r.ok ? r.json() : null))
      )
    );

    let updated = false;
    results.forEach(res => {
      if (res.status === 'fulfilled' && res.value) {
        const item = res.value;
        const sym = item.symbol;
        const p = parseFloat(item.lastPrice);
        const c = parseFloat(item.priceChangePercent);
        if (!isNaN(p) && p > 0) {
          cachedPrices[sym] = p;
          const shortName = SHORT_NAMES[sym];
          if (shortName) cachedPrices[shortName] = p;
          updated = true;
        }
        if (!isNaN(c)) {
          cachedChanges[sym] = c;
          const shortName = SHORT_NAMES[sym];
          if (shortName) cachedChanges[shortName] = c;
        }
      }
    });

    if (updated) {
      lastFetchTime = Date.now();
      return { prices: cachedPrices, changes: cachedChanges, source: 'binance-vision-singles' };
    }
  } catch {}

  return { prices: cachedPrices, changes: cachedChanges, tickers: cachedTickers, source: 'cache' };
}

export async function getCryptoMarketData() {
  const now = Date.now();
  // Return cached result if fresh (< 3000ms)
  if (now - lastFetchTime < 3000) {
    return { prices: cachedPrices, changes: cachedChanges, tickers: cachedTickers, source: 'memory-cache' };
  }

  // Deduplicate concurrent requests
  if (!ongoingFetchPromise) {
    ongoingFetchPromise = executeFetch().finally(() => {
      ongoingFetchPromise = null;
    });
  }

  return ongoingFetchPromise;
}

export async function getSingleLivePrice(rawSymbol) {
  if (!rawSymbol) return null;
  const s = String(rawSymbol).replace('BINANCE:', '').replace('USD', 'USDT').toUpperCase();
  if (s === 'USDT' || s === 'USDC' || s === 'USDTUSDT' || s === 'USDCUSDT') return 1;

  // Try from fresh market data
  try {
    const data = await getCryptoMarketData();
    if (data.prices[s]) return data.prices[s];
    const base = s.replace('USDT', '');
    if (data.prices[base]) return data.prices[base];
  } catch {}

  // Direct single fetch fallback
  for (const host of ENDPOINTS) {
    try {
      const res = await fetch(`${host}/api/v3/ticker/price?symbol=${s}`, {
        signal: AbortSignal.timeout(2500),
        cache: 'no-store',
      });
      if (res.ok) {
        const j = await res.json();
        const p = parseFloat(j.price);
        if (!isNaN(p) && p > 0) {
          cachedPrices[s] = p;
          return p;
        }
      }
    } catch {}
  }

  // Fallback to static
  const staticKey = `${s.replace('USDT', '')}_USDT`;
  return STATIC_RATES[staticKey] || cachedPrices[s] || cachedPrices[s.replace('USDT', '')] || 100;
}
