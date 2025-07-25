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

"""Lambda handler for get-defender-metric-data resolver."""
import datetime
from typing import Any, Dict, List, Optional

import boto3
from aws_lambda_powertools.utilities.typing import LambdaContext

from shared_lib.powertools import logger, tracer, metrics
from shared_lib.appsync_utils import create_response, create_error_response

# Initialize IoT client
iot_client = boto3.client('iot')

# Metric name mapping
METRIC_NAME_MAPPING = {
    "AUTHORIZATION_FAILURES": "aws:num-authorization-failures",
    "CONNECTION_ATTEMPTS": "aws:num-connection-attempts",
    "DISCONNECTS": "aws:num-disconnects",
    "DISCONNECT_DURATION": "aws:disconnect-duration"
}

def get_defender_metric_data(
    thing_name: str,
    metric_type: str,
    start_unix_time: Optional[str],
    end_unix_time: Optional[str]
) -> List[Dict[str, Any]]:
    """
    Get defender metrics from IoT Core.
    
    Args:
        thing_name: IoT thing name
        metric_type: Type of metric to retrieve
        start_unix_time: Start time in ISO format
        end_unix_time: End time in ISO format
        
    Returns:
        List of metric data points
    """
    logger.debug("Getting defender metrics", extra={"thing_name": thing_name, "type": metric_type})
    
    # Get metric name from mapping
    metric_name = METRIC_NAME_MAPPING.get(metric_type)
    if not metric_name:
        raise ValueError(f"Invalid metric type: {metric_type}")
    
    # Parse start and end times
    start_time = datetime.datetime.fromisoformat(start_unix_time.replace('Z', '+00:00')) if start_unix_time else datetime.datetime.fromtimestamp(0, tz=datetime.timezone.utc)
    end_time = datetime.datetime.fromisoformat(end_unix_time.replace('Z', '+00:00')) if end_unix_time else datetime.datetime.now(datetime.timezone.utc)
    
    results = []
    next_token = None
    
    try:
        while True:
            # Build request parameters
            params = {
                "thingName": thing_name,
                "metricName": metric_name,
                "startTime": start_time,
                "endTime": end_time,
                "maxResults": 250
            }
            
            if next_token:
                params["nextToken"] = next_token
            
            # Get metric data
            logger.debug(f"Calling list_metric_values with params: {params}")
            result = iot_client.list_metric_values(**params)
            next_token = result.get("nextToken")
            
            # Log the raw response for debugging
            logger.debug(f"Raw metric data response: {result}")
            
            # Check if we got any data
            if not result.get("metricDatumList"):
                logger.info(f"No metric data found for {thing_name}, metric: {metric_name}")
            else:
                logger.info(f"Found {len(result.get('metricDatumList', []))} data points for {thing_name}, metric: {metric_name}")
            
            # Process results
            for datum in result.get("metricDatumList", []):
                timestamp = datum.get("timestamp")
                value_obj = datum.get("value", {})
                
                # Extract the appropriate value based on metric type
                if metric_type == "DISCONNECT_DURATION":
                    # Disconnect duration uses seconds
                    value = value_obj.get("seconds", 0)
                else:
                    # Other metrics use count
                    value = value_obj.get("count", 0)
                
                logger.debug(f"Processing datum: timestamp={timestamp}, value_obj={value_obj}, extracted_value={value}")
                
                if timestamp:
                    results.append({
                        "metric": metric_name,
                        "timestamp": timestamp.isoformat().replace('+00:00', 'Z'),  # Format as AWSDateTime
                        "value": float(value)  # Ensure value is a Float
                    })
            
            if not next_token:
                break
    
    except iot_client.exceptions.ResourceNotFoundException:
        logger.warning(f"Thing {thing_name} not found")
        return []
    except iot_client.exceptions.InvalidRequestException as e:
        logger.warning(f"Invalid request for defender metrics: {str(e)}")
        return []
    except Exception as e:
        logger.error(f"Error getting defender metrics: {str(e)}")
        # Return empty list instead of raising exception for better UX
        return []
    
    logger.debug("Got defender metrics", extra={"thing_name": thing_name, "type": metric_type, "count": len(results)})
    return results

@tracer.capture_lambda_handler
@logger.inject_lambda_context(log_event=True)
@metrics.log_metrics(capture_cold_start_metric=True)
def handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """
    Handle AppSync resolver request for getting Defender metric data.
    
    Args:
        event: AppSync resolver event
        context: Lambda context
        
    Returns:
        AppSync resolver response
    """
    try:
        # Extract arguments
        thing_name = event.get("arguments", {}).get("thingName")
        metric_type = event.get("arguments", {}).get("type")
        start_time = event.get("arguments", {}).get("startTime")
        end_time = event.get("arguments", {}).get("endTime")
        
        # Validate required arguments
        if not thing_name:
            return create_error_response("Missing required argument: thingName")
        if not metric_type:
            return create_error_response("Missing required argument: type")
        
        # Get defender metric data
        data = get_defender_metric_data(thing_name, metric_type, start_time, end_time)
        
        # Ensure we always return a list (even if empty)
        if not isinstance(data, list):
            logger.warning(f"Expected list but got {type(data)}, converting to empty list")
            data = []
        
        # Return the data directly (not wrapped in create_response for AppSync direct resolvers)
        return data
    
    except Exception as error:
        # Log the error
        logger.exception("Resolver execution failed")
        
        # For AppSync direct resolvers, we need to raise the exception
        # rather than return an error response
        raise error

# Entry point for AWS Lambda
lambda_handler = handler
