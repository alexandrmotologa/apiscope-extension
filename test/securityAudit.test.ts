import { describe, it, expect } from 'vitest';
import { auditSecurityHeaders } from '../src/audit/securityAudit.js';

describe('OWASP Security Header Auditing Engine', () => {
  it('assigns Grade A+ to fully hardened HTTPS endpoints', () => {
    const headers = {
      'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
      'Access-Control-Allow-Origin': 'https://example.com',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=()',
    };

    const audit = auditSecurityHeaders('https://api.example.com/v1/secure', headers);
    expect(audit.score).toBeGreaterThanOrEqual(95);
    expect(audit.grade).toBe('A+');
    expect(audit.findings.filter((f) => f.status === 'fail').length).toBe(0);
  });

  it('penalizes plaintext unencrypted HTTP requests heavily', () => {
    const headers = {
      'Content-Type': 'application/json',
    };

    const audit = auditSecurityHeaders('http://api.insecure.org/data', headers);
    expect(audit.score).toBeLessThanOrEqual(50);
    expect(['D', 'F']).toContain(audit.grade);

    const protoFinding = audit.findings.find((f) => f.id === 'insecure-http');
    expect(protoFinding).toBeDefined();
    expect(protoFinding?.status).toBe('fail');
  });

  it('flags dangerous CORS wildcard combined with credentials', () => {
    const headers = {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'",
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true',
    };

    const audit = auditSecurityHeaders('https://api.example.com/data', headers);
    const corsFinding = audit.findings.find((f) => f.id === 'cors-wildcard-credentials');
    expect(corsFinding).toBeDefined();
    expect(corsFinding?.status).toBe('fail');
    expect(corsFinding?.scoreImpact).toBe(30);
  });

  it('warns when X-Content-Type-Options: nosniff is missing', () => {
    const headers = {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'",
      'X-Frame-Options': 'SAMEORIGIN',
    };

    const audit = auditSecurityHeaders('https://api.example.com/data', headers);
    const mimeFinding = audit.findings.find((f) => f.id === 'x-content-type-missing');
    expect(mimeFinding).toBeDefined();
    expect(mimeFinding?.status).toBe('warning');
  });

  it('audits Set-Cookie flags for Secure, HttpOnly, and SameSite', () => {
    const headers = {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'",
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Set-Cookie': 'auth_token=xyz123; Path=/',
    };

    const audit = auditSecurityHeaders('https://api.example.com/login', headers);
    const insecureCookie = audit.findings.find((f) => f.id === 'cookie-insecure');
    const noHttpOnly = audit.findings.find((f) => f.id === 'cookie-no-httponly');
    const noSameSite = audit.findings.find((f) => f.id === 'cookie-no-samesite');

    expect(insecureCookie).toBeDefined();
    expect(noHttpOnly).toBeDefined();
    expect(noSameSite).toBeDefined();
  });
});
