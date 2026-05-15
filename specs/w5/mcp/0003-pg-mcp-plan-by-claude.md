# pg-mcp 实现计划

**文档编号**: 003-pg-mcp-plan-by-claude.md
**版本**: v2.2 (根据实际代码更新)
**日期**: 2026-05-15
**状态**: Draft
**关联文档**: 0002-pg-mcp-design-by-claude.md, 0001-mcp-req-prd-by-trea.md

---

## 1. 概述

本计划基于 [0002-pg-mcp-design-by-claude.md](0002-pg-mcp-design-by-claude.md) 设计文档，制定分阶段、可执行、可验证的实现计划。每个阶段包含明确的任务、输出物、验收标准和依赖关系。

### 1.1 计划目标

- **可执行**: 每个任务都有明确的输入、输出和验收标准
- **可验证**: 每个阶段完成后有对应的测试或验证手段
- **渐进式**: 按依赖关系分层推进，避免循环依赖
- **高质量**: 遵循 Python best practice、SOLID、DRY 原则

### 1.2 技术栈确认

| 组件 | 版本 | 用途 |
|------|------|------|
| Python | 3.11+ | 运行环境（需要 async/await 支持） |
| fastmcp | >=0.2.0 | MCP 框架 |
| aioodbc | >=0.5.0 | 异步 ODBC 连接驱动（SQL Server） |
| sqlglot | >=25.0.0 | SQL 解析和验证 |
| pydantic | >=2.0.0 | 数据验证 |
| pydantic-settings | >=2.0.0 | 配置管理 |
| openai | >=1.0.0 | LLM API 客户端 |
| structlog | >=24.0.0 | 结构化日志 |
| pytest | >=8.0 | 测试框架 |
| pytest-asyncio | >=0.24 | 异步测试支持 |

---

## 2. 项目初始化阶段

### Phase 1: 项目脚手架搭建

**优先级**: P0 (最高)
**任务数**: 1

| 序号 | 任务 | 输出 | 依赖 | 验收标准 |
|------|------|------|------|----------|
| P1-1 | 创建项目目录结构和初始文件 | 完整目录树 | 无 | 目录结构正确，所有 __init__.py 存在，pyproject.toml 可解析 |

#### P1-1 详细说明

**创建目录结构**:
```
pg-mcp/
├── pg_mcp/
│   ├── __init__.py
│   ├── main.py                 # FastMCP Server 入口
│   ├── config.py               # Pydantic 配置模型
│   ├── constants.py            # 常量定义（错误码、白名单等）
│   ├── database/
│   │   ├── __init__.py
│   │   ├── pool.py             # 连接池管理器
│   │   └── schema.py           # Schema 加载与缓存
│   ├── sql/
│   │   ├── __init__.py
│   │   ├── generator.py        # SQL 生成器（调用 LLM）
│   │   ├── validator.py        # SQL 验证器（SQLGlot）
│   │   └── executor.py         # SQL 执行器（aioodbc）
│   ├── models/
│   │   ├── __init__.py
│   │   ├── schema.py           # Schema 相关模型
│   │   ├── query.py            # 查询相关模型
│   │   └── config.py           # 配置相关模型（如需要）
│   ├── history/
│   │   ├── __init__.py
│   │   └── manager.py          # 历史记录管理器
│   └── utils/
│       ├── __init__.py
│       ├── logger.py           # 日志工具
│       ├── error.py            # 错误处理工具
│       └── llm.py              # LLM 调用工具（可选）
├── tests/
│   ├── __init__.py
│   ├── conftest.py             # 测试配置和 fixtures
│   ├── unit/
│   │   ├── __init__.py
│   │   ├── test_config.py
│   │   ├── test_schema.py
│   │   ├── test_validator.py
│   │   ├── test_generator.py
│   │   ├── test_executor.py
│   │   └── test_history.py
│   └── integration/
│       ├── __init__.py
│       ├── test_query.py
│       └── test_mcp.py
├── docs/
├── data/
│   └── history/                # 查询历史存储目录
├── .env.example                # 环境变量示例
├── .gitignore                  # Git 忽略配置
├── pyproject.toml              # 项目配置
└── requirements.txt            # 依赖列表（可选，pyproject.toml 优先）
```

**__init__.py 导出规范**:

每个模块的 `__init__.py` 应导出该模块的公开 API，便于外部导入：

```python
# pg_mcp/__init__.py
__version__ = "0.1.0"

# pg_mcp/models/__init__.py
from .schema import ColumnInfo, TableInfo, ViewInfo, DatabaseSchema, SchemaCache
from .query import QueryStatus, QueryHistory

# pg_mcp/database/__init__.py
from .pool import ConnectionPoolManager
from .schema import SchemaManager

# pg_mcp/sql/__init__.py
from .generator import SQLGenerator
from .validator import SQLValidator
from .executor import SQLExecutor

# pg_mcp/utils/__init__.py
from .logger import get_logger
from .error import MCPError

# pg_mcp/history/__init__.py
from .manager import HistoryManager
```

**关键注意事项**:
- `__init__.py` 避免循环导入（不要在顶层导入所有子模块）
- 使用 `__all__` 显式声明公开 API
- 测试目录下的 `__init__.py` 保持空文件即可

**pyproject.toml 内容**:
```toml
[project]
name = "pg-mcp"
version = "0.1.0"
description = "pg-mcp MCP Server - 自然语言转 T-SQL 查询服务"
requires-python = ">=3.11"
readme = "README.md"
license = {text = "MIT"}
dependencies = [
    "fastmcp>=0.2.0",
    "aioodbc>=0.5.0",
    "pyodbc>=5.0.0",
    "sqlglot>=25.0.0",
    "pydantic>=2.0.0",
    "pydantic-settings>=2.0.0",
    "openai>=1.0.0",
    "structlog>=24.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-asyncio>=0.24",
    "black>=24.0",
    "ruff>=0.6",
    "mypy>=1.0",
]

[project.scripts]
pg_mcp = "pg_mcp.main:main"

[build-system]
requires = ["setuptools>=68.0"]
build-backend = "setuptools.build_meta"

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]

[tool.ruff]
target-version = "py311"
line-length = 100

[tool.black]
line-length = 100
target-version = ["py311"]

[tool.mypy]
python_version = "3.11"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
disallow_incomplete_defs = true
check_untyped_defs = true
no_implicit_optional = true
warn_redundant_casts = true
warn_unused_ignores = true
warn_no_return = true
warn_unreachable = true
strict_equality = true
```

**.env.example 内容**:
```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=1433
DB_USERNAME=readonly_user
DB_PASSWORD=your_password
DB_DATABASE=app_db
DB_NAME=default

# LLM 配置
LLM_API_KEY=sk-your_deepseek_api_key
LLM_MODEL=deepseek-v4-flash
LLM_API_BASE=https://api.deepseek.com/v1
LLM_TEMPERATURE=0.1
LLM_MAX_TOKENS=1000
LLM_TIMEOUT=30

# 安全配置
SECURITY_MAX_QUERY_TIMEOUT=60
SECURITY_MAX_RESULT_ROWS=10000
SECURITY_ENABLE_SQL_VERIFICATION=true
SECURITY_ENABLE_RESULT_VERIFICATION=true
SECURITY_VERIFICATION_THRESHOLD=0.8

# 其他配置
LOG_LEVEL=INFO
SCHEMA_REFRESH_INTERVAL=
```

---

## 3. 基础设施层实现

### Phase 2: 配置与常量定义

**优先级**: P0
**任务数**: 3

| 序号 | 任务 | 输出文件 | 依赖 | 验收标准 |
|------|------|----------|------|----------|
| P2-1 | 定义错误码枚举 | `pg_mcp/constants.py` | P1-1 | ErrorCode 枚举包含所有设计文档定义的错误码，可被其他模块正确引用 |
| P2-2 | 实现配置模型 | `pg_mcp/config.py` | P1-1, P2-1 | Settings 类正确加载环境变量，build_databases validator 正确工作 |
| P2-3 | 实现日志工具 | `pg_mcp/utils/logger.py` | P1-1 | get_logger() 返回结构化日志实例，日志格式符合配置 |

#### P2-1 详细说明

**文件**: `pg_mcp/constants.py`

**实现内容**:
1. `ErrorCode` 枚举类，包含以下错误码：
   - 数据库相关: `DB_CONNECTION_ERROR`, `DB_POOL_ERROR`
   - SQL 相关: `SQL_SYNTAX_ERROR`, `SQL_OBJECT_NOT_FOUND`, `READ_ONLY_VIOLATION`
   - 查询相关: `QUERY_TIMEOUT`, `QUERY_EXECUTION_ERROR`
   - LLM 相关: `LLM_API_ERROR`, `LLM_TIMEOUT`
   - Schema 相关: `SCHEMA_LOAD_ERROR`, `SCHEMA_NOT_FOUND`
   - 通用错误: `INTERNAL_ERROR`, `INVALID_ARGUMENT`

2. `ALLOWED_QUERY_TYPES` 常量: `["SELECT", "EXPLAIN", "WITH"]`

3. `DANGEROUS_FUNCTIONS` 常量列表（供 validator 使用）:
   ```python
   DANGEROUS_FUNCTIONS = [
       "xp_cmdshell", "xp_delete_file", "xp_regread", "xp_regwrite",
       "xp_regdeletevalue", "xp_regdeletekey", "xp_grantlogin",
       "xp_enumgroups", "xp_loginconfig", "xp_logininfo",
       "xp_servicecontrol", "xp_terminate_process",
       "sp_configure", "sp_recompile", "sp_refreshsqlmodule",
       "sp_executesql", "openrowset", "opendatasource", "openquery",
       "bulk_insert", "fn_virtualfilestats", "fn_physloc",
   ]
   ```

#### P2-2 详细说明

**文件**: `pg_mcp/config.py`

**实现内容**:
1. `DatabaseConfig` BaseModel（纯数据模型，非 Settings）
   - 字段: name, host, port, username, password, database, min_pool_size, max_pool_size
   - 默认值: host="localhost", port=1433, min_pool_size=5, max_pool_size=20

2. `Settings` BaseSettings 类
   - 所有配置字段（平铺设计，避免嵌套 BaseSettings 冲突）
   - `model_config` 配置: env_file=".env", env_file_encoding="utf-8", env_nested_delimiter="__", extra="ignore"
   - `@model_validator(mode="after")` 方法 `build_databases()`: 从平铺字段构建 databases 列表
   - 数据库配置只在 db_username 和 db_password 都非空时创建

3. `LLMConfig` 运行时配置类
   - 从 Settings 实例派生
   - 字段: provider, api_key, model, api_base, temperature, max_tokens, timeout

4. `SecurityConfig` 运行时配置类
   - 从 Settings 实例派生
   - 字段: max_query_timeout, max_result_rows, allowed_query_types, enable_sql_verification, enable_result_verification, verification_threshold

5. `load_config()` 函数
   - 返回 Settings 实例

**关键注意事项**:
- 环境变量优先级: `.env` 文件 > 环境变量 > 默认值（pydantic-settings 自动处理）
- 密码等敏感字段使用 Pydantic 的 `SecretStr` 类型
- 多数据库配置支持：后续可通过扩展 `build_databases()` 支持环境变量列表

#### P2-3 详细说明

**文件**: `pg_mcp/utils/logger.py`

**实现内容**:
1. `get_logger(name: str) -> structlog.BoundLogger` 函数
2. 使用 `structlog` 配置:
   - 日志处理器: `logging.StreamHandler()` (stdout)
   - 处理器: `structlog.processors.TimeStamper(fmt="iso")`, `structlog.processors.add_log_level`, `structlog.processors.JSONRenderer()`
   - 日志级别: 从配置读取，默认 INFO
3. 不记录敏感信息（密码、API Key）
4. 提供结构化的日志上下文（request_id, user_id 等）

---

### Phase 9: 错误处理工具（提前实现）

**优先级**: P0
**任务数**: 1

| 序号 | 任务 | 输出文件 | 依赖 | 验收标准 |
|------|------|----------|------|----------|
| P9-1 | 实现错误处理工具 | `pg_mcp/utils/error.py` | P2-1 | MCPError 可正确抛出和捕获，to_dict() 输出格式正确 |

#### P9-1 详细说明

**文件**: `pg_mcp/utils/error.py`

**实现内容**:
1. `MCPError(Exception)` 自定义异常类
   - 构造函数: `__init__(self, code: ErrorCode, message: str, details: Optional[dict] = None, suggestion: Optional[str] = None)`
   - 属性: code, message, details, suggestion
   - 方法: `to_dict() -> dict` 返回 MCP 兼容的错误响应格式
   - `__str__()` 方法返回格式化的错误信息

2. 错误码到 MCP 错误类型的映射（如需要）

3. 错误处理工具函数:
   - `format_error(e: Exception) -> dict`: 将任意异常转换为 MCP 错误格式
   - `is_mcp_error(e: Exception) -> bool`: 判断是否为 MCPError

**关键注意事项**:
- MCPError 应在所有业务模块中统一使用，避免直接抛出原生 Exception
- to_dict() 输出格式需与 MCP 协议错误响应规范一致

## 4. 数据模型层实现

### Phase 3: Pydantic 数据模型

**优先级**: P1
**任务数**: 3

| 序号 | 任务 | 输出文件 | 依赖 | 验收标准 |
|------|------|----------|------|----------|
| P3-1 | 实现 Schema 数据模型 | `pg_mcp/models/schema.py` | P1-1 | 所有模型可正确实例化，字段验证正常 |
| P3-2 | 实现查询数据模型 | `pg_mcp/models/query.py` | P1-1 | QueryHistory 可正确序列化和反序列化 |
| P3-3 | 实现配置数据模型（可选） | `pg_mcp/models/config.py` | P2-2 | 如与 config.py 分离，确保一致性 |

#### P3-1 详细说明

**文件**: `pg_mcp/models/schema.py`

**实现内容**:
1. `ColumnInfo` BaseModel
   - 字段: name, type, nullable, default, comment, is_primary_key, is_foreign_key, foreign_key_to
   - 默认值: nullable=True, is_primary_key=False, is_foreign_key=False, default=None, comment=None, foreign_key_to=None

2. `TableInfo` BaseModel
   - 字段: name, schema_name, columns, indexes, comment, row_count_estimate
   - 默认值: schema_name="public", indexes=[], comment=None, row_count_estimate=None

3. `ViewInfo` BaseModel
   - 字段: name, schema_name, definition, columns, comment
   - 默认值: schema_name="public", comment=None

4. `DatabaseSchema` BaseModel
   - 字段: name, tables, views, loaded_at
   - 默认值: tables={}, views={}, loaded_at=datetime.now()
   - tables: Dict[str, TableInfo], views: Dict[str, ViewInfo]

5. `SchemaCache` BaseModel
   - 字段: databases, last_refresh
   - 默认值: databases={}, last_refresh=datetime.now()

**关键注意事项**:
- 使用 Pydantic V2 语法: `Field`, `model_config`, `Field(default_factory=...)`
- 时间戳字段使用 `datetime.now` 作为 default_factory
- 添加适当的类型约束和验证

#### P3-2 详细说明

**文件**: `pg_mcp/models/query.py`

**实现内容**:
1. `QueryStatus` 枚举类
   - 值: SUCCESS, FAILED, TIMEOUT, VERIFICATION_FAILED

2. `QueryHistory` BaseModel
   - 字段: id, timestamp, user_query, generated_sql, database, status, execution_time_ms, row_count, error_message, verification_score
   - 默认值: id 使用 timestamp 字符串, timestamp=datetime.now(), execution_time_ms=None, row_count=None, error_message=None, verification_score=None
   - **注意**: 使用 `timestamp` 而非 `created_at`（与设计文档保持一致）
   - 验证: verification_score 范围 [0, 1]

**关键注意事项**:
- id 生成: 使用时间戳字符串，确保唯一性
- status 字段使用枚举类型
- 添加 `model_config = ConfigDict(use_enum_values=True)` 确保序列化正确

---

## 5. 数据库层实现

### Phase 4: 连接池与 Schema 管理

**优先级**: P1
**任务数**: 2

| 序号 | 任务 | 输出文件 | 依赖 | 验收标准 |
|------|------|----------|------|----------|
| P4-1 | 实现连接池管理器 | `pg_mcp/database/pool.py` | P2-2, P3-1 | 连接池可正确初始化和关闭，acquire() 正确获取连接 |
| P4-2 | 实现 Schema 管理器 | `pg_mcp/database/schema.py` | P4-1, P3-1 | Schema 正确加载和缓存，表/列/视图信息完整 |

#### P4-1 详细说明

**文件**: `pg_mcp/database/pool.py`

**实现内容**:
1. `ConnectionPoolManager` 类
   - 构造函数: `__init__(self, db_configs: List[DatabaseConfig])`
   - 属性: `pools: Dict[str, aioodbc.Pool]`, `_configs: Dict[str, DatabaseConfig]`

2. `async initialize() -> None`
   - 遍历数据库配置，为每个数据库创建连接池
   - 使用 `aioodbc.create_pool()`:
     - `dsn=build_dsn(cfg)`, `minsize=cfg.min_pool_size`, `maxsize=cfg.max_pool_size`
   - 记录连接成功/失败日志
   - 失败时不抛出异常，记录错误日志，继续处理其他数据库

3. `async acquire(db_name: str) -> AsyncIterator[aioodbc.Connection]`
   - 异步上下文管理器
   - 验证 db_name 是否存在
   - 使用 `self.pools[db_name].acquire()` 获取连接
   - 自动释放连接回池

4. `async close() -> None`
   - 关闭所有连接池
   - 记录关闭日志

**关键注意事项**:
- 使用 `@asynccontextmanager` 装饰器实现 acquire()
- 连接池失败时优雅降级（记录日志，不阻断启动）
- 连接泄漏防护：严格使用上下文管理器

#### P4-2 详细说明

**文件**: `pg_mcp/database/schema.py`

**实现内容**:
1. `SchemaManager` 类
   - 构造函数: `__init__(self, pool_mgr: ConnectionPoolManager)`
   - 属性: `pool_mgr`, `_cache: Dict[str, DatabaseSchema]`, `_lock: asyncio.Lock`

2. `async load_all() -> None`
   - 遍历所有已连接的数据库
   - 调用 `load_schema()` 加载每个数据库的 Schema

3. `async load_schema(db_name: str) -> DatabaseSchema`
   - 从连接池获取连接
   - 调用 `_load_tables()` 和 `_load_views()`
   - 构建 `DatabaseSchema` 对象
   - 存储到 `_cache` 字典
   - 记录加载日志（表数量、视图数量）

4. `async _load_tables(conn: aioodbc.Connection) -> Dict[str, TableInfo]`
   - 执行复杂 JOIN 查询，一次性获取表、列、主键、外键信息
   - 使用 `information_schema.tables`, `information_schema.columns`, `information_schema.table_constraints`, `information_schema.key_column_usage`, `information_schema.constraint_column_usage`
   - 执行独立的列注释查询（使用 `pg_attribute.attnum` 避免 dropped columns 问题）
   - 构建 (table_name, column_name) -> comment 映射
   - 构建 TableInfo 对象字典

5. `async _load_views(conn: aioodbc.Connection) -> Dict[str, ViewInfo]`
   - 第一步：从 `information_schema.views` 获取视图定义
   - 第二步：从 `information_schema.columns` 获取视图列信息
   - 构建 ViewInfo 对象字典

6. `get_schema(db_name: str) -> DatabaseSchema`
   - 从缓存获取 Schema
   - 不存在时抛出 ValueError

7. `async refresh(db_name: Optional[str] = None) -> None`
   - 刷新指定数据库或所有数据库的 Schema
   - 使用 `_lock` 保护并发刷新

**关键注意事项**:
- 所有加载方法使用 `async with self._lock:` 保护并发安全
- 使用 `obj_description()` 获取表注释
- 使用 `col_description(c.oid, a.attnum)` 获取列注释
- 视图列信息使用 `ANY($1)` 参数化查询
- 只加载 `public` schema 的表和视图

---

## 6. SQL 处理层实现

### Phase 5: SQL 生成器

**优先级**: P1
**任务数**: 1

| 序号 | 任务 | 输出文件 | 依赖 | 验收标准 |
|------|------|----------|------|----------|
| P5-1 | 实现 SQL 生成器 | `pg_mcp/sql/generator.py` | P2-2, P3-1 | SQL 可正确生成，Markdown 清理正确，重试机制有效 |

#### P5-1 详细说明

**文件**: `pg_mcp/sql/generator.py`

**实现内容**:
1. `SQLGenerator` 类
   - 构造函数: `__init__(self, config: LLMConfig)`
   - 属性: `config`, `client: AsyncOpenAI`

2. `_format_schema(schema: DatabaseSchema, limit_tables: Optional[List[str]] = None) -> str`
   - 将 Schema 格式化为 LLM 可读文本
   - 包含表名、列名、类型、主键、NOT NULL 约束
   - 支持按表名过滤
   - 使用模板格式化

3. `async _call_llm(user_query: str, schema: DatabaseSchema, db_name: str) -> str`
   - 构建 system prompt: "你是一个专业的 SQL Server (T-SQL) SQL 生成助手。根据用户描述和提供的数据库 Schema，生成正确的 SQL Server 查询语句（T-SQL）。"
   - 构建 user prompt: 包含 Schema 信息、用户查询、生成要求
   - 调用 `self.client.chat.completions.create()`:
     - model: self.config.model
     - messages: system + user
     - temperature: self.config.temperature
     - max_tokens: self.config.max_tokens
   - 清理返回的 SQL:
     - 去除 Markdown 代码块包裹（```sql ... ```）
     - 去除末尾分号
     - 去除首尾空白

4. `async generate(user_query: str, schema: DatabaseSchema, db_name: str, max_retries: int = 3) -> str`
   - 调用 `_call_llm()` 生成 SQL
   - 实现重试机制（指数退避: 1s, 2s, 4s... 最大 10s）
   - 重试失败后抛出 MCPError(LLM_API_ERROR)

5. `async verify_result(user_query: str, sql: str, sample_rows: List[dict], db_name: str) -> float`
   - 构建验证 prompt
   - 调用 LLM 生成 0-1 一致性分数
   - 使用正则表达式提取分数
   - 限制分数范围 [0, 1]
   - 解析失败时返回默认值 0.5

**关键注意事项**:
- SQL 清理使用正则: `re.sub(r'^```(?:sql)?\s*', '', sql, flags=re.MULTILINE)` 和 `re.sub(r'\s*```$', '', sql, flags=re.MULTILINE)`
- 重试等待使用 `asyncio.sleep()`
- 日志记录生成和验证过程
- prompt 设计要明确要求只生成 SELECT 语句

---

### Phase 6: SQL 验证器

**优先级**: P1
**任务数**: 1

| 序号 | 任务 | 输出文件 | 依赖 | 验收标准 |
|------|------|----------|------|----------|
| P6-1 | 实现 SQL 验证器 | `pg_mcp/sql/validator.py` | P3-1, P4-2, P2-1 | 只读检查正确，危险函数检测有效，对象存在性验证准确 |

#### P6-1 详细说明

**文件**: `pg_mcp/sql/validator.py`

**实现内容**:
1. `SQLValidator` 类
   - 构造函数: `__init__(self, security_config: SecurityConfig, schema_mgr: SchemaManager)`
   - 属性: `config`, `schema_mgr`

2. `validate_read_only(sql: str) -> None`
   - 使用 `sqlglot.parse(sql, read="mssql")` 解析 SQL
   - 获取第一个语句类型
   - 检查是否为 `exp.Select` 或 `exp.Explain`
   - 非只读操作抛出 MCPError(READ_ONLY_VIOLATION)
   - 解析错误抛出 MCPError(SQL_SYNTAX_ERROR)

3. `validate_syntax_and_objects(sql: str, db_name: str) -> None`
   - 解析 SQL 为 AST
   - 使用 `walk()` 遍历 AST 节点
   - **关键**: `walk()` 返回 `(node, parent, key)` 元组，需正确解包
   - 查找所有 `exp.Table` 节点，验证表是否存在于 Schema 中
   - 查找所有 `exp.Column` 节点，验证列是否存在于对应表中
   - 使用 `_find_parent_table()` 确定列所属表

4. `_find_parent_table(col_node: exp.Column, referenced_tables: set) -> Optional[str]`
   - 检查列是否有明确的表前缀（`col_node.table`）
   - 如果只有一个引用表，默认是该表
   - 否则返回 None（无法确定）

5. `has_dangerous_functions(sql: str) -> Optional[str]`
   - 遍历 `DANGEROUS_FUNCTIONS` 常量列表
   - 使用大小写不匹配的字符串搜索: `f"{func}(" in sql_lower`
   - 返回第一个匹配的危险函数名，或 None

6. `explain_for_validation(sql: str) -> dict`
   - 构建 `EXPLAIN {sql}` 语句
   - 使用 SQLGlot 解析验证
   - 返回 `{"executable": True/False, "plan"/"error": ...}`

**关键注意事项**:
- SQLGlot `walk()` API 返回三元组 `(node, parent, key)`，不是单个节点
- `exp.Table.name` 获取表名
- `exp.Column.name` 获取列名，`exp.Column.table` 获取表前缀
- 危险函数检测使用大小写不敏感匹配
- 所有验证失败时抛出对应的 MCPError

---

### Phase 7: SQL 执行器

**优先级**: P1
**任务数**: 1

| 序号 | 任务 | 输出文件 | 依赖 | 验收标准 |
|------|------|----------|------|----------|
| P7-1 | 实现 SQL 执行器 | `pg_mcp/sql/executor.py` | P4-1, P2-1 | 分页查询正确，参数化查询防止注入，超时处理正确 |

#### P7-1 详细说明

**文件**: `pg_mcp/sql/executor.py`

**实现内容**:
1. `SQLExecutor` 类
   - 构造函数: `__init__(self, pool_mgr: ConnectionPoolManager, security_config: SecurityConfig)`
   - 属性: `pool_mgr`, `config`

2. `async execute(sql: str, db_name: str, page: int = 1, page_size: int = 100) -> Dict[str, Any]`
   - 清理 SQL: `sql.rstrip().rstrip(";").strip()`
   - 验证必须是 SELECT 语句（大小写不敏感检查）
   - 计算 offset: `(page - 1) * page_size`
   - 限制 limit: `min(page_size, self.config.max_result_rows)`
   - 使用参数化查询构建分页 SQL: `OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`
   - 执行查询: 通过 `cursor.execute()` + `cursor.fetchall()` + `cursor.description`
   - 执行总行数查询: `SELECT COUNT(*) FROM ({clean_sql}) AS subquery`
   - 返回结果字典:
     ```python
     {
         "rows": [dict(r) for r in rows],
         "total_count": total_count,
         "page": page,
         "page_size": page_size,
         "total_pages": (total_count + page_size - 1) // page_size
     }
     ```

3. 异常处理:
   - `Exception`: 抛出 MCPError(QUERY_EXECUTION_ERROR)
   - 其他异常: 抛出 MCPError(INTERNAL_ERROR)

**关键注意事项**:
- **SQL 注入防护**: 使用参数化查询（`$1`, `$2`）而非字符串拼接
- **禁止包装用户 SQL**: 不使用 CTE 或其他方式包装用户 SQL
- **分页边界处理**: page < 1 时抛出 INVALID_ARGUMENT
- **结果行限制**: 确保返回行数不超过 max_result_rows
- **超时控制**: 通过查询超时配置 `SECURITY_MAX_QUERY_TIMEOUT` 控制

---

## 7. 历史管理层实现

### Phase 8: 查询历史管理

**优先级**: P2
**任务数**: 1

| 序号 | 任务 | 输出文件 | 依赖 | 验收标准 |
|------|------|----------|------|----------|
| P8-1 | 实现历史记录管理器 | `pg_mcp/history/manager.py` | P3-2 | 查询历史可正确写入和读取，并发写入安全 |

#### P8-1 详细说明

**文件**: `pg_mcp/history/manager.py`

**实现内容**:
1. `HistoryManager` 类
   - 构造函数: `__init__(self, history_dir: str = "data/history")`
   - 属性: `_history_dir`, `_file_path`, `_lock: asyncio.Lock`, `_max_retention_days`, `_max_records_per_user`

2. `record(user_query: str, generated_sql: str, database: str, status: QueryStatus, row_count: int = 0, error_message: Optional[str] = None, verification_score: Optional[float] = None) -> None`
   - 构建 QueryHistory 对象
   - 序列化并追加到 JSON Lines 文件
   - **注意**: 使用同步文件写入（record 在同步上下文中调用）
   - **注意**: QueryHistory 的 `user_query` 字段（不是 `query`）
   - **注意**: QueryHistory 的 `timestamp` 字段（不是 `created_at`）

3. `async get_by_user(user_id: str = "default", limit: int = 100) -> List[QueryHistory]`
   - 读取 JSON Lines 文件
   - 解析每行为 QueryHistory 对象
   - 按时间倒序排序
   - 返回最近 N 条记录
   - 使用 `asyncio.to_thread()` 避免阻塞事件循环

4. `async get_recent(limit: int = 50) -> List[QueryHistory]`
   - 调用 `get_by_user("all", limit=limit)`

5. `async cleanup() -> None`
   - 清理过期记录（超过 _max_retention_days）
   - 使用 `_lock` 保护并发操作
   - 读取、过滤、写回有效记录

**关键注意事项**:
- 字段名一致性: QueryHistory 使用 `user_query` 和 `timestamp`
- JSON Lines 格式: 每行一个 JSON 对象
- 并发写入保护: 使用 asyncio.Lock（如需要异步写入）
- 损坏行处理: 跳过解析失败的行
- 文件不存在时返回空列表
- **record() 同步写入**: 当前设计使用同步文件写入（因为 record 在 Tool 的同步异常处理中调用）。高并发场景下可考虑改用 `aiofiles` 异步写入或消息队列缓冲
- **文件轮转**: 当文件超过一定大小时（如 10MB），可考虑自动轮转到归档文件

---

## 8. MCP Server 整合实现

### Phase 10: MCP Server 入口

**优先级**: P0
**任务数**: 2

| 序号 | 任务 | 输出文件 | 依赖 | 验收标准 |
|------|------|----------|------|----------|
| P10-1 | 实现 MCP Server 主入口和 Tools | `pg_mcp/main.py` | P4-1, P4-2, P5-1, P6-1, P7-1, P8-1, P9-1 | 所有 Tools 可正确注册和调用，生命周期管理正常 |
| P10-2 | 实现 MCP Resources 和启动入口 | `pg_mcp/main.py` | P10-1 | Resources 可正确访问，服务可正常启动 |

#### P10-1 详细说明

**文件**: `pg_mcp/main.py`

**实现内容**:
1. 创建 FastMCP 实例: `mcp = FastMCP(name="pg-mcp", version="0.1.0")`

2. 全局组件变量: config, pool_mgr, schema_mgr, sql_gen, sql_validator, sql_executor, history_mgr

3. `@asynccontextmanager async def lifespan()`:
   - 加载配置: `config = load_config()`
   - 验证数据库配置: 无配置时抛出 RuntimeError
   - 初始化连接池: `await pool_mgr.initialize()`
   - 加载 Schema: `await schema_mgr.load_all()`
   - 初始化业务组件: sql_gen, sql_validator, sql_executor, history_mgr
   - yield 后清理: `await pool_mgr.close()`

4. `_ensure_initialized()` 函数:
   - 验证组件已初始化
   - 未初始化时抛出 MCPError(INTERNAL_ERROR)

5. **Tools 实现**:

   a. `@mcp.tool() async def query_database(query: str, database: Optional[str] = None, page: int = 1, page_size: int = 100, verify_result: bool = True) -> dict`
      - 参数验证: page >= 1, page_size 1-1000
      - 确定目标数据库
      - 生成 SQL
      - 验证 SQL: 危险函数检测 -> 只读检查 -> 语法和对象验证
      - 执行 SQL
      - 验证结果（可选）
      - 记录历史
      - 返回结果

   b. `@mcp.tool() async def generate_sql(query: str, database: Optional[str] = None) -> dict`
      - 生成 SQL 但不执行
      - 进行安全验证
      - 返回 SQL 和安全检查结果

   c. `@mcp.tool() async def list_databases() -> List[dict]`
      - 返回配置的数据库列表

   d. `@mcp.tool() async def get_schema(database: str, table: Optional[str] = None) -> dict`
      - 返回指定数据库或表的 Schema 信息

   e. `@mcp.tool() async def refresh_schema(database: Optional[str] = None) -> dict`
      - 刷新 Schema 缓存

   f. `@mcp.tool() async def health_check() -> dict`
      - 检查所有数据库连接状态
      - 返回健康状态

#### P10-2 详细说明

**Resources 实现**:
1. `@mcp.resource("schema://{database_name}")`
   - 返回数据库 Schema 的 JSON 表示

2. `@mcp.resource("history://{user_id}")`
   - 返回用户查询历史的 JSON Lines 表示

**启动入口**:
```python
def main():
    """主入口函数"""
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "dev":
        mcp.run(transport="stdio")
    else:
        mcp.run()

if __name__ == "__main__":
    main()
```

**关键注意事项**:
- 所有 Tool 使用 `_ensure_initialized()` 检查初始化状态
- 错误处理: 捕获 MCPError 并转换为适当的 MCP 错误响应
- 查询历史在成功和失败时都要记录
- lifespan 确保资源正确初始化和清理

---

## 9. 测试实现

### Phase 11: 单元测试

**优先级**: P2
**任务数**: 6

| 序号 | 任务 | 输出文件 | 依赖 | 验收标准 |
|------|------|----------|------|----------|
| P11-1 | 配置测试模型单元测试 | `tests/unit/test_config.py` | P2-2 | 环境变量加载、默认值、validator 测试覆盖 |
| P11-2 | Schema 管理器单元测试 | `tests/unit/test_schema.py` | P4-2 | 表/列加载、视图加载、缓存操作测试覆盖 |
| P11-3 | SQL 验证器单元测试 | `tests/unit/test_validator.py` | P6-1 | 只读检查、危险函数检测、对象存在性测试覆盖 |
| P11-4 | SQL 生成器单元测试 | `tests/unit/test_generator.py` | P5-1 | SQL 生成重试、Markdown 清理、结果验证测试覆盖 |
| P11-5 | SQL 执行器单元测试 | `tests/unit/test_executor.py` | P7-1 | 分页查询、超时处理、SQL 清理测试覆盖 |
| P11-6 | 历史记录管理器单元测试 | `tests/unit/test_history.py` | P8-1 | 写入/读取/清理测试覆盖 |

#### 测试框架配置

**文件**: `tests/conftest.py`

**实现内容**:
1. LLM Mock fixture:
   ```python
   @pytest.fixture
   def mock_llm_response():
       with patch("openai.AsyncOpenAI") as MockClient:
           mock_completion = AsyncMock()
           mock_completion.choices = [
               AsyncMock(message=AsyncMock(content="SELECT * FROM users;"))
           ]
           MockClient.return_value.chat.completions.create = AsyncMock(
               return_value=mock_completion
           )
           yield MockClient
   ```

2. 数据库连接 Mock fixture:
   ```python
   @pytest.fixture
   def mock_aioodbc_connection():
       conn = AsyncMock()
       conn.fetch = AsyncMock(return_value=[])
       conn.fetchval = AsyncMock(return_value=0)
       yield conn
   ```

3. 临时目录 fixture（用于历史文件测试）

4. 测试配置 fixture（使用环境变量覆盖）

#### 测试策略

- **单元测试**: 使用 mock 隔离外部依赖
- **覆盖目标**: 正常路径 + 异常路径 + 边界条件
- **异步测试**: 使用 `pytest-asyncio` 的 `asyncio_mode = "auto"`
- **测试命名**: `test_<function_name>_<scenario>`

---

### Phase 12: 集成测试

**优先级**: P3
**任务数**: 2

| 序号 | 任务 | 输出文件 | 依赖 | 验收标准 |
|------|------|----------|------|----------|
| P12-1 | 端到端查询测试 | `tests/integration/test_query.py` | P11-1 ~ P11-6 | 完整查询流程测试通过 |
| P12-2 | MCP 协议集成测试 | `tests/integration/test_mcp.py` | P10-1, P10-2 | MCP 客户端与服务端通信测试通过 |

#### P12-1 详细说明

- 需要真实的 SQL Server 数据库实例（可使用 Docker 容器）
```
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourPassword123!" -p 1433:1433 -d mcr.microsoft.com/mssql/server:2022-latest
```
- 测试完整的查询流程: 自然语言 -> SQL 生成 -> 验证 -> 执行 -> 返回
- 测试不同场景: 简单查询、聚合查询、多表 JOIN、错误处理

#### P12-2 详细说明

- 使用 FastMCP 的测试客户端
- 测试 Tool 调用和响应格式
- 测试 Resource 访问
- 测试错误处理和状态码

---

## 10. 文档与部署

### Phase 13: 文档编写

**优先级**: P2
**任务数**: 2

| 序号 | 任务 | 输出 | 依赖 | 验收标准 |
|------|------|------|------|----------|
| P13-1 | 编写 README.md | `README.md` | P10-1 | 安装、配置、使用指南完整 |
| P13-2 | 编写 CLAUDE.md | `CLAUDE.md` | P10-1 | 代码规范、架构说明、开发流程清晰 |

#### P13-1 详细说明

- 项目简介和功能说明
- 安装指南（pip install、源码安装）
- 配置说明（环境变量、.env 文件）
- 使用指南（启动、调用示例）
- API 文档（Tools 列表和参数说明）
- 开发指南（本地开发、测试、贡献）

#### P13-2 详细说明

- 代码规范要求: Python best practice、SOLID、DRY
- 架构说明: 分层架构、模块职责
- 开发流程: 新功能开发步骤
- 测试要求: 单元测试覆盖率目标、测试编写规范
- 代码审查标准

### Phase 14: 部署准备

**优先级**: P3
**任务数**: 2

| 序号 | 任务 | 输出 | 依赖 | 验收标准 |
|------|------|------|------|----------|
| P14-1 | Docker 容器化 | `Dockerfile`, `docker-compose.yml` | P10-1 | 容器可正常构建和运行 |
| P14-2 | CI/CD 配置 | `.github/workflows/ci.yml` | P11-1 ~ P11-6 | CI 流程可自动执行测试和 lint |

#### P14-1 详细说明

- 基于 Python 3.11 slim 镜像
- 安装依赖、复制代码、设置环境变量
- 健康检查配置
- docker-compose.yml 包含 SQL Server 服务

#### P14-2 详细说明

- CI 流程: lint -> test -> build
- 使用 GitHub Actions 或等价工具
- 触发条件: push、pull request

---

## 11. 实现依赖图

```
Phase 1 (项目脚手架)
    │
    ├── Phase 2 (配置与常量) ── Phase 9 (错误处理)
    │       │
    │       ├── Phase 3 (数据模型)
    │       │       │
    │       │       ├── Phase 4 (数据库层)
    │       │       │       │
    │       │       │       ├── Phase 5 (SQL 生成器) ──┐
    │       │       │       ├── Phase 6 (SQL 验证器) ──┤
    │       │       │       ├── Phase 7 (SQL 执行器) ──┤
    │       │       │       └── Phase 8 (历史管理)     ─┤
    │       │       │                                  │
    │       │       └──────────────────────────────────┤
    │       │                                          │
    └──────────────────────────────────────────────────┤
                                                       │
                                   Phase 10 (MCP Server 整合)
                                                       │
                        ┌──────────────────────────────┤
                        │                              │
                    Phase 11 (单元测试)              Phase 13 (文档)
                        │                              │
                    Phase 12 (集成测试)              Phase 14 (部署)
```

---

## 12. 实现顺序建议

### 推荐顺序（串行）

```
1.  P1-1   项目脚手架
2.  P2-1   错误码定义
3.  P2-2   配置模型
4.  P2-3   日志工具
5.  P9-1   错误处理工具
6.  P3-1   Schema 数据模型
7.  P3-2   查询数据模型
8.  P4-1   连接池管理器
9.  P4-2   Schema 管理器
10. P5-1   SQL 生成器
11. P6-1   SQL 验证器
12. P7-1   SQL 执行器
13. P8-1   历史记录管理器
14. P10-1  MCP Server 主入口和 Tools
15. P10-2  MCP Resources 和启动入口
16. P11-1  配置测试
17. P11-2  Schema 管理器测试
18. P11-3  SQL 验证器测试
19. P11-4  SQL 生成器测试
20. P11-5  SQL 执行器测试
21. P11-6  历史记录管理器测试
22. P12-1  端到端查询测试
23. P12-2  MCP 协议集成测试
24. P13-1  README.md
25. P13-2  CLAUDE.md
26. P14-1  Docker 容器化
27. P14-2  CI/CD 配置
```

---

## 13. 关键风险与缓解

| 风险 | 影响 | 缓解措施 | 负责人 |
|------|------|----------|--------|
| FastMCP API 变化 | 可能导致代码不兼容 | 锁定版本号，关注上游更新，编写集成测试 | 架构师 |
| LLM 生成 SQL 质量 | 可能生成无效 SQL | 多层验证 + 重试机制 + 结果验证 | 架构师 |
| 大量表的 Schema 加载 | 启动时间过长 | 懒加载或增量加载，限制加载范围 | 架构师 |
| 连接池泄漏 | 数据库资源耗尽 | 严格使用上下文管理器，添加监控 | 架构师 |
| SQLGlot walk() API 变化 | 验证逻辑失效 | 编写单元测试覆盖 walk() 用法 | 测试 |
| SQL 注入漏洞 | 安全风险 | 参数化查询 + 只读用户 + 白名单验证 | 架构师 |
| 并发写入冲突 | 历史记录丢失 | 使用 asyncio.Lock 保护，JSON Lines 追加模式 | 开发 |
| 字段名不一致 | 序列化错误 | 统一使用 design doc 定义的字段名，编写测试验证 | 开发 |

---

## 14. 设计文档待确认项处理计划

| 问题 | 处理方式 | 实现阶段 |
|------|---------|----------|
| Q1: Schema 自动刷新间隔 | 默认不自动刷新（None），可通过环境变量配置 | Phase 2 (配置) |
| Q2: 查询历史存储方式 | 当前使用 JSON Lines 文件，预留数据库扩展接口 | Phase 8 (历史管理) |
| Q3: 结果验证降级策略 | 验证失败仅记录日志和评分，不阻断返回 | Phase 10 (MCP Server) |
| Q4: 是否支持跨库查询 | 当前不支持，预留接口扩展 | Phase 10 (MCP Server) |
| Q5: LLM Prompt 优化 | 根据实际使用情况迭代优化 | 后续迭代 |

---

## 16. 架构设计决策

本节记录实现过程中的关键架构决策及其理由，供后续开发和维护参考。

### 16.1 配置管理：平铺字段 vs 嵌套模型

**决策**: 使用平铺字段设计 `Settings`，而非嵌套的 `BaseSettings`

**理由**:
- `pydantic-settings` 对嵌套 `BaseSettings` 的环境变量解析有已知限制（env_prefix 冲突）
- 平铺设计更简单，环境变量名直观（如 `DB_HOST` 而非 `DATABASES__0__HOST`）
- 通过 `@model_validator` 手动构建复合配置，保持灵活性

**权衡**: 多数据库配置需要通过扩展 validator 实现，不如嵌套模型直接

### 16.2 SQL 验证：三层防护策略

**决策**: 采用危险函数检测 + 只读检查 + 语法/对象验证的三层防护

**理由**:
1. **危险函数检测**（最快）: 字符串匹配，O(n) 复杂度，立即拦截已知危险操作
2. **只读检查**（AST 级别）: 使用 SQLGlot 解析 SQL AST，确保只允许 SELECT/EXPLAIN
3. **语法和对象验证**（最精确）: 结合 Schema 缓存，验证表和列是否存在

**权衡**: 三层验证增加延迟，但安全性至关重要

### 16.3 Schema 加载：启动时全量加载 vs 懒加载

**决策**: 启动时全量加载所有数据库 Schema 到内存

**理由**:
- 简化实现，避免运行时加载的复杂性
- Schema 通常不会频繁变化，内存缓存足够
- 可通过定时刷新或手动刷新更新

**风险**: 大型数据库（1000+ 表）可能导致启动时间过长

**后续优化**: 如遇到启动性能问题，可改为懒加载（按需加载表信息）

### 16.4 SQL 执行：参数化分页 vs CTE 包装

**决策**: 使用 SQL Server 原生分页语法（`OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`）

**理由**:
- **性能**: 数据库原生支持的分页语法效率最高
- **安全性**: 参数化查询中，分页参数不会作为 SQL 的一部分注入
- **标准性**: SQL Server 2012+ 标准分页语法

**风险**: 用户 SQL 如果已包含 TOP/LIMIT/OFFSET，会导致语法错误
**处理**: 使用 SQLGlot AST 检测已有 LIMIT/TOP 子句，避免重复分页

### 16.5 历史记录：JSON Lines vs 数据库存储

**决策**: 使用 JSON Lines 文件存储查询历史

**理由**:
- 零依赖，无需额外数据库
- 追加写入性能好
- 便于调试和审计（文本文件可读）

**权衡**: 不适合大规模查询历史，缺乏高级查询能力
**后续优化**: 如需要高级查询能力，可迁移到 SQLite 或直接查询 JSON 文件

### 16.6 LLM 调用：直接 OpenAI SDK vs 封装层

**决策**: 直接使用 OpenAI SDK 调用 DeepSeek-v4-flash API

**理由**:
- DeepSeek-v4-flash 兼容 OpenAI API 格式，SDK 成熟稳定
- 代码默认使用 glm-4.7（智谱AI），可通过 .env 切换为 deepseek-v4-flash
- 简化配置，减少抽象层次
- SDK 自带重试、超时、连接池等功能

### 16.7 全局变量 vs 依赖注入

**决策**: 使用全局变量存储组件实例（在 lifespan 中初始化）

**理由**:
- FastMCP 的 Tool 装饰器不支持依赖注入
- 全局变量在单进程场景下是安全的
- 简化实现，避免复杂的组件传递

**风险**: 不利于测试（需要 mock 全局变量）
**缓解**: 测试时使用 fixture 覆盖全局变量

---

## 17. 验收标准总结

### 整体验收标准

- [ ] 所有模块可正常导入，无循环依赖
- [ ] 配置可正确加载，环境变量优先级正确
- [ ] 连接池可正常初始化和关闭
- [ ] Schema 可正确加载和缓存
- [ ] SQL 生成可正常工作，重试机制有效
- [ ] SQL 验证可拦截非只读和危险操作
- [ ] SQL 执行可正确分页，参数化查询防止注入
- [ ] 历史记录可正确写入和读取
- [ ] 所有 MCP Tools 可正常调用
- [ ] 单元测试覆盖率达到 80% 以上
- [ ] 集成测试覆盖完整查询流程
- [ ] 服务可正常启动和运行

---

**变更记录**

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|---------|------|
| v1.0 | 2026-05-15 | 初始实现计划 | AI Assistant |
| v2.0 | 2026-05-15 | 全面重构：增加验收标准、详细实现说明、字段一致性修正、测试策略完善、风险缓解补充 | AI Assistant |
