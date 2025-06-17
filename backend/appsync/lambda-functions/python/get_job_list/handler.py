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

"""Lambda handler for get-job-list resolver."""
from typing import Any, Dict, List, Optional

import boto3
from aws_lambda_powertools.utilities.typing import LambdaContext

from shared_lib.powertools import logger, tracer, metrics
from shared_lib.appsync_utils import create_response, create_error_response

# Initialize IoT client
iot_client = boto3.client('iot')

def get_jobs_list(
    max_results: Optional[int],
    next_token: Optional[str]
) -> Dict[str, Any]:
    """
    Get list of jobs from IoT Core.
    
    Args:
        max_results: Maximum number of results to return
        next_token: Token for pagination
        
    Returns:
        Paginated jobs list
    """
    logger.debug("Getting jobs list", extra={"max_results": max_results, "next_token": next_token})
    
    try:
        # Prepare request parameters
        params = {
            "maxResults": min(max_results or 250, 250)
        }
        
        if next_token:
            params["nextToken"] = next_token
        
        # Get jobs list
        result = iot_client.list_jobs(**params)
        
        logger.debug(f"Found {len(result.get('jobs', []))} total jobs")
        
        # Process results
        items = []
        for job in result.get("jobs", []):
            # Format timestamps
            created_at = job.get("createdAt")
            if created_at:
                created_at = created_at.isoformat()
            
            last_updated_at = job.get("lastUpdatedAt")
            if last_updated_at:
                last_updated_at = last_updated_at.isoformat()
            
            completed_at = job.get("completedAt")
            if completed_at:
                completed_at = completed_at.isoformat()
            else:
                completed_at = None
            
            # Create job summary object
            job_summary = {
                "jobArn": job.get("jobArn", ""),
                "jobId": job.get("jobId", ""),
                "completedAt": completed_at,
                "createdAt": created_at,
                "isConcurrent": job.get("isConcurrent", False),
                "lastUpdatedAt": last_updated_at,
                "status": job.get("status", "SCHEDULED"),
                "targetSelection": job.get("targetSelection", "CONTINUOUS")
            }
            
            items.append(job_summary)
        
        logger.debug("Returning all jobs without filtering", extra={
            "totalJobs": len(result.get("jobs", [])),
            "returnedJobs": len(items)
        })
        
        return {
            "items": items,
            "nextToken": result.get("nextToken")
        }
    
    except Exception as e:
        logger.error(f"Error getting jobs list: {str(e)}")
        # In case of error, return an empty list
        return {
            "items": [],
            "nextToken": None
        }

@tracer.capture_lambda_handler
@logger.inject_lambda_context(log_event=True)
@metrics.log_metrics(capture_cold_start_metric=True)
def handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """
    Handle AppSync resolver request for getting jobs list.
    
    Args:
        event: AppSync resolver event
        context: Lambda context
        
    Returns:
        AppSync resolver response
    """
    try:
        # Extract arguments
        limit = event.get("arguments", {}).get("limit")
        next_token = event.get("arguments", {}).get("nextToken")
        
        # Get jobs list
        result = get_jobs_list(limit, next_token)
        
        # Return successful response
        return create_response(result)
    
    except Exception as error:
        # Log the error
        logger.exception("Resolver execution failed")
        
        # Return error response
        return create_error_response(error)

# Entry point for AWS Lambda
lambda_handler = handler