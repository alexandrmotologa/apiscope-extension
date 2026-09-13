import { DecodedJWT } from '../types/index.js';

/**
 * Safe Base64URL decoder working in both browser and Node.js environments
 */
function base64UrlDecode(str: string): string {
  // Convert Base64URL to standard Base64
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  // Pad with '='
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }

  try {
    if (typeof atob === 'function') {
      const decoded = atob(base64);
      // Handle UTF-8 encoding
      const bytes = new Uint8Array(decoded.length);
      for (let i = 0; i < decoded.length; i++) {
        bytes[i] = decoded.charCodeAt(i);
      }
      return new TextDecoder().decode(bytes);
    } else if (typeof Buffer !== 'undefined') {
      return Buffer.from(base64, 'base64').toString('utf-8');
    }
  } catch {
    // Fallback if decode fails
    return '';
  }
  return '';
}

/**
 * Attempt to decode a string as a JWT
 */
export function parseJwt(token: string, source: 'header' | 'cookie' | 'body', sourceKey: string): DecodedJWT | null {
  if (!token || typeof token !== 'string') return null;

  const trimmed = token.trim();
  const parts = trimmed.split('.');
  if (parts.length !== 3) return null;

  // Most JWTs start with eyJ (base64url for '{"')
  if (!parts[0].startsWith('eyJ')) return null;

  try {
    const headerJson = base64UrlDecode(parts[0]);
    const payloadJson = base64UrlDecode(parts[1]);

    if (!headerJson || !payloadJson) return null;

    const header = JSON.parse(headerJson);
    const payload = JSON.parse(payloadJson);

    // Validate payload is an object
    if (typeof payload !== 'object' || payload === null) return null;

    const now = Date.now();
    let expiresAt: Date | undefined;
    let isExpired: boolean | undefined;
    let timeRemainingStr: string | undefined;

    if (typeof payload.exp === 'number') {
      // exp is usually in seconds
      const expMs = payload.exp * 1000;
      expiresAt = new Date(expMs);
      isExpired = now > expMs;

      const diffMs = Math.abs(expMs - now);
      const diffMinutes = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      let timeFormatted = '';
      if (diffDays > 0) {
        timeFormatted = `${diffDays}d ${diffHours % 24}h`;
      } else if (diffHours > 0) {
        timeFormatted = `${diffHours}h ${diffMinutes % 60}m`;
      } else {
        timeFormatted = `${diffMinutes}m`;
      }

      if (isExpired) {
        timeRemainingStr = `Expired ${timeFormatted} ago`;
      } else {
        timeRemainingStr = `Active (expires in ${timeFormatted})`;
      }
    }

    let issuedAt: Date | undefined;
    if (typeof payload.iat === 'number') {
      issuedAt = new Date(payload.iat * 1000);
    }

    const statusText = isExpired === true 
      ? 'EXPIRED' 
      : isExpired === false 
        ? 'ACTIVE' 
        : 'NO EXPIRATION';

    return {
      rawToken: trimmed,
      source,
      sourceKey,
      header,
      payload,
      signature: parts[2],
      subject: typeof payload.sub === 'string' ? payload.sub : undefined,
      issuer: typeof payload.iss === 'string' ? payload.iss : undefined,
      audience: payload.aud as string | string[] | undefined,
      issuedAt,
      expiresAt,
      isExpired,
      statusText,
      timeRemainingStr,
    };
  } catch {
    return null;
  }
}

/**
 * Scan headers, bodies, and query params for JWT tokens
 */
export function extractJwtTokens(
  requestHeaders: Record<string, string>,
  responseHeaders: Record<string, string>,
  requestBody?: string | null,
  responseBody?: string | null
): DecodedJWT[] {
  const results: DecodedJWT[] = [];
  const seenTokens = new Set<string>();

  const checkAndAdd = (token: string, source: 'header' | 'cookie' | 'body', key: string) => {
    if (!token || seenTokens.has(token)) return;
    const jwt = parseJwt(token, source, key);
    if (jwt) {
      seenTokens.add(token);
      results.push(jwt);
    }
  };

  // 1. Scan Request Headers
  for (const [key, val] of Object.entries(requestHeaders)) {
    if (!val) continue;
    if (key.toLowerCase() === 'authorization' && val.toLowerCase().startsWith('bearer ')) {
      checkAndAdd(val.slice(7).trim(), 'header', key);
    } else if (key.toLowerCase().includes('token') || key.toLowerCase().includes('auth')) {
      checkAndAdd(val.trim(), 'header', key);
    } else if (key.toLowerCase() === 'cookie') {
      // Parse cookies
      const cookies = val.split(';');
      for (const c of cookies) {
        const [cKey, ...cVal] = c.split('=');
        if (cVal.length > 0) {
          const cookieVal = cVal.join('=').trim();
          checkAndAdd(cookieVal, 'cookie', cKey.trim());
        }
      }
    }
  }

  // 2. Scan Response Headers (e.g. set-cookie, x-auth-token)
  for (const [key, val] of Object.entries(responseHeaders)) {
    if (!val) continue;
    if (key.toLowerCase().includes('token') || key.toLowerCase().includes('auth')) {
      checkAndAdd(val.trim(), 'header', key);
    }
  }

  // 3. Scan JSON Bodies (search for string values starting with eyJ)
  const scanJsonString = (rawJson: string | null | undefined, sourceKey: string) => {
    if (!rawJson || !rawJson.includes('eyJ')) return;
    try {
      const parsed = JSON.parse(rawJson);
      const searchObj = (obj: unknown, path: string) => {
        if (!obj) return;
        if (typeof obj === 'string') {
          if (obj.startsWith('eyJ') && obj.split('.').length === 3) {
            checkAndAdd(obj, 'body', path);
          }
        } else if (Array.isArray(obj)) {
          obj.forEach((item, idx) => searchObj(item, `${path}[${idx}]`));
        } else if (typeof obj === 'object') {
          for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
            searchObj(v, path ? `${path}.${k}` : k);
          }
        }
      };
      searchObj(parsed, sourceKey);
    } catch {
      // Raw string regex match fallback
      const match = rawJson.match(/eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g);
      if (match) {
        for (const m of match) {
          checkAndAdd(m, 'body', sourceKey);
        }
      }
    }
  };

  scanJsonString(requestBody, 'requestBody');
  scanJsonString(responseBody, 'responseBody');

  return results;
}
