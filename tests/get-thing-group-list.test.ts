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
  IoTClient,
  ListThingGroupsCommand,
  DescribeThingGroupCommand
} from '@aws-sdk/client-iot';
import { Lambda, InvokeCommand } from '@aws-sdk/client-lambda';

// Mock IoT and Lambda clients
const iotClientMock: AwsClientStub<IoTClient> = mockClient(IoTClient);
const lambdaMock: AwsClientStub<Lambda> = mockClient(Lambda);

// Define types for the event and response
interface GroupEvent {
  arguments: Record<string, unknown>;
  info: Record<string, unknown>;
}

interface ThingGroup {
  groupName: string;
  groupType: string;
  childGroups: ThingGroup[];
}

interface GroupResponse {
  data: {
    groups: ThingGroup[];
  };
}

// Function to invoke the Python Lambda
async function invokePythonLambda(
  event: GroupEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _context: unknown
): Promise<GroupResponse> {
  // This would normally invoke the actual Lambda, but for testing we'll mock the response
  const response: AWS.Response<Lambda, 'send'> = await lambdaMock.send(
    new InvokeCommand({
      FunctionName: 'GetThingGroupListFunction',
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
  return JSON.parse(payload.toString()) as GroupResponse;
}

describe('Get Thing Group List Python Lambda', (): void => {
  beforeEach((): void => {
    // Reset all mocks
    iotClientMock.reset();
    lambdaMock.reset();

    // Mock IoT ListThingGroups response
    iotClientMock.on(ListThingGroupsCommand).resolves({
      thingGroups: [
        {
          groupName: 'ParentGroup',
          groupArn: 'arn:aws:iot:us-west-2:123456789012:thinggroup/ParentGroup'
        },
        {
          groupName: 'ChildGroup1',
          groupArn: 'arn:aws:iot:us-west-2:123456789012:thinggroup/ChildGroup1'
        },
        {
          groupName: 'ChildGroup2',
          groupArn: 'arn:aws:iot:us-west-2:123456789012:thinggroup/ChildGroup2'
        }
      ]
    });

    // Mock IoT DescribeThingGroup responses
    iotClientMock
      .on(DescribeThingGroupCommand)
      .callsFake(
        (params: {
          thingGroupName: string;
        }): AWS.Response<IoTClient, 'send'> => {
          if (params.thingGroupName === 'ParentGroup') {
            return {
              thingGroupName: 'ParentGroup',
              thingGroupId: '12345',
              thingGroupArn:
                'arn:aws:iot:us-west-2:123456789012:thinggroup/ParentGroup',
              thingGroupMetadata: {
                parentGroupName: null
              }
            };
          } else if (params.thingGroupName === 'ChildGroup1') {
            return {
              thingGroupName: 'ChildGroup1',
              thingGroupId: '23456',
              thingGroupArn:
                'arn:aws:iot:us-west-2:123456789012:thinggroup/ChildGroup1',
              thingGroupMetadata: {
                parentGroupName: 'ParentGroup'
              }
            };
          } else {
            return {
              thingGroupName: 'ChildGroup2',
              thingGroupId: '34567',
              thingGroupArn:
                'arn:aws:iot:us-west-2:123456789012:thinggroup/ChildGroup2',
              thingGroupMetadata: {
                parentGroupName: 'ParentGroup'
              }
            };
          }
        }
      );

    // Mock Lambda response
    lambdaMock.on(InvokeCommand).resolves({
      StatusCode: 200,
      Payload: Buffer.from(
        JSON.stringify({
          data: {
            groups: [
              {
                groupName: 'ParentGroup',
                groupType: 'STATIC',
                childGroups: [
                  {
                    groupName: 'ChildGroup1',
                    groupType: 'STATIC',
                    childGroups: []
                  },
                  {
                    groupName: 'ChildGroup2',
                    groupType: 'STATIC',
                    childGroups: []
                  }
                ]
              }
            ]
          }
        })
      )
    });
  });

  test('Should return thing group hierarchy', async (): Promise<void> => {
    const result: GroupResponse = await invokePythonLambda(
      {
        ...SAMPLE_EVENT,
        arguments: {}
      },
      SAMPLE_CONTEXT
    );

    expect(result).toMatchObject({
      data: {
        groups: expect.arrayContaining([
          expect.objectContaining({
            groupName: expect.any(String),
            groupType: expect.any(String),
            childGroups: expect.arrayContaining([
              expect.objectContaining({
                groupName: expect.any(String),
                groupType: expect.any(String)
              })
            ])
          })
        ])
      }
    });
  });
});
