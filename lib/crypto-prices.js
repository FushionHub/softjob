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

          data.forEach(item => {
            const sym = item.symbol;
            const p = parseFloat(item.lastPrice);
            const c = parseFloat(item.priceChangePercent);
            if (!isNaN(p) && p > 0) {
              newPrices[sym] = p;
              const shortName = SHORT_NAMES[sym];
              if (shortName) newPrices[shortName] = p;
            }
            if (!isNaN(c)) {
              newChanges[sym] = c;
              const shortName = SHORT_NAMES[sym];
              if (shortName) newChanges[shortName] = c;
            }
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
          lastFetchTime = Date.now();
          return { prices: newPrices, changes: newChanges, source: host };
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

  return { prices: cachedPrices, changes: cachedChanges, source: 'cache' };
}

export async function getCryptoMarketData() {
  const now = Date.now();
  // Return cached result if fresh (< 3000ms)
  if (now - lastFetchTime < 3000) {
    return { prices: cachedPrices, changes: cachedChanges, source: 'memory-cache' };
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
