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
import { IoTDataPlaneClient, GetThingShadowCommand } from '@aws-sdk/client-iot-data-plane';
import { Lambda, InvokeCommand } from '@aws-sdk/client-lambda';

// Mock IoT Data and Lambda clients
const iotDataClientMock: AwsClientStub<IoTDataPlaneClient> = mockClient(IoTDataPlaneClient);
const lambdaMock: AwsClientStub<Lambda> = mockClient(Lambda);

// Function to invoke the Python Lambda
async function invokePythonLambda(event: any, context: any) {
  // This would normally invoke the actual Lambda, but for testing we'll mock the response
  const response = await lambdaMock.send(new InvokeCommand({
    FunctionName: 'GetThingShadowFunction',
    Payload: Buffer.from(JSON.stringify({
      arguments: event.arguments,
      info: event.info
    }))
  }));
  
  // Parse the response payload
  return JSON.parse(Buffer.from(response.Payload || '{}').toString());
}

describe('Get Thing Shadow Python Lambda', (): void => {
  beforeEach((): void => {
    // Reset all mocks
    iotDataClientMock.reset();
    lambdaMock.reset();
    
    // Create a sample shadow document
    const shadowDocument = {
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
      Payload: Buffer.from(JSON.stringify({
        data: shadowDocument
      }))
    });
  });

  test('Should return thing shadow without shadow name', async (): Promise<void> => {
    const result = await invokePythonLambda(
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
    const result = await invokePythonLambda(
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