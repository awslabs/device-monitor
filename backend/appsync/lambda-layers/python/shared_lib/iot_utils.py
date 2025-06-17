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
        
        if response.get("things") and len(response["things"]) > 0:
            thing = response["things"][0]
            
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
            
            return {
                "connected": thing.get("connectivity", {}).get("connected", False),
                "timestamp": thing.get("connectivity", {}).get("timestamp"),
                "disconnectReason": thing.get("connectivity", {}).get("disconnectReason"),
                "firmwareType": thing.get("attributes", {}).get("firmwareType") or firmware_type,
                "firmwareVersion": thing.get("attributes", {}).get("firmwareVersion") or firmware_version,
            }
        
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