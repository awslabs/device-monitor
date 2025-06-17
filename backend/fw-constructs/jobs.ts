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

export class JobsConstruct extends Construct {
  constructor(scope: Construct, id: string, props: FWConstructProps) {
    super(scope, id);
    const api: AppSync.GraphqlApi = props.api;

    //listJobs components
    const listJobsLambdaRole: IAM.Role = new IAM.Role(
      this,
      'ListJobsLambdaRole',
      {
        assumedBy: new IAM.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          IAM.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          )
        ]
      }
    );
    listJobsLambdaRole.addToPolicy(
      new IAM.PolicyStatement({
        actions: [
          'iot:ListJobs',
          'iot:ListThings',
          'iot:ListThingGroups',
          'iot:DescribeJob'
        ],
        resources: ['*']
      })
    );

    // Create the Python Lambda function for get-job-list
    const listJobsFunction: Lambda.Function = new Lambda.Function(
      this,
      'ListJobsFunction',
      {
        runtime: Lambda.Runtime.PYTHON_3_10,
        code: Lambda.Code.fromAsset(
          path.join(
            import.meta.dirname,
            '../appsync/lambda-functions/python/get_job_list'
          )
        ),
        handler: 'handler.lambda_handler',
        layers: props.pythonLayer ? [props.pythonLayer] : [],
        role: listJobsLambdaRole,
        environment: {
          PYTHONPATH: '/var/task:/opt/python'
        }
      }
    );
    
    const listJobsDataSource: AppSync.LambdaDataSource =
      api.addLambdaDataSource('ListJobsDataSource', listJobsFunction);
    listJobsDataSource.createResolver('ListJobs', {
      typeName: 'Query',
      fieldName: 'listJobs',
      responseMappingTemplate: AppSync.MappingTemplate.fromString(
        defaultAppSyncResponseMapping
      )
    });

    //get job details
    const getJobDetailsLambdaRole: IAM.Role = new IAM.Role(
      this,
      'GetJobDetailsLambdaRole',
      {
        assumedBy: new IAM.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          IAM.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          )
        ]
      }
    );
    getJobDetailsLambdaRole.addToPolicy(
      new IAM.PolicyStatement({
        actions: ['iot:DescribeJob'],
        resources: [`arn:aws:iot:${props.region}:${props.accountId}:job/*`]
      })
    );
    
    // Create the Python Lambda function for get-job-details
    const getJobDetailsFunction: Lambda.Function = new Lambda.Function(
      this,
      'GetJobDetailsFunction',
      {
        runtime: Lambda.Runtime.PYTHON_3_10,
        code: Lambda.Code.fromAsset(
          path.join(
            import.meta.dirname,
            '../appsync/lambda-functions/python/get_job_details'
          )
        ),
        handler: 'handler.lambda_handler',
        layers: props.pythonLayer ? [props.pythonLayer] : [],
        role: getJobDetailsLambdaRole,
        environment: {
          PYTHONPATH: '/var/task:/opt/python'
        }
      }
    );
    
    const getJobDetailsDataSource: AppSync.LambdaDataSource =
      api.addLambdaDataSource('GetJobDetailsDataSource', getJobDetailsFunction);
    getJobDetailsDataSource.createResolver('GetJobDetails', {
      typeName: 'Query',
      fieldName: 'getJobDetails',
      responseMappingTemplate: AppSync.MappingTemplate.fromString(
        defaultAppSyncResponseMapping
      )
    });

    // get executions list
    const listExecutionsLambdaRole: IAM.Role = new IAM.Role(
      this,
      'ListExecutionsLambdaRole',
      {
        assumedBy: new IAM.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          IAM.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          )
        ]
      }
    );
    listExecutionsLambdaRole.addToPolicy(
      new IAM.PolicyStatement({
        actions: [
          'iot:ListJobExecutionsForJob',
          'iot:ListJobExecutionsForThing'
        ],
        resources: ['*']
      })
    );
    
    // Create the Python Lambda function for get-job-execution-list
    const listExecutionsFunction: Lambda.Function = new Lambda.Function(
      this,
      'ListExecutionsFunction',
      {
        runtime: Lambda.Runtime.PYTHON_3_10,
        code: Lambda.Code.fromAsset(
          path.join(
            import.meta.dirname,
            '../appsync/lambda-functions/python/get_job_execution_list'
          )
        ),
        handler: 'handler.lambda_handler',
        layers: props.pythonLayer ? [props.pythonLayer] : [],
        role: listExecutionsLambdaRole,
        environment: {
          PYTHONPATH: '/var/task:/opt/python'
        }
      }
    );
    
    const listExecutionsDataSource: AppSync.LambdaDataSource =
      api.addLambdaDataSource('ListJobExecutions', listExecutionsFunction);
    listExecutionsDataSource.createResolver('ListJobExecutionsForJob', {
      typeName: 'Query',
      fieldName: 'listJobExecutionsForJob',
      responseMappingTemplate: AppSync.MappingTemplate.fromString(
        defaultAppSyncResponseMapping
      )
    });
    listExecutionsDataSource.createResolver('ListJobExecutionsForThing', {
      typeName: 'Query',
      fieldName: 'listJobExecutionsForThing',
      responseMappingTemplate: AppSync.MappingTemplate.fromString(
        defaultAppSyncResponseMapping
      )
    });
  }
}