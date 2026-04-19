"""Common API response model with generic type support."""

from pydantic import BaseModel, Field, ConfigDict
from typing import Generic, TypeVar, Optional

T = TypeVar('T')


class ApiResponse(BaseModel, Generic[T]):
    """Generic API response wrapper for consistent response format."""

    model_config = ConfigDict(populate_by_name=True)

    code: int = 200
    message: str = "success"
    data: Optional[T] = None
