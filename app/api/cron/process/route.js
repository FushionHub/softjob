import { NextResponse } from 'next/server';
import { settleExpiredTrades, processMatureInvestments } from '@/lib/lifecycle';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const providedToken = searchParams.get('token') || request.headers.get('x-cron-token') || '';

    const expectedToken = process.env.CPANEL_CRON_TOKEN || process.env.CRON_SECRET || '';

    // If a token is configured in .env, enforce it
    if (expectedToken && providedToken !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized: Invalid cron token' }, { status: 401 });
    }

    // Run trade settlement & investment maturity processing
    const [tradeResults, investmentResults] = await Promise.all([
      settleExpiredTrades(),
      processMatureInvestments()
    ]);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      trades: tradeResults,
      investments: investmentResults
    });
  } catch (error) {
    console.error('Cron process route error:', error);
    return NextResponse.json({ error: error.message || 'Cron process failed' }, { status: 500 });
  }
}

export async function POST(request) {
  return GET(request);
}
