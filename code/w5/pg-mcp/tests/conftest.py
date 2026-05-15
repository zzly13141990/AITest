"""
测试配置和 fixtures。
提供 LLM Mock、asyncpg Mock 等通用测试组件。
"""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest

from pg_mcp.config import DatabaseConfig, LLMConfig, SecurityConfig, Settings
from pg_mcp.database import ConnectionPoolManager, SchemaManager
from pg_mcp.history import HistoryManager
from pg_mcp.models.query import QueryHistory, QueryStatus
from pg_mcp.models.schema import ColumnInfo, DatabaseSchema, SchemaCache, TableInfo, ViewInfo
from pg_mcp.sql import SQLExecutor, SQLGenerator, SQLValidator


@pytest.fixture
def mock_settings() -> Settings:
    """创建模拟 Settings。"""
    return Settings(
        db_host="localhost",
        db_port=5432,
        db_username="test_user",
        db_password="test_pass",
        db_database="test_db",
        db_name="default",
        llm_api_key="test_key",
        llm_model="test_model",
        llm_api_base="https://test.api/",
        log_level="DEBUG",
    )


@pytest.fixture
def mock_database_config() -> DatabaseConfig:
    """创建模拟 DatabaseConfig。"""
    return DatabaseConfig(
        name="default",
        host="localhost",
        port=5432,
        username="test_user",
        password="test_pass",
        database="test_db",
    )


@pytest.fixture
def mock_llm_config(mock_settings: Settings) -> LLMConfig:
    """创建模拟 LLMConfig。"""
    return LLMConfig(mock_settings)


@pytest.fixture
def mock_security_config(mock_settings: Settings) -> SecurityConfig:
    """创建模拟 SecurityConfig。"""
    return SecurityConfig(mock_settings)


@pytest.fixture
def mock_pool_manager() -> ConnectionPoolManager:
    """创建模拟 ConnectionPoolManager（基于 aioodbc cursor 模式）。

    注意：conn 用 MagicMock（conn.cursor() 不被 await），
    cursor 用 AsyncMock（execute/fetchall 被 await）。
    """
    manager = ConnectionPoolManager()
    # 模拟连接池
    mock_pool = MagicMock()
    mock_conn = MagicMock()
    mock_cursor = AsyncMock()
    mock_cursor.execute = AsyncMock()
    mock_cursor.fetchall = AsyncMock(return_value=[])
    mock_cursor.__aenter__ = AsyncMock(return_value=mock_cursor)
    mock_cursor.__aexit__ = AsyncMock(return_value=False)
    mock_conn.cursor = MagicMock(return_value=mock_cursor)
    mock_conn.__aenter__ = AsyncMock(return_value=mock_conn)
    mock_conn.__aexit__ = AsyncMock(return_value=False)
    mock_pool.acquire = MagicMock(return_value=mock_conn)
    manager._pools["default"] = mock_pool
    return manager


@pytest.fixture
def mock_schema() -> DatabaseSchema:
    """创建模拟 DatabaseSchema。"""
    columns = [
        ColumnInfo(name="id", data_type="integer", is_nullable=False, is_primary_key=True),
        ColumnInfo(name="name", data_type="varchar", is_nullable=True),
        ColumnInfo(name="email", data_type="varchar", is_nullable=True),
        ColumnInfo(name="created_at", data_type="timestamp", is_nullable=True),
    ]
    table = TableInfo(name="users", columns=columns, primary_key=["id"])
    return DatabaseSchema(
        database="test_db",
        tables={"users": table},
        views={},
    )


@pytest.fixture
def mock_schema_cache() -> SchemaCache:
    """创建模拟 SchemaCache。"""
    return SchemaCache(ttl_seconds=60)


@pytest.fixture
def mock_schema_manager(mock_pool_manager: ConnectionPoolManager) -> SchemaManager:
    """创建模拟 SchemaManager。"""
    return SchemaManager(mock_pool_manager, ttl_seconds=60)


@pytest.fixture
def mock_sql_generator(mock_llm_config: LLMConfig) -> SQLGenerator:
    """创建模拟 SQLGenerator。"""
    return SQLGenerator(mock_llm_config)


@pytest.fixture
def mock_sql_validator(
    mock_security_config: SecurityConfig,
    mock_schema_manager: SchemaManager,
) -> SQLValidator:
    """创建模拟 SQLValidator。"""
    return SQLValidator(mock_security_config, mock_schema_manager)


@pytest.fixture
def mock_sql_executor(
    mock_pool_manager: ConnectionPoolManager,
    mock_security_config: SecurityConfig,
) -> SQLExecutor:
    """创建模拟 SQLExecutor。"""
    return SQLExecutor(mock_pool_manager, mock_security_config)


@pytest.fixture
def mock_history_manager(tmp_path: Path) -> HistoryManager:
    """创建模拟 HistoryManager（使用临时目录）。"""
    return HistoryManager(history_dir=tmp_path / "history")


@pytest.fixture
def sample_query_history() -> QueryHistory:
    """创建示例 QueryHistory。"""
    return QueryHistory(
        id="20250101120000000001",
        user_query="查询所有用户",
        generated_sql="SELECT * FROM users;",
        db_name="default",
        status=QueryStatus.SUCCESS,
        result_rows=10,
        execution_time_ms=150.0,
        user="test_user",
        timestamp=datetime.now(),
    )
