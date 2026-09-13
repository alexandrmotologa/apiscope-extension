# APIScope

APIScope is an open-source Chromium extension (Manifest V3) and standalone developer tool for real-time API sniffing, OWASP security header auditing, JWT inspection, payload type generation, and export to cURL, Postman, OpenAPI, HAR, and RestPocket.

It works both as an unpacked browser extension (running in Chrome, Brave, Edge) and as a local web studio with live simulated network traffic.

---

## Quick start

### 1. Install dependencies
```bash
npm install
```

### 2. Run the local preview studio
To test and inspect the interface in a standard browser tab without installing the extension:
```bash
npm run dev:web
```
Open `http://localhost:5173` in your browser. The app runs with built-in mock network traffic, a continuous streaming traffic simulator, and a toggle to preview the 400x560 popup frame.

### 3. Build the extension
```bash
npm run build
```
This runs TypeScript checks, bundles the interface and background service worker with Vite, and copies `manifest.json` and extension icons into `dist/`.

### 4. Load into Chrome, Brave, or Edge
1. Open `chrome://extensions/` (or `brave://extensions/`, `edge://extensions/`).
2. Enable **Developer mode** using the toggle in the upper-right corner.
3. Click **Load unpacked**.
4. Select the `dist/` directory inside this repository.
5. Click the APIScope icon in the browser toolbar or open it via the Chrome Side Panel.

---

## Core capabilities

### Real-time API capture
The background service worker listens to `chrome.webRequest` events, intercepting API calls initiated by active browser tabs:
- HTTP method, status code, and status text
- Target URL, domain, and path
- Precise latency in milliseconds
- Request and response headers
- JSON or raw body payloads
- Circular buffer per tab (up to 150 items) stored in session memory

### Power search & filter syntax
Filter through hundreds of network calls using instant filter syntax:
- `status:200`, `status:4xx`, `status:500`
- `method:POST`, `method:DELETE`
- `domain:api.stripe.com`, `path:/v1/checkout`
- `grade:F`, `grade:A+`
- `is:error`, `is:slow`, `is:starred`
- `has:jwt`, `has:auth`

Quick-filter chips provide 1-click filtering:
`All` | `Errors (4xx/5xx)` | `Slow (>500ms)` | `GraphQL` | `Auth & JWT` | `Security Alerts` | `⭐ Starred`

### OWASP security header auditing
Every HTTP response is audited against defensive security guidelines:
- `Strict-Transport-Security` (max-age >= 1 year, includeSubDomains, preload)
- `Content-Security-Policy` (checks for default-src, script-src, flags unsafe-inline, unsafe-eval, and wildcards)
- `Access-Control-Allow-Origin` (CORS: flags open wildcard `*` with credentials)
- `X-Content-Type-Options` (checks for `nosniff`)
- `X-Frame-Options` (anti-clickjacking: `DENY` or `SAMEORIGIN`)
- `Referrer-Policy` (checks for secure referral leakage)
- `Permissions-Policy` (hardware and sensor isolation)
- `Set-Cookie` (checks for `Secure`, `HttpOnly`, `SameSite`)

Responses receive a score from 0 to 100, a letter grade from `A+` down to `F`, and remediation advice. You can download an **OWASP Compliance Report** in HTML or Markdown with one click.

### JWT & authentication inspector
When requests or responses contain JWT tokens (in `Authorization: Bearer`, custom headers, cookies, or bodies):
- Decodes header and payload claims (`sub`, `iss`, `exp`, `iat`, `roles`) without sending data to third parties
- Displays token validity status (`ACTIVE` vs `EXPIRED`) and countdown (*"Active (expires in 45m)"*)
- Includes a **Mask Secrets** toggle (`••••••••`) to hide tokens, passwords, and private keys during screen sharing or demos

### PII & credential leakage scanner
Scans incoming and outgoing calls for sensitive data leaks:
- API tokens or passwords passed in URL query parameters (`?token=...`, `?key=...`)
- Plaintext passwords submitted via GET requests
- Unencrypted RSA/EC private keys in payloads
- Credit card numbers validated with the Luhn algorithm

### 1-Click TypeScript & Zod schema generator
In the **Payload** tab, inspect any incoming or outgoing JSON and click:
- `TS Types`: generates clean, nested TypeScript interfaces ready to paste into your codebase
- `Zod`: generates a complete Zod validation schema with `z.infer` type exports

### Industry export & interoperability
Export captured traffic to popular developer tools:
- **cURL**: copy clean shell commands with headers and escaped payloads
- **Postman Collection (v2.1.0)**: download a ready-to-import Postman JSON collection
- **OpenAPI (3.0.3)**: generate an inferred Swagger/OpenAPI specification
- **HTTP Archive (HAR 1.2)**: export complete session logs or drag & drop external `.har` files to inspect and audit them
- **RestPocket**: 1-click deep link to replay requests in RestPocket or export collection JSON
- **Code**: copy Python (`requests`), JavaScript (`fetch`), or HTTPie syntax

### Traffic analytics & performance waterfall
Click the **Analytics** icon to open the metrics dashboard:
- HTTP method distribution and response status code breakdown
- Ranking of the top 5 slowest API endpoints
- Average round-trip latency and total payload transfer volume
- Overall domain security health and vulnerability counts

### Mock rules & error interceptor
Configure local mock rules to test how your frontend responds to edge cases:
- Override HTTP status codes (e.g. inject 500 Server Error or 401 Unauthorized)
- Return custom mock response JSON bodies
- Inject artificial latency (e.g. +1500ms) to test loading skeletons

### Side-by-side request diff
Select any request as Request A and click the compare icon on another call (Request B). APIScope highlights added, removed, and modified values across headers, query parameters, and JSON payloads.

### Replay & tamper simulator
Edit endpoints, methods, headers, or body payloads directly in the interface and re-dispatch requests to test backend handling without leaving the panel.

---

## Keyboard shortcuts

| Shortcut | Description |
| :--- | :--- |
| `Ctrl + K` or `/` | Focus search bar |
| `J` or `↓` | Select next request in list |
| `K` or `↑` | Select previous request in list |
| `C` | Copy selected request as cURL |
| `R` | Open Tamper & Replay tab |
| `D` | Open Side-by-Side Diff comparison |
| `S` | Toggle Star / Pin favorite on selected call |
| `A` | Open Analytics & Performance Dashboard |
| `M` | Open Mock Rules & Error Interceptor |
| `?` | Show Keyboard Shortcuts cheat sheet |
| `Esc` | Close dialogs or blur inputs |

---

## Running tests

```bash
npm test
```
The Vitest suite covers security audit heuristics, JWT parsing, PII detection, GraphQL parsing, HAR import/export, and code/schema generators across 34 automated unit tests.

---

## Repository layout

```
apiscope-extension/
├── manifest.json              # Chromium Manifest V3 configuration
├── package.json
├── tsconfig.json
├── vite.config.ts             # Bundler configuration for UI and service worker
├── public/                    # Extension icons and assets
├── src/
│   ├── audit/
│   │   ├── securityAudit.ts   # OWASP scoring engine
│   │   ├── jwtInspector.ts    # JWT decoder and expiration calculator
│   │   ├── piiScanner.ts      # Data leakage and credential scanner
│   │   ├── securityReport.ts  # Markdown and HTML report generator
│   │   └── graphqlParser.ts   # GraphQL detector and query formatter
│   ├── background/
│   │   └── serviceWorker.ts   # webRequest listener and tab ring buffer
│   ├── components/            # UI components (tables, viewers, modals)
│   ├── exporters/             # cURL, Python, fetch, Postman, OpenAPI, HAR, RestPocket
│   ├── hooks/                 # Chrome runtime and mock capture hook
│   ├── mock/                  # Realistic mock dataset for standalone preview
│   ├── views/                 # PopupView, SidePanelView, StandaloneDevView
│   └── types/                 # Shared TypeScript interfaces
├── test/                      # Vitest test files
└── docs/                      # Technical documentation
```

---

## License

MIT License. See [LICENSE](LICENSE) for details.
