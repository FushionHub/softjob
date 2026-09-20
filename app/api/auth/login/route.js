import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { signToken } from '@/lib/auth';

// Self-healing: guarantees the users table exists on stale DBs.
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
      kyc_verified BOOLEAN DEFAULT FALSE,
      kyc_status VARCHAR(20) DEFAULT 'none',
      google_id VARCHAR(255) UNIQUE DEFAULT NULL,
      auth_provider VARCHAR(20) DEFAULT 'local',
      onboarding_completed BOOLEAN DEFAULT FALSE,
      onboarding_skipped BOOLEAN DEFAULT FALSE,
      last_login TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    _userSchemaReady = true;
  } catch (e) {
    console.error('ensureUserSchema failed:', e.message);
  }
}

function getPublicBaseUrl(request) {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  const host = request.headers.get('host');
  if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    return `${proto}://${host}`;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  return request.url;
}

function sanitizeRedirect(target) {
  if (!target || typeof target !== 'string') return '/dashboard';
  const t = target.trim();
  if (t.startsWith('//') || t.includes('localhost') || t.includes('127.0.0.1') || !t.startsWith('/') || t.startsWith('/login') || t.includes('n/dashboard') || t.includes('=')) {
    return '/dashboard';
  }
  return t;
}

function failRedirect(request, code) {
  const base = getPublicBaseUrl(request);
  const url = new URL('/login', base);
  url.searchParams.set('error', code);
  return NextResponse.redirect(url);
}

export async function POST(request) {
  try {
    await ensureUserSchema();
    const contentType = request.headers.get('content-type') || '';
    let email, password, redirectTo;

    if (contentType.includes('application/json')) {
      const body = await request.json();
      email = body.email;
      password = body.password;
      redirectTo = body.redirect;
    } else {
      const formData = await request.formData();
      email = formData.get('email');
      password = formData.get('password');
      redirectTo = formData.get('redirect') || '/dashboard';
    }

    if (!email || !password) {
      if (contentType.includes('application/json')) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
      }
      return failRedirect(request, 'missing_fields');
    }

    const users = await query(
      'SELECT * FROM users WHERE email = $1 OR username = $1',
      [email]
    );

    if (users.length === 0) {
      if (contentType.includes('application/json')) {
        return NextResponse.json({ error: 'Invalid email/username or password' }, { status: 401 });
      }
      return failRedirect(request, 'invalid_credentials');
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      if (contentType.includes('application/json')) {
        return NextResponse.json({ error: 'Invalid email/username or password' }, { status: 401 });
      }
      return failRedirect(request, 'invalid_credentials');
    }

    try {
      await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
    } catch (e) {}

    const token = await signToken({ userId: user.id });
    const destination = sanitizeRedirect(redirectTo);

    if (contentType.includes('application/json')) {
      const response = NextResponse.json({
        success: true,
        message: 'Login successful',
        redirect: destination,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          email_verified: user.email_verified,
        }
      });
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
      return response;
    }

    const base = getPublicBaseUrl(request);
    const redirectUrl = new URL(destination, base);
    const response = NextResponse.redirect(redirectUrl, 302);
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    console.error('Login error:', error);
    if (request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
    }
    const base = getPublicBaseUrl(request);
    const url = new URL('/login', base);
    url.searchParams.set('error', 'server_error');
    return NextResponse.redirect(url);
  }
}
