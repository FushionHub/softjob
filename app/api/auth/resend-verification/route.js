import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { signToken, verifyToken } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database
    const users = await query(
      'SELECT * FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = users[0];

    if (user.email_verified) {
      return NextResponse.json(
        { message: 'Email is already verified' },
        { status: 200 }
      );
    }

    // Generate new verification token
    const verificationToken = await signToken({ email: user.email }, '24h');

    // Update user with new verification token
    await query(
      'UPDATE users SET verification_token = $1 WHERE id = $2',
      [verificationToken, user.id]
    );

    // Try to send verification email
    try {
      await sendVerificationEmail(user.email, user.name, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email (SMTP not configured):', emailError.message);
      return NextResponse.json(
        { error: 'Email service not configured. Please contact support.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Verification email sent successfully! Please check your inbox.'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
