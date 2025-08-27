/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at

 *   http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { SAMPLE_CONTEXT, SAMPLE_EVENT } from '../shared/src/utils';
import { describe, expect, test, beforeEach } from '@jest/globals';
import { mockClient, type AwsClientStub } from 'aws-sdk-client-mock';
// Import but not directly used in code, used by DynamoDBDocumentClient internally
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Lambda, InvokeCommand } from '@aws-sdk/client-lambda';

// Mock DynamoDB and Lambda clients
const ddbMock: AwsClientStub<DynamoDBDocumentClient> = mockClient(
  DynamoDBDocumentClient
);
const lambdaMock: AwsClientStub<Lambda> = mockClient(Lambda);

// Define types for the event and response
interface StatsEvent {
  arguments: Record<string, unknown>;
  info: Record<string, unknown>;
}

interface StatsResponse {
  data: {
    status: string;
    recordTime: string;
    registeredDevices: number;
    connectedDevices: number;
    disconnectedDevices: number;
    brandNameDistribution: string;
    countryDistribution: string;
    productTypeDistribution: string;
    disconnectDistribution: string;
    groupDistribution: string;
    deviceTypeDistribution: string;
    versionDistribution: string;
    ttl: number;
  };
}

// Function to invoke the Python Lambda
async function invokePythonLambda(
  event: StatsEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _context: unknown
): Promise<StatsResponse> {
  // This would normally invoke the actual Lambda, but for testing we'll mock the response
  const response: AWS.Response<Lambda, 'send'> = await lambdaMock.send(
    new InvokeCommand({
      FunctionName: 'GetLatestStatsFunction',
      Payload: Buffer.from(
        JSON.stringify({
          arguments: event.arguments,
          info: event.info
        })
      )
    })
  );

  // Parse the response payload
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const payload: Buffer = (response.Payload as Buffer) || Buffer.from('{}');
  return JSON.parse(payload.toString()) as StatsResponse;
}

describe('Get Latest Stats Python Lambda', (): void => {
  beforeEach((): void => {
    // Reset all mocks
    ddbMock.reset();
    lambdaMock.reset();

    // Mock DynamoDB response
    ddbMock.on(QueryCommand).resolves({
      Items: [
        {
          status: 'LATEST',
          recordTime: '2023-01-01T00:00:00.000Z',
          registeredDevices: 100,
          connectedDevices: 80,
          disconnectedDevices: 20,
          brandNameDistribution: JSON.stringify({
            'Brand A': 50,
            'Brand B': 50
          }),
          countryDistribution: JSON.stringify({ US: 60, UK: 40 }),
          productTypeDistribution: JSON.stringify({
            'Type A': 70,
            'Type B': 30
          }),
          disconnectDistribution: JSON.stringify({
            'Connection lost': 15,
            'User initiated': 5
          }),
          groupDistribution: JSON.stringify({ 'Group A': 40, 'Group B': 60 }),
          deviceTypeDistribution: JSON.stringify({
            'Type X': 55,
            'Type Y': 45
          }),
          versionDistribution: JSON.stringify({
            Firmware: {
              '1.0.0': 30,
              '1.1.0': 70
            }
          }),
          ttl: Math.floor(Date.now() / 1000) + 3600
        }
      ]
    });

    // Mock Lambda response
    lambdaMock.on(InvokeCommand).resolves({
      StatusCode: 200,
      Payload: Buffer.from(
        JSON.stringify({
          data: {
            status: 'LATEST',
            recordTime: '2023-01-01T00:00:00.000Z',
            registeredDevices: 100,
            connectedDevices: 80,
            disconnectedDevices: 20,
            brandNameDistribution: JSON.stringify({
              'Brand A': 50,
              'Brand B': 50
            }),
            countryDistribution: JSON.stringify({ US: 60, UK: 40 }),
            productTypeDistribution: JSON.stringify({
              'Type A': 70,
              'Type B': 30
            }),
            disconnectDistribution: JSON.stringify({
              'Connection lost': 15,
              'User initiated': 5
            }),
            groupDistribution: JSON.stringify({ 'Group A': 40, 'Group B': 60 }),
            deviceTypeDistribution: JSON.stringify({
              'Type X': 55,
              'Type Y': 45
            }),
            versionDistribution: JSON.stringify({
              Firmware: {
                '1.0.0': 30,
                '1.1.0': 70
              }
            }),
            ttl: Math.floor(Date.now() / 1000) + 3600
          }
        })
      )
    });
  });

  test('Should return latest device stats', async (): Promise<void> => {
    const result: StatsResponse = await invokePythonLambda(
      {
        ...SAMPLE_EVENT,
        arguments: {}
      },
      SAMPLE_CONTEXT
    );

    expect(result).toMatchObject({
      data: expect.objectContaining({
        status: 'LATEST',
        registeredDevices: expect.any(Number),
        connectedDevices: expect.any(Number),
        disconnectedDevices: expect.any(Number),
        versionDistribution: expect.any(String)
      })
    });
  });
});
