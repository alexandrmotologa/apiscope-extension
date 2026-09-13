import { GraphQLInfo } from '../types/index.js';

export function parseGraphQLRequest(
  url: string,
  method: string,
  requestBody?: string | null
): GraphQLInfo | null {
  // 1. Check URL for /graphql path or query parameter
  const urlObj = (() => {
    try {
      return new URL(url);
    } catch {
      return null;
    }
  })();

  const isGraphqlPath = urlObj ? urlObj.pathname.toLowerCase().includes('graphql') : false;

  // 2. Try parsing requestBody
  if (requestBody && typeof requestBody === 'string') {
    const trimmed = requestBody.trim();

    // Check JSON body
    if (trimmed.startsWith('{')) {
      let isJsonObj = false;
      try {
        const parsed = JSON.parse(trimmed);
        isJsonObj = true;
        if (parsed && typeof parsed.query === 'string') {
          const rawQuery = parsed.query.trim();
          const opType = detectOperationType(rawQuery);
          const opName =
            parsed.operationName ||
            extractOperationNameFromQuery(rawQuery) ||
            'AnonymousOperation';

          return {
            isGraphQL: true,
            operationType: opType,
            operationName: opName,
            query: formatGraphQLQuery(rawQuery),
            variables: parsed.variables || undefined,
          };
        }
      } catch {
        isJsonObj = false;
      }

      // If it's a valid JSON object without a query property, it's standard REST, not GraphQL
      if (isJsonObj) {
        return null;
      }
    }

    // Check if raw text starts with query/mutation/subscription or raw shorthand query { field }
    if (/^\s*(query|mutation|subscription|\{)/i.test(trimmed)) {
      const opType = detectOperationType(trimmed);
      const opName = extractOperationNameFromQuery(trimmed) || 'AnonymousOperation';
      return {
        isGraphQL: true,
        operationType: opType,
        operationName: opName,
        query: formatGraphQLQuery(trimmed),
      };
    }
  }

  // 3. Check GET parameters (?query=...)
  if (urlObj && method.toUpperCase() === 'GET') {
    const queryParam = urlObj.searchParams.get('query');
    if (queryParam) {
      const opType = detectOperationType(queryParam);
      const opName =
        urlObj.searchParams.get('operationName') ||
        extractOperationNameFromQuery(queryParam) ||
        'AnonymousOperation';

      let variables: Record<string, unknown> | undefined;
      const varsParam = urlObj.searchParams.get('variables');
      if (varsParam) {
        try {
          variables = JSON.parse(varsParam);
        } catch {
          // ignore
        }
      }

      return {
        isGraphQL: true,
        operationType: opType,
        operationName: opName,
        query: formatGraphQLQuery(queryParam),
        variables,
      };
    }
  }

  if (isGraphqlPath) {
    return {
      isGraphQL: true,
      query: requestBody || '',
      operationName: 'GraphQLEndpoint',
    };
  }

  return null;
}

function detectOperationType(query: string): 'query' | 'mutation' | 'subscription' {
  const normalized = query.trim().toLowerCase();
  if (normalized.startsWith('mutation')) return 'mutation';
  if (normalized.startsWith('subscription')) return 'subscription';
  return 'query';
}

function extractOperationNameFromQuery(query: string): string | undefined {
  const match = query.match(/(?:query|mutation|subscription)\s+([A-Za-z0-9_]+)/i);
  return match ? match[1] : undefined;
}

function formatGraphQLQuery(raw: string): string {
  return raw
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '  ')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();
}
