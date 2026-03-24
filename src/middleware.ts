import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  extractVisitRecord,
  logVisit,
} from '@/lib/visit-intelligence';

// ============================================================================
// ACCESS GATE CONFIGURATION
// ============================================================================

// Cookie names
const ACCESS_COOKIE_NAME = 'lobster_access';
const SESSION_COOKIE_NAME = 'lobster_session';

interface SessionPayload {
  type: 'password' | 'token';
  hash: string;
  expiresAt: number;
  tokenId?: string;
  label?: string;
}

// Routes that are publicly accessible (no auth required)
const PUBLIC_ROUTES = [
  '/chains',      // Public chains catalog
  '/access',      // Login façade itself
  '/api/access',  // Login endpoint
  '/api/logout',  // Logout endpoint
  '/api/tokens',  // Token management (protected by its own auth)
];

// Prefixes that should be public (for chains assets, etc.)
const PUBLIC_PREFIXES = [
  '/_next/',       // Next.js assets
  '/static/',      // Static files
  '/fonts/',       // Fonts
  '/images/',      // Images
];

// File extensions that should always be allowed
const PUBLIC_EXTENSIONS = [
  '.ico',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.webp',
  '.woff',
  '.woff2',
  '.ttf',
  '.css',
  '.js',
  '.json',
  '.mp3',
  '.wav',
  '.ogg',
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a path is publicly accessible
 */
function isPublicPath(pathname: string): boolean {
  // Check exact public routes
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return true;
  }

  // Check public prefixes
  if (PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return true;
  }

  // Check public file extensions
  if (PUBLIC_EXTENSIONS.some(ext => pathname.toLowerCase().endsWith(ext))) {
    return true;
  }

  return false;
}

/**
 * Decode and validate session cookie
 */
function decodeSession(value: string): SessionPayload | null {
  try {
    const decoded = JSON.parse(Buffer.from(value, 'base64').toString('utf-8'));
    if (decoded && typeof decoded.expiresAt === 'number' && decoded.hash) {
      return decoded as SessionPayload;
    }
  } catch {
    // Invalid session format
  }
  return null;
}

/**
 * Check if request has valid, non-expired session
 */
function getSessionState(request: NextRequest): {
  authenticated: boolean;
  expired: boolean;
  session: SessionPayload | null;
} {
  // First check new session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  if (sessionCookie?.value) {
    const session = decodeSession(sessionCookie.value);
    if (session) {
      const now = Date.now();
      if (session.expiresAt > now) {
        return { authenticated: true, expired: false, session };
      } else {
        // Session expired
        return { authenticated: false, expired: true, session };
      }
    }
  }

  // Fall back to legacy cookie (just presence check)
  const accessCookie = request.cookies.get(ACCESS_COOKIE_NAME);
  if (accessCookie?.value && accessCookie.value.length > 0) {
    return { authenticated: true, expired: false, session: null };
  }

  return { authenticated: false, expired: false, session: null };
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { authenticated, expired, session } = getSessionState(request);
  const publicPath = isPublicPath(pathname);

  // Track the visit
  const visitRecord = extractVisitRecord(request, authenticated, publicPath);
  logVisit(visitRecord);

  // If path is public, allow through
  if (publicPath) {
    const response = NextResponse.next();

    // Keep CSP disabled for now (existing behavior)
    response.headers.delete('Content-Security-Policy');
    response.headers.delete('Content-Security-Policy-Report-Only');

    return response;
  }

  // If session expired, redirect to /access with expired flag
  if (expired) {
    const accessUrl = new URL('/access', request.url);
    accessUrl.searchParams.set('next', pathname);
    accessUrl.searchParams.set('expired', '1');

    const response = NextResponse.redirect(accessUrl);

    // Clear expired cookies
    response.cookies.delete(SESSION_COOKIE_NAME);
    response.cookies.delete(ACCESS_COOKIE_NAME);

    response.headers.set('X-Robots-Tag', 'noindex, nofollow');

    console.log('[SESSION:EXPIRED]', JSON.stringify({
      type: session?.type,
      tokenId: session?.tokenId,
      label: session?.label,
      expiredAt: session?.expiresAt ? new Date(session.expiresAt).toISOString() : null,
    }));

    return response;
  }

  // If not authenticated and trying to access protected route, redirect to /access
  if (!authenticated) {
    const accessUrl = new URL('/access', request.url);
    accessUrl.searchParams.set('next', pathname);

    const response = NextResponse.redirect(accessUrl);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');

    return response;
  }

  // Authenticated user accessing protected route
  const response = NextResponse.next();

  // Keep CSP disabled
  response.headers.delete('Content-Security-Policy');
  response.headers.delete('Content-Security-Policy-Report-Only');

  // Protected routes should not be indexed even when authenticated
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');

  // Add session info header for debugging (token sessions only)
  if (session?.type === 'token') {
    const remaining = Math.max(0, session.expiresAt - Date.now());
    const remainingMins = Math.floor(remaining / 60000);
    response.headers.set('X-Session-Remaining', `${remainingMins}m`);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     *
     * Note: API routes are now included for access control
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
