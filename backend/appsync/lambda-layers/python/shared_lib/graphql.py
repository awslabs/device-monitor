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

"""GraphQL operation loader."""
import os
from pathlib import Path
import re

def get_operation_file_path(operation_type):
    """Get the path to a GraphQL operation file.
    
    Args:
        operation_type: One of 'queries', 'mutations', 'subscriptions'
        
    Returns:
        Path to the GraphQL operations file
    """
    # Navigate from lambda layer to shared operations
    base_dir = Path(__file__).parent.parent.parent.parent.parent.parent
    return base_dir / 'shared' / 'src' / 'appsync' / 'operations' / f'{operation_type}.graphql'

def load_operation(operation_type, name):
    """Load a specific GraphQL operation from file.
    
    Args:
        operation_type: One of 'queries', 'mutations', 'subscriptions'
        name: Operation name (e.g. 'GetDevice')
        
    Returns:
        The GraphQL operation string
    """
    file_path = get_operation_file_path(operation_type)
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Basic extraction of operation (would need refinement in production)
    pattern = rf"(?:query|mutation|subscription)\s+{name}\s*\([^{{]*\)\s*{{\s*[^{{]+{{.*?}}\s*}}"
    match = re.search(pattern, content, re.DOTALL)
    if not match:
        raise ValueError(f"Operation '{name}' not found in {operation_type}.graphql")
    return match.group(0)
