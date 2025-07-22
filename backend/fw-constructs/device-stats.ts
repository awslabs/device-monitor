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
import * as Events from 'aws-cdk-lib/aws-events';
import * as EventsTargets from 'aws-cdk-lib/aws-events-targets';
import * as DynamoDB from 'aws-cdk-lib/aws-dynamodb';
import { Duration, RemovalPolicy } from 'aws-cdk-lib/core';
import { defaultAppSyncResponseMapping, type FWConstructProps } from './types';

export class DeviceStatsConstruct extends Construct {
  public readonly table: DynamoDB.Table;
  public readonly latestRecordIndexName: string = 'LatestRecordIndex';

  constructor(scope: Construct, id: string, props: FWConstructProps) {
    super(scope, id);
    const api: AppSync.GraphqlApi = props.api;

    // Create DynamoDB table for device stats
    this.table = new DynamoDB.Table(this, 'DeviceStatsTable', {
      partitionKey: {
        name: 'recordTime',
        type: DynamoDB.AttributeType.STRING
      },
      billingMode: DynamoDB.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'ttl',
      pointInTimeRecoverySpecification: {
        // Updated to use new property name
        pointInTimeRecoveryEnabled: true
      }
    });

    // Add GSI for latest record lookup
    this.table.addGlobalSecondaryIndex({
      indexName: this.latestRecordIndexName,
      partitionKey: { name: 'status', type: DynamoDB.AttributeType.STRING },
      sortKey: { name: 'recordTime', type: DynamoDB.AttributeType.STRING }
    });

    // Create AppSync data source for the DynamoDB table
    const deviceStatsDataSource: AppSync.DynamoDbDataSource =
      api.addDynamoDbDataSource('DeviceStatsConstruct', this.table);

    // Create resolver for createDeviceStats mutation
    deviceStatsDataSource.createResolver('CreateDeviceStats', {
      typeName: 'Mutation',
      fieldName: 'createDeviceStats',
      requestMappingTemplate: AppSync.MappingTemplate.dynamoDbPutItem(
        AppSync.PrimaryKey.partition('recordTime').is('input.recordTime'),
        AppSync.Values.projecting('input')
      ),
      responseMappingTemplate: AppSync.MappingTemplate.dynamoDbResultItem()
    });

    // Create IAM role for the get-latest-stats Lambda
    const getLatestStatsLambdaRole: IAM.Role = new IAM.Role(
      this,
      'GetLatestStatsLambdaRole',
      {
        assumedBy: new IAM.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          IAM.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          )
        ]
      }
    );

    // Create the Python Lambda function for get-latest-stats
    const getLatestStatsFunction: Lambda.Function = new Lambda.Function(
      this,
      'GetLatestStatsFunction',
      {
        runtime: Lambda.Runtime.PYTHON_3_12, // Updated to latest runtime
        code: Lambda.Code.fromAsset(
          path.join(
            import.meta.dirname,
            '../appsync/lambda-functions/python/get_latest_stats'
          )
        ),
        handler: 'handler.lambda_handler',
        layers: props.pythonLayer ? [props.pythonLayer] : [],
        role: getLatestStatsLambdaRole,
        environment: {
          PYTHONPATH: '/var/task:/opt/python',
          DEVICE_STATS_TABLE: this.table.tableName,
          DEVICE_STATS_INDEX: this.latestRecordIndexName
        }
      }
    );

    // Grant read access to the table
    this.table.grantReadData(getLatestStatsFunction);

    // Create AppSync data source for the Lambda function
    const getLatestStatsDataSource: AppSync.LambdaDataSource =
      api.addLambdaDataSource(
        'GetLatestStatsDataSource',
        getLatestStatsFunction
      );

    // Create resolver for getLatestDeviceStats query
    getLatestStatsDataSource.createResolver('GetLatestDeviceStats', {
      typeName: 'Query',
      fieldName: 'getLatestDeviceStats',
      responseMappingTemplate: AppSync.MappingTemplate.fromString(
        defaultAppSyncResponseMapping
      )
    });

    // Device Stats Monitor
    const monitoringLambdaRole: IAM.Role = new IAM.Role(
      this,
      'MonitoringLambdaRole',
      {
        assumedBy: new IAM.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          IAM.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          )
        ]
      }
    );

    // Add CloudWatch metrics permission with namespace restriction
    monitoringLambdaRole.addToPolicy(
      new IAM.PolicyStatement({
        effect: IAM.Effect.ALLOW,
        actions: ['cloudwatch:PutMetricData'],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'cloudwatch:namespace': 'FleetWatch/DeviceStats'
          }
        }
      })
    );

    // Add IoT permissions
    monitoringLambdaRole.addToPolicy(
      new IAM.PolicyStatement({
        effect: IAM.Effect.ALLOW,
        actions: [
          'iot:SearchIndex',
          'iot:ListThingGroupsForThing' // Add missing permission
        ],
        resources: [
          `arn:aws:iot:${props.region}:${props.accountId}:index/AWS_Things`,
          `arn:aws:iot:${props.region}:${props.accountId}:thing/*` // Add thing resource for ListThingGroupsForThing
        ]
      })
    );

    // Add AppSync permissions with IAM auth
    monitoringLambdaRole.addToPolicy(
      new IAM.PolicyStatement({
        actions: ['appsync:GraphQL'],
        resources: [api.arn + '/*']
      })
    );

    // REMOVED: STS AssumeRole permission - not needed for this Lambda function
    // If cross-service authentication is needed, implement with specific role ARNs

    // Grant write access to the DynamoDB table directly
    this.table.grantWriteData(monitoringLambdaRole);

    // Use Python implementation for device-stats-monitor
    const deviceStatsMonitorFunction: Lambda.Function = new Lambda.Function(
      this,
      'DeviceStatsMonitor',
      {
        runtime: Lambda.Runtime.PYTHON_3_12, // Updated to latest runtime
        code: Lambda.Code.fromAsset(
          path.join(
            import.meta.dirname,
            '../appsync/lambda-functions/python/device_stats_monitor'
          )
        ),
        handler: 'handler.lambda_handler',
        layers: props.pythonLayer ? [props.pythonLayer] : [],
        role: monitoringLambdaRole,
        timeout: Duration.minutes(5),
        memorySize: 1024,
        environment: {
          PYTHONPATH: '/var/task:/opt/python',
          APPSYNC_API_URL: api.graphqlUrl,
          DEVICE_STATS_TABLE: this.table.tableName // Add table name for direct DynamoDB access
        }
      }
    );

    const deviceStatsRule: Events.Rule = new Events.Rule(
      this,
      'DeviceStatsSchedule',
      {
        schedule: Events.Schedule.rate(Duration.minutes(1)),
        targets: [new EventsTargets.LambdaFunction(deviceStatsMonitorFunction)]
      }
    );
    deviceStatsMonitorFunction.addPermission('EventBridgeInvoke', {
      principal: new IAM.ServicePrincipal('events.amazonaws.com'),
      action: 'lambda:InvokeFunction',
      sourceArn: deviceStatsRule.ruleArn
    });
  }
}
