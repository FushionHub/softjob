import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { signToken } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const users = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (users.length === 0) {
      // Don't reveal if user exists or not
      return NextResponse.json({
        message: 'If an account with this email exists, you will receive a password reset link.'
      });
    }

    const user = users[0];

    // Generate reset token
    const resetToken = await signToken({ email, type: 'password_reset' }, '1h');

    // Update user with reset token
    await query(
      'UPDATE users SET verification_token = $1 WHERE id = $2',
      [resetToken, user.id]
    );

    // Send password reset email
    try {
        await sendPasswordResetEmail(email, user.name, resetToken);
    } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        // Continue anyway - don't reveal if email was sent for security
    }

    return NextResponse.json({
      message: 'If an account with this email exists, you will receive a password reset link.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
