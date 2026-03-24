# Access Gate & Visit Intelligence

This document describes the temporary access gate and visit intelligence layer implemented for lobstersound.com.

## Overview

The site was exposed earlier than intended. This implementation adds:
1. **Permanent password access** - Full access with 7-day sessions
2. **One-time tokens** - Single-use keys with timed sessions and proof of use
3. **Visit intelligence** - Distinguish human traffic from scanner noise
4. `/chains` remains publicly accessible and indexable

## Files Changed

| File | Change |
|------|--------|
| `src/middleware.ts` | Complete rewrite with access gate + session expiration |
| `src/lib/visit-intelligence.ts` | **NEW** - Visit classification and logging |
| `src/lib/access-tokens.ts` | **NEW** - One-time token storage and management |
| `src/app/access/page.tsx` | **NEW** - Login façade (supports both auth types) |
| `src/app/access/layout.tsx` | **NEW** - Layout with noindex metadata |
| `src/app/api/access/route.ts` | **NEW** - Login endpoint (password + tokens) |
| `src/app/api/logout/route.ts` | **NEW** - Logout endpoint |
| `src/app/api/tokens/route.ts` | **NEW** - Token management API |
| `src/components/Navigation.tsx` | Added logout button |

## Environment Variables

Add to Vercel (and local `.env.local`):

```env
# Permanent password for full access
LOBSTER_ACCESS_CODE=Chandler2026

# Optional: Pre-seed tokens (format: "label:KEY,label2:KEY2")
LOBSTER_PRESET_TOKENS="Press Preview:ABCD-EFGH-IJKL-MNOP,Investor Demo:QRST-UVWX-YZ12-3456"
```

## Two Access Types

### 1. Permanent Password

- **Code**: `Chandler2026` (stored in `LOBSTER_ACCESS_CODE`)
- **Session**: 7 days
- **Usage**: Unlimited
- **Best for**: Team members, ongoing access

### 2. One-Time Tokens

- **Format**: `XXXX-XXXX-XXXX-XXXX`
- **Session**: Configurable (default 2 hours)
- **Usage**: Single use only
- **Tracking**: Records timestamp, IP, location, user-agent
- **Best for**: Press previews, investor demos, timed access

The `/access` page auto-detects which type you're entering.

---

## Token Management

### Creating Tokens

**Option 1: Via API (recommended)**

```bash
# First, hash your password to get admin token
ADMIN_TOKEN="Chandler2026"

# Create a new token
curl -X POST https://lobstersound.com/api/tokens \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Press Preview - March 2026",
    "sessionDurationMs": 7200000
  }'

# Response:
# {
#   "success": true,
#   "token": { "id": "tok_xxx", "label": "Press Preview - March 2026" },
#   "rawKey": "ABCD-EFGH-IJKL-MNOP",
#   "warning": "Save this key now. It cannot be retrieved again."
# }
```

**Option 2: Via Environment Variable**

```env
LOBSTER_PRESET_TOKENS="Press Preview:ABCD-EFGH-IJKL-MNOP,Investor Demo:QRST-UVWX-YZ12-3456"
```

### Listing Tokens

```bash
curl https://lobstersound.com/api/tokens \
  -H "Authorization: Bearer Chandler2026"

# Shows all tokens with usage status (but never the raw keys)
```

### Deleting Tokens

```bash
# Delete specific token
curl -X DELETE "https://lobstersound.com/api/tokens?id=tok_xxx" \
  -H "Authorization: Bearer Chandler2026"

# Clear ALL tokens
curl -X DELETE "https://lobstersound.com/api/tokens?action=clear" \
  -H "Authorization: Bearer Chandler2026"
```

### Disabling All Tokens (Kill Switch)

```bash
# Disable all token access globally
curl -X DELETE "https://lobstersound.com/api/tokens?action=disable" \
  -H "Authorization: Bearer Chandler2026"

# Re-enable token access
curl -X DELETE "https://lobstersound.com/api/tokens?action=enable" \
  -H "Authorization: Bearer Chandler2026"
```

### Rotating Keys

1. **Disable existing tokens**: `?action=disable`
2. **Clear all tokens**: `?action=clear`
3. **Create new tokens** via POST
4. **Re-enable**: `?action=enable`

---

## Proof of Access

When a one-time token is used, the system records:

```json
{
  "tokenId": "tok_abc123",
  "label": "Press Preview - March 2026",
  "usedAt": "2026-03-24T10:30:00.000Z",
  "usedIp": "203.0.113.42",
  "usedCountry": "FR",
  "usedCity": "Paris",
  "usedUserAgent": "Mozilla/5.0...",
  "sessionExpiresAt": "2026-03-24T12:30:00.000Z"
}
```

This serves as timestamped proof of who accessed the site and when.

---

## Route Behavior

### Public (No Auth Required)
- `/chains` - Signal chains catalog (fully public, indexable)
- `/chains/[id]` - Individual chain pages (public)
- `/access` - Login façade
- `/api/access` - Login endpoint
- `/api/logout` - Logout endpoint
- All static assets (images, fonts, CSS, JS)

### Protected (Auth Required)
- `/` - Home/Dashboard
- `/aether` - Crystalline Resonance Instrument
- `/vapor` - Granular Cloud Synthesis
- `/patchbay` - Interactive Patchbay
- `/guide` - Decision Tree Workflows
- `/gear` - Equipment Catalog
- `/instruments/*` - All instruments
- `/signal` - Signal Chain Visualization
- `/generative` - Generative Content
- All other routes

### Behavior
1. **Unauthenticated request to protected route** → Redirect to `/access?next=/original-path`
2. **Valid code submitted at /access** → Set HttpOnly cookie, redirect to intended destination
3. **Authenticated request to protected route** → Allow through, add `X-Robots-Tag: noindex`
4. **Request to /chains** → Allow through, no restrictions

## Session Cookies

Two cookies are used:

### `lobster_session` (primary)
- Contains session type, expiration, and token info
- Base64-encoded JSON payload
- Expiry: Based on access type (7 days for password, 2 hours for tokens)

### `lobster_access` (legacy/fallback)
- Simple hash value for backwards compatibility
- Same expiry as session cookie

## Visit Intelligence

Every request is logged with:
- Path, method, timestamp
- Referer, user-agent
- IP, country, city (from Vercel headers)
- Classification: HUMAN, BOT, SEARCH_BOT, or SCANNER

### Scanner Detection

Requests matching these patterns are flagged as scanners:
- `/.git/*`
- `/.env`
- `/wp-admin`, `/wp-login`, `/wp-content`
- `/phpmyadmin`
- `/admin`, `/backup`, `/config`
- Various other security probe patterns

### Log Output

Logs appear in Vercel Functions logs:
```
[VISIT] {"type":"visit","path":"/chains",...,"classification":"HUMAN"}
[VISIT:SCANNER] {"type":"visit","path":"/.git/config",...,"classification":"SCANNER"}
```

## SEO & Indexing

- `/chains` → No restrictions, fully indexable
- All protected routes → `X-Robots-Tag: noindex, nofollow` header
- `/access` page → `robots: { index: false, follow: false }` metadata

## Vercel Deployment Protection

**Recommendation**: Also enable Vercel Deployment Protection as an additional layer:

1. Go to Vercel Dashboard → Project → Settings → General
2. Under "Deployment Protection", enable "Password Protection"
3. Set a password

This provides platform-level protection that works even if the app has bugs.

## Rollback Instructions

To remove the access gate and restore full public access:

### 1. Restore Original Middleware

Replace `src/middleware.ts` with:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.delete('Content-Security-Policy');
  response.headers.delete('Content-Security-Policy-Report-Only');
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### 2. Restore Original Navigation

Remove the logout button from `src/components/Navigation.tsx`:
- Remove `useRouter` import
- Remove `handleLogout` function
- Remove the logout button `<button>` element

### 3. Optional Cleanup

Delete these files (optional, they won't affect anything):
- `src/lib/visit-intelligence.ts`
- `src/app/access/` (entire directory)
- `src/app/api/access/` (entire directory)
- `src/app/api/logout/` (entire directory)

### 4. Remove Environment Variable

Remove `LOBSTER_ACCESS_CODE` from Vercel environment variables.

### 5. Redeploy

```bash
git add .
git commit -m "Remove temporary access gate"
git push
```

## Caveats

### Next.js 16 Middleware Deprecation

The build shows a warning:
```
⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.
```

The middleware still works in Next.js 16.2.0, but may need migration to the new "proxy" convention in future versions.

### Static Pre-rendering

Some pages are statically pre-rendered at build time (marked with ○ in build output). However:
- The middleware runs on every request regardless
- Unauthenticated users are redirected before seeing content
- No protected data is leaked in the HTML

### Edge Runtime

The middleware runs on the Edge Runtime. The `crypto` module is available natively.

### Cookie Security

- In production (`NODE_ENV=production`), cookies are marked `Secure`
- In development, cookies work over HTTP
- `HttpOnly` prevents JavaScript access to the cookie
- `SameSite=Lax` prevents CSRF attacks
