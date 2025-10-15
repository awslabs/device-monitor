# Device Monitor Device Simulator

This device simulator creates and manages virtual IoT devices that connect to AWS IoT Core and simulate real-world device behavior. The simulator is designed to work with the Device Monitor application, generating devices with the appropriate structure, attributes, and behaviors.

## Features

- Simulates multiple IoT devices connecting to AWS IoT Core
- Creates and manages device certificates and policies
- Publishes device state as retained MQTT messages
- Updates device shadows (classic, $package, and schedule)
- Simulates random disconnections and reconnections
- Supports different device categories (sensors, actuators, gateways)
- Generates realistic device attributes and metadata
- Creates and manages thing types and thing groups

## Device Structure

The simulator creates devices with the following components:

### Core Device Properties
- `thingName`: Unique identifier for the IoT device
- `deviceType`: Type of device (stored as thingTypeName in AWS IoT)
- `connected`: Boolean indicating current connection status
- `lastConnectedAt`: Timestamp of last connection
- `disconnectReason`: Reason for disconnection, if applicable

### Device Metadata
- `provisioningTimestamp`: When the device was provisioned in the system
- `productionTimestamp`: When the device was manufactured
- `brandName`: randomly generated brand name
- `country`: Country where the device is located
- `hasApplianceFW`: Boolean indicating if the device has appliance firmware

### Firmware Information
- `firmwareType`: Type of firmware running on the device
- `firmwareVersion`: Version of the firmware

### Device Shadows
The simulator maintains 4 types of shadows for each device:
1. **Classic Shadow**
2. **State**: Contains the main device state
2. **$package Shadow**: Contains firmware information
3. **Schedule Shadow**: Contains scheduling information

### Retained Topics
Devices publish to retained topics with the following patterns:
- `device/+/state`: Device state information
- `things/+/topics/info`: Device information
- `things/+/topics/meta`: Device metadata
- `things/+/topics/sensor`: Sensor readings

## Configuration

The simulator is configured using the `dev-config.yaml` file, which includes:

- AWS IoT Core endpoint and region
- Simulation parameters (device count, update intervals, etc.)
- Thing groups and thing types to create
- Device identification settings
- Hardware and firmware versions
- Network types
- Device types by category
- Location and country information
- Brand information
- Shadow configuration
- Retained message configuration

## Usage

1. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Configure AWS credentials:
   ```
   aws configure
   ```

3. Run the simulator:
   ```
   python main.py
   ```

4. Optional parameters:
   ```
   python main.py --config custom-config.yaml
   ```

## Integration with Device Monitor

This simulator is specifically designed to work with the Device Monitor application. It generates devices with the exact structure and attributes expected by Device Monitor, including:

- Proper thing attributes for filtering and searching
- Correct shadow structure for state management
- Retained topics in the expected format
- Firmware types that match Device Monitor expectations
- Brand names from the Device Monitor enumeration

The simulator helps test and develop the Device Monitor application by providing realistic device data and behavior.

## Cleanup

To clean up resources created by the simulator, use the cleanup script:

```
python cleanup.py
```

This will delete all thing groups, thing types, and things created by the simulator.
