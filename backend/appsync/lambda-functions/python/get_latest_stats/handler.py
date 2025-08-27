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

"""Lambda handler for get-latest-stats resolver."""
import os
import json
from typing import Any, Dict, List, Optional

import boto3
from boto3.dynamodb.conditions import Key
from aws_lambda_powertools.utilities.typing import LambdaContext

from shared_lib.powertools import logger, tracer, metrics
from shared_lib.appsync_utils import create_response, create_error_response

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')

def get_latest_stats() -> Dict[str, Any]:
    """
    Get latest device statistics from DynamoDB.
    
    Returns:
        Latest device statistics or error response
    """
    logger.debug("Getting latest device stats")
    
    try:
        # Get table and index names from environment variables
        table_name = os.environ.get("DEVICE_STATS_TABLE")
        index_name = os.environ.get("DEVICE_STATS_INDEX")
        
        if not table_name:
            raise ValueError("DEVICE_STATS_TABLE environment variable is not set")
        
        # Get the table
        table = dynamodb.Table(table_name)
        
        # Query parameters
        query_params = {
            "KeyConditionExpression": Key("status").eq("LATEST"),
            "Limit": 1,
            "ScanIndexForward": False
        }
        
        # Add index if provided
        if index_name:
            query_params["IndexName"] = index_name
        
        # Query the table
        response = table.query(**query_params)
        
        # Check if any items were found
        if not response.get("Items") or len(response["Items"]) == 0:
            return {
                "errors": [
                    {
                        "message": "No stats found",
                        "type": "NotFound"
                    }
                ]
            }
        
        # Get the first item
        item = response["Items"][0]
        
        # Parse JSON string fields into objects
        json_fields = [
            "brandNameDistribution", 
            "countryDistribution", 
            "productTypeDistribution",
            "disconnectDistribution",
            "groupDistribution",
            "deviceTypeDistribution",
            "versionDistribution"
        ]

        for field in json_fields:
            if field in item and isinstance(item[field], str):
                try:
                    item[field] = json.loads(item[field])
                    logger.debug(f"Parsed {field} from JSON string to object", extra={
                        f"{field}": item[field]
                    })
                except json.JSONDecodeError:
                    logger.warning(f"Failed to parse {field} as JSON, using empty object")
                    item[field] = {}
        
        logger.debug("Got latest device stats", extra={"stats": item})
        return {"data": item}
    
    except Exception as e:
        logger.error(f"Error getting latest stats: {str(e)}")
        return {
            "errors": [
                {
                    "message": f"Error getting latest stats: {str(e)}",
                    "type": "UnknownError"
                }
            ]
        }

@tracer.capture_lambda_handler
@logger.inject_lambda_context(log_event=True)
@metrics.log_metrics(capture_cold_start_metric=True)
def handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """
    Handle AppSync resolver request for getting latest device statistics.
    
    Args:
        event: AppSync resolver event
        context: Lambda context
        
    Returns:
        AppSync resolver response with latest device statistics
    """
    try:
        # Get latest stats
        result = get_latest_stats()
        
        # Return the result directly as it's already in the correct format
        return result
    
    except Exception as error:
        # Log the error
        logger.exception("Resolver execution failed")
        
        # Return error response
        return {
            "errors": [
                {
                    "message": f"Resolver execution failed: {str(error)}",
                    "type": "UnknownError"
                }
            ]
        }

# Entry point for AWS Lambda
lambda_handler = handler