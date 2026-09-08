import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { handler } from './index.mjs';

describe('UpdateLocationFunction Lambda Handler', () => {
  test('returns 400 with CORS headers if location_id is missing', async () => {
    const event = {
      pathParameters: null,
      body: JSON.stringify({ name: 'Room 101' }),
    };

    const response = await handler(event);

    assert.equal(response.statusCode, 400);
    assert.equal(response.headers['Access-Control-Allow-Origin'], '*');
    assert.equal(response.headers['Content-Type'], 'application/json');

    const body = JSON.parse(response.body);
    assert.match(body.error, /Missing location_id/);
  });

  test('returns 400 with CORS headers if body is invalid JSON', async () => {
    const event = {
      pathParameters: { location_id: 'LC3-F1-R101' },
      body: 'invalid-json{',
    };

    const response = await handler(event);

    assert.equal(response.statusCode, 400);
    assert.equal(response.headers['Access-Control-Allow-Origin'], '*');

    const body = JSON.parse(response.body);
    assert.match(body.error, /Invalid JSON/);
  });

  test('returns 400 with CORS headers if no updatable fields provided', async () => {
    const event = {
      pathParameters: { location_id: 'LC3-F1-R101' },
      body: JSON.stringify({}),
    };

    const response = await handler(event);

    assert.equal(response.statusCode, 400);
    assert.equal(response.headers['Access-Control-Allow-Origin'], '*');

    const body = JSON.parse(response.body);
    assert.match(body.error, /No fields provided/);
  });
});
