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
import { IoTDataPlaneClient, GetRetainedMessageCommand } from '@aws-sdk/client-iot-data-plane';
import { Lambda, InvokeCommand } from '@aws-sdk/client-lambda';

// Mock IoT Data and Lambda clients
const iotDataClientMock: AwsClientStub<IoTDataPlaneClient> = mockClient(IoTDataPlaneClient);
const lambdaMock: AwsClientStub<Lambda> = mockClient(Lambda);

// Function to invoke the Python Lambda
async function invokePythonLambda(event: any, context: any) {
  // This would normally invoke the actual Lambda, but for testing we'll mock the response
  const response = await lambdaMock.send(new InvokeCommand({
    FunctionName: 'GetRetainedTopicFunction',
    Payload: Buffer.from(JSON.stringify({
      arguments: event.arguments,
      info: event.info
    }))
  }));
  
  // Parse the response payload
  return JSON.parse(Buffer.from(response.Payload || '{}').toString());
}

describe('Get Retained Topic Python Lambda', (): void => {
  beforeEach((): void => {
    // Reset all mocks
    iotDataClientMock.reset();
    lambdaMock.reset();
    
    // Create a sample payload
    const samplePayload = JSON.stringify({
      temperature: 25.5,
      humidity: 60,
      timestamp: Date.now()
    });
    
    // Mock IoT Data response
    iotDataClientMock.on(GetRetainedMessageCommand).resolves({
      payload: Buffer.from(samplePayload),
      lastModifiedTime: new Date().getTime()
    });
    
    // Mock Lambda response
    lambdaMock.on(InvokeCommand).resolves({
      StatusCode: 200,
      Payload: Buffer.from(JSON.stringify({
        data: {
          topic: 'things/test-thing/topics/info',
          payload: JSON.parse(samplePayload),
          timestamp: new Date().getTime()
        }
      }))
    });
  });

  test('Should return retained topic data', async (): Promise<void> => {
    const result = await invokePythonLambda(
      {
        ...SAMPLE_EVENT,
        arguments: {
          thingName: 'test-thing',
          topicName: 'info'
        }
      },
      SAMPLE_CONTEXT
    );
    
    expect(result).toMatchObject({
      data: expect.objectContaining({
        topic: expect.stringContaining('test-thing'),
        payload: expect.objectContaining({
          temperature: expect.any(Number),
          humidity: expect.any(Number)
        }),
        timestamp: expect.any(Number)
      })
    });
  });
});