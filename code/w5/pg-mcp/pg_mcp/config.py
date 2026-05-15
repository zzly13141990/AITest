"""
配置模型：使用 Pydantic V2 + pydantic-settings 管理配置。
"""

from __future__ import annotations

import logging
from typing import Any

from pydantic import BaseModel, Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from pg_mcp.constants import ALLOWED_QUERY_TYPES, DEFAULT_DB_NAME


class DatabaseConfig(BaseModel):
    """单个数据库连接配置。"""

    name: str = DEFAULT_DB_NAME
    host: str = "localhost"
    port: int = 1433
    username: str = "sa"
    password: SecretStr = SecretStr("")
    database: str = "app_db"
    min_pool_size: int = 1
    max_pool_size: int = 10


class Settings(BaseSettings):
    """全局应用配置，从环境变量 / .env 文件加载。"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_nested_delimiter="__",
        extra="forbid",
    )

    # 数据库默认配置
    db_host: str = "localhost"
    db_port: int = 1433
    db_username: str = ""
    db_password: SecretStr = SecretStr("")
    db_database: str = ""
    db_name: str = DEFAULT_DB_NAME

    # LLM 配置
    llm_api_key: SecretStr = SecretStr("")
    llm_model: str = "glm-4.7"
    llm_api_base: str = "https://open.bigmodel.cn/api/paas/v4/"
    llm_temperature: float = 0.1
    llm_max_tokens: int = 1000
    llm_timeout: int = 30

    # 安全配置
    security_max_query_timeout: int = 60
    security_max_result_rows: int = 10000
    security_enable_sql_verification: bool = True
    security_enable_result_verification: bool = True
    security_verification_threshold: float = 0.8

    # 其他配置
    log_level: str = "INFO"
    schema_refresh_interval: int = 300

    # 运行时数据库列表
    databases: list[DatabaseConfig] = Field(default_factory=list)

    @model_validator(mode="after")
    def build_databases(self) -> "Settings":
        """从扁平的 DB_* 字段构建默认 DatabaseConfig 列表。"""
        if not self.databases and self.db_username and self.db_password:
            self.databases = [
                DatabaseConfig(
                    name=self.db_name,
                    host=self.db_host,
                    port=self.db_port,
                    username=self.db_username,
                    password=self.db_password,
                    database=self.db_database,
                )
            ]
        return self


class LLMConfig:
    """运行时 LLM 配置。"""

    def __init__(self, settings: Settings) -> None:
        self.api_key: str = settings.llm_api_key.get_secret_value()
        self.model: str = settings.llm_model
        self.base_url: str = settings.llm_api_base
        self.temperature: float = settings.llm_temperature
        self.max_tokens: int = settings.llm_max_tokens
        self.timeout: int = settings.llm_timeout

    def to_dict(self) -> dict[str, Any]:
        """转换为字典（用于 OpenAI 客户端参数）。"""
        return {
            "api_key": self.api_key,
            "base_url": self.base_url,
            "timeout": self.timeout,
        }


class SecurityConfig:
    """运行时安全配置。"""

    def __init__(self, settings: Settings) -> None:
        self.max_query_timeout: int = settings.security_max_query_timeout
        self.max_result_rows: int = settings.security_max_result_rows
        self.allowed_query_types: list[str] = list(ALLOWED_QUERY_TYPES)
        self.enable_sql_verification: bool = settings.security_enable_sql_verification
        self.enable_result_verification: bool = settings.security_enable_result_verification
        self.verification_threshold: float = settings.security_verification_threshold


def load_config() -> Settings:
    """加载并返回全局配置。"""
    return Settings()


def get_log_level(settings: Settings) -> int:
    """将日志级别字符串转换为 logging 常量。"""
    level_map: dict[str, int] = {
        "DEBUG": logging.DEBUG,
        "INFO": logging.INFO,
        "WARNING": logging.WARNING,
        "ERROR": logging.ERROR,
        "CRITICAL": logging.CRITICAL,
    }
    return level_map.get(settings.log_level.upper(), logging.INFO)
