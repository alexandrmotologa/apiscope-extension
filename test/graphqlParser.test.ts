import { describe, it, expect } from 'vitest';
import { parseGraphQLRequest } from '../src/audit/graphqlParser.js';

describe('GraphQL Request Parser', () => {
  it('parses standard GraphQL POST queries with variables', () => {
    const body = JSON.stringify({
      operationName: 'GetUserProfile',
      query: `query GetUserProfile($id: ID!) {
        user(id: $id) {
          id
          name
          email
        }
      }`,
      variables: { id: 'usr_102' },
    });

    const parsed = parseGraphQLRequest('https://api.example.com/graphql', 'POST', body);
    expect(parsed).not.toBeNull();
    expect(parsed?.isGraphQL).toBe(true);
    expect(parsed?.operationType).toBe('query');
    expect(parsed?.operationName).toBe('GetUserProfile');
    expect(parsed?.variables).toEqual({ id: 'usr_102' });
  });

  it('detects GraphQL mutations accurately', () => {
    const body = JSON.stringify({
      query: `mutation AddTodoItem($text: String!) {
        addTodo(text: $text) {
          id
          done
        }
      }`,
    });

    const parsed = parseGraphQLRequest('https://api.example.com/api', 'POST', body);
    expect(parsed).not.toBeNull();
    expect(parsed?.operationType).toBe('mutation');
    expect(parsed?.operationName).toBe('AddTodoItem');
  });

  it('parses GraphQL GET requests with ?query= parameter', () => {
    const url = 'https://api.example.com/graphql?query=%7Bviewer%7Bid%20name%7D%7D&operationName=GetViewer';
    const parsed = parseGraphQLRequest(url, 'GET', null);
    expect(parsed).not.toBeNull();
    expect(parsed?.isGraphQL).toBe(true);
    expect(parsed?.operationName).toBe('GetViewer');
  });

  it('returns null for non-GraphQL REST requests', () => {
    const body = JSON.stringify({ title: 'New Blog Post', content: 'Lorem ipsum' });
    const parsed = parseGraphQLRequest('https://api.example.com/v1/posts', 'POST', body);
    expect(parsed).toBeNull();
  });
});
