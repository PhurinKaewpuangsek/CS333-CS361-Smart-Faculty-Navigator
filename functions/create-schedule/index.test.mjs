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

describe('CreateScheduleFunction Lambda Handler', () => {
  test('returns 400 when required body fields are missing', async () => {
    const handler = createHandler({ docClient: fakeDocClient({}), tableName: 'TestTable' });
    // Missing event_code
    const response = await handler({
      body: JSON.stringify({ room_code: 'LC3-101/1', day_of_week: 'MON', start_time: '09:00' }),
    });

    assert.equal(response.statusCode, 400);
    assert.equal(response.headers['Access-Control-Allow-Origin'], '*');
    assert.equal(response.headers['Content-Type'], 'application/json');
    const body = JSON.parse(response.body);
    assert.match(body.error, /Missing required field/);
  });

  test('returns 400 when body is invalid JSON', async () => {
    const handler = createHandler({ docClient: fakeDocClient({}), tableName: 'TestTable' });
    const response = await handler({ body: '{not-valid-json' });

    assert.equal(response.statusCode, 400);
    assert.equal(response.headers['Access-Control-Allow-Origin'], '*');
    const body = JSON.parse(response.body);
    assert.match(body.error, /Invalid JSON/);
  });

  test('returns 200 with correct schedule_slot key in response body', async () => {
    const handler = createHandler({ docClient: fakeDocClient({}), tableName: 'TestTable' });
    const response = await handler({
      body: JSON.stringify({
        room_code: 'LC3-101/1',
        day_of_week: 'MON',
        start_time: '09:00',
        event_code: 'CS333',
      }),
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.headers['Access-Control-Allow-Origin'], '*');
    const body = JSON.parse(response.body);
    assert.equal(body.message, 'Schedule created successfully');
    assert.equal(body.schedule_slot, 'MON#09:00#CS333');
  });

  test('returns 500 when docClient.send() rejects', async () => {
    const handler = createHandler({
      docClient: fakeDocClient(new Error('ProvisionedThroughputExceededException')),
      tableName: 'TestTable',
    });
    const response = await handler({
      body: JSON.stringify({
        room_code: 'LC3-101/1',
        day_of_week: 'TUE',
        start_time: '11:00',
        event_code: 'CS361',
      }),
    });

    assert.equal(response.statusCode, 500);
    assert.equal(response.headers['Access-Control-Allow-Origin'], '*');
    const body = JSON.parse(response.body);
    assert.match(body.error, /Failed to create/);
  });
});
