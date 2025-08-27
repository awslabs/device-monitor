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

"""Lambda handler for get-job-details resolver."""
from typing import Any, Dict, Optional

import boto3
from aws_lambda_powertools.utilities.typing import LambdaContext

from shared_lib.powertools import logger, tracer, metrics
from shared_lib.appsync_utils import create_response, create_error_response

# Initialize IoT client
iot_client = boto3.client('iot')

def get_job_details(job_id: str) -> Dict[str, Any]:
    """
    Get job details from IoT Core.
    
    Args:
        job_id: IoT job ID
        
    Returns:
        Job details
    """
    logger.debug("Getting job details", extra={"job_id": job_id})
    
    try:
        # Get job details from IoT Core
        response = iot_client.describe_job(jobId=job_id)
        job = response.get("job")
        
        if not job:
            raise ValueError("Job not found")
        
        # Extract job details
        job_details = {
            "abortThresholdPercentage": None,
            "baseRatePerMinute": None,
            "completedAt": None,
            "createdAt": job.get("createdAt").isoformat() if job.get("createdAt") else None,
            "description": job.get("description"),
            "inProgressTimeoutInMinutes": None,
            "isConcurrent": job.get("isConcurrent", False),
            "lastUpdatedAt": job.get("lastUpdatedAt").isoformat() if job.get("lastUpdatedAt") else None,
            "maximumRatePerMinute": None,
            "numberOfRetries": None,
            "stats": {
                "canceled": job.get("jobProcessDetails", {}).get("numberOfCanceledThings", 0),
                "failed": job.get("jobProcessDetails", {}).get("numberOfFailedThings", 0),
                "inProgress": job.get("jobProcessDetails", {}).get("numberOfInProgressThings", 0),
                "queued": job.get("jobProcessDetails", {}).get("numberOfQueuedThings", 0),
                "rejected": job.get("jobProcessDetails", {}).get("numberOfRejectedThings", 0),
                "removed": job.get("jobProcessDetails", {}).get("numberOfRemovedThings", 0),
                "succeeded": job.get("jobProcessDetails", {}).get("numberOfSucceededThings", 0),
                "timedOut": job.get("jobProcessDetails", {}).get("numberOfTimedOutThings", 0)
            },
            "status": job.get("status", "IN_PROGRESS"),
            "targets": job.get("targets", []),
            "targetSelection": job.get("targetSelection", "CONTINUOUS")
        }
        
        # Extract optional fields
        if job.get("completedAt"):
            job_details["completedAt"] = job["completedAt"].isoformat()
        
        # Extract abort config
        if job.get("abortConfig") and job["abortConfig"].get("criteriaList"):
            for criteria in job["abortConfig"]["criteriaList"]:
                if "thresholdPercentage" in criteria:
                    job_details["abortThresholdPercentage"] = criteria["thresholdPercentage"]
                    break
        
        # Extract rollout config
        if job.get("jobExecutionsRolloutConfig"):
            rollout_config = job["jobExecutionsRolloutConfig"]
            
            if rollout_config.get("maximumPerMinute"):
                job_details["maximumRatePerMinute"] = rollout_config["maximumPerMinute"]
            
            if rollout_config.get("exponentialRate") and rollout_config["exponentialRate"].get("baseRatePerMinute"):
                job_details["baseRatePerMinute"] = rollout_config["exponentialRate"]["baseRatePerMinute"]
        
        # Extract timeout config
        if job.get("timeoutConfig") and "inProgressTimeoutInMinutes" in job["timeoutConfig"]:
            job_details["inProgressTimeoutInMinutes"] = job["timeoutConfig"]["inProgressTimeoutInMinutes"]
        
        # Extract retry config
        if job.get("jobExecutionsRetryConfig") and job["jobExecutionsRetryConfig"].get("criteriaList"):
            for criteria in job["jobExecutionsRetryConfig"]["criteriaList"]:
                if "numberOfRetries" in criteria:
                    job_details["numberOfRetries"] = criteria["numberOfRetries"]
                    break
        
        logger.debug("Got job details", extra={"job_id": job_id})
        return job_details
    
    except Exception as e:
        logger.error(f"Error getting job details: {str(e)}")
        raise

@tracer.capture_lambda_handler
@logger.inject_lambda_context(log_event=True)
@metrics.log_metrics(capture_cold_start_metric=True)
def handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """
    Handle AppSync resolver request for getting job details.
    
    Args:
        event: AppSync resolver event
        context: Lambda context
        
    Returns:
        AppSync resolver response
    """
    try:
        # Extract job ID from arguments
        job_id = event.get("arguments", {}).get("jobId")
        
        # Validate required arguments
        if not job_id:
            return create_error_response("Missing required argument: jobId")
        
        # Get job details
        job_details = get_job_details(job_id)
        
        # Return successful response
        return create_response(job_details)
    
    except Exception as error:
        # Log the error
        logger.exception("Resolver execution failed")
        
        # Return error response
        return create_error_response(error)

# Entry point for AWS Lambda
lambda_handler = handler