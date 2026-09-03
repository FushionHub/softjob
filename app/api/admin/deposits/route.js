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
    const status = searchParams.get('status') || '';
    const userId = searchParams.get('user_id') || '';
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`d.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (userId) {
      conditions.push(`d.user_id = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
    }

    if (search) {
      conditions.push(`(u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*)
       FROM deposits d
       LEFT JOIN users u ON d.user_id = u.id
       ${whereClause}`,
      params
    );

    const depositsResult = await query(
      `SELECT d.id, d.user_id, d.amount, d.currency, d.status, d.tx_hash,
              d.created_at, d.updated_at,
              u.name as user_name, u.email as user_email
       FROM deposits d
       LEFT JOIN users u ON d.user_id = u.id
       ${whereClause}
       ORDER BY d.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    const statsResult = await query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COALESCE(SUM(amount) FILTER (WHERE status = 'confirmed'), 0) as total_confirmed_amount
      FROM deposits
    `);

    const total = parseInt(countResult[0].count);
    const totalPages = Math.ceil(total / limit);

    await logAdminAction(admin.id, 'list_deposits', 'deposit', null, { status, user_id: userId, search, page, limit });

    return NextResponse.json({
      deposits: depositsResult,
      total,
      page,
      totalPages,
      stats: statsResult[0]
    });
  } catch (error) {
    console.error('List deposits error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
