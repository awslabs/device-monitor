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

import { Construct } from 'constructs';
import * as Lambda from 'aws-cdk-lib/aws-lambda';
import * as AppSync from 'aws-cdk-lib/aws-appsync';
import * as IAM from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import { defaultAppSyncResponseMapping, type FWConstructProps } from './types';

// Import the Duration from core for timeouts
import * as cdk from 'aws-cdk-lib';

export class DeviceConstruct extends Construct {
  constructor(scope: Construct, id: string, props: FWConstructProps) {
    super(scope, id);
    const api: AppSync.GraphqlApi = props.api;

    // Create IAM role for Lambda execution
    const getDeviceLambdaRole: IAM.Role = new IAM.Role(
      this,
      'getDeviceLambdaRole',
      {
        assumedBy: new IAM.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          IAM.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          )
        ]
      }
    );

    // Add necessary permissions
    getDeviceLambdaRole.addToPolicy(
      new IAM.PolicyStatement({
        actions: ['iot:DescribeThing', 'iot:ListThingGroupsForThing'],
        resources: [`arn:aws:iot:${props.region}:${props.accountId}:thing/*`]
      })
    );
    getDeviceLambdaRole.addToPolicy(
      new IAM.PolicyStatement({
        actions: ['iot:SearchIndex'],
        resources: [
          `arn:aws:iot:${props.region}:${props.accountId}:index/AWS_Things`
        ]
      })
    );

    // Create the Python Lambda function
    const getDeviceFunction: Lambda.Function = new Lambda.Function(
      this,
      'getDevice',
      {
        runtime: Lambda.Runtime.PYTHON_3_12,
        code: Lambda.Code.fromAsset(
          path.join(
            import.meta.dirname,
            '../appsync/lambda-functions/python/get_device'
          )
        ),
        handler: 'handler.lambda_handler',
        layers: props.pythonLayer ? [props.pythonLayer] : [],
        role: getDeviceLambdaRole,
        timeout: cdk.Duration.seconds(30),
        memorySize: 128,
        environment: {
          PYTHONPATH: '/var/task:/opt/python'
        }
      }
    );

    // Create the AppSync data source using the Python Lambda
    const getDeviceDataSource: AppSync.LambdaDataSource =
      api.addLambdaDataSource('getDeviceDataSource', getDeviceFunction);

    // Create the resolver for the getDevice field
    getDeviceDataSource.createResolver('GetDeviceResolver', {
      typeName: 'Query',
      fieldName: 'getDevice',
      responseMappingTemplate: AppSync.MappingTemplate.fromString(
        defaultAppSyncResponseMapping
      )
    });
  }
}
