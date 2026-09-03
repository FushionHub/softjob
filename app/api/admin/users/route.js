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
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params = [];
    let paramIndex = 1;

    if (search) {
      whereClause = `WHERE (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR username ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status === 'active') {
      whereClause += whereClause ? ' AND is_active = true' : 'WHERE is_active = true';
    } else if (status === 'inactive') {
      whereClause += whereClause ? ' AND is_active = false' : 'WHERE is_active = false';
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM users ${whereClause}`,
      params
    );

    const usersResult = await query(
      `SELECT id, name, email, username, balance, total_deposit, total_withdrawal,
              kyc_status, is_active, created_at, last_login
       FROM users ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    const total = parseInt(countResult[0].count);
    const totalPages = Math.ceil(total / limit);

    await logAdminAction(admin.id, 'list_users', 'user', null, { search, status, page, limit });

    return NextResponse.json({
      users: usersResult,
      total,
      page,
      totalPages
    });
  } catch (error) {
    console.error('List users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
