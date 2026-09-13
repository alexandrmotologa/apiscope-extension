import { PiiWarning } from '../types/index.js';

/**
 * Validates a potential credit card number using the Luhn algorithm
 */
function isLuhnValid(cardDigits: string): boolean {
  let sum = 0;
  let isSecond = false;
  for (let i = cardDigits.length - 1; i >= 0; i--) {
    let digit = parseInt(cardDigits.charAt(i), 10);
    if (isNaN(digit)) return false;
    if (isSecond) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isSecond = !isSecond;
  }
  return sum % 10 === 0;
}

/**
 * Scans a network request for potential PII and security leakage risks
 */
export function scanForPiiAndLeaks(
  url: string,
  method: string,
  requestHeaders: Record<string, string>,
  requestBody?: string | null,
  responseBody?: string | null
): PiiWarning[] {
  const warnings: PiiWarning[] = [];

  // 0. Check requestHeaders for cleartext sensitive keys
  for (const [headerKey, headerVal] of Object.entries(requestHeaders)) {
    const lower = headerKey.toLowerCase();
    if ((lower.includes('secret') || lower.includes('password')) && headerVal) {
      warnings.push({
        id: `pii-hdr-${lower}`,
        type: 'cleartext-password',
        severity: 'high',
        field: `Header (${headerKey})`,
        message: `Sensitive credential header '${headerKey}' passed.`,
        recommendation: 'Ensure custom credential headers are encrypted or transmitted via standard Authorization headers.',
        maskedSnippet: `${headerKey}: ••••••••`,
      });
    }
  }

  // 1. Check for Tokens / Secrets passed directly in URL query parameters
  try {
    const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    const suspiciousQueryParams = ['token', 'access_token', 'api_key', 'apikey', 'secret', 'password', 'passwd', 'auth', 'private_key'];
    
    for (const [param, val] of parsedUrl.searchParams.entries()) {
      const lower = param.toLowerCase();
      if (suspiciousQueryParams.includes(lower) && val.length > 3) {
        warnings.push({
          id: `pii-url-${lower}`,
          type: 'token-in-url',
          severity: 'critical',
          field: `URL Query Param (?${param})`,
          message: `Sensitive credential '${param}' is exposed in the URL query string.`,
          recommendation: 'Pass secrets and tokens in HTTP headers (e.g. Authorization: Bearer <token>) or in the request body to prevent logging in server access logs and browser history.',
          maskedSnippet: `${param}=${val.slice(0, 3)}••••••••`,
        });
      }
    }

    // 2. Check for GET requests with credentials
    if (method === 'GET' && (parsedUrl.search.includes('password=') || parsedUrl.search.includes('passwd='))) {
      warnings.push({
        id: 'pii-get-password',
        type: 'cleartext-password',
        severity: 'critical',
        field: 'URL Query (GET)',
        message: 'Password transmitted via GET method query parameter.',
        recommendation: 'Authentication credentials must never be passed via GET requests. Use POST with HTTPS and JSON/form body.',
        maskedSnippet: 'password=••••••••',
      });
    }
  } catch {
    // Ignore invalid URL parsing
  }

  // 3. Check for Private Keys in Body or Headers
  const checkPrivateKey = (content: string | null | undefined, location: string) => {
    if (!content) return;
    if (content.includes('BEGIN PRIVATE KEY') || content.includes('BEGIN RSA PRIVATE KEY') || content.includes('BEGIN EC PRIVATE KEY')) {
      warnings.push({
        id: `pii-private-key-${location}`,
        type: 'private-key',
        severity: 'critical',
        field: location,
        message: 'Unencrypted Private Key detected in request payload!',
        recommendation: 'Private keys must never be transmitted over public client-side browser requests.',
        maskedSnippet: '-----BEGIN PRIVATE KEY-----••••••••-----END PRIVATE KEY-----',
      });
    }
  };

  checkPrivateKey(requestBody, 'Request Body');
  checkPrivateKey(responseBody, 'Response Body');

  // 4. Check for Credit Card Numbers in bodies (13-19 digits, filtered by Luhn)
  const checkCreditCard = (content: string | null | undefined, location: string) => {
    if (!content) return;
    // Regex for potential credit cards (grouped or continuous digits)
    const cardRegex = /\b(?:\d{4}[ -]?){3}(?:\d{1,4})\b|\b\d{13,19}\b/g;
    const matches = content.match(cardRegex);
    if (matches) {
      for (const match of matches) {
        const clean = match.replace(/[\s-]/g, '');
        if (clean.length >= 13 && clean.length <= 19 && isLuhnValid(clean)) {
          warnings.push({
            id: `pii-cc-${location}-${clean.slice(-4)}`,
            type: 'credit-card',
            severity: 'critical',
            field: location,
            message: `Potential credit card number detected (${clean.length} digits).`,
            recommendation: 'Ensure PCI-DSS compliance by tokenizing card numbers on the client or using secure iframes (e.g. Stripe Elements).',
            maskedSnippet: `•••• •••• •••• ${clean.slice(-4)}`,
          });
          break; // Avoid spamming multiple warnings for the same body
        }
      }
    }
  };

  checkCreditCard(requestBody, 'Request Body');
  checkCreditCard(responseBody, 'Response Body');

  return warnings;
}

/**
 * Mask sensitive values in headers or text for safe screen sharing
 */
export function maskSensitiveValue(key: string, val: string): string {
  if (!val) return val;
  const lowerKey = key.toLowerCase();
  
  if (
    lowerKey.includes('auth') ||
    lowerKey.includes('token') ||
    lowerKey.includes('cookie') ||
    lowerKey.includes('secret') ||
    lowerKey.includes('password') ||
    lowerKey.includes('key')
  ) {
    if (val.length <= 8) return '••••••••';
    return `${val.slice(0, 4)}••••••••${val.slice(-3)}`;
  }
  return val;
}
