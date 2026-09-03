import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

async function ensureOnboardingColumns() {
  for (const c of [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE DEFAULT NULL`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) DEFAULT 'local'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_skipped BOOLEAN DEFAULT FALSE`,
  ]) try { await query(c); } catch {}
}

export async function GET(req) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await ensureOnboardingColumns();
    const users = await query('SELECT id, name, email, username, phone, avatar_url, onboarding_completed, onboarding_skipped, google_id, auth_provider FROM users WHERE id=$1', [session.userId]);
    if (!users.length) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const u = users[0];
    const needsOnboarding = !u.onboarding_completed && !u.onboarding_skipped && (!u.phone || !u.username);
    return NextResponse.json({ user: u, needsOnboarding });
  } catch (e) {
    console.error('onboarding GET', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await ensureOnboardingColumns();
    const body = await req.json();
    const { action, username, phone, name } = body;

    if (action === 'skip') {
      await query('UPDATE users SET onboarding_skipped=true, onboarding_completed=true WHERE id=$1', [session.userId]);
      return NextResponse.json({ success: true, skipped: true });
    }

    // Complete onboarding
    if (!username || !phone) return NextResponse.json({ error: 'Username and phone required' }, { status: 400 });
    // Check username taken
    const exists = await query('SELECT id FROM users WHERE username=$1 AND id!=$2', [username, session.userId]);
    if (exists.length) return NextResponse.json({ error: 'Username already taken' }, { status: 409 });

    await query('UPDATE users SET username=$1, phone=$2, name=COALESCE($3, name), onboarding_completed=true, onboarding_skipped=false WHERE id=$4', [username, phone, name||null, session.userId]);
    try { await query('INSERT INTO notifications (user_id,title,message,type) VALUES ($1,$2,$3,$4)', [session.userId, 'Onboarding Complete ✓', 'Your profile is ready. Welcome to Emporium Capitals!', 'success']); } catch {}
    const updated = await query('SELECT id, name, email, username, phone, avatar_url FROM users WHERE id=$1', [session.userId]);
    return NextResponse.json({ success: true, user: updated[0] });
  } catch (e) {
    console.error('onboarding POST', e);
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
