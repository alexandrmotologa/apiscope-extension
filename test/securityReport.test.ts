import { describe, it, expect } from 'vitest';
import {
  calculateAverageGrade,
  generateMarkdownSecurityReport,
  generateHtmlSecurityReport,
} from '../src/audit/securityReport.js';
import { NetworkRequest } from '../src/types/index.js';
import { auditSecurityHeaders } from '../src/audit/securityAudit.js';

describe('Security Compliance Report Generator', () => {
  const reqSecure: NetworkRequest = {
    id: 'req_1',
    tabId: 1,
    url: 'https://secure.api.com/v1/data',
    path: '/v1/data',
    domain: 'secure.api.com',
    method: 'GET',
    status: 200,
    type: 'fetch',
    startTime: Date.now(),
    durationMs: 40,
    requestHeaders: {},
    responseHeaders: {
      'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
      'content-security-policy': "default-src 'none'",
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'referrer-policy': 'strict-origin-when-cross-origin',
      'permissions-policy': 'camera=()',
    },
    timestamp: '12:00',
  };
  reqSecure.securityAudit = auditSecurityHeaders(reqSecure.url, reqSecure.responseHeaders);

  const reqInsecure: NetworkRequest = {
    id: 'req_2',
    tabId: 1,
    url: 'http://insecure.api.com/v1/legacy',
    path: '/v1/legacy',
    domain: 'insecure.api.com',
    method: 'GET',
    status: 200,
    type: 'fetch',
    startTime: Date.now(),
    durationMs: 40,
    requestHeaders: {},
    responseHeaders: {
      'access-control-allow-origin': '*',
    },
    timestamp: '12:00',
  };
  reqInsecure.securityAudit = auditSecurityHeaders(reqInsecure.url, reqInsecure.responseHeaders);

  it('calculates aggregate score and average letter grade correctly', () => {
    const { score, grade } = calculateAverageGrade([100, 95]);
    expect(grade).toBe('A+');
    expect(score).toBe(98);

    const failAvg = calculateAverageGrade([30, 20]);
    expect(failAvg.grade).toBe('F');
  });

  it('generates GitHub-flavored Markdown report with executive summary and findings', () => {
    const md = generateMarkdownSecurityReport([reqSecure, reqInsecure]);
    expect(md).toContain('# APIScope — OWASP HTTP Security Compliance Report');
    expect(md).toContain('## Executive Summary');
    expect(md).toContain('## Tested Endpoints & Audit Results');
    expect(md).toContain('`GET`');
    expect(md).toContain('`/v1/data`');
    expect(md).toContain('`http://insecure.api.com/v1/legacy`');
  });

  it('generates standalone HTML report with CSS styling and score badges', () => {
    const html = generateHtmlSecurityReport([reqSecure, reqInsecure]);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('APIScope — OWASP Security Report');
    expect(html).toContain('score-grade');
    expect(html).toContain('/v1/data');
  });
});
