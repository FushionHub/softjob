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
        const status = searchParams.get('status');
        const offset = (page - 1) * limit;

        let where = '1=1';
        const params = [];
        let paramIndex = 1;

        if (status) {
            where += ` AND t.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        const countResult = await query(
            `SELECT COUNT(*) as total FROM support_tickets t WHERE ${where}`,
            params
        );
        const total = parseInt(countResult[0]?.total) || 0;

        const tickets = await query(
            `SELECT t.id, t.user_id, t.subject, t.status, t.priority, t.category,
                    t.created_at, t.last_reply_at,
                    u.name as user_name, u.email as user_email, u.username,
                    (SELECT COUNT(*) FROM support_messages sm WHERE sm.ticket_id = t.id AND sm.is_read = false AND sm.sender_type = 'user') as unread_count,
                    (SELECT sm.message FROM support_messages sm WHERE sm.ticket_id = t.id ORDER BY sm.created_at DESC LIMIT 1) as last_message,
                    (SELECT sm.created_at FROM support_messages sm WHERE sm.ticket_id = t.id ORDER BY sm.created_at DESC LIMIT 1) as last_message_at
             FROM support_tickets t
             JOIN users u ON u.id = t.user_id
             WHERE ${where}
             ORDER BY t.last_reply_at DESC NULLS LAST, t.created_at DESC
             LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, limit, offset]
        );

        return NextResponse.json({ tickets, total, page, limit });
    } catch (error) {
        console.error('Support tickets list error:', error);
        return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { ticket_id, message, message_type = 'text', file_url, file_name } = body;

        if (!ticket_id || !message) {
            return NextResponse.json({ error: 'ticket_id and message are required' }, { status: 400 });
        }

        const validTypes = ['text', 'image', 'file', 'voice'];
        if (!validTypes.includes(message_type)) {
            return NextResponse.json({ error: 'message_type must be text, image, file, or voice' }, { status: 400 });
        }

        const ticketRows = await query(
            'SELECT id, status FROM support_tickets WHERE id = $1',
            [ticket_id]
        );

        if (!ticketRows[0]) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        const msgResult = await query(
            `INSERT INTO support_messages (ticket_id, sender_id, sender_type, message, message_type, file_url, file_name, is_read, created_at)
             VALUES ($1, $2, 'admin', $3, $4, $5, $6, true, NOW())
             RETURNING id, created_at`,
            [ticket_id, admin.id, message, message_type, file_url || null, file_name || null]
        );

        await query(
            `UPDATE support_tickets
             SET last_reply_at = NOW(), status = CASE WHEN status = 'closed' THEN 'open' ELSE status END, updated_at = NOW()
             WHERE id = $1`,
            [ticket_id]
        );

        await logAdminAction(admin.id, 'support_reply', 'support_ticket', ticket_id, {
            message_type,
            has_file: !!file_url,
        });

        return NextResponse.json({
            message: {
                id: msgResult[0].id,
                ticket_id,
                sender_id: admin.id,
                sender_type: 'admin',
                message,
                message_type,
                file_url,
                file_name,
                created_at: msgResult[0].created_at,
            }
        }, { status: 201 });
    } catch (error) {
        console.error('Support reply error:', error);
        return NextResponse.json({ error: 'Failed to send reply' }, { status: 500 });
    }
}
