import { NextResponse } from 'next/server';

export async function GET() {
  const key = process.env.BACHS_API_KEY || process.env.BACHS_SECRET_KEY || '';
  const base = process.env.BACHS_API_BASE || 'https://api.bachs.io';
  const hasLiveKey = !!key && !key.startsWith('sk_sandbox_') && !key.startsWith('sk_test_');
  return NextResponse.json({
    configured: hasLiveKey,
    mode: hasLiveKey ? 'live' : 'not-configured',
    baseUrl: base,
    hasKey: hasLiveKey,
    liveOnly: true,
  });
}
