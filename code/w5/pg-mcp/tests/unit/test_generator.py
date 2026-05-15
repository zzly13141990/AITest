"""SQL Generator 单元测试。"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from pg_mcp.constants import ErrorCode
from pg_mcp.models.schema import DatabaseSchema
from pg_mcp.sql.generator import SQLCache, SQLGenerator
from pg_mcp.utils.error import MCPError


def test_clean_sql_removes_markdown() -> None:
    """测试清理 Markdown 代码块。"""
    raw = "```sql\nSELECT * FROM users;\n```"
    result = SQLGenerator._clean_sql(raw)
    assert result == "SELECT * FROM users;"


def test_clean_sql_removes_line_numbers() -> None:
    """测试清理行号前缀。"""
    raw = "1. SELECT * FROM users;\n2. WHERE id > 10;"
    result = SQLGenerator._clean_sql(raw)
    assert "SELECT" in result
    assert "1." not in result.split("\n")[0]


def test_clean_sql_strips_whitespace() -> None:
    """测试首尾空白清理。"""
    raw = "  \n  SELECT 1;  \n  "
    result = SQLGenerator._clean_sql(raw)
    assert result == "SELECT 1;"


def test_format_schema(mock_schema: DatabaseSchema, mock_llm_config) -> None:
    """测试 Schema 格式化为文本。"""
    generator = SQLGenerator(mock_llm_config)
    text = generator._format_schema(mock_schema)
    assert "Database: test_db" in text
    assert "users" in text


@pytest.mark.asyncio
async def test_generate_success(mock_llm_config, mock_schema) -> None:
    """测试 SQL 生成成功。"""
    generator = SQLGenerator(mock_llm_config)

    # Mock LLM 响应
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "SELECT * FROM users;"

    with patch.object(generator._client.chat.completions, "create", new_callable=AsyncMock) as mock_create:
        mock_create.return_value = mock_response
        sql = await generator.generate("查询所有用户", mock_schema)

    assert "SELECT" in sql
    assert "users" in sql


@pytest.mark.asyncio
async def test_generate_llm_error(mock_llm_config, mock_schema) -> None:
    """测试 LLM API 调用失败。"""
    generator = SQLGenerator(mock_llm_config)

    with patch.object(generator._client.chat.completions, "create", new_callable=AsyncMock) as mock_create:
        mock_create.side_effect = Exception("Connection refused")

        with pytest.raises(MCPError) as exc_info:
            await generator.generate("查询所有用户", mock_schema, retry_count=1)

    assert exc_info.value.code == ErrorCode.LLM_API_ERROR.value


@pytest.mark.asyncio
async def test_verify_result_success(mock_llm_config) -> None:
    """测试 verify_result 调用 LLM 评分。"""
    generator = SQLGenerator(mock_llm_config)

    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "0.95"

    with patch.object(generator._client.chat.completions, "create", new_callable=AsyncMock) as mock_create:
        mock_create.return_value = mock_response
        score = await generator.verify_result(
            user_query="查询所有用户",
            sql="SELECT * FROM users;",
            sample_rows=[{"id": 1, "name": "test"}],
            db_name="default",
        )

    assert isinstance(score, float)
    assert 0.0 <= score <= 1.0


@pytest.mark.asyncio
async def test_verify_result_llm_failed(mock_llm_config) -> None:
    """测试 verify_result 在 LLM 失败时返回默认分数。"""
    generator = SQLGenerator(mock_llm_config)

    with patch.object(generator._client.chat.completions, "create", new_callable=AsyncMock) as mock_create:
        mock_create.side_effect = Exception("Connection refused")
        score = await generator.verify_result(
            user_query="查询所有用户",
            sql="SELECT * FROM users;",
            sample_rows=[{"id": 1, "name": "test"}],
            db_name="default",
        )

    assert score == 0.5


# ---------------------------------------------------------------------------
# S-01: SQL Cache tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_cache_put_and_get(mock_llm_config, mock_schema) -> None:
    """测试 SQL 缓存存取。"""
    cache = SQLCache(max_size=10, ttl_seconds=60)
    assert await cache.get("查询所有用户", mock_schema) is None

    await cache.put("查询所有用户", mock_schema, "SELECT * FROM users;")
    result = await cache.get("查询所有用户", mock_schema)
    assert result == "SELECT * FROM users;"


@pytest.mark.asyncio
async def test_cache_lru_eviction() -> None:
    """测试 LRU 淘汰策略。"""
    cache = SQLCache(max_size=2, ttl_seconds=60)

    schema = DatabaseSchema(database="test", tables={}, views={})
    await cache.put("query1", schema, "sql1")
    await cache.put("query2", schema, "sql2")
    await cache.put("query3", schema, "sql3")  # 触发淘汰

    assert await cache.get("query1", schema) is None  # 最旧被驱逐
    assert await cache.get("query2", schema) == "sql2"
    assert await cache.get("query3", schema) == "sql3"


@pytest.mark.asyncio
async def test_cache_ttl_expiry(mock_llm_config) -> None:
    """测试 TTL 过期。"""
    cache = SQLCache(max_size=10, ttl_seconds=0)  # 立即过期

    schema = DatabaseSchema(database="test", tables={}, views={})
    await cache.put("query", schema, "SELECT 1;")

    import asyncio
    await asyncio.sleep(0.01)  # 短暂等待

    assert await cache.get("query", schema) is None


def test_cache_invalidate_all() -> None:
    """测试清空所有缓存。"""
    cache = SQLCache(max_size=10, ttl_seconds=60)
    cache._store = {"key1": {"sql": "SELECT 1;", "timestamp": 0}}
    cache._access_order = ["key1"]

    cache.invalidate_all()
    assert cache.size == 0
    assert len(cache._access_order) == 0


@pytest.mark.asyncio
async def test_verify_result_invalid_score_format(mock_llm_config) -> None:
    """测试 verify_result 在分数格式无效时返回默认分数。"""
    generator = SQLGenerator(mock_llm_config)

    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "invalid format"

    with patch.object(generator._client.chat.completions, "create", new_callable=AsyncMock) as mock_create:
        mock_create.return_value = mock_response
        score = await generator.verify_result(
            user_query="查询所有用户",
            sql="SELECT * FROM users;",
            sample_rows=[],
            db_name="default",
        )

    assert score == 0.5
