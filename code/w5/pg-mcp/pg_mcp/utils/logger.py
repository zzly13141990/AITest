"""
日志工具：使用 structlog 提供结构化日志输出。
"""

from __future__ import annotations

import logging
import sys
from typing import Any

import structlog

_logger_initialized: bool = False


def setup_logging(level: int = logging.INFO) -> None:
    """
    配置全局 structlog。

    Args:
        level: 日志级别。
    """
    global _logger_initialized
    if _logger_initialized:
        return

    # 配置标准 logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=level,
    )

    # 配置 structlog
    processors = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.dev.set_exc_info,
        structlog.processors.TimeStamper(fmt="iso"),
    ]
    # 根据日志级别切换渲染器：生产环境用 JSON，开发环境用 Console
    if level <= logging.DEBUG:
        processors.append(structlog.dev.ConsoleRenderer())
    else:
        processors.append(structlog.processors.JSONRenderer())

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(level),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )
    _logger_initialized = True


def get_logger(name: str | None = None) -> Any:
    """
    获取 structlog logger 实例。

    Args:
        name: logger 名称（通常为 __name__）。

    Returns:
        structlog logger 实例。
    """
    if not _logger_initialized:
        setup_logging()
    return structlog.get_logger(name)
