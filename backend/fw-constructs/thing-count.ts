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

export default class ThingCountConstruct extends Construct {
  constructor(scope: Construct, id: string, props: FWConstructProps) {
    super(scope, id);
    const api: AppSync.GraphqlApi = props.api;

    // Add the resolver for getThingCount
    const getThingCountLambdaRole: IAM.Role = new IAM.Role(
      this,
      'GetThingCountLambdaRole',
      {
        assumedBy: new IAM.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          IAM.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          )
        ]
      }
    );
    getThingCountLambdaRole.addToPolicy(
      new IAM.PolicyStatement({
        actions: ['iot:GetStatistics'],
        resources: [
          `arn:aws:iot:${props.region}:${props.accountId}:index/AWS_Things`
        ]
      })
    );
    
    // Create the Python Lambda function for get-thing-count
    const getThingCountFunction: Lambda.Function = new Lambda.Function(
      this,
      'GetThingCountFunction',
      {
        runtime: Lambda.Runtime.PYTHON_3_10,
        code: Lambda.Code.fromAsset(
          path.join(
            import.meta.dirname,
            '../appsync/lambda-functions/python/get_thing_count'
          )
        ),
        handler: 'handler.lambda_handler',
        layers: props.pythonLayer ? [props.pythonLayer] : [],
        role: getThingCountLambdaRole,
        environment: {
          PYTHONPATH: '/var/task:/opt/python'
        }
      }
    );
    
    // We're using a unique name for the data source to avoid conflicts
    const getThingCountDataSource: AppSync.LambdaDataSource =
      api.addLambdaDataSource('ThingCountDataSource', getThingCountFunction);
    getThingCountDataSource.createResolver('GetThingCount', {
      typeName: 'Query',
      fieldName: 'getThingCount',
      responseMappingTemplate: AppSync.MappingTemplate.fromString(
        defaultAppSyncResponseMapping
      )
    });
  }
}