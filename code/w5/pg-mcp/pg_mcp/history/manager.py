"""
查询历史记录管理器。
使用 JSON Lines 文件存储查询历史，带并发写入保护。
"""

from __future__ import annotations

import asyncio
import json
import os
from pathlib import Path
from typing import Any

from pg_mcp.models.query import QueryHistory, QueryStatus
from pg_mcp.utils.logger import get_logger

logger = get_logger(__name__)

# 默认历史文件路径
DEFAULT_HISTORY_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "history"


class HistoryManager:
    """管理查询历史记录（JSON Lines 文件存储，带并发写入保护）。"""

    def __init__(self, history_dir: Path | None = None) -> None:
        self._history_dir = history_dir or DEFAULT_HISTORY_DIR
        if not self._history_dir.exists():
            self._history_dir.mkdir(parents=True, exist_ok=True)
        # 并发写入保护：每个文件一个锁
        self._file_locks: dict[str, asyncio.Lock] = {}
        self._locks_lock = asyncio.Lock()

    async def _get_file_lock(self, file_path: Path) -> asyncio.Lock:
        """获取或创建指定文件的异步锁。"""
        file_key = str(file_path)
        async with self._locks_lock:
            if file_key not in self._file_locks:
                self._file_locks[file_key] = asyncio.Lock()
            return self._file_locks[file_key]

    def _get_history_file(self, user: str | None = None) -> Path:
        """
        获取历史文件路径。

        Args:
            user: 用户标识。如果为 None，使用默认文件。

        Returns:
            历史文件的绝对路径。
        """
        if user:
            # 文件名安全处理
            safe_user = "".join(c for c in user if c.isalnum() or c in "-_.")
            return self._history_dir / f"history_{safe_user}.jsonl"
        return self._history_dir / "history.jsonl"

    async def record(
        self,
        user_query: str,
        generated_sql: str = "",
        db_name: str = "",
        status: QueryStatus = QueryStatus.PENDING,
        result_rows: int = 0,
        execution_time_ms: float = 0.0,
        error_message: str | None = None,
        user: str | None = None,
    ) -> None:
        """
        记录一条查询历史（带并发锁保护）。

        Args:
            user_query: 用户原始查询。
            generated_sql: 生成的 SQL 语句。
            db_name: 目标数据库名称。
            status: 查询执行状态。
            result_rows: 返回行数。
            execution_time_ms: 执行耗时（毫秒）。
            error_message: 错误信息。
            user: 用户标识。
        """
        history = QueryHistory(
            user_query=user_query,
            generated_sql=generated_sql,
            db_name=db_name,
            status=status,
            result_rows=result_rows,
            execution_time_ms=execution_time_ms,
            error_message=error_message,
            user=user,
        )
        file_path = self._get_history_file(user)
        lock = await self._get_file_lock(file_path)
        async with lock:
            try:
                await asyncio.to_thread(
                    self._append_record, file_path, history.to_dict()
                )
                logger.info(
                    "history_recorded",
                    id=history.id,
                    user=user,
                )
            except OSError as exc:
                logger.error(
                    "history_write_error",
                    file=str(file_path),
                    error=str(exc),
                )

    async def get_by_user(self, user: str, limit: int = 50) -> list[QueryHistory]:
        """
        获取指定用户的历史记录。

        Args:
            user: 用户标识。
            limit: 最大返回条数。

        Returns:
            查询历史列表。
        """
        file_path = self._get_history_file(user)
        return await self._read_history(file_path, limit)

    async def get_recent(self, user: str | None = None, limit: int = 20) -> list[QueryHistory]:
        """
        获取最近的查询历史记录。

        Args:
            user: 用户标识（可选）。
            limit: 最大返回条数。

        Returns:
            查询历史列表（按时间倒序）。
        """
        file_path = self._get_history_file(user)
        return await self._read_history(file_path, limit)

    async def _read_history(self, file_path: Path, limit: int) -> list[QueryHistory]:
        """
        从文件读取历史记录。

        Args:
            file_path: 文件路径。
            limit: 最大读取条数。

        Returns:
            查询历史列表。
        """
        if not file_path.exists():
            return []

        try:
            lines = await asyncio.to_thread(self._read_lines, file_path)
        except OSError as exc:
            logger.error(
                "history_read_error",
                file=str(file_path),
                error=str(exc),
            )
            return []
        # 解析行数据
        results: list[QueryHistory] = []
        for line in lines:
            try:
                data = json.loads(line)
                results.append(QueryHistory.from_dict(data))
            except (json.JSONDecodeError, ValueError) as exc:
                logger.warning(
                    "history_parse_error",
                    error=str(exc),
                )
                continue

        # 按时间倒序，取最新的 limit 条
        results.sort(key=lambda h: h.timestamp, reverse=True)
        return results[:limit]

    def _append_record(self, file_path: Path, record: dict) -> None:
        """同步写入一条记录到文件（在 asyncio.to_thread 中调用）。"""
        with open(file_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")

    def _read_lines(self, file_path: Path) -> list[str]:
        """同步读取文件所有行（在 asyncio.to_thread 中调用）。"""
        with open(file_path, "r", encoding="utf-8") as f:
            return [line.strip() for line in f if line.strip()]

    async def cleanup(self, max_age_days: int = 30) -> int:
        """
        清理超过指定天数的历史记录。

        Args:
            max_age_days: 最大保留天数。

        Returns:
            清理的记录总数。
        """
        from datetime import datetime, timedelta, timezone

        cutoff = datetime.now(tz=timezone.utc) - timedelta(days=max_age_days)
        total_cleaned = 0

        for file_path in self._history_dir.glob("*.jsonl"):
            try:
                records: list[dict[str, Any]] = []
                cleaned = 0
                with open(file_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if not line:
                            continue
                        try:
                            data = json.loads(line)
                            ts_str = data.get("timestamp", "")
                            if ts_str:
                                ts = datetime.fromisoformat(ts_str)
                                if ts < cutoff:
                                    cleaned += 1
                                    continue
                            records.append(data)
                        except (json.JSONDecodeError, ValueError):
                            continue

                # 重写文件
                if records:
                    with open(file_path, "w", encoding="utf-8") as f:
                        for record in records:
                            f.write(json.dumps(record, ensure_ascii=False) + "\n")
                else:
                    # 没有记录则删除文件
                    file_path.unlink(missing_ok=True)

                total_cleaned += cleaned
                logger.info(
                    "history_cleanup",
                    file=str(file_path),
                    cleaned=cleaned,
                )
            except OSError as exc:
                logger.error(
                    "history_cleanup_error",
                    file=str(file_path),
                    error=str(exc),
                )

        return total_cleaned
