import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(req) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.userId;
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('type'); // deposit/withdrawal/swap/trade/all

    const deposits = await query("SELECT id, amount, payment as method, reference, status, date as created_at, 'deposit' as type FROM deposits WHERE user_id=$1", [userId]);
    const withdrawals = await query("SELECT id, amount, wallet_address as method, status, created_at, 'withdrawal' as type FROM withdrawals WHERE user_id=$1", [userId]);
    const swaps = await query("SELECT id, from_amount as amount, from_asset||'→'||to_asset as method, status, created_at, 'swap' as type, to_amount FROM swaps WHERE user_id=$1", [userId]).catch(()=>[]);
    const trades = await query("SELECT id, amount, asset as method, status, datetime as created_at, 'trade' as type, profit FROM trades WHERE user_id=$1", [userId]);

    let all = [...deposits, ...withdrawals, ...swaps, ...trades].sort((a,b)=> new Date(b.created_at)-new Date(a.created_at));
    if (filter && filter !== 'all') all = all.filter(t=> t.type===filter);

    // Realtime balance calc
    const bal = await query('SELECT balance, total_profit, total_bonus, total_withdrawal FROM users WHERE id=$1', [userId]);

    return NextResponse.json({ transactions: all.slice(0,100), balance: bal[0] });
  } catch (e) {
    console.error('transactions GET', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
