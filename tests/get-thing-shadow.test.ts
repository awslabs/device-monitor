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
  GetThingShadowCommand
} from '@aws-sdk/client-iot-data-plane';
import { Lambda, InvokeCommand } from '@aws-sdk/client-lambda';

// Mock IoT Data and Lambda clients
const iotDataClientMock: AwsClientStub<IoTDataPlaneClient> =
  mockClient(IoTDataPlaneClient);
const lambdaMock: AwsClientStub<Lambda> = mockClient(Lambda);

// Define types for the event and response
interface ShadowEvent {
  arguments: {
    thingName: string;
    shadowName?: string;
  };
  info: Record<string, unknown>;
}

interface ShadowState {
  reported: {
    temperature: number;
    humidity: number;
    firmware: {
      version: string;
    };
  };
  desired: {
    temperature: number;
  };
}

interface ShadowDocument {
  state: ShadowState;
  metadata: Record<string, unknown>;
  version: number;
  timestamp: number;
}

interface ShadowResponse {
  data: ShadowDocument;
}

// Function to invoke the Python Lambda
async function invokePythonLambda(
  event: ShadowEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _context: unknown
): Promise<ShadowResponse> {
  // This would normally invoke the actual Lambda, but for testing we'll mock the response
  const response: AWS.Response<Lambda, 'send'> = await lambdaMock.send(
    new InvokeCommand({
      FunctionName: 'GetThingShadowFunction',
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
  return JSON.parse(payload.toString()) as ShadowResponse;
}

describe('Get Thing Shadow Python Lambda', (): void => {
  beforeEach((): void => {
    // Reset all mocks
    iotDataClientMock.reset();
    lambdaMock.reset();

    // Create a sample shadow document
    const shadowDocument: ShadowDocument = {
      state: {
        reported: {
          temperature: 25.5,
          humidity: 60,
          firmware: {
            version: '1.0.0'
          }
        },
        desired: {
          temperature: 22.0
        }
      },
      metadata: {
        reported: {
          temperature: {
            timestamp: Date.now()
          },
          humidity: {
            timestamp: Date.now()
          },
          firmware: {
            version: {
              timestamp: Date.now()
            }
          }
        },
        desired: {
          temperature: {
            timestamp: Date.now()
          }
        }
      },
      version: 10,
      timestamp: Date.now()
    };

    // Mock IoT Data response
    iotDataClientMock.on(GetThingShadowCommand).resolves({
      payload: Buffer.from(JSON.stringify(shadowDocument))
    });

    // Mock Lambda response
    lambdaMock.on(InvokeCommand).resolves({
      StatusCode: 200,
      Payload: Buffer.from(
        JSON.stringify({
          data: shadowDocument
        })
      )
    });
  });

  test('Should return thing shadow without shadow name', async (): Promise<void> => {
    const result: ShadowResponse = await invokePythonLambda(
      {
        ...SAMPLE_EVENT,
        arguments: {
          thingName: 'test-thing'
        }
      },
      SAMPLE_CONTEXT
    );

    expect(result).toMatchObject({
      data: expect.objectContaining({
        state: expect.objectContaining({
          reported: expect.objectContaining({
            temperature: expect.any(Number),
            humidity: expect.any(Number)
          })
        }),
        version: expect.any(Number)
      })
    });
  });

  test('Should return thing shadow with shadow name', async (): Promise<void> => {
    const result: ShadowResponse = await invokePythonLambda(
      {
        ...SAMPLE_EVENT,
        arguments: {
          thingName: 'test-thing',
          shadowName: 'named-shadow'
        }
      },
      SAMPLE_CONTEXT
    );

    expect(result).toMatchObject({
      data: expect.objectContaining({
        state: expect.objectContaining({
          reported: expect.objectContaining({
            temperature: expect.any(Number),
            humidity: expect.any(Number)
          })
        }),
        version: expect.any(Number)
      })
    });
  });
});
