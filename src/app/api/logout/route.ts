import { NextResponse } from 'next/server';

// Cookie configuration
const ACCESS_COOKIE_NAME = 'lobster_access';

/**
 * POST /api/logout
 * Clear the access cookie and end the session
 */
export async function POST() {
  const response = NextResponse.json({ success: true });

  // Clear the access cookie
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // Immediately expire
    path: '/',
  });

  return response;
}

/**
 * GET /api/logout
 * Alternative logout via redirect (for simple logout links)
 */
export async function GET() {
  const response = NextResponse.redirect(new URL('/access', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3200'));

  // Clear the access cookie
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}
