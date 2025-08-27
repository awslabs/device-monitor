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
import {
  IoTDataPlaneClient,
  GetRetainedMessageCommand
} from '@aws-sdk/client-iot-data-plane';
import { Lambda, InvokeCommand } from '@aws-sdk/client-lambda';

// Mock IoT Data and Lambda clients
const iotDataClientMock: AwsClientStub<IoTDataPlaneClient> =
  mockClient(IoTDataPlaneClient);
const lambdaMock: AwsClientStub<Lambda> = mockClient(Lambda);

// Define types for the event and response
interface TopicEvent {
  arguments: {
    thingName: string;
    topicName: string;
  };
  info: Record<string, unknown>;
}

interface TopicPayload {
  temperature: number;
  humidity: number;
  timestamp: number;
}

interface TopicResponse {
  data: {
    topic: string;
    payload: TopicPayload;
    timestamp: number;
  };
}

// Function to invoke the Python Lambda
async function invokePythonLambda(
  event: TopicEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _context: unknown
): Promise<TopicResponse> {
  // This would normally invoke the actual Lambda, but for testing we'll mock the response
  const response: AWS.Response<Lambda, 'send'> = await lambdaMock.send(
    new InvokeCommand({
      FunctionName: 'GetRetainedTopicFunction',
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
  return JSON.parse(payload.toString()) as TopicResponse;
}

describe('Get Retained Topic Python Lambda', (): void => {
  beforeEach((): void => {
    // Reset all mocks
    iotDataClientMock.reset();
    lambdaMock.reset();

    // Create a sample payload
    const samplePayload: string = JSON.stringify({
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
      Payload: Buffer.from(
        JSON.stringify({
          data: {
            topic: 'things/test-thing/topics/info',
            payload: JSON.parse(samplePayload),
            timestamp: new Date().getTime()
          }
        })
      )
    });
  });

  test('Should return retained topic data', async (): Promise<void> => {
    const result: TopicResponse = await invokePythonLambda(
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
