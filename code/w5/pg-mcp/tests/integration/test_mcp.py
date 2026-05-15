"""MCP Server 集成测试。"""

from __future__ import annotations

import pytest

from pg_mcp import __version__


@pytest.mark.integration
def test_version() -> None:
    """测试版本号定义。"""
    assert __version__ == "0.1.0"


@pytest.mark.integration
def test_constants_imports() -> None:
    """测试常量模块导入。"""
    from pg_mcp.constants import (
        ALLOWED_QUERY_TYPES,
        DANGEROUS_FUNCTIONS,
        DEFAULT_DB_NAME,
        ErrorCode,
    )

    assert isinstance(ErrorCode.DB_CONNECTION_ERROR.value, str)
    assert "SELECT" in ALLOWED_QUERY_TYPES
    assert len(DANGEROUS_FUNCTIONS) > 0


@pytest.mark.integration
def test_error_handling() -> None:
    """测试错误处理模块。"""
    from pg_mcp.constants import ErrorCode
    from pg_mcp.utils.error import MCPError, format_error, is_mcp_error, to_dict

    err = MCPError(code=ErrorCode.DB_CONNECTION_ERROR, message="Connection failed")
    assert err.code == ErrorCode.DB_CONNECTION_ERROR.value
    assert "Connection failed" in str(err)

    d = to_dict(err)
    assert d["error"]["code"] == ErrorCode.DB_CONNECTION_ERROR.value
    assert d["error"]["message"] == "Connection failed"

    assert is_mcp_error(err) is True
    assert is_mcp_error(ValueError("test")) is False

    assert format_error(err) == f"[{err.code}] {err.message}"


@pytest.mark.integration
def test_all_modules_importable() -> None:
    """测试所有模块可正常导入。"""
    from pg_mcp.config import LLMConfig, SecurityConfig, Settings, load_config
    from pg_mcp.database import ConnectionPoolManager, SchemaManager
    from pg_mcp.history import HistoryManager
    from pg_mcp.models import ColumnInfo, DatabaseSchema, QueryHistory, QueryStatus, SchemaCache, TableInfo, ViewInfo
    from pg_mcp.sql import SQLExecutor, SQLGenerator, SQLValidator
    from pg_mcp.utils import MCPError, format_error, get_logger, is_mcp_error, to_dict

    # 确保导入成功（如果到达这里说明导入成功）
    assert callable(load_config)
    assert callable(get_logger)
