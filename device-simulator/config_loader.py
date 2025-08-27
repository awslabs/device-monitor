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

import os
import yaml
from typing import Dict, Any, Optional


class ConfigLoader:
    """
    Handles loading and validating configuration from YAML files
    """

    def __init__(self, config_path: str = "dev-config.yaml"):
        """
        Initialize the config loader with the path to the config file

        Args:
            config_path: Path to the YAML configuration file
        """
        # Try to find the config file in the current directory or in the device-simulator directory
        if os.path.exists(config_path):
            self.config_path = config_path
        elif os.path.exists(os.path.join("device-simulator", config_path)):
            self.config_path = os.path.join("device-simulator", config_path)
        else:
            # Get the directory of this script
            script_dir = os.path.dirname(os.path.abspath(__file__))
            self.config_path = os.path.join(script_dir, config_path)
            
        self.config = self._load_config()

    def _load_config(self) -> Dict[str, Any]:
        """
        Load configuration from YAML file

        Returns:
            Dict containing the configuration
        """
        if not os.path.exists(self.config_path):
            raise FileNotFoundError(f"Configuration file not found: {self.config_path}")

        with open(self.config_path, "r") as file:
            try:
                config = yaml.safe_load(file)
                return config
            except yaml.YAMLError as e:
                raise ValueError(f"Error parsing YAML configuration: {str(e)}")

    def get_aws_config(self) -> Dict[str, str]:
        """
        Get AWS configuration

        Returns:
            Dict containing AWS configuration
        """
        return self.config.get("aws", {})

    def get_simulation_config(self) -> Dict[str, Any]:
        """
        Get simulation configuration

        Returns:
            Dict containing simulation configuration
        """
        return self.config.get("simulation", {})

    def get_device_config(self) -> Dict[str, Any]:
        """
        Get device configuration

        Returns:
            Dict containing device configuration
        """
        return self.config.get("device", {})

    def get_shadow_config(self) -> Dict[str, Any]:
        """
        Get shadow configuration

        Returns:
            Dict containing shadow configuration
        """
        return self.config.get("shadow", {})

    def get_value(self, key_path: str, default: Any = None) -> Any:
        """
        Get a specific configuration value using dot notation

        Args:
            key_path: Path to the configuration value using dot notation (e.g., 'aws.endpoint')
            default: Default value to return if the key is not found

        Returns:
            Configuration value or default if not found
        """
        keys = key_path.split(".")
        value = self.config

        for key in keys:
            if isinstance(value, dict) and key in value:
                value = value[key]
            else:
                return default

        return value


# Create a singleton instance for easy import
config = ConfigLoader()


def load_config(config_path: Optional[str] = None) -> ConfigLoader:
    """
    Load configuration from a specific path

    Args:
        config_path: Path to the YAML configuration file

    Returns:
        ConfigLoader instance
    """
    global config
    if config_path:
        config = ConfigLoader(config_path)
    return config
