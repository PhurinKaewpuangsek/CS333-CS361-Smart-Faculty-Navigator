import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const defaultDocClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'SmartFacultySchedules';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/** Reads every item out of the schedules table, following LastEvaluatedKey until done. */
async function scanAllSchedules(docClient, tableName) {
  const records = [];
  let exclusiveStartKey;

  do {
    const page = await docClient.send(
      new ScanCommand({
        TableName: tableName,
        ...(exclusiveStartKey ? { ExclusiveStartKey: exclusiveStartKey } : {}),
      })
    );

    if (Array.isArray(page.Items)) {
      records.push(...page.Items);
    }
    exclusiveStartKey = page.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return records;
}

/** Builds the Lambda handler around an injectable document client, for unit testing. */
export function createHandler({ docClient = defaultDocClient, tableName = TABLE_NAME } = {}) {
  return async function getSchedules() {
    try {
      const records = await scanAllSchedules(docClient, tableName);

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ count: records.length, records }),
      };
    } catch (error) {
      console.error('Error scanning schedules:', error);
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: 'Failed to fetch schedules',
          message: error.message,
        }),
      };
    }
  };
}

/**
 * Lambda handler for reading every class/exam schedule slot from DynamoDB.
 * Path: GET /api/schedules
 */
export const handler = createHandler();
