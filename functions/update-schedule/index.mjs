import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const defaultDocClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'SmartFacultySchedules';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PUT,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/** Fields the caller may update (keys that exist on the schedule item). */
const UPDATABLE_FIELDS = ['end_time', 'event_name', 'event_type'];

/**
 * Builds the Lambda handler around an injectable document client, for unit testing.
 * @param {{ docClient?: DynamoDBDocumentClient, tableName?: string }} deps
 */
export function createHandler({ docClient = defaultDocClient, tableName = TABLE_NAME } = {}) {
  /**
   * Lambda handler for updating an existing schedule slot in DynamoDB.
   * Path: PUT /api/schedules/{room_code}/{schedule_slot}
   */
  return async function updateSchedule(event) {
    const rawRoomCode = event.pathParameters?.room_code || '';
    const roomCode = decodeURIComponent(rawRoomCode);
    if (!roomCode) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Missing room_code in path parameters' }),
      };
    }

    const rawScheduleSlot = event.pathParameters?.schedule_slot || '';
    const scheduleSlot = decodeURIComponent(rawScheduleSlot);
    if (!scheduleSlot) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Missing schedule_slot in path parameters' }),
      };
    }

    // Parse body
    let body = {};
    if (typeof event.body === 'string') {
      try {
        body = JSON.parse(event.body);
      } catch {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'Invalid JSON in request body' }),
        };
      }
    } else if (event.body && typeof event.body === 'object') {
      body = event.body;
    }

    // Collect updatable fields present in the body
    const updateData = {};
    for (const field of UPDATABLE_FIELDS) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'No fields provided for update' }),
      };
    }

    // Construct dynamic UpdateExpression with ExpressionAttributeNames to avoid reserved keyword conflicts
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    Object.keys(updateData).forEach((key, index) => {
      const attrName = `#attr${index}`;
      const attrValue = `:val${index}`;
      updateExpressions.push(`${attrName} = ${attrValue}`);
      expressionAttributeNames[attrName] = key;
      expressionAttributeValues[attrValue] = updateData[key];
    });

    try {
      const result = await docClient.send(
        new UpdateCommand({
          TableName: tableName,
          Key: { room_code: roomCode, schedule_slot: scheduleSlot },
          UpdateExpression: `SET ${updateExpressions.join(', ')}`,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues,
          ReturnValues: 'ALL_NEW',
        })
      );

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          message: 'Schedule updated successfully',
          data: result.Attributes,
        }),
      };
    } catch (error) {
      console.error('Error updating schedule:', error);
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: 'Failed to update schedule',
          message: error.message,
        }),
      };
    }
  };
}

export const handler = createHandler();
