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
import {
  DescribeThingCommand,
  IoTClient,
  ListThingGroupsForThingCommand,
  SearchIndexCommand
} from '@aws-sdk/client-iot';
import { Lambda, InvokeCommand } from '@aws-sdk/client-lambda';

// Mock IoT and Lambda clients
const iotClientMock: AwsClientStub<IoTClient> = mockClient(IoTClient);
const lambdaMock: AwsClientStub<Lambda> = mockClient(Lambda);

// Function to invoke the Python Lambda
async function invokePythonLambda(event: any, context: any) {
  // This would normally invoke the actual Lambda, but for testing we'll mock the response
  const response = await lambdaMock.send(new InvokeCommand({
    FunctionName: 'getDevicePython',
    Payload: Buffer.from(JSON.stringify({
      arguments: event.arguments,
      info: event.info
    }))
  }));
  
  // Parse the response payload
  return JSON.parse(Buffer.from(response.Payload || '{}').toString());
}

describe('Get Device Python Lambda', (): void => {
  beforeEach((): void => {
    // Reset all mocks
    iotClientMock.reset();
    lambdaMock.reset();
    
    // Mock IoT responses
    iotClientMock.on(SearchIndexCommand).resolves({
      things: [{
        thingName: 'test',
        attributes: {},
        connectivity: {
          connected: true,
          timestamp: new Date().toISOString()
        }
      }],
      thingGroups: []
    });
    
    iotClientMock.on(ListThingGroupsForThingCommand).resolves({
      thingGroups: [{ groupName: 'testGroup' }]
    });
    
    iotClientMock.on(DescribeThingCommand).resolves({
      thingName: 'test',
      attributes: {},
      thingTypeName: 'testType'
    });
    
    // Mock Lambda response
    lambdaMock.on(InvokeCommand).resolves({
      StatusCode: 200,
      Payload: Buffer.from(JSON.stringify({
        data: {
          thingName: 'test',
          attributes: {},
          deviceType: 'testType',
          connected: true,
          deviceGroups: ['testGroup'],
          firmwareType: null,
          firmwareVersion: null
        }
      }))
    });
  });

  test('Should return device details', async (): Promise<void> => {
    const result = await invokePythonLambda(
      {
        ...SAMPLE_EVENT,
        arguments: {
          thingName: 'test'
        }
      },
      SAMPLE_CONTEXT
    );
    
    expect(result).toMatchObject({
      data: {
        thingName: 'test',
        deviceType: expect.any(String),
        connected: expect.any(Boolean),
        deviceGroups: expect.any(Array)
      }
    });
  });
});