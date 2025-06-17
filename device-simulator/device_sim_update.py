"""
This module adds functionality to the device simulator to generate random classic IoT shadows.
To use this, import it after device_sim and call the patch_device_class function.
"""

import json
import random
import time
import boto3
from typing import Any, Dict


def generate_shadow_data(device) -> Dict[str, Any]:
    """
    Generate random shadow data for a device.
    This creates a simple structure with desired and reported states.
    """
    # Add some common fields to both desired and reported state
    desired_state = {
        "powerState": random.choice(["ON", "OFF", "STANDBY"]),
        "mode": random.choice(["AUTO", "MANUAL", "ECONOMY", "BOOST"]),
        "targetTemperature": round(random.uniform(18.0, 26.0), 1),
        "firmwareVersion": device.fw_version,
        "telemetryInterval": random.choice([30, 60, 300, 600])
    }
    
    # Reported state should be slightly different from desired
    reported_state = desired_state.copy()
    
    # Adjust some values to be different from desired
    if random.random() < 0.3:  # 30% chance of having a different value
        reported_state["powerState"] = random.choice(["ON", "OFF", "STANDBY", "ERROR"])
    
    if random.random() < 0.3:
        reported_state["mode"] = random.choice(["AUTO", "MANUAL", "ECONOMY", "BOOST"])
    
    # Current temperature usually differs from target temperature
    reported_state["currentTemperature"] = round(
        reported_state["targetTemperature"] + random.uniform(-2.0, 2.0), 1
    )
    
    # Add basic device info to reported state
    reported_state.update({
        "thingName": device.device_id,
        "serialNumber": device.serial_number,
        "firmwareType": device.firmware_type,
        "brandName": device.brand_name,
        "batteryLevel": random.randint(0, 100),
        "signalStrength": random.randint(0, 100),
        "lastUpdated": int(time.time()),
    })
    
    # Keep the shadow document very simple
    return {
        "desired": desired_state,
        "reported": reported_state
    }


def update_classic_shadow(device):
    """
    Update the classic (unnamed) shadow for the device with random data.
    """
    if not device.connected:
        return
        
    # Get AWS configuration
    from config_loader import config
    aws_config = config.get_aws_config()
    region = aws_config.get("region", "us-west-2")
    
    # Direct update via IoT Data API (bypassing MQTT which may have permission issues)
    try:
        # Generate shadow data
        shadow_data = generate_shadow_data(device)
        
        # Wrap in state object - exactly how AWS IoT expects it
        shadow_doc = {"state": shadow_data}
        
        # Create IoT Data client
        iot_data = boto3.client("iot-data", region_name=region)
        
        # Update shadow using API
        response = iot_data.update_thing_shadow(
            thingName=device.device_id,
            payload=json.dumps(shadow_doc).encode('utf-8')
        )
        
        # Print success message with short excerpt of payload
        payload_str = json.dumps(shadow_doc)
        print(f"{device.device_id}: Updated classic shadow using API - {payload_str[:50]}...")
        
    except Exception as e:
        print(f"{device.device_id}: Error updating classic shadow: {str(e)}")


def patch_device_class():
    """
    Patch the IoTDevice class to add classic shadow generation functionality.
    """
    # Import here to avoid circular imports
    from device_sim import IoTDevice
    
    # Save the original update_shadow method
    original_update_shadow = IoTDevice.update_shadow
    
    # Define the patched method
    def patched_update_shadow(self):
        # Call the original method
        original_update_shadow(self)
        
        # Also update the classic shadow
        update_classic_shadow(self)
    
    # Apply the patch
    IoTDevice.update_shadow = patched_update_shadow
    
    print("IoTDevice class patched to generate classic shadows using IoT Data API")
