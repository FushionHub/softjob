import { NextResponse } from 'next/server';

export async function POST(request) {
  const response = NextResponse.json({
    message: 'Logged out successfully'
  });

  // Clear the auth token cookie
  response.cookies.delete('auth_token');

  return response;
}
