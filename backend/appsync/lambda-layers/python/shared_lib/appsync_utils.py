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

"""Utilities for AppSync resolvers."""
import json
from typing import Any, Dict, Optional, TypeVar, Generic, Union, List

T = TypeVar('T')

class AppSyncError:
    """AppSync error format."""
    
    def __init__(self, message: str, error_type: str = "Error"):
        """Initialize AppSync error.
        
        Args:
            message: Error message
            error_type: Type of error
        """
        self.message = message
        self.type = error_type
        
    def to_dict(self) -> Dict[str, str]:
        """Convert to dictionary."""
        return {
            "message": self.message,
            "type": self.type
        }

class AppSyncResponse(Generic[T]):
    """Standard AppSync resolver response format."""
    
    def __init__(
        self, 
        data: Optional[T] = None, 
        errors: Optional[List[AppSyncError]] = None
    ):
        """Initialize AppSync response.
        
        Args:
            data: Response data
            errors: Response errors
        """
        self.data = data
        self.errors = errors
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON response."""
        result = {}
        if self.data is not None:
            result["data"] = self.data
        if self.errors:
            result["errors"] = [error.to_dict() for error in self.errors]
        return result

def create_response(data: Any) -> Dict[str, Any]:
    """Create a successful AppSync response.
    
    Args:
        data: Response data
        
    Returns:
        Formatted AppSync response
    """
    return AppSyncResponse(data=data).to_dict()

def create_error_response(error: Union[Exception, str]) -> Dict[str, Any]:
    """Create an error AppSync response.
    
    Args:
        error: Exception or error message
        
    Returns:
        Formatted AppSync error response
    """
    if isinstance(error, Exception):
        message = str(error)
        error_type = error.__class__.__name__
    else:
        message = error
        error_type = "Error"
        
    return AppSyncResponse(
        errors=[AppSyncError(message=message, error_type=error_type)]
    ).to_dict()
