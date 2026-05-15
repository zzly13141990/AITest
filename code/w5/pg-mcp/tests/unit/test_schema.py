"""Schema 模型单元测试。"""

from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock

import pytest

from pg_mcp.database.schema import SchemaManager
from pg_mcp.models.schema import ColumnInfo, DatabaseSchema, SchemaCache, TableInfo, ViewInfo


def test_column_info_defaults() -> None:
    """测试 ColumnInfo 默认值。"""
    col = ColumnInfo(name="id", data_type="integer")
    assert col.name == "id"
    assert col.data_type == "integer"
    assert col.is_nullable is True
    assert col.is_primary_key is False


def test_table_info_qualified_name_public() -> None:
    """测试 public schema 的 qualified_name。"""
    table = TableInfo(name="users")
    assert table.qualified_name == "users"


def test_table_info_qualified_name_non_public() -> None:
    """测试非 public schema 的 qualified_name。"""
    table = TableInfo(name="users", schema="audit")
    assert table.qualified_name == "audit.users"


def test_view_info_qualified_name() -> None:
    """测试 ViewInfo qualified_name。"""
    view = ViewInfo(name="active_users")
    assert view.qualified_name == "active_users"

    view2 = ViewInfo(name="active_users", schema="reports")
    assert view2.qualified_name == "reports.active_users"


def test_database_schema_get_table(mock_schema: DatabaseSchema) -> None:
    """测试 get_table 方法。"""
    table = mock_schema.get_table("users")
    assert table is not None
    assert table.name == "users"


def test_database_schema_get_view(mock_schema: DatabaseSchema) -> None:
    """测试 get_view 方法。"""
    assert mock_schema.get_view("nonexistent") is None


def test_database_schema_get_all_names(mock_schema: DatabaseSchema) -> None:
    """测试 get_all_names 方法。"""
    names = mock_schema.get_all_names()
    assert "users" in names


def test_database_schema_to_prompt_text(mock_schema: DatabaseSchema) -> None:
    """测试 to_prompt_text 方法。"""
    text = mock_schema.to_prompt_text()
    assert "Database: test_db" in text
    assert "users" in text


def test_schema_cache_set_and_get() -> None:
    """测试 SchemaCache 基本操作。"""
    cache = SchemaCache(ttl_seconds=60)
    schema = DatabaseSchema(database="test")
    cache.set("db1", schema)
    result = cache.get("db1")
    assert result is schema


def test_schema_cache_miss() -> None:
    """测试 SchemaCache 未命中。"""
    cache = SchemaCache(ttl_seconds=60)
    assert cache.get("nonexistent") is None


def test_schema_cache_expire() -> None:
    """测试 SchemaCache TTL 过期。"""
    cache = SchemaCache(ttl_seconds=0)  # 0 秒立即过期
    schema = DatabaseSchema(database="test")
    cache.set("db1", schema)
    import time
    time.sleep(0.01)  # 确保时间差
    assert cache.get("db1") is None


def test_schema_cache_invalidate() -> None:
    """测试 SchemaCache invalidate。"""
    cache = SchemaCache(ttl_seconds=60)
    schema = DatabaseSchema(database="test")
    cache.set("db1", schema)
    cache.invalidate("db1")
    assert cache.get("db1") is None


def test_schema_cache_invalidate_all() -> None:
    """测试 SchemaCache invalidate_all。"""
    cache = SchemaCache(ttl_seconds=60)
    cache.set("db1", DatabaseSchema(database="db1"))
    cache.set("db2", DatabaseSchema(database="db2"))
    cache.invalidate_all()
    assert cache.get("db1") is None
    assert cache.get("db2") is None


def test_schema_cache_set_ttl() -> None:
    """测试 SchemaCache set_ttl。"""
    cache = SchemaCache(ttl_seconds=60)
    cache.set_ttl(120)
    assert cache._ttl_seconds == 120


@pytest.mark.asyncio
async def test_schema_manager_refresh_all_gather(
    mock_schema_manager: SchemaManager, mock_pool_manager,
) -> None:
    """测试 refresh_all 通过 asyncio.gather 并行刷新所有数据库缓存。"""
    # 添加第二个数据库连接池
    mock_pool2 = MagicMock()
    mock_pool_manager._pools["analytics"] = mock_pool2

    # 替换 load_all 为 AsyncMock
    mock_schema_manager.load_all = AsyncMock()  # type: ignore[method-assign]

    await mock_schema_manager.refresh_all()

    assert mock_schema_manager.load_all.call_count == 2
    mock_schema_manager.load_all.assert_any_call("default")
    mock_schema_manager.load_all.assert_any_call("analytics")
