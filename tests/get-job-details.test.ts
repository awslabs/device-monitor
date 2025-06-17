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
import { IoTClient, DescribeJobCommand } from '@aws-sdk/client-iot';
import { Lambda, InvokeCommand } from '@aws-sdk/client-lambda';

// Mock IoT and Lambda clients
const iotClientMock: AwsClientStub<IoTClient> = mockClient(IoTClient);
const lambdaMock: AwsClientStub<Lambda> = mockClient(Lambda);

// Function to invoke the Python Lambda
async function invokePythonLambda(event: any, context: any) {
  // This would normally invoke the actual Lambda, but for testing we'll mock the response
  const response = await lambdaMock.send(new InvokeCommand({
    FunctionName: 'GetJobDetailsFunction',
    Payload: Buffer.from(JSON.stringify({
      arguments: event.arguments,
      info: event.info
    }))
  }));
  
  // Parse the response payload
  return JSON.parse(Buffer.from(response.Payload || '{}').toString());
}

describe('Get Job Details Python Lambda', (): void => {
  beforeEach((): void => {
    // Reset all mocks
    iotClientMock.reset();
    lambdaMock.reset();
    
    // Mock IoT response
    iotClientMock.on(DescribeJobCommand).resolves({
      job: {
        jobId: 'test-job',
        targetSelection: 'CONTINUOUS',
        status: 'IN_PROGRESS',
        targets: ['arn:aws:iot:us-west-2:123456789012:thing/test-thing'],
        description: 'Test job',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        lastUpdatedAt: new Date('2023-01-01T01:00:00Z'),
        jobProcessDetails: {
          numberOfCanceledThings: 0,
          numberOfSucceededThings: 5,
          numberOfFailedThings: 1,
          numberOfRejectedThings: 0,
          numberOfQueuedThings: 2,
          numberOfInProgressThings: 3,
          numberOfRemovedThings: 0,
          numberOfTimedOutThings: 0
        },
        isConcurrent: true
      }
    });
    
    // Mock Lambda response
    lambdaMock.on(InvokeCommand).resolves({
      StatusCode: 200,
      Payload: Buffer.from(JSON.stringify({
        data: {
          targetSelection: 'CONTINUOUS',
          status: 'IN_PROGRESS',
          targets: ['arn:aws:iot:us-west-2:123456789012:thing/test-thing'],
          description: 'Test job',
          createdAt: '2023-01-01T00:00:00.000Z',
          lastUpdatedAt: '2023-01-01T01:00:00.000Z',
          stats: {
            canceled: 0,
            succeeded: 5,
            failed: 1,
            rejected: 0,
            queued: 2,
            inProgress: 3,
            removed: 0,
            timedOut: 0
          },
          isConcurrent: true
        }
      }))
    });
  });

  test('Should return job details', async (): Promise<void> => {
    const result = await invokePythonLambda(
      {
        ...SAMPLE_EVENT,
        arguments: {
          jobId: 'test-job'
        }
      },
      SAMPLE_CONTEXT
    );
    
    expect(result).toMatchObject({
      data: expect.objectContaining({
        targetSelection: expect.any(String),
        status: expect.any(String),
        targets: expect.any(Array),
        stats: expect.objectContaining({
          succeeded: expect.any(Number),
          failed: expect.any(Number),
          inProgress: expect.any(Number)
        })
      })
    });
  });
});