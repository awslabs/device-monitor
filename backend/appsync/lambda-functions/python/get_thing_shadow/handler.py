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

"""Lambda handler for get-thing-shadow resolver."""
import json
from typing import Any, Dict, Optional

import boto3
from aws_lambda_powertools.utilities.typing import LambdaContext

from shared_lib.powertools import logger, tracer, metrics
from shared_lib.appsync_utils import create_response, create_error_response

# Initialize IoT Data client
iot_data_client = boto3.client('iot-data')

def get_thing_shadow(thing_name: str, shadow_name: Optional[str] = None) -> Dict[str, Any]:
    """
    Get thing shadow from IoT Core.
    
    Args:
        thing_name: IoT thing name
        shadow_name: Optional shadow name
        
    Returns:
        Thing shadow data
    """
    logger.debug("Getting thing shadow", extra={"thing_name": thing_name, "shadow_name": shadow_name})
    
    try:
        # Prepare request parameters
        params = {
            "thingName": thing_name
        }
        
        # Add shadow name if provided
        if shadow_name:
            params["shadowName"] = shadow_name
        
        try:
            # Get thing shadow
            response = iot_data_client.get_thing_shadow(**params)
            
            # Parse payload
            if response.get("payload"):
                shadow_data = json.loads(response["payload"].read().decode('utf-8'))
            else:
                shadow_data = {}
            
            logger.debug("Got thing shadow", extra={"thing_name": thing_name})
            return shadow_data
        except iot_data_client.exceptions.ResourceNotFoundException:
            # Handle case where shadow doesn't exist
            logger.warning(f"Shadow not found for thing {thing_name} with shadow name {shadow_name}")
            
            # Return empty shadow structure with a message
            shadow_name_display = shadow_name if shadow_name else "classic"
            return {
                "state": {
                    "reported": {
                        "message": f"The {shadow_name_display} shadow does not exist for this device"
                    },
                    "desired": {}
                },
                "metadata": {
                    "reported": {},
                    "desired": {}
                },
                "version": 0,
                "timestamp": 0,
                "shadowNotFound": True
            }
    
    except Exception as e:
        logger.error(f"Error getting thing shadow: {str(e)}")
        raise

@tracer.capture_lambda_handler
@logger.inject_lambda_context(log_event=True)
@metrics.log_metrics(capture_cold_start_metric=True)
def handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """
    Handle AppSync resolver request for getting thing shadow.
    
    Args:
        event: AppSync resolver event
        context: Lambda context
        
    Returns:
        AppSync resolver response
    """
    try:
        # Extract arguments
        thing_name = event.get("arguments", {}).get("thingName")
        shadow_name = event.get("arguments", {}).get("shadowName")
        
        # Validate required arguments
        if not thing_name:
            return create_error_response("Missing required argument: thingName")
        
        # Get thing shadow
        result = get_thing_shadow(thing_name, shadow_name)
        
        # Return successful response
        return create_response(result)
    
    except Exception as error:
        # Log the error
        logger.exception("Resolver execution failed")
        
        # Return error response
        return create_error_response(error)

# Entry point for AWS Lambda
lambda_handler = handler