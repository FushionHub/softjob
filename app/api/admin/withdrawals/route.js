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
    const search = searchParams.get('search');
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` AND w.status = $${paramIndex++}`;
      params.push(status);
    }

    if (userId) {
      whereClause += ` AND w.user_id = $${paramIndex++}`;
      params.push(userId);
    }

    if (search) {
      whereClause += ` AND (u.name LIKE $${paramIndex} OR u.email LIKE $${paramIndex + 1})`;
      params.push(`%${search}%`, `%${search}%`);
      paramIndex += 2;
    }

    const countResult = await query(
      `SELECT COUNT(*) as total 
       FROM withdrawals w 
       JOIN users u ON w.user_id = u.id 
       ${whereClause}`,
      params
    );

    const withdrawals = await query(
      `SELECT w.*, u.name, u.email 
       FROM withdrawals w 
       JOIN users u ON w.user_id = u.id 
       ${whereClause} 
       ORDER BY w.created_at DESC 
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );

    const stats = await query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
        SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as approved_amount,
        SUM(CASE WHEN status = 'rejected' THEN amount ELSE 0 END) as rejected_amount,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count
       FROM withdrawals w ${whereClause}`,
      params
    );

    return NextResponse.json({
      withdrawals,
      total: countResult[0].total,
      stats: stats[0],
      page,
      limit
    });
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
