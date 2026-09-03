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
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';
    const userId = searchParams.get('user_id') || '';
    const dateFrom = searchParams.get('date_from') || '';
    const dateTo = searchParams.get('date_to') || '';

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (userId) {
      conditions.push(`t.user_id = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
    }

    if (status) {
      conditions.push(`t.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (dateFrom) {
      conditions.push(`t.created_at >= $${paramIndex}`);
      params.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      conditions.push(`t.created_at <= $${paramIndex}`);
      params.push(dateTo);
      paramIndex++;
    }

    if (type) {
      const types = type.split(',');
      conditions.push(`t.type IN (${types.map((_, i) => `$${paramIndex + i}`).join(',')})`);
      params.push(...types);
      paramIndex += types.length;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT t.id, t.type, t.user_id, u.name as user_name, u.email as user_email,
              t.amount, t.status, t.created_at
       FROM (
        SELECT id, 'deposit' as type, user_id, amount, status, created_at FROM deposits
        UNION ALL
        SELECT id, 'withdrawal' as type, user_id, amount, status, created_at FROM withdrawals
        UNION ALL
        SELECT id, 'trade' as type, user_id, amount, status, created_at FROM trades
        UNION ALL
        SELECT id, 'swap' as type, user_id, amount, status, created_at FROM swaps
        UNION ALL
        SELECT id, 'investment' as type, user_id, amount, status, created_at FROM user_investments
      ) t
       LEFT JOIN users u ON t.user_id = u.id
       ${whereClause}
       ORDER BY t.created_at DESC`,
      params
    );

    const csvHeader = 'ID,Type,User ID,User Name,User Email,Amount,Status,Created At\n';
    const csvRows = result.map(row =>
      `${row.id},${row.type},${row.user_id},"${row.user_name || ''}","${row.user_email || ''}",${row.amount},${row.status},${row.created_at}`
    ).join('\n');

    await logAdminAction(admin.id, 'export_transactions', 'transaction', null, {
      type, status, user_id: userId, date_from: dateFrom, date_to: dateTo
    });

    return new NextResponse(csvHeader + csvRows, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="transactions-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    console.error('Export transactions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
