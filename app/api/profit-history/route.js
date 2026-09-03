import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const profits = await query('SELECT * FROM profit_history WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100', [session.userId]);
    // Fallback: if empty, derive from trades profit + investments
    const tradesProfit = await query("SELECT COALESCE(SUM(profit),0) as total FROM trades WHERE user_id=$1 AND status='closed'", [session.userId]);
    const invProfit = await query("SELECT COALESCE(SUM(profit),0) as total FROM user_investments WHERE user_id=$1 AND status='completed'", [session.userId]);
    return NextResponse.json({ profits, totals: { trades: Number(tradesProfit[0]?.total||0), investments: Number(invProfit[0]?.total||0) } });
  } catch (e) {
    console.error('profit GET', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
