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

import * as path from 'path';
import * as IAM from 'aws-cdk-lib/aws-iam';
import { Duration } from 'aws-cdk-lib/core';
import { defaultAppSyncResponseMapping, type FWConstructProps } from './types';
import { Construct } from 'constructs';
import * as Lambda from 'aws-cdk-lib/aws-lambda';
import * as AppSync from 'aws-cdk-lib/aws-appsync';

export class DefenderMetricsConstruct extends Construct {
  constructor(scope: Construct, id: string, props: FWConstructProps) {
    super(scope, id);
    const api: AppSync.GraphqlApi = props.api;

    // Create IAM role for Lambda execution
    const getDefenderMetricDataRole: IAM.Role = new IAM.Role(
      this,
      'DeviceDetailsLambdaRole',
      {
        assumedBy: new IAM.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          IAM.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          )
        ]
      }
    );

    // Add IoT permissions
    getDefenderMetricDataRole.addToPolicy(
      new IAM.PolicyStatement({
        effect: IAM.Effect.ALLOW,
        actions: ['iot:ListMetricValues'],
        resources: [`arn:aws:iot:${props.region}:${props.accountId}:thing/*`]
      })
    );

    // Create the Python Lambda function
    const getDefenderMetricDataFunction: Lambda.Function = new Lambda.Function(
      this,
      'getDefenderMetricDataFunction',
      {
        runtime: Lambda.Runtime.PYTHON_3_10,
        code: Lambda.Code.fromAsset(
          path.join(
            import.meta.dirname,
            '../appsync/lambda-functions/python/get_defender_metric_data'
          )
        ),
        handler: 'handler.lambda_handler',
        layers: props.pythonLayer ? [props.pythonLayer] : [],
        role: getDefenderMetricDataRole,
        timeout: Duration.seconds(30),
        environment: {
          PYTHONPATH: '/var/task:/opt/python'
        }
      }
    );

    // Create the AppSync data source
    const getDefenderMetricDataDataSource: AppSync.LambdaDataSource =
      api.addLambdaDataSource(
        'GetDefenderMetricDataDataSource',
        getDefenderMetricDataFunction
      );

    // Create the resolver
    getDefenderMetricDataDataSource.createResolver(
      'GetDefenderMetricDataResolver',
      {
        typeName: 'Query',
        fieldName: 'getDefenderMetricData',
        responseMappingTemplate: AppSync.MappingTemplate.fromString(
          defaultAppSyncResponseMapping
        )
      }
    );
  }
}
