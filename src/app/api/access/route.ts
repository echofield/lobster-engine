import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import {
  useToken,
  initializeTokensFromEnv,
  type TokenUsageProof,
} from '@/lib/access-tokens';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Cookie names
const ACCESS_COOKIE_NAME = 'lobster_access';
const SESSION_COOKIE_NAME = 'lobster_session';

// Permanent password session duration (7 days)
const PASSWORD_SESSION_DURATION = 60 * 60 * 24 * 7;

// Access types
type AccessType = 'password' | 'token';

interface SessionPayload {
  type: AccessType;
  hash: string;
  expiresAt: number; // Unix timestamp
  tokenId?: string;  // For token access
  label?: string;    // For token access
}

// ============================================================================
// UTILITIES
// ============================================================================

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

function encodeSession(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

function getRequestMetadata(request: NextRequest) {
  return {
    ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') || null,
    userAgent: request.headers.get('user-agent'),
    country: request.headers.get('x-vercel-ip-country') || null,
    city: request.headers.get('x-vercel-ip-city') || null,
  };
}

/**
 * Detect if input looks like a token (XXXX-XXXX-XXXX-XXXX format)
 */
function looksLikeToken(input: string): boolean {
  const normalized = input.trim().toUpperCase();
  return /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(normalized);
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

/**
 * POST /api/access
 *
 * Handles both:
 * 1. Permanent password (Chandler2026) - unlimited access
 * 2. One-time tokens (XXXX-XXXX-XXXX-XXXX) - single use, timed session
 */
export async function POST(request: NextRequest) {
  // Initialize preset tokens from env on first request
  await initializeTokensFromEnv();

  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Access code required' },
        { status: 400 }
      );
    }

    const input = code.trim();
    const metadata = getRequestMetadata(request);

    // Determine if this is a token or password attempt
    if (looksLikeToken(input)) {
      return handleTokenAccess(input, metadata);
    } else {
      return handlePasswordAccess(input, metadata);
    }
  } catch (error) {
    console.error('[ACCESS] Error processing request:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PASSWORD ACCESS
// ============================================================================

async function handlePasswordAccess(
  password: string,
  metadata: { ip: string | null; userAgent: string | null }
): Promise<NextResponse> {
  const expectedCode = process.env.LOBSTER_ACCESS_CODE;

  if (!expectedCode) {
    console.error('[ACCESS] LOBSTER_ACCESS_CODE not set');
    return NextResponse.json(
      { success: false, error: 'Access system not configured' },
      { status: 500 }
    );
  }

  const submittedHash = hashCode(password);
  const expectedHash = hashCode(expectedCode);

  if (submittedHash !== expectedHash) {
    console.warn('[ACCESS:PASSWORD] Failed attempt', {
      ip: metadata.ip || 'unknown',
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { success: false, error: 'Key not recognized' },
      { status: 401 }
    );
  }

  // Success - create permanent session
  const expiresAt = Date.now() + (PASSWORD_SESSION_DURATION * 1000);

  const sessionPayload: SessionPayload = {
    type: 'password',
    hash: submittedHash,
    expiresAt,
  };

  const response = NextResponse.json({
    success: true,
    type: 'password',
    expiresAt: new Date(expiresAt).toISOString(),
  });

  // Set session cookie
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: encodeSession(sessionPayload),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: PASSWORD_SESSION_DURATION,
    path: '/',
  });

  // Legacy cookie for backwards compatibility
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: submittedHash,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: PASSWORD_SESSION_DURATION,
    path: '/',
  });

  console.log('[ACCESS:PASSWORD] Success', {
    ip: metadata.ip || 'unknown',
    expiresAt: new Date(expiresAt).toISOString(),
  });

  return response;
}

// ============================================================================
// TOKEN ACCESS
// ============================================================================

async function handleTokenAccess(
  rawKey: string,
  metadata: {
    ip: string | null;
    userAgent: string | null;
    country: string | null;
    city: string | null;
  }
): Promise<NextResponse> {
  const proof = await useToken(rawKey, metadata);

  if (!proof) {
    console.warn('[ACCESS:TOKEN] Failed attempt', {
      ip: metadata.ip || 'unknown',
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { success: false, error: 'Key not recognized' },
      { status: 401 }
    );
  }

  // Success - create timed session
  const expiresAt = new Date(proof.sessionExpiresAt).getTime();
  const maxAge = Math.floor((expiresAt - Date.now()) / 1000);

  const sessionPayload: SessionPayload = {
    type: 'token',
    hash: hashCode(rawKey),
    expiresAt,
    tokenId: proof.tokenId,
    label: proof.label,
  };

  const response = NextResponse.json({
    success: true,
    type: 'token',
    label: proof.label,
    expiresAt: proof.sessionExpiresAt,
    proof: {
      tokenId: proof.tokenId,
      usedAt: proof.usedAt,
      usedFrom: {
        ip: proof.usedIp,
        country: proof.usedCountry,
        city: proof.usedCity,
      },
    },
  });

  // Set session cookie
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: encodeSession(sessionPayload),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
    path: '/',
  });

  // Legacy cookie for backwards compatibility
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: sessionPayload.hash,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
    path: '/',
  });

  return response;
}
