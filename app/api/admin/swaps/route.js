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
    const userId = searchParams.get('user_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (userId) {
      whereClause += ` AND s.user_id = $${paramIndex++}`;
      params.push(userId);
    }

    if (dateFrom) {
      whereClause += ` AND s.created_at >= $${paramIndex++}`;
      params.push(dateFrom);
    }

    if (dateTo) {
      whereClause += ` AND s.created_at <= $${paramIndex++}`;
      params.push(dateTo);
    }

    const countResult = await query(
      `SELECT COUNT(*) as total 
       FROM swaps s 
       JOIN users u ON s.user_id = u.id 
       ${whereClause}`,
      params
    );

    const swaps = await query(
      `SELECT s.*, u.name, u.email 
       FROM swaps s 
       JOIN users u ON s.user_id = u.id 
       ${whereClause} 
       ORDER BY s.created_at DESC 
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );

    const stats = await query(
      `SELECT 
        COUNT(*) as total,
        SUM(from_amount) as total_from_amount,
        SUM(to_amount) as total_to_amount
       FROM swaps s ${whereClause}`,
      params
    );

    return NextResponse.json({
      swaps,
      total: countResult[0].total,
      stats: stats[0],
      page,
      limit
    });
  } catch (error) {
    console.error('Error fetching swaps:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
