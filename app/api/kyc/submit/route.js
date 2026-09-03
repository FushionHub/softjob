import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { sendKycSubmittedToAdmin, sendKycSubmittedToUser, safeSend } from '@/lib/email';

export async function POST(req) {
  try {
    if (process.env.KYC_ENABLED === 'false' || process.env.KYC_ENABLED === '0') {
      return NextResponse.json({ error: 'KYC is disabled' }, { status: 403 });
    }
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      full_name, date_of_birth, gender, country, city, address, postal_code,
      id_type, id_number, id_front_url, id_back_url, selfie_url, proof_of_address_url,
      occupation, source_of_funds
    } = body;

    // Required
    const required = { full_name, date_of_birth, gender, country, city, address, id_type, id_number, id_front_url, selfie_url };
    for (const [k,v] of Object.entries(required)) if (!v) return NextResponse.json({ error: `Missing ${k}` }, { status: 400 });

    const userRows = await query('SELECT id, name, email, username, kyc_verified, kyc_status FROM users WHERE id=$1', [session.userId]);
    if (!userRows.length) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const user = userRows[0];
    if (user.kyc_verified) return NextResponse.json({ error: 'Already verified—editing is locked' }, { status: 400 });

    // Check existing pending/approved
    const existing = await query('SELECT status FROM kyc_submissions WHERE user_id=$1', [session.userId]);
    if (existing.length && existing[0].status === 'pending') return NextResponse.json({ error: 'KYC already pending review' }, { status: 409 });
    if (existing.length && existing[0].status === 'approved') return NextResponse.json({ error: 'KYC already approved' }, { status: 409 });

    // Upsert
    if (existing.length) {
      await query(
        `UPDATE kyc_submissions SET full_name=$1, date_of_birth=$2, gender=$3, country=$4, city=$5, address=$6, postal_code=$7, id_type=$8, id_number=$9, id_front_url=$10, id_back_url=$11, selfie_url=$12, proof_of_address_url=$13, occupation=$14, source_of_funds=$15, status='pending', rejection_reason=NULL, submitted_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE user_id=$16`,
        [full_name, date_of_birth, gender, country, city, address, postal_code||null, id_type, id_number, id_front_url, id_back_url||null, selfie_url, proof_of_address_url||null, occupation||null, source_of_funds||null, session.userId]
      );
    } else {
      await query(
        `INSERT INTO kyc_submissions (user_id, full_name, date_of_birth, gender, country, city, address, postal_code, id_type, id_number, id_front_url, id_back_url, selfie_url, proof_of_address_url, occupation, source_of_funds, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'pending')`,
        [session.userId, full_name, date_of_birth, gender, country, city, address, postal_code||null, id_type, id_number, id_front_url, id_back_url||null, selfie_url, proof_of_address_url||null, occupation||null, source_of_funds||null]
      );
    }
    await query("UPDATE users SET kyc_status='pending', date_of_birth=$1, gender=$2, country=$3, city=$4, address=$5, postal_code=$6, id_type=$7, id_number=$8, occupation=$9, source_of_funds=$10, updated_at=CURRENT_TIMESTAMP WHERE id=$11", [date_of_birth, gender, country, city, address, postal_code||null, id_type, id_number, occupation||null, source_of_funds||null, session.userId]);

    // Notifications
    try { await query('INSERT INTO notifications (user_id,title,message,type) VALUES ($1,$2,$3,$4)', [session.userId, 'KYC Submitted', 'Your KYC is under review. You will be emailed on verification (within 24h).', 'info']); } catch {}

    // Real-time emails to both user and admin (non-blocking)
    safeSend(sendKycSubmittedToUser({ to: user.email, name: user.name }));
    if (process.env.KYC_ADMIN_NOTIFY !== 'false') {
      safeSend(sendKycSubmittedToAdmin(user, { full_name, date_of_birth, gender, country, city, address, postal_code, id_type, id_number, occupation, source_of_funds }));
    }

    return NextResponse.json({ success: true, message: 'KYC submitted — under review. Emails sent to you and admin.', status: 'pending' });
  } catch (e) {
    console.error('KYC submit', e);
    return NextResponse.json({ error: 'Failed to submit KYC' }, { status: 500 });
  }
}
