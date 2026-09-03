import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/email';

export async function GET(request) {
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
      new URL('/login?verified=true', request.url)
    );
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.redirect(
      new URL('/login?error=invalid_token', request.url)
    );
  }
}
