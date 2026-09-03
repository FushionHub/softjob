import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function PUT(req) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { name, username, phone, avatar_url, currentPassword, newPassword } = body;

    const users = await query('SELECT * FROM users WHERE id=$1', [session.userId]);
    if (!users.length) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const user = users[0];

    // If password change requested
    if (newPassword) {
      if (!currentPassword) return NextResponse.json({ error: 'Current password required' }, { status: 400 });
      const ok = await bcrypt.compare(currentPassword, user.password);
      if (!ok) return NextResponse.json({ error: 'Current password incorrect' }, { status: 400 });
      const hashed = await bcrypt.hash(newPassword, 12);
      await query('UPDATE users SET password=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2', [hashed, session.userId]);
    }

    // Check username uniqueness
    if (username && username !== user.username) {
      const ex = await query('SELECT id FROM users WHERE username=$1', [username]);
      if (ex.length) return NextResponse.json({ error: 'Username taken' }, { status: 409 });
    }

    await query(
      `UPDATE users SET name=COALESCE($1,name), username=COALESCE($2,username), phone=COALESCE($3,phone), avatar_url=COALESCE($4,avatar_url), updated_at=CURRENT_TIMESTAMP WHERE id=$5`,
      [name||null, username||null, phone||null, avatar_url||null, session.userId]
    );

    const updated = await query('SELECT id,name,email,username,phone,avatar_url,balance,total_profit,total_bonus,total_withdrawal,kyc_verified,email_verified,created_at FROM users WHERE id=$1', [session.userId]);
    try { await query('INSERT INTO notifications (user_id,title,message,type) VALUES ($1,$2,$3,$4)', [session.userId, 'Profile Updated', 'Your profile was updated successfully', 'info']); } catch {}

    return NextResponse.json(updated[0]);
  } catch (e) {
    console.error('user update', e);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
