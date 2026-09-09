import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'SmartFacultyLocations';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PUT,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Lambda handler for updating room details in DynamoDB.
 * Path: PUT /api/locations/{location_id}
 */
export const handler = async (event) => {
  try {
    const locationId = event.pathParameters?.location_id;
    if (!locationId) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Missing location_id in path parameters' }),
      };
    }

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

    const updateData = {};

    // Handle room name mappings (support name, name_th, and nameThai)
    const roomName = body.name ?? body.name_th ?? body.nameThai;
    if (roomName !== undefined) {
      updateData.name_th = roomName;
      updateData.name = roomName;
      updateData.nameThai = roomName;
    }

    // Handle capacity
    if (body.capacity !== undefined) {
      const parsedCapacity = Number(body.capacity);
      updateData.capacity = isNaN(parsedCapacity) ? body.capacity : parsedCapacity;
    }

    // Copy any additional custom fields provided in body (excluding location_id)
    for (const [key, value] of Object.entries(body)) {
      if (
        key !== 'location_id' &&
        key !== 'name' &&
        key !== 'name_th' &&
        key !== 'nameThai' &&
        key !== 'capacity'
      ) {
        updateData[key] = value;
      }
    }

    const updateKeys = Object.keys(updateData);
    if (updateKeys.length === 0) {
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

    updateKeys.forEach((key, index) => {
      const attrName = `#attr${index}`;
      const attrValue = `:val${index}`;
      updateExpressions.push(`${attrName} = ${attrValue}`);
      expressionAttributeNames[attrName] = key;
      expressionAttributeValues[attrValue] = updateData[key];
    });

    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        location_id: locationId,
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    const result = await docClient.send(command);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        message: 'Room details updated successfully',
        data: result.Attributes,
      }),
    };
  } catch (error) {
    console.error('Error updating room location:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Failed to update room location',
        message: error.message,
      }),
    };
  }
};
