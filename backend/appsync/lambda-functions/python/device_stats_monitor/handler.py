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

"""Lambda handler for device-stats-monitor."""
import os
import json
import time
import datetime
from typing import Any, Dict, List, Optional

import boto3
import requests
from aws_lambda_powertools.utilities.typing import LambdaContext

from shared_lib.powertools import logger, tracer, metrics

# Initialize IoT client
iot_client = boto3.client('iot')
cloudwatch = boto3.client('cloudwatch')
dynamodb = boto3.resource('dynamodb')

def search_things(query_string: str) -> Dict[str, Any]:
    """
    Search for things in IoT Core.
    
    Args:
        query_string: Query string to search for
        
    Returns:
        Search results
    """
    logger.debug("Searching for things", extra={"query": query_string})
    
    try:
        # Initialize variables for pagination
        things = []
        next_token = None
        
        # Paginate through results
        while True:
            # Prepare search parameters
            params = {
                "indexName": "AWS_Things",
                "queryString": query_string,
                "maxResults": 250
            }
            
            if next_token:
                params["nextToken"] = next_token
            
            # Execute search
            response = iot_client.search_index(**params)
            
            # Add things to list
            things.extend(response.get("things", []))
            
            # Check if there are more results
            next_token = response.get("nextToken")
            if not next_token:
                break
        
        logger.debug(f"Found {len(things)} things")
        return {"things": things}
    
    except Exception as e:
        logger.error(f"Error searching for things: {str(e)}")
        raise

def get_device_stats() -> Dict[str, Any]:
    """
    Get device statistics from IoT Core.
    
    Returns:
        Device statistics
    """
    logger.debug("Getting device statistics")
    
    try:
        # Get all things
        all_things_result = search_things("*")
        all_things = all_things_result.get("things", [])
        
        # Get connected things
        connected_things_result = search_things("connectivity.connected:true")
        connected_things = connected_things_result.get("things", [])
        
        # Calculate counts
        registered_devices = len(all_things)
        connected_devices = len(connected_things)
        disconnected_devices = registered_devices - connected_devices
        
        # Initialize distribution dictionaries
        brand_name_distribution = {}
        country_distribution = {}
        product_type_distribution = {}
        disconnect_distribution = {}
        group_distribution = {}
        device_type_distribution = {}
        version_distribution = {"Firmware": {}}
        
        # Process all things
        for thing in all_things:
            # Extract attributes
            attributes = thing.get("attributes", {})
            
            # Brand name distribution
            brand_name = attributes.get("brandName", "Unknown")
            brand_name_distribution[brand_name] = brand_name_distribution.get(brand_name, 0) + 1
            
            # Country distribution
            country = attributes.get("country", "Unknown")
            country_distribution[country] = country_distribution.get(country, 0) + 1
            
            # Product type distribution
            product_type = attributes.get("productType", "Unknown")
            product_type_distribution[product_type] = product_type_distribution.get(product_type, 0) + 1
            
            # Device type distribution
            device_type = attributes.get("deviceType", "Unknown")
            device_type_distribution[device_type] = device_type_distribution.get(device_type, 0) + 1
            
            # Firmware version distribution
            firmware_version = attributes.get("firmwareVersion", "Unknown")
            if firmware_version != "Unknown":
                version_distribution["Firmware"][firmware_version] = version_distribution["Firmware"].get(firmware_version, 0) + 1
            
            # Group distribution
            thing_name = thing.get("thingName", "")
            if thing_name:
                try:
                    # Get thing groups for this thing
                    groups_response = iot_client.list_thing_groups_for_thing(thingName=thing_name)
                    for group in groups_response.get("thingGroups", []):
                        group_name = group.get("groupName", "Unknown")
                        group_distribution[group_name] = group_distribution.get(group_name, 0) + 1
                except Exception as e:
                    logger.warning(f"Error getting groups for thing {thing_name}: {str(e)}")
        
        # Process disconnected things for disconnect reason
        for thing in all_things:
            if thing.get("connectivity", {}).get("connected", False) is False:
                disconnect_reason = thing.get("connectivity", {}).get("disconnectReason", "Unknown")
                disconnect_distribution[disconnect_reason] = disconnect_distribution.get(disconnect_reason, 0) + 1
        
        # Create device stats object
        current_time = datetime.datetime.now().isoformat()
        device_stats = {
            "status": "LATEST",
            "recordTime": current_time,
            "registeredDevices": registered_devices,
            "connectedDevices": connected_devices,
            "disconnectedDevices": disconnected_devices,
            "brandNameDistribution": json.dumps(brand_name_distribution),
            "countryDistribution": json.dumps(country_distribution),
            "productTypeDistribution": json.dumps(product_type_distribution),
            "disconnectDistribution": json.dumps(disconnect_distribution),
            "groupDistribution": json.dumps(group_distribution),
            "deviceTypeDistribution": json.dumps(device_type_distribution),
            "versionDistribution": json.dumps(version_distribution),
            "ttl": int(time.time()) + (86400 * 30)  # 30 days TTL
        }
        
        logger.debug("Got device statistics", extra={"stats": device_stats})
        return device_stats
    
    except Exception as e:
        logger.error(f"Error getting device statistics: {str(e)}")
        raise

def publish_metrics(device_stats: Dict[str, Any]) -> None:
    """
    Publish device statistics to CloudWatch.
    
    Args:
        device_stats: Device statistics
    """
    logger.debug("Publishing metrics to CloudWatch")
    
    try:
        # Calculate disconnect rate
        registered_devices = device_stats.get("registeredDevices", 0)
        disconnected_devices = device_stats.get("disconnectedDevices", 0)
        disconnect_rate = (disconnected_devices / registered_devices * 100) if registered_devices > 0 else 0
        
        # Create metric data with correct names and namespace for frontend compatibility
        metric_data = [
            {
                'MetricName': 'iotconnectivitydashboard-connected-device-count',
                'Value': device_stats.get("connectedDevices", 0),
                'Unit': 'Count',
                'Dimensions': [
                    {
                        'Name': 'AggregationType',
                        'Value': 'count'
                    }
                ]
            },
            {
                'MetricName': 'iotconnectivitydashboard-disconnected-device-count',
                'Value': device_stats.get("disconnectedDevices", 0),
                'Unit': 'Count',
                'Dimensions': [
                    {
                        'Name': 'AggregationType',
                        'Value': 'count'
                    }
                ]
            },
            {
                'MetricName': 'iotconnectivitydashboard-disconnection-rate',
                'Value': disconnect_rate,
                'Unit': 'Percent',
                'Dimensions': [
                    {
                        'Name': 'AggregationType',
                        'Value': 'count'
                    }
                ]
            },
            {
                'MetricName': 'iotconnectivitydashboard-all-device-count',
                'Value': device_stats.get("registeredDevices", 0),
                'Unit': 'Count',
                'Dimensions': [
                    {
                        'Name': 'AggregationType',
                        'Value': 'count'
                    }
                ]
            }
        ]
        
        # Put metric data to IoTFleetMetrics namespace
        cloudwatch.put_metric_data(
            Namespace='IoTFleetMetrics',
            MetricData=metric_data
        )
        
        logger.debug("Published metrics to CloudWatch")
    
    except Exception as e:
        logger.error(f"Error publishing metrics to CloudWatch: {str(e)}")
        # Don't raise exception to continue with the rest of the function

def save_device_stats_to_dynamodb(device_stats: Dict[str, Any]) -> None:
    """
    Save device statistics directly to DynamoDB.
    
    Args:
        device_stats: Device statistics
    """
    logger.debug("Saving device statistics directly to DynamoDB")
    
    try:
        # Get table name from environment variable
        table_name = os.environ.get("DEVICE_STATS_TABLE")
        if not table_name:
            raise ValueError("DEVICE_STATS_TABLE environment variable is not set")
        
        # Get DynamoDB table
        table = dynamodb.Table(table_name)
        
        # Put item in table
        response = table.put_item(Item=device_stats)
        
        logger.debug("Saved device statistics to DynamoDB", extra={"response": response})
    
    except Exception as e:
        logger.error(f"Error saving device statistics to DynamoDB: {str(e)}")
        # Don't raise exception to continue with the rest of the function

@tracer.capture_lambda_handler
@logger.inject_lambda_context(log_event=True)
@metrics.log_metrics(capture_cold_start_metric=True)
def lambda_handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """
    Handle Lambda event for device statistics monitoring.
    
    Args:
        event: Lambda event
        context: Lambda context
        
    Returns:
        Success message
    """
    try:
        # Get device statistics
        device_stats = get_device_stats()
        
        # Publish metrics to CloudWatch
        publish_metrics(device_stats)
        
        # Save device statistics directly to DynamoDB instead of using AppSync
        save_device_stats_to_dynamodb(device_stats)
        
        return {
            "statusCode": 200,
            "body": "Device statistics updated successfully"
        }
    
    except Exception as error:
        # Log the error
        logger.exception("Device statistics monitoring failed")
        
        # Return error response
        return {
            "statusCode": 500,
            "body": f"Error: {str(error)}"
        }