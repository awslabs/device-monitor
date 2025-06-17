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
import os

REGISTRY_FILE = "device_registry.json"


def load_registry():
    if os.path.exists(REGISTRY_FILE):
        with open(REGISTRY_FILE, "r") as f:
            return json.load(f)
    return {"devices": {}}


def save_registry(registry):
    with open(REGISTRY_FILE, "w") as f:
        json.dump(registry, f, indent=2)


def get_device_id(index, device_type, device_category):
    registry = load_registry()
    key = f"{index}_{device_type}_{device_category}"

    if key in registry["devices"]:
        return registry["devices"][key]["device_id"]
    return None


def register_device(index, device_type, device_category, device_id, **kwargs):
    registry = load_registry()
    key = f"{index}_{device_type}_{device_category}"

    device_info = {
        "device_id": device_id,
        "type": device_type,
        "category": device_category,
    }

    # Add any additional attributes
    device_info.update(kwargs)

    registry["devices"][key] = device_info
    save_registry(registry)


def get_device_info(index, device_type, device_category):
    registry = load_registry()
    key = f"{index}_{device_type}_{device_category}"

    if key in registry["devices"]:
        return registry["devices"][key]
    return None


def get_device_by_index(index):
    """Get device info by index only, useful for first lookup"""
    registry = load_registry()

    # Look for any key that starts with the index
    for key, device in registry["devices"].items():
        if key.startswith(f"{index}_"):
            return device

    return None
