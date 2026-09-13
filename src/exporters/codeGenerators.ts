import { NetworkRequest } from '../types/index.js';

export function generatePythonRequests(req: NetworkRequest): string {
  const lines: string[] = ['import requests\n'];

  lines.push(`url = "${req.url}"`);

  // Headers
  const filteredHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(req.requestHeaders || {})) {
    if (!['host', 'content-length', ':authority', ':method', ':path', ':scheme'].includes(k.toLowerCase())) {
      filteredHeaders[k] = v;
    }
  }

  lines.push(`headers = ${JSON.stringify(filteredHeaders, null, 4)}`);

  // Payload
  if (req.requestBody && req.method !== 'GET' && req.method !== 'HEAD') {
    try {
      const jsonParsed = JSON.parse(req.requestBody);
      lines.push(`payload = ${JSON.stringify(jsonParsed, null, 4)}`);
      lines.push(`\nresponse = requests.${req.method.toLowerCase()}(url, headers=headers, json=payload)`);
    } catch {
      lines.push(`data = ${JSON.stringify(req.requestBody)}`);
      lines.push(`\nresponse = requests.${req.method.toLowerCase()}(url, headers=headers, data=data)`);
    }
  } else {
    lines.push(`\nresponse = requests.${req.method.toLowerCase()}(url, headers=headers)`);
  }

  lines.push('print("Status Code:", response.status_code)');
  lines.push('print("Response:", response.text)');

  return lines.join('\n');
}

export function generateFetchCode(req: NetworkRequest): string {
  const filteredHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(req.requestHeaders || {})) {
    if (!['host', 'content-length', ':authority', ':method', ':path', ':scheme'].includes(k.toLowerCase())) {
      filteredHeaders[k] = v;
    }
  }

  const options: Record<string, unknown> = {
    method: req.method,
    headers: filteredHeaders,
  };

  if (req.requestBody && req.method !== 'GET' && req.method !== 'HEAD') {
    options.body = req.requestBody;
  }

  return `const response = await fetch("${req.url}", ${JSON.stringify(options, null, 2)});
const data = await response.json();
console.log(data);`;
}

export function generateHttpieCommand(req: NetworkRequest): string {
  const parts: string[] = ['http', req.method, `'${req.url}'`];

  for (const [k, v] of Object.entries(req.requestHeaders || {})) {
    if (!['host', 'content-length', ':authority', ':method', ':path', ':scheme'].includes(k.toLowerCase())) {
      parts.push(`'${k}:${v}'`);
    }
  }

  if (req.requestBody && req.method !== 'GET') {
    try {
      const obj = JSON.parse(req.requestBody);
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === 'string') {
          parts.push(`${k}="${v}"`);
        } else {
          parts.push(`${k}:=${JSON.stringify(v)}`);
        }
      }
    } catch {
      parts.push(`<<< '${req.requestBody}'`);
    }
  }

  return parts.join(' ');
}
