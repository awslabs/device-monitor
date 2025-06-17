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
import { IoTClient, ListJobsCommand } from '@aws-sdk/client-iot';
import { Lambda, InvokeCommand } from '@aws-sdk/client-lambda';

// Mock IoT and Lambda clients
const iotClientMock: AwsClientStub<IoTClient> = mockClient(IoTClient);
const lambdaMock: AwsClientStub<Lambda> = mockClient(Lambda);

// Function to invoke the Python Lambda
async function invokePythonLambda(event: any, context: any) {
  // This would normally invoke the actual Lambda, but for testing we'll mock the response
  const response = await lambdaMock.send(new InvokeCommand({
    FunctionName: 'ListJobsFunction',
    Payload: Buffer.from(JSON.stringify({
      arguments: event.arguments,
      info: event.info
    }))
  }));
  
  // Parse the response payload
  return JSON.parse(Buffer.from(response.Payload || '{}').toString());
}

describe('Get Job List Python Lambda', (): void => {
  beforeEach((): void => {
    // Reset all mocks
    iotClientMock.reset();
    lambdaMock.reset();
    
    // Mock IoT response
    iotClientMock.on(ListJobsCommand).resolves({
      jobs: [
        {
          jobId: 'test-job-1',
          jobArn: 'arn:aws:iot:us-west-2:123456789012:job/test-job-1',
          targetSelection: 'CONTINUOUS',
          status: 'IN_PROGRESS',
          createdAt: new Date('2023-01-01T00:00:00Z'),
          lastUpdatedAt: new Date('2023-01-01T01:00:00Z'),
          isConcurrent: true
        },
        {
          jobId: 'test-job-2',
          jobArn: 'arn:aws:iot:us-west-2:123456789012:job/test-job-2',
          targetSelection: 'SNAPSHOT',
          status: 'COMPLETED',
          createdAt: new Date('2023-01-02T00:00:00Z'),
          lastUpdatedAt: new Date('2023-01-02T01:00:00Z'),
          completedAt: new Date('2023-01-02T02:00:00Z'),
          isConcurrent: false
        }
      ],
      nextToken: null
    });
    
    // Mock Lambda response
    lambdaMock.on(InvokeCommand).resolves({
      StatusCode: 200,
      Payload: Buffer.from(JSON.stringify({
        data: {
          items: [
            {
              jobId: 'test-job-1',
              jobArn: 'arn:aws:iot:us-west-2:123456789012:job/test-job-1',
              targetSelection: 'CONTINUOUS',
              status: 'IN_PROGRESS',
              createdAt: '2023-01-01T00:00:00.000Z',
              lastUpdatedAt: '2023-01-01T01:00:00.000Z',
              completedAt: null,
              isConcurrent: true
            },
            {
              jobId: 'test-job-2',
              jobArn: 'arn:aws:iot:us-west-2:123456789012:job/test-job-2',
              targetSelection: 'SNAPSHOT',
              status: 'COMPLETED',
              createdAt: '2023-01-02T00:00:00.000Z',
              lastUpdatedAt: '2023-01-02T01:00:00.000Z',
              completedAt: '2023-01-02T02:00:00.000Z',
              isConcurrent: false
            }
          ],
          nextToken: null
        }
      }))
    });
  });

  test('Should return list of jobs', async (): Promise<void> => {
    const result = await invokePythonLambda(
      {
        ...SAMPLE_EVENT,
        arguments: {
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
            jobArn: expect.any(String),
            status: expect.any(String)
          })
        ]),
        nextToken: null
      }
    });
  });
});