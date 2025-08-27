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

import json
import os
import random
import time
import base64
import string
import uuid
import datetime
import boto3
import botocore.exceptions
import requests
from awscrt import mqtt
from awsiot import iotshadow
from awsiot import mqtt_connection_builder
from config_loader import config


# Get configuration values first
AWS_CONFIG = config.get_aws_config()
DEVICE_CONFIG = config.get_device_config()
SHADOW_CONFIG = config.get_shadow_config()

# Create thing groups and thing types
def create_thing_groups():
    """
    Create thing groups defined in the configuration
    """
    # Get region from AWS config
    region = AWS_CONFIG.get("region")
    if not region:
        raise ValueError("AWS region not specified in configuration")

    iot_client = boto3.client("iot", region_name=region)

    # Get thing groups from config
    thing_groups = DEVICE_CONFIG.get("thing_groups", [])

    created_groups = []
    for group in thing_groups:
        group_name = group.get("name")
        description = group.get("description", "")
        
        # Get any attributes defined for this group
        attributes = {}
        # Add standard attributes
        attributes["createdBy"] = "device-simulation"
        attributes["createdAt"] = datetime.datetime.now().isoformat()
        
        # Add location attribute if it's a location-based group
        if "Building" in group_name:
            location = group_name.replace("Devices", "").strip()
            attributes["location"] = location
        
        # Add category attribute if it's a category-based group
        if "Group" in group_name:
            category = group_name.replace("Group", "").strip().lower()
            attributes["category"] = category

        try:
            # Check if group exists
            try:
                group_info = iot_client.describe_thing_group(thingGroupName=group_name)
                print(f"Thing group {group_name} already exists")
                
                # Update attributes if the group already exists
                existing_attributes = group_info.get("thingGroupMetadata", {}).get("attributes", {})
                if existing_attributes != attributes:
                    iot_client.update_thing_group(
                        thingGroupName=group_name,
                        thingGroupProperties={
                            "attributePayload": {
                                "attributes": attributes,
                                "merge": True
                            }
                        }
                    )
                    print(f"Updated attributes for thing group: {group_name}")
                    
            except iot_client.exceptions.ResourceNotFoundException:
                # Create group if it doesn't exist
                response = iot_client.create_thing_group(
                    thingGroupName=group_name,
                    thingGroupProperties={
                        "thingGroupDescription": description,
                        "attributePayload": {
                            "attributes": attributes
                        },
                    },
                )
                print(f"Created thing group: {group_name}")

            created_groups.append(group_name)
        except Exception as e:
            print(f"Error creating thing group {group_name}: {str(e)}")

    return created_groups


def create_thing_types():
    """
    Create thing types defined in the configuration
    """
    # Get region from AWS config
    region = AWS_CONFIG.get("region")
    if not region:
        raise ValueError("AWS region not specified in configuration")

    iot_client = boto3.client("iot", region_name=region)

    # Get thing types from config
    thing_types = DEVICE_CONFIG.get("thing_types", [])

    created_types = []
    for thing_type in thing_types:
        type_name = thing_type.get("name")
        description = thing_type.get("description", "")
        searchable_attributes = thing_type.get("searchable_attributes", [])

        try:
            # Check if thing type exists
            try:
                iot_client.describe_thing_type(thingTypeName=type_name)
                print(f"Thing type {type_name} already exists")
            except iot_client.exceptions.ResourceNotFoundException:
                # Limit searchable attributes to 3 as per AWS IoT Core limitations
                if len(searchable_attributes) > 3:
                    print(f"Warning: Limiting searchable attributes for {type_name} to 3 (from {len(searchable_attributes)})")
                    searchable_attributes = searchable_attributes[:3]
                
                # Create thing type if it doesn't exist
                response = iot_client.create_thing_type(
                    thingTypeName=type_name,
                    thingTypeProperties={
                        "thingTypeDescription": description,
                        "searchableAttributes": searchable_attributes,
                    },
                )
                print(f"Created thing type: {type_name}")

            created_types.append(type_name)
        except Exception as e:
            print(f"Error creating thing type {type_name}: {str(e)}")

    return created_types


# Initialize thing groups and thing types - but don't call them yet
# We'll call these from the main function to ensure they're created before devices
THING_GROUPS = []
THING_TYPES = []

# Base paths for device-specific credentials
ENDPOINT = AWS_CONFIG.get("endpoint")
CERTS_BASE_PATH = DEVICE_CONFIG.get("certs_base_path", "./certs")


def ensure_root_ca(ca_dir=DEVICE_CONFIG.get("root_ca_path", "./rootCA")):
    # Create directory if it doesn't exist
    os.makedirs(ca_dir, exist_ok=True)

    ca_file_path = os.path.join(ca_dir, "AmazonRootCA1.pem")

    # Check if the root CA already exists
    if not os.path.exists(ca_file_path):
        print("Root CA not found. Downloading...")
        try:
            # Download Amazon Root CA 1
            response = requests.get(
                "https://www.amazontrust.com/repository/AmazonRootCA1.pem"
            )
            response.raise_for_status()  # Raise an exception for bad status codes

            # Save the certificate
            with open(ca_file_path, "wb") as ca_file:
                ca_file.write(response.content)
            print(f"Root CA downloaded successfully to {ca_file_path}")

        except Exception as e:
            print(f"Error downloading Root CA: {str(e)}")
            raise
    #    else:
    #       print(f"Root CA already exists at {ca_file_path}")
    return ca_file_path


def random_bool():
    return random.choice([True, False])


def get_random_option(category, option_name, default_options):
    """Get a random option from the configuration or use default"""
    options = (
        SHADOW_CONFIG.get(category, {})
        .get("options", {})
        .get(option_name, default_options)
    )
    return random.choice(options)


def get_random_value_in_range(category, range_name, default_min, default_max):
    """Get a random value within the configured range or use default"""
    range_config = SHADOW_CONFIG.get(category, {}).get("ranges", {}).get(range_name, {})
    min_val = range_config.get("min", default_min)
    max_val = range_config.get("max", default_max)
    return random.uniform(min_val, max_val)


def get_device_category():
    """Get a random device category based on configuration"""
    sim_config = config.get_simulation_config()
    categories = sim_config.get("device_categories", "all")

    if categories == "all":
        categories = ["sensor", "actuator", "gateway"]

    return random.choice(categories)


def get_device_type(category):
    """Get a random device type for the given category"""
    device_types = DEVICE_CONFIG.get("device_types", {}).get(category, [])
    if not device_types:
        return f"generic_{category}"
    return random.choice(device_types)


def get_device_location():
    """Get a random location and zone for a device"""
    locations = DEVICE_CONFIG.get("locations", [])
    if not locations:
        return {"location": "default", "zone": "default"}

    location = random.choice(locations)
    zone = "default"
    if "zones" in location and location["zones"]:
        zone = random.choice(location["zones"])

    return {"location": location["name"], "zone": zone}


def get_device_country():
    """Get a random country for a device"""
    # Try to get countries from device config first
    countries = DEVICE_CONFIG.get("countries", [])
    
    # If not found in device config, try to get from top-level config
    if not countries:
        countries = config.config.get("countries", [])
    
    # If still not found, use default
    if not countries:
        return {"country_code": "US", "country_name": "United States"}

    country = random.choice(countries)
    return {
        "country_code": country.get("code", "US"),
        "country_name": country.get("name", "United States"),
    }


def generate_device_id(index, device_type, device_category):
    """Generate a device ID based on the configuration"""
    # First check if we have a stored ID for this device
    from device_registry import get_device_id, register_device

    existing_id = get_device_id(index, device_type, device_category)
    if existing_id:
        return existing_id

    # If not, generate a new one
    id_config = DEVICE_CONFIG.get("identification", {}).get("device_id", {})
    prefix = id_config.get("prefix", "iot_")
    random_digits = id_config.get("random_digits", 6)

    # Use device type as part of the prefix
    type_prefix = device_type.split("_")[0] if "_" in device_type else device_type

    # Generate random digits
    random_part = "".join(random.choice(string.digits) for _ in range(random_digits))

    # Combine prefix, type, and random digits
    device_id = f"{prefix}{type_prefix}_{random_part}"

    # Store the new ID
    register_device(index, device_type, device_category, device_id)

    return device_id


def generate_serial_number():
    """Generate a serial number based on the configuration"""
    sn_config = DEVICE_CONFIG.get("identification", {}).get("serial_number", {})
    prefix = sn_config.get("prefix", "SN")
    random_digits = sn_config.get("random_digits", 10)

    # Generate random digits
    random_part = "".join(random.choice(string.digits) for _ in range(random_digits))

    # Combine prefix and random digits
    serial_number = f"{prefix}{random_part}"

    return serial_number


def generate_uuid():
    """Generate a UUID based on the configuration"""
    uuid_config = DEVICE_CONFIG.get("identification", {}).get("uuid", {})
    version = uuid_config.get("version", 4)

    if version == 5:
        # Use a fixed namespace for v5 UUIDs
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, "iot.example.com"))
    else:
        # Default to v4 (random) UUID
        return str(uuid.uuid4())


def get_primary_identifier(device):
    """Get the primary identifier for the device based on configuration"""
    id_config = DEVICE_CONFIG.get("identification", {})
    primary = id_config.get("primary_identifier", "device_id")

    if primary == "serial_number":
        return device.serial_number
    elif primary == "uuid":
        return device.uuid
    else:  # default to device_id
        return device.device_id


class IoTDevice:
    # Class variable to track retained topics for all devices
    retained_topics = {}

    def __init__(self, index):
        # Import here to avoid circular imports
        from device_registry import get_device_by_index

        # Check if we have stored device info
        stored_info = get_device_by_index(index)

        if stored_info:
            # Reuse stored category and type
            self.category = stored_info["category"]
            self.device_type = stored_info["type"]
            self.device_id = stored_info["device_id"]
        else:
            # Determine device category and type
            self.category = get_device_category()
            self.device_type = get_device_type(self.category)

            # Generate device identifiers
            self.device_id = generate_device_id(index, self.device_type, self.category)
            
        # Initialize device-specific retained topics list AFTER device_id is set
        if self.device_id not in IoTDevice.retained_topics:
            IoTDevice.retained_topics[self.device_id] = []
        self.serial_number = generate_serial_number()
        self.uuid = generate_uuid()
        
        # Get possible values from config
        self._possible_hw_versions = DEVICE_CONFIG.get(
            "hardware_versions", ["HW-v1.0", "HW-v2.0"]
        )
        self._possible_fw_versions = DEVICE_CONFIG.get(
            "firmware_versions", ["1.0.0", "1.1.0"]
        )
        self._possible_network_types = DEVICE_CONFIG.get(
            "network_types", ["wifi", "ethernet"]
        )

        # Generate random initial values BEFORE creating certificates and things
        self._generate_random_values()

        # Get the primary identifier based on configuration
        id_config = DEVICE_CONFIG.get("identification", {})
        primary = id_config.get("primary_identifier", "device_id")

        # Determine which identifier to use as the primary identifier
        # Note: AWS IoT thing name will always be device_id
        if primary == "serial_number":
            self.primary_id = self.serial_number
        elif primary == "uuid":
            self.primary_id = self.uuid
        else:  # default to device_id
            self.primary_id = self.device_id

        self.connected = False
        self.client = None
        self.shadow_client = None
        self.iot_data_client = None

        # Get location information
        location_info = get_device_location()
        self.location = location_info["location"]
        self.zone = location_info["zone"]

        # Get country information
        country_info = get_device_country()
        self.country_code = country_info["country_code"]
        self.country_name = country_info["country_name"]

        # Device-specific certificate paths
        self.cert_path = os.path.join(
            CERTS_BASE_PATH, self.device_id, "certificate.pem.crt"
        )
        self.key_path = os.path.join(CERTS_BASE_PATH, self.device_id, "private.pem.key")
        self.rootCA = ensure_root_ca()

        # Create certs directory if needed
        os.makedirs(os.path.dirname(self.cert_path), exist_ok=True)

        # Create or verify policy exists
        policy_name = self.create_device_policy()

        # Create certificates if they don't exist
        if not (os.path.exists(self.cert_path) and os.path.exists(self.key_path)):
            self._create_certificates(policy_name)

        # Assign thing type and add to thing groups
        self._assign_thing_type_and_groups()

    def _assign_thing_type_and_groups(self):
        """
        Assign a thing type to the device and add it to appropriate thing groups
        """
        # Get region from AWS config
        region = AWS_CONFIG.get("region")
        if not region:
            raise ValueError("AWS region not specified in configuration")

        iot_client = boto3.client("iot", region_name=region)

        try:
            # Assign thing type based on device category
            thing_type = None
            if self.category == "sensor":
                if "temperature" in self.device_type:
                    thing_type = "TemperatureSensor"
                elif "humidity" in self.device_type:
                    thing_type = "HumiditySensor"
                else:
                    # Default to first sensor type if available
                    sensor_types = [t for t in THING_TYPES if "Sensor" in t]
                    if sensor_types:
                        thing_type = sensor_types[0]
            elif self.category == "actuator":
                if "switch" in self.device_type:
                    thing_type = "SmartSwitch"
                else:
                    # Default to SmartSwitch if available
                    if "SmartSwitch" in THING_TYPES:
                        thing_type = "SmartSwitch"
            elif self.category == "gateway":
                if "Gateway" in THING_TYPES:
                    thing_type = "Gateway"

            # If we found a matching thing type, assign it
            if thing_type and thing_type in THING_TYPES:
                try:
                    # Update thing to add thing type
                    iot_client.update_thing(
                        thingName=self.device_id, thingTypeName=thing_type
                    )
                    print(f"Assigned thing type {thing_type} to {self.device_id}")
                except Exception as e:
                    print(f"Error assigning thing type to {self.device_id}: {str(e)}")

            # Add device to appropriate thing groups
            groups_to_add = []

            # Add to category-specific group
            if self.category == "sensor" and "SensorGroup" in THING_GROUPS:
                groups_to_add.append("SensorGroup")
            elif self.category == "actuator" and "ActuatorGroup" in THING_GROUPS:
                groups_to_add.append("ActuatorGroup")
            elif self.category == "gateway" and "GatewayGroup" in THING_GROUPS:
                groups_to_add.append("GatewayGroup")

            # Add to location-specific group
            if self.location == "Building A" and "BuildingADevices" in THING_GROUPS:
                groups_to_add.append("BuildingADevices")
            elif self.location == "Building B" and "BuildingBDevices" in THING_GROUPS:
                groups_to_add.append("BuildingBDevices")

            # Add to all selected groups
            for group_name in groups_to_add:
                try:
                    iot_client.add_thing_to_thing_group(
                        thingName=self.device_id, thingGroupName=group_name
                    )
                    print(f"Added {self.device_id} to thing group {group_name}")
                except Exception as e:
                    print(
                        f"Error adding {self.device_id} to group {group_name}: {str(e)}"
                    )

        except Exception as e:
            print(
                f"Error in _assign_thing_type_and_groups for {self.device_id}: {str(e)}"
            )

        # Initialize common state attributes
        self.common_state = SHADOW_CONFIG.get("common", {}).copy()

        # Initialize category-specific state
        category_defaults = SHADOW_CONFIG.get(self.category, {}).get("defaults", {})
        self.current_state = category_defaults.copy()
        
        # Set brandName and country in current state
        self.current_state["brandName"] = self._get_random_brand_name()
        self.current_state["country"] = self.country_name
        
        # Set timestamps
        now = int(time.time())
        self.current_state["provisioningTimestamp"] = now
        self.current_state["productionTimestamp"] = now - random.randint(86400*30, 86400*365)  # Between 30 days and 1 year ago
        self.current_state["hasApplianceFW"] = random.choice([True, False])

        # Add device type to state
        if self.category == "sensor":
            self.current_state["sensorType"] = self.device_type.replace("_sensor", "")
        elif self.category == "actuator":
            self.current_state["actuatorType"] = self.device_type.replace(
                "_controller", ""
            ).replace("smart_", "")

    def _determine_thing_type(self):
        """Determine a suitable thing type for the device based on its category and device type"""
        global THING_TYPES
        
        # Make sure thing types are initialized
        if not THING_TYPES:
            # Initialize thing types from configuration
            THING_TYPES = create_thing_types()
            print(f"Initialized {len(THING_TYPES)} thing types from configuration")
        
        # Try to find a matching thing type based on device category and type
        if self.category == "sensor":
            if "temperature" in self.device_type and "TemperatureSensor" in THING_TYPES:
                return "TemperatureSensor"
            elif "humidity" in self.device_type and "HumiditySensor" in THING_TYPES:
                return "HumiditySensor"
            elif "pressure" in self.device_type and "PressureSensor" in THING_TYPES:
                return "PressureSensor"
            elif "light" in self.device_type and "LightSensor" in THING_TYPES:
                return "LightSensor"
            elif "motion" in self.device_type and "MotionSensor" in THING_TYPES:
                return "MotionSensor"
            # Default to any sensor type
            for thing_type in THING_TYPES:
                if "Sensor" in thing_type:
                    return thing_type
        elif self.category == "actuator":
            if "switch" in self.device_type and "SmartSwitch" in THING_TYPES:
                return "SmartSwitch"
            # Default to any actuator type
            for thing_type in THING_TYPES:
                if "Switch" in thing_type or "Controller" in thing_type:
                    return thing_type
        elif self.category == "gateway":
            if "Gateway" in THING_TYPES:
                return "Gateway"
            
        # If no specific match but we have thing types, use the first one
        if THING_TYPES:
            print(f"Using default thing type {THING_TYPES[0]} for {self.device_id}")
            return THING_TYPES[0]
            
        # If still no thing types available (very unlikely), create a default one
        print(f"Warning: No thing types available for {self.device_id}, creating default")
        try:
            # Get region from AWS config
            region = AWS_CONFIG.get("region")
            if not region:
                raise ValueError("AWS region not specified in configuration")
                
            iot_client = boto3.client("iot", region_name=region)
            
            # Create a default thing type if it doesn't exist
            default_type_name = "DefaultDeviceType"
            try:
                iot_client.describe_thing_type(thingTypeName=default_type_name)
                print(f"Default thing type {default_type_name} already exists")
            except iot_client.exceptions.ResourceNotFoundException:
                # Create the default thing type
                iot_client.create_thing_type(
                    thingTypeName=default_type_name,
                    thingTypeProperties={
                        "thingTypeDescription": "Default thing type for all devices",
                        "searchableAttributes": ["category", "deviceType", "brandName"]
                    }
                )
                print(f"Created default thing type: {default_type_name}")
                
                # Add to global THING_TYPES list
                THING_TYPES.append(default_type_name)
                
            return default_type_name
        except Exception as e:
            print(f"Error creating default thing type: {str(e)}")
            return None
        
    def _get_random_brand_name(self):
        """Get a random brand name from the configuration"""
        # Try to get brands from device config first
        brands = DEVICE_CONFIG.get("brands", [])
        
        # If not found in device config, try to get from top-level config
        if not brands:
            brands = config.config.get("brands", [])
        
        # If still not found, use default
        if not brands:
            return "unknown"
        
        brand = random.choice(brands)
        return brand.get("name", "unknown")
        
    def _generate_random_values(self):
        """Generate random values for device attributes"""
        # Select random versions
        self.hw_version = random.choice(self._possible_hw_versions)
        self.fw_version = random.choice(self._possible_fw_versions)
        
        # Select random brand name
        self.brand_name = self._get_random_brand_name()
        
        # Select random firmware type from package shadow config
        package_shadow_config = config.config.get("package_shadow", {})
        firmware_types = package_shadow_config.get("firmware_types", ["main"])
        self.firmware_type = random.choice(firmware_types)
        
        print(f"FIRMWARE INFO: {self.device_id} - Version: {self.fw_version}, Type: {self.firmware_type}")

        # Generate random MAC address
        self.mac_address = ":".join([f"{random.randint(0, 255):02x}" for _ in range(6)])

        # Select random network type
        self.network_type = random.choice(self._possible_network_types)

        # Generate random network ID based on type
        if self.network_type == "wifi":
            self.network_id = f"WIFI_{random.randint(1000, 9999)}"
        elif self.network_type == "ethernet":
            self.network_id = f"ETH_{random.randint(1000, 9999)}"
        elif self.network_type == "cellular":
            self.network_id = f"CELL_{random.randint(1000, 9999)}"
        elif self.network_type == "zigbee":
            self.network_id = f"ZB_{random.randint(1000, 9999)}"
        elif self.network_type == "bluetooth":
            self.network_id = f"BT_{random.randint(1000, 9999)}"
        else:
            self.network_id = f"NET_{random.randint(1000, 9999)}"

    def publish_device_state(self):
        """
        Publish device state as a retained message
        """
        if not self.connected:
            print(f"{self.device_id}: Not connected, skipping device state update")
            return

        # Build device state based on category
        device_state = {
            "deviceId": self.device_id,
            "primaryId": self.primary_id,
            "uuid": self.uuid,
            "category": self.category,
            "type": self.device_type,
            "online": True,
            "timestamp": int(time.time()),
            "location": self.location,
            "zone": self.zone,
            "country": {"code": self.country_code, "name": self.country_name},
            "device": {
                "serialNumber": self.serial_number,
                "hardwareVersion": self.hw_version,
                "firmwareVersion": self.fw_version,
                "brandName": self.brand_name,
            },
            "network": {
                "type": self.network_type,
                "id": self.network_id,
                "mac": self.mac_address,
                "signalQuality": random.choice(["excellent", "good", "fair", "poor"]),
            },
        }

        retained_topic = f"device/{self.device_id}/state"

        try:
            # Simple publish without waiting for the future
            self.client.publish(
                topic=retained_topic,
                payload=json.dumps(device_state),
                qos=mqtt.QoS.AT_LEAST_ONCE,
                retain=True,
            )
            print(f"Device state published to {retained_topic}")
            print(f"Published state: {json.dumps(device_state, indent=2)}")

        except Exception as e:
            print(f"Error publishing device state: {e}")

    def connect(self):
        try:
            if self.connected:
                return True

            # Create MQTT connection
            self.client = mqtt_connection_builder.mtls_from_path(
                endpoint=ENDPOINT,
                cert_filepath=self.cert_path,
                pri_key_filepath=self.key_path,
                ca_filepath=self.rootCA,
                client_id=self.device_id,
                clean_session=False,
                keep_alive_secs=30,
            )

            connect_future = self.client.connect()
            connect_future.result(timeout=10)  # Wait for connection to complete

            self.connected = True
            self.shadow_client = iotshadow.IotShadowClient(self.client)

            # Get region from AWS config
            region = AWS_CONFIG.get("region")
            if not region:
                raise ValueError("AWS region not specified in configuration")

            self.iot_data_client = boto3.client("iot-data", region_name=region)
            
            # Subscribe to job topics after successful connection
            self.subscribe_to_jobs()
            
            return True
        except Exception as e:
            self.connected = False
            print(f"Error connecting device {self.device_id}: {str(e)}")
            print(f"Error type: {type(e).__name__}")
            if hasattr(e, "response"):
                print(f"Error response: {e.response}")
            return False
            
    def subscribe_to_jobs(self):
        """Subscribe to job execution topics"""
        if not self.connected:
            return False
            
        # Subscribe to job notification topic
        self.client.subscribe(
            f"$aws/things/{self.device_id}/jobs/notify",
            mqtt.QoS.AT_LEAST_ONCE,
            self._on_job_notification
        )
        
        # Subscribe to job execution topics
        self.client.subscribe(
            f"$aws/things/{self.device_id}/jobs/+/get/accepted",
            mqtt.QoS.AT_LEAST_ONCE,
            self._on_job_execution_accepted
        )
        
        print(f"{self.device_id}: Subscribed to job topics")
        return True
    
    def _on_job_notification(self, topic, payload, **kwargs):
        """Handle job notifications"""
        try:
            payload_text = payload.decode('utf-8')
            job_data = json.loads(payload_text)
            if "jobs" in job_data:
                pending_jobs = job_data.get("jobs", {}).get("IN_PROGRESS", [])
                queued_jobs = job_data.get("jobs", {}).get("QUEUED", [])
                
                for job in pending_jobs + queued_jobs:
                    job_id = job.get("jobId")
                    print(f"{self.device_id}: Received job notification for {job_id}")
                    self._process_job(job_id)
        except Exception as e:
            print(f"{self.device_id}: Error processing job notification: {str(e)}")
    
    def _process_job(self, job_id):
        """Process a job execution"""
        # Get the job document
        self.client.publish(
            f"$aws/things/{self.device_id}/jobs/{job_id}/get",
            payload="{}",
            qos=mqtt.QoS.AT_LEAST_ONCE
        )
    
    def _on_job_execution_accepted(self, topic, payload, **kwargs):
        """Handle job execution document"""
        try:
            payload_text = payload.decode('utf-8')
            job_data = json.loads(payload_text)
            if "execution" in job_data:
                execution = job_data["execution"]
                job_id = execution.get("jobId")
                job_document = execution.get("jobDocument", {})
                
                # Check if this is a firmware update job
                if "firmwareUpdate" in job_document:
                    self._handle_firmware_update(job_id, job_document["firmwareUpdate"])
                else:
                    print(f"{self.device_id}: Unknown job type for {job_id}")
        except Exception as e:
            print(f"{self.device_id}: Error processing job execution: {str(e)}")
    
    def _handle_firmware_update(self, job_id, update_info):
        """Handle a firmware update job"""
        try:
            # Extract firmware update information
            new_version = update_info.get("version")
            url = update_info.get("url")
            
            print(f"{self.device_id}: Processing firmware update to version {new_version}")
            
            # Simulate download and installation time
            time.sleep(random.uniform(5, 15))
            
            # Update firmware version
            self.fw_version = new_version
            
            # Mark job as succeeded
            self._update_job_execution(job_id, "SUCCEEDED", {
                "installedVersion": new_version,
                "updateTimestamp": int(time.time())
            })
            
            print(f"{self.device_id}: Firmware updated to version {new_version}")
        except Exception as e:
            # Mark job as failed
            self._update_job_execution(job_id, "FAILED", {
                "failureReason": str(e)
            })
            print(f"{self.device_id}: Firmware update failed: {str(e)}")
    
    def _update_job_execution(self, job_id, status, status_details=None):
        """Update job execution status"""
        payload = {
            "status": status,
            "statusDetails": status_details or {}
        }
        
        self.client.publish(
            f"$aws/things/{self.device_id}/jobs/{job_id}/update",
            payload=json.dumps(payload),
            qos=mqtt.QoS.AT_LEAST_ONCE
        )

    def disconnect(self):
        if self.client:
            self.client.disconnect()
            self.connected = False

    # Publishing with retain flag
    def publish_retained_message(self, topic, payload):
        publish_future, _ = self.client.publish(
            topic=topic,
            payload=json.dumps(payload),
            qos=mqtt.QoS.AT_LEAST_ONCE,
            retain=True,  # Set retain flag to True
        )
        # Wait for the message to be published
        publish_future.result()

        # Track this topic as having a retained message
        if self.device_id not in IoTDevice.retained_topics:
            IoTDevice.retained_topics[self.device_id] = []

        if topic not in IoTDevice.retained_topics[self.device_id]:
            IoTDevice.retained_topics[self.device_id].append(topic)

    def clear_retained_message(self, topic):
        publish_future, _ = self.client.publish(
            topic=topic, payload="", qos=mqtt.QoS.AT_LEAST_ONCE, retain=True
        )
        publish_future.result()

        # Remove this topic from the tracked list
        if (
            self.device_id in IoTDevice.retained_topics
            and topic in IoTDevice.retained_topics[self.device_id]
        ):
            IoTDevice.retained_topics[self.device_id].remove(topic)
            print(f"{self.device_id}: Removed retained message from topic: {topic}")

    def update_shadow(self):
        """
        Randomly pick one attribute to update in the shadow while maintaining other attributes
        """
        if not self.connected:
            return

        # Update common attributes
        self.common_state["lastReportTime"] = int(time.time())
        self.common_state["batteryLevel"] = max(
            0,
            min(
                100, self.common_state.get("batteryLevel", 100) + random.randint(-5, 2)
            ),
        )
        self.common_state["signalStrength"] = max(
            0,
            min(
                100,
                self.common_state.get("signalStrength", 80) + random.randint(-10, 10),
            ),
        )
        self.common_state["maintenanceRequired"] = (
            random.random() < 0.05
        )  # 5% chance of maintenance required

        # Category-specific updates
        if self.category == "sensor":
            self._update_sensor_shadow()
        elif self.category == "actuator":
            self._update_actuator_shadow()
        elif self.category == "gateway":
            self._update_gateway_shadow()

        # Create a complete reported state
        reported_state = {
            "connected": self.connected,
            "lastUpdatedAt": int(time.time()),
            "primaryId": self.primary_id,
            "country": {"code": self.country_code, "name": self.country_name},
            "brandName": self.brand_name,
        }

        # Add common state
        for key, value in self.common_state.items():
            reported_state[key] = value

        # Add device-specific state
        for key, value in self.current_state.items():
            reported_state[key] = value

        # Create shadow document with complete state
        shadow_document = iotshadow.ShadowState(reported=reported_state)

        # Update shadow
        request = iotshadow.UpdateShadowRequest(
            thing_name=self.device_id, state=shadow_document
        )

        # Publish to shadow update topic
        self.shadow_client.publish_update_shadow(
            request=request, qos=mqtt.QoS.AT_LEAST_ONCE
        )

        topic = f"$aws/things/{self.device_id}/shadow/update"
        print(f"{self.device_id}: Publishing to {topic}")
        
        # Update package shadow
        self.update_package_shadow()
        
        # Update schedule shadow (less frequently)
        if random.random() < 0.2:  # 20% chance
            self.update_schedule_shadow()

        # Also publish the device state as a retained message
        self.publish_device_state()
        
        # Update classic shadow to ensure connection status is consistent
        self.update_classic_shadow()
        
    def update_classic_shadow(self):
        """
        Update the classic (unnamed) shadow for the device with connection status.
        This ensures the connection status is consistent across all shadow types.
        """
        if not self.connected:
            return
            
        # Get region from AWS config
        region = AWS_CONFIG.get("region")
        if not region:
            raise ValueError("AWS region not specified in configuration")
        
        # Direct update via IoT Data API
        try:
            # Create a simple shadow document with connection status
            shadow_doc = {
                "state": {
                    "reported": {
                        "connected": self.connected,
                        "lastUpdatedAt": int(time.time()),
                        "firmwareVersion": self.fw_version,
                        "firmwareType": self.firmware_type,
                        "brandName": self.brand_name
                    }
                }
            }
            
            # Create IoT Data client
            iot_data = boto3.client("iot-data", region_name=region)
            
            # Update shadow using API
            response = iot_data.update_thing_shadow(
                thingName=self.device_id,
                payload=json.dumps(shadow_doc).encode('utf-8')
            )
            
            print(f"{self.device_id}: Updated classic shadow with connection status: {self.connected}")
            
        except Exception as e:
            print(f"{self.device_id}: Error updating classic shadow: {str(e)}")
        
    def update_package_shadow(self):
        """
        Update the $package shadow with firmware information
        """
        if not self.connected:
            return
            
        # Ensure firmware_type exists
        if not hasattr(self, 'firmware_type') or self.firmware_type is None:
            # Select random firmware type from package shadow config
            package_shadow_config = config.config.get("package_shadow", {})
            firmware_types = package_shadow_config.get("firmware_types", ["generic"])
            self.firmware_type = random.choice(firmware_types)
            
        # Create package shadow document
        package_state = {
            "reported": {
                self.firmware_type: {
                    "version": self.fw_version,
                    "updateTimestamp": int(time.time())
                }
            }
        }
        
        # Create shadow document
        shadow_document = {
            "state": package_state
        }
        
        # Publish to shadow update topic
        try:
            self.client.publish(
                topic=f"$aws/things/{self.device_id}/shadow/name/$package/update",
                payload=json.dumps(shadow_document),
                qos=mqtt.QoS.AT_LEAST_ONCE
            )
            print(f"{self.device_id}: Updated $package shadow with firmware type {self.firmware_type}, version {self.fw_version}")
        except Exception as e:
            print(f"{self.device_id}: Error updating $package shadow: {str(e)}")
            
    def update_schedule_shadow(self):
        """
        Update the schedule shadow with scheduling information
        """
        if not self.connected:
            return
            
        # Get schedule configuration
        schedule_config = config.config.get("schedule_shadow", {})
        default_schedule = schedule_config.get("default_schedule", {})
        
        # Create schedule shadow document
        schedule_state = {
            "reported": {
                "schedule": default_schedule
            }
        }
        
        # Create shadow document
        shadow_document = {
            "state": schedule_state
        }
        
        # Publish to shadow update topic
        try:
            self.client.publish(
                topic=f"$aws/things/{self.device_id}/shadow/name/schedule/update",
                payload=json.dumps(shadow_document),
                qos=mqtt.QoS.AT_LEAST_ONCE
            )
            print(f"{self.device_id}: Updated schedule shadow")
        except Exception as e:
            print(f"{self.device_id}: Error updating schedule shadow: {str(e)}")

    def _update_sensor_shadow(self):
        """Update sensor-specific shadow attributes"""
        sensor_type = self.current_state.get("sensorType", "generic")

        # Determine which value to update based on sensor type
        if sensor_type == "temperature":
            self.current_state["currentValue"] = round(
                get_random_value_in_range("sensor", "temperature", -20.0, 50.0), 1
            )
            self.current_state["measurementUnit"] = "celsius"
        elif sensor_type == "humidity":
            self.current_state["currentValue"] = round(
                get_random_value_in_range("sensor", "humidity", 0.0, 100.0), 1
            )
            self.current_state["measurementUnit"] = "percent"
        elif sensor_type == "pressure":
            self.current_state["currentValue"] = round(
                get_random_value_in_range("sensor", "pressure", 900.0, 1100.0), 1
            )
            self.current_state["measurementUnit"] = "hPa"
        elif sensor_type == "light":
            self.current_state["currentValue"] = round(
                get_random_value_in_range("sensor", "light", 0.0, 10000.0), 1
            )
            self.current_state["measurementUnit"] = "lux"
        elif sensor_type == "motion":
            self.current_state["currentValue"] = 1 if random.random() < 0.3 else 0
            self.current_state["measurementUnit"] = "boolean"
        else:
            # Generic sensor
            self.current_state["currentValue"] = round(random.uniform(0, 100), 1)

        # Randomly trigger alerts
        if random.random() < 0.1:  # 10% chance
            self.current_state["alertEnabled"] = True
            self.current_state["alertThreshold"] = round(
                self.current_state["currentValue"] * 0.9, 1
            )

    def _update_actuator_shadow(self):
        """Update actuator-specific shadow attributes"""
        # Randomly update state
        if random.random() < 0.2:  # 20% chance to change state
            self.current_state["state"] = get_random_option(
                "actuator", "state", ["off", "on", "standby", "error"]
            )

        # Randomly update mode
        if random.random() < 0.1:  # 10% chance to change mode
            self.current_state["mode"] = get_random_option(
                "actuator", "mode", ["auto", "manual"]
            )

        # Update power level
        if self.current_state["state"] == "on":
            power_range = (
                SHADOW_CONFIG.get("actuator", {})
                .get("ranges", {})
                .get("powerLevel", {"min": 0, "max": 100})
            )
            self.current_state["powerLevel"] = round(
                random.uniform(power_range.get("min", 0), power_range.get("max", 100))
            )
        else:
            self.current_state["powerLevel"] = 0

        # Increment operating hours if device is on
        if self.current_state["state"] == "on":
            self.current_state["operatingHours"] = self.current_state.get(
                "operatingHours", 0
            ) + (random.uniform(0.1, 0.5))

    def _update_gateway_shadow(self):
        """Update gateway-specific shadow attributes"""
        # Update connected devices count
        connected_devices_range = (
            SHADOW_CONFIG.get("gateway", {})
            .get("ranges", {})
            .get("connectedDevices", {"min": 0, "max": 50})
        )
        self.current_state["connectedDevices"] = random.randint(
            connected_devices_range.get("min", 0),
            connected_devices_range.get("max", 50),
        )

        # Update data transferred
        self.current_state["dataTransferred"] = self.current_state.get(
            "dataTransferred", 0
        ) + random.uniform(0.1, 5.0)

        # Update CPU usage
        cpu_range = (
            SHADOW_CONFIG.get("gateway", {})
            .get("ranges", {})
            .get("cpuUsage", {"min": 0, "max": 100})
        )
        self.current_state["cpuUsage"] = round(
            random.uniform(cpu_range.get("min", 0), cpu_range.get("max", 100)), 1
        )

        # Update memory usage
        memory_range = (
            SHADOW_CONFIG.get("gateway", {})
            .get("ranges", {})
            .get("memoryUsage", {"min": 0, "max": 100})
        )
        self.current_state["memoryUsage"] = round(
            random.uniform(memory_range.get("min", 0), memory_range.get("max", 100)), 1
        )

        # Update storage usage
        storage_range = (
            SHADOW_CONFIG.get("gateway", {})
            .get("ranges", {})
            .get("storageUsage", {"min": 0, "max": 100})
        )
        self.current_state["storageUsage"] = round(
            random.uniform(storage_range.get("min", 0), storage_range.get("max", 100)),
            1,
        )

        # Update uptime
        self.current_state["uptime"] = self.current_state.get(
            "uptime", 0
        ) + random.uniform(10, 30)

    def clear_device_state(self):
        """
        Clear the retained device state message
        """
        if not self.connected:
            return

        retained_topic = f"device/{self.device_id}/state"
        try:
            response = self.client.publish(
                topic=retained_topic,
                payload="",
                qos=mqtt.QoS.AT_LEAST_ONCE,
                retain=True,
            )
            print(f"Cleared retained message on topic: {retained_topic}")
        except Exception as e:
            print(f"Error clearing retained message: {e}")

    def _create_certificates(self, policy_name):
        """
        Create certificates and attach policy
        """
        # Get region from AWS config
        region = AWS_CONFIG.get("region")
        if not region:
            raise ValueError("AWS region not specified in configuration")

        iot_client = boto3.client("iot", region_name=region)

        try:
            # Create keys and certificate
            response = iot_client.create_keys_and_certificate(setAsActive=True)

            # Save certificate and private key
            with open(self.cert_path, "w") as f:
                f.write(response["certificatePem"])
            with open(self.key_path, "w") as f:
                f.write(response["keyPair"]["PrivateKey"])

            certificate_arn = response["certificateArn"]

            # Attach policy to certificate
            iot_client.attach_policy(policyName=policy_name, target=certificate_arn)
            
            # Debug firmware values
            print(f"DEBUG: Before creating thing - {self.device_id} has firmware version: {self.fw_version}, type: {self.firmware_type}")

            # Create thing with attributes if it doesn't exist
            try:
                # Determine a suitable thing type - this will create a default one if none exist
                thing_type = self._determine_thing_type()
                
                # Create thing with a thing type (required for more than 3 attributes)
                if thing_type:
                    iot_client.create_thing(
                        thingName=self.device_id,
                        thingTypeName=thing_type
                    )
                    print(f"Created thing {self.device_id} with type {thing_type}")
                else:
                    # This should rarely happen since we try to create a default type
                    iot_client.create_thing(thingName=self.device_id)
                    print(f"Warning: Created thing {self.device_id} without type (will be limited to 3 attributes)")
                
                # Add all attributes at once
                try:
                    # Create a dictionary with all attributes
                    all_attrs = {
                        "category": str(self.category),
                        "deviceType": str(self.device_type).replace(" ", "_"),
                        "brandName": str(self.brand_name),
                        "location": str(self.location).replace(" ", "_"),
                        "zone": str(self.zone).replace(" ", "_"),
                        "countryCode": str(self.country_code),
                        "country": str(self.country_name).replace(" ", "_"),
                        "serialNumber": str(self.serial_number),
                        "createdAt": datetime.datetime.now().strftime("%Y%m%d%H%M%S"),
                        "firmwareVersion": str(self.fw_version),
                        "firmwareType": str(self.firmware_type)
                    }
                    
                    print(f"SETTING ATTRIBUTES: {self.device_id} - firmwareVersion={self.fw_version}, firmwareType={self.firmware_type}")
                    
                    # Update thing with all attributes
                    iot_client.update_thing(
                        thingName=self.device_id,
                        attributePayload={
                            "attributes": all_attrs,
                            "merge": True
                        }
                    )
                    print(f"Added all attributes to thing {self.device_id}")
                    
                    print(f"Added attributes to thing {self.device_id}")
                except Exception as e:
                    print(f"Warning: Could not add some attributes: {str(e)}")
                print(f"Created thing {self.device_id} with attributes")
                
            except iot_client.exceptions.ResourceAlreadyExistsException:
                print(f"Thing {self.device_id} already exists, updating attributes")
                
                # Update with all attributes
                try:
                    # Create a dictionary with all attributes
                    all_attrs = {
                        "category": str(self.category),
                        "deviceType": str(self.device_type).replace(" ", "_"),
                        "brandName": str(self.brand_name),
                        "location": str(self.location).replace(" ", "_"),
                        "zone": str(self.zone).replace(" ", "_"),
                        "countryCode": str(self.country_code),
                        "country": str(self.country_name).replace(" ", "_"),
                        "serialNumber": str(self.serial_number),
                        "createdAt": datetime.datetime.now().strftime("%Y%m%d%H%M%S"),
                        "firmwareVersion": str(self.fw_version),
                        "firmwareType": str(self.firmware_type)
                    }
                    
                    print(f"UPDATING ATTRIBUTES: {self.device_id} - firmwareVersion={self.fw_version}, firmwareType={self.firmware_type}")
                    
                    # Check if the thing has a type
                    thing_info = iot_client.describe_thing(thingName=self.device_id)
                    has_type = "thingTypeName" in thing_info
                    
                    if not has_type:
                        # If the thing doesn't have a type, try to assign one
                        thing_type = self._determine_thing_type()
                        if thing_type:
                            iot_client.update_thing(
                                thingName=self.device_id,
                                thingTypeName=thing_type
                            )
                            print(f"Assigned thing type {thing_type} to existing thing {self.device_id}")
                    
                    # Now update with all attributes
                    iot_client.update_thing(
                        thingName=self.device_id,
                        attributePayload={
                            "attributes": all_attrs,
                            "merge": True
                        }
                    )
                    print(f"Updated thing {self.device_id} with all attributes")
                except Exception as e:
                    print(f"Warning: Could not update attributes: {str(e)}")

            # Attach certificate to thing
            iot_client.attach_thing_principal(
                thingName=self.device_id, principal=certificate_arn
            )

            print(f"Created new certificates for {self.device_id}")

        except Exception as e:
            # Clean up any files that might have been created
            for file_path in [self.cert_path, self.key_path]:
                if os.path.exists(file_path):
                    os.remove(file_path)
            print(f"Error creating certificates: {str(e)}")
            raise

    def create_device_policy(self):
        """
        Create the IoT policy if it doesn't exist
        Returns: policy name if successful
        """
        # Get region from AWS config
        region = AWS_CONFIG.get("region")
        if not region:
            raise ValueError("AWS region not specified in configuration")

        iot_client = boto3.client("iot", region_name=region)
        policy_name = f"device_policy_{self.device_id}"

        policy_document = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": ["iot:Connect"],
                    "Resource": [f"arn:aws:iot:*:*:client/{self.device_id}"],
                },
                {
                    "Effect": "Allow",
                    "Action": ["iot:Publish", "iot:Receive", "iot:RetainPublish"],
                    "Resource": [
                        f"arn:aws:iot:*:*:topic/$aws/things/{self.device_id}/shadow/*",
                        f"arn:aws:iot:*:*:topic/device/{self.device_id}/*",
                        f"arn:aws:iot:*:*:topic/$aws/things/{self.device_id}/shadow/update",
                        f"arn:aws:iot:*:*:topic/$aws/things/{self.device_id}/shadow/get",
                        f"arn:aws:iot:*:*:topic/$aws/things/{self.device_id}/shadow/delete",
                        # Add permissions for job topics
                        f"arn:aws:iot:*:*:topic/$aws/things/{self.device_id}/jobs/*",
                    ],
                },
                {
                    "Effect": "Allow",
                    "Action": ["iot:Subscribe"],
                    "Resource": [
                        f"arn:aws:iot:*:*:topicfilter/$aws/things/{self.device_id}/shadow/*",
                        f"arn:aws:iot:*:*:topicfilter/device{self.device_id}/*",
                        f"arn:aws:iot:*:*:topicfilter/$aws/things/{self.device_id}/shadow/update/accepted",
                        f"arn:aws:iot:*:*:topicfilter/$aws/things/{self.device_id}/shadow/update/rejected",
                        f"arn:aws:iot:*:*:topicfilter/$aws/things/{self.device_id}/shadow/get/accepted",
                        f"arn:aws:iot:*:*:topicfilter/$aws/things/{self.device_id}/shadow/get/rejected",
                        f"arn:aws:iot:*:*:topicfilter/$aws/things/{self.device_id}/shadow/delete/accepted",
                        f"arn:aws:iot:*:*:topicfilter/$aws/things/{self.device_id}/shadow/delete/rejected",
                        # Add permissions for job topics
                        f"arn:aws:iot:*:*:topicfilter/$aws/things/{self.device_id}/jobs/*",
                        f"arn:aws:iot:*:*:topicfilter/$aws/things/{self.device_id}/jobs/notify",
                        f"arn:aws:iot:*:*:topicfilter/$aws/things/{self.device_id}/jobs/+/get/accepted",
                    ],
                },
            ],
        }

        try:
            # Check if policy exists
            try:
                iot_client.get_policy(policyName=policy_name)
                print(f"Policy {policy_name} already exists")
            except iot_client.exceptions.ResourceNotFoundException:
                # Create policy if it doesn't exist
                iot_client.create_policy(
                    policyName=policy_name, policyDocument=json.dumps(policy_document)
                )
                print(f"Created policy: {policy_name}")

            return policy_name

        except Exception as e:
            print(f"Error managing policy: {str(e)}")
            raise

    def verify_shadow(self):
        """
        Verify shadow exists and is being updated
        """
        try:
            # Get the current shadow state
            response = self.iot_data_client.get_thing_shadow(thingName=self.device_id)
            shadow_state = json.loads(response["payload"].read())
            print(f"Current shadow state: {json.dumps(shadow_state, indent=2)}")
            return True
        except botocore.exceptions.ClientError as e:
            if e.response["Error"]["Code"] == "ResourceNotFoundException":
                print(f"No shadow exists for {self.device_id}")
                return False
            raise
        except Exception as e:
            print(f"Error checking shadow: {str(e)}")
            return False


def create_firmware_update_job(iot_client, target_thing_or_group, version, url=None):
    """
    Create a firmware update job
    
    Parameters:
        iot_client: boto3 IoT client
        target_thing_or_group: Thing name, thing group name, or ARN
        version: Firmware version to update to
        url: URL to download firmware from (optional)
    
    Returns:
        job_id: ID of the created job
    """
    # Replace periods with underscores to comply with AWS IoT job ID constraints
    sanitized_version = str(version).replace('.', '_')
    job_id = f"firmware-update-v{sanitized_version}-{int(time.time())}"
    
    # Create job document
    job_document = {
        "firmwareUpdate": {
            "version": version,
            "url": url or f"https://example.com/firmware/v{version}.bin",
            "md5": f"md5-checksum-placeholder-{version}",
            "releaseNotes": f"Firmware update to version {version}"
        }
    }
    
    # Determine if target is a thing or a thing group
    if target_thing_or_group.startswith("arn:aws:iot:"):
        # It's an ARN
        target_arn = target_thing_or_group
    elif "/" in target_thing_or_group:
        # It's a thing group ARN
        target_arn = target_thing_or_group
    else:
        # Assume it's a thing name or thing group name
        # Get account ID
        sts_client = boto3.client("sts")
        account_id = sts_client.get_caller_identity().get("Account")
        region = iot_client._client_config.region_name
        
        # Try to determine if it's a thing or thing group
        try:
            # Check if it's a thing
            iot_client.describe_thing(thingName=target_thing_or_group)
            target_arn = f"arn:aws:iot:{region}:{account_id}:thing/{target_thing_or_group}"
        except:
            # Assume it's a thing group
            target_arn = f"arn:aws:iot:{region}:{account_id}:thinggroup/{target_thing_or_group}"
    
    # Create the job
    try:
        response = iot_client.create_job(
            jobId=job_id,
            targets=[target_arn],
            document=json.dumps(job_document),
            description=f"Firmware update to version {version}",
            targetSelection="SNAPSHOT"
        )
        print(f"Created firmware update job {job_id} for target {target_thing_or_group}")
        return job_id
    except Exception as e:
        print(f"Error creating firmware update job: {str(e)}")
        raise


def initialize_iot_resources():
    """Initialize IoT resources (thing groups and thing types) before creating devices"""
    global THING_GROUPS, THING_TYPES
    
    print("Initializing IoT resources...")
    
    # Create thing groups and thing types
    THING_GROUPS = create_thing_groups()
    THING_TYPES = create_thing_types()
    
    print(f"Initialized {len(THING_GROUPS)} thing groups and {len(THING_TYPES)} thing types")
    return THING_GROUPS, THING_TYPES


def delete_job(iot_client, job_id):
    """
    Delete a job from AWS IoT Core
    
    Parameters:
        iot_client: boto3 IoT client
        job_id: ID of the job to delete
    """
    try:
        # First, cancel the job if it's not completed
        try:
            iot_client.cancel_job(jobId=job_id, force=True)
            print(f"Cancelled job {job_id}")
            # Wait a moment for cancellation to take effect
            time.sleep(1)
        except Exception as e:
            # Job might already be in terminal state
            print(f"Could not cancel job {job_id}: {str(e)}")
        
        # Now delete the job
        iot_client.delete_job(jobId=job_id, force=True)
        print(f"Deleted job {job_id}")
        return True
    except Exception as e:
        print(f"Error deleting job {job_id}: {str(e)}")
        return False


# Track created jobs for potential deletion
created_jobs = []


def device_simulation(device):
    # Get simulation config values
    sim_config = config.get_simulation_config()
    disconnect_probability = sim_config.get("disconnect_probability", 0.2)
    reconnect_min = sim_config.get("reconnect_interval", {}).get("min", 3)
    reconnect_max = sim_config.get("reconnect_interval", {}).get("max", 8)
    update_min = sim_config.get("update_interval", {}).get("min", 5)
    update_max = sim_config.get("update_interval", {}).get("max", 15)
    
    # Job simulation probabilities
    job_creation_probability = 0.05  # 5% chance per cycle
    job_deletion_probability = 0.03  # 3% chance per cycle
    
    # Create IoT client for job operations
    region = AWS_CONFIG.get("region")
    iot_client = boto3.client("iot", region_name=region)
    
    # Connection management variables
    connection_attempts = 0
    max_connection_attempts = 3
    connection_backoff = 5  # seconds

    while True:
        try:
            # Simulate random disconnection
            if device.connected and random.random() < disconnect_probability:
                print(f"\n🔴 {device.device_id}: Simulating random disconnection...")
                device.client.disconnect()
                device.connected = False
                time.sleep(
                    random.uniform(reconnect_min, reconnect_max)
                )  # Random downtime

            # Connection logic with retry limits and backoff
            if not device.connected:
                if connection_attempts < max_connection_attempts:
                    print(f"{device.device_id} attempting to connect... (attempt {connection_attempts + 1}/{max_connection_attempts})")
                    if device.connect():
                        print(f"{device.device_id} connected successfully")
                        connection_attempts = 0  # Reset counter on success
                    else:
                        connection_attempts += 1
                        backoff_time = connection_backoff * (2 ** (connection_attempts - 1))  # Exponential backoff
                        print(f"{device.device_id} connection failed, waiting {backoff_time}s before retry")
                        time.sleep(backoff_time)
                        continue
                else:
                    print(f"{device.device_id} max connection attempts reached, skipping for now")
                    time.sleep(30)  # Longer wait before trying again
                    connection_attempts = 0  # Reset counter
                    continue

            # If connected, update shadow
            device.update_shadow()

            # Reduce job creation probability to limit API calls
            if random.random() < job_creation_probability * 0.5:  # Reduced probability
                # Generate a random version number
                major = random.randint(1, 3)
                minor = random.randint(0, 9)
                patch = random.randint(0, 9)
                version = f"{major}.{minor}.{patch}"
                
                # Decide whether to target individual device or a group
                if random.random() < 0.3 and THING_GROUPS:  # 30% chance to target a group if groups exist
                    target = random.choice(THING_GROUPS)
                    print(f"Creating firmware update job for group {target}")
                else:
                    target = device.device_id
                    print(f"Creating firmware update job for device {target}")
                
                try:
                    job_id = create_firmware_update_job(iot_client, target, version)
                    created_jobs.append(job_id)
                except Exception as e:
                    print(f"Failed to create firmware update job: {str(e)}")
            
            # Randomly delete firmware update jobs
            if random.random() < job_deletion_probability and created_jobs:
                job_to_delete = random.choice(created_jobs)
                print(f"Attempting to delete job {job_to_delete}")
                if delete_job(iot_client, job_to_delete):
                    created_jobs.remove(job_to_delete)
            
            # Reduce frequency of retained message publishing
            if random.random() < 0.1:  # Reduced from 0.2 to 0.1
                # Get retained message patterns from config
                retained_config = config.config.get("retained_messages", {})
                topic_patterns = retained_config.get("topic_patterns", [])

                if topic_patterns:
                    # Select a random topic pattern
                    pattern = random.choice(topic_patterns)
                    prefix = pattern.get("prefix")

                    if prefix and "+" in prefix:
                        # Replace the '+' wildcard with the device ID
                        topic = prefix.replace("+", device.device_id)

                        # Generate a random payload based on the topic
                        if "info" in topic:
                            payload = {
                                "info": {
                                    "lastUpdated": int(time.time()),
                                    "firmwareVersion": device.fw_version,
                                    "hardwareVersion": device.hw_version,
                                    "country": {
                                        "code": device.country_code,
                                        "name": device.country_name,
                                    },
                                    "description": f"Additional info for {device.device_id}",
                                }
                            }
                        elif "meta" in topic:
                            payload = {
                                "meta": {
                                    "lastUpdated": int(time.time()),
                                    "deviceType": device.device_type,
                                    "category": device.category,
                                    "tags": [
                                        "simulated",
                                        device.category,
                                        device.country_code,
                                    ],
                                }
                            }
                        elif "sensor" in topic:
                            payload = {
                                "sensor": {
                                    "timestamp": int(time.time()),
                                    "readings": {
                                        "temperature": round(
                                            random.uniform(-10, 40), 1
                                        ),
                                        "humidity": round(random.uniform(0, 100), 1),
                                        "pressure": round(random.uniform(900, 1100), 1),
                                    },
                                }
                            }
                        elif "test1" in topic:
                            payload = {
                                "test": {
                                    "timestamp": int(time.time()),
                                    "value": random.randint(1, 100),
                                    "message": f"Test message from {device.device_id}",
                                }
                            }
                        else:
                            payload = {
                                "data": {
                                    "timestamp": int(time.time()),
                                    "value": random.random(),
                                    "deviceId": device.device_id,
                                }
                            }

                        # Publish the retained message
                        try:
                            device.publish_retained_message(topic, payload)
                            print(
                                f"{device.device_id}: Published retained message to {topic}"
                            )
                        except Exception as e:
                            print(
                                f"{device.device_id}: Error publishing retained message to {topic}: {str(e)}"
                            )

            # Randomly clear retained messages - reduced frequency
            if (
                random.random() < 0.05  # Reduced from 0.1 to 0.05
                and device.device_id in IoTDevice.retained_topics
                and IoTDevice.retained_topics[
                    device.device_id
                ]  # Check if there are any retained topics
            ):
                # Select a random topic to clear
                if IoTDevice.retained_topics[device.device_id]:
                    topic_to_clear = random.choice(
                        IoTDevice.retained_topics[device.device_id]
                    )
                    try:
                        print(
                            f"{device.device_id}: Clearing retained message from topic: {topic_to_clear}"
                        )
                        device.clear_retained_message(topic_to_clear)
                    except Exception as e:
                        print(
                            f"{device.device_id}: Error clearing retained message: {str(e)}"
                        )

            # Add a random delay between updates based on config - increased slightly
            time.sleep(random.uniform(update_min * 1.5, update_max * 1.5))

        except Exception as e:
            print(f"Error in {device.device_id}: {str(e)}")
            device.connected = False
            time.sleep(5)  # Wait before retry
