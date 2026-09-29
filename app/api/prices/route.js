import { NextResponse } from 'next/server';
import { getCryptoMarketData } from '@/lib/crypto-prices';

export async function GET() {
  try {
    const data = await getCryptoMarketData();
    return NextResponse.json(
      {
        prices: data.prices,
        changes: data.changes,
        source: data.source,
        timestamp: Date.now(),
      },
      {
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (e) {
    console.error('Prices API error:', e);
    const data = await getCryptoMarketData();
    return NextResponse.json(
      {
        prices: data.prices,
        changes: data.changes,
        source: 'fallback',
        timestamp: Date.now(),
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }
}
