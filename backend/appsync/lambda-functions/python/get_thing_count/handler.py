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

"""Lambda handler for get-thing-count resolver."""
from typing import Any, Dict, List, Optional

import boto3
from aws_lambda_powertools.utilities.typing import LambdaContext

from shared_lib.powertools import logger, tracer, metrics
from shared_lib.appsync_utils import create_response, create_error_response

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

def get_thing_count(filter_input: Optional[Dict[str, Any]]) -> int:
    """
    Get count of things from IoT Core based on filter.
    
    Args:
        filter_input: Filter input
        
    Returns:
        Count of things
    """
    logger.debug("Getting total thing count")
    
    try:
        # Get statistics from IoT Core
        response = iot_client.get_statistics(
            indexName="AWS_Things",
            aggregationField="thingId",
            queryString=concat_filters(filter_input)
        )
        
        # Extract count from statistics
        count = response.get("statistics", {}).get("count")
        
        if count is None:
            raise ValueError("Query failed")
        
        logger.debug("Got total thing count", extra={"count": count})
        return count
    
    except Exception as e:
        logger.error(f"Error getting thing count: {str(e)}")
        raise

@tracer.capture_lambda_handler
@logger.inject_lambda_context(log_event=True)
@metrics.log_metrics(capture_cold_start_metric=True)
def handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """
    Handle AppSync resolver request for getting thing count.
    
    Args:
        event: AppSync resolver event
        context: Lambda context
        
    Returns:
        AppSync resolver response
    """
    try:
        # Extract filter from arguments
        filter_input = event.get("arguments", {}).get("filter")
        
        # Get thing count
        count = get_thing_count(filter_input)
        
        # Return successful response
        return create_response(count)
    
    except Exception as error:
        # Log the error
        logger.exception("Resolver execution failed")
        
        # Return error response
        return create_error_response(error)

# Entry point for AWS Lambda
lambda_handler = handler