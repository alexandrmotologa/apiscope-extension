import { describe, it, expect } from 'vitest';
import { parseJwt, extractJwtTokens } from '../src/audit/jwtInspector.js';

describe('JWT Inspector', () => {
  const sampleValidJwt =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfOTAwMSIsIm5hbWUiOiJBbGV4IERldmVsb3BlciIsInJvbGVzIjpbImFkbWluIl0sImlhdCI6MTcxMDAwMDAwMCwiZXhwIjoyMDgwMDAwMDAwfQ.c2FtcGxlLXNpZ25hdHVyZQ';

  const sampleExpiredJwt =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfOTAwMSIsImlhdCI6MTUwMDAwMDAwMCwiZXhwIjoxNTAwMDAzNjAwfQ.ZXhwaXJlZC1zaWc';

  it('correctly decodes header and payload claims of a valid JWT', () => {
    const decoded = parseJwt(sampleValidJwt, 'header', 'authorization');
    expect(decoded).not.toBeNull();
    expect(decoded?.subject).toBe('usr_9001');
    expect(decoded?.header.alg).toBe('HS256');
    expect(decoded?.payload.name).toBe('Alex Developer');
    expect(decoded?.isExpired).toBe(false);
    expect(decoded?.statusText).toBe('ACTIVE');
    expect(decoded?.timeRemainingStr).toContain('Active (expires in');
  });

  it('identifies expired JWTs and computes elapsed time', () => {
    const decoded = parseJwt(sampleExpiredJwt, 'header', 'authorization');
    expect(decoded).not.toBeNull();
    expect(decoded?.isExpired).toBe(true);
    expect(decoded?.statusText).toBe('EXPIRED');
    expect(decoded?.timeRemainingStr).toContain('Expired');
  });

  it('returns null for non-JWT strings or malformed base64', () => {
    expect(parseJwt('not-a-jwt', 'header', 'test')).toBeNull();
    expect(parseJwt('a.b', 'header', 'test')).toBeNull();
    expect(parseJwt('eyJinvalid.eyJpayload.sig', 'header', 'test')).toBeNull();
  });

  it('scans headers and bodies to extract multiple tokens', () => {
    const reqHeaders = {
      authorization: `Bearer ${sampleValidJwt}`,
    };
    const resHeaders = {
      'x-auth-token': sampleExpiredJwt,
    };
    const body = JSON.stringify({ token: sampleValidJwt });

    const tokens = extractJwtTokens(reqHeaders, resHeaders, body, null);
    expect(tokens.length).toBe(2); // De-duplicates identical tokens
    expect(tokens.some(t => t.subject === 'usr_9001')).toBe(true);
  });
});
