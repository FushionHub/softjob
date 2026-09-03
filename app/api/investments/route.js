import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const investments = await query(`
      SELECT ui.*, ip.name as plan_name, ip.percentage, ip.duration, ip.color
      FROM user_investments ui
      JOIN investment_plans ip ON ip.id = ui.plan_id
      WHERE ui.user_id=$1 ORDER BY ui.start_date DESC
    `, [session.userId]);

    const withProgress = investments.map(inv => {
      const now = new Date();
      const start = new Date(inv.start_date);
      const end = new Date(inv.end_date);
      const totalMs = end - start;
      const elapsedMs = now - start;
      const progress = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
      const isCompleted = now >= end && inv.status === 'active';
      return { ...inv, progress: Number(progress.toFixed(1)), isCompleted };
    });

    return NextResponse.json({ investments: withProgress });
  } catch (e) {
    console.error('investments GET', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
