"""
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
"""

"""Lambda handler for get-device resolver."""
import json
from typing import Any, Dict

import boto3
from aws_lambda_powertools.utilities.typing import LambdaContext

from shared_lib.powertools import logger, tracer, metrics, add_monitoring_details
from shared_lib.appsync_utils import create_response, create_error_response
from shared_lib.iot_utils import describe_thing, get_fleet_index_details, get_thing_groups, get_device_connection_status

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
    try:
        index_details = get_fleet_index_details(thing_name)
        logger.debug(f"Fleet index details for {thing_name}: {json.dumps(index_details)}")
    except Exception as e:
        logger.warning(f"Error getting fleet index details: {str(e)}")
        index_details = {}
    
    # Get thing groups
    device_groups = get_thing_groups(thing_name)
    
    # Get connection status using the consistent function
    connected_value = get_device_connection_status(thing_name)
    
    # Direct check of IoT registry for debugging
    try:
        # Get the device connection status directly from IoT Core
        iot_client = boto3.client('iot-data')
        response = iot_client.get_thing_shadow(thingName=thing_name)
        shadow_state = json.loads(response["payload"].read())
        shadow_connected = shadow_state.get("state", {}).get("reported", {}).get("connected", None)
        logger.debug(f"Shadow connection status for {thing_name}: {shadow_connected}")
        
        # If we couldn't get connection status from fleet index but have it in shadow
        if connected_value is False and shadow_connected is not None:
            logger.info(f"Using shadow connection status for {thing_name} as fallback")
            connected_value = bool(shadow_connected)
    except Exception as e:
        logger.debug(f"Could not get shadow connection status: {str(e)}")
        shadow_connected = None
    
    # Log the connection status for debugging
    logger.debug(f"Final connection status for {thing_name}: {connected_value} (shadow: {shadow_connected})")
    
    # Get firmware information from attributes if not in index details
    firmware_type = index_details.get("firmwareType")
    firmware_version = index_details.get("firmwareVersion")
    
    # Try to get firmware info from thing attributes if not in index
    if not firmware_type or not firmware_version:
        attributes = thing_data.get("attributes", {})
        if not firmware_type:
            firmware_type = attributes.get("firmwareType")
        if not firmware_version:
            firmware_version = attributes.get("firmwareVersion")
    
    # Combine the data
    details = {
        "thingName": thing_name,
        "attributes": thing_data.get("attributes", {}),
        "deviceType": thing_data.get("thingTypeName", "unknown"),
        "connected": connected_value,  # Use the consistent connection status
        "disconnectReason": index_details.get("disconnectReason"),
        "lastConnectedAt": index_details.get("timestamp"),
        "deviceGroups": device_groups,
        "firmwareType": firmware_type,
        "firmwareVersion": firmware_version
    }
    
    logger.debug("Got device details", extra={"thingName": thing_name, "connected": details["connected"]})
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