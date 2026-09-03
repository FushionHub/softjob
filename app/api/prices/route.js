import { NextResponse } from 'next/server';

const SYMBOL_MAP = {
  BTCUSDT: 'BTC',
  ETHUSDT: 'ETH',
  SOLUSDT: 'SOL',
  BNBUSDT: 'BNB',
  XRPUSDT: 'XRP',
  ADAUSDT: 'ADA',
  DOGEUSDT: 'DOGE',
  TRXUSDT: 'TRX',
};

export async function GET() {
  try {
    const symbols = Object.keys(SYMBOL_MAP);
    // Binance 24hr ticker accepts ?symbols=["BTCUSDT","ETHUSDT"...]
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(symbols))}`;
    const res = await fetch(url, { next: { revalidate: 5 }, headers: { 'Accept': 'application/json' } });
    if (!res.ok) {
      // fallback to single price endpoints
      const prices = {};
      const changes = {};
      for (const s of symbols) {
        try {
          const r = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${s}`, { next: { revalidate: 5 } });
          if (r.ok) {
            const d = await r.json();
            prices[s] = parseFloat(d.lastPrice);
            changes[s] = parseFloat(d.priceChangePercent);
          }
        } catch {}
      }
      // stablecoins fixed
      prices['USDTUSDT'] = 1;
      prices['USDCUSDT'] = 1;
      changes['USDTUSDT'] = 0;
      changes['USDCUSDT'] = 0;
      return NextResponse.json({ prices, changes, source: 'binance-fallback', timestamp: Date.now() });
    }
    const data = await res.json();
    const prices = {};
    const changes = {};
    data.forEach(d => {
      prices[d.symbol] = parseFloat(d.lastPrice);
      changes[d.symbol] = parseFloat(d.priceChangePercent);
    });
    // Add stablecoins manually
    prices['USDTUSDT'] = 1;
    prices['USDCUSDT'] = 1;
    changes['USDTUSDT'] = 0;
    changes['USDCUSDT'] = 0;

    return NextResponse.json({ prices, changes, source: 'binance', timestamp: Date.now() }, {
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (e) {
    return NextResponse.json({ prices: { USDTUSDT: 1, USDCUSDT: 1 }, changes: {}, error: e.message }, { status: 200 });
  }
}
