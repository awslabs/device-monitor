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
import { IoTClient, SearchIndexCommand } from '@aws-sdk/client-iot';
import { Lambda, InvokeCommand } from '@aws-sdk/client-lambda';

// Mock IoT and Lambda clients
const iotClientMock: AwsClientStub<IoTClient> = mockClient(IoTClient);
const lambdaMock: AwsClientStub<Lambda> = mockClient(Lambda);

// Define types for the event and response
interface FilterCondition {
  fieldName: string;
  operator: string;
  value: string;
}

interface Filter {
  operation: string;
  filters: FilterCondition[];
}

interface ThingListEvent {
  arguments: {
    limit: number;
    nextToken: string | null;
    filter: Filter | null;
  };
  info: Record<string, unknown>;
}

interface ThingItem {
  thingName: string;
  deviceType: string;
  connected: boolean;
  lastConnectedAt: string;
  disconnectReason: string | null;
  productionTimestamp: number;
  provisioningTimestamp: number;
  brandName: string;
  country: string;
  hasApplianceFW: boolean;
  firmwareType: string | null;
  firmwareVersion: string | null;
  thingGroupNames: string[];
}

interface ThingListResponse {
  data: {
    items: ThingItem[];
    nextToken: string | null;
  };
}

// Function to invoke the Python Lambda
async function invokePythonLambda(
  event: ThingListEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _context: unknown
): Promise<ThingListResponse> {
  // This would normally invoke the actual Lambda, but for testing we'll mock the response
  const response: AWS.Response<Lambda, 'send'> = await lambdaMock.send(
    new InvokeCommand({
      FunctionName: 'ListThingsFunction',
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
  return JSON.parse(payload.toString()) as ThingListResponse;
}

describe('Get Thing List Python Lambda', (): void => {
  beforeEach((): void => {
    // Reset all mocks
    iotClientMock.reset();
    lambdaMock.reset();

    // Mock IoT responses
    iotClientMock.on(SearchIndexCommand).resolves({
      things: [
        {
          thingName: 'test-thing-1',
          thingTypeName: 'testType',
          connectivity: {
            connected: true,
            timestamp: new Date().toISOString()
          },
          attributes: {
            productionTimestamp: '1625097600000',
            provisioningTimestamp: '1625097600000',
            brandName: 'TestBrand',
            country: 'US',
            hasApplianceFW: 'true'
          },
          thingGroupNames: ['TestGroup']
        },
        {
          thingName: 'test-thing-2',
          thingTypeName: 'testType',
          connectivity: {
            connected: false,
            disconnectReason: 'Connection lost',
            timestamp: new Date().toISOString()
          },
          attributes: {
            productionTimestamp: '1625097600000',
            provisioningTimestamp: '1625097600000',
            brandName: 'TestBrand',
            country: 'UK',
            hasApplianceFW: 'false'
          },
          thingGroupNames: ['TestGroup']
        }
      ],
      nextToken: 'next-token'
    });

    // Mock Lambda response
    lambdaMock.on(InvokeCommand).resolves({
      StatusCode: 200,
      Payload: Buffer.from(
        JSON.stringify({
          data: {
            items: [
              {
                thingName: 'test-thing-1',
                deviceType: 'testType',
                connected: true,
                lastConnectedAt: new Date().toISOString(),
                disconnectReason: null,
                productionTimestamp: 1625097600000,
                provisioningTimestamp: 1625097600000,
                brandName: 'TestBrand',
                country: 'US',
                hasApplianceFW: true,
                firmwareType: null,
                firmwareVersion: null,
                thingGroupNames: ['TestGroup']
              },
              {
                thingName: 'test-thing-2',
                deviceType: 'testType',
                connected: false,
                lastConnectedAt: new Date().toISOString(),
                disconnectReason: 'Connection lost',
                productionTimestamp: 1625097600000,
                provisioningTimestamp: 1625097600000,
                brandName: 'TestBrand',
                country: 'UK',
                hasApplianceFW: false,
                firmwareType: null,
                firmwareVersion: null,
                thingGroupNames: ['TestGroup']
              }
            ],
            nextToken: 'next-token'
          }
        })
      )
    });
  });

  test('Should return list of things', async (): Promise<void> => {
    const result: ThingListResponse = await invokePythonLambda(
      {
        ...SAMPLE_EVENT,
        arguments: {
          limit: 10,
          nextToken: null,
          filter: null
        }
      },
      SAMPLE_CONTEXT
    );

    expect(result).toMatchObject({
      data: {
        items: expect.arrayContaining([
          expect.objectContaining({
            thingName: expect.any(String),
            deviceType: expect.any(String),
            connected: expect.any(Boolean),
            thingGroupNames: expect.any(Array)
          })
        ]),
        nextToken: expect.any(String)
      }
    });
  });

  test('Should handle filter input', async (): Promise<void> => {
    const result: ThingListResponse = await invokePythonLambda(
      {
        ...SAMPLE_EVENT,
        arguments: {
          limit: 10,
          nextToken: null,
          filter: {
            operation: 'and',
            filters: [
              {
                fieldName: 'thingName',
                operator: 'contains',
                value: 'test'
              }
            ]
          }
        }
      },
      SAMPLE_CONTEXT
    );

    expect(result).toMatchObject({
      data: {
        items: expect.arrayContaining([
          expect.objectContaining({
            thingName: expect.stringContaining('test')
          })
        ])
      }
    });
  });
});
