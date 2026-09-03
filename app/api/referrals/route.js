import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.userId;

    const userRes = await query('SELECT referral_code, username FROM users WHERE id=$1', [userId]);
    let referralCode = userRes[0]?.referral_code;
    if (!referralCode) {
      referralCode = userRes[0]?.username?.toUpperCase().slice(0,4) + Math.random().toString(36).slice(2,6).toUpperCase() + userId;
      await query('UPDATE users SET referral_code=$1 WHERE id=$2', [referralCode, userId]);
    }

    const referrals = await query(`
      SELECT r.*, u.name, u.username, u.email, u.created_at as joined_at
      FROM referrals r
      JOIN users u ON u.id = r.referred_id
      WHERE r.referrer_id=$1 ORDER BY r.created_at DESC
    `, [userId]);

    const stats = await query(`
      SELECT 
        COUNT(*)::int as total,
        COALESCE(SUM(bonus_amount),0) as total_bonus,
        COUNT(CASE WHEN status='active' THEN 1 END)::int as active_count
      FROM referrals WHERE referrer_id=$1
    `, [userId]);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const link = `${baseUrl}/register?ref=${referralCode}`;

    return NextResponse.json({
      referralCode,
      referralLink: link,
      stats: stats[0],
      referrals
    });
  } catch (e) {
    console.error('Referrals GET error', e);
    return NextResponse.json({ error: 'Failed to fetch referrals' }, { status: 500 });
  }
}
