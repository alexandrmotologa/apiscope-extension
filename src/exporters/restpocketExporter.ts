import { NetworkRequest } from '../types/index.js';

export interface RestPocketSavedRequest {
  id?: number;
  collection_id?: number;
  name: string;
  method: string;
  url: string;
  headers_json: string;
  body_json: string | null;
  created_at?: string;
}

export interface RestPocketCollection {
  name: string;
  version: string;
  source: string;
  created_at: string;
  requests: RestPocketSavedRequest[];
}

export function exportToRestPocketRequest(req: NetworkRequest): RestPocketSavedRequest {
  const urlObj = (() => {
    try {
      return new URL(req.url);
    } catch {
      return null;
    }
  })();

  const name = req.graphql?.operationName
    ? `[GQL] ${req.graphql.operationName}`
    : urlObj
    ? `${req.method} ${urlObj.pathname}`
    : `${req.method} ${req.url}`;

  // Filter internal pseudo-headers
  const cleanHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(req.requestHeaders || {})) {
    if (![':authority', ':method', ':path', ':scheme', 'content-length'].includes(k.toLowerCase())) {
      cleanHeaders[k] = v;
    }
  }

  return {
    name,
    method: req.method,
    url: req.url,
    headers_json: JSON.stringify(cleanHeaders),
    body_json: req.requestBody || null,
    created_at: new Date().toISOString(),
  };
}

export function exportToRestPocketCollection(
  requests: NetworkRequest[],
  collectionName = 'APIScope Captured Session'
): RestPocketCollection {
  return {
    name: collectionName,
    version: '1.0.0',
    source: 'APIScope Extension',
    created_at: new Date().toISOString(),
    requests: requests.map(exportToRestPocketRequest),
  };
}

export function generateRestPocketDeepLink(req: NetworkRequest, baseUrl = 'http://localhost:5173'): string {
  const payload = exportToRestPocketRequest(req);
  const encoded = encodeURIComponent(JSON.stringify(payload));
  return `${baseUrl}/?import=apiscope&data=${encoded}`;
}
