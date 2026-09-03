import { NextResponse } from 'next/server';
import { getAdminSession, logAdminAction } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function GET(request, { params }) {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { ticketId } = await params;
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page')) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit')) || 50));
        const offset = (page - 1) * limit;

        const ticketRows = await query(
            `SELECT t.id, t.user_id, t.subject, t.status,
                    u.name as user_name, u.email as user_email
             FROM support_tickets t
             JOIN users u ON u.id = t.user_id
             WHERE t.id = $1`,
            [ticketId]
        );

        if (!ticketRows[0]) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        const countResult = await query(
            'SELECT COUNT(*) as total FROM support_messages WHERE ticket_id = $1',
            [ticketId]
        );
        const total = parseInt(countResult[0]?.total) || 0;

        const messages = await query(
            `SELECT sm.id, sm.ticket_id, sm.sender_id, sm.sender_type, sm.message,
                    sm.message_type, sm.file_url, sm.file_name, sm.is_read, sm.created_at,
                    CASE
                        WHEN sm.sender_type = 'user' THEN u.name
                        WHEN sm.sender_type = 'admin' THEN a.name
                        ELSE 'System'
                    END as sender_name,
                    CASE
                        WHEN sm.sender_type = 'user' THEN u.email
                        WHEN sm.sender_type = 'admin' THEN a.email
                        ELSE NULL
                    END as sender_email
             FROM support_messages sm
             LEFT JOIN users u ON u.id = sm.sender_id AND sm.sender_type = 'user'
             LEFT JOIN admin_users a ON a.id = sm.sender_id AND sm.sender_type = 'admin'
             WHERE sm.ticket_id = $1
             ORDER BY sm.created_at ASC
             LIMIT $2 OFFSET $3`,
            [ticketId, limit, offset]
        );

        await query(
            `UPDATE support_messages
             SET is_read = true
             WHERE ticket_id = $1 AND sender_type = 'user' AND is_read = false`,
            [ticketId]
        );

        await logAdminAction(admin.id, 'support_view_messages', 'support_ticket', ticketId, {
            message_count: messages.length,
        });

        return NextResponse.json({
            ticket: ticketRows[0],
            messages,
            total,
            page,
            limit,
        });
    } catch (error) {
        console.error('Support messages list error:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}
