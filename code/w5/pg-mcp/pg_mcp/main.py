"""
FastMCP Server 入口。
提供 Tools 和 Resources 供 MCP 客户端调用。
"""

from __future__ import annotations

import time
from contextlib import asynccontextmanager
from typing import Any

from fastmcp import FastMCP

from pg_mcp import __version__
from pg_mcp.config import LLMConfig, SecurityConfig, get_log_level, load_config
from pg_mcp.constants import ErrorCode
from pg_mcp.database import ConnectionPoolManager, SchemaManager
from pg_mcp.history import HistoryManager
from pg_mcp.models.query import QueryStatus
from pg_mcp.sql import SQLExecutor, SQLGenerator, SQLValidator
from pg_mcp.utils.error import MCPError
from pg_mcp.utils.logger import get_logger, setup_logging

logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# Global component variables (initialized in lifespan)
# ---------------------------------------------------------------------------

config = None
pool_mgr = None
schema_mgr = None
sql_gen = None
sql_validator = None
sql_executor = None
history_mgr = None


def _ensure_initialized() -> None:
    """确保组件已初始化（lifespan 执行后）。"""
    if config is None or pool_mgr is None:
        raise MCPError(
            code=ErrorCode.INTERNAL_ERROR,
            message="Server not initialized. Ensure lifespan() has been called.",
        )


# ---------------------------------------------------------------------------
# Lifespan management
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(server: FastMCP):
    """管理应用生命周期：初始化和清理资源。"""
    global config, pool_mgr, schema_mgr, sql_gen, sql_validator, sql_executor, history_mgr

    # 加载配置
    config = load_config()
    setup_logging(level=get_log_level(config))
    logger.info("app_startup", version=__version__)

    # 验证数据库配置
    if not config.databases:
        raise RuntimeError("No databases configured. Please set DB_* environment variables.")

    # 初始化连接池
    pool_mgr = ConnectionPoolManager()
    await pool_mgr.initialize(config.databases)

    # 加载 Schema
    schema_mgr = SchemaManager(pool_mgr, ttl_seconds=config.schema_refresh_interval)
    await schema_mgr.load_all(config.databases[0].name)

    # 初始化业务组件
    llm_config = LLMConfig(config)
    security_config = SecurityConfig(config)

    sql_gen = SQLGenerator(llm_config, enable_cache=True)
    sql_validator = SQLValidator(security_config, schema_mgr)
    sql_executor = SQLExecutor(pool_mgr, security_config)
    history_mgr = HistoryManager()

    # 启动连接池健康检查
    await pool_mgr.start_health_check()

    logger.info("app_ready")

    try:
        yield
    finally:
        logger.info("app_shutdown")
        await pool_mgr.close()


# 创建 MCP Server
mcp = FastMCP(
    name="pg-mcp",
    version=__version__,
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

@mcp.tool()
async def query_database(
    query: str,
    database: str | None = None,
    page: int = 1,
    page_size: int = 100,
    verify_result: bool = True,
) -> dict[str, Any]:
    """
    根据自然语言查询数据库并返回结果。

    Args:
        query: 自然语言查询描述。
        database: 数据库名称（可选）。
        page: 页码（从 1 开始）。
        page_size: 每页结果数。
        verify_result: 是否验证结果意义性。

    Returns:
        包含查询结果或错误信息的字典。
    """
    _ensure_initialized()
    sql = None

    # 参数验证
    if page < 1:
        raise MCPError(code=ErrorCode.INVALID_ARGUMENT, message="page must be >= 1")
    if page_size < 1 or page_size > 1000:
        raise MCPError(code=ErrorCode.INVALID_ARGUMENT, message="page_size must be between 1 and 1000")

    # 确定目标数据库
    if not config.databases:
        raise MCPError(code=ErrorCode.DB_CONNECTION_ERROR, message="No databases configured")
    db_name = database or config.databases[0].name

    sql = None
    query_status = QueryStatus.FAILED
    error_message: str | None = None
    result_rows_local = 0
    execution_ms = 0.0

    import time as _time
    start_ts = _time.monotonic()

    try:
        # 1. 加载 Schema
        schema = await schema_mgr.load_schema(db_name)

        # 2. 生成 SQL
        sql = await sql_gen.generate(query, schema, db_name=db_name)

        # 3. 验证 SQL（三层防护）
        # 3.1 危险函数检测
        dangerous_func = sql_validator.has_dangerous_functions_from_sql(sql)
        if dangerous_func:
            raise MCPError(
                code=ErrorCode.READ_ONLY_VIOLATION,
                message=f"Dangerous function '{dangerous_func}' detected in SQL",
            )

        # 3.2 只读检查
        SQLValidator.validate_read_only(sql)

        # 3.3 语法验证 + 对象存在性检查
        if config.security_enable_sql_verification:
            sql_validator.validate_syntax_and_objects(sql, schema)

        # 4. 执行 SQL
        results, total = await sql_executor.execute(sql, db_name, limit=page_size, offset=(page - 1) * page_size)

        elapsed_ms = (_time.monotonic() - start_ts) * 1000
        query_status = QueryStatus.SUCCESS
        result_rows_local = len(results)
        execution_ms = elapsed_ms

        # 5. 验证结果（可选）
        verification_score = None
        verification_warning = None
        if verify_result and config.security_enable_result_verification:
            verification_score = await sql_gen.verify_result(
                query, sql, results[:5], db_name,
            )
            if verification_score is not None and verification_score < config.security_verification_threshold:
                verification_warning = (
                    f"Verification score ({verification_score:.2f}) is below "
                    f"threshold ({config.security_verification_threshold}). "
                    "Results may be unreliable."
                )

        return {
            "success": True,
            "sql": sql,
            "result": {
                "rows": results,
                "total_count": total,
                "page": page,
                "page_size": page_size,
                "total_pages": (total + page_size - 1) // page_size if page_size > 0 else 0,
            },
            "verification_score": verification_score,
            "verification_warning": verification_warning,
        }

    except MCPError as exc:
        elapsed_ms = (_time.monotonic() - start_ts) * 1000
        query_status = QueryStatus.FAILED
        error_message = exc.message
        execution_ms = elapsed_ms
        logger.error("query_failed", error=exc.message)
        return exc.to_dict()
    except Exception as exc:
        elapsed_ms = (_time.monotonic() - start_ts) * 1000
        query_status = QueryStatus.FAILED
        error_message = str(exc)
        execution_ms = elapsed_ms
        logger.error("query_unexpected_error", error=str(exc))
        return {
            "success": False,
            "error": {
                "code": ErrorCode.INTERNAL_ERROR.value,
                "message": f"Internal error: {exc}",
            },
        }
    finally:
        try:
            await history_mgr.record(
                user_query=query,
                db_name=db_name,
                generated_sql=sql or "",
                status=query_status,
                result_rows=result_rows_local,
                execution_time_ms=execution_ms,
                error_message=error_message,
            )
        except Exception:
            logger.exception("history_record_failed")


@mcp.tool()
async def generate_sql(
    query: str,
    database: str | None = None,
) -> dict[str, Any]:
    """
    生成 SQL 但不执行（包含安全验证）。

    Args:
        query: 自然语言查询描述。
        database: 数据库名称（可选）。

    Returns:
        包含生成的 SQL 和安全检查结果的字典。
    """
    _ensure_initialized()
    if not config.databases:
        raise MCPError(code=ErrorCode.DB_CONNECTION_ERROR, message="No databases configured")
    db_name = database or config.databases[0].name

    schema = await schema_mgr.load_schema(db_name)
    sql = await sql_gen.generate(query, schema, db_name=db_name)

    # 安全验证
    dangerous_func = sql_validator.has_dangerous_functions_from_sql(sql)
    is_safe = dangerous_func is None
    read_only_ok = True
    try:
        SQLValidator.validate_read_only(sql)
    except MCPError:
        read_only_ok = False
        is_safe = False

    return {
        "sql": sql,
        "is_safe": is_safe,
        "read_only_check": "pass" if read_only_ok else "fail",
        "warning": dangerous_func,
    }


@mcp.tool()
async def list_databases() -> list[dict[str, str]]:
    """
    列出所有可用数据库。

    Returns:
        数据库名称列表。
    """
    _ensure_initialized()
    return [
        {
            "name": db.name,
            "database": db.database,
        }
        for db in config.databases
    ]


@mcp.tool()
async def get_schema(database: str, table: str | None = None) -> dict[str, Any]:
    """
    获取指定数据库的 Schema 信息。

    Args:
        database: 数据库名称。
        table: 表名（可选）。

    Returns:
        Schema 信息。
    """
    _ensure_initialized()

    try:
        schema = await schema_mgr.load_schema(database)
        if table:
            table_info = schema.tables.get(table)
            if table_info:
                return table_info.model_dump()
            return {}
        return {
            "database": schema.database,
            "tables": [t.model_dump() for t in schema.tables.values()],
            "views": [v.model_dump() for v in schema.views.values()],
        }
    except MCPError as exc:
        return exc.to_dict()


@mcp.tool()
async def refresh_schema(database: str | None = None) -> dict[str, Any]:
    """
    刷新 Schema 缓存。

    Args:
        database: 数据库名称（可选）。

    Returns:
        刷新状态。
    """
    _ensure_initialized()

    try:
        if database:
            await schema_mgr.refresh(database)
        else:
            await schema_mgr.refresh_all()
        return {"success": True, "message": "Schema refreshed"}
    except MCPError as exc:
        return exc.to_dict()


@mcp.tool()
async def health_check() -> dict[str, Any]:
    """
    健康检查接口。

    Returns:
        服务健康状态，包含每个数据库的连接状态。
    """
    _ensure_initialized()
    status = {
        "status": "healthy",
        "databases": {},
        "schema_loaded": len(schema_mgr._cache),
    }

    from pg_mcp.database.pool import execute_scalar

    for db_name in pool_mgr.get_pool_names():
        try:
            async with pool_mgr.acquire(db_name) as conn:
                await execute_scalar(conn, "SELECT 1")
                status["databases"][db_name] = "connected"
        except Exception as exc:
            status["databases"][db_name] = f"error: {exc}"
            status["status"] = "degraded"

    return status


# ---------------------------------------------------------------------------
# Resources
# ---------------------------------------------------------------------------

@mcp.resource("schema://{database_name}")
async def schema_resource(database_name: str) -> str:
    """数据库 Schema 资源。"""
    _ensure_initialized()

    try:
        schema = await schema_mgr.load_schema(database_name)
        return schema.to_prompt_text()
    except MCPError as exc:
        return f"Error loading schema: {exc.message}"


@mcp.resource("history://{user_id}")
async def history_resource(user_id: str = "default") -> str:
    """查询历史资源。"""
    _ensure_initialized()

    history = await history_mgr.get_by_user(user_id, limit=50)
    if not history:
        return "No query history found."
    return "\n".join([h.model_dump_json() for h in history])


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def main() -> None:
    """启动 MCP Server。"""
    mcp.run()


if __name__ == "__main__":
    main()
