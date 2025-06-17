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

"""Lambda handler for get-job-execution-list resolver."""
from typing import Any, Dict, List, Optional

import boto3
from aws_lambda_powertools.utilities.typing import LambdaContext

from shared_lib.powertools import logger, tracer, metrics
from shared_lib.appsync_utils import create_response, create_error_response

# Initialize IoT client
iot_client = boto3.client('iot')

def get_job_executions_for_job(
    job_id: str,
    max_results: Optional[int],
    next_token: Optional[str]
) -> Dict[str, Any]:
    """
    Get job executions for a specific job from IoT Core.
    
    Args:
        job_id: IoT job ID
        max_results: Maximum number of results to return
        next_token: Token for pagination
        
    Returns:
        Paginated job executions
    """
    logger.debug("Getting execution list", extra={"job_id": job_id, "max_results": max_results, "next_token": next_token})
    
    # Prepare request parameters
    params = {
        "jobId": job_id,
        "maxResults": min(max_results or 250, 250)
    }
    
    if next_token:
        params["nextToken"] = next_token
    
    # Get job executions
    result = iot_client.list_job_executions_for_job(**params)
    
    # Process results
    items = []
    for execution in result.get("executionSummaries", []):
        thing_arn = execution.get("thingArn", "")
        thing_name = thing_arn.split("/")[1] if thing_arn and "/" in thing_arn else ""
        
        job_execution_summary = execution.get("jobExecutionSummary", {})
        
        # Format timestamps
        last_updated_at = job_execution_summary.get("lastUpdatedAt")
        if last_updated_at:
            last_updated_at = last_updated_at.isoformat()
        
        queued_at = job_execution_summary.get("queuedAt")
        if queued_at:
            queued_at = queued_at.isoformat()
        
        started_at = job_execution_summary.get("startedAt")
        if started_at:
            started_at = started_at.isoformat()
        
        # Create job execution object
        job_execution = {
            "jobId": job_id,
            "thingName": thing_name,
            "executionNumber": job_execution_summary.get("executionNumber", 0),
            "lastUpdatedAt": last_updated_at or "",
            "queuedAt": queued_at or "",
            "retryAttempt": job_execution_summary.get("retryAttempt", 0),
            "startedAt": started_at,
            "status": job_execution_summary.get("status", "")
        }
        
        items.append(job_execution)
    
    logger.debug("Got execution list", extra={"count": len(items)})
    return {
        "items": items,
        "nextToken": result.get("nextToken")
    }

def get_job_executions_for_thing(
    thing_name: str,
    max_results: Optional[int],
    next_token: Optional[str]
) -> Dict[str, Any]:
    """
    Get job executions for a specific thing from IoT Core.
    
    Args:
        thing_name: IoT thing name
        max_results: Maximum number of results to return
        next_token: Token for pagination
        
    Returns:
        Paginated job executions
    """
    logger.debug("Getting execution list", extra={"thing_name": thing_name, "max_results": max_results, "next_token": next_token})
    
    # Prepare request parameters
    params = {
        "thingName": thing_name,
        "maxResults": min(max_results or 250, 250)
    }
    
    if next_token:
        params["nextToken"] = next_token
    
    # Get job executions
    result = iot_client.list_job_executions_for_thing(**params)
    
    # Process results
    items = []
    for execution in result.get("executionSummaries", []):
        job_id = execution.get("jobId", "")
        job_execution_summary = execution.get("jobExecutionSummary", {})
        
        # Format timestamps
        last_updated_at = job_execution_summary.get("lastUpdatedAt")
        if last_updated_at:
            last_updated_at = last_updated_at.isoformat()
        
        queued_at = job_execution_summary.get("queuedAt")
        if queued_at:
            queued_at = queued_at.isoformat()
        
        started_at = job_execution_summary.get("startedAt")
        if started_at:
            started_at = started_at.isoformat()
        
        # Create job execution object
        job_execution = {
            "jobId": job_id,
            "thingName": thing_name,
            "executionNumber": job_execution_summary.get("executionNumber", 0),
            "lastUpdatedAt": last_updated_at or "",
            "queuedAt": queued_at or "",
            "retryAttempt": job_execution_summary.get("retryAttempt", 0),
            "startedAt": started_at,
            "status": job_execution_summary.get("status", "")
        }
        
        items.append(job_execution)
    
    logger.debug("Got execution list", extra={"count": len(items)})
    return {
        "items": items,
        "nextToken": result.get("nextToken")
    }

@tracer.capture_lambda_handler
@logger.inject_lambda_context(log_event=True)
@metrics.log_metrics(capture_cold_start_metric=True)
def handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """
    Handle AppSync resolver request for getting job execution list.
    
    Args:
        event: AppSync resolver event
        context: Lambda context
        
    Returns:
        AppSync resolver response
    """
    try:
        # Extract arguments
        job_id = event.get("arguments", {}).get("jobId")
        thing_name = event.get("arguments", {}).get("thingName")
        limit = event.get("arguments", {}).get("limit")
        next_token = event.get("arguments", {}).get("nextToken")
        
        # Determine which function to call based on provided arguments
        if job_id:
            result = get_job_executions_for_job(job_id, limit, next_token)
        elif thing_name:
            result = get_job_executions_for_thing(thing_name, limit, next_token)
        else:
            return create_error_response("Missing required argument: either jobId or thingName must be provided")
        
        # Return successful response
        return create_response(result)
    
    except Exception as error:
        # Log the error
        logger.exception("Resolver execution failed")
        
        # Return error response
        return create_error_response(error)

# Entry point for AWS Lambda
lambda_handler = handler