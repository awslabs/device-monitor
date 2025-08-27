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
import * as path from 'path';
import * as IAM from 'aws-cdk-lib/aws-iam';
import { defaultAppSyncResponseMapping, type FWConstructProps } from './types';
import * as AppSync from 'aws-cdk-lib/aws-appsync';
import { ShadowName } from '@bfw/shared/src/enums';
import { Construct } from 'constructs';
import * as Lambda from 'aws-cdk-lib/aws-lambda';

export class ThingShadowConstruct extends Construct {
  constructor(scope: Construct, id: string, props: FWConstructProps) {
    super(scope, id);
    this.createThingShadowDataSource(props);
  }
  private createThingShadowDataSource(props: FWConstructProps): void {
    const api: AppSync.GraphqlApi = props.api;
    const getThingShadowLambdaRole: IAM.Role = new IAM.Role(
      this,
      'getThingShadowLambdaRole',
      {
        assumedBy: new IAM.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          IAM.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          )
        ]
      }
    );
    getThingShadowLambdaRole.addToPolicy(
      new IAM.PolicyStatement({
        actions: ['iot:GetThingShadow'],
        resources: [
          // Add permission for classic shadow (no shadow name in ARN)
          `arn:aws:iot:${props.region}:${props.accountId}:thing/*`,
          // Add permissions for named shadows
          ...Object.values(ShadowName).map(
            (shadowName: string): string =>
              `arn:aws:iot:${props.region}:${props.accountId}:thing/*/${shadowName}`
          )
        ]
      })
    );

    // Create the Python Lambda function for get-thing-shadow
    const getThingShadowFunction: Lambda.Function = new Lambda.Function(
      this,
      'getThingShadowFunction',
      {
        runtime: Lambda.Runtime.PYTHON_3_12,
        code: Lambda.Code.fromAsset(
          path.join(
            import.meta.dirname,
            '../appsync/lambda-functions/python/get_thing_shadow'
          )
        ),
        handler: 'handler.lambda_handler',
        layers: props.pythonLayer ? [props.pythonLayer] : [],
        role: getThingShadowLambdaRole,
        environment: {
          PYTHONPATH: '/var/task:/opt/python'
        }
      }
    );

    const getThingShadowDataSource: AppSync.LambdaDataSource =
      api.addLambdaDataSource(
        'getThingShadowDataSource',
        getThingShadowFunction
      );
    getThingShadowDataSource.createResolver('getThingShadow', {
      typeName: 'Query',
      fieldName: 'getThingShadow',
      responseMappingTemplate: AppSync.MappingTemplate.fromString(
        defaultAppSyncResponseMapping
      )
    });
  }
}
