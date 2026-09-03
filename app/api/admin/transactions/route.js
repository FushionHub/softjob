import { NextResponse } from 'next/server';
import { getAdminSession, logAdminAction } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit')) || 20));
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';
    const userId = searchParams.get('user_id') || '';
    const dateFrom = searchParams.get('date_from') || '';
    const dateTo = searchParams.get('date_to') || '';
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (userId) {
      conditions.push(`user_id = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
    }

    if (status) {
      conditions.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (dateFrom) {
      conditions.push(`created_at >= $${paramIndex}`);
      params.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      conditions.push(`created_at <= $${paramIndex}`);
      params.push(dateTo);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let typeFilter = '';
    if (type) {
      const types = type.split(',');
      typeFilter = `AND type IN (${types.map((_, i) => `$${paramIndex + i}`).join(',')})`;
      params.push(...types);
      paramIndex += types.length;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM (
        SELECT id, 'deposit' as type, user_id, amount, status, created_at FROM deposits
        UNION ALL
        SELECT id, 'withdrawal' as type, user_id, amount, status, created_at FROM withdrawals
        UNION ALL
        SELECT id, 'trade' as type, user_id, amount, status, created_at FROM trades
        UNION ALL
        SELECT id, 'swap' as type, user_id, amount, status, created_at FROM swaps
        UNION ALL
        SELECT id, 'investment' as type, user_id, amount, status, created_at FROM user_investments
      ) as all_transactions ${whereClause} ${typeFilter.replace('AND', 'WHERE')}`,
      params
    );

    const transactionsResult = await query(
      `SELECT id, type, user_id, amount, status, created_at FROM (
        SELECT id, 'deposit' as type, user_id, amount, status, created_at FROM deposits
        UNION ALL
        SELECT id, 'withdrawal' as type, user_id, amount, status, created_at FROM withdrawals
        UNION ALL
        SELECT id, 'trade' as type, user_id, amount, status, created_at FROM trades
        UNION ALL
        SELECT id, 'swap' as type, user_id, amount, status, created_at FROM swaps
        UNION ALL
        SELECT id, 'investment' as type, user_id, amount, status, created_at FROM user_investments
      ) as all_transactions ${whereClause} ${typeFilter.replace('AND', 'WHERE')}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    const statsResult = await query(`
      SELECT
        (SELECT COALESCE(SUM(amount), 0) FROM deposits WHERE status = 'confirmed') as total_deposits,
        (SELECT COALESCE(SUM(amount), 0) FROM withdrawals WHERE status = 'confirmed') as total_withdrawals,
        (SELECT COALESCE(SUM(amount), 0) FROM trades WHERE status = 'completed') as total_trades,
        (SELECT COALESCE(SUM(amount), 0) FROM swaps WHERE status = 'completed') as total_swaps
    `);

    const total = parseInt(countResult[0].count);
    const totalPages = Math.ceil(total / limit);

    await logAdminAction(admin.id, 'list_transactions', 'transaction', null, {
      type, status, user_id: userId, date_from: dateFrom, date_to: dateTo, page, limit
    });

    return NextResponse.json({
      transactions: transactionsResult,
      total,
      page,
      totalPages,
      stats: statsResult[0]
    });
  } catch (error) {
    console.error('List transactions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
