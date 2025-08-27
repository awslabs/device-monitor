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

"""Lambda handler for get-thing-group-list resolver."""
from typing import Any, Dict, List, Optional

import boto3
from aws_lambda_powertools.utilities.typing import LambdaContext

from shared_lib.powertools import logger, tracer, metrics
from shared_lib.appsync_utils import create_response, create_error_response

# Initialize IoT client
iot_client = boto3.client('iot')

def list_thing_groups() -> List[str]:
    """
    List all thing groups from IoT Core.
    
    Returns:
        List of thing group names
    """
    logger.debug("Getting all thing groups")
    
    groups = []
    next_token = None
    
    try:
        while True:
            # Prepare request parameters
            params = {
                "recursive": True
            }
            
            if next_token:
                params["nextToken"] = next_token
            
            # Get thing groups
            result = iot_client.list_thing_groups(**params)
            
            # Extract group names
            for group in result.get("thingGroups", []):
                if "groupName" in group:
                    groups.append(group["groupName"])
            
            # Check for pagination
            next_token = result.get("nextToken")
            if not next_token:
                break
        
        logger.debug("Got all thing groups", extra={"count": len(groups)})
        return groups
    
    except Exception as e:
        logger.error(f"Error listing thing groups: {str(e)}")
        raise

def get_parents(groups: List[str]) -> List[Dict[str, Any]]:
    """
    Get parent information for thing groups.
    
    Args:
        groups: List of thing group names
        
    Returns:
        List of group mappings with parent information
    """
    logger.debug("Getting parent groups")
    
    parent_mapping = []
    
    try:
        for thing_group_name in groups:
            # Get thing group details
            result = iot_client.describe_thing_group(thingGroupName=thing_group_name)
            
            # Create parent mapping
            parent_mapping.append({
                "groupName": result.get("thingGroupName", ""),
                "groupType": "DYNAMIC" if result.get("indexName") else "STATIC",
                "parentGroup": result.get("thingGroupMetadata", {}).get("parentGroupName")
            })
        
        logger.debug("Got parent groups", extra={"count": len(parent_mapping)})
        return parent_mapping
    
    except Exception as e:
        logger.error(f"Error getting parent groups: {str(e)}")
        raise

def build_group_hierarchy() -> Dict[str, Any]:
    """
    Build thing group hierarchy.
    
    Returns:
        Thing group hierarchy
    """
    logger.debug("Building group hierarchy")
    
    try:
        # Get all thing groups
        group_names = list_thing_groups()
        
        # Get parent information
        parent_mapping = get_parents(group_names)
        
        # Create temporary map of groups
        temp_map = {}
        for mapping in parent_mapping:
            group_name = mapping["groupName"]
            group_type = mapping["groupType"]
            
            temp_map[group_name] = {
                "groupName": group_name,
                "groupType": group_type,
                "childGroups": []
            }
        
        # Build hierarchy
        groups = []
        for mapping in parent_mapping:
            group_name = mapping["groupName"]
            parent_group = mapping["parentGroup"]
            
            if parent_group is None:
                # Root group
                groups.append(temp_map[group_name])
            else:
                # Child group
                if parent_group in temp_map:
                    temp_map[parent_group]["childGroups"].append(temp_map[group_name])
        
        logger.debug("Built group hierarchy", extra={"rootGroups": len(groups)})
        return {
            "groups": groups
        }
    
    except Exception as e:
        logger.error(f"Error building group hierarchy: {str(e)}")
        raise

@tracer.capture_lambda_handler
@logger.inject_lambda_context(log_event=True)
@metrics.log_metrics(capture_cold_start_metric=True)
def handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """
    Handle AppSync resolver request for getting thing group list.
    
    Args:
        event: AppSync resolver event
        context: Lambda context
        
    Returns:
        AppSync resolver response
    """
    try:
        # Build group hierarchy
        result = build_group_hierarchy()
        
        # Return successful response
        return create_response(result)
    
    except Exception as error:
        # Log the error
        logger.exception("Resolver execution failed")
        
        # Return error response
        return create_error_response(error)

# Entry point for AWS Lambda
lambda_handler = handler