"""连接池管理器单元测试。"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from pg_mcp.config import DatabaseConfig
from pg_mcp.database.pool import ConnectionPoolManager


@pytest.fixture
def mock_pool() -> MagicMock:
    pool = MagicMock()
    mock_conn = MagicMock()
    mock_cursor = AsyncMock()
    mock_cursor.execute = AsyncMock()
    mock_cursor.__aenter__ = AsyncMock(return_value=mock_cursor)
    mock_cursor.__aexit__ = AsyncMock(return_value=False)
    mock_conn.cursor = MagicMock(return_value=mock_cursor)
    mock_conn.__aenter__ = AsyncMock(return_value=mock_conn)
    mock_conn.__aexit__ = AsyncMock(return_value=False)
    pool.acquire.return_value = mock_conn
    return pool


@pytest.mark.asyncio
async def test_initialize_single_pool(mock_pool: AsyncMock) -> None:
    """测试初始化单个连接池。"""
    config = DatabaseConfig(
        name="test",
        host="localhost",
        username="user",
        password="pass",
        database="testdb",
    )

    with patch("pg_mcp.database.pool.aioodbc.create_pool", new_callable=AsyncMock) as mock_create:
        mock_create.return_value = mock_pool
        mgr = ConnectionPoolManager()
        await mgr.initialize([config])

    assert mock_create.called
    assert mgr.get_pool_names() == ["test"]


@pytest.mark.asyncio
async def test_initialize_skip_existing() -> None:
    """测试重复初始化时跳过已存在的池。"""
    config = DatabaseConfig(
        name="test",
        host="localhost",
        username="user",
        password="pass",
        database="testdb",
    )

    mgr = ConnectionPoolManager()
    mgr._pools["test"] = MagicMock()  # 模拟已存在的池
    await mgr.initialize([config])

    assert len(mgr._pools) == 1


@pytest.mark.asyncio
async def test_initialize_continues_on_failure() -> None:
    """测试一个池初始化失败不影响其他池。"""
    configs = [
        DatabaseConfig(name="db1", host="host1", username="u", password="p", database="d1"),
        DatabaseConfig(name="db2", host="host2", username="u", password="p", database="d2"),
    ]

    mock_pool = MagicMock()

    with patch("pg_mcp.database.pool.aioodbc.create_pool", new_callable=AsyncMock) as mock_create:
        mock_create.side_effect = [Exception("Connection refused"), mock_pool]

        mgr = ConnectionPoolManager()
        await mgr.initialize(configs)

    assert mgr.get_pool_names() == ["db2"]


@pytest.mark.asyncio
async def test_acquire_not_found() -> None:
    """测试获取不存在的数据库连接。"""
    from pg_mcp.utils.error import MCPError

    mgr = ConnectionPoolManager()
    with pytest.raises(MCPError) as exc_info:
        async with mgr.acquire("nonexistent"):
            pass
    assert "not found" in exc_info.value.message


@pytest.mark.asyncio
async def test_close_all() -> None:
    """测试关闭所有连接池。"""
    mock_pool = AsyncMock()
    mgr = ConnectionPoolManager()
    mgr._pools = {"db1": mock_pool, "db2": mock_pool}

    await mgr.close()

    assert mock_pool.close.call_count == 2
    assert mgr.get_pool_names() == []


# S-02: Health check tests

@pytest.mark.asyncio
async def test_health_check_success(mock_pool: AsyncMock) -> None:
    """测试健康检查全部成功。"""
    mgr = ConnectionPoolManager()
    mgr._pools = {"db1": mock_pool}

    results = await mgr.check_health()
    assert results == {"db1": True}


@pytest.mark.asyncio
async def test_health_check_failure(mock_pool: AsyncMock) -> None:
    """测试健康检查失败。"""
    mock_pool.acquire.side_effect = Exception("Connection lost")

    mgr = ConnectionPoolManager()
    mgr._pools = {"db1": mock_pool}

    results = await mgr.check_health()
    assert results == {"db1": False}


@pytest.mark.asyncio
async def test_start_stop_health_check() -> None:
    """测试启动和停止健康检查任务。"""
    mgr = ConnectionPoolManager(health_check_interval=1)

    await mgr.start_health_check()
    assert mgr._health_check_task is not None
    assert not mgr._health_check_task.done()

    await mgr.stop_health_check()
    assert mgr._health_check_task is None
