import { describe, it, expect } from 'vitest';
import { exportToHar, importFromHar } from '../src/exporters/harExporter.js';
import { NetworkRequest } from '../src/types/index.js';

describe('HAR 1.2 Exporter & Importer', () => {
  const sampleRequest: NetworkRequest = {
    id: 'req_test_01',
    tabId: 1,
    url: 'https://api.example.com/v1/users?page=1',
    path: '/v1/users?page=1',
    domain: 'api.example.com',
    method: 'POST',
    status: 200,
    statusText: 'OK',
    type: 'fetch',
    startTime: 1710000000000,
    durationMs: 85,
    requestHeaders: {
      'content-type': 'application/json',
      'authorization': 'Bearer token123',
    },
    responseHeaders: {
      'content-type': 'application/json',
      'strict-transport-security': 'max-age=31536000; includeSubDomains',
    },
    requestBody: JSON.stringify({ action: 'list' }),
    responseBody: JSON.stringify({ users: ['alice', 'bob'] }),
    timestamp: '12:00:00',
  };

  it('exports requests into valid HAR 1.2 log structure', () => {
    const har = exportToHar([sampleRequest]);
    expect(har.log.version).toBe('1.2');
    expect(har.log.creator.name).toBe('APIScope Extension');
    expect(har.log.entries.length).toBe(1);

    const entry = har.log.entries[0];
    expect(entry.request.method).toBe('POST');
    expect(entry.request.url).toBe(sampleRequest.url);
    expect(entry.response.status).toBe(200);
    expect(entry.request.postData?.text).toBe(sampleRequest.requestBody);
    expect(entry.response.content.text).toBe(sampleRequest.responseBody);
  });

  it('imports valid HAR 1.2 JSON and parses security audits and endpoints', () => {
    const har = exportToHar([sampleRequest]);
    const imported = importFromHar(JSON.stringify(har));

    expect(imported.length).toBe(1);
    expect(imported[0].method).toBe('POST');
    expect(imported[0].domain).toBe('api.example.com');
    expect(imported[0].status).toBe(200);
    expect(imported[0].securityAudit).toBeDefined();
    expect(imported[0].securityAudit?.headersChecked.hsts).toBe(true);
  });

  it('throws descriptive error on invalid HAR json', () => {
    expect(() => importFromHar('invalid json')).toThrow('Invalid JSON format');
    expect(() => importFromHar(JSON.stringify({ notHar: true }))).toThrow('Missing "log.entries"');
  });
});
