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
        runtime: Lambda.Runtime.PYTHON_3_12,
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
