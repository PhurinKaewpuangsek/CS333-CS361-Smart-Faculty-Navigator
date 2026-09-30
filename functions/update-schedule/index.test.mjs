import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from './index.mjs';

// ── helpers ──────────────────────────────────────────────────────────────────

function fakeDocClient(result) {
  return {
    async send() {
      if (result instanceof Error) throw result;
      return result;
    },
  };
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('UpdateScheduleFunction Lambda Handler', () => {
  test('returns 400 with CORS headers when room_code path param is missing', async () => {
    const handler = createHandler({ docClient: fakeDocClient({}), tableName: 'TestTable' });
    const response = await handler({
      pathParameters: { schedule_slot: 'MON#09:00#CS333' },
      body: JSON.stringify({ end_time: '10:00' }),
    });

    assert.equal(response.statusCode, 400);
    assert.equal(response.headers['Access-Control-Allow-Origin'], '*');
    assert.equal(response.headers['Content-Type'], 'application/json');
    const body = JSON.parse(response.body);
    assert.match(body.error, /Missing room_code/);
  });

  test('returns 400 with CORS headers when schedule_slot path param is missing', async () => {
    const handler = createHandler({ docClient: fakeDocClient({}), tableName: 'TestTable' });
    const response = await handler({
      pathParameters: { room_code: 'LC3-101/1' },
      body: JSON.stringify({ end_time: '10:00' }),
    });

    assert.equal(response.statusCode, 400);
    assert.equal(response.headers['Access-Control-Allow-Origin'], '*');
    const body = JSON.parse(response.body);
    assert.match(body.error, /Missing schedule_slot/);
  });

  test('returns 400 when no updatable fields are provided in body', async () => {
    const handler = createHandler({ docClient: fakeDocClient({}), tableName: 'TestTable' });
    const response = await handler({
      pathParameters: { room_code: 'LC3-101/1', schedule_slot: 'MON#09:00#CS333' },
      body: JSON.stringify({}),
    });

    assert.equal(response.statusCode, 400);
    assert.equal(response.headers['Access-Control-Allow-Origin'], '*');
    const body = JSON.parse(response.body);
    assert.match(body.error, /No fields provided/);
  });

  test('returns 200 with updated attributes on success', async () => {
    const fakeAttributes = {
      room_code: 'LC3-101/1',
      schedule_slot: 'MON#09:00#CS333',
      end_time: '10:00',
      event_name: 'Software Engineering',
    };
    const handler = createHandler({
      docClient: fakeDocClient({ Attributes: fakeAttributes }),
      tableName: 'TestTable',
    });
    const response = await handler({
      pathParameters: { room_code: 'LC3-101/1', schedule_slot: 'MON#09:00#CS333' },
      body: JSON.stringify({ end_time: '10:00', event_name: 'Software Engineering' }),
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.headers['Access-Control-Allow-Origin'], '*');
    const body = JSON.parse(response.body);
    assert.equal(body.message, 'Schedule updated successfully');
    assert.deepEqual(body.data, fakeAttributes);
  });

  test('returns 500 with CORS headers when docClient.send() rejects', async () => {
    const handler = createHandler({
      docClient: fakeDocClient(new Error('InternalServerError')),
      tableName: 'TestTable',
    });
    const response = await handler({
      pathParameters: { room_code: 'LC3-101/1', schedule_slot: 'MON#09:00#CS333' },
      body: JSON.stringify({ end_time: '10:00' }),
    });

    assert.equal(response.statusCode, 500);
    assert.equal(response.headers['Access-Control-Allow-Origin'], '*');
    const body = JSON.parse(response.body);
    assert.match(body.error, /Failed to update/);
  });
});
