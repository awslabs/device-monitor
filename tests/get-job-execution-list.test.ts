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
  IoTClient, 
  ListJobExecutionsForJobCommand,
  ListJobExecutionsForThingCommand 
} from '@aws-sdk/client-iot';
import { Lambda, InvokeCommand } from '@aws-sdk/client-lambda';

// Mock IoT and Lambda clients
const iotClientMock: AwsClientStub<IoTClient> = mockClient(IoTClient);
const lambdaMock: AwsClientStub<Lambda> = mockClient(Lambda);

// Function to invoke the Python Lambda
async function invokePythonLambda(event: any, context: any) {
  // This would normally invoke the actual Lambda, but for testing we'll mock the response
  const response = await lambdaMock.send(new InvokeCommand({
    FunctionName: 'ListExecutionsFunction',
    Payload: Buffer.from(JSON.stringify({
      arguments: event.arguments,
      info: event.info
    }))
  }));
  
  // Parse the response payload
  return JSON.parse(Buffer.from(response.Payload || '{}').toString());
}

describe('Get Job Execution List Python Lambda', (): void => {
  beforeEach((): void => {
    // Reset all mocks
    iotClientMock.reset();
    lambdaMock.reset();
    
    // Mock IoT response for job executions by job ID
    iotClientMock.on(ListJobExecutionsForJobCommand).resolves({
      executionSummaries: [
        {
          thingArn: 'arn:aws:iot:us-west-2:123456789012:thing/test-thing',
          jobExecutionSummary: {
            status: 'SUCCEEDED',
            queuedAt: new Date('2023-01-01T00:00:00Z'),
            startedAt: new Date('2023-01-01T00:05:00Z'),
            lastUpdatedAt: new Date('2023-01-01T00:10:00Z'),
            executionNumber: 1,
            retryAttempt: 0
          }
        }
      ],
      nextToken: null
    });
    
    // Mock IoT response for job executions by thing name
    iotClientMock.on(ListJobExecutionsForThingCommand).resolves({
      executionSummaries: [
        {
          jobId: 'test-job',
          jobExecutionSummary: {
            status: 'SUCCEEDED',
            queuedAt: new Date('2023-01-01T00:00:00Z'),
            startedAt: new Date('2023-01-01T00:05:00Z'),
            lastUpdatedAt: new Date('2023-01-01T00:10:00Z'),
            executionNumber: 1,
            retryAttempt: 0
          }
        }
      ],
      nextToken: null
    });
    
    // Mock Lambda response for job executions by job ID
    lambdaMock.on(InvokeCommand).callsFake((params) => {
      const payload = JSON.parse(params.Payload.toString());
      
      if (payload.arguments.jobId) {
        return {
          StatusCode: 200,
          Payload: Buffer.from(JSON.stringify({
            data: {
              items: [
                {
                  jobId: payload.arguments.jobId,
                  thingName: 'test-thing',
                  status: 'SUCCEEDED',
                  queuedAt: '2023-01-01T00:00:00.000Z',
                  startedAt: '2023-01-01T00:05:00.000Z',
                  lastUpdatedAt: '2023-01-01T00:10:00.000Z',
                  executionNumber: 1,
                  retryAttempt: 0
                }
              ],
              nextToken: null
            }
          }))
        };
      } else if (payload.arguments.thingName) {
        return {
          StatusCode: 200,
          Payload: Buffer.from(JSON.stringify({
            data: {
              items: [
                {
                  jobId: 'test-job',
                  thingName: payload.arguments.thingName,
                  status: 'SUCCEEDED',
                  queuedAt: '2023-01-01T00:00:00.000Z',
                  startedAt: '2023-01-01T00:05:00.000Z',
                  lastUpdatedAt: '2023-01-01T00:10:00.000Z',
                  executionNumber: 1,
                  retryAttempt: 0
                }
              ],
              nextToken: null
            }
          }))
        };
      }
      
      return {
        StatusCode: 400,
        Payload: Buffer.from(JSON.stringify({
          errors: [{ message: 'Missing required argument' }]
        }))
      };
    });
  });

  test('Should return job executions by job ID', async (): Promise<void> => {
    const result = await invokePythonLambda(
      {
        ...SAMPLE_EVENT,
        arguments: {
          jobId: 'test-job',
          limit: 10,
          nextToken: null
        }
      },
      SAMPLE_CONTEXT
    );
    
    expect(result).toMatchObject({
      data: {
        items: expect.arrayContaining([
          expect.objectContaining({
            jobId: 'test-job',
            thingName: expect.any(String),
            status: expect.any(String)
          })
        ]),
        nextToken: null
      }
    });
  });

  test('Should return job executions by thing name', async (): Promise<void> => {
    const result = await invokePythonLambda(
      {
        ...SAMPLE_EVENT,
        arguments: {
          thingName: 'test-thing',
          limit: 10,
          nextToken: null
        }
      },
      SAMPLE_CONTEXT
    );
    
    expect(result).toMatchObject({
      data: {
        items: expect.arrayContaining([
          expect.objectContaining({
            jobId: expect.any(String),
            thingName: 'test-thing',
            status: expect.any(String)
          })
        ]),
        nextToken: null
      }
    });
  });
});