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
        const adminId = searchParams.get('admin_id');
        const action = searchParams.get('action');
        const targetType = searchParams.get('target_type');
        const dateFrom = searchParams.get('date_from');
        const dateTo = searchParams.get('date_to');
        const offset = (page - 1) * limit;

        let where = '1=1';
        const params = [];
        let paramIndex = 1;

        if (adminId) {
            where += ` AND l.admin_id = $${paramIndex}`;
            params.push(adminId);
            paramIndex++;
        }

        if (action) {
            where += ` AND l.action ILIKE $${paramIndex}`;
            params.push(`%${action}%`);
            paramIndex++;
        }

        if (targetType) {
            where += ` AND l.target_type = $${paramIndex}`;
            params.push(targetType);
            paramIndex++;
        }

        if (dateFrom) {
            where += ` AND l.created_at >= $${paramIndex}`;
            params.push(dateFrom);
            paramIndex++;
        }

        if (dateTo) {
            where += ` AND l.created_at <= $${paramIndex}`;
            params.push(dateTo);
            paramIndex++;
        }

        const countResult = await query(
            `SELECT COUNT(*) as total FROM admin_logs l WHERE ${where}`,
            params
        );
        const total = parseInt(countResult[0]?.total) || 0;

        const logs = await query(
            `SELECT l.id, l.admin_id, l.action, l.target_type, l.target_id,
                    l.details, l.ip_address, l.created_at,
                    a.name as admin_name, a.email as admin_email
             FROM admin_logs l
             LEFT JOIN admin_users a ON a.id = l.admin_id
             WHERE ${where}
             ORDER BY l.created_at DESC
             LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, limit, offset]
        );

        return NextResponse.json({ logs, total, page, limit });
    } catch (error) {
        console.error('Logs list error:', error);
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }
}
