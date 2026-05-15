"""
数据库连接池管理器。
使用 aioodbc 创建和管理每个数据库的连接池。
包含健康检查机制，定期检测连接存活。
"""

from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from typing import Any, AsyncIterator

import aioodbc
import pyodbc

from pg_mcp.config import DatabaseConfig
from pg_mcp.constants import ErrorCode
from pg_mcp.utils.error import MCPError
from pg_mcp.utils.logger import get_logger

logger = get_logger(__name__)

# 健康检查配置
DEFAULT_HEALTH_CHECK_INTERVAL = 300  # 5 分钟
HEALTH_CHECK_SQL = "SELECT 1"
DEFAULT_ODBC_DRIVER = "ODBC Driver 17 for SQL Server"


def _build_dsn(config: DatabaseConfig) -> str:
    """构建 SQL Server ODBC 连接字符串。"""
    return (
        f"Driver={{{DEFAULT_ODBC_DRIVER}}};"
        f"Server={config.host},{config.port};"
        f"Database={config.database};"
        f"UID={config.username};"
        f"PWD={config.password.get_secret_value()};"
        "Encrypt=no;"
        "TrustServerCertificate=yes;"
    )


class ConnectionPoolManager:
    """管理多个数据库连接池的生命周期。"""

    def __init__(self, health_check_interval: int = DEFAULT_HEALTH_CHECK_INTERVAL) -> None:
        self._pools: dict[str, aioodbc.Pool] = {}
        self._lock = asyncio.Lock()
        self._health_check_interval = health_check_interval
        self._health_check_task: asyncio.Task | None = None

    async def start_health_check(self) -> None:
        """启动后台健康检查任务。"""
        if self._health_check_task is not None:
            return
        self._health_check_task = asyncio.create_task(
            self._health_check_loop(), name="pool_health_check"
        )
        logger.info("health_check_started", interval=self._health_check_interval)

    async def _health_check_loop(self) -> None:
        """定期对所有连接池执行健康检查。"""
        while True:
            try:
                await asyncio.sleep(self._health_check_interval)
                await self.check_health()
            except asyncio.CancelledError:
                logger.info("health_check_stopped")
                break
            except Exception as exc:
                logger.error("health_check_loop_error", error=str(exc))

    async def check_health(self) -> dict[str, bool]:
        """检测所有连接池的健康状态。"""
        results: dict[str, bool] = {}
        for db_name in list(self._pools.keys()):
            try:
                async with self.acquire(db_name) as conn:
                    async with conn.cursor() as cursor:
                        await cursor.execute(HEALTH_CHECK_SQL)
                results[db_name] = True
            except Exception as exc:
                results[db_name] = False
                logger.warning("health_check_failed", name=db_name, error=str(exc))
        return results

    async def stop_health_check(self) -> None:
        """停止健康检查任务。"""
        if self._health_check_task is not None:
            self._health_check_task.cancel()
            try:
                await self._health_check_task
            except asyncio.CancelledError:
                pass
            self._health_check_task = None

    async def initialize(self, configs: list[DatabaseConfig]) -> None:
        """为所有数据库配置创建连接池。"""
        async with self._lock:
            for config in configs:
                if config.name in self._pools:
                    logger.info("pool_already_exists", name=config.name)
                    continue
                try:
                    dsn = _build_dsn(config)
                    pool = await aioodbc.create_pool(
                        dsn=dsn,
                        minsize=config.min_pool_size,
                        maxsize=config.max_pool_size,
                    )
                    self._pools[config.name] = pool
                    logger.info(
                        "pool_initialized",
                        name=config.name,
                        host=config.host,
                        database=config.database,
                    )
                except Exception as exc:
                    logger.error(
                        "pool_init_failed",
                        name=config.name,
                        error=str(exc),
                    )

    @asynccontextmanager
    async def acquire(self, db_name: str) -> AsyncIterator[aioodbc.Connection]:
        """获取指定数据库的连接。

        Args:
            db_name: 数据库配置名称。

        Yields:
            aioodbc 连接对象。

        Raises:
            MCPError: 如果数据库未找到或连接失败。
        """
        pool = self._pools.get(db_name)
        if pool is None:
            raise MCPError(
                code=ErrorCode.DB_CONNECTION_ERROR,
                message=f"Database '{db_name}' not found in pool manager.",
            )
        try:
            async with pool.acquire() as conn:
                yield conn
        except pyodbc.Error as exc:
            raise MCPError(
                code=ErrorCode.DB_CONNECTION_ERROR,
                message=f"Connection error for '{db_name}': {exc}",
            ) from exc

    async def close(self) -> None:
        """关闭所有连接池。"""
        await self.stop_health_check()
        async with self._lock:
            for name, pool in self._pools.items():
                try:
                    pool.close()
                    await pool.wait_closed()
                    logger.info("pool_closed", name=name)
                except Exception as exc:
                    logger.error("pool_close_error", name=name, error=str(exc))
            self._pools.clear()

    def get_pool_names(self) -> list[str]:
        """返回所有已注册的数据库名称。"""
        return list(self._pools.keys())

    def get_pool(self, db_name: str) -> aioodbc.Pool | None:
        """获取指定名称的连接池。"""
        return self._pools.get(db_name)


async def execute_query(
    conn: aioodbc.Connection,
    sql: str,
    params: tuple[Any, ...] = (),
) -> list[pyodbc.Row]:
    """在连接上执行 SQL 查询并返回所有行。"""
    async with conn.cursor() as cursor:
        await cursor.execute(sql, params)
        try:
            return await cursor.fetchall()
        except pyodbc.ProgrammingError:
            return []


async def execute_scalar(
    conn: aioodbc.Connection,
    sql: str,
    params: tuple[Any, ...] = (),
) -> Any | None:
    """执行 SQL 并返回第一行第一列的值。"""
    rows = await execute_query(conn, sql, params)
    if rows:
        return rows[0][0]
    return None
