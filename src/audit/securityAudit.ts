import { SecurityAuditResult, SecurityFinding, SecurityGrade } from '../types/index.js';

export function auditSecurityHeaders(
  url: string,
  responseHeaders: Record<string, string>
): SecurityAuditResult {
  // Normalize header keys to lowercase
  const headers: Record<string, string> = {};
  for (const [k, v] of Object.entries(responseHeaders)) {
    headers[k.toLowerCase()] = v;
  }

  const findings: SecurityFinding[] = [];
  let score = 100;
  const isHttps = url.toLowerCase().startsWith('https://');

  const headersChecked = {
    hsts: false,
    csp: false,
    cors: false,
    xContentType: false,
    xFrame: false,
    referrerPolicy: false,
    permissionsPolicy: false,
  };

  // 1. Protocol check & HSTS
  if (!isHttps && !url.includes('localhost') && !url.includes('127.0.0.1')) {
    findings.push({
      id: 'insecure-http',
      header: 'Protocol',
      status: 'fail',
      title: 'Insecure Plaintext HTTP Protocol',
      description: 'The request was transmitted over plaintext HTTP without TLS encryption.',
      recommendation: 'Enforce HTTPS for all external API endpoints and redirect HTTP traffic.',
      scoreImpact: 35,
    });
    score -= 35;
  } else {
    const hsts = headers['strict-transport-security'];
    if (hsts) {
      headersChecked.hsts = true;
      const maxAgeMatch = hsts.match(/max-age=(\d+)/i);
      const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 0;
      const hasSubDomains = /includesubdomains/i.test(hsts);
      const hasPreload = /preload/i.test(hsts);

      if (maxAge >= 31536000 && hasSubDomains) {
        findings.push({
          id: 'hsts-strong',
          header: 'Strict-Transport-Security',
          status: 'pass',
          title: 'Strong HSTS Policy Configured',
          description: `Strict-Transport-Security is active with max-age=${maxAge}s and includeSubDomains${hasPreload ? ' (preload ready)' : ''}.`,
          recommendation: 'Maintain this configuration to protect against SSL stripping attacks.',
          scoreImpact: 0,
        });
      } else {
        const issues: string[] = [];
        if (maxAge < 31536000) issues.push('max-age is below recommended 1 year (31536000s)');
        if (!hasSubDomains) issues.push('includeSubDomains directive is missing');

        findings.push({
          id: 'hsts-weak',
          header: 'Strict-Transport-Security',
          status: 'warning',
          title: 'Suboptimal HSTS Policy',
          description: `HSTS is present but suboptimal: ${issues.join(', ')}.`,
          recommendation: 'Set max-age=31536000; includeSubDomains; preload.',
          scoreImpact: 10,
        });
        score -= 10;
      }
    } else if (isHttps && !url.includes('localhost')) {
      findings.push({
        id: 'hsts-missing',
        header: 'Strict-Transport-Security',
        status: 'fail',
        title: 'Missing HSTS Header',
        description: 'No Strict-Transport-Security header was returned. Browsers may allow unencrypted connections.',
        recommendation: 'Add Strict-Transport-Security: max-age=31536000; includeSubDomains.',
        scoreImpact: 20,
      });
      score -= 20;
    }
  }

  // 2. Content-Security-Policy (CSP)
  const csp = headers['content-security-policy'];
  if (csp) {
    headersChecked.csp = true;
    const hasDefaultSrc = /default-src/i.test(csp);
    const hasScriptSrc = /script-src/i.test(csp);
    const hasUnsafeInline = /'unsafe-inline'/i.test(csp);
    const hasUnsafeEval = /'unsafe-eval'/i.test(csp);
    const hasWildcard = /(default-src|script-src)[^;]*\*/i.test(csp);

    if (hasUnsafeInline || hasUnsafeEval || hasWildcard) {
      const flaws: string[] = [];
      if (hasUnsafeInline) flaws.push("'unsafe-inline'");
      if (hasUnsafeEval) flaws.push("'unsafe-eval'");
      if (hasWildcard) flaws.push('wildcard domain (*)');

      findings.push({
        id: 'csp-permissive',
        header: 'Content-Security-Policy',
        status: 'warning',
        title: 'CSP Contains Permissive Directives',
        description: `CSP allows insecure execution constructs: ${flaws.join(', ')}.`,
        recommendation: 'Remove unsafe-inline and unsafe-eval by using nonces or SHA-256 hashes.',
        scoreImpact: 15,
      });
      score -= 15;
    } else if (!hasDefaultSrc && !hasScriptSrc) {
      findings.push({
        id: 'csp-incomplete',
        header: 'Content-Security-Policy',
        status: 'warning',
        title: 'CSP Missing Default or Script Directives',
        description: 'CSP does not define default-src or script-src fallback rules.',
        recommendation: "Define a restrictive default-src 'self' baseline directive.",
        scoreImpact: 10,
      });
      score -= 10;
    } else {
      findings.push({
        id: 'csp-strong',
        header: 'Content-Security-Policy',
        status: 'pass',
        title: 'Strict Content-Security-Policy',
        description: 'Strong CSP baseline active without unsafe directives.',
        recommendation: 'Regularly audit script origins and third-party integrations.',
        scoreImpact: 0,
      });
    }
  } else {
    findings.push({
      id: 'csp-missing',
      header: 'Content-Security-Policy',
      status: 'warning',
      title: 'Missing Content-Security-Policy',
      description: 'Without CSP, the browser cannot restrict resource loading or mitigate XSS attacks.',
      recommendation: "Configure Content-Security-Policy with at least default-src 'self'.",
      scoreImpact: 20,
    });
    score -= 20;
  }

  // 3. CORS & Origin Policies
  const allowOrigin = headers['access-control-allow-origin'];
  const allowCredentials = headers['access-control-allow-credentials'];
  if (allowOrigin) {
    headersChecked.cors = true;
    if (allowOrigin === '*' && allowCredentials === 'true') {
      findings.push({
        id: 'cors-wildcard-credentials',
        header: 'Access-Control-Allow-Origin',
        status: 'fail',
        title: 'Critical CORS Misconfiguration: Wildcard with Credentials',
        description: 'Access-Control-Allow-Origin is set to * while Access-Control-Allow-Credentials is true.',
        recommendation: 'Do not use wildcard * with credentials. Specify exact trusted origin domains.',
        scoreImpact: 30,
      });
      score -= 30;
    } else if (allowOrigin === '*') {
      findings.push({
        id: 'cors-wildcard',
        header: 'Access-Control-Allow-Origin',
        status: 'warning',
        title: 'Public CORS Wildcard Allowed',
        description: 'Access-Control-Allow-Origin: * permits any external website to read this response.',
        recommendation: 'If this endpoint exposes sensitive data or user sessions, restrict to authorized origins.',
        scoreImpact: 10,
      });
      score -= 10;
    } else {
      findings.push({
        id: 'cors-restricted',
        header: 'Access-Control-Allow-Origin',
        status: 'pass',
        title: 'Restricted CORS Origin',
        description: `Access restricted to specific origin: ${allowOrigin}`,
        recommendation: 'Verify that this origin list is kept minimal and valid.',
        scoreImpact: 0,
      });
    }
  }

  // 4. X-Content-Type-Options
  const xContentType = headers['x-content-type-options'];
  if (xContentType && xContentType.toLowerCase().includes('nosniff')) {
    headersChecked.xContentType = true;
    findings.push({
      id: 'x-content-type-pass',
      header: 'X-Content-Type-Options',
      status: 'pass',
      title: 'MIME-Sniffing Protection Active',
      description: 'X-Content-Type-Options is set to nosniff, preventing MIME-type confusion attacks.',
      recommendation: 'Keep this header enabled across all API endpoints.',
      scoreImpact: 0,
    });
  } else {
    findings.push({
      id: 'x-content-type-missing',
      header: 'X-Content-Type-Options',
      status: 'warning',
      title: 'Missing X-Content-Type-Options: nosniff',
      description: 'The browser may attempt to sniff and execute content types different from the declared header.',
      recommendation: 'Add X-Content-Type-Options: nosniff to all responses.',
      scoreImpact: 10,
    });
    score -= 10;
  }

  // 5. X-Frame-Options (or CSP frame-ancestors)
  const xFrame = headers['x-frame-options'];
  const hasFrameAncestors = csp && /frame-ancestors/i.test(csp);
  if (xFrame || hasFrameAncestors) {
    headersChecked.xFrame = true;
    const frameVal = (xFrame || '').toUpperCase();
    if (frameVal === 'DENY' || frameVal === 'SAMEORIGIN' || hasFrameAncestors) {
      findings.push({
        id: 'clickjacking-pass',
        header: 'X-Frame-Options',
        status: 'pass',
        title: 'Clickjacking Protection Active',
        description: `Framing is restricted (${hasFrameAncestors ? 'CSP frame-ancestors' : frameVal}).`,
        recommendation: 'Maintain framing protections on sensitive API consoles and dashboards.',
        scoreImpact: 0,
      });
    } else {
      findings.push({
        id: 'clickjacking-weak',
        header: 'X-Frame-Options',
        status: 'warning',
        title: 'Weak Frame Option',
        description: `X-Frame-Options is set to ${xFrame}, which may be obsolete or inadequate.`,
        recommendation: 'Use DENY or SAMEORIGIN, or migrate to CSP frame-ancestors.',
        scoreImpact: 5,
      });
      score -= 5;
    }
  } else {
    findings.push({
      id: 'clickjacking-missing',
      header: 'X-Frame-Options',
      status: 'warning',
      title: 'Missing Clickjacking Protection',
      description: 'Neither X-Frame-Options nor CSP frame-ancestors was detected.',
      recommendation: 'Add X-Frame-Options: DENY or SAMEORIGIN.',
      scoreImpact: 10,
    });
    score -= 10;
  }

  // 6. Referrer-Policy
  const referrerPolicy = headers['referrer-policy'];
  if (referrerPolicy) {
    headersChecked.referrerPolicy = true;
    const policy = referrerPolicy.toLowerCase();
    const safePolicies = [
      'no-referrer',
      'same-origin',
      'strict-origin',
      'strict-origin-when-cross-origin',
    ];
    if (safePolicies.some((p) => policy.includes(p))) {
      findings.push({
        id: 'referrer-policy-safe',
        header: 'Referrer-Policy',
        status: 'pass',
        title: 'Secure Referrer Policy',
        description: `Referrer policy is configured as '${referrerPolicy}'.`,
        recommendation: 'Protects URLs containing sensitive query parameters from leaking.',
        scoreImpact: 0,
      });
    } else {
      findings.push({
        id: 'referrer-policy-weak',
        header: 'Referrer-Policy',
        status: 'warning',
        title: 'Permissive Referrer Policy',
        description: `Referrer policy '${referrerPolicy}' may leak sensitive query parameters across unencrypted origins.`,
        recommendation: 'Set Referrer-Policy: strict-origin-when-cross-origin.',
        scoreImpact: 5,
      });
      score -= 5;
    }
  } else {
    findings.push({
      id: 'referrer-policy-missing',
      header: 'Referrer-Policy',
      status: 'info',
      title: 'Default Referrer Policy in Use',
      description: 'No explicit Referrer-Policy header specified. The browser default will apply.',
      recommendation: 'Explicitly specify Referrer-Policy: strict-origin-when-cross-origin.',
      scoreImpact: 5,
    });
    score -= 5;
  }

  // 7. Permissions-Policy
  const permissionsPolicy = headers['permissions-policy'] || headers['feature-policy'];
  if (permissionsPolicy) {
    headersChecked.permissionsPolicy = true;
    findings.push({
      id: 'permissions-policy-pass',
      header: 'Permissions-Policy',
      status: 'pass',
      title: 'Browser Feature Isolation Configured',
      description: 'Permissions-Policy is present, restricting access to sensitive browser APIs (camera, geolocation).',
      recommendation: 'Ensure camera, microphone, and payment directives are restricted to expected domains.',
      scoreImpact: 0,
    });
  } else {
    findings.push({
      id: 'permissions-policy-missing',
      header: 'Permissions-Policy',
      status: 'info',
      title: 'Missing Permissions-Policy',
      description: 'Permissions-Policy allows fine-grained restriction of browser features for third parties.',
      recommendation: 'Add Permissions-Policy: camera=(), microphone=(), geolocation=().',
      scoreImpact: 5,
    });
    score -= 5;
  }

  // 8. Cookie Security Audit (Set-Cookie)
  const setCookie = headers['set-cookie'];
  if (setCookie) {
    const cookies = setCookie.split('\n');
    for (const cookie of cookies) {
      const cookieLower = cookie.toLowerCase();
      const hasSecure = cookieLower.includes('secure');
      const hasHttpOnly = cookieLower.includes('httponly');
      const hasSameSite = cookieLower.includes('samesite');

      if (!hasSecure && isHttps) {
        findings.push({
          id: 'cookie-insecure',
          header: 'Set-Cookie',
          status: 'warning',
          title: 'Cookie Missing Secure Flag',
          description: 'A cookie was set over HTTPS without the Secure flag, allowing transmission over HTTP.',
          recommendation: 'Append the Secure flag to all sensitive cookies.',
          scoreImpact: 10,
        });
        score -= 10;
      }
      if (!hasHttpOnly && (cookieLower.includes('sess') || cookieLower.includes('token') || cookieLower.includes('auth'))) {
        findings.push({
          id: 'cookie-no-httponly',
          header: 'Set-Cookie',
          status: 'warning',
          title: 'Auth Cookie Missing HttpOnly Flag',
          description: 'An authentication/session cookie is accessible by client-side JavaScript.',
          recommendation: 'Add HttpOnly to prevent session theft via XSS vulnerabilities.',
          scoreImpact: 10,
        });
        score -= 10;
      }
      if (!hasSameSite) {
        findings.push({
          id: 'cookie-no-samesite',
          header: 'Set-Cookie',
          status: 'warning',
          title: 'Cookie Missing SameSite Flag',
          description: 'No SameSite protection found, increasing exposure to Cross-Site Request Forgery (CSRF).',
          recommendation: 'Set SameSite=Lax or SameSite=Strict for state-changing cookies.',
          scoreImpact: 5,
        });
        score -= 5;
      }
    }
  }

  // Calculate final score and letter grade
  score = Math.max(0, Math.min(100, score));

  let grade: SecurityGrade = 'F';
  if (score >= 95) grade = 'A+';
  else if (score >= 85) grade = 'A';
  else if (score >= 70) grade = 'B';
  else if (score >= 55) grade = 'C';
  else if (score >= 40) grade = 'D';
  else grade = 'F';

  let summary = '';
  if (grade === 'A+' || grade === 'A') {
    summary = 'Strong security posture. Key headers (HSTS, CSP, CORS) are correctly configured.';
  } else if (grade === 'B') {
    summary = 'Good baseline, but missing optimal CSP directives or comprehensive HSTS subdomains.';
  } else if (grade === 'C') {
    summary = 'Moderate risk. Missing multiple defensive headers such as CSP or MIME protection.';
  } else if (grade === 'D') {
    summary = 'Elevated risk. Permissive CORS or missing HSTS leaves communication vulnerable.';
  } else {
    summary = 'Critical security posture. Insecure transport, permissive wildcards, or absent defenses detected.';
  }

  return {
    grade,
    score,
    summary,
    findings,
    headersChecked,
  };
}
