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
    const planId = searchParams.get('plan_id');
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` AND i.status = $${paramIndex++}`;
      params.push(status);
    }

    if (userId) {
      whereClause += ` AND i.user_id = $${paramIndex++}`;
      params.push(userId);
    }

    if (planId) {
      whereClause += ` AND i.plan_id = $${paramIndex++}`;
      params.push(planId);
    }

    const countResult = await query(
      `SELECT COUNT(*) as total 
       FROM user_investments i 
       JOIN users u ON i.user_id = u.id 
       JOIN investment_plans ip ON i.plan_id = ip.id 
       ${whereClause}`,
      params
    );

    const investments = await query(
      `SELECT i.*, u.name, u.email, 
              ip.name as plan_name, ip.percentage, ip.duration 
       FROM user_investments i 
       JOIN users u ON i.user_id = u.id 
       JOIN investment_plans ip ON i.plan_id = ip.id 
       ${whereClause} 
       ORDER BY i.created_at DESC 
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );

    const stats = await query(
      `SELECT 
        COUNT(*) as total,
        SUM(amount) as total_invested,
        SUM(profit) as total_profit,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count
       FROM user_investments i ${whereClause}`,
      params
    );

    return NextResponse.json({
      investments,
      total: countResult[0].total,
      stats: stats[0],
      page,
      limit
    });
  } catch (error) {
    console.error('Error fetching investments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
