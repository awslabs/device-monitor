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
import { RetainedTopicSuffix } from '@bfw/shared/src/appsync';

export class RetainedTopicsConstruct extends Construct {
  constructor(scope: Construct, id: string, props: FWConstructProps) {
    super(scope, id);
    const api: AppSync.GraphqlApi = props.api;

    const getRetainedTopicLambdaRole: IAM.Role = new IAM.Role(
      this,
      'getRetainedTopicLambdaRole',
      {
        assumedBy: new IAM.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          IAM.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          )
        ]
      }
    );

    getRetainedTopicLambdaRole.addToPolicy(
      new IAM.PolicyStatement({
        actions: ['iot:GetRetainedMessage'],
        resources: [
          // Original expected format
          ...Object.values(RetainedTopicSuffix).map(
            (topicName: string): string =>
              `arn:aws:iot:${props.region}:${props.accountId}:topic/things/*/topics/${topicName}`
          ),
          // Device simulator formats
          `arn:aws:iot:${props.region}:${props.accountId}:topic/device/*/state`,
          ...Object.values(RetainedTopicSuffix).map(
            (topicName: string): string =>
              `arn:aws:iot:${props.region}:${props.accountId}:topic/device/*/${topicName}`
          )
        ]
      })
    );

    // Create the Python Lambda function for get-retained-topic
    const getRetainedTopicFunction: Lambda.Function = new Lambda.Function(
      this,
      'getRetainedTopicFunction',
      {
        runtime: Lambda.Runtime.PYTHON_3_12,
        code: Lambda.Code.fromAsset(
          path.join(
            import.meta.dirname,
            '../appsync/lambda-functions/python/get_retained_topic'
          )
        ),
        handler: 'handler.lambda_handler',
        layers: props.pythonLayer ? [props.pythonLayer] : [],
        role: getRetainedTopicLambdaRole,
        environment: {
          PYTHONPATH: '/var/task:/opt/python'
        }
      }
    );

    const getRetainedTopicDataSource: AppSync.LambdaDataSource =
      api.addLambdaDataSource(
        'getRetainedTopicDataSource',
        getRetainedTopicFunction
      );
    getRetainedTopicDataSource.createResolver('getRetainedTopic', {
      typeName: 'Query',
      fieldName: 'getRetainedTopic',
      responseMappingTemplate: AppSync.MappingTemplate.fromString(
        defaultAppSyncResponseMapping
      )
    });
  }
}
