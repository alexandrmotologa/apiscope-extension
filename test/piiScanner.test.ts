import { describe, it, expect } from 'vitest';
import { scanForPiiAndLeaks, maskSensitiveValue } from '../src/audit/piiScanner.js';

describe('PII and Credential Leakage Scanner', () => {
  it('detects sensitive API keys and tokens in URL query strings', () => {
    const warnings = scanForPiiAndLeaks(
      'https://api.test.com/v1/user?token=secret_tok_123456789',
      'GET',
      {}
    );
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0].type).toBe('token-in-url');
    expect(warnings[0].severity).toBe('critical');
    expect(warnings[0].maskedSnippet).toContain('••••••••');
  });

  it('detects passwords passed in GET requests', () => {
    const warnings = scanForPiiAndLeaks(
      'https://api.test.com/login?password=mysecretpassword',
      'GET',
      {}
    );
    expect(warnings.some(w => w.type === 'cleartext-password')).toBe(true);
  });

  it('detects private keys in request or response bodies', () => {
    const warnings = scanForPiiAndLeaks(
      'https://api.test.com/upload',
      'POST',
      {},
      '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0...\n-----END RSA PRIVATE KEY-----'
    );
    expect(warnings.some(w => w.type === 'private-key')).toBe(true);
  });

  it('masks sensitive authorization header values', () => {
    const masked = maskSensitiveValue('authorization', 'Bearer eyJhbGciOiJIUzI1NiI...');
    expect(masked).toContain('••••••••');
    expect(masked).not.toBe('Bearer eyJhbGciOiJIUzI1NiI...');
  });
});
