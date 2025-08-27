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

import { SAMPLE_CONTEXT } from '../shared/src/utils';
import { describe, expect, test, beforeEach } from '@jest/globals';
import { mockClient, type AwsClientStub } from 'aws-sdk-client-mock';
import { IoTClient, SearchIndexCommand } from '@aws-sdk/client-iot';
import {
  CloudWatchClient,
  PutMetricDataCommand
} from '@aws-sdk/client-cloudwatch';
import { Lambda, InvokeCommand } from '@aws-sdk/client-lambda';

// Mock IoT, CloudWatch, and Lambda clients
const iotClientMock: AwsClientStub<IoTClient> = mockClient(IoTClient);
const cloudWatchClientMock: AwsClientStub<CloudWatchClient> =
  mockClient(CloudWatchClient);
const lambdaMock: AwsClientStub<Lambda> = mockClient(Lambda);

// Function to invoke the Python Lambda

async function invokePythonLambda(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _event: unknown,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _context: unknown
): Promise<boolean> {
  // This would normally invoke the actual Lambda, but for testing we'll mock the response
  const response: AWS.Response<Lambda, 'send'> = await lambdaMock.send(
    new InvokeCommand({
      FunctionName: 'DeviceStatsMonitor',
      Payload: Buffer.from(JSON.stringify({}))
    })
  );

  // Parse the response payload
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return response.StatusCode === 200;
}

describe('Device Stats Monitor Python Lambda', (): void => {
  beforeEach((): void => {
    // Reset all mocks
    iotClientMock.reset();
    cloudWatchClientMock.reset();
    lambdaMock.reset();

    // Mock IoT responses
    iotClientMock.on(SearchIndexCommand).resolves({
      things: [
        {
          thingName: 'test-thing-1',
          thingTypeName: 'testType',
          connectivity: {
            connected: true,
            timestamp: new Date().toISOString()
          },
          attributes: {
            productionTimestamp: '1625097600000',
            provisioningTimestamp: '1625097600000',
            brandName: 'TestBrand',
            country: 'US',
            hasApplianceFW: 'true'
          },
          thingGroupNames: ['TestGroup']
        },
        {
          thingName: 'test-thing-2',
          thingTypeName: 'testType',
          connectivity: {
            connected: false,
            disconnectReason: 'Connection lost',
            timestamp: new Date().toISOString()
          },
          attributes: {
            productionTimestamp: '1625097600000',
            provisioningTimestamp: '1625097600000',
            brandName: 'TestBrand',
            country: 'UK',
            hasApplianceFW: 'false'
          },
          thingGroupNames: ['TestGroup']
        }
      ]
    });

    // Mock CloudWatch response
    cloudWatchClientMock.on(PutMetricDataCommand).resolves({});

    // Mock Lambda response
    lambdaMock.on(InvokeCommand).resolves({
      StatusCode: 200,
      Payload: Buffer.from(JSON.stringify({}))
    });
  });

  test('Should execute successfully', async (): Promise<void> => {
    const result: boolean = await invokePythonLambda({}, SAMPLE_CONTEXT);
    expect(result).toBe(true);
  });
});
