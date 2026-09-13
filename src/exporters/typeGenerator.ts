/**
 * Capitalizes the first letter of a string
 */
function capitalize(str: string): string {
  if (!str) return 'Item';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Sanitizes property names for TS/JS
 */
function sanitizeKey(key: string): string {
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
    return key;
  }
  return JSON.stringify(key);
}

/**
 * Generates TypeScript interface declarations from any JSON payload
 */
export function generateTypeScriptInterface(rawJson: string | object, rootName = 'ApiResponse'): string {
  let parsed: unknown;
  try {
    parsed = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
  } catch {
    return `// Invalid JSON payload\nexport type ${rootName} = unknown;\n`;
  }

  if (parsed === null || typeof parsed !== 'object') {
    return `export type ${rootName} = ${parsed === null ? 'null' : typeof parsed};\n`;
  }

  const interfaces: Map<string, string[]> = new Map();
  const seenTypes = new Set<string>();

  function inferType(val: unknown, propName: string): string {
    if (val === null) return 'null | unknown';
    if (val === undefined) return 'undefined';

    const type = typeof val;
    if (type === 'string' || type === 'number' || type === 'boolean') {
      return type;
    }

    if (Array.isArray(val)) {
      if (val.length === 0) return 'unknown[]';
      // Sample first item
      const itemType = inferType(val[0], propName ? `${capitalize(propName)}Item` : 'Item');
      return `${itemType}[]`;
    }

    if (typeof val === 'object') {
      let subTypeName = capitalize(propName || 'Sub');
      if (seenTypes.has(subTypeName) && !interfaces.has(subTypeName)) {
        subTypeName = `${subTypeName}_${Math.floor(Math.random() * 1000)}`;
      }
      seenTypes.add(subTypeName);

      buildInterface(val as Record<string, unknown>, subTypeName);
      return subTypeName;
    }

    return 'unknown';
  }

  function buildInterface(obj: Record<string, unknown>, interfaceName: string) {
    if (interfaces.has(interfaceName)) return;

    const lines: string[] = [];
    lines.push(`export interface ${interfaceName} {`);

    const entries = Object.entries(obj);
    if (entries.length === 0) {
      lines.push('  [key: string]: unknown;');
    } else {
      for (const [k, v] of entries) {
        const isOptional = v === null || v === undefined;
        const propType = inferType(v, k);
        const cleanKey = sanitizeKey(k);
        lines.push(`  ${cleanKey}${isOptional ? '?' : ''}: ${propType};`);
      }
    }

    lines.push('}');
    interfaces.set(interfaceName, lines);
  }

  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      return `export type ${rootName} = unknown[];\n`;
    }
    const elemType = inferType(parsed[0], `${rootName}Item`);
    const allLines: string[] = [];
    for (const [, chunk] of interfaces.entries()) {
      allLines.push(chunk.join('\n'));
      allLines.push('');
    }
    allLines.push(`export type ${rootName} = ${elemType}[];`);
    return allLines.join('\n');
  }

  buildInterface(parsed as Record<string, unknown>, rootName);

  const allLines: string[] = [];
  // Place root interface first
  const rootChunk = interfaces.get(rootName);
  if (rootChunk) {
    allLines.push(rootChunk.join('\n'));
    allLines.push('');
  }

  for (const [name, chunk] of interfaces.entries()) {
    if (name !== rootName) {
      allLines.push(chunk.join('\n'));
      allLines.push('');
    }
  }

  return allLines.join('\n').trim();
}

/**
 * Generates Zod schema definitions from any JSON payload
 */
export function generateZodSchema(rawJson: string | object, rootName = 'apiResponseSchema'): string {
  let parsed: unknown;
  try {
    parsed = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
  } catch {
    return `import { z } from 'zod';\n\nexport const ${rootName} = z.unknown();\n`;
  }

  const schemas: Map<string, string[]> = new Map();
  const seenTypes = new Set<string>();

  function inferZodType(val: unknown, propName: string): string {
    if (val === null || val === undefined) return 'z.unknown().nullable()';

    const type = typeof val;
    if (type === 'string') return 'z.string()';
    if (type === 'number') return 'z.number()';
    if (type === 'boolean') return 'z.boolean()';

    if (Array.isArray(val)) {
      if (val.length === 0) return 'z.array(z.unknown())';
      const itemZod = inferZodType(val[0], `${propName}Item`);
      return `z.array(${itemZod})`;
    }

    if (typeof val === 'object') {
      const subName = `${propName.toLowerCase()}Schema`;
      if (!seenTypes.has(subName)) {
        seenTypes.add(subName);
        buildZod(val as Record<string, unknown>, subName);
      }
      return subName;
    }

    return 'z.unknown()';
  }

  function buildZod(obj: Record<string, unknown>, schemaName: string) {
    if (schemas.has(schemaName)) return;

    const lines: string[] = [];
    lines.push(`export const ${schemaName} = z.object({`);

    for (const [k, v] of Object.entries(obj)) {
      const isNull = v === null;
      let fieldSchema = inferZodType(v, k);
      if (isNull) {
        fieldSchema = 'z.unknown().nullable().optional()';
      }
      const cleanKey = sanitizeKey(k);
      lines.push(`  ${cleanKey}: ${fieldSchema},`);
    }

    lines.push('});');
    schemas.set(schemaName, lines);
  }

  if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
    buildZod(parsed as Record<string, unknown>, rootName);
  } else if (Array.isArray(parsed)) {
    const itemZod = parsed.length > 0 ? inferZodType(parsed[0], 'item') : 'z.unknown()';
    return [
      `import { z } from 'zod';`,
      '',
      `export const ${rootName} = z.array(${itemZod});`,
      `export type ${capitalize(rootName.replace(/schema$/i, ''))} = z.infer<typeof ${rootName}>;`,
    ].join('\n');
  } else {
    return [
      `import { z } from 'zod';`,
      '',
      `export const ${rootName} = z.${typeof parsed}();`,
      `export type ${capitalize(rootName.replace(/schema$/i, ''))} = z.infer<typeof ${rootName}>;`,
    ].join('\n');
  }

  const output: string[] = [`import { z } from 'zod';`, ''];

  // Root first
  const rootChunk = schemas.get(rootName);
  if (rootChunk) {
    output.push(rootChunk.join('\n'));
    output.push('');
  }

  for (const [name, chunk] of schemas.entries()) {
    if (name !== rootName) {
      output.push(chunk.join('\n'));
      output.push('');
    }
  }

  const typeName = capitalize(rootName.replace(/schema$/i, '') || 'Result');
  output.push(`export type ${typeName} = z.infer<typeof ${rootName}>;`);

  return output.join('\n').trim();
}
