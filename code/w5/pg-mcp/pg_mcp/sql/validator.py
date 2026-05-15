"""
SQL 验证器：使用 SQLGlot 解析和验证 SQL 语句的安全性和正确性。
确保只允许只读操作，并检查危险函数。
"""

from __future__ import annotations

from typing import TYPE_CHECKING

import sqlglot
from sqlglot import exp
from sqlglot.expressions import Expression

from pg_mcp.config import SecurityConfig
from pg_mcp.constants import ALLOWED_QUERY_TYPES, DANGEROUS_FUNCTIONS, ErrorCode
from pg_mcp.models.schema import DatabaseSchema
from pg_mcp.utils.error import MCPError
from pg_mcp.utils.logger import get_logger

if TYPE_CHECKING:
    from pg_mcp.database.pool import ConnectionPoolManager

logger = get_logger(__name__)


class SQLValidator:
    """验证 SQL 语句的语法、对象引用和只读安全性。"""

    def __init__(
        self,
        security_config: SecurityConfig,
        schema_manager: "SchemaManager",  # noqa: F821
    ) -> None:
        self._security_config = security_config
        self._schema_manager = schema_manager

    @staticmethod
    def validate_read_only(sql: str) -> None:
        """
        验证 SQL 是否为只读操作。

        Args:
            sql: SQL 语句。

        Raises:
            MCPError: 如果 SQL 不是只读操作。
        """
        try:
            stmt = sqlglot.parse_one(sql, read="tsql")
            stmt_type = stmt.key.upper()
            # 检查顶级语句类型
            if stmt_type not in ALLOWED_QUERY_TYPES:
                raise MCPError(
                    code=ErrorCode.READ_ONLY_VIOLATION,
                    message=f"Non-read-only SQL detected: {stmt_type}. Only {ALLOWED_QUERY_TYPES} are allowed.",
                )
        except MCPError:
            raise
        except sqlglot.errors.ParseError as exc:
            raise MCPError(
                code=ErrorCode.SQL_SYNTAX_ERROR,
                message=f"SQL parse error: {exc}",
            ) from exc

    def validate_syntax_and_objects(self, sql: str, schema: DatabaseSchema) -> None:
        """
        验证 SQL 语法并检查引用的表/视图是否存在于 Schema 中。

        Args:
            sql: SQL 语句。
            schema: 数据库 Schema 对象。

        Raises:
            MCPError: 如果语法无效或引用的对象不存在。
        """
        try:
            parsed = sqlglot.parse_one(sql, read="tsql")
        except sqlglot.errors.ParseError as exc:
            raise MCPError(
                code=ErrorCode.SQL_SYNTAX_ERROR,
                message=f"SQL syntax error: {exc}",
            ) from exc

        # 检查危险函数
        if self.has_dangerous_functions(parsed):
            raise MCPError(
                code=ErrorCode.READ_ONLY_VIOLATION,
                message="SQL contains dangerous functions which are not allowed.",
            )

        # 收集所有引用的表名
        referenced_tables: set[str] = set()
        self._collect_tables(parsed, referenced_tables)

        # 验证引用的表/视图是否在 Schema 中（严格模式）
        available_names = set(schema.get_all_names())
        for ref_table in referenced_tables:
            short_name = ref_table.split(".")[-1]
            if short_name not in available_names:
                # 尝试匹配带 schema 的 qualified name
                matched = False
                for avail in available_names:
                    if avail.endswith(f".{short_name}") or avail == ref_table:
                        matched = True
                        break
                if not matched:
                    raise MCPError(
                        code=ErrorCode.SQL_OBJECT_NOT_FOUND,
                        message=f"Table or view '{ref_table}' does not exist in schema.",
                    )

    @staticmethod
    def _collect_tables(node: Expression, tables: set[str]) -> None:
        """
        递归遍历 AST 收集所有表引用。

        注意：sqlglot walk() 返回 (node, parent, key) 三元组。
        """
        for child in node.walk():
            if isinstance(child, exp.Table):
                # 获取表名
                table_name = child.name
                if table_name:
                    schema_name = child.db  # schema in sqlglot terms
                    if schema_name:
                        tables.add(f"{schema_name}.{table_name}")
                    else:
                        tables.add(table_name)

    def has_dangerous_functions(self, parsed: Expression) -> bool:
        """
        检查 SQL 中是否包含危险函数。

        Args:
            parsed: 已解析的 SQL AST。

        Returns:
            如果包含危险函数返回 True。
        """
        for child in parsed.walk():
            if isinstance(child, exp.Anonymous):
                func_name = child.this.lower()
                if func_name in DANGEROUS_FUNCTIONS:
                    return True
            elif isinstance(child, exp.Func):
                func_name = child.sql_name().lower()
                if func_name in DANGEROUS_FUNCTIONS:
                    return True
        return False

    def has_dangerous_functions_from_sql(self, sql: str) -> str | None:
        """
        检查 SQL 字符串中是否包含危险函数，返回第一个匹配的危险函数名。

        Args:
            sql: SQL 语句字符串。

        Returns:
            第一个匹配的危险函数名，或 None。
        """
        sql_lower = sql.lower()
        for func in DANGEROUS_FUNCTIONS:
            if f"{func}(" in sql_lower:
                return func
        return None

    @staticmethod
    def _find_parent_table(sql: str) -> str | None:
        """
        尝试从 SQL 中找到主表名（用于错误信息）。

        Args:
            sql: SQL 语句。

        Returns:
            主表名或 None。
        """
        try:
            parsed = sqlglot.parse_one(sql, read="tsql")
            for child in parsed.walk():
                if isinstance(child, exp.Table):
                    return child.name
        except Exception:
            pass
        return None

    async def explain_for_validation(self, sql: str, db_name: str, pool_manager: ConnectionPoolManager) -> str | None:
        """
        通过 sqlglot 解析验证 SQL 语法正确性（SQL Server 兼容）。

        Args:
            sql: SQL 语句。
            db_name: 数据库名称（仅用于日志）。
            pool_manager: 连接池管理器（保留参数，用于后续可能的 SHOWPLAN 验证）。

        Returns:
            None（验证通过）。

        Raises:
            MCPError: 如果 SQL 语法无效。
        """
        try:
            sqlglot.parse_one(sql, read="tsql")
            return None
        except sqlglot.errors.ParseError as exc:
            raise MCPError(
                code=ErrorCode.SQL_SYNTAX_ERROR,
                message=f"SQL validation failed: {exc}",
            ) from exc
