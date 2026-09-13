import { describe, it, expect } from 'vitest';
import { generateCurlCommand } from '../src/exporters/curlExporter.js';
import { generatePythonRequests, generateFetchCode, generateHttpieCommand } from '../src/exporters/codeGenerators.js';
import { exportToRestPocketRequest, exportToRestPocketCollection, generateRestPocketDeepLink } from '../src/exporters/restpocketExporter.js';
import { NetworkRequest } from '../src/types/index.js';

const mockReq: NetworkRequest = {
  id: 'req_test_01',
  tabId: 1,
  url: 'https://api.example.com/v1/orders',
  path: '/v1/orders',
  domain: 'api.example.com',
  method: 'POST',
  status: 201,
  type: 'fetch',
  startTime: 1000,
  durationMs: 50,
  requestHeaders: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test_token_123',
    'Host': 'api.example.com',
  },
  responseHeaders: {
    'content-type': 'application/json',
  },
  requestBody: JSON.stringify({ item: 'Widget', qty: 2 }),
  timestamp: '12:00:00',
};

describe('Code Exporters and RestPocket Interoperability', () => {
  it('generates accurate cURL command excluding internal pseudo-headers', () => {
    const curl = generateCurlCommand(mockReq);
    expect(curl).toContain("curl \\\n  -X POST \\\n  'https://api.example.com/v1/orders'");
    expect(curl).toContain("-H 'Content-Type: application/json'");
    expect(curl).toContain("-H 'Authorization: Bearer test_token_123'");
    expect(curl).not.toContain("-H 'Host:");
    expect(curl).toContain("--data-raw '{\"item\":\"Widget\",\"qty\":2}'");
  });

  it('generates executable Python requests snippet', () => {
    const py = generatePythonRequests(mockReq);
    expect(py).toContain('import requests');
    expect(py).toContain('url = "https://api.example.com/v1/orders"');
    expect(py).toContain('requests.post(url, headers=headers, json=payload)');
  });

  it('generates modern JavaScript fetch code', () => {
    const js = generateFetchCode(mockReq);
    expect(js).toContain('await fetch("https://api.example.com/v1/orders"');
    expect(js).toContain('"method": "POST"');
    expect(js).toContain('await response.json()');
  });

  it('generates HTTPie command syntax', () => {
    const httpie = generateHttpieCommand(mockReq);
    expect(httpie).toContain("http POST 'https://api.example.com/v1/orders'");
    expect(httpie).toContain("'Authorization:Bearer test_token_123'");
  });

  it('formats request accurately for RestPocket', () => {
    const rpReq = exportToRestPocketRequest(mockReq);
    expect(rpReq.method).toBe('POST');
    expect(rpReq.url).toBe('https://api.example.com/v1/orders');
    expect(rpReq.body_json).toBe(mockReq.requestBody);

    const parsedHeaders = JSON.parse(rpReq.headers_json);
    expect(parsedHeaders['Authorization']).toBe('Bearer test_token_123');

    const deepLink = generateRestPocketDeepLink(mockReq);
    expect(deepLink).toContain('http://localhost:5173/?import=apiscope&data=');
  });

  it('generates multi-request collection for RestPocket batch import', () => {
    const collection = exportToRestPocketCollection([mockReq]);
    expect(collection.name).toBe('APIScope Captured Session');
    expect(collection.version).toBe('1.0.0');
    expect(collection.requests.length).toBe(1);
    expect(collection.requests[0].url).toBe(mockReq.url);
  });
});
