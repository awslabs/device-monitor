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

from datetime import datetime, timezone
import time
import argparse
import os
import sys
import resource

from device_sim import IoTDevice, device_simulation
from config_loader import config, load_config
import threading
from concurrent.futures import ThreadPoolExecutor


def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description="IoT Device Simulator")
    parser.add_argument(
        "--config",
        type=str,
        default="dev-config.yaml",
        help="Path to configuration file (default: dev-config.yaml)",
    )
    parser.add_argument(
        "--max-devices",
        type=int,
        default=0,
        help="Maximum number of devices to simulate (overrides config)",
    )
    parser.add_argument(
        "--max-workers",
        type=int,
        default=0,
        help="Maximum number of concurrent worker threads (default: min(32, device_count))",
    )
    return parser.parse_args()


def increase_file_descriptor_limit():
    """Attempt to increase the file descriptor limit"""
    try:
        # Get current soft and hard limits
        soft, hard = resource.getrlimit(resource.RLIMIT_NOFILE)
        print(f"Current file descriptor limits: soft={soft}, hard={hard}")
        
        # Try to increase to hard limit or a reasonable value
        new_soft = min(hard, 4096)
        resource.setrlimit(resource.RLIMIT_NOFILE, (new_soft, hard))
        
        # Verify the new limits
        soft, hard = resource.getrlimit(resource.RLIMIT_NOFILE)
        print(f"Updated file descriptor limits: soft={soft}, hard={hard}")
    except Exception as e:
        print(f"Warning: Could not increase file descriptor limit: {e}")


def main():
    """Main function to run the simulation"""
    # Try to increase file descriptor limit
    increase_file_descriptor_limit()
    
    # Print debug information to help with troubleshooting
    print(f"Python executable: {sys.executable}")
    print(f"Current file: {__file__}")
    
    # Parse command line arguments
    args = parse_arguments()

    # Load configuration from specified file
    if args.config != "dev-config.yaml":
        load_config(args.config)
    else:
        load_config()
    
    # Initialize IoT resources (thing groups and thing types) first
    from device_sim import initialize_iot_resources
    thing_groups, thing_types = initialize_iot_resources()
    print(f"Created {len(thing_groups)} thing groups and {len(thing_types)} thing types")
    
    # Import and apply the classic shadow patch
    from device_sim_update import patch_device_class
    patch_device_class()
    print("Classic shadow generation functionality added")
    
    # Get device count from config
    sim_config = config.get_simulation_config()
    device_count = sim_config.get("device_count", 1)
    
    # Override with command line argument if provided
    if args.max_devices > 0:
        device_count = min(device_count, args.max_devices)
    
    # Determine max workers - limit to avoid too many concurrent connections
    max_workers = args.max_workers if args.max_workers > 0 else min(32, device_count)
    
    print(f"Starting simulation with {device_count} devices using {max_workers} worker threads")
    print(f"Using configuration from: {args.config}")

    # Create devices based on config - after thing groups and types are created
    devices = [IoTDevice(i) for i in range(device_count)]
    
    # Start device simulations in batches to avoid overwhelming the system
    batch_size = max_workers
    for i in range(0, device_count, batch_size):
        batch_devices = devices[i:i+batch_size]
        print(f"Starting batch of {len(batch_devices)} devices ({i+1}-{i+len(batch_devices)} of {device_count})")
        
        # Start device simulations in thread pool
        with ThreadPoolExecutor(max_workers=len(batch_devices)) as executor:
            futures = [executor.submit(device_simulation, device) for device in batch_devices]
            
            # Wait for all simulations in this batch to complete
            for future in futures:
                try:
                    future.result()
                except Exception as e:
                    print(f"Device simulation failed: {e}")


# This ensures the code is only run when this file is executed directly
if __name__ == "__main__":
    # Add a debug print to confirm this code is being executed
    print("Debug: main.py is being executed directly")
    
    # Force a small delay to give debugger time to attach
    time.sleep(0.1)
    
    # Call the main function
    main()
    
    # Add another debug point at the end
    print("Debug: main.py execution completed")
