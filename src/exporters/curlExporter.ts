import { NetworkRequest } from '../types/index.js';

export function generateCurlCommand(req: NetworkRequest): string {
  const parts: string[] = ['curl'];

  // 1. Method
  if (req.method !== 'GET') {
    parts.push(`-X ${req.method}`);
  }

  // 2. URL
  parts.push(`'${req.url.replace(/'/g, "'\\''")}'`);

  // 3. Headers (exclude pseudo-headers like :authority, :path, :method, :scheme)
  const ignoredHeaders = new Set(['host', 'content-length', ':authority', ':method', ':path', ':scheme']);
  for (const [key, value] of Object.entries(req.requestHeaders || {})) {
    if (!ignoredHeaders.has(key.toLowerCase()) && value) {
      parts.push(`-H '${key}: ${value.replace(/'/g, "'\\''")}'`);
    }
  }

  // 4. Body
  if (req.requestBody && req.method !== 'GET' && req.method !== 'HEAD') {
    const escapedBody = req.requestBody.replace(/'/g, "'\\''");
    parts.push(`--data-raw '${escapedBody}'`);
  }

  return parts.join(' \\\n  ');
}
