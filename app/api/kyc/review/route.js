import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { sendKycApprovedToUser, sendKycRejectedToUser, safeSend } from '@/lib/email';

export async function POST(req) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const adminEmail = process.env.ADMIN_EMAIL;
    const me = await query('SELECT email FROM users WHERE id=$1', [session.userId]);
    if (!me.length || me[0].email !== adminEmail) return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const { userId, action, reason } = await req.json();
    if (!userId || !['approve','reject'].includes(action)) return NextResponse.json({ error: 'userId and action (approve|reject) required' }, { status: 400 });

    const kyc = await query('SELECT * FROM kyc_submissions WHERE user_id=$1', [userId]);
    if (!kyc.length) return NextResponse.json({ error: 'No submission found' }, { status: 404 });

    const targetUser = await query('SELECT email, name, username FROM users WHERE id=$1', [userId]);
    if (!targetUser.length) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (action === 'approve') {
      await query("UPDATE kyc_submissions SET status='approved', reviewed_at=CURRENT_TIMESTAMP, reviewed_by=$1, updated_at=CURRENT_TIMESTAMP WHERE user_id=$2", [me[0].email, userId]);
      await query("UPDATE users SET kyc_verified=true, kyc_status='approved', updated_at=CURRENT_TIMESTAMP WHERE id=$1", [userId]);
      await query('INSERT INTO notifications (user_id,title,message,type) VALUES ($1,$2,$3,$4)', [userId, 'KYC Verified ✓', 'Your identity is verified. Full platform access unlocked.', 'success']);
      safeSend(sendKycApprovedToUser({ to: targetUser[0].email, name: targetUser[0].name }));
      return NextResponse.json({ success: true, status: 'approved' });
    } else {
      if (!reason) return NextResponse.json({ error: 'Rejection reason required' }, { status: 400 });
      await query("UPDATE kyc_submissions SET status='rejected', rejection_reason=$1, reviewed_at=CURRENT_TIMESTAMP, reviewed_by=$2, updated_at=CURRENT_TIMESTAMP WHERE user_id=$3", [reason, me[0].email, userId]);
      await query("UPDATE users SET kyc_verified=false, kyc_status='rejected', updated_at=CURRENT_TIMESTAMP WHERE id=$1", [userId]);
      await query('INSERT INTO notifications (user_id,title,message,type) VALUES ($1,$2,$3,$4)', [userId, 'KYC Rejected', `Reason: ${reason}. Please resubmit with correct documents.`, 'error']);
      safeSend(sendKycRejectedToUser({ to: targetUser[0].email, name: targetUser[0].name, reason }));
      return NextResponse.json({ success: true, status: 'rejected' });
    }
  } catch (e) {
    console.error('KYC review', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
