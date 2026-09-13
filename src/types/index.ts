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
}

export type FilterMethod = 'ALL' | 'GET' | 'POST' | 'PUT' | 'DELETE' | 'GRAPHQL';

export type FilterStatus = 'ALL' | '2xx' | '3xx' | '4xx' | '5xx' | 'ERR';

export type ActiveTab = 'overview' | 'headers' | 'payload' | 'security' | 'graphql' | 'replay' | 'export';

export type ViewMode = 'popup' | 'sidepanel' | 'standalone';
