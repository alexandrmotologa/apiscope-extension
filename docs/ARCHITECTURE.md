# Architecture Overview

This document describes the design, data flow, and runtime components of APIScope.

## System components

APIScope operates in two modes:
1. **Chromium Extension Mode**: Runs inside Chrome, Brave, or Edge under Manifest V3.
2. **Standalone Web Mode**: Runs in a normal browser tab for development and testing (`npm run dev:web`), using mock network generators.

```
+-------------------------------------------------------------+
|                      Chromium Browser                       |
|                                                             |
|  Active Web Page                                            |
|       | (fetch / xhr)                                       |
|       v                                                     |
|  [ chrome.webRequest Lifecycle ]                            |
|       |                                                     |
|       v                                                     |
|  Background Service Worker (src/background/serviceWorker.ts)|
|       |                                                     |
|       +--> Performs OWASP Security Audit                    |
|       +--> Performs GraphQL AST Detection                   |
|       +--> Stores in Tab Ring Buffer (max 150 items)        |
|       +--> Persists in chrome.storage.session               |
|                                                             |
|  UI Layer (index.html)                                      |
|       +--> Popup View (compact 400x560 frame)               |
|       +--> Chrome Side Panel View (split desktop view)      |
|       +--> Message bridge: GET_TAB_REQUESTS                 |
+-------------------------------------------------------------+
```

## Manifest V3 network interception

Chrome Manifest V3 uses a non-persistent background service worker instead of persistent background pages. APIScope hooks into the `chrome.webRequest` API to capture network traffic with minimal overhead:

1. **onBeforeRequest**: Filters requests by type (`xmlhttprequest`, `ping`). Extracts request ID, start timestamp, destination URL, and raw request body bytes via `TextDecoder`.
2. **onSendHeaders**: Captures outgoing HTTP request headers (Authorization, Content-Type, Accept, custom headers) and pairs them with the in-flight request ID.
3. **onHeadersReceived**: Captures response headers and status codes. Measures total latency in milliseconds (`Date.now() - startTime`).
4. **Audit and Storage**: The service worker triggers `auditSecurityHeaders()` and `parseGraphQLRequest()` synchronously, updates the tab's circular buffer, and cleans up the in-flight map.

## Data storage and memory bounds

- Each browser tab maintains its own isolated ring buffer of captured requests.
- The default limit is 150 requests per tab to avoid excessive memory usage.
- Buffers are stored in `chrome.storage.session`, which automatically clears when the browser session terminates.

## Multi-entry Vite build

Standard Vite setups typically target single-page web applications. APIScope uses a multi-entry Rollup configuration in `vite.config.ts`:

- Entry 1: `index.html` (the React user interface used by both popup and side panel views).
- Entry 2: `src/background/serviceWorker.ts` (compiled directly to `dist/serviceWorker.js`).
- Output: `scripts/copy-manifest.js` moves `manifest.json` and static icons into `dist/`.

## Standalone preview architecture

When `useNetworkCapture` detects that `chrome.runtime` is missing, it automatically switches to standalone preview mode. In this mode:
- It loads realistic mock traffic including Stripe, Shopify GraphQL, GitHub REST, and internal APIs.
- A controllable stream generator periodically simulates incoming traffic.
- Developers can switch between the Side Panel view and an exact 400x560 extension popup frame directly in their browser.
