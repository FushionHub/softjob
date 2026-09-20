import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

function getPublicBaseUrl(request) {
  if (!request) return '';
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  if (forwardedHost && !forwardedHost.includes('localhost') && !forwardedHost.includes('127.0.0.1')) {
    const proto = forwardedProto.split(',')[0].trim();
    const host = forwardedHost.split(',')[0].trim();
    return `${proto}://${host}`;
  }
  const host = request.headers.get('host');
  if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    const proto = forwardedProto.split(',')[0].trim();
    return `${proto}://${host}`;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      const parsed = new URL(process.env.NEXT_PUBLIC_APP_URL);
      if (parsed.hostname && !parsed.hostname.includes('localhost') && !parsed.hostname.includes('127.0.0.1')) {
        return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
      }
    } catch {}
  }
  try {
    const reqUrl = new URL(request.url);
    if (reqUrl.hostname && !reqUrl.hostname.includes('localhost') && !reqUrl.hostname.includes('127.0.0.1')) {
      return reqUrl.origin;
    }
  } catch {}
  return '';
}

export async function GET(request) {
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

    const rawStats = await query(`
      SELECT
        COUNT(*) as total,
        COALESCE(SUM(bonus_amount),0) as total_bonus,
        COUNT(CASE WHEN status='active' THEN 1 END) as active_count
      FROM referrals WHERE referrer_id=$1
    `, [userId]);
    const stats = [{
      total: Number(rawStats[0]?.total || 0),
      total_bonus: Number(rawStats[0]?.total_bonus || 0),
      active_count: Number(rawStats[0]?.active_count || 0),
    }];

    const publicBase = getPublicBaseUrl(request);
    const link = publicBase ? `${publicBase}/register?ref=${referralCode}` : `/register?ref=${referralCode}`;

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
