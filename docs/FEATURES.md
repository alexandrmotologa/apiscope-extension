# APIScope Feature Guide

This guide details the features implemented in APIScope and explains how to use them during web development, debugging, and security assessments.

---

## 1. Power Search & Filter Syntax

APIScope includes a structured search parser. Type tokens directly into the search bar:

| Token | Description | Example |
| :--- | :--- | :--- |
| `status:<code/range>` | Filters by HTTP status code or family | `status:500`, `status:4xx`, `status:2xx` |
| `method:<verb>` | Filters by HTTP method | `method:POST`, `method:DELETE` |
| `domain:<text>` | Filters by target host domain | `domain:stripe.com`, `domain:github` |
| `path:<text>` | Filters by endpoint path | `path:/v1/checkout` |
| `grade:<grade>` | Filters by OWASP security grade | `grade:F`, `grade:A+` |
| `is:error` | Shows all client and server errors (4xx, 5xx) | `is:error` |
| `is:slow` | Shows calls with latency exceeding 500ms | `is:slow` |
| `is:starred` | Shows user-pinned requests | `is:starred` |
| `has:jwt` | Shows requests containing decoded JWTs | `has:jwt` |
| `has:auth` | Shows requests containing authentication credentials | `has:auth` |

You can combine tokens with text:
```
status:4xx domain:api.stripe.com
```

---

## 2. JWT & Authentication Inspector

When an endpoint uses JSON Web Tokens (in `Authorization`, custom headers, cookies, or body payloads):
1. APIScope extracts the token without external network calls.
2. The **JWT & Auth** tab displays decoded headers and payload claims (`sub`, `iss`, `aud`, `exp`, `iat`).
3. An active/expired badge and human-readable countdown are calculated automatically (*"Active (expires in 38m)"*).
4. Use the **Mask Secrets** toggle in the top bar to obscure sensitive strings when sharing screens or recording bug reports.

---

## 3. 1-Click TypeScript & Zod Schema Generator

When working with APIs that lack generated client libraries, select any request, open the **Payload** tab, and switch modes:
- **Pretty / Raw**: Formats JSON payloads with line numbers and search.
- **TS Types**: Generates TypeScript interfaces with inferred primitive types, nested objects, and arrays.
- **Zod**: Generates complete Zod schemas with type exports via `z.infer`.

Click the **Copy** button to place the generated code onto your clipboard.

---

## 4. HTTP Archive (HAR 1.2) Import & Export

- **Export HAR**: Click the **Export HAR** icon in the toolbar to save the current session or filtered calls into standard `.har` format.
- **Import HAR**: Click the **Import HAR** icon or drag & drop a `.har` file exported from Chrome DevTools, Charles, or Proxyman. APIScope parses each entry, runs OWASP security audits, detects GraphQL operations, and populates the request table.

---

## 5. OpenAPI 3.0 & Postman Collection Exporters

From the **Export** tab:
- **Postman Collection v2.1.0**: Generates a standard collection containing endpoints, headers, query parameters, and saved request/response bodies.
- **OpenAPI 3.0 Spec**: Deduces request and response schemas from captured JSON traffic and compiles an OpenAPI 3.0.3 specification draft.

---

## 6. Traffic Analytics & Latency Rankings

Click the **Analytics** icon in the toolbar (or press `A` on your keyboard) to view:
- Top 5 slowest endpoints ranked by round-trip latency.
- HTTP method distribution (percentage and count).
- Response status breakdown (2xx, 3xx, 4xx, 5xx).
- Overall domain security compliance score.
- Total payload bandwidth consumed during the session.

---

## 7. Mock Rules & Error Interceptor

Test how client-side applications handle failures before deploying backend changes:
1. Click the **Sliders** icon in the toolbar (or press `M`).
2. Add a rule matching an endpoint path (e.g. `/api/v1/payment`).
3. Set the override status (e.g. `500` or `401`), provide a custom response body, or specify artificial delay in milliseconds (e.g. `2000ms`).
4. Toggle rules on or off at will.
