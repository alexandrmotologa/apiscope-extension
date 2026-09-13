# APIScope

APIScope is a Chromium extension (Manifest V3) and standalone web tool for inspecting browser network calls, grading HTTP security headers against OWASP guidelines, extracting GraphQL operations, and exporting requests to cURL, Python, fetch, and RestPocket.

The project works both as an unpacked browser extension and as a local web app with simulated network traffic.

## Quick start

### 1. Install dependencies
```bash
npm install
```

### 2. Run the local preview
To test and inspect the interface in a standard browser tab without installing the extension:
```bash
npm run dev:web
```
Open `http://localhost:5173` in your browser. The app runs with built-in mock network traffic, a live traffic simulator, and a toggle to preview the 400x560 popup frame.

### 3. Build the extension
```bash
npm run build
```
This command checks TypeScript types, bundles the interface and background service worker with Vite, and copies `manifest.json` and icons into the `dist/` directory.

### 4. Load into Chrome, Brave, or Edge
1. Open `chrome://extensions/` (or `brave://extensions/`, `edge://extensions/`).
2. Enable **Developer mode** using the toggle in the upper-right corner.
3. Click **Load unpacked**.
4. Select the `dist/` folder inside this repository.
5. Click the APIScope icon in the extension toolbar or open it via the Chrome Side Panel.

## Features

### API capture
The background service worker listens to `chrome.webRequest` events, capturing XHR and fetch requests initiated by active tabs. For each call, APIScope records:
- HTTP method, status code, and status text
- Target URL, domain, and path
- Precise latency in milliseconds
- Request and response headers
- JSON or raw body payloads

Requests are kept in a circular buffer per tab (up to 150 items) and saved in session storage.

### Security header audit
Each response is checked against common OWASP defensive headers:
- `Strict-Transport-Security` (HSTS: max-age, includeSubDomains, preload)
- `Content-Security-Policy` (CSP: presence of default-src or script-src, checks for unsafe-inline, unsafe-eval, and wildcards)
- `Access-Control-Allow-Origin` (CORS: flags wildcard `*` combined with credentials)
- `X-Content-Type-Options` (checks for `nosniff`)
- `X-Frame-Options` (checks for clickjacking defense: `DENY` or `SAMEORIGIN`)
- `Referrer-Policy` (checks for safe policies such as `strict-origin-when-cross-origin`)
- `Permissions-Policy` (checks for browser feature isolation)
- `Set-Cookie` (checks for `Secure`, `HttpOnly`, and `SameSite` attributes)

Responses receive an overall score from 0 to 100 and a letter grade from `A+` down to `F`, along with specific remediation recommendations.

### GraphQL parser
When a POST request contains a GraphQL query or when a GET request uses query parameters, APIScope extracts:
- Operation type (`query`, `mutation`, or `subscription`)
- Operation name
- Formatted query text
- Extracted variables formatted as JSON

### Request comparison
You can select any request as a baseline (Request A) and compare it against another call (Request B). The diff viewer highlights additions, removals, and changes across status codes, response headers, request headers, and payloads.

### Tamper and replay console
Edit target URLs, HTTP methods, headers, or payloads directly in the interface and send the modified request to test backend responses without leaving the panel.

### Code and RestPocket export
From the Export tab, you can copy:
- Runnable cURL commands (excluding browser pseudo-headers)
- Python snippets using `requests`
- JavaScript or TypeScript `fetch` blocks
- HTTPie command line syntax
- RestPocket `SavedRequestItem` JSON, downloadable collection JSON, and direct deep links

## Running tests

Unit tests cover the security audit heuristics, GraphQL detection, and code generators.
```bash
npm test
```

## Repository structure

```
apiscope-extension/
├── manifest.json              # Chromium Manifest V3 configuration
├── package.json
├── tsconfig.json
├── vite.config.ts             # Multi-entry build for UI and service worker
├── public/
│   └── icons/                 # Extension icons (16, 48, 128 px and SVG)
├── src/
│   ├── audit/
│   │   ├── securityAudit.ts   # OWASP scoring engine
│   │   └── graphqlParser.ts   # GraphQL detector and formatter
│   ├── background/
│   │   └── serviceWorker.ts   # webRequest listener and tab ring buffer
│   ├── components/            # UI elements (tables, badges, viewers)
│   ├── exporters/             # cURL, Python, fetch, and RestPocket exporters
│   ├── hooks/                 # Chrome runtime and mock capture hook
│   ├── mock/                  # Simulated API requests for preview mode
│   ├── views/                 # PopupView, SidePanelView, StandaloneDevView
│   └── types/                 # Shared TypeScript interfaces
├── test/                      # Vitest test suite
└── docs/                      # Technical documentation
```

## License

MIT License. See [LICENSE](LICENSE) for details.
