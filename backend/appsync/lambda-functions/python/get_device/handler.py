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

"""Lambda handler for get-device resolver."""
from typing import Any, Dict

from aws_lambda_powertools.utilities.typing import LambdaContext

from shared_lib.powertools import logger, tracer, metrics, add_monitoring_details
from shared_lib.appsync_utils import create_response, create_error_response
from shared_lib.iot_utils import describe_thing, get_fleet_index_details, get_thing_groups

def get_device_details(thing_name: str) -> Dict[str, Any]:
    """Get device details from IoT Core.
    
    Args:
        thing_name: The IoT thing name
        
    Returns:
        Device information dictionary
    """
    logger.debug("Getting thing details", extra={"thingName": thing_name})
    
    # Get basic thing data
    thing_data = describe_thing(thing_name)
    
    # Get connectivity status from fleet indexing
    index_details = get_fleet_index_details(thing_name)
    
    # Get thing groups
    device_groups = get_thing_groups(thing_name)
    
    # Combine the data
    details = {
        "thingName": thing_name,
        "attributes": thing_data.get("attributes", {}),
        "deviceType": thing_data.get("thingTypeName", "unknown"),
        "connected": bool(index_details.get("connected", False)),
        "disconnectReason": index_details.get("disconnectReason"),
        "lastConnectedAt": index_details.get("timestamp"),
        "deviceGroups": device_groups,
        "firmwareType": index_details.get("firmwareType"),
        "firmwareVersion": index_details.get("firmwareVersion")
    }
    
    logger.debug("Got device details", extra={"thingName": thing_name})
    return details

@tracer.capture_lambda_handler
@logger.inject_lambda_context(log_event=True)
@metrics.log_metrics(capture_cold_start_metric=True)
def handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """
    Handle AppSync resolver request for getting a device.
    
    Args:
        event: AppSync resolver event
        context: Lambda context
        
    Returns:
        AppSync resolver response
    """
    add_monitoring_details({"function_name": context.function_name})
    
    try:
        # Extract thing name from arguments
        thing_name = event.get("arguments", {}).get("thingName")
        if not thing_name:
            return create_error_response("Missing required argument: thingName")
        
        # Get device details
        result = get_device_details(thing_name)
        
        # Return successful response
        return create_response(result)
    except Exception as error:
        # Log the error
        logger.exception("Resolver execution failed")
        
        # Return error response
        return create_error_response(error)

# Entry point for AWS Lambda
lambda_handler = handler