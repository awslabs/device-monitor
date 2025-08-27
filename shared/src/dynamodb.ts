/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import {
  DescribeTableCommand,
  DynamoDBClient,
  type DescribeTableCommandOutput
} from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocument,
  type GetCommandOutput,
  type QueryCommandOutput
} from '@aws-sdk/lib-dynamodb';
import type { NativeAttributeValue } from '@aws-sdk/util-dynamodb';
import { logger, tracer } from './powertools';
import type { LocationRecord } from './types';

const dynamoClient: DynamoDBClient = tracer.captureAWSv3Client(
  new DynamoDBClient({
    region: process.env.AWS_REGION
  })
);

const docClient: DynamoDBDocument = DynamoDBDocument.from(dynamoClient);

export function getDynamoDBClient(): DynamoDBClient {
  return dynamoClient;
}

export function getDocumentClient(): DynamoDBDocument {
  return docClient;
}

export async function query<
  T extends object = Record<string, NativeAttributeValue>
>(
  key: string,
  value: string,
  projection: Array<string> = [],
  TableName?: string,
  IndexName?: string,
  Limit?: number,
  ScanIndexForward?: boolean
): Promise<Array<T>> {
  if (!TableName) {
    throw new Error('Missing table name');
  }
  logger.debug(`Getting all records by ${key}`, {
    [key]: value,
    table: TableName
  });
  const items: Array<T> = [];
  let ExclusiveStartKey: Record<string, NativeAttributeValue> | undefined;
  do {
    const { Items, LastEvaluatedKey }: QueryCommandOutput =
      await docClient.query({
        TableName,
        IndexName,
        KeyConditionExpression: '#key = :value',
        ExpressionAttributeNames: {
          '#key': key,
          ...projection.reduce(
            (
              names: Record<string, string>,
              name: string
            ): Record<string, string> => {
              names[`#${name}`] = name;
              return names;
            },
            {}
          )
        },
        ExpressionAttributeValues: {
          ':value': value
        },
        ProjectionExpression: projection?.length
          ? `#${projection.join(', #')}`
          : undefined,
        Limit,
        ScanIndexForward,
        ExclusiveStartKey
      });
    ExclusiveStartKey = LastEvaluatedKey;
    items.push(...((Items as Array<T>) || []));
  } while (ExclusiveStartKey && items.length < (Limit || Infinity));
  logger.debug(`Found ${items.length} records`, {
    [key]: value,
    table: TableName
  });
  return items;
}

export async function getRecord<
  K extends Record<string, unknown> = Record<string, NativeAttributeValue>,
  T extends Record<string, unknown> = Record<string, NativeAttributeValue>
>(TableName: string, Key: K, projection: Array<string> = []): Promise<T> {
  logger.debug('Getting database record', { table: TableName, key: Key });
  try {
    const { Item }: GetCommandOutput = await docClient.get({
      TableName,
      Key,
      ExpressionAttributeNames: projection?.length
        ? projection.reduce(
            (
              names: Record<string, string>,
              name: string
            ): Record<string, string> => {
              names[`#${name}`] = name;
              return names;
            },
            {}
          )
        : undefined,
      ProjectionExpression: projection?.length
        ? `#${projection.join(', #')}`
        : undefined
    });
    if (!Item) {
      throw new Error('Record not found!');
    }
    logger.debug('Got database record', { table: TableName, key: Key });
    return Item as T;
  } catch (error: unknown) {
    logger.error('Could not get database record', {
      error,
      table: TableName,
      key: Key
    });
    throw error;
  }
}

export async function getLocation(
  locationsTableName: string,
  serialNumber: string
): Promise<LocationRecord> {
  const results: Array<LocationRecord> = await query<LocationRecord>(
    'serialNumber',
    serialNumber,
    undefined,
    locationsTableName
  );
  if (results.length === 0) {
    throw new Error('Location not found');
  }
  if (results.length > 1) {
    logger.warn('Multiple locations found for device', { serialNumber });
  }
  return results.reduce(
    (prev: LocationRecord, current: LocationRecord): LocationRecord =>
      new Date(prev?.created) > new Date(current.created) ? prev : current
  );
}

export async function getItemCount(TableName: string): Promise<number> {
  logger.debug('Getting item count', { TableName });

  const { Table }: DescribeTableCommandOutput = await dynamoClient.send(
    new DescribeTableCommand({ TableName })
  );
  const count: number = Table?.ItemCount || 0;

  logger.debug('Got item count', { TableName, count });
  return count;
}
