"""
SQL 生成器：通过 LLM 将自然语言查询需求转换为 SQL 语句。
包含重试机制（指数退避）、Markdown 清理和 SQL 缓存。
"""

from __future__ import annotations

import asyncio
import hashlib
import re
from typing import Any

from openai import AsyncOpenAI

from pg_mcp.config import LLMConfig
from pg_mcp.constants import ErrorCode
from pg_mcp.models.schema import DatabaseSchema
from pg_mcp.utils.error import MCPError
from pg_mcp.utils.logger import get_logger

logger = get_logger(__name__)

# SQL 生成系统提示词模板
SYSTEM_PROMPT = """\
你是一个专业的 SQL Server (T-SQL) SQL 生成助手。
根据用户描述和提供的数据库 Schema，生成正确的 SQL Server 查询语句（T-SQL）。

规则：
1. 只生成 SELECT 语句，禁止生成任何修改数据的语句（INSERT/UPDATE/DELETE/DDL）。
2. 使用标准 T-SQL 语法。
3. 不要使用任何危险函数。
4. 如果查询不明确，优先选择安全的查询方式。
5. 只输出 SQL 语句本身，不要包含任何解释、Markdown 代码块标记或额外文本。
6. 使用参数化查询风格，不要硬编码值。
"""

# SQL 缓存默认配置
DEFAULT_CACHE_MAX_SIZE = 512
DEFAULT_CACHE_TTL_SECONDS = 3600


class SQLCache:
    """简单的 SQL 生成结果缓存，基于 LRU + TTL 策略。"""

    def __init__(self, max_size: int = DEFAULT_CACHE_MAX_SIZE, ttl_seconds: int = DEFAULT_CACHE_TTL_SECONDS) -> None:
        self._max_size = max_size
        self._ttl_seconds = ttl_seconds
        self._store: dict[str, dict[str, Any]] = {}
        self._access_order: list[str] = []
        self._lock = asyncio.Lock()

    def _make_key(self, user_query: str, schema: DatabaseSchema) -> str:
        """基于查询文本和 Schema 结构生成缓存键。"""
        schema_fingerprint = hashlib.sha256(
            schema.to_prompt_text().encode("utf-8")
        ).hexdigest()[:16]
        query_hash = hashlib.md5(user_query.lower().strip().encode("utf-8")).hexdigest()
        return f"{query_hash}:{schema_fingerprint}"

    async def get(self, user_query: str, schema: DatabaseSchema) -> str | None:
        """获取缓存的 SQL。"""
        import time

        key = self._make_key(user_query, schema)
        async with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            if time.time() - entry["timestamp"] > self._ttl_seconds:
                self._store.pop(key, None)
                if key in self._access_order:
                    self._access_order.remove(key)
                return None
            # LRU: 移到末尾
            if key in self._access_order:
                self._access_order.remove(key)
            self._access_order.append(key)
            return entry["sql"]

    async def put(self, user_query: str, schema: DatabaseSchema, sql: str) -> None:
        """缓存 SQL 生成结果。"""
        import time

        key = self._make_key(user_query, schema)
        async with self._lock:
            # 如果已满，移除最久未使用的条目
            if key not in self._store and len(self._store) >= self._max_size:
                oldest = self._access_order.pop(0)
                self._store.pop(oldest, None)
                logger.info("cache_evicted", key=oldest[:20])
            self._store[key] = {"sql": sql, "timestamp": time.time()}
            if key in self._access_order:
                self._access_order.remove(key)
            self._access_order.append(key)

    @property
    def size(self) -> int:
        return len(self._store)

    def invalidate_all(self) -> None:
        self._store.clear()
        self._access_order.clear()


class SQLGenerator:
    """使用 LLM 生成 SQL 语句。"""

    def __init__(self, llm_config: LLMConfig, enable_cache: bool = True) -> None:
        self._llm_config = llm_config
        self._client = AsyncOpenAI(**llm_config.to_dict())
        self._cache = SQLCache() if enable_cache else None

    def _format_schema(self, schema: DatabaseSchema) -> str:
        """
        将 DatabaseSchema 转换为 LLM 可读的文本格式。

        Args:
            schema: 数据库 Schema 对象。

        Returns:
            格式化的 Schema 描述文本。
        """
        return schema.to_prompt_text()

    async def _call_llm(
        self,
        system_prompt: str,
        user_prompt: str,
        retry_count: int = 3,
    ) -> str:
        """
        调用 LLM API，带指数退避重试机制。

        Args:
            system_prompt: 系统提示词。
            user_prompt: 用户提示词。
            retry_count: 最大重试次数。

        Returns:
            LLM 返回的文本内容。

        Raises:
            MCPError: 如果 API 调用失败或超时。
        """
        last_error: Exception | None = None
        for attempt in range(retry_count):
            try:
                response = await self._client.chat.completions.create(
                    model=self._llm_config.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    temperature=self._llm_config.temperature,
                    max_tokens=self._llm_config.max_tokens,
                )
                content = response.choices[0].message.content
                if content is None:
                    raise MCPError(
                        code=ErrorCode.LLM_API_ERROR,
                        message="LLM returned empty response.",
                    )
                return content
            except MCPError:
                raise
            except Exception as exc:
                last_error = exc
                if attempt < retry_count - 1:
                    wait_time = 2**attempt  # 指数退避: 1s, 2s, 4s
                    logger.warning(
                        "llm_retry",
                        attempt=attempt + 1,
                        max_retries=retry_count,
                        wait_seconds=wait_time,
                        error=str(exc),
                    )
                    await asyncio.sleep(wait_time)
                else:
                    logger.error(
                        "llm_failed",
                        error=str(exc),
                    )

        raise MCPError(
            code=ErrorCode.LLM_API_ERROR,
            message=f"LLM API call failed after {retry_count} retries: {last_error}",
        )

    @staticmethod
    def _clean_sql(raw_sql: str) -> str:
        """
        清理 LLM 返回的 SQL 文本（移除 Markdown 代码块标记等）。

        Args:
            raw_sql: 原始 SQL 文本。

        Returns:
            清理后的 SQL 语句。
        """
        # 移除 Markdown 代码块
        sql = re.sub(r"^```(?:sql)?\s*\n?", "", raw_sql, flags=re.MULTILINE)
        sql = re.sub(r"\n?```\s*$", "", sql, flags=re.MULTILINE)
        # 移除首尾空白
        sql = sql.strip()
        # 移除行号前缀（如果 LLM 添加了行号）
        sql = re.sub(r"^\d+\s*[.:)]\s*", "", sql, flags=re.MULTILINE)
        return sql

    async def generate(
        self,
        user_query: str,
        schema: DatabaseSchema,
        db_name: str = "",
        retry_count: int = 3,
    ) -> str:
        """
        根据用户查询和 Schema 生成 SQL。

        Args:
            user_query: 用户的自然语言查询描述。
            schema: 数据库 Schema 对象。
            db_name: 数据库名称（用于日志和上下文）。
            retry_count: 最大重试次数。

        Returns:
            生成的 SQL 语句。

        Raises:
            MCPError: 如果生成失败。
        """
        # 尝试从缓存获取
        if self._cache is not None:
            cached = await self._cache.get(user_query, schema)
            if cached is not None:
                logger.info("sql_cache_hit", query=user_query[:100])
                return cached

        schema_text = self._format_schema(schema)
        user_prompt = f"""数据库 Schema：
{schema_text}

用户需求：
{user_query}

请生成对应的 SQL Server (T-SQL) 查询语句。"""

        logger.info(
            "sql_generation_started",
            query=user_query[:100],
            db_name=db_name,
        )

        raw_sql = await self._call_llm(SYSTEM_PROMPT, user_prompt, retry_count)
        sql = self._clean_sql(raw_sql)

        logger.info(
            "sql_generated",
            sql=sql[:200],
        )

        # 写入缓存
        if self._cache is not None:
            await self._cache.put(user_query, schema, sql)

        return sql

    async def verify_result(
        self,
        user_query: str,
        sql: str,
        sample_rows: list[dict],
        db_name: str,
    ) -> float:
        """
        验证结果与用户意图的一致性（调用 LLM 生成 0-1 分数）。

        Args:
            user_query: 用户的原始查询。
            sql: 生成的 SQL 语句。
            sample_rows: 查询结果样本（前 5 行）。
            db_name: 数据库名称。

        Returns:
            0-1 之间的一致性评分。
        """
        sample_text = "\n".join(str(row) for row in sample_rows[:5])

        prompt = (
            f"请评估以下查询结果是否符合用户的原始意图。\n\n"
            f"用户查询: {user_query}\n"
            f"生成的 SQL: {sql}\n\n"
            f"结果样本（前 5 行）:\n{sample_text}\n\n"
            f"请输出一个 0-1 之间的分数，表示结果与用户意图的一致性。\n"
            f"- 1.0: 完全一致\n"
            f"- 0.5: 部分一致\n"
            f"- 0.0: 完全不一致\n\n"
            f'只需输出分数，格式: "0.XX" 或 "1.0"'
        )

        try:
            score_text = await self._call_llm(
                system_prompt="You are a data consistency evaluator.",
                user_prompt=prompt,
                retry_count=2,
            )

            # 使用正则提取第一个浮点数
            match = re.search(r"(\d+\.?\d*)", score_text)
            if match:
                score = float(match.group(1))
                score = max(0.0, min(1.0, score))
                logger.info("verification_score", score=score)
                return score

            logger.warning("invalid_score_format", score_text=score_text)
            return 0.5
        except MCPError:
            # LLM 调用失败，返回默认分数
            logger.warning("verification_llm_failed")
            return 0.5
        except Exception as exc:
            logger.warning("verification_error", error=str(exc))
            return 0.5
