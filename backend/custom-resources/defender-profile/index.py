"""
Copyright 2025 Amazon.com, Inc. and its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License").
You may not use this file except in compliance with the License.
A copy of the License is located at

  http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed
on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
express or implied. See the License for the specific language governing
permissions and limitations under the License.
"""

import json
import logging
import boto3
import cfnresponse
import traceback
from typing import Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize IoT client
iot_client = boto3.client('iot')

def handler(event: Dict[str, Any], context: Any) -> None:
    """
    Handler for custom resource events to manage IoT Device Defender security profiles.
    
    Args:
        event: CloudFormation custom resource event
        context: Lambda context
    """
    logger.info(f"Event: {json.dumps(event)}")
    
    # Extract request type and properties
    request_type = event['RequestType']
    properties = event.get('ResourceProperties', {})
    
    try:
        if request_type == 'Create':
            response_data = create_security_profile(properties)
            cfnresponse.send(event, context, cfnresponse.SUCCESS, response_data)
        
        elif request_type == 'Update':
            response_data = update_security_profile(properties)
            cfnresponse.send(event, context, cfnresponse.SUCCESS, response_data)
        
        elif request_type == 'Delete':
            delete_security_profile(properties)
            cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
        
        else:
            logger.error(f"Unknown request type: {request_type}")
            cfnresponse.send(event, context, cfnresponse.FAILED, 
                            {"Error": f"Unknown request type: {request_type}"})
    
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        logger.error(traceback.format_exc())
        cfnresponse.send(event, context, cfnresponse.FAILED, 
                        {"Error": str(e)})

def create_security_profile(properties: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create an IoT Device Defender security profile.
    
    Args:
        properties: Properties from the CloudFormation custom resource
        
    Returns:
        Response data including the security profile ARN
    """
    security_profile_name = properties.get('SecurityProfileName')
    security_profile_description = properties.get('SecurityProfileDescription', '')
    behaviors = properties.get('Behaviors', [])
    target_arn = properties.get('TargetArn')
    metrics_export_config = properties.get('MetricsExportConfig')
    
    logger.info(f"Creating security profile: {security_profile_name}")
    
    # Convert string values to integers in behaviors
    processed_behaviors = []
    for behavior in behaviors:
        processed_behavior = behavior.copy()
        if 'criteria' in processed_behavior:
            criteria = processed_behavior['criteria']
            
            # Convert durationSeconds from string to int
            if 'durationSeconds' in criteria and isinstance(criteria['durationSeconds'], str):
                criteria['durationSeconds'] = int(criteria['durationSeconds'])
            
            # Convert count values from string to int
            if 'value' in criteria and 'count' in criteria['value'] and isinstance(criteria['value']['count'], str):
                criteria['value']['count'] = int(criteria['value']['count'])
        
        processed_behaviors.append(processed_behavior)
    
    # Create security profile
    create_params = {
        'securityProfileName': security_profile_name,
        'securityProfileDescription': security_profile_description,
        'behaviors': processed_behaviors
    }
    
    if metrics_export_config:
        create_params['metricsExportConfig'] = metrics_export_config
    
    response = iot_client.create_security_profile(**create_params)
    security_profile_arn = response.get('securityProfileArn')
    
    # Attach security profile to target
    if target_arn:
        logger.info(f"Attaching security profile to target: {target_arn}")
        iot_client.attach_security_profile(
            securityProfileName=security_profile_name,
            securityProfileTargetArn=target_arn
        )
    
    return {
        'SecurityProfileArn': security_profile_arn,
        'SecurityProfileName': security_profile_name
    }

def update_security_profile(properties: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update an IoT Device Defender security profile.
    
    Args:
        properties: Properties from the CloudFormation custom resource
        
    Returns:
        Response data including the security profile ARN
    """
    security_profile_name = properties.get('SecurityProfileName')
    security_profile_description = properties.get('SecurityProfileDescription', '')
    behaviors = properties.get('Behaviors', [])
    target_arn = properties.get('TargetArn')
    metrics_export_config = properties.get('MetricsExportConfig')
    
    logger.info(f"Updating security profile: {security_profile_name}")
    
    # Convert string values to integers in behaviors
    processed_behaviors = []
    for behavior in behaviors:
        processed_behavior = behavior.copy()
        if 'criteria' in processed_behavior:
            criteria = processed_behavior['criteria']
            
            # Convert durationSeconds from string to int
            if 'durationSeconds' in criteria and isinstance(criteria['durationSeconds'], str):
                criteria['durationSeconds'] = int(criteria['durationSeconds'])
            
            # Convert count values from string to int
            if 'value' in criteria and 'count' in criteria['value'] and isinstance(criteria['value']['count'], str):
                criteria['value']['count'] = int(criteria['value']['count'])
        
        processed_behaviors.append(processed_behavior)
    
    # Update security profile
    update_params = {
        'securityProfileName': security_profile_name,
        'securityProfileDescription': security_profile_description,
        'behaviors': processed_behaviors
    }
    
    if metrics_export_config:
        update_params['metricsExportConfig'] = metrics_export_config
    
    response = iot_client.update_security_profile(**update_params)
    security_profile_arn = response.get('securityProfileArn')
    
    # Update target attachment if provided
    if target_arn:
        # First, get current targets
        try:
            current_targets = iot_client.list_targets_for_security_profile(
                securityProfileName=security_profile_name
            ).get('securityProfileTargets', [])
            
            current_target_arns = [target.get('securityProfileTargetArn') for target in current_targets]
            
            # If target is not already attached, attach it
            if target_arn not in current_target_arns:
                logger.info(f"Attaching security profile to target: {target_arn}")
                iot_client.attach_security_profile(
                    securityProfileName=security_profile_name,
                    securityProfileTargetArn=target_arn
                )
        except Exception as e:
            logger.warning(f"Error checking or updating targets: {str(e)}")
    
    return {
        'SecurityProfileArn': security_profile_arn,
        'SecurityProfileName': security_profile_name
    }

def delete_security_profile(properties: Dict[str, Any]) -> None:
    """
    Delete an IoT Device Defender security profile.
    
    Args:
        properties: Properties from the CloudFormation custom resource
    """
    security_profile_name = properties.get('SecurityProfileName')
    target_arn = properties.get('TargetArn')
    
    logger.info(f"Deleting security profile: {security_profile_name}")
    
    # Detach from target first if specified
    if target_arn:
        try:
            logger.info(f"Detaching security profile from target: {target_arn}")
            iot_client.detach_security_profile(
                securityProfileName=security_profile_name,
                securityProfileTargetArn=target_arn
            )
        except Exception as e:
            logger.warning(f"Error detaching security profile: {str(e)}")
    
    # Delete the security profile
    try:
        iot_client.delete_security_profile(
            securityProfileName=security_profile_name
        )
    except Exception as e:
        logger.warning(f"Error deleting security profile: {str(e)}")

# For local testing
if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        with open(sys.argv[1], 'r') as f:
            test_event = json.load(f)
            handler(test_event, None)
    else:
        print("Please provide a test event file")
