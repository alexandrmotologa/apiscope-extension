# Security Audit Rules and Scoring

APIScope evaluates HTTP responses against OWASP security guidelines. This document outlines the heuristics, score deductions, and grade brackets.

## Scoring scale and letter grades

Every response starts with a baseline score of 100 points. Deductions apply when defensive headers are missing, misconfigured, or permissive.

- **A+ (95 to 100 points)**: Strict transport, comprehensive CSP, restrictive CORS, nosniff, frame protection, and feature policies.
- **A (85 to 94 points)**: Solid security posture with minor non-critical omissions (e.g. missing experimental permissions policy).
- **B (70 to 84 points)**: Acceptable baseline, but missing subdomains in HSTS, or using a relaxed CSP policy.
- **C (55 to 69 points)**: Moderate risk. Missing several protective headers like CSP or nosniff.
- **D (40 to 54 points)**: High risk. Overly permissive CORS, obsolete frame headers, or short HSTS timeouts.
- **F (0 to 39 points)**: Critical posture. Plaintext unencrypted HTTP transport or wildcard CORS with credentials.

## Evaluated headers

### 1. Transport security (HSTS)
- **Header**: `Strict-Transport-Security`
- **Rule**: Must use HTTPS. If plaintext HTTP is used, a 35-point penalty applies.
- **Requirements**: `max-age` should be at least 31,536,000 seconds (1 year) and include `includeSubDomains`.
- **Deduction**:
  - Missing on HTTPS: -20 points
  - Present but `max-age < 31536000` or missing `includeSubDomains`: -10 points

### 2. Content-Security-Policy (CSP)
- **Header**: `Content-Security-Policy`
- **Rule**: Restricts script execution, styles, and external resource loading.
- **Requirements**: Must define `default-src` or `script-src` and avoid `unsafe-inline`, `unsafe-eval`, or wildcard sources `*`.
- **Deduction**:
  - Missing entirely: -20 points
  - Contains `unsafe-inline`, `unsafe-eval`, or `*`: -15 points
  - Missing baseline `default-src`: -10 points

### 3. Cross-Origin Resource Sharing (CORS)
- **Header**: `Access-Control-Allow-Origin`
- **Rule**: Prevents unauthorized domains from reading sensitive data.
- **Requirements**: Avoid `*` when sensitive data or authenticated endpoints are exposed.
- **Critical flaw**: Setting `Access-Control-Allow-Origin: *` together with `Access-Control-Allow-Credentials: true` is an immediate 30-point deduction.
- **Deduction**:
  - Wildcard `*` with credentials: -30 points
  - Generic wildcard `*`: -10 points

### 4. MIME-type sniffing protection
- **Header**: `X-Content-Type-Options`
- **Rule**: Prevents browsers from executing files based on guessed MIME types.
- **Requirement**: Must equal `nosniff`.
- **Deduction**: Missing or invalid: -10 points.

### 5. Clickjacking defense
- **Header**: `X-Frame-Options` or CSP `frame-ancestors`
- **Rule**: Restricts embedding pages inside external iframes.
- **Requirement**: `DENY`, `SAMEORIGIN`, or a restrictive `frame-ancestors` directive in CSP.
- **Deduction**: Missing clickjacking defense: -10 points.

### 6. Referrer leakage
- **Header**: `Referrer-Policy`
- **Rule**: Protects URLs containing sensitive tokens or query parameters from leaking to external referrers.
- **Requirement**: `strict-origin-when-cross-origin`, `no-referrer`, or `same-origin`.
- **Deduction**:
  - Permissive policies (`unsafe-url`, `no-referrer-when-downgrade`): -5 points
  - Unset: -5 points

### 7. Feature isolation
- **Header**: `Permissions-Policy` (formerly `Feature-Policy`)
- **Rule**: Restricts browser features such as camera, microphone, and geolocation.
- **Deduction**: Missing: -5 points.

### 8. Cookie security
- **Header**: `Set-Cookie`
- **Requirements**:
  - `Secure`: Ensures transmission only over HTTPS (-10 points if missing).
  - `HttpOnly`: Protects session and token cookies from JavaScript access (-10 points if missing).
  - `SameSite`: Protects against cross-site request forgery (-5 points if missing).
