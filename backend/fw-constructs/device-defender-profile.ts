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
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Duration, CustomResource } from 'aws-cdk-lib';

export interface DeviceDefenderProfileConstructProps {
  region: string;
  accountId: string;
}

export class DeviceDefenderProfileConstruct extends Construct {
  public readonly securityProfileName: string;
  public readonly securityProfileArn: string;

  constructor(
    scope: Construct,
    id: string,
    props: DeviceDefenderProfileConstructProps
  ) {
    super(scope, id);

    this.securityProfileName = 'FleetWatchSecurityProfile';
    this.securityProfileArn = `arn:aws:iot:${props.region}:${props.accountId}:securityprofile/${this.securityProfileName}`;

    // Create custom resource provider
    const provider: cr.Provider = new cr.Provider(
      this,
      'DefenderProfileProvider',
      {
        onEventHandler: new lambda.Function(this, 'DefenderProfileHandler', {
          runtime: lambda.Runtime.PYTHON_3_12,
          handler: 'index.on_event',
          timeout: Duration.minutes(5),
          code: lambda.Code.fromInline(`
import json
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def on_event(event, context):
    """
    Handle CloudFormation custom resource events for Device Defender security profile
    """
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        iot_client = boto3.client('iot')
        
        request_type = event['RequestType']
        props = event['ResourceProperties']
        
        security_profile_name = props['SecurityProfileName']
        account_id = props['AccountId']
        region = props['Region']
        
        all_things_arn = f"arn:aws:iot:{region}:{account_id}:all/things"
        
        if request_type == 'Create':
            return create_security_profile(iot_client, security_profile_name, all_things_arn)
        elif request_type == 'Update':
            return update_security_profile(iot_client, security_profile_name, all_things_arn)
        elif request_type == 'Delete':
            return delete_security_profile(iot_client, security_profile_name, all_things_arn)
        else:
            raise ValueError(f"Unknown request type: {request_type}")
            
    except Exception as e:
        logger.error(f"Error handling event: {str(e)}")
        raise

def create_security_profile(iot_client, security_profile_name, all_things_arn):
    """Create Device Defender security profile"""
    logger.info(f"Creating security profile: {security_profile_name}")
    
    # Define security behaviors for FleetWatch
    behaviors = [
        {
            'name': 'ConnectionAttempts',
            'metric': 'aws:num-connection-attempts',
            'criteria': {
                'comparisonOperator': 'greater-than',
                'value': {'count': 50},
                'durationSeconds': 300
            }
        },
        {
            'name': 'AuthorizationFailures',
            'metric': 'aws:num-authorization-failures',
            'criteria': {
                'comparisonOperator': 'greater-than',
                'value': {'count': 5},
                'durationSeconds': 300
            }
        },
        {
            'name': 'Disconnects',
            'metric': 'aws:num-disconnects',
            'criteria': {
                'comparisonOperator': 'greater-than',
                'value': {'count': 10},
                'durationSeconds': 300
            }
        }
    ]
    
    try:
        # Create security profile
        response = iot_client.create_security_profile(
            securityProfileName=security_profile_name,
            securityProfileDescription='FleetWatch Device Defender security profile for monitoring IoT device behavior and security metrics',
            behaviors=behaviors
        )
        
        logger.info(f"Security profile created: {response['securityProfileArn']}")
        
        # Attach security profile to all things
        iot_client.attach_security_profile(
            securityProfileName=security_profile_name,
            securityProfileTargetArn=all_things_arn
        )
        
        logger.info("Security profile attached to all things")
        
        return {
            'PhysicalResourceId': f"security-profile-{security_profile_name}",
            'Data': {
                'SecurityProfileName': security_profile_name,
                'SecurityProfileArn': response['securityProfileArn']
            }
        }
        
    except iot_client.exceptions.ResourceAlreadyExistsException:
        logger.info("Security profile already exists, attaching to all things")
        
        # Try to attach if not already attached
        try:
            iot_client.attach_security_profile(
                securityProfileName=security_profile_name,
                securityProfileTargetArn=all_things_arn
            )
        except iot_client.exceptions.ResourceConflictException:
            logger.info("Security profile already attached to all things")
        
        # Get existing profile ARN
        profile = iot_client.describe_security_profile(securityProfileName=security_profile_name)
        
        return {
            'PhysicalResourceId': f"security-profile-{security_profile_name}",
            'Data': {
                'SecurityProfileName': security_profile_name,
                'SecurityProfileArn': profile['securityProfileArn']
            }
        }

def update_security_profile(iot_client, security_profile_name, all_things_arn):
    """Update security profile (for now, just return existing)"""
    logger.info(f"Updating security profile: {security_profile_name}")
    
    try:
        profile = iot_client.describe_security_profile(securityProfileName=security_profile_name)
        return {
            'PhysicalResourceId': f"security-profile-{security_profile_name}",
            'Data': {
                'SecurityProfileName': security_profile_name,
                'SecurityProfileArn': profile['securityProfileArn']
            }
        }
    except iot_client.exceptions.ResourceNotFoundException:
        # If profile doesn't exist, create it
        return create_security_profile(iot_client, security_profile_name, all_things_arn)

def delete_security_profile(iot_client, security_profile_name, all_things_arn):
    """Delete security profile"""
    logger.info(f"Deleting security profile: {security_profile_name}")
    
    try:
        # Detach security profile from all things
        iot_client.detach_security_profile(
            securityProfileName=security_profile_name,
            securityProfileTargetArn=all_things_arn
        )
        logger.info("Security profile detached from all things")
    except (iot_client.exceptions.ResourceNotFoundException, iot_client.exceptions.InvalidRequestException):
        logger.info("Security profile attachment not found or invalid, continuing")
    
    try:
        # Delete security profile
        iot_client.delete_security_profile(
            securityProfileName=security_profile_name
        )
        logger.info("Security profile deleted")
    except iot_client.exceptions.ResourceNotFoundException:
        logger.info("Security profile not found, considering deletion successful")
    
    return {
        'PhysicalResourceId': f"security-profile-{security_profile_name}"
    }
`),
          initialPolicy: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'iot:CreateSecurityProfile',
                'iot:UpdateSecurityProfile',
                'iot:DeleteSecurityProfile',
                'iot:DescribeSecurityProfile',
                'iot:AttachSecurityProfile',
                'iot:DetachSecurityProfile',
                'iot:ListTargetsForSecurityProfile',
                'iot:ListSecurityProfiles',
                'iot:TagResource',
                'iot:UntagResource'
              ],
              resources: ['*']
            })
          ]
        }),
        logRetention: logs.RetentionDays.ONE_WEEK
      }
    );

    // Create the custom resource
    const customResource: CustomResource = new CustomResource(
      this,
      'DefenderProfileResource',
      {
        serviceToken: provider.serviceToken,
        properties: {
          SecurityProfileName: this.securityProfileName,
          AccountId: props.accountId,
          Region: props.region
        }
      }
    );

    // Add outputs
    this.securityProfileArn = customResource.getAttString('SecurityProfileArn');
  }
}
