import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

async function ensureKycTables() {
  try {
    await query(`CREATE TABLE IF NOT EXISTS kyc_submissions (
      id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL UNIQUE, full_name VARCHAR(255) NOT NULL, date_of_birth DATE NOT NULL, gender VARCHAR(20) NOT NULL,
      country VARCHAR(100) NOT NULL, city VARCHAR(100) NOT NULL, address TEXT NOT NULL, postal_code VARCHAR(20) DEFAULT NULL,
      id_type VARCHAR(50) NOT NULL, id_number VARCHAR(100) NOT NULL, id_front_url TEXT NOT NULL, id_back_url TEXT DEFAULT NULL,
      selfie_url TEXT NOT NULL, proof_of_address_url TEXT DEFAULT NULL, occupation VARCHAR(100) DEFAULT NULL, source_of_funds VARCHAR(100) DEFAULT NULL,
      status VARCHAR(20) DEFAULT 'pending', rejection_reason TEXT DEFAULT NULL, submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      reviewed_at TIMESTAMP DEFAULT NULL, reviewed_by VARCHAR(255) DEFAULT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);
    for (const c of [
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_verified BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(20) DEFAULT 'none'`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL`,
    ]) try { await query(c); } catch {}
  } catch {}
}

export async function GET(req) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const url = new URL(req.url);
    const isAdmin = url.searchParams.get('admin') === '1';
    if (isAdmin) {
      const adminEmail = process.env.ADMIN_EMAIL;
      try {
        const u = await query('SELECT email FROM users WHERE id=$1', [session.userId]);
        if (!u.length || u[0].email !== adminEmail) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        const all = await query('SELECT k.*, u.email, u.username, u.name FROM kyc_submissions k JOIN users u ON u.id=k.user_id ORDER BY k.submitted_at DESC');
        return NextResponse.json({ submissions: all });
      } catch (e) {
        if (e.code === '42P01' || String(e.message).includes('does not exist')) {
          await ensureKycTables();
          return NextResponse.json({ submissions: [] });
        }
        throw e;
      }
    }

    // Realtime auto-verify: if KYC_AUTO_APPROVE=true, auto-approve pending older than threshold
    const autoApprove = process.env.KYC_AUTO_APPROVE === 'true' || process.env.KYC_AUTO_VERIFY === 'true';
    const autoDelaySec = parseInt(process.env.KYC_AUTO_APPROVE_DELAY || '15', 10);
    if (autoApprove) {
      try {
        const pending = await query(`SELECT k.user_id, k.submitted_at, u.email, u.name FROM kyc_submissions k JOIN users u ON u.id=k.user_id WHERE k.status='pending' AND k.submitted_at < NOW() - INTERVAL '${autoDelaySec} seconds' LIMIT 10`);
        for (const p of pending) {
          await query("UPDATE kyc_submissions SET status='approved', reviewed_at=CURRENT_TIMESTAMP, reviewed_by='auto-verifier', updated_at=CURRENT_TIMESTAMP WHERE user_id=$1 AND status='pending'", [p.user_id]);
          await query("UPDATE users SET kyc_verified=true, kyc_status='approved', updated_at=CURRENT_TIMESTAMP WHERE id=$1", [p.user_id]);
          await query('INSERT INTO notifications (user_id,title,message,type) VALUES ($1,$2,$3,$4)', [p.user_id, 'KYC Verified ✓ (Auto)', 'Your identity was verified automatically in real-time. Full access unlocked.', 'success']);
          const { sendKycApprovedToUser, safeSend } = await import('@/lib/email');
          safeSend(sendKycApprovedToUser({ to: p.email, name: p.name }));
        }
      } catch (e) {
        if (e.code !== '42P01' && !String(e.message).includes('does not exist')) console.error('auto-approve error', e.message);
        else await ensureKycTables();
      }
    }

    try {
      const rows = await query('SELECT * FROM kyc_submissions WHERE user_id=$1', [session.userId]);
      const user = await query('SELECT kyc_verified, kyc_status FROM users WHERE id=$1', [session.userId]);
      return NextResponse.json({ submission: rows[0] || null, user: user[0] || {}, kycEnabled: process.env.KYC_ENABLED !== 'false', lockEdit: process.env.KYC_LOCK_EDIT_AFTER_VERIFIED !== 'false', autoApprove, pollingInterval: 3000 });
    } catch (e) {
      if (e.code === '42P01' || e.code === '42703' || String(e.message).includes('does not exist')) {
        await ensureKycTables();
        return NextResponse.json({ submission: null, user: { kyc_verified: false, kyc_status: 'none' }, kycEnabled: process.env.KYC_ENABLED !== 'false', lockEdit: process.env.KYC_LOCK_EDIT_AFTER_VERIFIED !== 'false', autoApprove, pollingInterval: 3000 });
      }
      throw e;
    }
  } catch (e) {
    console.error('KYC status', e);
    return NextResponse.json({ submission: null, user: {}, kycEnabled: true, lockEdit: true, pollingInterval: 3000 }, { status: 200 });
  }
}
