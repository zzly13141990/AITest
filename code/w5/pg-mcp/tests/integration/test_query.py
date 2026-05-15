"""查询集成测试（需要真实数据库）。"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest

from pg_mcp.sql.executor import SQLExecutor
from pg_mcp.sql.validator import SQLValidator
from pg_mcp.utils.error import MCPError


@pytest.mark.integration
@pytest.mark.asyncio
async def test_full_query_flow(
    mock_pool_manager,
    mock_security_config,
    mock_schema_manager,
    mock_schema,
) -> None:
    """
    测试完整的查询流程：验证 -> 执行。
    这是一个集成级别的测试，mock 了数据库连接。
    """
    # 1. 验证只读 SQL
    sql = "SELECT * FROM users WHERE id > 10;"
    SQLValidator.validate_read_only(sql)

    # 2. 验证语法和对象
    validator = SQLValidator(mock_security_config, mock_schema_manager)
    validator.validate_syntax_and_objects(sql, mock_schema)

    # 3. 执行查询（mock）
    mock_pool = mock_pool_manager.get_pool("default")
    mock_conn = AsyncMock()
    mock_conn.__aenter__ = AsyncMock(return_value=mock_conn)
    mock_conn.__aexit__ = AsyncMock(return_value=False)
    # cursor 需要支持 async with conn.cursor() as cursor:
    mock_cursor = AsyncMock()
    mock_cursor.execute = AsyncMock()
    mock_cursor.fetchall = AsyncMock(return_value=[])
    mock_cursor.fetchone = AsyncMock(return_value=[0])
    mock_cursor.__aenter__ = AsyncMock(return_value=mock_cursor)
    mock_cursor.__aexit__ = AsyncMock(return_value=False)
    mock_conn.cursor = MagicMock(return_value=mock_cursor)
    mock_pool.acquire.return_value = mock_conn

    executor = SQLExecutor(mock_pool_manager, mock_security_config)
    results, total = await executor.execute(sql, "default")

    assert isinstance(results, list)
    assert isinstance(total, int)


@pytest.mark.integration
@pytest.mark.asyncio
async def test_query_rejected_non_readonly() -> None:
    """测试非只读查询被拒绝。"""
    sql = "DELETE FROM users;"
    with pytest.raises(MCPError) as exc_info:
        SQLValidator.validate_read_only(sql)
    assert "READ_ONLY" in exc_info.value.code
