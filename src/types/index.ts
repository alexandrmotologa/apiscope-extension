export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

export type RequestType = 'fetch' | 'xmlhttprequest' | 'other';

export type SecurityGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

export type FindingStatus = 'pass' | 'warning' | 'fail' | 'info';

export interface SecurityFinding {
  id: string;
  header: string;
  status: FindingStatus;
  title: string;
  description: string;
  recommendation: string;
  scoreImpact: number;
}

export interface SecurityAuditResult {
  grade: SecurityGrade;
  score: number; // 0 - 100
  summary: string;
  findings: SecurityFinding[];
  headersChecked: {
    hsts: boolean;
    csp: boolean;
    cors: boolean;
    xContentType: boolean;
    xFrame: boolean;
    referrerPolicy: boolean;
    permissionsPolicy: boolean;
  };
}

export interface GraphQLInfo {
  isGraphQL: boolean;
  operationType?: 'query' | 'mutation' | 'subscription';
  operationName?: string;
  query: string;
  variables?: Record<string, unknown>;
}

export interface DecodedJWT {
  rawToken: string;
  source: 'header' | 'cookie' | 'body';
  sourceKey: string;
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  subject?: string;
  issuer?: string;
  audience?: string | string[];
  issuedAt?: Date;
  expiresAt?: Date;
  isExpired?: boolean;
  statusText: string;
  timeRemainingStr?: string;
}

export interface PiiWarning {
  id: string;
  type: 'credit-card' | 'private-key' | 'token-in-url' | 'cleartext-password' | 'ssn';
  severity: 'high' | 'critical' | 'medium';
  field: string;
  message: string;
  recommendation: string;
  maskedSnippet: string;
}

export interface MockRule {
  id: string;
  name: string;
  enabled: boolean;
  urlPattern: string; // substring or regex
  method?: HttpMethod | 'ALL';
  overrideStatus?: number;
  overrideHeaders?: Record<string, string>;
  overrideBody?: string;
  delayMs?: number;
}

export interface NetworkRequest {
  id: string;
  tabId: number;
  url: string;
  path: string;
  domain: string;
  method: HttpMethod;
  status: number;
  statusText?: string;
  type: RequestType;
  startTime: number;
  endTime?: number;
  durationMs: number;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  requestBody?: string | null;
  responseBody?: string | null;
  securityAudit?: SecurityAuditResult;
  graphql?: GraphQLInfo | null;
  initiator?: string;
  error?: string;
  timestamp: string;
  sizeBytes?: number;
  // Extended productivity & security fields
  isPinned?: boolean;
  jwtTokens?: DecodedJWT[];
  piiWarnings?: PiiWarning[];
}

export type FilterMethod = 'ALL' | 'GET' | 'POST' | 'PUT' | 'DELETE' | 'GRAPHQL';

export type FilterStatus = 'ALL' | '2xx' | '3xx' | '4xx' | '5xx' | 'ERR';

export type QuickChipId = 'ALL' | 'ERRORS' | 'SLOW' | 'GRAPHQL' | 'AUTH' | 'SECURITY' | 'PINNED';

export type ActiveTab = 'overview' | 'headers' | 'payload' | 'security' | 'graphql' | 'jwt' | 'replay' | 'export';

export type ViewMode = 'popup' | 'sidepanel' | 'standalone';

export type DensityMode = 'normal' | 'compact';
