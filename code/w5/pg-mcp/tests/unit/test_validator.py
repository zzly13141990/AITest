"""SQL Validator 单元测试。"""

import pytest

from unittest.mock import MagicMock

from pg_mcp.constants import DANGEROUS_FUNCTIONS, ErrorCode
from pg_mcp.models.schema import DatabaseSchema
from pg_mcp.sql.validator import SQLValidator
from pg_mcp.utils.error import MCPError


def test_validate_read_only_select() -> None:
    """测试只读 SELECT 验证通过。"""
    SQLValidator.validate_read_only("SELECT * FROM users;")


def test_validate_read_only_with() -> None:
    """测试 WITH 语句验证通过。"""
    SQLValidator.validate_read_only(
        "WITH cte AS (SELECT 1) SELECT * FROM cte;"
    )


def test_validate_read_only_insert() -> None:
    """测试 INSERT 被拒绝。"""
    with pytest.raises(MCPError) as exc_info:
        SQLValidator.validate_read_only("INSERT INTO users (name) VALUES ('test');")
    assert exc_info.value.code == ErrorCode.READ_ONLY_VIOLATION.value


def test_validate_read_only_update() -> None:
    """测试 UPDATE 被拒绝。"""
    with pytest.raises(MCPError) as exc_info:
        SQLValidator.validate_read_only("UPDATE users SET name = 'test';")
    assert exc_info.value.code == ErrorCode.READ_ONLY_VIOLATION.value


def test_validate_read_only_delete() -> None:
    """测试 DELETE 被拒绝。"""
    with pytest.raises(MCPError) as exc_info:
        SQLValidator.validate_read_only("DELETE FROM users;")
    assert exc_info.value.code == ErrorCode.READ_ONLY_VIOLATION.value


def test_validate_read_only_ddl() -> None:
    """测试 DDL 语句被拒绝。"""
    with pytest.raises(MCPError) as exc_info:
        SQLValidator.validate_read_only("CREATE TABLE test (id INT);")
    assert exc_info.value.code == ErrorCode.READ_ONLY_VIOLATION.value


def test_validate_syntax_valid_sql(mock_schema: DatabaseSchema) -> None:
    """测试有效 SQL 语法验证通过。"""
    validator = SQLValidator(None, None)  # type: ignore[arg-type]
    validator.validate_syntax_and_objects("SELECT * FROM users;", mock_schema)


def test_validate_syntax_invalid_sql(mock_schema: DatabaseSchema) -> None:
    """测试无效 SQL 语法验证失败。"""
    validator = SQLValidator(None, None)  # type: ignore[arg-type]
    with pytest.raises(MCPError) as exc_info:
        validator.validate_syntax_and_objects("INVALID SQL SYNTAX !!!!", mock_schema)
    assert exc_info.value.code == ErrorCode.SQL_SYNTAX_ERROR.value


def test_has_dangerous_functions() -> None:
    """测试危险函数检测。"""
    validator = SQLValidator(None, None)  # type: ignore[arg-type]
    sql = "SELECT xp_cmdshell('dir');"
    import sqlglot
    parsed = sqlglot.parse_one(sql, read="tsql")
    assert validator.has_dangerous_functions(parsed) is True


def test_has_no_dangerous_functions() -> None:
    """测试正常 SQL 不包含危险函数。"""
    validator = SQLValidator(None, None)  # type: ignore[arg-type]
    import sqlglot
    parsed = sqlglot.parse_one("SELECT id, name FROM users;", read="tsql")
    assert validator.has_dangerous_functions(parsed) is False


def test_find_parent_table() -> None:
    """测试主表名提取。"""
    table_name = SQLValidator._find_parent_table("SELECT * FROM users WHERE id = 1;")
    assert table_name == "users"


def test_find_parent_table_with_schema() -> None:
    """测试带 schema 的主表名提取。"""
    table_name = SQLValidator._find_parent_table("SELECT * FROM public.users;")
    assert table_name == "users"


def test_validate_strict_table_not_found(mock_sql_validator: SQLValidator, mock_schema: MagicMock) -> None:
    """测试严格模式下表不存在时抛出异常。"""
    sql = "SELECT * FROM nonexistent_table;"
    mock_schema.tables = {}
    mock_schema.views = {}

    with pytest.raises(MCPError) as exc_info:
        mock_sql_validator.validate_syntax_and_objects(sql, mock_schema)
    assert "not exist" in exc_info.value.message


def test_has_dangerous_functions_from_sql_found(mock_sql_validator: SQLValidator) -> None:
    """测试 has_dangerous_functions_from_sql 检测到危险函数。"""
    result = mock_sql_validator.has_dangerous_functions_from_sql(
        "SELECT xp_cmdshell('dir');"
    )
    assert result == "xp_cmdshell"


def test_has_dangerous_functions_from_sql_not_found(mock_sql_validator: SQLValidator) -> None:
    """测试 has_dangerous_functions_from_sql 安全 SQL 返回 None。"""
    result = mock_sql_validator.has_dangerous_functions_from_sql(
        "SELECT id, name FROM users;"
    )
    assert result is None


def test_has_dangerous_functions_from_sql_all_functions(mock_sql_validator: SQLValidator) -> None:
    """测试 has_dangerous_functions_from_sql 覆盖所有 20 个危险函数。"""
    for func in DANGEROUS_FUNCTIONS:
        result = mock_sql_validator.has_dangerous_functions_from_sql(
            f"SELECT {func}(1);"
        )
        assert result == func, f"Failed to detect dangerous function: {func}"


def test_has_dangerous_functions_from_sql_case_insensitive(mock_sql_validator: SQLValidator) -> None:
    """测试 has_dangerous_functions_from_sql 大小写不敏感。"""
    result = mock_sql_validator.has_dangerous_functions_from_sql(
        "SELECT XP_CMDSHELL('dir');"
    )
    assert result == "xp_cmdshell"
