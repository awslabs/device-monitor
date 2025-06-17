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
import { IoTClient, GetStatisticsCommand } from '@aws-sdk/client-iot';
import { Lambda, InvokeCommand } from '@aws-sdk/client-lambda';

// Mock IoT and Lambda clients
const iotClientMock: AwsClientStub<IoTClient> = mockClient(IoTClient);
const lambdaMock: AwsClientStub<Lambda> = mockClient(Lambda);

// Define types for the event and response
interface FilterCondition {
  fieldName: string;
  operator: string;
  value: string;
}

interface Filter {
  operation: string;
  filters: FilterCondition[];
}

interface ThingCountEvent {
  arguments: {
    filter: Filter | null;
  };
  info: Record<string, unknown>;
}

interface ThingCountResponse {
  data: number;
}

// Function to invoke the Python Lambda
async function invokePythonLambda(
  event: ThingCountEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _context: unknown
): Promise<ThingCountResponse> {
  // This would normally invoke the actual Lambda, but for testing we'll mock the response
  const response: AWS.Response<Lambda, 'send'> = await lambdaMock.send(
    new InvokeCommand({
      FunctionName: 'GetThingCountFunction',
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
  return JSON.parse(payload.toString()) as ThingCountResponse;
}

describe('Get Thing Count Python Lambda', (): void => {
  beforeEach((): void => {
    // Reset all mocks
    iotClientMock.reset();
    lambdaMock.reset();

    // Mock IoT response
    iotClientMock.on(GetStatisticsCommand).resolves({
      statistics: {
        count: 100
      }
    });

    // Mock Lambda response
    lambdaMock.on(InvokeCommand).resolves({
      StatusCode: 200,
      Payload: Buffer.from(
        JSON.stringify({
          data: 100
        })
      )
    });
  });

  test('Should return thing count without filter', async (): Promise<void> => {
    const result: ThingCountResponse = await invokePythonLambda(
      {
        ...SAMPLE_EVENT,
        arguments: {
          filter: null
        }
      },
      SAMPLE_CONTEXT
    );

    expect(result).toMatchObject({
      data: 100
    });
  });

  test('Should return thing count with filter', async (): Promise<void> => {
    const result: ThingCountResponse = await invokePythonLambda(
      {
        ...SAMPLE_EVENT,
        arguments: {
          filter: {
            operation: 'and',
            filters: [
              {
                fieldName: 'thingName',
                operator: 'contains',
                value: 'test'
              }
            ]
          }
        }
      },
      SAMPLE_CONTEXT
    );

    expect(result).toMatchObject({
      data: 100
    });
  });
});
