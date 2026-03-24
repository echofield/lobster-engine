/**
 * One-Time Access Token System
 *
 * Tokens are single-use keys that grant timed access.
 * Each token can only be used once and records proof of use.
 *
 * Storage: In-memory by default, DB-ready interface.
 * To migrate to DB, implement the TokenStore interface with Supabase.
 */

import { createHash, randomBytes } from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface AccessToken {
  id: string;
  keyHash: string;           // SHA-256 hash of the raw key
  label: string;             // Human-readable label (e.g., "Press Preview - March 2026")
  createdAt: string;         // ISO timestamp
  expiresAt: string | null;  // Token itself can expire (optional)

  // Usage tracking
  used: boolean;
  usedAt: string | null;
  usedIp: string | null;
  usedUserAgent: string | null;
  usedCountry: string | null;
  usedCity: string | null;

  // Session config
  sessionDurationMs: number; // How long the session lasts after use
}

export interface TokenUsageProof {
  tokenId: string;
  label: string;
  usedAt: string;
  usedIp: string | null;
  usedUserAgent: string | null;
  usedCountry: string | null;
  usedCity: string | null;
  sessionExpiresAt: string;
}

export interface CreateTokenOptions {
  label: string;
  expiresAt?: Date | null;
  sessionDurationMs?: number;
}

export interface TokenStore {
  get(id: string): Promise<AccessToken | null>;
  getByKeyHash(keyHash: string): Promise<AccessToken | null>;
  getAll(): Promise<AccessToken[]>;
  create(token: AccessToken): Promise<void>;
  update(id: string, updates: Partial<AccessToken>): Promise<void>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

// Default session duration: 2 hours
const DEFAULT_SESSION_DURATION_MS = 2 * 60 * 60 * 1000;

// Global kill switch - set to true to disable all token access
let TOKENS_DISABLED = false;

// ============================================================================
// IN-MEMORY STORE
// ============================================================================

class InMemoryTokenStore implements TokenStore {
  private tokens: Map<string, AccessToken> = new Map();
  private keyHashIndex: Map<string, string> = new Map(); // keyHash -> id

  async get(id: string): Promise<AccessToken | null> {
    return this.tokens.get(id) || null;
  }

  async getByKeyHash(keyHash: string): Promise<AccessToken | null> {
    const id = this.keyHashIndex.get(keyHash);
    if (!id) return null;
    return this.tokens.get(id) || null;
  }

  async getAll(): Promise<AccessToken[]> {
    return Array.from(this.tokens.values());
  }

  async create(token: AccessToken): Promise<void> {
    this.tokens.set(token.id, token);
    this.keyHashIndex.set(token.keyHash, token.id);
  }

  async update(id: string, updates: Partial<AccessToken>): Promise<void> {
    const token = this.tokens.get(id);
    if (token) {
      this.tokens.set(id, { ...token, ...updates });
    }
  }

  async delete(id: string): Promise<void> {
    const token = this.tokens.get(id);
    if (token) {
      this.keyHashIndex.delete(token.keyHash);
      this.tokens.delete(id);
    }
  }

  async clear(): Promise<void> {
    this.tokens.clear();
    this.keyHashIndex.clear();
  }
}

// Singleton store instance
const store: TokenStore = new InMemoryTokenStore();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a cryptographically secure random key
 */
export function generateRawKey(): string {
  // Format: XXXX-XXXX-XXXX-XXXX (16 chars, easy to type)
  const bytes = randomBytes(12);
  const base = bytes.toString('base64')
    .replace(/[+/=]/g, '')
    .substring(0, 16)
    .toUpperCase();
  return `${base.slice(0, 4)}-${base.slice(4, 8)}-${base.slice(8, 12)}-${base.slice(12, 16)}`;
}

/**
 * Hash a key for secure storage
 */
export function hashKey(rawKey: string): string {
  // Normalize: remove dashes, uppercase
  const normalized = rawKey.replace(/-/g, '').toUpperCase();
  return createHash('sha256').update(normalized).digest('hex');
}

/**
 * Generate a unique token ID
 */
function generateTokenId(): string {
  return `tok_${randomBytes(8).toString('hex')}`;
}

// ============================================================================
// TOKEN MANAGEMENT API
// ============================================================================

/**
 * Create a new one-time access token
 * Returns both the token record and the raw key (which should be given to the user)
 */
export async function createToken(options: CreateTokenOptions): Promise<{ token: AccessToken; rawKey: string }> {
  const rawKey = generateRawKey();
  const keyHash = hashKey(rawKey);

  const token: AccessToken = {
    id: generateTokenId(),
    keyHash,
    label: options.label,
    createdAt: new Date().toISOString(),
    expiresAt: options.expiresAt?.toISOString() || null,
    used: false,
    usedAt: null,
    usedIp: null,
    usedUserAgent: null,
    usedCountry: null,
    usedCity: null,
    sessionDurationMs: options.sessionDurationMs || DEFAULT_SESSION_DURATION_MS,
  };

  await store.create(token);

  console.log('[TOKEN:CREATED]', JSON.stringify({
    id: token.id,
    label: token.label,
    expiresAt: token.expiresAt,
    sessionDurationMs: token.sessionDurationMs,
  }));

  return { token, rawKey };
}

/**
 * Validate and use a token
 * Returns usage proof if successful, null if invalid
 */
export async function useToken(
  rawKey: string,
  metadata: {
    ip: string | null;
    userAgent: string | null;
    country: string | null;
    city: string | null;
  }
): Promise<TokenUsageProof | null> {
  // Check kill switch
  if (TOKENS_DISABLED) {
    console.log('[TOKEN:REJECTED] Tokens globally disabled');
    return null;
  }

  const keyHash = hashKey(rawKey);
  const token = await store.getByKeyHash(keyHash);

  // Token not found
  if (!token) {
    console.log('[TOKEN:INVALID] Key not recognized');
    return null;
  }

  // Token already used
  if (token.used) {
    console.warn('[TOKEN:REUSE_ATTEMPT]', JSON.stringify({
      id: token.id,
      label: token.label,
      originalUse: {
        at: token.usedAt,
        ip: token.usedIp,
      },
      attemptedReuse: {
        ip: metadata.ip,
        at: new Date().toISOString(),
      },
    }));
    return null;
  }

  // Token expired (the token itself, not the session)
  if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
    console.log('[TOKEN:EXPIRED]', JSON.stringify({
      id: token.id,
      label: token.label,
      expiredAt: token.expiresAt,
    }));
    return null;
  }

  // Mark as used
  const usedAt = new Date().toISOString();
  const sessionExpiresAt = new Date(Date.now() + token.sessionDurationMs).toISOString();

  await store.update(token.id, {
    used: true,
    usedAt,
    usedIp: metadata.ip,
    usedUserAgent: metadata.userAgent,
    usedCountry: metadata.country,
    usedCity: metadata.city,
  });

  const proof: TokenUsageProof = {
    tokenId: token.id,
    label: token.label,
    usedAt,
    usedIp: metadata.ip,
    usedUserAgent: metadata.userAgent,
    usedCountry: metadata.country,
    usedCity: metadata.city,
    sessionExpiresAt,
  };

  console.log('[TOKEN:USED]', JSON.stringify(proof));

  return proof;
}

/**
 * Get all tokens (for admin/debugging)
 */
export async function listTokens(): Promise<AccessToken[]> {
  return store.getAll();
}

/**
 * Delete a token
 */
export async function deleteToken(id: string): Promise<void> {
  await store.delete(id);
  console.log('[TOKEN:DELETED]', id);
}

/**
 * Globally disable all token access
 */
export function disableAllTokens(): void {
  TOKENS_DISABLED = true;
  console.log('[TOKEN:GLOBAL_DISABLE] All token access disabled');
}

/**
 * Re-enable token access
 */
export function enableAllTokens(): void {
  TOKENS_DISABLED = false;
  console.log('[TOKEN:GLOBAL_ENABLE] Token access re-enabled');
}

/**
 * Check if tokens are globally disabled
 */
export function areTokensDisabled(): boolean {
  return TOKENS_DISABLED;
}

/**
 * Clear all tokens (for rotation)
 */
export async function clearAllTokens(): Promise<void> {
  await store.clear();
  console.log('[TOKEN:CLEAR_ALL] All tokens cleared');
}

// ============================================================================
// INITIALIZATION - PRE-SEED TOKENS FROM ENV
// ============================================================================

/**
 * Initialize tokens from environment variable
 * Format: LOBSTER_PRESET_TOKENS="label1:key1,label2:key2"
 *
 * This allows setting up tokens without an admin API.
 * Call this once at startup.
 */
let initialized = false;

export async function initializeTokensFromEnv(): Promise<void> {
  if (initialized) return;
  initialized = true;

  const preset = process.env.LOBSTER_PRESET_TOKENS;
  if (!preset) return;

  const pairs = preset.split(',').map(p => p.trim()).filter(Boolean);

  for (const pair of pairs) {
    const [label, rawKey] = pair.split(':').map(s => s.trim());
    if (!label || !rawKey) continue;

    const keyHash = hashKey(rawKey);

    // Check if already exists
    const existing = await store.getByKeyHash(keyHash);
    if (existing) continue;

    const token: AccessToken = {
      id: generateTokenId(),
      keyHash,
      label,
      createdAt: new Date().toISOString(),
      expiresAt: null,
      used: false,
      usedAt: null,
      usedIp: null,
      usedUserAgent: null,
      usedCountry: null,
      usedCity: null,
      sessionDurationMs: DEFAULT_SESSION_DURATION_MS,
    };

    await store.create(token);
    console.log('[TOKEN:PRESET]', JSON.stringify({ id: token.id, label }));
  }
}

// ============================================================================
// DATABASE MIGRATION TEMPLATE
// ============================================================================

/*
To migrate to Supabase, create this table and implement TokenStore:

CREATE TABLE access_tokens (
  id TEXT PRIMARY KEY,
  key_hash TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  used_ip TEXT,
  used_user_agent TEXT,
  used_country TEXT,
  used_city TEXT,
  session_duration_ms INTEGER NOT NULL DEFAULT 7200000
);

CREATE INDEX idx_access_tokens_key_hash ON access_tokens(key_hash);
CREATE INDEX idx_access_tokens_used ON access_tokens(used);

class SupabaseTokenStore implements TokenStore {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async getByKeyHash(keyHash: string): Promise<AccessToken | null> {
    const { data } = await this.supabase
      .from('access_tokens')
      .select('*')
      .eq('key_hash', keyHash)
      .single();
    return data ? this.mapFromDb(data) : null;
  }

  // ... implement other methods
}
*/
