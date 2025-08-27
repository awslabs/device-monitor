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

"""Lambda handler for get-retained-topic resolver."""
import json
from typing import Any, Dict

import boto3
from aws_lambda_powertools.utilities.typing import LambdaContext

from shared_lib.powertools import logger, tracer, metrics
from shared_lib.appsync_utils import create_response, create_error_response

# Initialize IoT Data client
iot_data_client = boto3.client('iot-data')

def get_retained_topic(thing_name: str, topic_name: str) -> Dict[str, Any]:
    """
    Get retained topic from IoT Core.
    
    Args:
        thing_name: IoT thing name
        topic_name: Topic name suffix (info, meta, sensor)
        
    Returns:
        Retained topic data
    """
    logger.debug("Getting retained topic", extra={"thing_name": thing_name, "topic_name": topic_name})
    
    # Try multiple topic formats to find retained messages
    topic_formats = [
        f"things/{thing_name}/topics/{topic_name}",  # Original expected format
        f"device/{thing_name}/{topic_name}",         # Device simulator format with suffix
        f"device/{thing_name}/state"                 # Device simulator actual format (for any suffix)
    ]
    
    for topic in topic_formats:
        try:
            logger.debug(f"Trying topic format: {topic}")
            
            # Get the retained message
            response = iot_data_client.get_retained_message(topic=topic)
            
            # Extract payload and timestamp
            payload = response.get("payload")
            last_modified_time = response.get("lastModifiedTime")
            
            # Decode and parse the payload
            if payload:
                payload_json = json.loads(payload.decode('utf-8'))
            else:
                payload_json = {}
            
            # Create the result
            result = {
                "topic": topic,
                "payload": payload_json,
                "timestamp": last_modified_time or 0
            }
            
            logger.info(f"Found retained topic data at: {topic}")
            return result
            
        except iot_data_client.exceptions.ResourceNotFoundException:
            logger.debug(f"No retained message found for topic: {topic}")
            continue
        except Exception as e:
            logger.warning(f"Error checking topic {topic}: {str(e)}")
            continue
    
    # If no topic format worked, return empty result
    logger.warning(f"No retained message found for {thing_name} with suffix {topic_name} in any format")
    return {
        "topic": f"things/{thing_name}/topics/{topic_name}",  # Return expected format in response
        "payload": {},
        "timestamp": 0
    }

@tracer.capture_lambda_handler
@logger.inject_lambda_context(log_event=True)
@metrics.log_metrics(capture_cold_start_metric=True)
def handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """
    Handle AppSync resolver request for getting retained topic.
    
    Args:
        event: AppSync resolver event
        context: Lambda context
        
    Returns:
        AppSync resolver response
    """
    try:
        # Extract arguments
        thing_name = event.get("arguments", {}).get("thingName")
        topic_name = event.get("arguments", {}).get("topicName")
        
        # Validate required arguments
        if not thing_name:
            return create_error_response("Missing required argument: thingName")
        if not topic_name:
            return create_error_response("Missing required argument: topicName")
        
        # Get retained topic
        result = get_retained_topic(thing_name, topic_name)
        
        # Return successful response
        return create_response(result)
    
    except Exception as error:
        # Log the error
        logger.exception("Resolver execution failed")
        
        # Return error response
        return create_error_response(error)

# Entry point for AWS Lambda
lambda_handler = handler