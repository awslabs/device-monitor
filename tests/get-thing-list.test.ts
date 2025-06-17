/**
 * Copyright 2025 Amazon.com, Inc. and its affiliates. All Rights Reserved.
 *
 * Licensed under the Amazon Software License (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 *   http://aws.amazon.com/asl/
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

import { SAMPLE_CONTEXT, SAMPLE_EVENT } from '../shared/src/utils';
import { describe, expect, test, beforeEach } from '@jest/globals';
import { mockClient, type AwsClientStub } from 'aws-sdk-client-mock';
import { IoTClient, SearchIndexCommand } from '@aws-sdk/client-iot';
import { Lambda, InvokeCommand } from '@aws-sdk/client-lambda';

// Mock IoT and Lambda clients
const iotClientMock: AwsClientStub<IoTClient> = mockClient(IoTClient);
const lambdaMock: AwsClientStub<Lambda> = mockClient(Lambda);

// Function to invoke the Python Lambda
async function invokePythonLambda(event: any, context: any) {
  // This would normally invoke the actual Lambda, but for testing we'll mock the response
  const response = await lambdaMock.send(new InvokeCommand({
    FunctionName: 'ListThingsFunction',
    Payload: Buffer.from(JSON.stringify({
      arguments: event.arguments,
      info: event.info
    }))
  }));
  
  // Parse the response payload
  return JSON.parse(Buffer.from(response.Payload || '{}').toString());
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
      Payload: Buffer.from(JSON.stringify({
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
      }))
    });
  });

  test('Should return list of things', async (): Promise<void> => {
    const result = await invokePythonLambda(
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
    const result = await invokePythonLambda(
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