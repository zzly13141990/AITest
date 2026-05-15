# pg-mcp 项目规范 (CLAUDE.md)

> SQL Server 智能查询 MCP Server - 基于 FastMCP、aioodbc/pyodbc、SQLGlot(dialect=mssql)、Pydantic、OpenAI SDK 构建

## 项目概述

本项目是一个基于 MCP (Model Context Protocol) 的 SQL Server 数据库查询服务，允许通过自然语言描述自动生成并执行 T-SQL 查询。

**核心流程**: 自然语言 → LLM 生成 T-SQL → 安全校验(SQLGlot, read="mssql") → 执行(aioodbc) → 结果返回/验证

**技术栈**:
- **MCP 框架**: FastMCP
- **数据库驱动**: aioodbc + pyodbc (ODBC Driver 17 for SQL Server)
- **SQL 处理**: SQLGlot (解析/验证，read="mssql")
- **数据验证**: Pydantic V2
- **LLM 客户端**: OpenAI SDK（.env 配置 DeepSeek-v4-flash，代码默认 glm-4.7）
- **日志**: Structlog

---

## 设计原则

### SOLID

| 原则 | 实践要求 |
|------|----------|
| **SRP** (单一职责) | 每个类/模块只负责一项职责。SQL 验证、生成、执行必须分离为独立类 |
| **OCP** (开闭原则) | 对扩展开放，对修改封闭。使用抽象基类(ABC)定义接口，具体实现通过子类扩展 |
| **LSP** (里氏替换) | 子类必须能替换父类使用。定义清晰的接口契约 |
| **ISP** (接口隔离) | 接口要小而精。不要强迫实现不需要的方法 |
| **DIP** (依赖倒置) | 依赖抽象而非具体实现。使用依赖注入，避免硬编码耦合 |

### DRY

| 实践 | 说明 |
|------|------|
| 复用工具函数 | 重复逻辑提取到 `utils/` 模块 |
| 配置集中管理 | 所有配置通过 Pydantic Settings 统一管理 |
| 错误码枚举化 | 错误码集中定义在 `constants.py` |
| Prompt 模板化 | LLM Prompt 使用模板，不要散落各处 |

---

## Python 编码规范

### 语言版本与特性

- Python **3.11+** 是最低要求
- 使用现代类型注解语法: `str | None` 而非 `Optional[str]`, `list[str]` 而非 `List[str]`
- 使用 `typing` 模块中的泛型标注: `dict[str, Any]`, `list[ColumnInfo]`
- 使用 `dataclasses` 或 `Pydantic` 替代裸字典传递结构化数据
- 使用 `match/case` (3.10+) 替代长链 `if/elif`

### 类型注解 (强制)

```python
# GOOD - 完整的类型注解
async def execute_query(
    sql: str,
    db_name: str,
    page: int = 1,
    page_size: int = 100,
) -> dict[str, Any]:
    ...

# BAD - 缺少类型注解
async def execute_query(sql, db_name, page=1, page_size=100):
    ...
```

### 异步编程 (强制)

```python
# GOOD - 全程异步，使用 context manager
async def execute(self, sql: str, db_name: str) -> dict[str, Any]:
    async with await self.pool.acquire(db_name) as conn:
        rows = await conn.fetch(sql, timeout=self.timeout)
        return self._format_result(rows)

# BAD - 混合同步/异步，手动管理连接
def execute(self, sql, db_name):
    conn = self.pool.get(db_name)  # 同步获取连接，可能阻塞
    rows = conn.fetch(sql)
    return rows
```

### 异常处理 (强制)

```python
# GOOD - 使用自定义异常，捕获特定异常
try:
    sql = await self.client.generate(query, schema)
except LLMGenerationError as e:
    raise MCPError(ErrorCode.LLM_API_ERROR, f"SQL generation failed: {e}")

# BAD - 裸 except，吞噬异常
try:
    sql = await self.client.generate(query, schema)
except:  # 禁止!
    pass
```

### 文档字符串 (强制)

所有公共模块、类、方法必须包含 docstring，遵循 Google 风格:

```python
class SQLValidator:
    """SQL 验证器 - 负责语法解析、只读检查、对象存在性验证。

    使用 SQLGlot 进行 AST 级别的 SQL 分析，确保生成的 SQL
    符合安全策略且引用了真实存在的数据库对象。
    """

    async def validate_read_only(self, sql: str) -> None:
        """验证 SQL 是否为只读操作。

        Args:
            sql: 待验证的 SQL 语句。

        Raises:
            MCPError: 当 SQL 包含非 SELECT 操作时抛出。
        """
        ...
```

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 模块/包 | `snake_case` | `schema_manager.py` |
| 类 | `PascalCase` | `ConnectionPoolManager` |
| 函数/方法 | `snake_case` | `get_schema()`, `validate_read_only()` |
| 常量 | `UPPER_SNAKE_CASE` | `MAX_QUERY_TIMEOUT` |
| 私有成员 | 前缀 `_` | `_cache`, `_load_tables()` |
| 环境变量 | `UPPER_SNAKE_CASE` | `DATABASE_URL`, `LLM_API_KEY` |

### 导入顺序

```python
# 1. 标准库
import asyncio
from contextlib import asynccontextmanager
from typing import Any

# 2. 第三方库
import aioodbc
import sqlglot
from openai import AsyncOpenAI
from pydantic import BaseModel, Field

# 3. 本地应用/库
from pg_mcp.models.schema import TableInfo
from pg_mcp.utils.error import MCPError, ErrorCode
from pg_mcp.utils.logger import get_logger
```

---

## 架构规范

### 模块职责

| 模块路径 | 职责 | 禁止 |
|----------|------|------|
| `pg_mcp/main.py` | MCP Server 入口、生命周期管理、工具注册 | 不要包含业务逻辑 |
| `pg_mcp/config.py` | 配置加载与验证 | 不要硬编码配置值 |
| `pg_mcp/database/pool.py` | 连接池生命周期管理 | 不要执行 SQL 查询 |
| `pg_mcp/database/schema.py` | Schema 采集、缓存、刷新 | 不要修改数据库结构 |
| `pg_mcp/sql/generator.py` | LLM 调用、SQL 生成 | 不要执行或验证 SQL |
| `pg_mcp/sql/validator.py` | 语法解析、只读检查、对象验证 | 不要生成或执行 SQL |
| `pg_mcp/sql/executor.py` | SQL 执行、结果格式化 | 不要生成或验证 SQL |
| `pg_mcp/models/*.py` | Pydantic 数据模型定义 | 不要包含业务逻辑 |
| `pg_mcp/utils/*.py` | 工具函数 (日志、错误处理等) | 不要包含业务逻辑 |

### 依赖注入

使用构造函数注入依赖，不使用全局变量或单例模式:

```python
# GOOD - 构造函数注入
class QueryService:
    def __init__(
        self,
        schema_mgr: SchemaManager,
        sql_gen: SQLGenerator,
        sql_validator: SQLValidator,
        sql_executor: SQLExecutor,
    ) -> None:
        self._schema_mgr = schema_mgr
        self._sql_gen = sql_gen
        self._sql_validator = sql_validator
        self._sql_executor = sql_executor

# BAD - 全局依赖或硬编码
class QueryService:
    def __init__(self) -> None:
        self.schema_mgr = global_schema_mgr  # 全局变量
```

### 数据模型

- 所有数据模型必须使用 **Pydantic V2**
- 使用 `Field()` 定义验证规则和默认值
- 使用 `model_config` 设置模型行为
- 禁止使用 `dict` 传递结构化数据

```python
# GOOD
class ColumnInfo(BaseModel):
    model_config = {"frozen": True}  # 不可变

    name: str
    type: str
    nullable: bool = True
    default: str | None = None
    comment: str | None = None
    is_primary_key: bool = False

# BAD - 使用 TypedDict 或裸字典
ColumnInfo = dict[str, Any]  # 无验证，无类型安全
```

### 配置管理

- 使用 `pydantic-settings` 加载配置
- 敏感信息 (密码、API Key) 必须通过环境变量传入
- 配置模型必须包含验证逻辑
- 使用 `.env` 文件进行本地开发

```python
# GOOD
from pydantic_settings import BaseSettings, SettingsConfigDict

class AppConfig(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="forbid",  # 禁止未定义的配置项
    )

    db_host: str = "localhost"
    db_port: int = 1433
    llm_api_key: SecretStr  # 使用 SecretStr 保护敏感信息
    llm_model: str = "deepseek-v4-flash"
    max_query_timeout: int = Field(ge=1, le=300, default=30)
```

---

## 安全规范

### SQL 安全

```python
# 三层安全校验必须全部通过:
# L1 - 关键字过滤: 正则匹配危险关键字
# L2 - 语法解析: SQLGlot AST 验证仅 SELECT 语句
# L3 - 对象验证: 验证表/列是否存在于 Schema 中

# 白名单允许的 SQL 类型
ALLOWED_QUERY_TYPES = frozenset({"SELECT", "EXPLAIN", "WITH"})

# 危险的 SQL Server 函数/操作
DANGEROUS_FUNCTIONS = frozenset({
    "xp_cmdshell", "xp_delete_file", "xp_regread", "xp_regwrite",
    "xp_regdeletevalue", "xp_regdeletekey", "xp_grantlogin",
    "xp_enumgroups", "xp_loginconfig", "xp_logininfo",
    "xp_servicecontrol", "xp_terminate_process",
    "sp_configure", "sp_recompile", "sp_refreshsqlmodule",
    "sp_executesql", "openrowset", "opendatasource", "openquery",
    "bulk_insert", "fn_virtualfilestats", "fn_physloc",
})
```

### 输入安全

- 用户输入必须进行预处理，去除潜在的攻击载荷
- System Prompt 中必须包含安全约束指令
- 所有 LLM 生成的 SQL 必须经过安全校验层才能执行

### 数据安全

- API Key 和数据库密码使用 `SecretStr` 类型
- 日志中禁止输出敏感信息
- 查询结果返回前进行行数限制

---

## 日志规范

使用 `structlog` 进行结构化日志输出:

```python
from structlog import get_logger

logger = get_logger(__name__)

# GOOD - 结构化日志，包含上下文信息
logger.info(
    "query_executed",
    db_name=db_name,
    sql_length=len(sql),
    row_count=len(rows),
    duration_ms=duration_ms,
)

# BAD - 字符串拼接，无结构
logger.info(f"Query executed on {db_name} with {len(rows)} rows")
```

### 日志级别

| 级别 | 使用场景 |
|------|----------|
| `DEBUG` | 详细的调试信息，如 SQL 语句全文、Schema 详情 |
| `INFO` | 正常操作记录，如连接建立、查询成功、Schema 加载完成 |
| `WARNING` | 可恢复的异常，如 LLM 调用失败重试、结果验证分数低 |
| `ERROR` | 不可恢复的错误，如数据库连接失败、SQL 校验失败 |
| `EXCEPTION` | 异常堆栈信息 (使用 `logger.exception()` ) |

---

## 测试规范

### 测试框架

- 使用 `pytest` + `pytest-asyncio`
- 测试文件放在 `tests/` 目录下，与源码目录结构对应
- 单元测试放在 `tests/unit/`，集成测试放在 `tests/integration/`

### 测试命名

```
test_<被测模块>_<测试场景>_<期望结果>
```

```python
# GOOD - 清晰的测试名称
async def test_sql_validator_validate_read_only_accepts_select():
    ...

async def test_sql_validator_validate_read_only_rejects_delete():
    ...

# BAD - 模糊的测试名称
def test_sql_validator():
    ...
```

### 测试要求

| 要求 | 标准 |
|------|------|
| 覆盖率 | 单元测试覆盖率 >= 85% |
| 异步测试 | 使用 `@pytest.mark.asyncio` |
| Mock 外部依赖 | LLM 调用、数据库连接必须 Mock |
| 边界条件 | 测试空输入、超长输入、特殊字符等 |
| 安全性测试 | 测试 SQL 注入、Prompt 注入等攻击场景 |

### 测试示例

```python
import pytest
from pg_mcp.sql.validator import SQLValidator

class TestSQLValidator:
    @pytest.fixture
    def validator(self, security_config, mock_schema_mgr):
        return SQLValidator(security_config, mock_schema_mgr)

    async def test_accepts_valid_select(self, validator):
        validator.validate_read_only("SELECT * FROM users")
        # 不应抛出异常

    async def test_rejects_delete(self, validator):
        with pytest.raises(MCPError) as exc_info:
            validator.validate_read_only("DELETE FROM users")
        assert exc_info.value.code == ErrorCode.READ_ONLY_VIOLATION
```

---

## 性能规范

### 数据库

- 使用 `aioodbc` 连接池，避免每次查询创建新 ODBC 连接
- Schema 采集时批量查询，减少数据库往返次数
- 查询结果必须有限制行数 (`LIMIT`)

### LLM 调用

- 设置合理的超时时间 (默认 30s)
- 实现重试机制 (默认 3 次)
- Schema 文本发送给 LLM 前进行筛选，仅包含相关表

### 内存管理

- Schema 缓存存储在内存中，注意内存占用 (< 100MB)
- 大结果集进行截断，不全部加载到内存
- 使用流式处理避免一次性加载全部数据

### 异步

- 所有 I/O 操作必须使用 `async/await`
- 不要使用阻塞调用 (如 `requests`, `time.sleep`)
- 使用 `asyncio.gather()` 进行并发操作

```python
# GOOD - 并发加载 Schema
async def load_all(self) -> None:
    tasks = [self.load_schema(name) for name in self.pool_mgr.pools]
    await asyncio.gather(*tasks)

# BAD - 串行加载
async def load_all(self) -> None:
    for name in self.pool_mgr.pools:
        await self.load_schema(name)  # 串行，慢
```

---

## 错误处理

### 自定义异常体系

```python
class MCPError(Exception):
    """基础异常类"""
    def __init__(
        self,
        code: ErrorCode,
        message: str,
        details: dict[str, Any] | None = None,
        suggestion: str | None = None,
    ) -> None:
        self.code = code
        self.message = message
        self.details = details or {}
        self.suggestion = suggestion
        super().__init__(message)

    def to_dict(self) -> dict[str, Any]:
        return {
            "success": False,
            "error": {
                "code": self.code.value,
                "message": self.message,
                "details": self.details,
                "suggestion": self.suggestion,
            },
        }
```

### 错误处理流程

```
异常发生 → 捕获并转换为 MCPError → 记录日志 → 记录历史 → 返回错误响应
```

### 错误码分类

```python
class ErrorCode(Enum):
    # 数据库
    DB_CONNECTION_ERROR = "DB_CONNECTION_ERROR"
    DB_POOL_ERROR = "DB_POOL_ERROR"

    # SQL
    SQL_SYNTAX_ERROR = "SQL_SYNTAX_ERROR"
    SQL_OBJECT_NOT_FOUND = "SQL_OBJECT_NOT_FOUND"
    READ_ONLY_VIOLATION = "READ_ONLY_VIOLATION"

    # 查询
    QUERY_TIMEOUT = "QUERY_TIMEOUT"
    QUERY_EXECUTION_ERROR = "QUERY_EXECUTION_ERROR"

    # LLM
    LLM_API_ERROR = "LLM_API_ERROR"
    LLM_TIMEOUT = "LLM_TIMEOUT"

    # Schema
    SCHEMA_LOAD_ERROR = "SCHEMA_LOAD_ERROR"
    SCHEMA_NOT_FOUND = "SCHEMA_NOT_FOUND"

    # 通用
    INTERNAL_ERROR = "INTERNAL_ERROR"
    INVALID_ARGUMENT = "INVALID_ARGUMENT"
```

---

## 代码质量工具

### Linter & Formatter

| 工具 | 用途 |
|------|------|
| `ruff` | Lint + Format (替代 flake8 + black + isort) |
| `mypy` | 静态类型检查 |
| `pytest` | 测试框架 |

### ruff 配置建议

```toml
[tool.ruff]
target-version = "py311"
line-length = 100
indent-width = 4

[tool.ruff.lint]
select = ["E", "F", "W", "I", "N", "UP", "B", "SIM", "RUF"]
ignore = ["E501"]  # line length handled by formatter

[tool.ruff.lint.isort]
known-first-party = ["pg_mcp"]
```

### mypy 配置建议

```toml
[tool.mypy]
python_version = "3.11"
strict = true
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
```

---

## Prompt 工程规范

### SQL 生成 Prompt 要求

```
系统角色设定:
- 你是 SQL Server (T-SQL) 数据库专家
- 你只生成 SELECT 查询语句
- 绝不生成 INSERT/UPDATE/DELETE/DDL 等任何修改数据的语句
- 生成的 SQL 必须是有效的 T-SQL 语法

输出要求:
- 只返回 SQL 语句，不要任何解释或标记
- 使用清晰的列别名
- 对于复杂查询，合理使用 JOIN 和子查询
- 默认使用 LIMIT 100 防止返回过多数据
```

### 结果验证 Prompt 要求

```
评估查询结果是否与用户原始意图一致。

用户意图: {user_query}
生成的 SQL: {sql}
结果样本: {sample_rows}

请判断:
1. 结果是否回答了用户的问题？
2. 结果的数据类型和格式是否合理？

输出: 1(一致) 或 0(不一致)
```

---

## 快速参考

### 项目结构

```
pg-mcp/
├── pg_mcp/
│   ├── __init__.py
│   ├── main.py              # FastMCP Server 入口
│   ├── config.py            # 配置管理 (Pydantic Settings)
│   ├── constants.py         # 常量 (错误码、白名单)
│   ├── database/
│   │   ├── __init__.py
│   │   ├── pool.py          # 连接池管理
│   │   └── schema.py        # Schema 采集与缓存
│   ├── sql/
│   │   ├── __init__.py
│   │   ├── generator.py     # LLM 调用 & SQL 生成
│   │   ├── validator.py     # SQLGlot 安全校验
│   │   └── executor.py      # AIOODBC 执行
│   ├── models/
│   │   ├── __init__.py
│   │   ├── schema.py        # Schema 数据模型
│   │   ├── query.py         # 查询数据模型
│   │   └── config.py        # 配置数据模型
│   └── utils/
│       ├── __init__.py
│       ├── logger.py        # Structlog 配置
│       └── error.py         # 异常定义
├── tests/
│   ├── unit/
│   └── integration/
├── pyproject.toml
├── README.md
└── .env.example
```

### 关键约束

- 仅支持 SQL Server (通过 ODBC Driver 17)
- 仅支持 SELECT 查询，禁止任何写操作
- LLM 使用 DeepSeek-v4-flash（.env 配置），代码默认 glm-4.7 (OpenAI 兼容)
- Python 3.11+ 是最低要求
- 全程异步，禁止阻塞调用
- 所有公共接口必须有类型注解和 docstring
