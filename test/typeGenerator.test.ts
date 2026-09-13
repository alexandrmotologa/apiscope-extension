import { describe, it, expect } from 'vitest';
import { generateTypeScriptInterface, generateZodSchema } from '../src/exporters/typeGenerator.js';

describe('TypeScript & Zod Type Generator', () => {
  const sampleJson = JSON.stringify({
    id: 101,
    name: 'Product A',
    active: true,
    tags: ['electronics', 'gadgets'],
    details: {
      sku: 'SKU-9901',
      price: 199.99,
      warehouse: null,
    },
  });

  it('generates clean TypeScript interfaces with nested types', () => {
    const tsCode = generateTypeScriptInterface(sampleJson, 'Product');
    expect(tsCode).toContain('export interface Product {');
    expect(tsCode).toContain('id: number;');
    expect(tsCode).toContain('name: string;');
    expect(tsCode).toContain('active: boolean;');
    expect(tsCode).toContain('tags: string[];');
    expect(tsCode).toContain('details: Details;');
    expect(tsCode).toContain('export interface Details {');
    expect(tsCode).toContain('sku: string;');
    expect(tsCode).toContain('price: number;');
  });

  it('generates valid Zod schema definitions with z.infer type', () => {
    const zodCode = generateZodSchema(sampleJson, 'productSchema');
    expect(zodCode).toContain("import { z } from 'zod';");
    expect(zodCode).toContain('export const productSchema = z.object({');
    expect(zodCode).toContain('id: z.number(),');
    expect(zodCode).toContain('name: z.string(),');
    expect(zodCode).toContain('active: z.boolean(),');
    expect(zodCode).toContain('tags: z.array(z.string()),');
    expect(zodCode).toContain('export type Product = z.infer<typeof productSchema>;');
  });

  it('handles array root payloads', () => {
    const arrayJson = JSON.stringify([{ id: 1, title: 'Test' }]);
    const tsCode = generateTypeScriptInterface(arrayJson, 'TodoList');
    expect(tsCode).toContain('export type TodoList = TodoListItem[];');

    const zodCode = generateZodSchema(arrayJson, 'todoListSchema');
    expect(zodCode).toContain('z.array(');
  });
});
