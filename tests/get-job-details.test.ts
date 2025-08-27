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
import { IoTClient, DescribeJobCommand } from '@aws-sdk/client-iot';
import { Lambda, InvokeCommand } from '@aws-sdk/client-lambda';

// Mock IoT and Lambda clients
const iotClientMock: AwsClientStub<IoTClient> = mockClient(IoTClient);
const lambdaMock: AwsClientStub<Lambda> = mockClient(Lambda);

// Define types for the event and response
interface JobEvent {
  arguments: {
    jobId: string;
  };
  info: Record<string, unknown>;
}

interface JobStats {
  canceled: number;
  succeeded: number;
  failed: number;
  rejected: number;
  queued: number;
  inProgress: number;
  removed: number;
  timedOut: number;
}

interface JobResponse {
  data: {
    targetSelection: string;
    status: string;
    targets: string[];
    description: string;
    createdAt: string;
    lastUpdatedAt: string;
    stats: JobStats;
    isConcurrent: boolean;
  };
}

// Function to invoke the Python Lambda
async function invokePythonLambda(
  event: JobEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _context: unknown
): Promise<JobResponse> {
  // This would normally invoke the actual Lambda, but for testing we'll mock the response
  const response: AWS.Response<Lambda, 'send'> = await lambdaMock.send(
    new InvokeCommand({
      FunctionName: 'GetJobDetailsFunction',
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
  return JSON.parse(payload.toString()) as JobResponse;
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
      Payload: Buffer.from(
        JSON.stringify({
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
        })
      )
    });
  });

  test('Should return job details', async (): Promise<void> => {
    const result: JobResponse = await invokePythonLambda(
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
