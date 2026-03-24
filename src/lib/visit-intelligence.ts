/**
 * Visit Intelligence Layer
 * Lightweight request tracking for Lobster Sound
 *
 * Captures request metadata and classifies traffic patterns.
 * Designed for easy future database insertion.
 */

// Scanner patterns - requests that indicate automated scanning
const SCANNER_PATTERNS = [
  /^\/.git/i,
  /^\/.env/i,
  /^\/wp-admin/i,
  /^\/wp-login/i,
  /^\/wp-content/i,
  /^\/wp-includes/i,
  /^\/xmlrpc\.php/i,
  /^\/phpmyadmin/i,
  /^\/admin/i,
  /^\/backup/i,
  /^\/config\./i,
  /^\/\.config/i,
  /^\/\.aws/i,
  /^\/\.ssh/i,
  /^\/\.htaccess/i,
  /^\/\.htpasswd/i,
  /^\/server-status/i,
  /^\/cgi-bin/i,
  /^\/shell/i,
  /^\/eval/i,
  /^\/phpunit/i,
  /^\/vendor/i,
  /^\/node_modules/i,
  /^\/\.well-known\/security\.txt/i,
  /^\/api\/.*\.(php|asp|aspx|jsp)$/i,
  /^\/[a-z0-9]{32,}$/i, // Random hash-like paths
];

// Bot user-agent patterns
const BOT_UA_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /curl/i,
  /wget/i,
  /python-requests/i,
  /go-http-client/i,
  /java/i,
  /httpclient/i,
  /scrapy/i,
  /headless/i,
  /phantom/i,
  /puppeteer/i,
  /playwright/i,
  /selenium/i,
  /zgrab/i,
  /masscan/i,
  /nmap/i,
  /nikto/i,
  /sqlmap/i,
  /nuclei/i,
];

// Legitimate bot patterns (search engines, etc.)
const LEGITIMATE_BOT_PATTERNS = [
  /googlebot/i,
  /bingbot/i,
  /slurp/i, // Yahoo
  /duckduckbot/i,
  /baiduspider/i,
  /yandexbot/i,
  /facebot/i,
  /twitterbot/i,
  /linkedinbot/i,
  /applebot/i,
];

export interface VisitRecord {
  // Request basics
  path: string;
  method: string;
  timestamp: string;

  // Headers
  host: string;
  referer: string | null;
  userAgent: string | null;
  queryString: string | null;

  // Vercel geo headers
  ip: string | null;
  country: string | null;
  city: string | null;
  region: string | null;

  // Classification
  isBot: boolean;
  isScanner: boolean;
  isLegitimateBot: boolean;
  isAuthenticated: boolean;
  isPublicRoute: boolean;

  // Pattern match (for debugging)
  matchedPattern: string | null;
}

export interface VisitClassification {
  isBot: boolean;
  isScanner: boolean;
  isLegitimateBot: boolean;
  matchedPattern: string | null;
}

/**
 * Classify a request based on path and user-agent
 */
export function classifyRequest(
  path: string,
  userAgent: string | null
): VisitClassification {
  let matchedPattern: string | null = null;

  // Check scanner patterns first
  for (const pattern of SCANNER_PATTERNS) {
    if (pattern.test(path)) {
      return {
        isBot: true,
        isScanner: true,
        isLegitimateBot: false,
        matchedPattern: pattern.source,
      };
    }
  }

  // Check user-agent for legitimate bots
  if (userAgent) {
    for (const pattern of LEGITIMATE_BOT_PATTERNS) {
      if (pattern.test(userAgent)) {
        return {
          isBot: true,
          isScanner: false,
          isLegitimateBot: true,
          matchedPattern: pattern.source,
        };
      }
    }

    // Check user-agent for suspicious bots
    for (const pattern of BOT_UA_PATTERNS) {
      if (pattern.test(userAgent)) {
        return {
          isBot: true,
          isScanner: false,
          isLegitimateBot: false,
          matchedPattern: pattern.source,
        };
      }
    }
  }

  // No suspicious patterns found
  return {
    isBot: false,
    isScanner: false,
    isLegitimateBot: false,
    matchedPattern: null,
  };
}

/**
 * Extract visit record from request headers
 */
export function extractVisitRecord(
  request: Request,
  isAuthenticated: boolean,
  isPublicRoute: boolean
): VisitRecord {
  const url = new URL(request.url);
  const headers = request.headers;
  const userAgent = headers.get('user-agent');

  const classification = classifyRequest(url.pathname, userAgent);

  return {
    // Request basics
    path: url.pathname,
    method: request.method,
    timestamp: new Date().toISOString(),

    // Headers
    host: headers.get('host') || url.host,
    referer: headers.get('referer'),
    userAgent,
    queryString: url.search || null,

    // Vercel geo headers (automatically added by Vercel)
    ip: headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        headers.get('x-real-ip') ||
        null,
    country: headers.get('x-vercel-ip-country') || null,
    city: headers.get('x-vercel-ip-city') || null,
    region: headers.get('x-vercel-ip-country-region') || null,

    // Classification
    ...classification,
    isAuthenticated,
    isPublicRoute,
  };
}

/**
 * Log visit to console (structured JSON for Vercel logs)
 * In production, this can be replaced with database insertion
 */
export function logVisit(record: VisitRecord): void {
  // Skip logging for static assets
  if (
    record.path.startsWith('/_next/') ||
    record.path.startsWith('/static/') ||
    record.path.endsWith('.ico') ||
    record.path.endsWith('.png') ||
    record.path.endsWith('.jpg') ||
    record.path.endsWith('.svg') ||
    record.path.endsWith('.woff2')
  ) {
    return;
  }

  // Structured log for Vercel
  const logEntry = {
    type: 'visit',
    ...record,
    // Add human-readable classification
    classification: record.isScanner
      ? 'SCANNER'
      : record.isLegitimateBot
        ? 'SEARCH_BOT'
        : record.isBot
          ? 'BOT'
          : 'HUMAN',
  };

  // Different log levels based on classification
  if (record.isScanner) {
    console.warn('[VISIT:SCANNER]', JSON.stringify(logEntry));
  } else if (record.isBot && !record.isLegitimateBot) {
    console.log('[VISIT:BOT]', JSON.stringify(logEntry));
  } else {
    console.log('[VISIT]', JSON.stringify(logEntry));
  }
}

/**
 * Future database insertion point
 * Uncomment and implement when ready to persist visits
 */
// export async function persistVisit(
//   record: VisitRecord,
//   supabase: SupabaseClient
// ): Promise<void> {
//   try {
//     await supabase.from('visits').insert({
//       path: record.path,
//       method: record.method,
//       timestamp: record.timestamp,
//       host: record.host,
//       referer: record.referer,
//       user_agent: record.userAgent,
//       query_string: record.queryString,
//       ip: record.ip,
//       country: record.country,
//       city: record.city,
//       region: record.region,
//       is_bot: record.isBot,
//       is_scanner: record.isScanner,
//       is_legitimate_bot: record.isLegitimateBot,
//       is_authenticated: record.isAuthenticated,
//       is_public_route: record.isPublicRoute,
//       matched_pattern: record.matchedPattern,
//     });
//   } catch (error) {
//     console.error('[VISIT:PERSIST_ERROR]', error);
//   }
// }
