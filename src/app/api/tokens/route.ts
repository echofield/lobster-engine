import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import {
  createToken,
  listTokens,
  deleteToken,
  disableAllTokens,
  enableAllTokens,
  areTokensDisabled,
  clearAllTokens,
  initializeTokensFromEnv,
} from '@/lib/access-tokens';

// ============================================================================
// ADMIN AUTHENTICATION
// ============================================================================

/**
 * Verify admin access using the main password
 */
function verifyAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.slice(7);
  const expectedCode = process.env.LOBSTER_ACCESS_CODE;

  if (!expectedCode) {
    return false;
  }

  // Admin token is hash of the password
  const expectedHash = createHash('sha256').update(expectedCode).digest('hex');
  const submittedHash = createHash('sha256').update(token).digest('hex');

  return submittedHash === expectedHash;
}

// ============================================================================
// HANDLERS
// ============================================================================

/**
 * GET /api/tokens
 * List all tokens (admin only)
 */
export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  await initializeTokensFromEnv();
  const tokens = await listTokens();

  return NextResponse.json({
    disabled: areTokensDisabled(),
    count: tokens.length,
    tokens: tokens.map(t => ({
      id: t.id,
      label: t.label,
      createdAt: t.createdAt,
      expiresAt: t.expiresAt,
      used: t.used,
      usedAt: t.usedAt,
      usedIp: t.usedIp,
      usedCountry: t.usedCountry,
      usedCity: t.usedCity,
      sessionDurationMs: t.sessionDurationMs,
      // Never expose keyHash
    })),
  });
}

/**
 * POST /api/tokens
 * Create a new token (admin only)
 *
 * Body: { label, expiresAt?, sessionDurationMs? }
 */
export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { label, expiresAt, sessionDurationMs } = body;

    if (!label || typeof label !== 'string') {
      return NextResponse.json(
        { error: 'Label is required' },
        { status: 400 }
      );
    }

    const { token, rawKey } = await createToken({
      label,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      sessionDurationMs: sessionDurationMs || undefined,
    });

    return NextResponse.json({
      success: true,
      token: {
        id: token.id,
        label: token.label,
        createdAt: token.createdAt,
        expiresAt: token.expiresAt,
        sessionDurationMs: token.sessionDurationMs,
      },
      // ⚠️ Raw key is only shown ONCE - store it securely!
      rawKey,
      warning: 'Save this key now. It cannot be retrieved again.',
    }, { status: 201 });
  } catch (error) {
    console.error('[TOKENS] Create error:', error);
    return NextResponse.json(
      { error: 'Failed to create token' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tokens?id=xxx
 * Delete a specific token (admin only)
 *
 * Or DELETE /api/tokens?action=clear to clear all
 * Or DELETE /api/tokens?action=disable to disable all
 */
export async function DELETE(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const action = searchParams.get('action');

  if (action === 'clear') {
    await clearAllTokens();
    return NextResponse.json({ success: true, action: 'cleared' });
  }

  if (action === 'disable') {
    disableAllTokens();
    return NextResponse.json({ success: true, action: 'disabled' });
  }

  if (action === 'enable') {
    enableAllTokens();
    return NextResponse.json({ success: true, action: 'enabled' });
  }

  if (id) {
    await deleteToken(id);
    return NextResponse.json({ success: true, deleted: id });
  }

  return NextResponse.json(
    { error: 'Specify ?id=xxx or ?action=clear|disable|enable' },
    { status: 400 }
  );
}
