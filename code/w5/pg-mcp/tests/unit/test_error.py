"""MCPError 工具函数单元测试。"""

from __future__ import annotations

from pg_mcp.constants import ErrorCode
from pg_mcp.utils.error import MCPError, format_error, is_mcp_error, to_dict


def test_mcp_error_basic() -> None:
    """测试 MCPError 基本用法。"""
    exc = MCPError(code=ErrorCode.DB_CONNECTION_ERROR, message="Connection failed")
    assert exc.code == ErrorCode.DB_CONNECTION_ERROR.value
    assert exc.message == "Connection failed"
    assert exc.details is None
    assert exc.suggestion is None


def test_mcp_error_with_details_suggestion() -> None:
    """测试 MCPError 携带 details 和 suggestion。"""
    exc = MCPError(
        code=ErrorCode.QUERY_EXECUTION_ERROR,
        message="Query failed",
        details={"sql": "SELECT * FROM users", "db": "default"},
        suggestion="Check the SQL syntax and try again.",
    )
    assert exc.details == {"sql": "SELECT * FROM users", "db": "default"}
    assert exc.suggestion == "Check the SQL syntax and try again."


def test_mcp_error_to_dict_basic() -> None:
    """测试 MCPError.to_dict() 基本输出。"""
    exc = MCPError(code=ErrorCode.READ_ONLY_VIOLATION, message="Write not allowed")
    d = exc.to_dict()
    assert d["success"] is False
    assert d["error"]["code"] == ErrorCode.READ_ONLY_VIOLATION.value
    assert d["error"]["message"] == "Write not allowed"
    assert "details" not in d["error"]
    assert "suggestion" not in d["error"]


def test_mcp_error_to_dict_with_details() -> None:
    """测试 to_dict() 包含 details 和 suggestion。"""
    exc = MCPError(
        code=ErrorCode.SQL_SYNTAX_ERROR,
        message="Bad SQL",
        details={"token": "FROM"},
        suggestion="Use valid SQL syntax.",
    )
    d = exc.to_dict()
    assert d["error"]["details"] == {"token": "FROM"}
    assert d["error"]["suggestion"] == "Use valid SQL syntax."


def test_mcp_error_to_dict_omits_empty_details() -> None:
    """测试 to_dict() 不包含空的 details/suggestion。"""
    exc = MCPError(code=ErrorCode.INTERNAL_ERROR, message="err", details=None)
    d = exc.to_dict()
    assert "details" not in d["error"]
    assert "suggestion" not in d["error"]


def test_mcp_error_repr() -> None:
    """测试 MCPError.__repr__。"""
    exc = MCPError(code=ErrorCode.INTERNAL_ERROR, message="test error")
    r = repr(exc)
    assert "MCPError" in r
    assert "INTERNAL_ERROR" in r


def test_mcp_error_repr_with_details() -> None:
    """测试 __repr__ 包含 details/suggestion。"""
    exc = MCPError(ErrorCode.QUERY_TIMEOUT, "timeout", details={"timeout": 60}, suggestion="Increase timeout")
    r = repr(exc)
    assert "details" in r
    assert "suggestion" in r


def test_mcp_error_str() -> None:
    """测试 MCPError.__str__。"""
    exc = MCPError(code=ErrorCode.LLM_API_ERROR, message="API unreachable")
    s = str(exc)
    assert "LLM_API_ERROR" in s
    assert "API unreachable" in s


def test_mcp_error_str_with_suggestion() -> None:
    """测试 __str__ 包含 Suggestion。"""
    exc = MCPError(
        ErrorCode.DB_CONNECTION_ERROR,
        "Cannot connect",
        suggestion="Check the database host and port.",
    )
    s = str(exc)
    assert "Suggestion:" in s
    assert "Check the database host" in s


def test_to_dict_mcp_error() -> None:
    """测试 to_dict() 辅助函数处理 MCPError。"""
    exc = MCPError(code=ErrorCode.SCHEMA_LOAD_ERROR, message="Schema load failed")
    d = to_dict(exc)
    assert d["error"]["code"] == ErrorCode.SCHEMA_LOAD_ERROR.value
    assert d["error"]["message"] == "Schema load failed"


def test_to_dict_plain_exception() -> None:
    """测试 to_dict() 辅助函数处理普通 Exception。"""
    exc = ValueError("something broke")
    d = to_dict(exc)
    assert d["error"]["code"] == ErrorCode.INTERNAL_ERROR.value
    assert d["error"]["message"] == "something broke"


def test_format_error_mcp_error() -> None:
    """测试 format_error() 格式化 MCPError。"""
    exc = MCPError(code=ErrorCode.READ_ONLY_VIOLATION, message="Write not allowed")
    s = format_error(exc)
    assert s == "[READ_ONLY_VIOLATION] Write not allowed"


def test_format_error_plain_exception() -> None:
    """测试 format_error() 格式化普通 Exception。"""
    exc = RuntimeError("crash")
    s = format_error(exc)
    assert "INTERNAL_ERROR" in s
    assert "crash" in s


def test_is_mcp_error_true() -> None:
    """测试 is_mcp_error() 识别 MCPError。"""
    exc = MCPError(code=ErrorCode.INTERNAL_ERROR, message="error")
    assert is_mcp_error(exc) is True


def test_is_mcp_error_false() -> None:
    """测试 is_mcp_error() 识别非 MCPError。"""
    exc = ValueError("not mcp")
    assert is_mcp_error(exc) is False


def test_mcp_error_string_code() -> None:
    """测试 MCPError 接受字符串 code。"""
    exc = MCPError(code="CUSTOM_ERROR", message="custom")
    assert exc.code == "CUSTOM_ERROR"
