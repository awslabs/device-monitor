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
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import { Duration } from 'aws-cdk-lib';

export interface DefenderMetricsConstructProps {
  api: appsync.GraphqlApi;
  region: string;
  accountId: string;
  pythonLayer: lambda.LayerVersion;
}

export class DefenderMetricsConstruct extends Construct {
  constructor(scope: Construct, id: string, props: DefenderMetricsConstructProps) {
    super(scope, id);

    // Create Lambda role for Defender metrics
    const defenderLambdaRole = new iam.Role(this, 'DeviceDetailsLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ]
    });

    // Add permissions for IoT Device Defender
    defenderLambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'iot:GetBehaviorModelTrainingSummaries',
          'iot:ListActiveViolations',
          'iot:ListDetectMitigationActionsExecutions',
          'iot:ListDetectMitigationActionsTasks',
          'iot:ListSecurityProfiles',
          'iot:ListSecurityProfilesForTarget',
          'iot:ListTargetsForSecurityProfile',
          'iot:ListViolationEvents',
          'iot:DescribeSecurityProfile',
          'iot:GetStatistics',
          'iot:ListMetricValues'
        ],
        resources: ['*']
      })
    );

    // Create Lambda function for getting Defender metric data
    const getDefenderMetricDataFunction = new lambda.Function(this, 'getDefenderMetricDataFunction', {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'handler.lambda_handler',
      code: lambda.Code.fromAsset(
        path.join(import.meta.dirname, '../appsync/lambda-functions/python/get_defender_metric_data')
      ),
      layers: [props.pythonLayer],
      role: defenderLambdaRole,
      timeout: Duration.seconds(30),
      environment: {
        REGION: props.region
      }
    });

    // Create AppSync data source
    const getDefenderMetricDataDataSource = props.api.addLambdaDataSource(
      'GetDefenderMetricDataDataSource',
      getDefenderMetricDataFunction
    );

    // Create resolver for getDefenderMetricData
    getDefenderMetricDataDataSource.createResolver('GetDefenderMetricDataResolver', {
      typeName: 'Query',
      fieldName: 'getDefenderMetricData'
    });
  }
}