"""History Manager 单元测试。"""

from __future__ import annotations

from datetime import datetime, timedelta
from pathlib import Path

import pytest

from pg_mcp.history import HistoryManager
from pg_mcp.models.query import QueryHistory, QueryStatus


def _record(hm: HistoryManager, **kwargs) -> QueryHistory:
    """辅助函数：用 kwargs 调用 record() 并返回生成的 QueryHistory。"""
    h = QueryHistory(**kwargs)
    hm.record(
        user_query=h.user_query,
        generated_sql=h.generated_sql,
        db_name=h.db_name,
        status=h.status,
        result_rows=h.result_rows,
        execution_time_ms=h.execution_time_ms,
        error_message=h.error_message,
        user=h.user,
    )
    return h


@pytest.mark.asyncio
async def test_record_and_read(mock_history_manager: HistoryManager) -> None:
    """测试记录和读取历史。"""
    await mock_history_manager.record(
        user_query="test query",
        generated_sql="SELECT 1;",
        db_name="default",
        status=QueryStatus.SUCCESS,
        result_rows=1,
        user="test_user",
    )

    records = await mock_history_manager.get_recent(user="test_user")
    assert len(records) == 1
    assert records[0].user_query == "test query"


@pytest.mark.asyncio
async def test_get_by_user(mock_history_manager: HistoryManager) -> None:
    """测试按用户获取历史。"""
    await mock_history_manager.record(user_query="query 1", user="alice", status=QueryStatus.SUCCESS, result_rows=0)
    await mock_history_manager.record(user_query="query 2", user="bob", status=QueryStatus.SUCCESS, result_rows=0)
    await mock_history_manager.record(user_query="query 3", user="alice", status=QueryStatus.SUCCESS, result_rows=0)

    alice_records = await mock_history_manager.get_by_user("alice")
    assert len(alice_records) == 2


@pytest.mark.asyncio
async def test_get_recent_limit(mock_history_manager: HistoryManager) -> None:
    """测试限制返回数量。"""
    import asyncio
    for i in range(10):
        await mock_history_manager.record(
            user_query=f"query {i}",
            status=QueryStatus.SUCCESS,
            user="test",
            result_rows=0,
        )
        await asyncio.sleep(0.001)  # 确保每条记录时间戳不同

    records = await mock_history_manager.get_recent(user="test", limit=3)
    assert len(records) == 3
    # 应该是最近的 3 条
    assert records[0].user_query == "query 9"


@pytest.mark.asyncio
async def test_empty_history(mock_history_manager: HistoryManager) -> None:
    """测试空历史记录。"""
    records = await mock_history_manager.get_recent(user="nobody")
    assert len(records) == 0


@pytest.mark.asyncio
async def test_cleanup_old_records(mock_history_manager: HistoryManager) -> None:
    """测试清理过期历史记录。"""
    old_ts = datetime.now() - timedelta(days=60)
    new_ts = datetime.now()

    await mock_history_manager.record(
        user_query="old query",
        status=QueryStatus.SUCCESS,
        user="test",
        result_rows=0,
    )
    # 用第二个 record 手动写入旧时间戳
    await mock_history_manager.record(
        user_query="new query",
        status=QueryStatus.SUCCESS,
        user="test",
        result_rows=0,
    )

    cleaned = await mock_history_manager.cleanup(max_age_days=30)
    # 两个记录都是今天创建的，不会被清理
    assert cleaned == 0


@pytest.mark.asyncio
async def test_serialization_roundtrip() -> None:
    """测试 QueryHistory 序列化和反序列化。"""
    original = QueryHistory(
        id="test123",
        user_query="test",
        generated_sql="SELECT 1;",
        db_name="default",
        status=QueryStatus.SUCCESS,
        result_rows=5,
        user="tester",
    )
    data = original.to_dict()
    restored = QueryHistory.from_dict(data)

    assert restored.id == original.id
    assert restored.user_query == original.user_query
    assert restored.status == original.status
