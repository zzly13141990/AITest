"""
SQL 执行器：使用 aioodbc/pyodbc 执行 SQL 查询。
支持参数化分页查询。
"""

from __future__ import annotations

import time
from typing import Any

import sqlglot
from sqlglot import exp
import pyodbc

from pg_mcp.config import SecurityConfig
from pg_mcp.constants import ErrorCode
from pg_mcp.database.pool import ConnectionPoolManager, execute_query, execute_scalar
from pg_mcp.utils.error import MCPError
from pg_mcp.utils.logger import get_logger

logger = get_logger(__name__)


def _row_to_dict(row: pyodbc.Row) -> dict[str, Any]:
    """将 pyodbc.Row 转换为字典（按列名索引）。"""
    return dict(zip([col[0] for col in row.cursor_description], row))


class SQLExecutor:
    """执行 SQL 查询并返回结果。"""

    def __init__(
        self,
        pool_manager: ConnectionPoolManager,
        security_config: SecurityConfig,
    ) -> None:
        self._pool_manager = pool_manager
        self._security_config = security_config

    async def execute(
        self,
        sql: str,
        db_name: str,
        limit: int | None = None,
        offset: int = 0,
    ) -> tuple[list[dict[str, Any]], int]:
        """
        执行 SQL 查询并返回结果。

        Args:
            sql: SQL 查询语句。
            db_name: 数据库配置名称。
            limit: 限制返回行数（None 则使用安全配置默认值）。
            offset: 分页偏移量。

        Returns:
            (结果行列表, 总行数) 元组。

        Raises:
            MCPError: 如果执行失败或超时。
        """
        max_rows = limit or self._security_config.max_result_rows
        timeout = self._security_config.max_query_timeout

        logger.info(
            "sql_execution_started",
            sql=sql[:200],
            db_name=db_name,
            limit=max_rows,
            offset=offset,
        )

        start_time = time.monotonic()

        try:
            async with self._pool_manager.acquire(db_name) as conn:
                # 如果 SQL 不以 LIMIT 结尾，添加分页限制
                effective_sql = sql.rstrip().rstrip(";")
                # 使用 SQLGlot 检查是否已包含 LIMIT/OFFSET 子句
                has_limit = False
                try:
                    parsed = sqlglot.parse_one(effective_sql, read="tsql")
                    for node in parsed.walk():
                        if isinstance(node, exp.Limit):
                            has_limit = True
                            break
                except Exception:
                    has_limit = "limit" in effective_sql.lower() or "offset" in effective_sql.lower()

                if has_limit:
                    rows = await execute_query(conn, effective_sql)
                    # 有 LIMIT 时仍需执行 COUNT(*) 获取真实总行数
                    count_sql = f"SELECT COUNT(*) AS _total FROM ({effective_sql}) AS _countq"
                    total = await execute_scalar(conn, count_sql)
                    total_rows = total or 0
                else:
                    # 先获取无分页的总行数
                    count_sql = f"SELECT COUNT(*) AS _total FROM ({effective_sql}) AS _countq"
                    total = await execute_scalar(conn, count_sql)
                    total_rows = total or 0

                    # SQL Server 使用 OFFSET...FETCH NEXT 语法进行分页
                    wrapped_sql = (
                        f"SELECT * FROM ({effective_sql}) AS _subq "
                        f"ORDER BY (SELECT NULL) "
                        f"OFFSET ? ROWS FETCH NEXT ? ROWS ONLY"
                    )
                    rows = await execute_query(conn, wrapped_sql, (offset, max_rows))

                # 将 pyodbc.Row 对象转换为字典列表
                results = [_row_to_dict(row) for row in rows]

                elapsed_ms = (time.monotonic() - start_time) * 1000

                logger.info(
                    "sql_execution_completed",
                    rows_returned=total_rows,
                    elapsed_ms=round(elapsed_ms, 2),
                )

                return results, total_rows

        except MCPError:
            raise
        except pyodbc.Error as exc:
            elapsed_ms = (time.monotonic() - start_time) * 1000
            exc_msg = str(exc).lower()
            if "timeout" in exc_msg or "timed out" in exc_msg or "lock" in exc_msg:
                logger.error(
                    "query_timeout",
                    timeout_seconds=timeout,
                    elapsed_ms=round(elapsed_ms, 2),
                )
                raise MCPError(
                    code=ErrorCode.QUERY_TIMEOUT,
                    message=f"Query timed out after {timeout} seconds.",
                ) from exc
            raise MCPError(
                code=ErrorCode.QUERY_EXECUTION_ERROR,
                message=f"Query execution error: {exc}",
            ) from exc
        except Exception as exc:
            raise MCPError(
                code=ErrorCode.INTERNAL_ERROR,
                message=f"Unexpected error during execution: {exc}",
            ) from exc
