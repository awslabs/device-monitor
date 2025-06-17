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

import { Construct } from 'constructs';
import { type StackProps } from 'aws-cdk-lib/core';
import type Cognito from 'aws-cdk-lib/aws-cognito';
import { AppSyncApi } from '../fw-constructs/appsync-api';
import { ThingShadowConstruct } from '../fw-constructs/thing-shadows';
import { UserPreferenceTable } from '../fw-constructs/user-preferences-table';
import { DefenderMetricsConstruct } from '../fw-constructs/defender-metrics';
import { DeviceStatsConstruct } from '../fw-constructs/device-stats';
import { RetainedTopicsConstruct } from '../fw-constructs/retained-topics';
import { ThingsDataConstruct } from '../fw-constructs/things';
import { CloudWatchMetricsConstruct } from '../fw-constructs/cw-metrics';
import { JobsConstruct } from '../fw-constructs/jobs';
import { DeviceConstruct } from '../fw-constructs/device';
import { UserPreferenceConstruct } from '../fw-constructs/user-preferences';
import ThingGroupsConstruct from '../fw-constructs/thing-groups';
import ThingCountConstruct from '../fw-constructs/thing-count';
import * as Lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import * as cdk from 'aws-cdk-lib';

export interface AppSyncBackendConstructProps extends StackProps {
  accountId: string;
  accountName: string;
  region: string;
  userPool: Cognito.UserPool;
}

export class AppSyncBackendConstruct extends Construct {
  public readonly graphqlUrl: string;

  constructor(
    parent: Construct,
    name: string,
    props: AppSyncBackendConstructProps
  ) {
    super(parent, name);

    // Create API
    const appSyncApi: AppSyncApi = new AppSyncApi(
      this,
      'AppSyncApi',
      props.userPool
    );
    this.graphqlUrl = appSyncApi.api.graphqlUrl;

    // Create a shared Python Lambda layer
    const pythonSharedLayer: Lambda.LayerVersion = new Lambda.LayerVersion(
      this,
      'PythonSharedLayer',
      {
        code: Lambda.Code.fromAsset(
          path.join(import.meta.dirname, '../appsync/lambda-layers/python'),
          {
            bundling: {
              image: cdk.DockerImage.fromRegistry(
                'public.ecr.aws/sam/build-python3.10:latest'
              ),
              command: [
                'bash',
                '-c',
                [
                  'mkdir -p /asset-output/python',
                  'pip install -r requirements.txt -t /asset-output/python',
                  'cp -r shared_lib /asset-output/python/'
                ].join(' && ')
              ]
            }
          }
        ),
        compatibleRuntimes: [Lambda.Runtime.PYTHON_3_10],
        description: 'Shared Python utilities for AppSync resolvers'
      }
    );

    // Create Tables
    const userPreferencesTable: UserPreferenceTable = new UserPreferenceTable(
      this,
      'UserPreferencesTable'
    );

    // Device Stats - now includes both table and monitor
    new DeviceStatsConstruct(this, 'DeviceStatsDS', {
      api: appSyncApi.api,
      region: props.region,
      accountId: props.accountId,
      pythonLayer: pythonSharedLayer
    });

    // RetainedTopics
    new RetainedTopicsConstruct(this, 'RetainedTopicsConstruct', {
      api: appSyncApi.api,
      region: props.region,
      accountId: props.accountId,
      userPool: props.userPool,
      pythonLayer: pythonSharedLayer
    });

    //device shadows
    new ThingShadowConstruct(this, 'ThingShadowConstruct', {
      api: appSyncApi.api,
      region: props.region,
      accountId: props.accountId,
      pythonLayer: pythonSharedLayer
    });

    // things
    new ThingsDataConstruct(this, 'ThingsDataConstruct', {
      api: appSyncApi.api,
      region: props.region,
      accountId: props.accountId,
      pythonLayer: pythonSharedLayer
    });

    // thing count
    new ThingCountConstruct(this, 'ThingCountConstruct', {
      api: appSyncApi.api,
      region: props.region,
      accountId: props.accountId,
      pythonLayer: pythonSharedLayer
    });

    // cloudwatch metrics
    new CloudWatchMetricsConstruct(this, 'CloudWatchMetricsConstruct', {
      api: appSyncApi.api,
      region: props.region,
      accountId: props.accountId,
      pythonLayer: pythonSharedLayer
    });

    // Jobs
    new JobsConstruct(this, 'JobsConstruct', {
      api: appSyncApi.api,
      region: props.region,
      accountId: props.accountId,
      pythonLayer: pythonSharedLayer
    });

    // Device - Using Python implementation
    new DeviceConstruct(this, 'DeviceConstruct', {
      api: appSyncApi.api,
      region: props.region,
      accountId: props.accountId,
      pythonLayer: pythonSharedLayer
    });

    // defender metrics
    new DefenderMetricsConstruct(this, 'DefenderMetricsConstruct', {
      api: appSyncApi.api,
      region: props.region,
      accountId: props.accountId,
      pythonLayer: pythonSharedLayer
    });

    // user preferences
    new UserPreferenceConstruct(
      this,
      'UserPreferencesDataSource',
      {
        api: appSyncApi.api,
        region: props.region,
        accountId: props.accountId,
        pythonLayer: pythonSharedLayer
      },
      userPreferencesTable.table
    );

    // thing groups
    new ThingGroupsConstruct(this, 'ThingGroupsConstruct', {
      api: appSyncApi.api,
      region: props.region,
      accountId: props.accountId,
      pythonLayer: pythonSharedLayer
    });
  }
}
