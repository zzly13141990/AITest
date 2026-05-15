"""
Schema 加载与缓存管理器。
从 SQL Server INFORMATION_SCHEMA 和系统目录中加载表、列、视图信息。
"""

from __future__ import annotations

import asyncio
from typing import TYPE_CHECKING, Any

from pg_mcp.database.pool import execute_query, execute_scalar
from pg_mcp.models.schema import (
    ColumnInfo,
    DatabaseSchema,
    SchemaCache,
    TableInfo,
    ViewInfo,
)
from pg_mcp.utils.logger import get_logger

if TYPE_CHECKING:
    import aioodbc

    from pg_mcp.database.pool import ConnectionPoolManager

logger = get_logger(__name__)

# SQL Server 默认 schema
DEFAULT_SCHEMA = "dbo"


def _row_to_dict(row: Any) -> dict[str, Any]:
    """将 pyodbc.Row 转换为字典（按列名索引）。"""
    return dict(zip([col[0] for col in row.cursor_description], row))


class SchemaManager:
    """负责加载和管理数据库 Schema 信息。"""

    def __init__(self, pool_manager: ConnectionPoolManager, ttl_seconds: int = 300) -> None:
        self._pool_manager = pool_manager
        self._cache = SchemaCache(ttl_seconds=ttl_seconds)

    async def load_all(self, db_name: str) -> DatabaseSchema:
        """加载指定数据库的所有 Schema 信息（表 + 视图）。

        Args:
            db_name: 数据库配置名称。

        Returns:
            DatabaseSchema 实例。
        """
        cached = self._cache.get(db_name)
        if cached is not None:
            logger.debug("schema_cache_hit", db_name=db_name)
            return cached

        tables: dict[str, TableInfo] = {}
        views: dict[str, ViewInfo] = {}
        database_name: str = db_name

        async with self._pool_manager.acquire(db_name) as conn:
            tables = await self._load_tables(conn)
            views = await self._load_views(conn)
            db_row = await execute_scalar(conn, "SELECT DB_NAME()")
            if db_row:
                database_name = str(db_row)

        schema = DatabaseSchema(database=database_name, tables=tables, views=views)
        self._cache.set(db_name, schema)
        logger.info(
            "schema_loaded",
            db_name=db_name,
            table_count=len(tables),
            view_count=len(views),
        )
        return schema

    async def _load_tables(self, conn: aioodbc.Connection) -> dict[str, TableInfo]:
        """从 INFORMATION_SCHEMA 加载所有用户表信息。"""
        # 获取主键列
        pk_query = """
            SELECT
                tc.TABLE_NAME,
                kcu.COLUMN_NAME
            FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS AS tc
            JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS kcu
              ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
              AND tc.TABLE_SCHEMA = kcu.TABLE_SCHEMA
            WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
              AND tc.TABLE_SCHEMA = ?;
        """
        pk_rows = await execute_query(conn, pk_query, (DEFAULT_SCHEMA,))
        pk_map: dict[str, list[str]] = {}
        for row in pk_rows:
            d = _row_to_dict(row)
            tname = d["TABLE_NAME"]
            pk_map.setdefault(tname, []).append(d["COLUMN_NAME"])

        # 获取外键
        fk_query = """
            SELECT
                tc.TABLE_NAME,
                kcu.COLUMN_NAME,
                ccu.TABLE_NAME AS FOREIGN_TABLE_NAME,
                ccu.COLUMN_NAME AS FOREIGN_COLUMN_NAME
            FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS AS tc
            JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS kcu
              ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
              AND tc.TABLE_SCHEMA = kcu.TABLE_SCHEMA
            JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE AS ccu
              ON ccu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
              AND ccu.TABLE_SCHEMA = tc.TABLE_SCHEMA
            WHERE tc.CONSTRAINT_TYPE = 'FOREIGN KEY'
              AND tc.TABLE_SCHEMA = ?;
        """
        fk_rows = await execute_query(conn, fk_query, (DEFAULT_SCHEMA,))
        fk_map: dict[str, list[dict[str, str]]] = {}
        for row in fk_rows:
            d = _row_to_dict(row)
            tname = d["TABLE_NAME"]
            fk_map.setdefault(tname, []).append(
                {
                    "column": d["COLUMN_NAME"],
                    "foreign_table": d["FOREIGN_TABLE_NAME"],
                    "foreign_column": d["FOREIGN_COLUMN_NAME"],
                }
            )

        # 获取表和列
        col_query = """
            SELECT
                c.TABLE_NAME,
                c.COLUMN_NAME,
                c.DATA_TYPE,
                c.IS_NULLABLE,
                c.COLUMN_DEFAULT,
                c.ORDINAL_POSITION,
                c.CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS AS c
            JOIN INFORMATION_SCHEMA.TABLES AS t
              ON c.TABLE_NAME = t.TABLE_NAME
              AND c.TABLE_SCHEMA = t.TABLE_SCHEMA
            WHERE c.TABLE_SCHEMA = ?
              AND t.TABLE_TYPE = 'BASE TABLE'
            ORDER BY c.TABLE_NAME, c.ORDINAL_POSITION;
        """
        col_rows = await execute_query(conn, col_query, (DEFAULT_SCHEMA,))

        # 获取列注释 (SQL Server extended properties)
        comment_query = """
            SELECT
                obj.name AS TABLE_NAME,
                col.name AS COLUMN_NAME,
                ep.value AS COMMENT
            FROM sys.extended_properties AS ep
            JOIN sys.objects AS obj ON ep.major_id = obj.object_id
            JOIN sys.schemas AS sch ON obj.schema_id = sch.schema_id
            LEFT JOIN sys.columns AS col
              ON ep.minor_id = col.column_id AND ep.major_id = col.object_id
            WHERE sch.name = ?
              AND obj.type IN ('U', 'V')
              AND ep.name = 'MS_Description'
              AND ep.minor_id > 0;
        """
        comment_rows = await execute_query(conn, comment_query, (DEFAULT_SCHEMA,))
        comment_map: dict[tuple[str, str], str] = {}
        for row in comment_rows:
            d = _row_to_dict(row)
            comment_map[(d["TABLE_NAME"], d["COLUMN_NAME"])] = d["COMMENT"]

        # 构建 TableInfo
        tables: dict[str, TableInfo] = {}
        for row in col_rows:
            d = _row_to_dict(row)
            tname = d["TABLE_NAME"]
            if tname not in tables:
                tables[tname] = TableInfo(name=tname, table_schema=DEFAULT_SCHEMA)
                tables[tname].primary_key = pk_map.get(tname, [])
                tables[tname].foreign_keys = fk_map.get(tname, [])

            col = ColumnInfo(
                name=d["COLUMN_NAME"],
                data_type=d["DATA_TYPE"],
                is_nullable=d["IS_NULLABLE"] == "YES",
                column_default=d["COLUMN_DEFAULT"],
                ordinal_position=d["ORDINAL_POSITION"],
                character_maximum_length=d["CHARACTER_MAXIMUM_LENGTH"],
                is_primary_key=d["COLUMN_NAME"] in pk_map.get(tname, []),
                comment=comment_map.get((tname, d["COLUMN_NAME"])),
            )
            tables[tname].columns.append(col)

        return tables

    async def _load_views(self, conn: aioodbc.Connection) -> dict[str, ViewInfo]:
        """从 INFORMATION_SCHEMA 加载所有视图信息。"""
        view_query = """
            SELECT
                TABLE_NAME AS name,
                VIEW_DEFINITION AS definition
            FROM INFORMATION_SCHEMA.VIEWS
            WHERE TABLE_SCHEMA = ?;
        """
        view_rows = await execute_query(conn, view_query, (DEFAULT_SCHEMA,))
        views: dict[str, ViewInfo] = {}
        for row in view_rows:
            d = _row_to_dict(row)
            name = d["name"]
            views[name] = ViewInfo(
                name=name,
                view_schema=DEFAULT_SCHEMA,
                definition=d["definition"] or "",
            )
        return views

    async def load_schema(self, db_name: str) -> DatabaseSchema:
        """异步加载 Schema 并更新缓存（带 TTL 缓存）。"""
        return await self.load_all(db_name)

    def get_schema(self, db_name: str) -> DatabaseSchema:
        """同步获取 Schema（仅从缓存读取，不存在或已过期则报错）。"""
        cached = self._cache.get(db_name)
        if cached is None:
            from pg_mcp.constants import ErrorCode
            from pg_mcp.utils.error import MCPError
            raise MCPError(
                code=ErrorCode.SCHEMA_LOAD_ERROR,
                message=f"Schema for '{db_name}' not loaded or expired. Call load_schema() first.",
            )
        return cached

    async def refresh(self, db_name: str) -> DatabaseSchema:
        """强制刷新指定数据库的 Schema 缓存。"""
        self._cache.invalidate(db_name)
        logger.info("schema_refreshed", db_name=db_name)
        return await self.load_all(db_name)

    async def refresh_all(self) -> None:
        """刷新所有缓存。"""
        self._cache.invalidate_all()
        logger.info("schema_all_cache_invalidated")
        await asyncio.gather(
            *(self.load_all(db_name) for db_name in self._pool_manager.get_pool_names())
        )
