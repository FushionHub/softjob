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
        const status = searchParams.get('status') || 'all';
        const userId = searchParams.get('user_id');
        const offset = (page - 1) * limit;

        let where = '1=1';
        const params = [];
        let paramIndex = 1;

        if (status !== 'all') {
            where += ` AND k.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (userId) {
            where += ` AND k.user_id = $${paramIndex}`;
            params.push(userId);
            paramIndex++;
        }

        const countResult = await query(
            `SELECT COUNT(*) as total FROM kyc_submissions k WHERE ${where}`,
            params
        );
        const total = parseInt(countResult[0]?.total) || 0;

        const submissions = await query(
            `SELECT k.id, k.user_id, k.full_name, k.date_of_birth, k.gender, k.country, k.country as nationality, k.city, k.address, k.postal_code,
                    k.id_type, k.id_number, k.occupation, k.source_of_funds,
                    k.id_front_url, k.id_front_url as front_image_url,
                    k.id_back_url, k.id_back_url as back_image_url,
                    k.selfie_url, k.proof_of_address_url, k.status, k.rejection_reason,
                    k.submitted_at, k.reviewed_at, k.reviewed_by, k.created_at, k.updated_at,
                    u.name as user_name, u.email as user_email, u.username, u.phone as user_phone
             FROM kyc_submissions k
             JOIN users u ON u.id = k.user_id
             WHERE ${where}
             ORDER BY k.created_at DESC
             LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, limit, offset]
        );

        const statsResult = await query(
            `SELECT
                COUNT(*) FILTER (WHERE status = 'pending') as pending,
                COUNT(*) FILTER (WHERE status = 'approved') as approved,
                COUNT(*) FILTER (WHERE status = 'rejected') as rejected
             FROM kyc_submissions`
        );

        return NextResponse.json({
            submissions,
            total,
            page,
            limit,
            stats: {
                pending: parseInt(statsResult[0]?.pending) || 0,
                approved: parseInt(statsResult[0]?.approved) || 0,
                rejected: parseInt(statsResult[0]?.rejected) || 0,
            }
        });
    } catch (error) {
        console.error('KYC list error:', error);
        return NextResponse.json({ error: 'Failed to fetch KYC submissions' }, { status: 500 });
    }
}
