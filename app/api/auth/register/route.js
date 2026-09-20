import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { signToken } from '@/lib/auth';
import { sendVerificationEmail, sendAdminNotification } from '@/lib/email';

// Self-healing: guarantees the users table + auth columns exist on stale DBs.
let _userSchemaReady = false;
async function ensureUserSchema() {
  if (_userSchemaReady) return;
  try {
    await query(`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      username VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(255),
      password VARCHAR(255) NOT NULL,
      referrer VARCHAR(255) DEFAULT NULL,
      referral_code VARCHAR(20) UNIQUE DEFAULT NULL,
      email_verified BOOLEAN DEFAULT FALSE,
      verification_token TEXT DEFAULT NULL,
      accept_terms BOOLEAN DEFAULT FALSE,
      balance DECIMAL(15,2) DEFAULT 0.00,
      total_profit DECIMAL(15,2) DEFAULT 0.00,
      total_bonus DECIMAL(15,2) DEFAULT 0.00,
      total_withdrawal DECIMAL(15,2) DEFAULT 0.00,
      total_deposit DECIMAL(15,2) DEFAULT 0.00,
      kyc_verified BOOLEAN DEFAULT FALSE,
      kyc_status VARCHAR(20) DEFAULT 'none',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    const cols = [
      ['referral_code', 'VARCHAR(20) UNIQUE DEFAULT NULL'],
      ['verification_token', 'TEXT DEFAULT NULL'],
      ['referrer', 'VARCHAR(255) DEFAULT NULL'],
      ['email_verified', 'BOOLEAN DEFAULT FALSE'],
      ['accept_terms', 'BOOLEAN DEFAULT FALSE'],
      ['balance', 'DECIMAL(15,2) DEFAULT 0.00'],
      ['total_profit', 'DECIMAL(15,2) DEFAULT 0.00'],
      ['total_bonus', 'DECIMAL(15,2) DEFAULT 0.00'],
      ['total_withdrawal', 'DECIMAL(15,2) DEFAULT 0.00'],
      ['total_deposit', 'DECIMAL(15,2) DEFAULT 0.00'],
      ['kyc_verified', 'BOOLEAN DEFAULT FALSE'],
      ['kyc_status', "VARCHAR(20) DEFAULT 'none'"],
      ['google_id', 'VARCHAR(255) UNIQUE DEFAULT NULL'],
      ['auth_provider', "VARCHAR(20) DEFAULT 'local'"],
      ['onboarding_completed', 'BOOLEAN DEFAULT FALSE'],
      ['onboarding_skipped', 'BOOLEAN DEFAULT FALSE'],
      ['last_login', 'TIMESTAMP NULL DEFAULT NULL'],
    ];
    for (const [col, def] of cols) {
      try { await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col} ${def}`); } catch {}
    }
    _userSchemaReady = true;
  } catch (e) {
    console.error('ensureUserSchema failed:', e.message);
  }
}

function getPublicBaseUrl(request) {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  if (forwardedHost && !forwardedHost.includes('localhost') && !forwardedHost.includes('127.0.0.1')) {
    const proto = forwardedProto.split(',')[0].trim();
    const host = forwardedHost.split(',')[0].trim();
    return `${proto}://${host}`;
  }
  const host = request.headers.get('host');
  if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    const proto = forwardedProto.split(',')[0].trim();
    return `${proto}://${host}`;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      const parsed = new URL(process.env.NEXT_PUBLIC_APP_URL);
      if (parsed.hostname && !parsed.hostname.includes('localhost') && !parsed.hostname.includes('127.0.0.1')) {
        return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
      }
    } catch {}
  }
  try {
    const reqUrl = new URL(request.url);
    if (reqUrl.hostname && !reqUrl.hostname.includes('localhost') && !reqUrl.hostname.includes('127.0.0.1')) {
      return reqUrl.origin;
    }
  } catch {}
  return `${forwardedProto}://${forwardedHost || host || 'localhost:3000'}`;
}

export async function POST(request) {
  try {
    await ensureUserSchema();
    const { name, email, username, phone, password, referrer, acceptTerms } = await request.json();

    if (!name || !email || !username || !password) {
      return NextResponse.json(
        { error: 'Name, email, username, and password are required' },
        { status: 400 }
      );
    }

    if (!acceptTerms) {
      return NextResponse.json(
        { error: 'You must accept the Terms and Conditions' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase();

    // Check if user already exists
    const existingUsers = await query(
      'SELECT id, email, username FROM users WHERE LOWER(email) = $1 OR LOWER(username) = $2',
      [cleanEmail, cleanUsername]
    );

    if (existingUsers.length > 0) {
      const match = existingUsers[0];
      const emailMatches = match.email && match.email.toLowerCase() === cleanEmail;
      const usernameMatches = match.username && match.username.toLowerCase() === cleanUsername;
      
      let errorMsg = 'An account with this email or username already exists.';
      let conflictField = 'both';
      if (emailMatches && !usernameMatches) {
        errorMsg = 'An account with this email address already exists. Please log in.';
        conflictField = 'email';
      } else if (usernameMatches && !emailMatches) {
        errorMsg = 'This username is already taken. Please choose another username.';
        conflictField = 'username';
      }

      return NextResponse.json(
        { error: errorMsg, conflict: conflictField },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate verification token & referral_code (generic)
    const verificationToken = await signToken({ email: cleanEmail }, '24h');
    const referralCode = cleanUsername.toUpperCase().slice(0,4) + Math.random().toString(36).slice(2,6).toUpperCase() + Date.now().toString().slice(-3);

    // Resolve referrer: supports referral_code OR username OR email
    let referrerId = null;
    if (referrer) {
      const ref = await query('SELECT id, username FROM users WHERE referral_code=$1 OR username=$1 OR email=$1 LIMIT 1', [referrer.trim()]);
      if (ref.length) referrerId = ref[0].id;
    }

    // Insert user into database with email_verified = false
    const result = await query(
      `INSERT INTO users (name, email, username, phone, password, referrer, referral_code, verification_token, email_verified, accept_terms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [name.trim(), cleanEmail, cleanUsername, phone ? phone.trim() : null, hashedPassword, referrer ? referrer.trim() : null, referralCode, verificationToken, false, true]
    );

    const userId = result[0].id;

    // Create referral entry & realtime notification/bonus placeholder
    if (referrerId) {
      try {
        await query('INSERT INTO referrals (referrer_id, referred_id, bonus_amount, status) VALUES ($1,$2,$3,$4)', [referrerId, userId, 0, 'pending']);
        await query('INSERT INTO notifications (user_id,title,message,type,link) VALUES ($1,$2,$3,$4,$5)', [referrerId, 'New Referral!', `${name} (@${cleanUsername}) joined with your code. You will earn 5% when they deposit.`, 'success', '/referrals']);
        await query('INSERT INTO notifications (user_id,title,message,type) VALUES ($1,$2,$3,$4)', [userId, 'Welcome! Referral Applied', `You joined via referral code ${referrer}. Start investing to earn together.`, 'info', '/dashboard']);
      } catch (e) { console.error('referral create failed', e.message); }
    } else {
      try { await query('INSERT INTO notifications (user_id,title,message,type) VALUES ($1,$2,$3,$4)', [userId, 'Welcome to Emporium Capitals', 'Verify your email to unlock deposits & trading. Your referral code is '+referralCode, 'info', '/dashboard']); } catch {}
    }

    // Try to send verification email with public base URL, but don't fail if SMTP is not configured
    try {
      const publicBase = getPublicBaseUrl(request);
      await sendVerificationEmail(cleanEmail, name.trim(), verificationToken, publicBase);
    } catch (emailError) {
      console.error('Failed to send verification email (SMTP not configured):', emailError.message);
      // Continue anyway - user is already registered
    }

    // Try to send admin notification, but don't fail if SMTP is not configured
    try {
      await sendAdminNotification(email, name, username);
    } catch (adminEmailError) {
      console.error('Failed to send admin notification (SMTP not configured):', adminEmailError.message);
      // Continue anyway
    }

    return NextResponse.json({
      message: 'Registration successful! Please check your email to verify your account.',
      userId
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
