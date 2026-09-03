import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';

async function ensureKycSchema() {
  // Auto-migrate: add missing KYC columns/tables if DB is old (fixes 42703 column does not exist). Idempotent.
  const stmts = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(20) DEFAULT 'none'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE DEFAULT NULL`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20) DEFAULT NULL`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT NULL`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT NULL`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT DEFAULT NULL`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20) DEFAULT NULL`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS id_type VARCHAR(50) DEFAULT NULL`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS id_number VARCHAR(100) DEFAULT NULL`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS occupation VARCHAR(100) DEFAULT NULL`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS source_of_funds VARCHAR(100) DEFAULT NULL`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(500) DEFAULT NULL`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS total_deposit DECIMAL(15,2) DEFAULT 0.00`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE DEFAULT NULL`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT TRUE`,
    `CREATE TABLE IF NOT EXISTS kyc_submissions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL UNIQUE,
      full_name VARCHAR(255) NOT NULL,
      date_of_birth DATE NOT NULL,
      gender VARCHAR(20) NOT NULL,
      country VARCHAR(100) NOT NULL,
      city VARCHAR(100) NOT NULL,
      address TEXT NOT NULL,
      postal_code VARCHAR(20) DEFAULT NULL,
      id_type VARCHAR(50) NOT NULL,
      id_number VARCHAR(100) NOT NULL,
      id_front_url TEXT NOT NULL,
      id_back_url TEXT DEFAULT NULL,
      selfie_url TEXT NOT NULL,
      proof_of_address_url TEXT DEFAULT NULL,
      occupation VARCHAR(100) DEFAULT NULL,
      source_of_funds VARCHAR(100) DEFAULT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      rejection_reason TEXT DEFAULT NULL,
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      reviewed_at TIMESTAMP DEFAULT NULL,
      reviewed_by VARCHAR(255) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
  ];
  for (const s of stmts) { try { await query(s); } catch (e) { /* ignore if already exists / permission */ } }
}

export async function GET(request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    let users;
    try {
      users = await query(
        'SELECT id, name, email, username, phone, balance, total_profit, total_bonus, total_withdrawal, total_deposit, kyc_verified, kyc_status, email_verified, avatar_url, referral_code, created_at, notifications_enabled, date_of_birth, gender, country, city, address, postal_code, id_type, id_number, occupation, source_of_funds, wallet_address FROM users WHERE id = $1',
        [session.userId]
      );
    } catch (e) {
      if (e?.code === '42703' || String(e?.message||'').includes('does not exist')) {
        await ensureKycSchema();
        // Fallback to core columns that always exist — prevents 500 loop
        users = await query('SELECT * FROM users WHERE id = $1', [session.userId]);
      } else throw e;
    }
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const user = users[0];
    user.balance = parseFloat(user.balance || 0);
    user.total_profit = parseFloat(user.total_profit || 0);
    user.total_bonus = parseFloat(user.total_bonus || 0);
    user.total_withdrawal = parseFloat(user.total_withdrawal || 0);
    user.total_deposit = parseFloat(user.total_deposit || 0);
    // Defaults for newly added columns when DB was old
    if (user.kyc_status === undefined) user.kyc_status = user.kyc_verified ? 'approved' : 'none';
    if (user.kyc_verified === undefined) user.kyc_verified = false;
    // Ensure referral_code exists
    if (!user.referral_code) {
      const code = (user.username?.toUpperCase().slice(0,4) || 'EMP') + Math.random().toString(36).slice(2,6).toUpperCase() + user.id;
      try { await query('UPDATE users SET referral_code=$1 WHERE id=$2', [code, user.id]); user.referral_code = code; } catch {}
    }
    // Include KYC env toggles for client
    user.kyc_enabled = process.env.KYC_ENABLED !== 'false';
    user.kyc_lock = process.env.KYC_LOCK_EDIT_AFTER_VERIFIED !== 'false';
    return NextResponse.json(user);
  } catch (error) {
    console.error('[API/user/me] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // KYC lock check — resilient if column missing
    if (process.env.KYC_LOCK_EDIT_AFTER_VERIFIED !== 'false') {
      try {
        const chk = await query('SELECT kyc_verified FROM users WHERE id=$1', [session.userId]);
        if (chk.length && chk[0].kyc_verified) return NextResponse.json({ error: 'Profile editing is locked after KYC verification. Contact support to make changes.' }, { status: 403 });
      } catch (e) {
        if (e?.code !== '42703') throw e;
        // column missing → not verified, allow edit
      }
    }

    const body = await request.json();
    const { name, username, phone, country, city, address, postal_code, date_of_birth, gender, occupation, source_of_funds, wallet_address, avatar_url } = body;

    if (username) {
      const ex = await query('SELECT id FROM users WHERE username=$1 AND id!=$2', [username, session.userId]);
      if (ex.length) return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }
    if (name && name.trim().length < 2) return NextResponse.json({ error: 'Name too short' }, { status: 400 });
    if (phone && !/^\+?[0-9\s\-\(\)]{7,20}$/.test(phone)) return NextResponse.json({ error: 'Invalid phone format' }, { status: 400 });

    try {
      await query(
        `UPDATE users SET
          name=COALESCE($1,name), username=COALESCE($2,username), phone=COALESCE($3,phone),
          country=COALESCE($4,country), city=COALESCE($5,city), address=COALESCE($6,address),
          postal_code=COALESCE($7,postal_code), date_of_birth=COALESCE($8,date_of_birth),
          gender=COALESCE($9,gender), occupation=COALESCE($10,occupation),
          source_of_funds=COALESCE($11,source_of_funds), wallet_address=COALESCE($12,wallet_address),
          avatar_url=COALESCE($13,avatar_url), updated_at=CURRENT_TIMESTAMP
         WHERE id=$14`,
        [name||null, username||null, phone||null, country||null, city||null, address||null, postal_code||null, date_of_birth||null, gender||null, occupation||null, source_of_funds||null, wallet_address||null, avatar_url||null, session.userId]
      );
    } catch (e) {
      if (e?.code === '42703') {
        await ensureKycSchema();
        // Retry once with core fields only
        await query('UPDATE users SET name=COALESCE($1,name), username=COALESCE($2,username), phone=COALESCE($3,phone), updated_at=CURRENT_TIMESTAMP WHERE id=$4', [name||null, username||null, phone||null, session.userId]);
      } else throw e;
    }
    let updated;
    try {
      updated = await query('SELECT id, name, email, username, phone, balance, total_profit, total_bonus, total_withdrawal, total_deposit, kyc_verified, kyc_status, email_verified, avatar_url, referral_code, created_at, country, city, address, postal_code, date_of_birth, gender, occupation, source_of_funds, wallet_address FROM users WHERE id=$1', [session.userId]);
    } catch (e) {
      if (e?.code === '42703') updated = await query('SELECT * FROM users WHERE id=$1', [session.userId]);
      else throw e;
    }
    try { await query('INSERT INTO notifications (user_id,title,message,type) VALUES ($1,$2,$3,$4)', [session.userId, 'Profile Updated', 'Your profile was updated successfully.', 'info']); } catch {}
    return NextResponse.json(updated[0]);
  } catch (e) {
    console.error('PUT /api/user/me', e);
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  }
}
