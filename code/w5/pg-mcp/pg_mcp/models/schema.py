"""Schema 相关数据模型。"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, Field


class ColumnInfo(BaseModel):
    """列信息。"""

    name: str
    data_type: str
    is_nullable: bool = True
    column_default: str | None = None
    ordinal_position: int = 1
    character_maximum_length: int | None = None
    is_primary_key: bool = False
    comment: str | None = None


class TableInfo(BaseModel):
    """表信息。"""

    name: str
    table_schema: str = Field(default="dbo", alias="schema")
    columns: list[ColumnInfo] = Field(default_factory=list)
    primary_key: list[str] = Field(default_factory=list)
    foreign_keys: list[dict[str, Any]] = Field(default_factory=list)
    comment: str | None = None
    row_estimate: int | None = None

    @property
    def qualified_name(self) -> str:
        """返回 schema.table 格式的名称。"""
        if self.table_schema == "dbo":
            return self.name
        return f"{self.table_schema}.{self.name}"


class ViewInfo(BaseModel):
    """视图信息。"""

    name: str
    view_schema: str = Field(default="dbo", alias="schema")
    definition: str = ""
    comment: str | None = None

    @property
    def qualified_name(self) -> str:
        """返回 schema.view 格式的名称。"""
        if self.view_schema == "dbo":
            return self.name
        return f"{self.view_schema}.{self.name}"


class DatabaseSchema(BaseModel):
    """数据库 Schema 完整信息。"""

    database: str
    tables: dict[str, TableInfo] = Field(default_factory=dict)
    views: dict[str, ViewInfo] = Field(default_factory=dict)

    def get_table(self, table_name: str) -> TableInfo | None:
        """根据名称获取表信息。"""
        return self.tables.get(table_name)

    def get_view(self, view_name: str) -> ViewInfo | None:
        """根据名称获取视图信息。"""
        return self.views.get(view_name)

    def get_all_names(self) -> list[str]:
        """获取所有表和视图的名称列表。"""
        return list(self.tables.keys()) + list(self.views.keys())

    def to_prompt_text(self) -> str:
        """转换为 LLM 可读的 Schema 描述文本。"""
        parts: list[str] = [f"Database: {self.database}\n"]

        if self.tables:
            parts.append("Tables:")
            for table in self.tables.values():
                parts.append(f"  - {table.qualified_name}")
                for col in table.columns:
                    pk_marker = " [PK]" if col.is_primary_key else ""
                    nullable = "NULL" if col.is_nullable else "NOT NULL"
                    parts.append(f"      {col.name}: {col.data_type} {nullable}{pk_marker}")
                if table.comment:
                    parts.append(f"      Comment: {table.comment}")
            parts.append("")

        if self.views:
            parts.append("Views:")
            for view in self.views.values():
                parts.append(f"  - {view.qualified_name}")
            parts.append("")

        return "\n".join(parts)


class SchemaCache:
    """Schema 缓存管理器。"""

    def __init__(self, ttl_seconds: int = 300) -> None:
        self._cache: dict[str, DatabaseSchema] = {}
        self._timestamps: dict[str, datetime] = {}
        self._ttl_seconds: int = ttl_seconds

    def get(self, key: str) -> DatabaseSchema | None:
        """获取缓存，如果过期则返回 None。"""
        if key not in self._cache:
            return None
        timestamp = self._timestamps.get(key)
        if timestamp is None:
            return None
        if (datetime.now(tz=timezone.utc) - timestamp).total_seconds() > self._ttl_seconds:
            del self._cache[key]
            del self._timestamps[key]
            return None
        return self._cache[key]

    def set(self, key: str, schema: DatabaseSchema) -> None:
        """设置缓存。"""
        self._cache[key] = schema
        self._timestamps[key] = datetime.now(tz=timezone.utc)

    def invalidate(self, key: str) -> None:
        """使指定缓存失效。"""
        self._cache.pop(key, None)
        self._timestamps.pop(key, None)

    def invalidate_all(self) -> None:
        """使所有缓存失效。"""
        self._cache.clear()
        self._timestamps.clear()

    def set_ttl(self, ttl_seconds: int) -> None:
        """更新 TTL。"""
        self._ttl_seconds = ttl_seconds
