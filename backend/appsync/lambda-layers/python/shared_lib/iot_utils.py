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

"""IoT utility functions for Lambda resolvers."""
import boto3
import json
from typing import Dict, List, Any, Optional

from shared_lib.powertools import logger

# Initialize IoT clients
iot_client = boto3.client('iot')
iot_data_client = boto3.client('iot-data')

def get_fleet_index_details(thing_name: str) -> Dict[str, Any]:
    """Get connectivity information from fleet indexing.
    
    Args:
        thing_name: The IoT thing name
        
    Returns:
        Connectivity details dictionary
    """
    try:
        # Check if fleet indexing is enabled
        try:
            index_status = iot_client.describe_index(indexName="AWS_Things")
            if index_status.get("indexStatus") != "ACTIVE":
                logger.warning(f"Fleet indexing is not active: {index_status.get('indexStatus')}")
                return {"connected": False}
        except iot_client.exceptions.ResourceNotFoundException:
            logger.warning("Fleet indexing is not enabled")
            return {"connected": False}
            
        response = iot_client.search_index(
            queryString=f"thingName:{thing_name}",
            indexName="AWS_Things"
        )
        
        logger.debug(f"Search index response for {thing_name}: {json.dumps(response)}")
        
        if response.get("things") and len(response["things"]) > 0:
            thing = response["things"][0]
            
            # Log the connectivity information
            logger.debug(f"Thing connectivity for {thing_name}: {json.dumps(thing.get('connectivity', {}))}")
            
            # Extract shadow information if available
            firmware_type = None
            firmware_version = None
            
            if thing.get("shadow"):
                try:
                    shadow_json = json.loads(thing["shadow"])
                    package_shadow = (
                        shadow_json.get("name", {})
                        .get("$package", {})
                        .get("state", {})
                        .get("reported", {})
                    )
                    if package_shadow:
                        firmware_type = list(package_shadow.keys())[0] if package_shadow else None
                        firmware_version = (
                            list(package_shadow.values())[0].get("version")
                            if package_shadow and list(package_shadow.values())
                            else None
                        )
                except (json.JSONDecodeError, IndexError, KeyError) as e:
                    logger.warning(f"Failed to parse shadow JSON: {e}")
            
            # Ensure connected is a proper boolean value
            connected_value = thing.get("connectivity", {}).get("connected", False)
            # Force to boolean to ensure consistency
            connected_value = bool(connected_value)
            
            # Create the result and log it
            result = {
                "connected": connected_value,  # Use the consistent boolean value
                "timestamp": thing.get("connectivity", {}).get("timestamp"),
                "disconnectReason": thing.get("connectivity", {}).get("disconnectReason"),
                "firmwareType": thing.get("attributes", {}).get("firmwareType") or firmware_type,
                "firmwareVersion": thing.get("attributes", {}).get("firmwareVersion") or firmware_version,
            }
            
            logger.debug(f"Returning connectivity details for {thing_name}: {json.dumps(result)}")
            return result
        
        logger.warning(f"No thing found in search index for {thing_name}")
        return {"connected": False}
    except Exception as e:
        logger.error(f"Failed to get connectivity info for {thing_name}: {e}")
        return {"connected": False}

def get_thing_groups(thing_name: str) -> List[str]:
    """Get thing groups for a device.
    
    Args:
        thing_name: The IoT thing name
        
    Returns:
        List of group names
    """
    try:
        response = iot_client.list_thing_groups_for_thing(thingName=thing_name)
        return [group.get("groupName", "") for group in response.get("thingGroups", [])]
    except Exception as e:
        logger.error(f"Could not get thing groups for {thing_name}: {e}")
        return []

def describe_thing(thing_name: str) -> Dict[str, Any]:
    """Get basic thing information from IoT Core.
    
    Args:
        thing_name: The IoT thing name
        
    Returns:
        Thing data from IoT Core
    """
    try:
        return iot_client.describe_thing(thingName=thing_name)
    except iot_client.exceptions.ResourceNotFoundException:
        logger.warning(f"Thing {thing_name} not found")
        return {"attributes": {}, "thingTypeName": "unknown"}
    except Exception as e:
        logger.error(f"Could not describe thing {thing_name}: {e}")
        return {"attributes": {}, "thingTypeName": "unknown"}

def get_device_connection_status(thing_name: str) -> bool:
    """
    Get the connection status for a device from the IoT registry.
    This function should be used by both get_device and list_things to ensure consistency.
    
    Args:
        thing_name: The IoT thing name
        
    Returns:
        Boolean indicating if the device is connected
    """
    # First try to get connection status from fleet index
    try:
        # Check if fleet indexing is enabled and active
        try:
            index_status = iot_client.describe_index(indexName="AWS_Things")
            if index_status.get("indexStatus") != "ACTIVE":
                logger.warning(f"Fleet indexing is not active: {index_status.get('indexStatus')}")
                # Continue to try search anyway
        except Exception as e:
            logger.warning(f"Could not check fleet index status: {str(e)}")
            # Continue to try search anyway
        
        # Search for the thing in the fleet index
        response = iot_client.search_index(
            queryString=f"thingName:{thing_name}",
            indexName="AWS_Things"
        )
        
        # Check if the thing was found
        if response.get("things") and len(response["things"]) > 0:
            thing = response["things"][0]
            
            # Get the connection status
            connectivity = thing.get("connectivity", {})
            connected_raw = connectivity.get("connected", False)
            
            # Convert to boolean if it's a string
            if isinstance(connected_raw, str):
                connected = connected_raw.lower() == 'true'
            else:
                connected = bool(connected_raw)
            
            # Log detailed information about the connection status
            logger.debug(f"Connection status for {thing_name} from fleet index: raw={connected_raw}, type={type(connected_raw).__name__}, converted={connected}")
            logger.debug(f"Full connectivity data: {connectivity}")
            
            # Return the connection status as a boolean
            return connected
        
        # If the thing was not found, log and try shadow as fallback
        logger.warning(f"Thing {thing_name} not found in fleet index, trying shadow")
    
    except Exception as e:
        logger.warning(f"Error getting connection status from fleet index for {thing_name}: {str(e)}")
        logger.info("Will try shadow as fallback")
    
    # Fallback to shadow if fleet index fails
    try:
        # Get the device connection status directly from IoT Core shadow
        iot_data_client = boto3.client('iot-data')
        response = iot_data_client.get_thing_shadow(thingName=thing_name)
        shadow_state = json.loads(response["payload"].read())
        
        # Try to get connection status from reported state
        reported = shadow_state.get("state", {}).get("reported", {})
        shadow_connected = reported.get("connected")
        
        if shadow_connected is not None:
            # Convert to boolean if it's a string
            if isinstance(shadow_connected, str):
                connected = shadow_connected.lower() == 'true'
            else:
                connected = bool(shadow_connected)
                
            logger.debug(f"Connection status for {thing_name} from shadow: {connected}")
            return connected
            
        # If no explicit connected status in shadow, check for recent activity
        last_updated = reported.get("lastUpdatedAt")
        if last_updated:
            # Consider connected if updated in the last 5 minutes
            import time
            current_time = int(time.time())
            time_diff = current_time - last_updated
            is_recent = time_diff < 300  # 5 minutes
            
            logger.debug(f"Connection status for {thing_name} inferred from shadow timestamp: {is_recent} (last updated {time_diff} seconds ago)")
            return is_recent
            
        logger.warning(f"No connection status or timestamp found in shadow for {thing_name}")
        return False
        
    except Exception as e:
        logger.error(f"Error getting connection status from shadow for {thing_name}: {str(e)}")
        return False
