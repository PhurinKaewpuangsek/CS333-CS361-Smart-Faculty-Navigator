import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const defaultDocClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'SmartFacultyLocations';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * The attributes the frontend reads (frontend/src/services/roomsService.ts normalizeRoom,
 * plus `capacity` for the room detail edit flow). Everything else in an item is dataset
 * provenance — `source`, `verification`, `flags`, `detail_th`, `location_kind`,
 * `map_asset_id` — which is about a third of the payload and never shown on the map.
 */
export const RESPONSE_FIELDS = [
  'location_id',
  'building_code',
  'floor',
  'room_code',
  'room_number',
  'name_th',
  'category',
  'x',
  'y',
  'aliases',
  'landmarks',
  'capacity',
];

/** Landmark keys the frontend reads; each landmark also carries its own `verification`. */
export const LANDMARK_FIELDS = ['kind', 'ref_location_id', 'text_th', 'walk_hops'];

// Every name goes through a placeholder: several of these (floor, x, y …) are, or may
// become, DynamoDB reserved words, and a projection that hits one fails the whole Scan.
const PROJECTION = {
  ProjectionExpression: RESPONSE_FIELDS.map((_, i) => `#f${i}`).join(', '),
  ExpressionAttributeNames: Object.fromEntries(RESPONSE_FIELDS.map((name, i) => [`#f${i}`, name])),
};

function pick(source, keys) {
  const out = {};
  for (const key of keys) {
    if (source[key] !== undefined) out[key] = source[key];
  }
  return out;
}

/** Drops landmark keys the app never reads; the projection cannot reach inside a list. */
function toResponseRecord(item) {
  const record = pick(item, RESPONSE_FIELDS);
  if (Array.isArray(record.landmarks)) {
    record.landmarks = record.landmarks.map((landmark) => pick(landmark, LANDMARK_FIELDS));
  }
  return record;
}

/**
 * Reads every item out of the locations table.
 *
 * The dataset is 131 items today, comfortably inside a single 1 MB Scan page, but the
 * LastEvaluatedKey loop keeps the handler correct as more buildings are onboarded.
 */
async function scanAllLocations(docClient, tableName) {
  const records = [];
  let exclusiveStartKey;

  do {
    const page = await docClient.send(
      new ScanCommand({
        TableName: tableName,
        ...PROJECTION,
        ...(exclusiveStartKey ? { ExclusiveStartKey: exclusiveStartKey } : {}),
      })
    );

    if (Array.isArray(page.Items)) {
      records.push(...page.Items.map(toResponseRecord));
    }
    exclusiveStartKey = page.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return records;
}

/**
 * Builds the Lambda handler around an injectable document client so the response
 * contract can be unit tested without reaching AWS.
 */
export function createHandler({ docClient = defaultDocClient, tableName = TABLE_NAME } = {}) {
  return async function getLocations() {
    try {
      const records = await scanAllLocations(docClient, tableName);

      // Same envelope the static rooms.json used, so the frontend parser is unchanged.
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ count: records.length, records }),
      };
    } catch (error) {
      console.error('Error scanning locations:', error);
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: 'Failed to fetch locations',
          message: error.message,
        }),
      };
    }
  };
}

/**
 * Lambda handler for reading every room location from DynamoDB.
 * Path: GET /api/locations
 */
export const handler = createHandler();
