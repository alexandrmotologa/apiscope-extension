import { NetworkRequest } from '../types/index.js';

/**
 * Converts captured requests into a Postman Collection v2.1.0 JSON string
 */
export function exportToPostmanCollection(requests: NetworkRequest[], collectionName = 'APIScope Collection'): string {
  const items = requests.map(req => {
    let urlObj: URL | null = null;
    try {
      urlObj = new URL(req.url.startsWith('http') ? req.url : `https://${req.url}`);
    } catch {
      // Ignored
    }

    const hostParts = urlObj ? urlObj.hostname.split('.') : [req.domain];
    const pathParts = urlObj ? urlObj.pathname.split('/').filter(Boolean) : [req.path];
    const queryParams = urlObj ? Array.from(urlObj.searchParams.entries()).map(([key, value]) => ({ key, value })) : [];

    const headersList = Object.entries(req.requestHeaders || {})
      .filter(([key]) => !key.startsWith(':'))
      .map(([key, value]) => ({
        key,
        value,
        type: 'text',
      }));

    const postmanItem: Record<string, unknown> = {
      name: `${req.method} ${req.path}`,
      request: {
        method: req.method,
        header: headersList,
        url: {
          raw: req.url,
          protocol: urlObj ? urlObj.protocol.replace(':', '') : 'https',
          host: hostParts,
          path: pathParts,
          query: queryParams,
        },
      },
      response: req.responseBody ? [{
        name: 'Captured Response',
        originalRequest: {
          method: req.method,
          header: headersList,
          url: { raw: req.url },
        },
        status: req.statusText || 'OK',
        code: req.status,
        header: Object.entries(req.responseHeaders || {}).map(([key, value]) => ({ key, value })),
        body: req.responseBody,
      }] : [],
    };

    if (req.requestBody) {
      const isJson = (req.requestHeaders['content-type'] || '').includes('json');
      (postmanItem.request as Record<string, unknown>).body = {
        mode: 'raw',
        raw: req.requestBody,
        options: {
          raw: {
            language: isJson ? 'json' : 'text',
          },
        },
      };
    }

    return postmanItem;
  });

  const collection = {
    info: {
      _postman_id: `apiscope-${Date.now()}`,
      name: collectionName,
      description: 'Exported from APIScope Developer Extension',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    item: items,
  };

  return JSON.stringify(collection, null, 2);
}

/**
 * Infers an OpenAPI 3.0.3 schema property type from a JS value
 */
function inferOpenApiSchema(val: unknown): Record<string, unknown> {
  if (val === null) return { type: 'string', nullable: true };
  if (typeof val === 'number') return { type: Number.isInteger(val) ? 'integer' : 'number' };
  if (typeof val === 'boolean') return { type: 'boolean' };
  if (typeof val === 'string') return { type: 'string' };

  if (Array.isArray(val)) {
    return {
      type: 'array',
      items: val.length > 0 ? inferOpenApiSchema(val[0]) : { type: 'string' },
    };
  }

  if (typeof val === 'object') {
    const properties: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      properties[k] = inferOpenApiSchema(v);
    }
    return {
      type: 'object',
      properties,
    };
  }

  return { type: 'string' };
}

/**
 * Converts captured requests into an OpenAPI 3.0.3 JSON specification
 */
export function exportToOpenApiSpec(requests: NetworkRequest[], title = 'APIScope Inferred API Spec'): string {
  const paths: Record<string, Record<string, unknown>> = {};

  for (const req of requests) {
    let pathname = req.path;
    let queryParams: string[] = [];
    try {
      const u = new URL(req.url.startsWith('http') ? req.url : `https://${req.url}`);
      pathname = u.pathname;
      queryParams = Array.from(u.searchParams.keys());
    } catch {
      // Ignored
    }

    if (!paths[pathname]) {
      paths[pathname] = {};
    }

    const methodLower = req.method.toLowerCase();
    const parameters = queryParams.map(param => ({
      name: param,
      in: 'query',
      required: false,
      schema: { type: 'string' },
    }));

    const operationObj: Record<string, unknown> = {
      summary: `${req.method} ${pathname}`,
      description: `Inferred endpoint from domain ${req.domain}`,
      parameters,
      responses: {
        [req.status || 200]: {
          description: req.statusText || 'Response',
        },
      },
    };

    // Inferred request body
    if (req.requestBody) {
      try {
        const parsedReq = JSON.parse(req.requestBody);
        operationObj.requestBody = {
          content: {
            'application/json': {
              schema: inferOpenApiSchema(parsedReq),
            },
          },
        };
      } catch {
        operationObj.requestBody = {
          content: {
            'text/plain': {
              schema: { type: 'string' },
            },
          },
        };
      }
    }

    // Inferred response body
    if (req.responseBody) {
      try {
        const parsedRes = JSON.parse(req.responseBody);
        (operationObj.responses as Record<string, unknown>)[req.status || 200] = {
          description: req.statusText || 'Response',
          content: {
            'application/json': {
              schema: inferOpenApiSchema(parsedRes),
            },
          },
        };
      } catch {
        // Ignored
      }
    }

    paths[pathname][methodLower] = operationObj;
  }

  const spec = {
    openapi: '3.0.3',
    info: {
      title,
      version: '1.0.0',
      description: 'API specification automatically inferred from browser network traffic by APIScope.',
    },
    servers: [
      {
        url: requests.length > 0 ? `https://${requests[0].domain}` : 'https://api.example.com',
        description: 'Target API Host',
      },
    ],
    paths,
  };

  return JSON.stringify(spec, null, 2);
}
