"""常量定义：错误码、白名单、危险函数等。"""

from __future__ import annotations

from enum import Enum


class ErrorCode(str, Enum):
    """MCP 错误码枚举。"""

    DB_CONNECTION_ERROR = "DB_CONNECTION_ERROR"
    DB_POOL_ERROR = "DB_POOL_ERROR"
    SQL_SYNTAX_ERROR = "SQL_SYNTAX_ERROR"
    SQL_OBJECT_NOT_FOUND = "SQL_OBJECT_NOT_FOUND"
    READ_ONLY_VIOLATION = "READ_ONLY_VIOLATION"
    QUERY_TIMEOUT = "QUERY_TIMEOUT"
    QUERY_EXECUTION_ERROR = "QUERY_EXECUTION_ERROR"
    LLM_API_ERROR = "LLM_API_ERROR"
    LLM_TIMEOUT = "LLM_TIMEOUT"
    SCHEMA_LOAD_ERROR = "SCHEMA_LOAD_ERROR"
    SCHEMA_NOT_FOUND = "SCHEMA_NOT_FOUND"
    INTERNAL_ERROR = "INTERNAL_ERROR"
    INVALID_ARGUMENT = "INVALID_ARGUMENT"


# 允许执行的查询类型（只读）
ALLOWED_QUERY_TYPES: frozenset[str] = frozenset(["SELECT", "EXPLAIN", "WITH"])

# 危险函数列表（禁止在 SQL 中使用）
DANGEROUS_FUNCTIONS: frozenset[str] = frozenset([
    "xp_cmdshell",
    "xp_delete_file",
    "xp_regread",
    "xp_regwrite",
    "xp_regdeletevalue",
    "xp_regdeletekey",
    "xp_grantlogin",
    "xp_enumgroups",
    "xp_loginconfig",
    "xp_logininfo",
    "xp_servicecontrol",
    "xp_terminate_process",
    "sp_configure",
    "sp_recompile",
    "sp_refreshsqlmodule",
    "sp_executesql",
    "openrowset",
    "opendatasource",
    "openquery",
    "bulk_insert",
    "fn_virtualfilestats",
    "fn_physloc",
])

# 默认数据库配置占位
DEFAULT_DB_NAME = "default"
