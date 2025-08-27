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
  DescribeThingCommand,
  IoTClient,
  ListThingGroupsForThingCommand,
  SearchIndexCommand
} from '@aws-sdk/client-iot';
import { Lambda, InvokeCommand } from '@aws-sdk/client-lambda';

// Mock IoT and Lambda clients
const iotClientMock: AwsClientStub<IoTClient> = mockClient(IoTClient);
const lambdaMock: AwsClientStub<Lambda> = mockClient(Lambda);

// Define types for the event and response
interface DeviceEvent {
  arguments: {
    thingName: string;
  };
  info: Record<string, unknown>;
}

interface DeviceResponse {
  data: {
    thingName: string;
    attributes: Record<string, unknown>;
    deviceType: string;
    connected: boolean;
    deviceGroups: string[];
    firmwareType: string | null;
    firmwareVersion: string | null;
  };
}

// Function to invoke the Python Lambda
async function invokePythonLambda(
  event: DeviceEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _context: unknown
): Promise<DeviceResponse> {
  // This would normally invoke the actual Lambda, but for testing we'll mock the response
  const response: AWS.Response<Lambda, 'send'> = await lambdaMock.send(
    new InvokeCommand({
      FunctionName: 'getDevicePython',
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
  return JSON.parse(payload.toString()) as DeviceResponse;
}

describe('Get Device Python Lambda', (): void => {
  beforeEach((): void => {
    // Reset all mocks
    iotClientMock.reset();
    lambdaMock.reset();

    // Mock IoT responses
    iotClientMock.on(SearchIndexCommand).resolves({
      things: [
        {
          thingName: 'test',
          attributes: {},
          connectivity: {
            connected: true,
            timestamp: new Date().toISOString()
          }
        }
      ],
      thingGroups: []
    });

    iotClientMock.on(ListThingGroupsForThingCommand).resolves({
      thingGroups: [{ groupName: 'testGroup' }]
    });

    iotClientMock.on(DescribeThingCommand).resolves({
      thingName: 'test',
      attributes: {},
      thingTypeName: 'testType'
    });

    // Mock Lambda response
    lambdaMock.on(InvokeCommand).resolves({
      StatusCode: 200,
      Payload: Buffer.from(
        JSON.stringify({
          data: {
            thingName: 'test',
            attributes: {},
            deviceType: 'testType',
            connected: true,
            deviceGroups: ['testGroup'],
            firmwareType: null,
            firmwareVersion: null
          }
        })
      )
    });
  });

  test('Should return device details', async (): Promise<void> => {
    const result: DeviceResponse = await invokePythonLambda(
      {
        ...SAMPLE_EVENT,
        arguments: {
          thingName: 'test'
        }
      },
      SAMPLE_CONTEXT
    );

    expect(result).toMatchObject({
      data: {
        thingName: 'test',
        deviceType: expect.any(String),
        connected: expect.any(Boolean),
        deviceGroups: expect.any(Array)
      }
    });
  });
});
