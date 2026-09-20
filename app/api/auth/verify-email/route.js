import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/email';

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

export async function GET(request) {
  const base = getPublicBaseUrl(request);
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Verify token
    const decoded = await verifyToken(token);

    if (!decoded || !decoded.email) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Update user as verified
    const result = await query(
      'UPDATE users SET email_verified = true, verification_token = NULL WHERE email = $1 RETURNING name, id',
      [decoded.email]
    );

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = result[0];

    // Send welcome email
    await sendWelcomeEmail(decoded.email, user.name);

    // Redirect to login with success message
    return NextResponse.redirect(
      new URL('/login?verified=true', base)
    );
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.redirect(
      new URL('/login?error=invalid_token', base)
    );
  }
}
