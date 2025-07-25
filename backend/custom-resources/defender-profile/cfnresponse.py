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

import json
import logging
import urllib.request

# Response status constants
SUCCESS = "SUCCESS"
FAILED = "FAILED"

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def send(event, context, response_status, response_data, physical_resource_id=None, no_echo=False):
    """
    Send a response to CloudFormation regarding the success or failure of a custom resource.
    
    Args:
        event: The Lambda event
        context: The Lambda context
        response_status: SUCCESS or FAILED
        response_data: Dict containing response data
        physical_resource_id: Custom resource physical ID
        no_echo: Whether to mask the response
    """
    response_url = event['ResponseURL']

    logger.info(f"CFN response URL: {response_url}")

    response_body = {
        'Status': response_status,
        'Reason': f"See the details in CloudWatch Log Stream: {context.log_stream_name}" if context else "Local execution",
        'PhysicalResourceId': physical_resource_id or context.log_stream_name if context else "local-resource-id",
        'StackId': event.get('StackId', ''),
        'RequestId': event.get('RequestId', ''),
        'LogicalResourceId': event.get('LogicalResourceId', ''),
        'NoEcho': no_echo,
        'Data': response_data
    }

    json_response_body = json.dumps(response_body)
    
    logger.info(f"Response body: {json_response_body}")
    
    headers = {
        'content-type': '',
        'content-length': str(len(json_response_body))
    }
    
    try:
        req = urllib.request.Request(
            url=response_url,
            data=json_response_body.encode('utf-8'),
            headers=headers,
            method='PUT'
        )
        
        with urllib.request.urlopen(req) as response:
            logger.info(f"Status code: {response.status}")
            logger.info(f"Status message: {response.msg}")
            
    except Exception as e:
        logger.error(f"Error sending response: {str(e)}")
