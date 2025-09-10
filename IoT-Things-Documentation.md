# FleetWatch IoT Things Documentation

This document provides comprehensive details about IoT things (devices) in the FleetWatch system, including their attributes, shadows, metadata, and related functionality.

## Device Data Structure

### Core Device Properties

| Property | Description |
|----------|-------------|
| `thingName` | Unique identifier for the IoT device |
| `deviceType` | Type of device (stored as thingTypeName in AWS IoT) |
| `connected` | Boolean indicating current connection status |
| `lastConnectedAt` | Timestamp of last connection |
| `disconnectReason` | Reason for disconnection, if applicable |
| `attributes` | JSON object containing device attributes |

### Device Metadata

| Property | Description |
|----------|-------------|
| `provisioningTimestamp` | When the device was provisioned in the system |
| `productionTimestamp` | When the device was manufactured |
| `brandName` | Brand of the device |
| `country` | Country where the device is located |
| `hasApplianceFW` | Boolean indicating if the device has appliance firmware |

### Firmware Information

| Property | Description |
|----------|-------------|
| `firmwareType` | Type of firmware running on the device |
| `firmwareVersion` | Version of the firmware |

### Group Membership

| Property | Description |
|----------|-------------|
| `deviceGroups`/`thingGroupNames` | Array of IoT thing groups the device belongs to |

## Device Shadow Structure

Devices maintain state through AWS IoT Device Shadows:

### Shadow Types

| Shadow Name | Description |
|-------------|-------------|
| `state` | Main device state shadow |
| `$package` | Package/firmware information shadow |
| `schedule` | Device scheduling information |
| `classic` | Default shadow (empty name) |

### Shadow State Structure

```json
{
  "state": {
    "desired": { /* desired state properties */ },
    "reported": { /* current device state properties */ },
    "delta": { /* difference between desired and reported */ }
  },
  "metadata": { /* timestamps for state changes */ },
  "version": 123,
  "timestamp": 1621234567890
}
```

### Generic Shadow Payload

The system uses a generic approach to shadow payloads:

```typescript
interface GenericShadowPayload {
  [key: string]: any;
}
```

## Retained Topics

Devices can publish to retained topics with the following suffixes:

| Topic Suffix | Description |
|--------------|-------------|
| `info` | General device information |
| `meta` | Device metadata |
| `sensor` | Sensor readings |

### Retained Topic Structure

```typescript
type RetainedTopic = {
  topic: string;
  payload: AWSJSON;
  timestamp: AWSTimestamp;
}
```

## Device Monitoring Metrics

### CloudWatch Metrics

| Metric Type | Description |
|-------------|-------------|
| `PRODUCED_DEVICES` | Count of manufactured devices |
| `CONNECTED_DEVICES` | Count of currently connected devices |
| `DISCONNECT_RATE` | Rate of device disconnections |

### Defender Metrics

| Metric Type | Description |
|-------------|-------------|
| `AUTHORIZATION_FAILURES` | Failed authorization attempts |
| `CONNECTION_ATTEMPTS` | Device connection attempts |
| `DISCONNECT_DURATION` | Duration of disconnections |
| `DISCONNECTS` | Count of disconnections |

## Device Statistics

The system tracks comprehensive device statistics:

```typescript
type DeviceStats = {
  status: string;
  recordTime: string;
  producedDevices: number;
  registeredDevices: number;
  connectedDevices: number;
  disconnectedDevices: number;
  brandNameDistribution: AWSJSON;
  countryDistribution: AWSJSON;
  productTypeDistribution: AWSJSON;
  disconnectDistribution: AWSJSON;
  groupDistribution: AWSJSON;
  deviceTypeDistribution: AWSJSON;
  versionDistribution: AWSJSON;
  ttl: AWSTimestamp;
}
```

## Device Filtering

The system supports advanced filtering capabilities:

```typescript
type FilterJsonObject = {
  operation: FilterOperation; // "and" | "or"
  filterGroup: FilterGroup[];
  isFilteredToFavorites: boolean;
  favoriteDevices: string[];
}

type FilterGroup = {
  filters: Filter[];
}

type Filter = {
  fieldName: string;
  operator: FilterOperator; // "eq", "ne", "le", "lt", "ge", "gt", "between", "contains"
  value: AWSJSON;
}
```

## GraphQL API Operations for Devices

### Queries

| Query | Description |
|-------|-------------|
| `getDevice(thingName: String!)` | Get details for a specific device |
| `listThings(limit: Int, nextToken: String, filter: FilterJsonObjectInput)` | List devices with pagination and filtering |
| `getThingShadow(thingName: String!, shadowName: String)` | Get a device's shadow |
| `getRetainedTopic(thingName: String!, topicName: RetainedTopicSuffix!)` | Get a device's retained topic |
| `getThingCount(filter: FilterJsonObjectInput)` | Count devices matching a filter |
| `getLatestDeviceStats` | Get the latest device statistics |
| `getCloudwatchMetricData(type: CloudwatchMetricType!, period: Int, start: AWSDateTime)` | Get CloudWatch metrics for devices |
| `getDefenderMetricData(thingName: String!, type: DefenderMetricType!, startTime: AWSDateTime, endTime: AWSDateTime)` | Get Defender metrics for a device |

### Subscriptions

| Subscription | Description |
|--------------|-------------|
| `onNewDeviceStats` | Subscribe to new device statistics |

## Implementation Details

The system uses AWS IoT services to manage devices:

1. **AWS IoT Core** for device connectivity and messaging
2. **AWS IoT Core Device Shadow** for state management
3. **AWS IoT Device Management** for device search, filtering and jobs(remote actions) status monitoring
4. **AWS IoT Device Defender** for security monitoring
6. **AWS CloudWatch** for operational metrics

Device data is accessed through AWS AppSync GraphQL API, with Lambda resolvers that interact with the AWS IoT services.

## Scheduling

The system supports scheduling with the following types and modes:

### Scheduling Types
```typescript
enum SchedulingType {
  LOCAL = 'local',
  REMOTE = 'remote'
}
```

### Scheduling Modes
```typescript
enum SchedulingMode {
  DAILY = 'daily',
  WEEKLY = 'weekly'
}
```

### Schedule Structure
```typescript
interface Schedule {
  name?: string;
  mode?: string;
  days?: any;
  [key: string]: any;
}
```

### Switch Point
```typescript
type SwitchPoint = {
  time: number;
  [key: string]: any;
};
```
