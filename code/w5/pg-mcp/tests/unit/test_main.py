"""Main 模块集成单元测试。"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from pg_mcp.constants import ErrorCode
from pg_mcp.utils.error import MCPError

# 由于 fastmcp 已安装，直接导入 pg_mcp.main 会触发 FastMCP 应用创建和装饰器
# 因此用 patch 隔离模块级变量的访问，不依赖 @mcp.tool() 的 mock
import pg_mcp.main as _pg_mcp_main


@pytest.fixture
def _patch_globals():
    """将 pg_mcp.main 的模块级全局变量替换为 mock。"""
    originals = {}
    mock_vals = {}
    for name in ("config", "pool_mgr", "schema_mgr", "sql_gen", "sql_validator", "sql_executor", "history_mgr"):
        originals[name] = getattr(_pg_mcp_main, name, None)
        mock_vals[name] = MagicMock()
    for name, val in mock_vals.items():
        setattr(_pg_mcp_main, name, val)
    yield mock_vals
    for name, val in originals.items():
        setattr(_pg_mcp_main, name, val)


@pytest.mark.asyncio
async def test_query_database_verification_warning(_patch_globals) -> None:
    """测试结果验证分数低于阈值时返回 verification_warning。"""
    mocks = _patch_globals

    mocks["config"].security_verification_threshold = 0.8
    mocks["config"].security_enable_result_verification = True
    mock_db = MagicMock()
    mock_db.name = "default"
    mocks["config"].databases = [mock_db]

    mocks["schema_mgr"].load_schema = AsyncMock()
    mocks["sql_gen"].generate = AsyncMock(return_value="SELECT * FROM users;")
    mocks["sql_gen"].verify_result = AsyncMock(return_value=0.3)
    mocks["sql_validator"].has_dangerous_functions_from_sql.return_value = None
    mocks["sql_executor"].execute = AsyncMock(return_value=([{"id": 1}], 10))
    mocks["history_mgr"].record = AsyncMock()

    result = await _pg_mcp_main.query_database("list all users")

    assert result["success"] is True
    assert result["verification_warning"] is not None
    assert "below threshold" in result["verification_warning"]
    assert result["verification_score"] == 0.3


@pytest.mark.asyncio
async def test_query_database_mcp_error_details(_patch_globals) -> None:
    """测试 MCPError 响应中包含 details 和 suggestion。"""
    mocks = _patch_globals

    mocks["config"].security_enable_sql_verification = False
    mocks["config"].security_enable_result_verification = False
    mock_db = MagicMock()
    mock_db.name = "default"
    mocks["config"].databases = [mock_db]

    mocks["schema_mgr"].load_schema = AsyncMock()
    mocks["sql_gen"].generate = AsyncMock(
        side_effect=MCPError(
            code=ErrorCode.QUERY_EXECUTION_ERROR,
            message="Query execution failed",
            details={"sql": "SELECT * FROM users"},
            suggestion="Check the SQL syntax and try again.",
        )
    )
    mocks["history_mgr"].record = AsyncMock()

    result = await _pg_mcp_main.query_database("list all users")

    assert result["success"] is False
    assert result["error"]["code"] == ErrorCode.QUERY_EXECUTION_ERROR.value
    assert result["error"]["message"] == "Query execution failed"
    assert result["error"]["details"] == {"sql": "SELECT * FROM users"}
    assert result["error"]["suggestion"] == "Check the SQL syntax and try again."


@pytest.mark.asyncio
async def test_query_database_unexpected_error_records_history(_patch_globals) -> None:
    """测试非 MCPError 异常被捕获并记录查询历史。"""
    mocks = _patch_globals

    mocks["config"].security_enable_sql_verification = False
    mocks["config"].security_enable_result_verification = False
    mock_db = MagicMock()
    mock_db.name = "default"
    mocks["config"].databases = [mock_db]

    mocks["schema_mgr"].load_schema = AsyncMock(side_effect=ValueError("unexpected error"))
    mocks["history_mgr"].record = AsyncMock()

    result = await _pg_mcp_main.query_database("list all users")

    assert result["success"] is False
    assert result["error"]["code"] == ErrorCode.INTERNAL_ERROR.value
    assert "unexpected error" in result["error"]["message"]
    mocks["history_mgr"].record.assert_awaited_once()
