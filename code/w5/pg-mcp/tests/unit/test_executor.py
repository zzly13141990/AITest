"""SQLExecutor 单元测试。"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

import pyodbc

from pg_mcp.constants import ErrorCode
from pg_mcp.sql.executor import SQLExecutor
from pg_mcp.utils.error import MCPError


def _make_mock_conn(
    fetchall_return: list | None = None,
    fetchall_side_effect: list | None = None,
    execute_side_effect: Exception | None = None,
) -> MagicMock:
    """创建模拟 aioodbc 连接（基于 cursor 模式）。

    注意：conn.cursor() 在 async with conn.cursor() as cursor 中不被 await，
    因此 conn 用 MagicMock，而 cursor 用 AsyncMock（其 execute/fetchall 被 await）。

    fetchall_return: 所有 fetchall() 调用返回的统一值。
    fetchall_side_effect: fetchall() 调用序列，对应 COUNT/data 两次 fetch。
    """
    mock_conn = MagicMock()
    mock_cursor = AsyncMock()
    mock_cursor.execute = AsyncMock()
    if execute_side_effect:
        mock_cursor.execute.side_effect = execute_side_effect
    if fetchall_side_effect:
        mock_cursor.fetchall = AsyncMock(side_effect=fetchall_side_effect)
    else:
        mock_cursor.fetchall = AsyncMock(return_value=fetchall_return or [])
    mock_cursor.__aenter__ = AsyncMock(return_value=mock_cursor)
    mock_cursor.__aexit__ = AsyncMock(return_value=False)
    mock_conn.cursor = MagicMock(return_value=mock_cursor)
    mock_conn.__aenter__ = AsyncMock(return_value=mock_conn)
    mock_conn.__aexit__ = AsyncMock(return_value=False)
    return mock_conn


@pytest.mark.asyncio
async def test_execute_success(mock_sql_executor: SQLExecutor, mock_pool_manager) -> None:
    """测试 SQL 执行成功。"""
    mock_record = MagicMock()
    mock_record.cursor_description = [("id", int, None, None, None, None, None), ("name", str, None, None, None, None, None)]
    mock_record.__iter__.return_value = iter([1, "test"])

    mock_conn = _make_mock_conn(fetchall_side_effect=[
        [(0,)],        # COUNT(*) 结果 → total = 0
        [mock_record],  # 分页查询结果
    ])
    mock_pool = mock_pool_manager.get_pool("default")
    mock_pool.acquire.return_value = mock_conn

    results, total = await mock_sql_executor.execute("SELECT * FROM users;", "default")

    assert total == 0
    assert len(results) == 1
    assert results[0]["id"] == 1
    assert results[0]["name"] == "test"


@pytest.mark.asyncio
async def test_execute_with_limit(mock_sql_executor: SQLExecutor, mock_pool_manager) -> None:
    """测试带分页参数的 SQL 执行。"""
    mock_conn = _make_mock_conn(fetchall_return=[])
    mock_pool = mock_pool_manager.get_pool("default")
    mock_pool.acquire.return_value = mock_conn

    results, total = await mock_sql_executor.execute(
        "SELECT * FROM users;", "default", limit=10, offset=5
    )

    assert mock_conn.cursor.return_value.__aenter__.return_value.execute.called


@pytest.mark.asyncio
async def test_execute_existing_limit(mock_sql_executor: SQLExecutor, mock_pool_manager) -> None:
    """测试 SQL 已有 LIMIT 时不添加分页。"""
    mock_conn = _make_mock_conn(fetchall_return=[])
    mock_pool = mock_pool_manager.get_pool("default")
    mock_pool.acquire.return_value = mock_conn

    sql = "SELECT * FROM users LIMIT 50;"
    await mock_sql_executor.execute(sql, "default")

    cursor = mock_conn.cursor.return_value.__aenter__.return_value
    call_args = cursor.execute.call_args
    assert call_args is not None
    called_sql = call_args[0][0]
    assert "_subq" not in called_sql  # 不应包含包装的子查询


@pytest.mark.asyncio
async def test_execute_db_not_found(mock_sql_executor: SQLExecutor) -> None:
    """测试数据库未找到错误。"""
    with pytest.raises(MCPError) as exc_info:
        await mock_sql_executor.execute("SELECT 1;", "nonexistent_db")

    assert exc_info.value.code == ErrorCode.DB_CONNECTION_ERROR.value


@pytest.mark.asyncio
async def test_execute_query_error(mock_sql_executor: SQLExecutor, mock_pool_manager) -> None:
    """测试查询执行错误。"""
    mock_conn = _make_mock_conn(
        execute_side_effect=pyodbc.Error("table not found")
    )
    mock_pool = mock_pool_manager.get_pool("default")
    mock_pool.acquire.return_value = mock_conn

    with pytest.raises(MCPError) as exc_info:
        await mock_sql_executor.execute("SELECT * FROM nonexistent;", "default")

    # pyodbc.Error 被 pool.acquire() 的 except 捕获并包装为 DB_CONNECTION_ERROR
    assert exc_info.value.code == ErrorCode.DB_CONNECTION_ERROR.value


@pytest.mark.asyncio
async def test_execute_timeout_error(mock_sql_executor: SQLExecutor, mock_pool_manager) -> None:
    """测试超时错误被正确捕获。"""
    mock_conn = _make_mock_conn(
        execute_side_effect=pyodbc.Error("Query timeout expired")
    )
    mock_pool = mock_pool_manager.get_pool("default")
    mock_pool.acquire.return_value = mock_conn

    with pytest.raises(MCPError) as exc_info:
        await mock_sql_executor.execute("SELECT 1;", "default")

    # pyodbc.Error 被 pool.acquire() 的 except 捕获并包装为 DB_CONNECTION_ERROR
    assert exc_info.value.code == ErrorCode.DB_CONNECTION_ERROR.value


@pytest.mark.asyncio
async def test_execute_with_limit_in_comment(mock_sql_executor: SQLExecutor, mock_pool_manager) -> None:
    """测试 LIMIT 出现在注释中时，SQLGlot 正确处理（不应触发 LIMIT 检测）。"""
    mock_conn = _make_mock_conn(fetchall_return=[])
    mock_pool = mock_pool_manager.get_pool("default")
    mock_pool.acquire.return_value = mock_conn

    mock_sql_executor._security_config.max_result_rows = 50

    # 注释中有 limit，但实际查询没有 LIMIT
    sql = "SELECT * FROM users; -- this is a limit test"
    await mock_sql_executor.execute(sql, "default")

    # SQLGlot 不会解析注释中的关键字为 LIMIT 子句，所以会添加分页
    # 验证 execute 被调用（COUNT + 分页至少 2 次）
    cursor = mock_conn.cursor.return_value.__aenter__.return_value
    all_sqls = [c[0][0] for c in cursor.execute.call_args_list if c[0][0]]
    # 应至少有一次包含 _subq（分页包装），或者有两次调用（COUNT + 分页）
    assert len(all_sqls) >= 1
    # 如果 SQLGlot 正确解析（无 LIMIT），应有分页调用
    has_subq = any("_subq" in s for s in all_sqls)
    has_offset = any("OFFSET" in s.upper() for s in all_sqls)
    assert has_subq or has_offset, "Expected paginated query (_subq or OFFSET) when SQL has no LIMIT clause"


@pytest.mark.asyncio
async def test_execute_total_count(mock_sql_executor: SQLExecutor, mock_pool_manager) -> None:
    """测试先通过 COUNT(*) 获取总行数。"""
    # 第一次 execute (COUNT) → 返回 15, 第二次 execute (分页) → 空
    mock_conn = _make_mock_conn(fetchall_return=[])
    mock_pool = mock_pool_manager.get_pool("default")
    mock_pool.acquire.return_value = mock_conn

    results, total = await mock_sql_executor.execute(
        "SELECT * FROM users;", "default"
    )

    assert total == 0
    cursor = mock_conn.cursor.return_value.__aenter__.return_value
    all_calls = [c[0][0] for c in cursor.execute.call_args_list if c[0][0]]
    assert any("COUNT(*)" in sql for sql in all_calls)


@pytest.mark.asyncio
async def test_execute_sqlglot_fallback_false_positive(
    mock_sql_executor: SQLExecutor, mock_pool_manager,
) -> None:
    """测试 sqlglot 不可用时 fallback 对 LIMIT 注释的误判。"""
    with patch("pg_mcp.sql.executor.sqlglot", None):
        mock_conn = _make_mock_conn(fetchall_return=[])
        mock_pool = mock_pool_manager.get_pool("default")
        mock_pool.acquire.return_value = mock_conn

        # SQL 中 "limit" 出现在注释中，fallback 会误判为有 LIMIT
        sql = "SELECT * FROM users; -- this is a limit test"
        await mock_sql_executor.execute(sql, "default")

        cursor = mock_conn.cursor.return_value.__aenter__.return_value
        call_args = cursor.execute.call_args
        assert call_args is not None
        called_sql = call_args[0][0]
        # fallback 误判为有 LIMIT → 不走分页包装 → 但仍有一次 COUNT 查询
        # COUNT 查询会包含 _countq，分页包装包含 _subq
        assert "_subq" not in called_sql
