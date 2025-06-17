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
import * as AppSync from 'aws-cdk-lib/aws-appsync';
import * as IAM from 'aws-cdk-lib/aws-iam';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Stack } from 'aws-cdk-lib/core';
import * as path from 'path';
import type * as Cognito from 'aws-cdk-lib/aws-cognito';

export class AppSyncApi extends Construct {
  public readonly api: AppSync.GraphqlApi;

  constructor(
    scope: Construct,
    id: string,
    userPool: Cognito.UserPool | undefined
  ) {
    super(scope, id);

    if (!userPool) {
      throw new Error('UserPool is required for AppSyncApi constructor');
    }

    this.api = new AppSync.GraphqlApi(this, 'DeviceAPI', {
      name: `${Stack.of(this).stackName}-things-api`,
      definition: AppSync.Definition.fromFile(
        path.join(
          import.meta.dirname,
          '../../shared/src/appsync/schema/schema.graphql'
        )
      ),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: AppSync.AuthorizationType.USER_POOL,
          userPoolConfig: {
            userPool: userPool,
            defaultAction: AppSync.UserPoolDefaultAction.ALLOW
          }
        },
        additionalAuthorizationModes: [
          {
            authorizationType: AppSync.AuthorizationType.IAM
          }
        ]
      },
      logConfig: {
        fieldLogLevel: AppSync.FieldLogLevel.ALL,
        retention: RetentionDays.SIX_MONTHS,
        excludeVerboseContent: false,
        role: new IAM.Role(this, 'AppSyncServiceRole', {
          assumedBy: new IAM.ServicePrincipal('appsync.amazonaws.com'),
          managedPolicies: [
            IAM.ManagedPolicy.fromAwsManagedPolicyName(
              'service-role/AWSAppSyncPushToCloudWatchLogs'
            )
          ]
        })
      }
    });
  }
}
