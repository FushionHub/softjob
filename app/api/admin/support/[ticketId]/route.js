import { NextResponse } from 'next/server';
import { getAdminSession, logAdminAction } from '@/lib/admin-auth';
import { query } from '@/lib/db';

// PATCH /api/admin/support/[ticketId] — update ticket status from admin desk.
export async function PATCH(request, { params }) {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { ticketId } = await params;
        const body = await request.json();
        const { status } = body;

        const allowed = ['open', 'in_progress', 'resolved', 'closed'];
        if (!status || !allowed.includes(status)) {
            return NextResponse.json({ error: `Status must be one of: ${allowed.join(', ')}` }, { status: 400 });
        }

        const rows = await query(
            'UPDATE support_tickets SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING id, status',
            [status, ticketId]
        );

        if (!rows.length) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        await logAdminAction(admin.id, 'support_status', 'support_ticket', parseInt(ticketId), { status });

        return NextResponse.json({ success: true, ticket: rows[0] });
    } catch (error) {
        console.error('Support status error:', error);
        return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
    }
}
