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

"""AWS Lambda Powertools setup for Python Lambdas."""
from aws_lambda_powertools import Logger, Metrics, Tracer
from aws_lambda_powertools.utilities.typing import LambdaContext

# Initialize powertools
logger = Logger()
tracer = Tracer()
metrics = Metrics(namespace="FleetWatch")

# Default dimensions similar to the TypeScript version
default_dimensions = {
    "service": "fleetwatch"
}

def add_monitoring_details(additional_dimensions=None):
    """Add custom dimensions to metrics.
    
    Args:
        additional_dimensions: Dictionary of additional dimensions to add to metrics.
    """
    if additional_dimensions:
        # In newer versions of Powertools, we use add_dimension or set_dimensions
        try:
            # Try the newer method first
            for key, value in additional_dimensions.items():
                metrics.add_dimension(name=key, value=value)
        except AttributeError:
            # Fall back to set_dimensions if add_dimension is not available
            metrics.set_dimensions(**additional_dimensions)