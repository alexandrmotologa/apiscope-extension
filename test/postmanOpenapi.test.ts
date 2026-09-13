import { describe, it, expect } from 'vitest';
import { exportToPostmanCollection, exportToOpenApiSpec } from '../src/exporters/postmanOpenapiExporter.js';
import { NetworkRequest } from '../src/types/index.js';

describe('Postman Collection & OpenAPI Exporters', () => {
  const sampleRequest: NetworkRequest = {
    id: 'req_test_02',
    tabId: 1,
    url: 'https://api.store.com/v1/orders?sort=desc',
    path: '/v1/orders?sort=desc',
    domain: 'api.store.com',
    method: 'POST',
    status: 201,
    statusText: 'Created',
    type: 'fetch',
    startTime: Date.now(),
    durationMs: 120,
    requestHeaders: {
      'content-type': 'application/json',
      'authorization': 'Bearer token_secret_99',
    },
    responseHeaders: {
      'content-type': 'application/json',
    },
    requestBody: JSON.stringify({ item_id: 42, quantity: 2 }),
    responseBody: JSON.stringify({ order_id: 'ord_9901', success: true }),
    timestamp: '12:00:00',
  };

  it('exports valid Postman Collection v2.1.0 JSON', () => {
    const jsonStr = exportToPostmanCollection([sampleRequest], 'Test Suite');
    const parsed = JSON.parse(jsonStr);

    expect(parsed.info.name).toBe('Test Suite');
    expect(parsed.info.schema).toContain('v2.1.0/collection.json');
    expect(parsed.item.length).toBe(1);

    const item = parsed.item[0];
    expect(item.request.method).toBe('POST');
    expect(item.request.url.raw).toBe(sampleRequest.url);
    expect(item.request.body.mode).toBe('raw');
    expect(item.response[0].code).toBe(201);
  });

  it('exports valid OpenAPI 3.0.3 specification JSON with inferred schemas', () => {
    const jsonStr = exportToOpenApiSpec([sampleRequest], 'Store API Spec');
    const spec = JSON.parse(jsonStr);

    expect(spec.openapi).toBe('3.0.3');
    expect(spec.info.title).toBe('Store API Spec');
    expect(spec.servers[0].url).toContain('https://api.store.com');

    // Path check
    const pathItem = spec.paths['/v1/orders'];
    expect(pathItem).toBeDefined();
    expect(pathItem.post).toBeDefined();
    expect(pathItem.post.responses['201']).toBeDefined();
  });
});
