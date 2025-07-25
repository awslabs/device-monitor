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
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as cdk from 'aws-cdk-lib';
import { Duration } from 'aws-cdk-lib';


export class IoTFleetIndexingConstruct extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create a Lambda function that will configure fleet indexing
    const fleetIndexingLambda: lambda.Function = new lambda.Function(
      this,
      'FleetIndexingFunction',
      {
        runtime: lambda.Runtime.NODEJS_22_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
// Import AWS SDK v3 IoT client
const { IoTClient, UpdateIndexingConfigurationCommand, GetIndexingConfigurationCommand } = require('@aws-sdk/client-iot');

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  // Create IoT client
  const iotClient = new IoTClient();
  const requestType = event.RequestType;
  
  try {
    if (requestType === 'Create' || requestType === 'Update') {
      console.log('Configuring IoT fleet indexing');
      
      // First, check current configuration
      try {
        const currentConfig = await iotClient.send(new GetIndexingConfigurationCommand({}));
        console.log('Current indexing configuration:', JSON.stringify(currentConfig, null, 2));
      } catch (error) {
        console.log('Could not get current indexing configuration:', error.message);
      }
      
      // Enable features one by one
      console.log('Enabling features one by one...');
      
      try {
        // First, get the current configuration to use as a base
        const currentConfig = await iotClient.send(new GetIndexingConfigurationCommand({}));
        console.log('Current configuration before individual updates:', JSON.stringify(currentConfig, null, 2));
        
        // Extract the current thing indexing configuration or create a default one
        const baseConfig = currentConfig.thingIndexingConfiguration || {
          thingIndexingMode: 'OFF',
          thingConnectivityIndexingMode: 'OFF',
          deviceDefenderIndexingMode: 'OFF',
          namedShadowIndexingMode: 'OFF',
          thingGroupIndexingMode: 'OFF'
        };
        
        // Enable thing indexing first (this is required for other features)
        console.log('Enabling thing indexing...');
        await iotClient.send(new UpdateIndexingConfigurationCommand({
          thingIndexingConfiguration: {
            ...baseConfig,
            thingIndexingMode: 'REGISTRY_AND_SHADOW'
          }
        }));
        console.log('Enabled thing indexing');
        
        // Get updated configuration after enabling thing indexing
        const updatedConfig1 = await iotClient.send(new GetIndexingConfigurationCommand({}));
        const config1 = updatedConfig1.thingIndexingConfiguration || baseConfig;
        
        // Enable thing connectivity
        console.log('Enabling thing connectivity...');
        await iotClient.send(new UpdateIndexingConfigurationCommand({
          thingIndexingConfiguration: {
            ...config1,
            thingConnectivityIndexingMode: 'STATUS'
          }
        }));
        console.log('Enabled thing connectivity');
        
        // Get updated configuration after enabling thing connectivity
        const updatedConfig2 = await iotClient.send(new GetIndexingConfigurationCommand({}));
        const config2 = updatedConfig2.thingIndexingConfiguration || config1;
        
        // Try enabling named shadow indexing with a simple array
        try {
          console.log('Trying to enable named shadow indexing with simple array...');
          await iotClient.send(new UpdateIndexingConfigurationCommand({
            thingIndexingConfiguration: {
              ...config2,
              namedShadowIndexingMode: 'ON',
              namedShadowNames: ['$package', 'state', 'schedule']
            }
          }));
          console.log('Enabled named shadow indexing with simple array');
        } catch (shadowError1) {
          console.log('Error enabling named shadow indexing with simple array:', shadowError1.message);
          
          // Try with a different format
          try {
            console.log('Trying to enable named shadow indexing with string format...');
            await iotClient.send(new UpdateIndexingConfigurationCommand({
              thingIndexingConfiguration: {
                ...config2,
                namedShadowIndexingMode: 'ON',
                namedShadowNames: "$package,state,schedule"
              }
            }));
            console.log('Enabled named shadow indexing with string format');
          } catch (shadowError2) {
            console.log('Error enabling named shadow indexing with string format:', shadowError2.message);
            
            // Skip named shadow indexing if it's causing problems
            console.log('Skipping named shadow indexing for now...');
          }
        }
        
        // Get updated configuration after enabling named shadow indexing
        const updatedConfig3 = await iotClient.send(new GetIndexingConfigurationCommand({}));
        const config3 = updatedConfig3.thingIndexingConfiguration || config2;
        
        // Enable device defender
        console.log('Enabling device defender...');
        await iotClient.send(new UpdateIndexingConfigurationCommand({
          thingIndexingConfiguration: {
            ...config3,
            deviceDefenderIndexingMode: 'VIOLATIONS'
          }
        }));
        console.log('Enabled device defender');
        
        // Get updated configuration after enabling device defender
        const updatedConfig4 = await iotClient.send(new GetIndexingConfigurationCommand({}));
        const config4 = updatedConfig4.thingIndexingConfiguration || config3;
        
        // Enable thing group indexing
        console.log('Enabling thing group indexing...');
        await iotClient.send(new UpdateIndexingConfigurationCommand({
          thingIndexingConfiguration: {
            ...config4,
            thingGroupIndexingMode: 'ON'
          }
        }));
        console.log('Enabled thing group indexing');
        
        // Get updated configuration after enabling thing group indexing
        const updatedConfig5 = await iotClient.send(new GetIndexingConfigurationCommand({}));
        const config5 = updatedConfig5.thingIndexingConfiguration || config4;
        
        // Try to enable software packages indexing
        try {
          console.log('Enabling software packages indexing...');
          await iotClient.send(new UpdateIndexingConfigurationCommand({
            thingIndexingConfiguration: {
              ...config5,
              packageIndexingMode: 'ON'
            }
          }));
          console.log('Enabled software packages indexing');
        } catch (packageError) {
          console.log('Could not enable software packages indexing:', packageError.message);
        }
      } catch (error) {
        console.error('Error enabling features separately:', error);
        throw error;
      }
      
      // Verify the configuration was applied
      try {
        const updatedConfig = await iotClient.send(new GetIndexingConfigurationCommand({}));
        console.log('Updated indexing configuration:', JSON.stringify(updatedConfig, null, 2));
      } catch (error) {
        console.log('Could not get updated indexing configuration:', error.message);
      }
    }
    
    return {
      PhysicalResourceId: 'IoTFleetIndexingConfiguration',
      Data: { Status: 'SUCCESS' }
    };
  } catch (error) {
    console.error('Error configuring IoT fleet indexing:', error);
    throw error;
  }
}
      `),
        timeout: Duration.minutes(5)
      }
    );

    // Grant the Lambda function permissions to update IoT indexing configuration
    fleetIndexingLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'iot:UpdateIndexingConfiguration',
          'iot:DescribeIndex',
          'iot:GetIndexingConfiguration'
        ],
        resources: ['*']
        // REQUIRED: IoT fleet indexing configuration is a global account-level setting
        // that doesn't support resource-level permissions. This is an AWS service limitation.
      })
    );

    // Add a CloudWatch log group for the Lambda function with retention
    new logs.LogGroup(this, 'FleetIndexingFunctionLogs', {
      logGroupName: `/aws/lambda/${fleetIndexingLambda.functionName}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // Create a custom resource that uses the Lambda function
    // Add a timestamp to force the custom resource to be updated on each deployment
    const timestamp: string = new Date().toISOString();

    new cr.AwsCustomResource(this, 'FleetIndexingCustomResource', {
      onCreate: {
        service: 'Lambda',
        action: 'invoke',
        parameters: {
          FunctionName: fleetIndexingLambda.functionName,
          Payload: JSON.stringify({
            RequestType: 'Create',
            Timestamp: timestamp
          })
        },
        physicalResourceId: cr.PhysicalResourceId.of(
          'IoTFleetIndexingConfiguration-' + timestamp
        )
      },
      onUpdate: {
        service: 'Lambda',
        action: 'invoke',
        parameters: {
          FunctionName: fleetIndexingLambda.functionName,
          Payload: JSON.stringify({
            RequestType: 'Update',
            Timestamp: timestamp
          })
        },
        physicalResourceId: cr.PhysicalResourceId.of(
          'IoTFleetIndexingConfiguration-' + timestamp
        )
      },
      policy: cr.AwsCustomResourcePolicy.fromStatements([
        new iam.PolicyStatement({
          actions: ['lambda:InvokeFunction'],
          resources: [fleetIndexingLambda.functionArn]
        })
      ])
    });
  }
}
