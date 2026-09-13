import { NetworkRequest, HttpMethod } from '../types/index.js';
import { auditSecurityHeaders } from '../audit/securityAudit.js';
import { parseGraphQLRequest } from '../audit/graphqlParser.js';
import { extractJwtTokens } from '../audit/jwtInspector.js';
import { scanForPiiAndLeaks } from '../audit/piiScanner.js';

export interface HarLog {
  log: {
    version: string;
    creator: {
      name: string;
      version: string;
    };
    entries: HarEntry[];
  };
}

export interface HarEntry {
  startedDateTime: string;
  time: number;
  request: {
    method: string;
    url: string;
    httpVersion: string;
    headers: Array<{ name: string; value: string }>;
    queryString: Array<{ name: string; value: string }>;
    headersSize: number;
    bodySize: number;
    postData?: {
      mimeType: string;
      text?: string;
    };
  };
  response: {
    status: number;
    statusText: string;
    httpVersion: string;
    headers: Array<{ name: string; value: string }>;
    content: {
      size: number;
      mimeType: string;
      text?: string;
    };
    headersSize: number;
    bodySize: number;
  };
  cache: Record<string, unknown>;
  timings: {
    send: number;
    wait: number;
    receive: number;
  };
}

/**
 * Converts captured requests to an HTTP Archive (HAR 1.2) structure
 */
export function exportToHar(requests: NetworkRequest[]): HarLog {
  const entries: HarEntry[] = requests.map(req => {
    let queryParams: Array<{ name: string; value: string }> = [];
    try {
      const parsedUrl = new URL(req.url.startsWith('http') ? req.url : `https://${req.url}`);
      queryParams = Array.from(parsedUrl.searchParams.entries()).map(([name, value]) => ({ name, value }));
    } catch {
      // Ignored
    }

    const reqHeadersList = Object.entries(req.requestHeaders || {}).map(([name, value]) => ({ name, value }));
    const resHeadersList = Object.entries(req.responseHeaders || {}).map(([name, value]) => ({ name, value }));

    const postData = req.requestBody ? {
      mimeType: req.requestHeaders['content-type'] || 'application/json',
      text: req.requestBody,
    } : undefined;

    return {
      startedDateTime: new Date(req.startTime).toISOString(),
      time: req.durationMs || 1,
      request: {
        method: req.method,
        url: req.url,
        httpVersion: 'HTTP/1.1',
        headers: reqHeadersList,
        queryString: queryParams,
        headersSize: -1,
        bodySize: req.requestBody ? req.requestBody.length : 0,
        postData,
      },
      response: {
        status: req.status || 200,
        statusText: req.statusText || 'OK',
        httpVersion: 'HTTP/1.1',
        headers: resHeadersList,
        content: {
          size: req.responseBody ? req.responseBody.length : 0,
          mimeType: req.responseHeaders['content-type'] || 'application/json',
          text: req.responseBody || undefined,
        },
        headersSize: -1,
        bodySize: req.responseBody ? req.responseBody.length : 0,
      },
      cache: {},
      timings: {
        send: 0,
        wait: req.durationMs || 1,
        receive: 0,
      },
    };
  });

  return {
    log: {
      version: '1.2',
      creator: {
        name: 'APIScope Extension',
        version: '1.0.0',
      },
      entries,
    },
  };
}

/**
 * Parses an imported HAR JSON string and converts its entries into NetworkRequest objects
 */
export function importFromHar(harJsonString: string): NetworkRequest[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(harJsonString);
  } catch {
    throw new Error('Invalid JSON format in HAR file.');
  }

  const har = parsed as Partial<HarLog>;
  if (!har?.log?.entries || !Array.isArray(har.log.entries)) {
    throw new Error('Missing "log.entries" array in HAR file.');
  }

  const requests: NetworkRequest[] = [];

  for (let idx = 0; idx < har.log.entries.length; idx++) {
    const entry = har.log.entries[idx];
    if (!entry.request?.url) continue;

    const method = (entry.request.method?.toUpperCase() || 'GET') as HttpMethod;
    const url = entry.request.url;

    let domain = '';
    let path = '/';
    try {
      const u = new URL(url.startsWith('http') ? url : `https://${url}`);
      domain = u.hostname;
      path = u.pathname + u.search;
    } catch {
      domain = url;
    }

    // Convert headers array to Record
    const requestHeaders: Record<string, string> = {};
    if (Array.isArray(entry.request.headers)) {
      for (const h of entry.request.headers) {
        if (h.name) requestHeaders[h.name.toLowerCase()] = h.value;
      }
    }

    const responseHeaders: Record<string, string> = {};
    if (Array.isArray(entry.response?.headers)) {
      for (const h of entry.response.headers) {
        if (h.name) responseHeaders[h.name.toLowerCase()] = h.value;
      }
    }

    const status = entry.response?.status || 200;
    const statusText = entry.response?.statusText || 'OK';
    const durationMs = Math.round(entry.time || 10);
    const startTime = entry.startedDateTime ? new Date(entry.startedDateTime).getTime() : Date.now();

    const requestBody = entry.request.postData?.text || null;
    const responseBody = entry.response?.content?.text || null;

    // Run Security Audit
    const securityAudit = auditSecurityHeaders(url, responseHeaders);

    // Run GraphQL Detection
    const graphql = parseGraphQLRequest(url, method, requestBody);

    // Run JWT extraction
    const jwtTokens = extractJwtTokens(requestHeaders, responseHeaders, requestBody, responseBody);

    // Run PII scan
    const piiWarnings = scanForPiiAndLeaks(url, method, requestHeaders, requestBody, responseBody);

    requests.push({
      id: `har-imported-${Date.now()}-${idx}`,
      tabId: 0,
      url,
      path,
      domain,
      method,
      status,
      statusText,
      type: 'fetch',
      startTime,
      durationMs,
      requestHeaders,
      responseHeaders,
      requestBody,
      responseBody,
      securityAudit,
      graphql,
      jwtTokens,
      piiWarnings,
      timestamp: new Date(startTime).toLocaleTimeString(),
    });
  }

  return requests;
}
