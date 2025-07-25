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

"""Lambda handler for get-cloudwatch-metric-data resolver."""
import datetime
from typing import Any, Dict, List, Optional

import boto3
from aws_lambda_powertools.utilities.typing import LambdaContext

from shared_lib.powertools import logger, tracer, metrics
from shared_lib.appsync_utils import create_response, create_error_response

# Initialize CloudWatch client
cloudwatch_client = boto3.client('cloudwatch')

def get_connectivity_metrics(
    metric_names: List[str],
    period: Optional[int] = 24 * 60 * 60,  # 1 day
    start_time: Optional[datetime.datetime] = None,
    expression: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Get connectivity metrics from CloudWatch.
    
    Args:
        metric_names: List of metric names to retrieve
        period: Period in seconds for each datapoint
        start_time: Start time for the query
        expression: Optional expression for metric math
        
    Returns:
        List of metric data points
    """
    logger.debug("Getting connectivity metrics", extra={"metric_names": metric_names})
    
    # Set default start time if not provided
    if not start_time:
        start_time = datetime.datetime(2022, 1, 1, tzinfo=datetime.timezone.utc)
    
    end_time = datetime.datetime.now(datetime.timezone.utc)
    results = []
    next_token = None
    
    try:
        while True:
            # Build metric data queries
            metric_data_queries = []
            
            # Add metric queries
            for i, metric_name in enumerate(metric_names):
                metric_data_queries.append({
                    'Id': f'm{i+1}',
                    'Label': metric_name,
                    'ReturnData': not expression,
                    'MetricStat': {
                        'Metric': {
                            'Namespace': 'IoTFleetMetrics',
                            'MetricName': metric_name,
                            'Dimensions': [
                                {
                                    'Name': 'AggregationType',
                                    'Value': 'count'
                                }
                            ]
                        },
                        'Period': period,
                        'Stat': 'Maximum'
                    }
                })
            
            # Add expression if provided
            if expression:
                metric_data_queries.append({
                    'Id': 'e1',
                    'Label': 'expression',
                    'Expression': expression
                })
            
            # Build request parameters
            params = {
                'StartTime': start_time,
                'EndTime': end_time,
                'MetricDataQueries': metric_data_queries
            }
            
            if next_token:
                params['NextToken'] = next_token
            
            # Get metric data
            result = cloudwatch_client.get_metric_data(**params)
            next_token = result.get('NextToken')
            
            # Process results
            for metric in result.get('MetricDataResults', []):
                timestamps = metric.get('Timestamps', [])
                values = metric.get('Values', [])
                
                if len(timestamps) != len(values):
                    raise ValueError('Timestamps and Values length mismatch')
                
                for i, timestamp in enumerate(timestamps):
                    results.append({
                        'metric': metric.get('Label', ''),
                        'timestamp': timestamp.isoformat(),
                        'value': values[i] if i < len(values) else 0
                    })
            
            if not next_token:
                break
    
    except Exception as e:
        logger.error(f"Error getting CloudWatch metrics: {str(e)}")
        raise
    
    logger.debug("Got connectivity metrics", extra={"count": len(results)})
    return results

@tracer.capture_lambda_handler
@logger.inject_lambda_context(log_event=True)
@metrics.log_metrics(capture_cold_start_metric=True)
def handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """
    Handle AppSync resolver request for getting CloudWatch metric data.
    
    Args:
        event: AppSync resolver event
        context: Lambda context
        
    Returns:
        AppSync resolver response
    """
    try:
        # Extract arguments
        metric_type = event.get("arguments", {}).get("type")
        period = event.get("arguments", {}).get("period")
        start_str = event.get("arguments", {}).get("start")
        
        # Parse start time if provided
        start_time = None
        if start_str:
            start_time = datetime.datetime.fromisoformat(start_str.replace('Z', '+00:00'))
        
        # Process based on metric type
        if metric_type == "CONNECTED_DEVICES":
            data = get_connectivity_metrics(
                [
                    'iotconnectivitydashboard-connected-device-count',
                    'iotconnectivitydashboard-disconnected-device-count'
                ],
                period,
                start_time
            )
            return create_response(data)
        
        elif metric_type == "DISCONNECT_RATE":
            # Use the pre-calculated disconnect rate metric
            data = get_connectivity_metrics(
                [
                    'iotconnectivitydashboard-disconnection-rate'
                ],
                period,
                start_time
            )
            return create_response(data)
        
        else:
            # Default case
            return create_response([])
    
    except Exception as error:
        # Log the error
        logger.exception("Resolver execution failed")
        
        # Return error response
        return create_error_response(error)

# Entry point for AWS Lambda
lambda_handler = handler