/// <reference types="chrome"/>
import { NetworkRequest } from '../types/index.js';
import { auditSecurityHeaders } from '../audit/securityAudit.js';
import { parseGraphQLRequest } from '../audit/graphqlParser.js';

interface InFlightRequest {
  id: string;
  tabId: number;
  url: string;
  method: NetworkRequest['method'];
  type: NetworkRequest['type'];
  startTime: number;
  requestHeaders: Record<string, string>;
  requestBody?: string | null;
  initiator?: string;
}

// In-memory tab storage ring buffers (max 150 items per tab)
const TAB_REQUEST_LIMIT = 150;
const tabRequestsMap = new Map<number, NetworkRequest[]>();
const inFlightRequests = new Map<string, InFlightRequest>();

// Enable side panel behavior if supported
if (typeof chrome !== 'undefined' && chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {
    // Graceful fallback on browsers without sidePanel support
  });
}

// Intercept request start
if (typeof chrome !== 'undefined' && chrome.webRequest) {
  chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
      // Focus on API traffic: XMLHttpRequest and Fetch
      if (details.type !== 'xmlhttprequest' && details.type !== 'ping') {
        return;
      }

      let bodyStr: string | null = null;
      if (details.requestBody) {
        if (details.requestBody.raw && details.requestBody.raw[0] && details.requestBody.raw[0].bytes) {
          try {
            const decoder = new TextDecoder('utf-8');
            bodyStr = decoder.decode(details.requestBody.raw[0].bytes);
          } catch {
            bodyStr = null;
          }
        } else if (details.requestBody.formData) {
          bodyStr = JSON.stringify(details.requestBody.formData);
        }
      }

      inFlightRequests.set(details.requestId, {
        id: details.requestId,
        tabId: details.tabId,
        url: details.url,
        method: details.method as NetworkRequest['method'],
        type: details.type === 'xmlhttprequest' ? 'xmlhttprequest' : 'fetch',
        startTime: Date.now(),
        requestHeaders: {},
        requestBody: bodyStr,
        initiator: details.initiator,
      });
    },
    { urls: ['<all_urls>'], types: ['xmlhttprequest', 'ping'] },
    ['requestBody']
  );

  // Intercept request headers
  chrome.webRequest.onSendHeaders.addListener(
    (details) => {
      const inFlight = inFlightRequests.get(details.requestId);
      if (!inFlight) return;

      const headers: Record<string, string> = {};
      if (details.requestHeaders) {
        for (const h of details.requestHeaders) {
          if (h.name && h.value) {
            headers[h.name] = h.value;
          }
        }
      }
      inFlight.requestHeaders = headers;
    },
    { urls: ['<all_urls>'], types: ['xmlhttprequest', 'ping'] },
    ['requestHeaders', 'extraHeaders']
  );

  // Intercept response headers & complete
  chrome.webRequest.onHeadersReceived.addListener(
    (details) => {
      const inFlight = inFlightRequests.get(details.requestId);
      if (!inFlight) return;

      const responseHeaders: Record<string, string> = {};
      if (details.responseHeaders) {
        for (const h of details.responseHeaders) {
          if (h.name && h.value) {
            responseHeaders[h.name] = h.value;
          }
        }
      }

      const now = Date.now();
      const durationMs = now - inFlight.startTime;

      const urlObj = (() => {
        try {
          return new URL(inFlight.url);
        } catch {
          return { pathname: inFlight.url, hostname: 'unknown' };
        }
      })();

      const record: NetworkRequest = {
        id: inFlight.id,
        tabId: inFlight.tabId,
        url: inFlight.url,
        path: urlObj.pathname,
        domain: urlObj.hostname,
        method: inFlight.method,
        status: details.statusCode || 200,
        statusText: details.statusLine || 'OK',
        type: inFlight.type,
        startTime: inFlight.startTime,
        endTime: now,
        durationMs,
        requestHeaders: inFlight.requestHeaders,
        responseHeaders,
        requestBody: inFlight.requestBody,
        timestamp: new Date(inFlight.startTime).toLocaleTimeString(),
        initiator: inFlight.initiator,
      };

      // Perform OWASP security audit
      record.securityAudit = auditSecurityHeaders(record.url, record.responseHeaders);

      // Perform GraphQL detection & parsing
      record.graphql = parseGraphQLRequest(record.url, record.method, record.requestBody);

      // Store in ring buffer
      const tabId = inFlight.tabId;
      const tabRequests = tabRequestsMap.get(tabId) || [];
      tabRequests.unshift(record);
      if (tabRequests.length > TAB_REQUEST_LIMIT) {
        tabRequests.pop();
      }
      tabRequestsMap.set(tabId, tabRequests);

      // Clean up in-flight
      inFlightRequests.delete(details.requestId);

      // Persist in session storage
      try {
        if (chrome.storage && chrome.storage.session) {
          chrome.storage.session.set({ [`tab_${tabId}`]: tabRequests });
        }
      } catch {
        // Storage failure fallback
      }
    },
    { urls: ['<all_urls>'], types: ['xmlhttprequest', 'ping'] },
    ['responseHeaders', 'extraHeaders']
  );

  chrome.webRequest.onErrorOccurred.addListener(
    (details) => {
      const inFlight = inFlightRequests.get(details.requestId);
      if (inFlight) {
        inFlightRequests.delete(details.requestId);
      }
    },
    { urls: ['<all_urls>'], types: ['xmlhttprequest', 'ping'] }
  );
}

// Runtime message listener for Popup / Side Panel UI
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'GET_TAB_REQUESTS') {
      const tabId = message.tabId;
      const requests = tabRequestsMap.get(tabId) || [];
      sendResponse({ requests });
      return true;
    }

    if (message.type === 'CLEAR_TAB_REQUESTS') {
      const tabId = message.tabId;
      tabRequestsMap.delete(tabId);
      if (chrome.storage && chrome.storage.session) {
        chrome.storage.session.remove(`tab_${tabId}`);
      }
      sendResponse({ success: true });
      return true;
    }

    if (message.type === 'PING') {
      sendResponse({ status: 'ok', version: '1.0.0' });
      return true;
    }
  });
}
