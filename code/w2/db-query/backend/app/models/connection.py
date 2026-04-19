"""Database connection models with camelCase aliases."""

from pydantic import BaseModel, Field, ConfigDict


class ConnectionCreate(BaseModel):
    """Model for creating a new database connection."""

    model_config = ConfigDict(populate_by_name=True)

    name: str = Field(..., min_length=1, max_length=100)
    host: str = Field(..., min_length=1)
    port: int = Field(default=5432, ge=1, le=65535)
    database: str = Field(..., min_length=1)
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class ConnectionResponse(BaseModel):
    """Model for returning database connection details in API responses."""

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    name: str = Field(alias="connectionName")
    host: str
    port: int
    database: str
    username: str
