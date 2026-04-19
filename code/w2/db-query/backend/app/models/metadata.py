"""Metadata models for tables and views."""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List


class ColumnMetadata(BaseModel):
    """Metadata describing a single column in a database table."""

    model_config = ConfigDict(populate_by_name=True)

    name: str = Field(alias="columnName")
    data_type: str = Field(alias="dataType")
    is_nullable: bool = Field(default=False, alias="isNullable")
    character_maximum_length: Optional[int] = Field(default=None, alias="characterMaximumLength")


class TableMetadata(BaseModel):
    """Metadata describing a database table and its columns."""

    model_config = ConfigDict(populate_by_name=True)

    name: str
    columns: List[ColumnMetadata] = Field(default_factory=list)


class ViewMetadata(BaseModel):
    """Metadata describing a database view."""

    model_config = ConfigDict(populate_by_name=True)

    name: str
    definition: Optional[str] = None


class DatabaseMetadata(BaseModel):
    """Complete metadata for a database including all tables and views."""

    model_config = ConfigDict(populate_by_name=True)

    tables: List[TableMetadata] = Field(default_factory=list)
    views: List[ViewMetadata] = Field(default_factory=list)
