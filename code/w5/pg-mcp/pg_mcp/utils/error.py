"""
错误处理工具：自定义 MCPError 异常和辅助函数。
"""

from __future__ import annotations

from typing import Any

from pg_mcp.constants import ErrorCode


class MCPError(Exception):
    """自定义 MCP 异常。"""

    def __init__(
        self,
        code: ErrorCode | str,
        message: str,
        details: dict[str, Any] | None = None,
        suggestion: str | None = None,
    ) -> None:
        self.code: str = code.value if isinstance(code, ErrorCode) else code
        self.message: str = message
        self.details: dict[str, Any] | None = details
        self.suggestion: str | None = suggestion
        super().__init__(self.message)

    def to_dict(self) -> dict[str, Any]:
        """转换为 MCP 标准响应格式。"""
        error: dict[str, Any] = {
            "code": self.code,
            "message": self.message,
        }
        if self.details:
            error["details"] = self.details
        if self.suggestion:
            error["suggestion"] = self.suggestion
        return {
            "success": False,
            "error": error,
        }

    def __repr__(self) -> str:
        parts = [f"code={self.code!r}", f"message={self.message!r}"]
        if self.details:
            parts.append(f"details={self.details!r}")
        if self.suggestion:
            parts.append(f"suggestion={self.suggestion!r}")
        return f"MCPError({', '.join(parts)})"

    def __str__(self) -> str:
        text = f"[{self.code}] {self.message}"
        if self.suggestion:
            text += f" | Suggestion: {self.suggestion}"
        return text


def to_dict(exc: Exception) -> dict[str, str]:
    """
    将异常转换为字典格式。

    Args:
        exc: 异常对象。

    Returns:
        字典格式的错误信息。
    """
    if isinstance(exc, MCPError):
        return exc.to_dict()
    return {
        "success": False,
        "error": {
            "code": ErrorCode.INTERNAL_ERROR.value,
            "message": str(exc),
        },
    }


def format_error(exc: Exception) -> str:
    """
    格式化异常为字符串。

    Args:
        exc: 异常对象。

    Returns:
        格式化后的错误字符串。
    """
    if isinstance(exc, MCPError):
        return f"[{exc.code}] {exc.message}"
    return f"[INTERNAL_ERROR] {exc}"


def is_mcp_error(exc: Exception) -> bool:
    """
    判断异常是否为 MCPError。

    Args:
        exc: 异常对象。

    Returns:
        如果是 MCPError 返回 True。
    """
    return isinstance(exc, MCPError)
