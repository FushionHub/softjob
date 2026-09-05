import { NextResponse } from 'next/server';
import { getAdminSession, logAdminAction } from '@/lib/admin-auth';
import { query } from '@/lib/db';
import { safeSend, sendKycApprovedToUser, sendKycRejectedToUser } from '@/lib/email';

// POST /api/admin/users/[id]/kyc — approve/reject a user's pending KYC
// submission, looked up by user id (used by the user-detail modal).
// Body: { action: 'approved' | 'rejected', rejection_reason?: string }
export async function POST(request, { params }) {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { action, rejection_reason } = body;

        if (!['approved', 'rejected'].includes(action)) {
            return NextResponse.json({ error: 'Action must be "approved" or "rejected"' }, { status: 400 });
        }
        if (action === 'rejected' && !rejection_reason) {
            return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
        }

        const existing = await query(
            `SELECT k.*, u.email as user_email, u.name as user_name
             FROM kyc_submissions k
             JOIN users u ON u.id = k.user_id
             WHERE k.user_id = $1 AND k.status = 'pending'
             ORDER BY k.created_at DESC LIMIT 1`,
            [id]
        );

        if (!existing[0]) {
            return NextResponse.json({ error: 'No pending KYC submission for this user' }, { status: 404 });
        }

        const sub = existing[0];
        await query(
            `UPDATE kyc_submissions
             SET status = $1, rejection_reason = $2, reviewed_at = NOW(), reviewed_by = $3, updated_at = NOW()
             WHERE id = $4`,
            [action, action === 'rejected' ? rejection_reason : null, admin.id, sub.id]
        );

        await query('UPDATE users SET kyc_verified = $1, kyc_status = $2, updated_at = NOW() WHERE id = $3', [
            action === 'approved',
            action,
            id,
        ]);

        if (action === 'approved') {
            safeSend(sendKycApprovedToUser({ to: sub.user_email, name: sub.user_name }));
        } else {
            safeSend(sendKycRejectedToUser({ to: sub.user_email, name: sub.user_name, reason: rejection_reason }));
        }

        await logAdminAction(admin.id, 'kyc_review', 'kyc_submission', sub.id, { status: action, user_id: parseInt(id) });

        return NextResponse.json({ success: true, status: action, submission_id: sub.id });
    } catch (error) {
        console.error('User KYC action error:', error);
        return NextResponse.json({ error: 'Failed to review KYC submission' }, { status: 500 });
    }
}
