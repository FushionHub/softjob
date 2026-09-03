import { NextResponse } from 'next/server';
import { getAdminSession, logAdminAction } from '@/lib/admin-auth';
import { query } from '@/lib/db';
import { safeSend, sendKycApprovedToUser, sendKycRejectedToUser } from '@/lib/email';

export async function GET(request, { params }) {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const rows = await query(
            `SELECT k.*,
                    u.name as user_name, u.email as user_email, u.username, u.phone as user_phone,
                    u.country as user_country, u.kyc_verified as current_kyc_verified
             FROM kyc_submissions k
             JOIN users u ON u.id = k.user_id
             WHERE k.id = $1`,
            [id]
        );

        if (!rows[0]) {
            return NextResponse.json({ error: 'KYC submission not found' }, { status: 404 });
        }

        return NextResponse.json({ kyc: rows[0] });
    } catch (error) {
        console.error('KYC get error:', error);
        return NextResponse.json({ error: 'Failed to fetch KYC submission' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { status, rejection_reason } = body;

        if (!status || !['approved', 'rejected'].includes(status)) {
            return NextResponse.json({ error: 'Status must be "approved" or "rejected"' }, { status: 400 });
        }

        if (status === 'rejected' && !rejection_reason) {
            return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
        }

        const existing = await query(
            `SELECT k.*, u.email as user_email, u.name as user_name
             FROM kyc_submissions k
             JOIN users u ON u.id = k.user_id
             WHERE k.id = $1`,
            [id]
        );

        if (!existing[0]) {
            return NextResponse.json({ error: 'KYC submission not found' }, { status: 404 });
        }

        if (existing[0].status !== 'pending') {
            return NextResponse.json({ error: 'Only pending submissions can be reviewed' }, { status: 400 });
        }

        await query(
            `UPDATE kyc_submissions
             SET status = $1, rejection_reason = $2, reviewed_at = NOW(), reviewed_by = $3, updated_at = NOW()
             WHERE id = $4`,
            [status, status === 'rejected' ? rejection_reason : null, admin.id, id]
        );

        const kycVerified = status === 'approved';
        await query(
            `UPDATE users
             SET kyc_verified = $1, kyc_status = $2, updated_at = NOW()
             WHERE id = $3`,
            [kycVerified, status, existing[0].user_id]
        );

        if (status === 'approved') {
            safeSend(sendKycApprovedToUser({ to: existing[0].user_email, name: existing[0].user_name }));
        } else {
            safeSend(sendKycRejectedToUser({
                to: existing[0].user_email,
                name: existing[0].user_name,
                reason: rejection_reason
            }));
        }

        await logAdminAction(admin.id, 'kyc_review', 'kyc_submission', id, {
            status,
            rejection_reason: rejection_reason || null,
            user_id: existing[0].user_id,
        });

        return NextResponse.json({ success: true, status });
    } catch (error) {
        console.error('KYC review error:', error);
        return NextResponse.json({ error: 'Failed to review KYC submission' }, { status: 500 });
    }
}
