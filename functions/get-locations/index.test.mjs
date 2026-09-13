import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { LANDMARK_FIELDS, RESPONSE_FIELDS, createHandler } from './index.mjs';

/** Minimal stand-in for DynamoDBDocumentClient: replays the given Scan pages in order. */
function fakeDocClient(pages) {
  const calls = [];
  return {
    calls,
    async send(command) {
      calls.push(command.input);
      const page = pages[calls.length - 1];
      if (page instanceof Error) throw page;
      return page;
    },
  };
}

describe('GetLocationsFunction Lambda Handler', () => {
  test('returns 200 with every scanned item wrapped in a records array', async () => {
    const items = [
      { location_id: 'LC3-F1-R101-1', name_th: 'ห้องบรรยาย 4', floor: 1 },
      { location_id: 'LC3-F1-PLFTOILET', name_th: 'ห้องน้ำหญิง (ฝั่งซ้าย)', floor: 1 },
    ];
    const docClient = fakeDocClient([{ Items: items }]);

    const response = await createHandler({ docClient, tableName: 'TestTable' })();

    assert.equal(response.statusCode, 200);
    assert.equal(response.headers['Access-Control-Allow-Origin'], '*');
    assert.equal(response.headers['Content-Type'], 'application/json');

    const body = JSON.parse(response.body);
    assert.equal(body.count, 2);
    assert.deepEqual(body.records, items);
    assert.equal(docClient.calls[0].TableName, 'TestTable');
  });

  test('follows LastEvaluatedKey until the whole table is read', async () => {
    const docClient = fakeDocClient([
      { Items: [{ location_id: 'A' }], LastEvaluatedKey: { location_id: 'A' } },
      { Items: [{ location_id: 'B' }] },
    ]);

    const response = await createHandler({ docClient, tableName: 'TestTable' })();

    const body = JSON.parse(response.body);
    assert.equal(body.count, 2);
    assert.deepEqual(
      body.records.map((r) => r.location_id),
      ['A', 'B']
    );
    assert.equal(docClient.calls.length, 2);
    assert.equal(docClient.calls[0].ExclusiveStartKey, undefined);
    assert.deepEqual(docClient.calls[1].ExclusiveStartKey, { location_id: 'A' });
  });

  test('returns an empty records array when the table has no items', async () => {
    const docClient = fakeDocClient([{ Items: [] }]);

    const response = await createHandler({ docClient, tableName: 'TestTable' })();

    assert.equal(response.statusCode, 200);
    assert.equal(response.headers['Access-Control-Allow-Origin'], '*');
    assert.deepEqual(JSON.parse(response.body), { count: 0, records: [] });
  });

  test('returns only the fields the app reads, dropping dataset provenance', async () => {
    const item = {
      location_id: 'LC3-F1-R122-4',
      building_code: 'LC3',
      floor: 1,
      room_code: 'LC3-122/4',
      name_th: 'ห้องพักอาจารย์',
      category: 'faculty_office',
      x: 544,
      y: 442,
      aliases: ['122/4'],
      capacity: 12,
      landmarks: [
        {
          ref_location_id: 'LC3-F1-PRFTOILET',
          text_th: 'ใกล้ห้องน้ำหญิง (ฝั่งขวา)',
          walk_hops: 14,
          kind: 'near_toilet',
          verification: 'derived_unverified',
        },
      ],
      source: { node_id: 'LC3_122/4' },
      verification: { coordinates: 'svg_verified' },
      flags: [],
      detail_th: 'อาคาร LC3 ชั้น 1 ห้อง 122/4',
      location_kind: 'room',
      map_asset_id: 'lc3-floor-1',
    };
    const docClient = fakeDocClient([{ Items: [item] }]);

    const response = await createHandler({ docClient, tableName: 'TestTable' })();
    const [record] = JSON.parse(response.body).records;

    assert.deepEqual(Object.keys(record).sort(), [...RESPONSE_FIELDS].filter((k) => k !== 'room_number').sort());
    for (const dropped of ['source', 'verification', 'flags', 'detail_th', 'location_kind', 'map_asset_id']) {
      assert.equal(dropped in record, false, `${dropped} should not be sent`);
    }
    assert.deepEqual(Object.keys(record.landmarks[0]).sort(), [...LANDMARK_FIELDS].sort());
  });

  test('asks DynamoDB for only those fields, through placeholders', async () => {
    const docClient = fakeDocClient([{ Items: [] }]);

    await createHandler({ docClient, tableName: 'TestTable' })();

    const { ProjectionExpression, ExpressionAttributeNames } = docClient.calls[0];
    const projected = ProjectionExpression.split(', ').map((placeholder) => ExpressionAttributeNames[placeholder]);
    assert.deepEqual(projected, RESPONSE_FIELDS);
    assert.ok(!/\bfloor\b/.test(ProjectionExpression), 'reserved words must not appear bare');
  });

  test('returns 500 with CORS headers when the scan fails', async () => {
    const docClient = fakeDocClient([new Error('ResourceNotFoundException')]);

    const response = await createHandler({ docClient, tableName: 'TestTable' })();

    assert.equal(response.statusCode, 500);
    assert.equal(response.headers['Access-Control-Allow-Origin'], '*');

    const body = JSON.parse(response.body);
    assert.match(body.error, /Failed to fetch locations/);
    assert.equal(body.message, 'ResourceNotFoundException');
  });
});
