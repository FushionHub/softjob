import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { signToken } from '@/lib/auth';
import crypto from 'crypto';

async function verifyGoogleToken(idToken) {
  // Verify via Google tokeninfo endpoint — no library needed
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
  if (!res.ok) {
    const err = await res.text().catch(()=>'');
    throw new Error(`Google token verification failed: ${res.status} ${err}`);
  }
  const payload = await res.json();
  // Validate audience matches our client ID (if set)
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (clientId && payload.aud && payload.aud !== clientId) {
    // Allow multiple client IDs comma-separated
    const allowed = String(clientId).split(',').map(s=>s.trim());
    if (!allowed.includes(payload.aud)) {
      throw new Error('Google token audience mismatch');
    }
  }
  if (payload.email_verified !== 'true' && payload.email_verified !== true) {
    throw new Error('Google email not verified');
  }
  return payload; // contains email, name, picture, sub
}

export async function POST(req) {
  try {
    const body = await req.json().catch(()=>({}));
    const { credential, id_token, idToken, referrer } = body;
    const token = credential || id_token || idToken;
    if (!token) return NextResponse.json({ error: 'Missing Google credential' }, { status: 400 });

    let payload;
    try {
      payload = await verifyGoogleToken(token);
    } catch (e) {
      return NextResponse.json({ error: e.message || 'Invalid Google token' }, { status: 401 });
    }

    const email = payload.email;
    const name = payload.name || email.split('@')[0];
    const picture = payload.picture || null;
    const googleId = payload.sub;

    if (!email) return NextResponse.json({ error: 'Google payload missing email' }, { status: 400 });

    // Try to find existing user by email or google_id
    let users = await query('SELECT * FROM users WHERE email=$1 OR google_id=$2 LIMIT 1', [email, googleId]).catch(async (e)=>{
      // If google_id column missing, fallback to email only
      if (e.code === '42703') {
        try {
          await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE DEFAULT NULL`);
          await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) DEFAULT 'local'`);
          await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE`);
          await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_skipped BOOLEAN DEFAULT FALSE`);
        } catch {}
        return await query('SELECT * FROM users WHERE email=$1 LIMIT 1', [email]);
      }
      throw e;
    });

    let user = users[0];
    let isNewUser = false;

    if (!user) {
      // Create new user from Google
      const usernameBase = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      let username = usernameBase;
      // Ensure username unique
      for (let i=0; i<5; i++) {
        const exists = await query('SELECT id FROM users WHERE username=$1', [username]);
        if (!exists.length) break;
        username = usernameBase + Math.floor(Math.random()*10000);
      }
      const randomPass = crypto.randomBytes(32).toString('hex');
      const bcrypt = await import('bcryptjs');
      const hashed = await bcrypt.hash(randomPass, 10);
      const referralCode = username.toUpperCase().slice(0,4) + Math.random().toString(36).slice(2,6).toUpperCase() + Date.now().toString().slice(-3);

      // Handle referrer if passed
      let referrerId = null;
      if (referrer) {
        const ref = await query('SELECT id FROM users WHERE referral_code=$1 OR username=$1 OR email=$1 LIMIT 1', [referrer]).catch(()=>[]);
        if (ref.length) referrerId = ref[0].id;
      }

      const inserted = await query(
        `INSERT INTO users (name, email, username, phone, password, referrer, referral_code, email_verified, accept_terms, avatar_url, google_id, auth_provider, onboarding_completed)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
        [name, email, username, null, hashed, referrer || null, referralCode, true, true, picture, googleId, 'google', false]
      );
      user = inserted[0];
      isNewUser = true;

      if (referrerId) {
        try {
          await query('INSERT INTO referrals (referrer_id, referred_id, bonus_amount, status) VALUES ($1,$2,$3,$4)', [referrerId, user.id, 0, 'pending']);
          await query('INSERT INTO notifications (user_id,title,message,type) VALUES ($1,$2,$3,$4)', [referrerId, 'New Referral!', `${name} (@${username}) joined via Google with your code.`, 'success']);
        } catch {}
      }
      try { await query('INSERT INTO notifications (user_id,title,message,type) VALUES ($1,$2,$3,$4)', [user.id, 'Welcome via Google ✓', 'Your Google account is connected. Complete onboarding to unlock full features.', 'success']); } catch {}
    } else {
      // Existing user: link google_id if not set
      if (!user.google_id) {
        try { await query('UPDATE users SET google_id=$1, auth_provider=$2, avatar_url=COALESCE(avatar_url,$3) WHERE id=$4', [googleId, user.auth_provider === 'google' ? 'google' : 'local', picture, user.id]); } catch {}
      }
      // Update last_login and avatar if missing
      try { await query('UPDATE users SET last_login=CURRENT_TIMESTAMP, avatar_url=COALESCE(avatar_url,$1) WHERE id=$2', [picture, user.id]); } catch {}
    }

    // Ensure onboarding status columns exist
    try {
      const fresh = await query('SELECT onboarding_completed, onboarding_skipped FROM users WHERE id=$1', [user.id]);
      if (fresh.length) user.onboarding_completed = fresh[0].onboarding_completed;
    } catch {}

    const needsOnboarding = !user.onboarding_completed && !user.onboarding_skipped && (!user.username || !user.phone || user.username.startsWith('google') || isNewUser);
    // For Google users, if phone is null, they need onboarding
    const onboardingRequired = isNewUser || !user.phone || !user.username || user.onboarding_completed === false;

    const authToken = await signToken({ userId: user.id });
    const response = NextResponse.json({
      success: true,
      isNewUser,
      needsOnboarding: onboardingRequired,
      user: { id: user.id, name: user.name, email: user.email, username: user.username, avatar_url: user.avatar_url || picture, email_verified: true },
    });
    response.cookies.set('auth_token', authToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60*60*24*7 });
    return response;
  } catch (e) {
    console.error('Google auth error', e);
    return NextResponse.json({ error: e.message || 'Google login failed' }, { status: 500 });
  }
}
