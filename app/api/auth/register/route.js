import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { signToken } from '@/lib/auth';
import { sendVerificationEmail, sendWelcomeEmail, sendAdminNotification } from '@/lib/email';

export async function POST(request) {
  try {
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

    // Check if user already exists
    const existingUsers = await query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'User with this email or username already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate verification token & referral_code (generic)
    const verificationToken = await signToken({ email }, '24h');
    const referralCode = username.toUpperCase().slice(0,4) + Math.random().toString(36).slice(2,6).toUpperCase() + Date.now().toString().slice(-3);

    // Resolve referrer: supports referral_code OR username OR email
    let referrerId = null;
    if (referrer) {
      const ref = await query('SELECT id, username FROM users WHERE referral_code=$1 OR username=$1 OR email=$1 LIMIT 1', [referrer]);
      if (ref.length) referrerId = ref[0].id;
    }

    // Insert user into database with email_verified = false
    const result = await query(
      `INSERT INTO users (name, email, username, phone, password, referrer, referral_code, verification_token, email_verified, accept_terms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [name, email, username, phone || null, hashedPassword, referrer || null, referralCode, verificationToken, false, true]
    );

    const userId = result[0].id;

    // Create referral entry & realtime notification/bonus placeholder
    if (referrerId) {
      try {
        await query('INSERT INTO referrals (referrer_id, referred_id, bonus_amount, status) VALUES ($1,$2,$3,$4)', [referrerId, userId, 0, 'pending']);
        await query('INSERT INTO notifications (user_id,title,message,type,link) VALUES ($1,$2,$3,$4,$5)', [referrerId, 'New Referral!', `${name} (@${username}) joined with your code. You will earn 5% when they deposit.`, 'success', '/referrals']);
        await query('INSERT INTO notifications (user_id,title,message,type) VALUES ($1,$2,$3,$4)', [userId, 'Welcome! Referral Applied', `You joined via referral code ${referrer}. Start investing to earn together.`, 'info', '/dashboard']);
      } catch (e) { console.error('referral create failed', e.message); }
    } else {
      try { await query('INSERT INTO notifications (user_id,title,message,type) VALUES ($1,$2,$3,$4)', [userId, 'Welcome to Emporium Capitals', 'Verify your email to unlock deposits & trading. Your referral code is '+referralCode, 'info', '/dashboard']); } catch {}
    }

    // Try to send verification email, but don't fail if SMTP is not configured
    try {
      await sendVerificationEmail(email, name, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email (SMTP not configured):', emailError.message);
      // Continue anyway - user is already verified
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
