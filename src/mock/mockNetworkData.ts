import { NetworkRequest, HttpMethod } from '../types/index.js';
import { auditSecurityHeaders } from '../audit/securityAudit.js';
import { parseGraphQLRequest } from '../audit/graphqlParser.js';
import { extractJwtTokens } from '../audit/jwtInspector.js';
import { scanForPiiAndLeaks } from '../audit/piiScanner.js';

interface RawMockItem {
  id: string;
  tabId: number;
  url: string;
  path: string;
  domain: string;
  method: HttpMethod;
  status: number;
  statusText: string;
  type: NetworkRequest['type'];
  startTime: number;
  endTime: number;
  durationMs: number;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  requestBody: string | null;
  responseBody: string | null;
  timestamp: string;
  sizeBytes: number;
}

const RAW_MOCK_ITEMS: RawMockItem[] = [
  {
    id: 'req_stripe_01',
    tabId: 101,
    url: 'https://api.stripe.com/v1/payment_intents',
    path: '/v1/payment_intents',
    domain: 'api.stripe.com',
    method: 'POST',
    status: 200,
    statusText: 'OK',
    type: 'fetch',
    startTime: Date.now() - 45000,
    endTime: Date.now() - 44780,
    durationMs: 220,
    requestHeaders: {
      'Authorization': 'Bearer sk_test_51Mz...xxxx',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': '2024-06-20',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Accept': 'application/json',
    },
    responseHeaders: {
      'content-type': 'application/json; charset=utf-8',
      'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
      'content-security-policy': "default-src 'none'; base-uri 'none'; frame-ancestors 'none'",
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'access-control-allow-origin': 'https://dashboard.stripe.com',
      'access-control-allow-credentials': 'true',
      'referrer-policy': 'strict-origin-when-cross-origin',
      'permissions-policy': 'camera=(), microphone=(), geolocation=()',
      'stripe-request-id': 'req_h81jYzA769kQv',
    },
    requestBody: JSON.stringify(
      {
        amount: 4999,
        currency: 'usd',
        payment_method_types: ['card'],
        description: 'APIScope Pro License (Annual)',
        receipt_email: 'developer@example.com',
        metadata: { tier: 'enterprise', user_id: 'usr_8492' },
      },
      null,
      2
    ),
    responseBody: JSON.stringify(
      {
        id: 'pi_3MtwxTLkdIwHu7ix28a3tqPa',
        object: 'payment_intent',
        amount: 4999,
        amount_received: 4999,
        currency: 'usd',
        status: 'succeeded',
        client_secret: 'pi_3MtwxTLkdIwHu7ix28a3tqPa_secret_xX...',
        created: 1718920100,
      },
      null,
      2
    ),
    timestamp: new Date(Date.now() - 45000).toLocaleTimeString(),
    sizeBytes: 1420,
  },
  {
    id: 'req_gql_02',
    tabId: 101,
    url: 'https://store-api.myshopify.com/api/2024-07/graphql.json',
    path: '/api/2024-07/graphql.json',
    domain: 'store-api.myshopify.com',
    method: 'POST',
    status: 200,
    statusText: 'OK',
    type: 'fetch',
    startTime: Date.now() - 32000,
    endTime: Date.now() - 31860,
    durationMs: 140,
    requestHeaders: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': 'shpat_99ab71e4d01b',
      'Accept': 'application/json',
    },
    responseHeaders: {
      'content-type': 'application/json; charset=utf-8',
      'strict-transport-security': 'max-age=31536000; includeSubDomains',
      'content-security-policy': "default-src 'self'; script-src 'self' https://cdn.shopify.com",
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'access-control-allow-origin': '*',
      'referrer-policy': 'strict-origin-when-cross-origin',
    },
    requestBody: JSON.stringify(
      {
        operationName: 'CreateCartWithLines',
        query: `mutation CreateCartWithLines($cartInput: CartInput!) {
  cartCreate(input: $cartInput) {
    cart {
      id
      checkoutUrl
      totalQuantity
      cost {
        totalAmount {
          amount
          currencyCode
        }
      }
    }
    userErrors {
      field
      message
    }
  }
}`,
        variables: {
          cartInput: {
            lines: [
              {
                merchandiseId: 'gid://shopify/ProductVariant/449102831',
                quantity: 1,
              },
            ],
            note: 'Deliver to office reception',
          },
        },
      },
      null,
      2
    ),
    responseBody: JSON.stringify(
      {
        data: {
          cartCreate: {
            cart: {
              id: 'gid://shopify/Cart/c1-a87dfb63e192',
              checkoutUrl: 'https://checkout.myshopify.com/c/c1-a87dfb63e192',
              totalQuantity: 1,
              cost: {
                totalAmount: {
                  amount: '79.00',
                  currencyCode: 'USD',
                },
              },
            },
            userErrors: [],
          },
        },
      },
      null,
      2
    ),
    timestamp: new Date(Date.now() - 32000).toLocaleTimeString(),
    sizeBytes: 890,
  },
  {
    id: 'req_github_03',
    tabId: 101,
    url: 'https://api.github.com/repos/alexandrmotologa/apiscope-extension',
    path: '/repos/alexandrmotologa/apiscope-extension',
    domain: 'api.github.com',
    method: 'GET',
    status: 200,
    statusText: 'OK',
    type: 'fetch',
    startTime: Date.now() - 21000,
    endTime: Date.now() - 20915,
    durationMs: 85,
    requestHeaders: {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'APIScope-Extension/1.0',
    },
    responseHeaders: {
      'content-type': 'application/json; charset=utf-8',
      'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
      'content-security-policy': "default-src 'none'",
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'access-control-allow-origin': '*',
      'access-control-expose-headers': 'ETag, Link, Location, Retry-After, X-GitHub-OTP',
      'x-ratelimit-limit': '5000',
      'x-ratelimit-remaining': '4992',
      'x-ratelimit-reset': '1718923700',
    },
    requestBody: null,
    responseBody: JSON.stringify(
      {
        id: 928371902,
        name: 'apiscope-extension',
        full_name: 'alexandrmotologa/apiscope-extension',
        private: false,
        visibility: 'public',
        stargazers_count: 128,
        forks_count: 14,
        open_issues_count: 0,
        license: { key: 'mit', name: 'MIT License' },
      },
      null,
      2
    ),
    timestamp: new Date(Date.now() - 21000).toLocaleTimeString(),
    sizeBytes: 2450,
  },
  {
    id: 'req_insecure_04',
    tabId: 101,
    url: 'http://api.legacy-internal.net/v1/customers/export.csv',
    path: '/v1/customers/export.csv',
    domain: 'api.legacy-internal.net',
    method: 'GET',
    status: 200,
    statusText: 'OK',
    type: 'xmlhttprequest',
    startTime: Date.now() - 15000,
    endTime: Date.now() - 14680,
    durationMs: 320,
    requestHeaders: {
      'Accept': '*/*',
      'Authorization': 'Basic YWRtaW46c2VjcmV0MTIz',
    },
    responseHeaders: {
      'content-type': 'text/csv',
      'access-control-allow-origin': '*',
      'access-control-allow-credentials': 'true',
      'server': 'Apache/2.2.15 (CentOS)',
    },
    requestBody: null,
    responseBody: `id,email,full_name,balance\n1,john.doe@example.com,John Doe,1250.00\n2,jane.smith@example.com,Jane Smith,840.50`,
    timestamp: new Date(Date.now() - 15000).toLocaleTimeString(),
    sizeBytes: 310,
  },
  {
    id: 'req_timeout_05',
    tabId: 101,
    url: 'https://analytics-gateway.prod.cloud/v2/reports/aggregate-metrics',
    path: '/v2/reports/aggregate-metrics',
    domain: 'analytics-gateway.prod.cloud',
    method: 'POST',
    status: 504,
    statusText: 'Gateway Timeout',
    type: 'fetch',
    startTime: Date.now() - 9000,
    endTime: Date.now() - 7120,
    durationMs: 1880,
    requestHeaders: {
      'Content-Type': 'application/json',
      'X-Request-Trace-ID': 'trace_990184bba7',
    },
    responseHeaders: {
      'content-type': 'application/json',
      'strict-transport-security': 'max-age=15552000',
      'x-content-type-options': 'nosniff',
      'x-edge-worker': 'cluster-eu-west-1',
    },
    requestBody: JSON.stringify(
      {
        timeframe: 'last_30_days',
        granularity: '1_minute',
        metrics: ['cpu_usage', 'memory_rss', 'network_io', 'disk_wait'],
        filters: { region: 'us-east-1', cluster_id: 'k8s-prod-omega' },
      },
      null,
      2
    ),
    responseBody: JSON.stringify(
      {
        error: 'GATEWAY_TIMEOUT',
        message: 'Upstream analytics aggregator failed to respond within 1800ms limit.',
        incident_id: 'inc_899201a',
      },
      null,
      2
    ),
    timestamp: new Date(Date.now() - 9000).toLocaleTimeString(),
    sizeBytes: 420,
  },
  {
    id: 'req_auth_06',
    tabId: 101,
    url: 'https://auth.acme-corp.io/api/v2/oauth/token',
    path: '/api/v2/oauth/token',
    domain: 'auth.acme-corp.io',
    method: 'POST',
    status: 200,
    statusText: 'OK',
    type: 'fetch',
    startTime: Date.now() - 3000,
    endTime: Date.now() - 2910,
    durationMs: 90,
    requestHeaders: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    responseHeaders: {
      'content-type': 'application/json; charset=utf-8',
      'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
      'content-security-policy': "default-src 'self'; frame-ancestors 'none'",
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'referrer-policy': 'no-referrer',
      'permissions-policy': 'camera=(), microphone=()',
      'set-cookie': '__Host-session=tok_secure_88192a001; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=3600',
    },
    requestBody: JSON.stringify(
      {
        grant_type: 'refresh_token',
        client_id: 'apiscope_client_webapp',
        refresh_token: 'rft_88a91c0b3d5e...',
      },
      null,
      2
    ),
    responseBody: JSON.stringify(
      {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfOTA4MTEiLCJuYW1lIjoiQWxleCBELiIsInJvbGVzIjpbImFkbWluIiwiZGV2ZWxvcGVyIl0sImlhdCI6MTcxMDAwMDAwMCwiZXhwIjoxOTAwMDAwMDAwfQ.dGhpcy1pcy1hLXNhbXBsZS1zaWduYXR1cmUtZm9yLWFwaXNjb3Bl',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'read:apis write:audits',
      },
      null,
      2
    ),
    timestamp: new Date(Date.now() - 3000).toLocaleTimeString(),
    sizeBytes: 810,
  },
  {
    id: 'req_analytics_leak',
    tabId: 101,
    url: 'https://telemetry.external-service.com/collect?token=sec_live_99a8b71cc20&user_id=usr_4401',
    path: '/collect?token=sec_live_99a8b71cc20&user_id=usr_4401',
    domain: 'telemetry.external-service.com',
    method: 'GET',
    status: 200,
    statusText: 'OK',
    type: 'fetch',
    startTime: Date.now() - 1500,
    endTime: Date.now() - 1420,
    durationMs: 80,
    requestHeaders: {
      'Accept': '*/*',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    responseHeaders: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
    },
    requestBody: null,
    responseBody: JSON.stringify({ success: true, processed_events: 1 }),
    timestamp: new Date(Date.now() - 1500).toLocaleTimeString(),
    sizeBytes: 310,
  },
];

export const INITIAL_MOCK_REQUESTS: NetworkRequest[] = RAW_MOCK_ITEMS.map((item) => {
  const req: NetworkRequest = {
    ...item,
    securityAudit: auditSecurityHeaders(item.url, item.responseHeaders),
    graphql: parseGraphQLRequest(item.url, item.method, item.requestBody),
    jwtTokens: extractJwtTokens(item.requestHeaders, item.responseHeaders, item.requestBody, item.responseBody),
    piiWarnings: scanForPiiAndLeaks(item.url, item.method, item.requestHeaders, item.requestBody, item.responseBody),
  };
  return req;
});

interface StreamTemplate {
  url: string;
  path: string;
  domain: string;
  method: HttpMethod;
  status: number;
  headers: Record<string, string>;
  body: string | null;
  response: string | null;
}

const STREAM_TEMPLATES: StreamTemplate[] = [
  {
    url: 'https://api.github.com/user/starred',
    path: '/user/starred',
    domain: 'api.github.com',
    method: 'GET',
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'content-security-policy': "default-src 'none'",
    },
    body: null,
    response: JSON.stringify([{ id: 104, name: 'apiscope-extension' }]),
  },
  {
    url: 'https://api.weather.io/v1/forecast?city=Bucharest&units=metric',
    path: '/v1/forecast',
    domain: 'api.weather.io',
    method: 'GET',
    status: 200,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
      'x-content-type-options': 'nosniff',
    },
    body: null,
    response: JSON.stringify({ temp: 21.4, condition: 'Clear Sky', humidity: 48 }),
  },
  {
    url: 'https://api.ecommerce.internal/cart/update-item',
    path: '/cart/update-item',
    domain: 'api.ecommerce.internal',
    method: 'PUT',
    status: 204,
    headers: {
      'content-type': 'application/json',
      'strict-transport-security': 'max-age=31536000',
      'x-content-type-options': 'nosniff',
    },
    body: JSON.stringify({ item_id: 'prod_9912', quantity: 3 }),
    response: null,
  },
];

/**
 * Generates a realistic random mock request to simulate active tab traffic
 */
export function generateRandomMockRequest(): NetworkRequest {
  const template = STREAM_TEMPLATES[Math.floor(Math.random() * STREAM_TEMPLATES.length)];
  const durationMs = Math.floor(Math.random() * 280) + 35;
  const now = Date.now();
  const id = `req_stream_${now}_${Math.floor(Math.random() * 1000)}`;

  const req: NetworkRequest = {
    id,
    tabId: 101,
    url: template.url,
    path: template.path,
    domain: template.domain,
    method: template.method,
    status: template.status,
    statusText: template.status === 204 ? 'No Content' : 'OK',
    type: 'fetch',
    startTime: now - durationMs,
    endTime: now,
    durationMs,
    requestHeaders: {
      'Accept': 'application/json',
      'User-Agent': 'APIScope/1.0 Agent',
    },
    responseHeaders: template.headers,
    requestBody: template.body,
    responseBody: template.response,
    timestamp: new Date(now).toLocaleTimeString(),
    sizeBytes: Math.floor(Math.random() * 1200) + 180,
  };

  req.securityAudit = auditSecurityHeaders(req.url, req.responseHeaders);
  req.graphql = parseGraphQLRequest(req.url, req.method, req.requestBody);
  req.jwtTokens = extractJwtTokens(req.requestHeaders, req.responseHeaders, req.requestBody, req.responseBody);
  req.piiWarnings = scanForPiiAndLeaks(req.url, req.method, req.requestHeaders, req.requestBody, req.responseBody);

  return req;
}
