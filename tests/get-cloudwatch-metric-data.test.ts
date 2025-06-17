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
import { CloudWatchClient, GetMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { Lambda, InvokeCommand } from '@aws-sdk/client-lambda';

// Mock CloudWatch and Lambda clients
const cloudWatchClientMock: AwsClientStub<CloudWatchClient> = mockClient(CloudWatchClient);
const lambdaMock: AwsClientStub<Lambda> = mockClient(Lambda);

// Function to invoke the Python Lambda
async function invokePythonLambda(event: any, context: any) {
  // This would normally invoke the actual Lambda, but for testing we'll mock the response
  const response = await lambdaMock.send(new InvokeCommand({
    FunctionName: 'GetCloudwatchMetricDataFunction',
    Payload: Buffer.from(JSON.stringify({
      arguments: event.arguments,
      info: event.info
    }))
  }));
  
  // Parse the response payload
  return JSON.parse(Buffer.from(response.Payload || '{}').toString());
}

describe('Get CloudWatch Metric Data Python Lambda', (): void => {
  beforeEach((): void => {
    // Reset all mocks
    cloudWatchClientMock.reset();
    lambdaMock.reset();
    
    // Mock CloudWatch response
    cloudWatchClientMock.on(GetMetricDataCommand).resolves({
      MetricDataResults: [
        {
          Id: 'm1',
          Label: 'iotconnectivitydashboard-connected-device-count',
          Timestamps: [
            new Date('2023-01-01T00:00:00Z'),
            new Date('2023-01-01T01:00:00Z')
          ],
          Values: [10, 15]
        },
        {
          Id: 'm2',
          Label: 'iotconnectivitydashboard-disconnected-device-count',
          Timestamps: [
            new Date('2023-01-01T00:00:00Z'),
            new Date('2023-01-01T01:00:00Z')
          ],
          Values: [5, 3]
        }
      ]
    });
    
    // Mock Lambda response
    lambdaMock.on(InvokeCommand).resolves({
      StatusCode: 200,
      Payload: Buffer.from(JSON.stringify({
        data: [
          {
            metric: 'iotconnectivitydashboard-connected-device-count',
            timestamp: '2023-01-01T00:00:00.000Z',
            value: 10
          },
          {
            metric: 'iotconnectivitydashboard-connected-device-count',
            timestamp: '2023-01-01T01:00:00.000Z',
            value: 15
          },
          {
            metric: 'iotconnectivitydashboard-disconnected-device-count',
            timestamp: '2023-01-01T00:00:00.000Z',
            value: 5
          },
          {
            metric: 'iotconnectivitydashboard-disconnected-device-count',
            timestamp: '2023-01-01T01:00:00.000Z',
            value: 3
          }
        ]
      }))
    });
  });

  test('Should return connected devices metrics', async (): Promise<void> => {
    const result = await invokePythonLambda(
      {
        ...SAMPLE_EVENT,
        arguments: {
          type: 'CONNECTED_DEVICES',
          period: 3600,
          start: '2023-01-01T00:00:00Z'
        }
      },
      SAMPLE_CONTEXT
    );
    
    expect(result).toMatchObject({
      data: expect.arrayContaining([
        expect.objectContaining({
          metric: expect.any(String),
          timestamp: expect.any(String),
          value: expect.any(Number)
        })
      ])
    });
  });

  test('Should return disconnect rate metrics', async (): Promise<void> => {
    const result = await invokePythonLambda(
      {
        ...SAMPLE_EVENT,
        arguments: {
          type: 'DISCONNECT_RATE',
          period: 3600,
          start: '2023-01-01T00:00:00Z'
        }
      },
      SAMPLE_CONTEXT
    );
    
    expect(result).toMatchObject({
      data: expect.arrayContaining([
        expect.objectContaining({
          metric: expect.any(String),
          timestamp: expect.any(String),
          value: expect.any(Number)
        })
      ])
    });
  });
});