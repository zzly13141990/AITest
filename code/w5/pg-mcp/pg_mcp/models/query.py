"""查询相关数据模型。"""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, Field


class QueryStatus(str, Enum):
    """查询执行状态。"""

    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    TIMEOUT = "timeout"


class QueryHistory(BaseModel):
    """查询历史记录。"""

    id: str = Field(default_factory=lambda: datetime.now(tz=timezone.utc).strftime("%Y%m%d%H%M%S%f"))
    user_query: str
    generated_sql: str = ""
    db_name: str = ""
    status: QueryStatus = QueryStatus.PENDING
    result_rows: int = 0
    execution_time_ms: float = 0.0
    error_message: str | None = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))
    user: str | None = None

    def to_dict(self) -> dict:
        """转换为可序列化的字典（用于 JSON Lines 存储）。"""
        return {
            "id": self.id,
            "user_query": self.user_query,
            "generated_sql": self.generated_sql,
            "db_name": self.db_name,
            "status": self.status.value,
            "result_rows": self.result_rows,
            "execution_time_ms": self.execution_time_ms,
            "error_message": self.error_message,
            "timestamp": self.timestamp.isoformat(),
            "user": self.user,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "QueryHistory":
        """从字典反序列化。"""
        data = data.copy()
        if isinstance(data.get("status"), str):
            data["status"] = QueryStatus(data["status"])
        if isinstance(data.get("timestamp"), str):
            data["timestamp"] = datetime.fromisoformat(data["timestamp"])
        return cls(**data)
