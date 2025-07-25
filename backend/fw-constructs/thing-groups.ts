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
import * as Lambda from 'aws-cdk-lib/aws-lambda';
import * as AppSync from 'aws-cdk-lib/aws-appsync';
import * as path from 'path';
import * as IAM from 'aws-cdk-lib/aws-iam';
import { defaultAppSyncResponseMapping, type FWConstructProps } from './types';
import * as cdk from 'aws-cdk-lib';

export default class ThingGroupsConstruct extends Construct {
  constructor(scope: Construct, id: string, props: FWConstructProps) {
    super(scope, id);
    const api: AppSync.GraphqlApi = props.api;

    const listThingGroupRole: IAM.Role = new IAM.Role(
      this,
      'ListThingGroupRole',
      {
        assumedBy: new IAM.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          IAM.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          )
        ]
      }
    );
    listThingGroupRole.addToPolicy(
      new IAM.PolicyStatement({
        actions: [
          'iot:ListThingGroupsForThing',
          'iot:ListThingsInThingGroup',
          'iot:DescribeThingGroup'
        ],
        resources: [
          `arn:aws:iot:${props.region}:${props.accountId}:thinggroup/*`,
          `arn:aws:iot:${props.region}:${props.accountId}:thing/*`
        ]
      })
    );

    // Add ListThingGroups permission on all resources
    listThingGroupRole.addToPolicy(
      new IAM.PolicyStatement({
        actions: ['iot:ListThingGroups'],
        resources: ['*']
      })
    );

    // Separate policy for SearchIndex which requires specific index ARN
    listThingGroupRole.addToPolicy(
      new IAM.PolicyStatement({
        actions: ['iot:SearchIndex'],
        resources: [
          `arn:aws:iot:${props.region}:${props.accountId}:index/AWS_Things`
        ]
      })
    );

    // Create the Python Lambda function for get-thing-group-list
    const listThingGroupsLambda: Lambda.Function = new Lambda.Function(
      this,
      'listThingGroupsLambda',
      {
        runtime: Lambda.Runtime.PYTHON_3_12,
        code: Lambda.Code.fromAsset(
          path.join(
            import.meta.dirname,
            '../appsync/lambda-functions/python/get_thing_group_list'
          )
        ),
        handler: 'handler.lambda_handler',
        layers: props.pythonLayer ? [props.pythonLayer] : [],
        role: listThingGroupRole,
        timeout: cdk.Duration.seconds(30),
        environment: {
          PYTHONPATH: '/var/task:/opt/python'
        }
      }
    );

    const listThingGroupsSource: AppSync.LambdaDataSource =
      api.addLambdaDataSource('ListThingGroupsSource', listThingGroupsLambda);
    listThingGroupsSource.createResolver('ListThingGroupsResolver', {
      typeName: 'Query',
      fieldName: 'listThingGroups',
      responseMappingTemplate: AppSync.MappingTemplate.fromString(
        defaultAppSyncResponseMapping
      )
    });
  }
}
