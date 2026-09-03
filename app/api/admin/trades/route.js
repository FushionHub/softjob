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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const userId = searchParams.get('user_id');
    const asset = searchParams.get('asset');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` AND t.status = $${paramIndex++}`;
      params.push(status);
    }

    if (userId) {
      whereClause += ` AND t.user_id = $${paramIndex++}`;
      params.push(userId);
    }

    if (asset) {
      whereClause += ` AND t.asset = $${paramIndex++}`;
      params.push(asset);
    }

    if (dateFrom) {
      whereClause += ` AND t.created_at >= $${paramIndex++}`;
      params.push(dateFrom);
    }

    if (dateTo) {
      whereClause += ` AND t.created_at <= $${paramIndex++}`;
      params.push(dateTo);
    }

    const countResult = await query(
      `SELECT COUNT(*) as total 
       FROM trades t 
       JOIN users u ON t.user_id = u.id 
       ${whereClause}`,
      params
    );

    const trades = await query(
      `SELECT t.*, u.name, u.email 
       FROM trades t 
       JOIN users u ON t.user_id = u.id 
       ${whereClause} 
       ORDER BY t.created_at DESC 
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );

    const stats = await query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_count,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_count,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count,
        SUM(CASE WHEN profit > 0 THEN profit ELSE 0 END) as total_profit,
        SUM(CASE WHEN profit < 0 THEN ABS(profit) ELSE 0 END) as total_loss
       FROM trades t ${whereClause}`,
      params
    );

    return NextResponse.json({
      trades,
      total: countResult[0].total,
      stats: stats[0],
      page,
      limit
    });
  } catch (error) {
    console.error('Error fetching trades:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
