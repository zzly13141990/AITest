"""SQL query models for request/response."""

from pydantic import BaseModel, Field, ConfigDict
from typing import Any, List, Optional


class GenerateSqlRequest(BaseModel):
    """Request model for generating SQL from natural language."""

    model_config = ConfigDict(populate_by_name=True)

    connection_id: int = Field(alias="connectionId")
    prompt: str = Field(..., min_length=1)


class GenerateSqlResponse(BaseModel):
    """Response model containing generated SQL and explanation."""

    model_config = ConfigDict(populate_by_name=True)

    sql: str
    explanation: Optional[str] = None


class ExecuteSqlRequest(BaseModel):
    """Request model for executing a raw SQL query."""

    model_config = ConfigDict(populate_by_name=True)

    connection_id: int = Field(alias="connectionId")
    sql: str = Field(..., min_length=1)


class ExecuteSqlResponse(BaseModel):
    """Response model containing query results."""

    model_config = ConfigDict(populate_by_name=True)

    columns: List[str]
    rows: List[dict[str, Any]]
    row_count: int = Field(alias="rowCount")
