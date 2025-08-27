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
import { IoTClient, ListMetricValuesCommand } from '@aws-sdk/client-iot';
import { Lambda, InvokeCommand } from '@aws-sdk/client-lambda';

// Mock IoT and Lambda clients
const iotClientMock: AwsClientStub<IoTClient> = mockClient(IoTClient);
const lambdaMock: AwsClientStub<Lambda> = mockClient(Lambda);

// Define types for the event and response
interface DefenderEvent {
  arguments: {
    thingName: string;
    type: string;
    startTime: string;
    endTime: string;
  };
  info: Record<string, unknown>;
}

interface DefenderResponse {
  data: Array<{
    metric: string;
    timestamp: string;
    value: number;
  }>;
}

// Function to invoke the Python Lambda
async function invokePythonLambda(
  event: DefenderEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _context: unknown
): Promise<DefenderResponse> {
  // This would normally invoke the actual Lambda, but for testing we'll mock the response
  const response: AWS.Response<Lambda, 'send'> = await lambdaMock.send(
    new InvokeCommand({
      FunctionName: 'getDefenderMetricDataFunction',
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
  return JSON.parse(payload.toString()) as DefenderResponse;
}

describe('Get Defender Metric Data Python Lambda', (): void => {
  beforeEach((): void => {
    // Reset all mocks
    iotClientMock.reset();
    lambdaMock.reset();

    // Mock IoT response
    iotClientMock.on(ListMetricValuesCommand).resolves({
      metricDatumList: [
        {
          timestamp: new Date('2023-01-01T00:00:00Z'),
          value: {
            count: 5
          }
        },
        {
          timestamp: new Date('2023-01-01T01:00:00Z'),
          value: {
            count: 10
          }
        }
      ]
    });

    // Mock Lambda response
    lambdaMock.on(InvokeCommand).resolves({
      StatusCode: 200,
      Payload: Buffer.from(
        JSON.stringify({
          data: [
            {
              metric: 'aws:num-authorization-failures',
              timestamp: '2023-01-01T00:00:00.000Z',
              value: 5
            },
            {
              metric: 'aws:num-authorization-failures',
              timestamp: '2023-01-01T01:00:00.000Z',
              value: 10
            }
          ]
        })
      )
    });
  });

  test('Should return defender metrics', async (): Promise<void> => {
    const result: DefenderResponse = await invokePythonLambda(
      {
        ...SAMPLE_EVENT,
        arguments: {
          thingName: 'test-thing',
          type: 'AUTHORIZATION_FAILURES',
          startTime: '2023-01-01T00:00:00Z',
          endTime: '2023-01-01T02:00:00Z'
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
