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

"""Lambda handler for get-thing-list resolver."""
import json
from typing import Any, Dict, List, Optional

from aws_lambda_powertools.utilities.typing import LambdaContext

from shared_lib.powertools import logger, tracer, metrics
from shared_lib.appsync_utils import create_response, create_error_response
from shared_lib.iot_utils import get_device_connection_status
import boto3

# Initialize IoT client
iot_client = boto3.client('iot')

def concat_filters(filter_resolver_input: Optional[Dict[str, Any]]) -> str:
    """
    Convert filter input to IoT query string.
    
    Args:
        filter_resolver_input: Filter resolver input from GraphQL
        
    Returns:
        IoT query string
    """
    if not filter_resolver_input:
        return "*"
    
    is_filtered_to_favorites = False
    filters_without_favorites = []
    
    if filter_resolver_input.get("filters"):
        for filter_input in filter_resolver_input.get("filters", []):
            if filter_input.get("fieldName") == "favorite":
                is_filtered_to_favorites = True
            else:
                filters_without_favorites.append(filter_input)
    
    favorite_devices_query = []
    if (is_filtered_to_favorites and 
        filter_resolver_input.get("favoriteDevices") and 
        len(filter_resolver_input.get("favoriteDevices", [])) > 0):
        favorite_devices = " OR ".join(filter_resolver_input.get("favoriteDevices", []))
        favorite_devices_query = [f"thingName = ({favorite_devices})"]
    
    filters_query = ""
    if filters_without_favorites:
        operation = filter_resolver_input.get("operation", "and").upper()
        filter_strings = []
        
        for filter_input in filters_without_favorites:
            filter_strings.append(construct_query_string(filter_input))
        
        filters_query = f") {operation} (".join(filter_strings)
    
    if filters_query:
        operation = filter_resolver_input.get("operation", "and").upper()
        query = f") {operation} (".join([*favorite_devices_query, filters_query]) if favorite_devices_query else filters_query
    else:
        query = "".join(favorite_devices_query)
    
    logger.debug("Query string", extra={"query": f"({query})" if query else "*"})
    return f"({query})" if query else "*"

def construct_query_string(filter_input: Dict[str, Any]) -> str:
    """
    Construct query string from filter input.
    
    Args:
        filter_input: Filter input
        
    Returns:
        Query string
    """
    field_name = filter_input.get("fieldName", "")
    operator = filter_input.get("operator", "")
    value = filter_input.get("value")
    
    operator_mapping = {
        "none": "",
        "eq": ":",
        "ne": ":",
        "le": "<=",
        "lt": "<",
        "ge": ">=",
        "gt": ">",
        "between": ":",
        "contains": ":"
    }
    
    if operator == "between" and isinstance(value, list) and len(value) == 2:
        return f"{field_name} {operator_mapping[operator]} [{value[0]} TO {value[1]}]"
    elif operator != "between" and value is not None and not isinstance(value, dict):
        prefix = "NOT " if operator == "ne" else ""
        suffix = "*" if operator == "contains" else ""
        return f"{prefix}{field_name}{operator_mapping[operator]}{value}{suffix}"
    else:
        raise ValueError("Invalid filter")

def get_thing_list(filter_input: Optional[Dict[str, Any]], max_results: Optional[int], next_token: Optional[str]) -> Dict[str, Any]:
    """
    Get list of things from IoT Core.
    
    Args:
        filter_input: Filter input
        max_results: Maximum number of results to return
        next_token: Token for pagination
        
    Returns:
        List of things
    """
    logger.debug("Getting thing list", extra={"max_results": max_results, "next_token": next_token})
    
    # Prepare search parameters
    search_params = {
        "indexName": "AWS_Things",
        "queryString": concat_filters(filter_input),
        "maxResults": min(max_results or 250, 250)
    }
    
    if next_token:
        search_params["nextToken"] = next_token
    
    # Search IoT index
    result = iot_client.search_index(**search_params)
    
    # Process results
    items = []
    for thing in result.get("things", []):
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
        
        # Create thing summary
        # Get the raw connection status from the thing data
        raw_connected = thing.get("connectivity", {}).get("connected", False)
        
        # Get connection status using the consistent function
        connected_value = get_device_connection_status(thing.get("thingName", ""))
        
        # Log both values for debugging
        logger.debug(f"Thing {thing.get('thingName', '')}: raw_connected={raw_connected}, consistent_connected={connected_value}")
            
        thing_summary = {
            "thingName": thing.get("thingName", ""),
            "deviceType": thing.get("thingTypeName", ""),
            "connected": connected_value,  # Use the consistent connection status
            "lastConnectedAt": thing.get("connectivity", {}).get("timestamp"),
            "disconnectReason": thing.get("connectivity", {}).get("disconnectReason"),
            "productionTimestamp": int(thing.get("attributes", {}).get("productionTimestamp", 0)),
            "provisioningTimestamp": int(thing.get("attributes", {}).get("provisioningTimestamp", 0)),
            "brandName": thing.get("attributes", {}).get("brandName", ""),
            "country": thing.get("attributes", {}).get("country", ""),
            "hasApplianceFW": thing.get("attributes", {}).get("hasApplianceFW") == "true",
            "firmwareType": firmware_type,
            "firmwareVersion": firmware_version,
            "thingGroupNames": thing.get("thingGroupNames", [])
        }
        
        items.append(thing_summary)
    
    logger.debug("Got thing list", extra={"count": len(items)})
    return {
        "items": items,
        "nextToken": result.get("nextToken")
    }

@tracer.capture_lambda_handler
@logger.inject_lambda_context(log_event=True)
@metrics.log_metrics(capture_cold_start_metric=True)
def handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """
    Handle AppSync resolver request for getting a list of things.
    
    Args:
        event: AppSync resolver event
        context: Lambda context
        
    Returns:
        AppSync resolver response
    """
    try:
        # Extract arguments
        filter_input = event.get("arguments", {}).get("filter")
        limit = event.get("arguments", {}).get("limit")
        next_token = event.get("arguments", {}).get("nextToken")
        
        # Get thing list
        result = get_thing_list(filter_input, limit, next_token)
        
        # Return successful response
        return create_response(result)
    except Exception as error:
        # Log the error
        logger.exception("Resolver execution failed")
        
        # Return error response
        return create_error_response(error)

# Entry point for AWS Lambda
lambda_handler = handler