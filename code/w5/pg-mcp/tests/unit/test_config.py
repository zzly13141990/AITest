"""Config 模块单元测试。"""

import logging

import pytest
from pydantic import SecretStr, ValidationError

from pg_mcp.config import DatabaseConfig, LLMConfig, SecurityConfig, Settings, get_log_level, load_config


def test_database_config_defaults() -> None:
    """测试 DatabaseConfig 默认值。"""
    config = DatabaseConfig()
    assert config.name == "default"
    assert config.host == "localhost"
    assert config.port == 1433
    assert config.min_pool_size == 1
    assert config.max_pool_size == 10


def test_database_config_custom() -> None:
    """测试 DatabaseConfig 自定义值。"""
    config = DatabaseConfig(
        name="prod",
        host="db.example.com",
        port=5433,
        username="admin",
        password="secret",
        database="app",
    )
    assert config.name == "prod"
    assert config.host == "db.example.com"
    assert config.port == 5433


def test_database_config_password_is_secret() -> None:
    """测试 DatabaseConfig password 为 SecretStr 类型。"""
    config = DatabaseConfig(password="my_secret")
    assert isinstance(config.password, SecretStr)
    assert config.password.get_secret_value() == "my_secret"
    # 确保 repr 不暴露密码原文
    assert "my_secret" not in repr(config.password)


def test_settings_defaults() -> None:
    """测试 Settings 默认值。"""
    settings = Settings(_env_file=None)
    assert settings.db_host == "localhost"
    assert settings.llm_model == "glm-4.7"
    assert settings.security_max_query_timeout == 60
    assert settings.log_level == "INFO"


def test_settings_rejects_extra_fields() -> None:
    """测试 extra='forbid' 拒绝未定义的字段。"""
    with pytest.raises(ValidationError):
        Settings(unknown_field="should_not_pass")


def test_settings_builds_databases() -> None:
    """测试 Settings 自动构建 databases 列表（需 username 和 password 非空）。"""
    settings = Settings(
        db_name="test",
        db_host="testhost",
        db_database="testdb",
        db_username="test_user",
        db_password="test_pass",
    )
    assert len(settings.databases) == 1
    assert settings.databases[0].name == "test"
    assert settings.databases[0].host == "testhost"


def test_settings_provided_databases() -> None:
    """测试 Settings 不覆盖已有的 databases。"""
    db = DatabaseConfig(name="custom", host="customhost")
    settings = Settings(databases=[db])
    assert len(settings.databases) == 1
    assert settings.databases[0].name == "custom"


def test_settings_password_is_secret() -> None:
    """测试 Settings 中 db_password 和 llm_api_key 为 SecretStr。"""
    settings = Settings(db_password="pwd123", llm_api_key="key456")
    assert isinstance(settings.db_password, SecretStr)
    assert isinstance(settings.llm_api_key, SecretStr)
    assert settings.db_password.get_secret_value() == "pwd123"
    assert settings.llm_api_key.get_secret_value() == "key456"


def test_llm_config() -> None:
    """测试 LLMConfig 运行时配置。"""
    settings = Settings(
        llm_api_key="test_key",
        llm_model="gpt-4",
        llm_api_base="https://api.test/",
        llm_temperature=0.5,
        llm_max_tokens=2000,
        llm_timeout=60,
    )
    llm = LLMConfig(settings)
    assert llm.api_key == "test_key"
    assert llm.model == "gpt-4"
    assert llm.temperature == 0.5
    assert llm.max_tokens == 2000


def test_llm_config_to_dict() -> None:
    """测试 LLMConfig.to_dict()。"""
    settings = Settings(llm_api_key="key123", llm_api_base="https://test/")
    llm = LLMConfig(settings)
    d = llm.to_dict()
    assert d["api_key"] == "key123"
    assert d["base_url"] == "https://test/"


def test_security_config() -> None:
    """测试 SecurityConfig 运行时配置。"""
    settings = Settings(
        security_max_query_timeout=120,
        security_max_result_rows=5000,
        security_verification_threshold=0.9,
    )
    sec = SecurityConfig(settings)
    assert sec.max_query_timeout == 120
    assert sec.max_result_rows == 5000
    assert sec.verification_threshold == 0.9


def test_load_config() -> None:
    """测试 load_config() 返回 Settings 实例。"""
    config = load_config()
    assert isinstance(config, Settings)


def test_get_log_level_debug() -> None:
    """测试 get_log_level 返回 DEBUG。"""
    settings = Settings(log_level="DEBUG")
    assert get_log_level(settings) == logging.DEBUG


def test_get_log_level_info() -> None:
    """测试 get_log_level 返回 INFO。"""
    settings = Settings(log_level="INFO")
    assert get_log_level(settings) == logging.INFO


def test_get_log_level_warning() -> None:
    """测试 get_log_level 返回 WARNING。"""
    settings = Settings(log_level="WARNING")
    assert get_log_level(settings) == logging.WARNING


def test_get_log_level_case_insensitive() -> None:
    """测试 get_log_level 大小写不敏感。"""
    settings = Settings(log_level="debug")
    assert get_log_level(settings) == logging.DEBUG


def test_get_log_level_default_info() -> None:
    """测试 get_log_level 对未知级别返回 INFO。"""
    settings = Settings(log_level="UNKNOWN")
    assert get_log_level(settings) == logging.INFO
