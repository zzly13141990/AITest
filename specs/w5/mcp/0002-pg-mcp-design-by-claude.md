# pg-mcp 系统设计文档

**文档编号**: 0002-pg-mcp-design-by-claude.md
**版本**: v1.3 (根据实际代码更新)
**日期**: 2026-05-15
**状态**: Approved
**关联文档**: 0001-mcp-req-prd-by-trea.md, 0002-pg-mcp-design-review-claude.md, 0003-pg-mcp-plan-by-claude.md

---

## 0. 变更记录

| 版本 | 日期 | 变更内容 | 关联问题 |
|------|------|---------|----------|
| v1.0 | 2026-05-14 | 初始设计文档 | - |
| v1.1 | 2026-05-14 | 初步修复（SQL 注入、walk API 误用、explain 解析等） | - |
| v1.2 | 2026-05-15 | Codex Review 全面修复：C-01~C-05, W-01~W-07, S-01~S-08 | 0002-pg-mcp-design-review-claude.md |

---

## 1. 系统概述

### 1.1 设计目标

构建一个基于 MCP (Model Context Protocol) 的 SQL Server 数据库查询服务，允许用户通过自然语言描述查询需求，服务端自动生成并执行 T-SQL 语句。

### 1.2 技术选型

| 技术组件 | 选型 | 理由 |
|---------|------|------|
| MCP 框架 | FastMCP | Anthropic 官方提供，简化 MCP Server 开发，自动处理协议细节 |
| 数据库驱动 | aioodbc + pyodbc | 异步 ODBC 连接池，兼容 SQL Server，支持异步查询 |
| SQL 处理 | SQLGlot | 纯 Python SQL 解析器，支持 T-SQL 方言 (read="mssql") |
| 数据验证 | Pydantic V2 | 类型安全的数据验证和设置管理，与 FastMCP 集成良好 |
| LLM 客户端 | OpenAI SDK | DeepSeek-v4-flash 兼容 OpenAI API（代码默认 glm-4.7，.env 配置 deepseek），使用成熟 SDK |

### 1.3 设计原则

1. **类型安全**：使用 Pydantic 模型定义所有数据结构，编译时类型检查
2. **异步优先**：全程异步设计，充分利用 aioodbc 的异步特性，避免阻塞
3. **可扩展性**：模块化设计，便于添加新的数据库后端或 LLM provider
4. **安全第一**：白名单机制限制 SQL 操作类型，防止数据误删改
5. **性能优化**：Schema 缓存 + 连接池 + 批量操作

---

## 2. 架构设计

### 2.1 系统架构图

```
┌──────────────────────────────────────────────────────────────┐
│                        MCP Client                            │
└──────────────────────────┬───────────────────────────────────┘
                           │ MCP Protocol (JSON-RPC 2.0)
                           │
┌──────────────────────────┴───────────────────────────────────┐
│                       FastMCP Server                         │
│  ┌──────────────┐ ┌──────────────┐ ┌───────────────────┐     │
│  │ Tools Layer  │ │  Resources   │ │  Error Handler    │     │
│  │              │ │              │ │                   │     │
│  │ - query_db   │ │ - schema://  │ │ - 分类与转换       │     │
│  │ - generate_  │ │ - history:// │ │ - 格式化输出       │     │
│  │   sql        │ │              │ │                   │     │
│  │ - list_dbs   │ └──────────────┘ └───────────────────┘     │
│  │ - get_schema │                                            │
│  │ - refresh_   │                                            │
│  │   schema     │                                            │
│  └──────┬───────┘                                            │
│         │                                                    │
└─────────┼────────────────────────────────────────────────────┘
          │
┌─────────┴────────────────────────────────────────────────────┐
│                      Application Layer                        │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐    │
│  │ SQL Generator  │ │ SQL Validator  │ │ SQL Executor   │    │
│  │ (LLM:DeepSeek) │ │ (SQLGlot)      │ │ (aioodbc)      │    │
│  └───────┬────────┘ └───────┬────────┘ └───────┬────────┘    │
│          │                  │                  │             │
│  ┌───────┴────────┐ ┌──────┴───────┐ ┌───────┴────────┐     │
│  │Result Verifier │ │Schema Manager│ │Query History   │     │
│  │(LLM Verify)    │ │(Cache+Lock)  │ │(JSONL Storage) │     │
│  └────────────────┘ └──────────────┘ └────────────────┘     │
└──────────────────────────────────────────────────────────────┘
          │
┌─────────┴────────────────────────────────────────────────────┐
│                     Infrastructure Layer                      │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐    │
│  │ Config Manager │ │ Connection Pool│ │ Logger         │    │
│  │ (Pydantic)     │ │ (aioodbc Pool) │ │ (Structlog)    │    │
│  └────────────────┘ └────────────────┘ └────────────────┘    │
└──────────────────────────────────────────────────────────────┘
          │
┌─────────┴────────────────────────────────────────────────────┐
│                      External Services                        │
│  ┌────────────────┐ ┌────────────────┐                       │
│  │ DeepSeek API   │ │ SQL Server DB  │                       │
│  │ (deepseek.com) │ │ (Multiple)     │                       │
│  └────────────────┘ └────────────────┘                       │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 目录结构

```
pg-mcp/
├── pg_mcp/
│   ├── __init__.py
│   ├── main.py                 # FastMCP Server 入口
│   ├── config.py               # Pydantic 配置模型
│   ├── constants.py            # 常量定义（错误码、白名单等）
│   │
│   ├── database/               # 数据库相关模块
│   │   ├── __init__.py
│   │   ├── pool.py             # 连接池管理器
│   │   └── schema.py           # Schema 加载与缓存
│   │
│   ├── sql/                    # SQL 处理模块
│   │   ├── __init__.py
│   │   ├── generator.py        # SQL 生成器（调用 LLM）
│   │   ├── validator.py        # SQL 验证器（SQLGlot）
│   │   └── executor.py         # SQL 执行器（aioodbc）
│   │
│   ├── models/                 # Pydantic 数据模型
│   │   ├── __init__.py
│   │   ├── schema.py           # Schema 相关模型
│   │   ├── query.py            # 查询相关模型
│   │   └── config.py           # 配置相关模型
│   │
│   ├── history/                # 查询历史模块
│   │   ├── __init__.py
│   │   └── manager.py          # 历史记录管理器
│   │
│   └── utils/                  # 工具模块
│       ├── __init__.py
│       ├── logger.py           # 日志工具
│       ├── error.py            # 错误处理工具
│       └── llm.py              # LLM 调用工具
│
└── .env.example                # 环境变量示例
```

> **注意**: 配置通过 `.env` 文件或环境变量管理，不再需要 YAML 配置文件。
> 项目根目录下还包含：`tests/`（测试）、`docs/`（文档）、`pyproject.toml`（项目配置）、`requirements.txt`（依赖）、`README.md`。

### 2.3 核心组件说明

| 组件 | 职责 | 技术实现 |
|------|------|---------|
| FastMCP Server | MCP 协议处理、Tool/Resource 注册 | `@mcp.tool()` 装饰器 |
| Connection Pool | 多数据库连接池生命周期管理 | `aioodbc.create_pool()` |
| Schema Manager | Schema 加载、缓存、刷新 | 内存缓存 + TTL 过期 |
| SQL Generator | 自然语言 → T-SQL | DeepSeek-v4-flash API (.env 配置) |
| SQL Validator | 语法验证、只读检查、表/列存在性 | SQLGlot AST 遍历 (read="mssql") |
| SQL Executor | SQL 执行、结果格式化 | aioodbc/pyodbc 游标操作 |
| Result Verifier | 结果意义性验证 | LLM API |
| Query History | 查询记录持久化 | JSON Lines 文件存储 |
| Config Manager | 配置加载、验证、环境变量 | Pydantic Settings |

---

## 3. 数据模型

### 3.1 Schema 数据结构

```python
# pg_mcp/models/schema.py

from pydantic import BaseModel, Field
from typing import Any, Dict

class ColumnInfo(BaseModel):
    """列信息"""
    name: str
    data_type: str
    is_nullable: bool = True
    column_default: str | None = None
    ordinal_position: int = 1
    character_maximum_length: int | None = None
    is_primary_key: bool = False
    comment: str | None = None

class TableInfo(BaseModel):
    """表信息"""
    name: str
    table_schema: str = Field(default="dbo", alias="schema")
    columns: list[ColumnInfo] = Field(default_factory=list)
    primary_key: list[str] = Field(default_factory=list)
    foreign_keys: list[dict[str, Any]] = Field(default_factory=list)
    comment: str | None = None
    row_estimate: int | None = None

    @property
    def qualified_name(self) -> str:
        if self.table_schema == "dbo":
            return self.name
        return f"{self.table_schema}.{self.name}"

class ViewInfo(BaseModel):
    """视图信息"""
    name: str
    view_schema: str = Field(default="dbo", alias="schema")
    definition: str = ""
    comment: str | None = None

    @property
    def qualified_name(self) -> str:
        if self.view_schema == "dbo":
            return self.name
        return f"{self.view_schema}.{self.name}"

class DatabaseSchema(BaseModel):
    """数据库完整 Schema"""
    database: str
    tables: dict[str, TableInfo] = Field(default_factory=dict)
    views: dict[str, ViewInfo] = Field(default_factory=dict)

    def get_table(self, table_name: str) -> TableInfo | None:
        return self.tables.get(table_name)

    def get_view(self, view_name: str) -> ViewInfo | None:
        return self.views.get(view_name)

    def get_all_names(self) -> list[str]:
        return list(self.tables.keys()) + list(self.views.keys())

    def to_prompt_text(self) -> str:
        """转换为 LLM 可读的 Schema 描述文本"""
        ...

class SchemaCache:
    """Schema 缓存管理器，TTL + 时间戳"""
    def __init__(self, ttl_seconds: int = 300) -> None: ...
    def get(self, key: str) -> DatabaseSchema | None: ...
    def set(self, key: str, schema: DatabaseSchema) -> None: ...
    def invalidate(self, key: str) -> None: ...
    def invalidate_all(self) -> None: ...
```

### 3.2 配置模型

```python
# pg_mcp/config.py

from pydantic import BaseModel, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class DatabaseConfig(BaseModel):
    """单个数据库连接配置"""
    name: str = "default"
    host: str = "localhost"
    port: int = 1433
    username: str = "sa"
    password: SecretStr = SecretStr("")
    database: str = "app_db"
    min_pool_size: int = 1
    max_pool_size: int = 10

class Settings(BaseSettings):
    """全局应用配置，从环境变量/.env 文件加载"""
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
    db_name: str = "default"

    # LLM 配置
    llm_api_key: SecretStr = SecretStr("")
    llm_model: str = "glm-4.7"  # 代码默认值，.env 实际配置 deepseek-v4-flash
    llm_api_base: str = "https://open.bigmodel.cn/api/paas/v4/"  # 代码默认值，.env 实际配置 https://api.deepseek.com/v1
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
        """从扁平 DB_* 字段构建默认 DatabaseConfig 列表"""
        if not self.databases and self.db_username and self.db_password:
            self.databases = [DatabaseConfig(
                name=self.db_name, host=self.db_host, port=self.db_port,
                username=self.db_username, password=self.db_password,
                database=self.db_database,
            )]
        return self
```

### 3.3 查询模型

```python
# pg_mcp/models/query.py

from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime
from enum import Enum

class QueryStatus(str, Enum):
    """查询状态"""
    SUCCESS = "success"
    FAILED = "failed"
    TIMEOUT = "timeout"
    VERIFICATION_FAILED = "verification_failed"

class QueryHistory(BaseModel):
    """查询历史记录"""
    id: str = Field(default_factory=lambda: str(datetime.now().timestamp()))
    timestamp: datetime = Field(default_factory=datetime.now)
    user_query: str
    generated_sql: str
    database: str
    status: QueryStatus
    execution_time_ms: Optional[int] = None
    row_count: Optional[int] = None
    error_message: Optional[str] = None
    verification_score: Optional[float] = None  # 结果验证评分
```

---

## 4. 核心模块设计

### 4.1 MCP Server 入口

```python
# pg_mcp/main.py

from fastmcp import FastMCP
from contextlib import asynccontextmanager
from .config import load_config
from .database.schema import SchemaManager
from .database.pool import ConnectionPoolManager
from .sql.generator import SQLGenerator
from .sql.validator import SQLValidator
from .sql.executor import SQLExecutor
from .history.manager import HistoryManager
from .utils.logger import get_logger
from .utils.error import MCPError

logger = get_logger(__name__)

# 创建 MCP Server
mcp = FastMCP(name="pg-mcp", version="0.1.0")

# 组件变量（在 lifespan 中初始化）
config = None
pool_mgr = None
schema_mgr = None
sql_gen = None
sql_validator = None
sql_executor = None
history_mgr = None

@asynccontextmanager
async def lifespan():
    """应用生命周期管理 - 所有组件在 lifespan 中初始化"""
    global config, pool_mgr, schema_mgr, sql_gen, sql_validator, sql_executor, history_mgr

    # 加载配置
    config = load_config()
    if not config.databases:
        raise RuntimeError("No databases configured. Please set DB_* environment variables.")

    # 初始化连接池
    pool_mgr = ConnectionPoolManager(config.databases)
    await pool_mgr.initialize()

    # 加载 Schema
    schema_mgr = SchemaManager(pool_mgr)
    await schema_mgr.load_all()

    # 初始化业务组件
    sql_gen = SQLGenerator(LLMConfig(config))
    sql_validator = SQLValidator(SecurityConfig(config), schema_mgr)
    sql_executor = SQLExecutor(pool_mgr, SecurityConfig(config))
    history_mgr = HistoryManager()

    yield

    # 关闭时清理资源
    await pool_mgr.close()

# 注册生命周期
mcp.set_lifespan(lifespan)

def _ensure_initialized():
    """确保组件已初始化（lifespan 执行后）"""
    if config is None or pool_mgr is None:
        raise MCPError(
            ErrorCode.INTERNAL_ERROR,
            "Server not initialized. Ensure lifespan() has been called."
        )

@mcp.tool()
async def query_database(
    query: str,
    database: str | None = None,
    page: int = 1,
    page_size: int = 100,
    verify_result: bool = True
) -> dict:
    """
    根据自然语言查询数据库并返回结果
    """
    _ensure_initialized()
    sql = None

    try:
        # 0. 参数验证
        if page < 1:
            raise MCPError(ErrorCode.INVALID_ARGUMENT, "page must be >= 1")
        if page_size < 1 or page_size > 1000:
            raise MCPError(ErrorCode.INVALID_ARGUMENT, "page_size must be between 1 and 1000")

        # 1. 确定目标数据库
        if not config.databases:
            raise MCPError(ErrorCode.DB_CONNECTION_ERROR, "No databases configured")
        db_name = database or config.databases[0].name

        # 2. 生成 SQL
        schema = schema_mgr.get_schema(db_name)
        sql = await sql_gen.generate(query, schema, db_name)

        # 3. 验证 SQL（三层防护）
        # 3.1 危险函数检测
        dangerous_func = sql_validator.has_dangerous_functions(sql)
        if dangerous_func:
            raise MCPError(
                ErrorCode.READ_ONLY_VIOLATION,
                f"Dangerous function '{dangerous_func}' detected in SQL"
            )
        # 3.2 只读检查
        sql_validator.validate_read_only(sql)
        # 3.3 语法验证 + 对象存在性检查
        if config.security_enable_sql_verification:
            sql_validator.validate_syntax_and_objects(sql, db_name)

        # 4. 执行 SQL
        result = await sql_executor.execute(
            sql, db_name, page, page_size
        )

        # 5. 验证结果（可选）
        verification_score = None
        if verify_result and config.security_enable_result_verification:
            verification_score = await sql_gen.verify_result(
                query, sql, result.get("rows", [])[:5], db_name
            )

        # 6. 记录历史
        history_mgr.record(
            user_query=query,
            generated_sql=sql,
            database=db_name,
            status=QueryStatus.SUCCESS,
            row_count=len(result.get("rows", [])),
            verification_score=verification_score
        )

        return {
            "success": True,
            "sql": sql,
            "result": result,
            "verification_score": verification_score
        }

    except MCPError as e:
        logger.error(f"Query failed: {e}")
        history_mgr.record(
            user_query=query,
            generated_sql=sql or "",
            database=database or "",
            status=QueryStatus.FAILED,
            error_message=str(e)
        )
        raise
```

### 4.2 数据库连接与 Schema 缓存

```python
# pg_mcp/database/pool.py

import aioodbc
from typing import Dict, List
from ..models.config import DatabaseConfig
from ..utils.logger import get_logger

from typing import Dict, List, AsyncIterator
from contextlib import asynccontextmanager

logger = get_logger(__name__)

class ConnectionPoolManager:
    """多数据库连接池管理器"""

    def __init__(self, db_configs: List[DatabaseConfig]):
        self.pools: Dict[str, aioodbc.Pool] = {}
        self._configs: Dict[str, DatabaseConfig] = {}
        for cfg in db_configs:
            self._configs[cfg.name] = cfg

    async def initialize(self):
        """初始化所有连接池"""
        for name, cfg in self._configs.items():
            try:
                dsn = (
                    f"Driver={{ODBC Driver 17 for SQL Server}};"
                    f"Server={cfg.host},{cfg.port};"
                    f"Database={cfg.database};"
                    f"UID={cfg.username};"
                    f"PWD={cfg.password.get_secret_value()};"
                    "Encrypt=no;TrustServerCertificate=yes;"
                )
                self.pools[name] = await aioodbc.create_pool(
                    dsn=dsn,
                    minsize=cfg.min_pool_size,
                    maxsize=cfg.max_pool_size,
                )
                logger.info(f"Connected to database: {name}")
            except Exception as e:
                logger.error(f"Failed to connect to {name}: {e}")

    @asynccontextmanager
    async def acquire(self, db_name: str) -> AsyncIterator[aioodbc.Connection]:
        """获取数据库连接（异步上下文管理器）"""
        if db_name not in self.pools:
            raise ValueError(f"Unknown database: {db_name}")
        async with self.pools[db_name].acquire() as conn:
            yield conn

    async def close(self):
        """关闭所有连接池"""
        for name, pool in self.pools.items():
            await pool.close()
            logger.info(f"Closed pool for database: {name}")


# pg_mcp/database/schema.py

import asyncio
from typing import Dict, Optional
from ..models.schema import DatabaseSchema, TableInfo, ViewInfo, ColumnInfo
from .pool import ConnectionPoolManager
from ..utils.logger import get_logger

logger = get_logger(__name__)

class SchemaManager:
    """Schema 缓存管理器"""

    def __init__(self, pool_mgr: ConnectionPoolManager):
        self.pool_mgr = pool_mgr
        self._cache: Dict[str, DatabaseSchema] = {}
        self._lock = asyncio.Lock()  # 并发安全保护

    async def load_all(self):
        """加载所有数据库的 Schema"""
        for db_name in self.pool_mgr.pools.keys():
            await self.load_schema(db_name)

    async def load_schema(self, db_name: str) -> DatabaseSchema:
        """加载单个数据库的 Schema"""
        async with self.pool_mgr.acquire(db_name) as conn:
            # 加载表和列
            tables = await self._load_tables(conn)
            views = await self._load_views(conn)

            schema = DatabaseSchema(name=db_name, tables=tables, views=views)
            self._cache[db_name] = schema
            logger.info(f"Loaded schema for {db_name}: {len(tables)} tables, {len(views)} views")
            return schema

    async def _load_tables(self, conn: aioodbc.Connection) -> Dict[str, TableInfo]:
        """加载所有表信息 - 从 INFORMATION_SCHEMA 和 sys.extended_properties 加载"""
        # 主查询: 获取表、列、主键、外键基础信息
        query = """
            SELECT
                t.table_name,
                t.table_schema,
                c.column_name,
                c.data_type,
                c.is_nullable,
                c.column_default,
                c.ordinal_position,
                COALESCE(pk.is_primary, false) as is_primary_key,
                fk.foreign_key_to,
                obj_description(
                    (t.table_schema || '.' || t.table_name)::regclass,
                    'pg_class'
                ) as table_comment
            FROM information_schema.tables t
            JOIN information_schema.columns c
                ON c.table_name = t.table_name
                AND c.table_schema = t.table_schema
            LEFT JOIN (
                SELECT tc.table_name, tc.table_schema, kcu.column_name, true as is_primary
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_name = kcu.table_name
                    AND tc.table_schema = kcu.table_schema
                WHERE tc.constraint_type = 'PRIMARY KEY'
                AND tc.table_schema = 'public'
            ) pk ON pk.table_name = c.table_name
                AND pk.column_name = c.column_name
                AND pk.table_schema = c.table_schema
            LEFT JOIN (
                SELECT
                    tc.table_name,
                    tc.table_schema,
                    kcu.column_name,
                    ccu.table_name || '.' || ccu.column_name as foreign_key_to
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_name = kcu.table_name
                    AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage ccu
                    ON tc.constraint_name = ccu.constraint_name
                WHERE tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_schema = 'public'
            ) fk ON fk.table_name = c.table_name
                AND fk.column_name = c.column_name
                AND fk.table_schema = c.table_schema
            WHERE t.table_type = 'BASE TABLE'
                AND t.table_schema = 'public'
            ORDER BY t.table_name, c.ordinal_position
        """

        # 列注释查询: 使用 pg_attribute.attnum 确保正确匹配（不受 dropped columns 影响）
        comments_query = """
            SELECT
                c.relname as table_name,
                a.attname as column_name,
                col_description(c.oid, a.attnum) as column_comment
            FROM pg_class c
            JOIN pg_attribute a ON c.oid = a.attrelid
            JOIN pg_namespace n ON c.relnamespace = n.oid
            WHERE n.nspname = 'public'
              AND c.relkind = 'r'
              AND a.attnum > 0
              AND NOT a.attisdropped
        """
        rows = await conn.fetch(query)
        comment_rows = await conn.fetch(comments_query)

        # 构建 (table_name, column_name) -> comment 映射
        comment_map = {}
        for row in comment_rows:
            key = (row["table_name"], row["column_name"])
            comment_map[key] = row["column_comment"]

        tables: Dict[str, TableInfo] = {}

        for row in rows:
            table_name = row["table_name"]
            if table_name not in tables:
                tables[table_name] = TableInfo(
                    name=table_name,
                    schema_name=row["table_schema"],
                    columns=[],
                    comment=row["table_comment"]
                )

            col_comment = comment_map.get((table_name, row["column_name"]), "")
            column = ColumnInfo(
                name=row["column_name"],
                type=row["data_type"],
                nullable=row["is_nullable"] == "YES",
                default=row["column_default"],
                comment=col_comment,
                is_primary_key=row["is_primary_key"],
                is_foreign_key=row["foreign_key_to"] is not None,
                foreign_key_to=row["foreign_key_to"]
            )
            tables[table_name].columns.append(column)

        return tables

    async def _load_views(self, conn: aioodbc.Connection) -> Dict[str, ViewInfo]:
        """加载所有视图信息"""
        # 先获取视图定义
        views_query = """
            SELECT table_name, view_definition
            FROM information_schema.views
            WHERE table_schema = 'public'
        """
        view_rows = await conn.fetch(views_query)

        views: Dict[str, ViewInfo] = {}
        for row in view_rows:
            view_name = row["table_name"]
            views[view_name] = ViewInfo(
                name=view_name,
                definition=row["view_definition"],
                columns=[]
            )

        # 再获取视图列信息
        if views:
            columns_query = """
                SELECT table_name, column_name, data_type, is_nullable, ordinal_position
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = ANY($1)
                ORDER BY table_name, ordinal_position
            """
            view_names = list(views.keys())
            col_rows = await conn.fetch(columns_query, view_names)

            for row in col_rows:
                view_name = row["table_name"]
                if view_name in views:
                    column = ColumnInfo(
                        name=row["column_name"],
                        type=row["data_type"],
                        nullable=row["is_nullable"] == "YES"
                    )
                    views[view_name].columns.append(column)

        return views

    def get_schema(self, db_name: str) -> DatabaseSchema:
        """获取缓存的 Schema"""
        if db_name not in self._cache:
            raise ValueError(f"Schema not loaded for database: {db_name}")
        return self._cache[db_name]

    async def refresh(self, db_name: str | None = None):
        """刷新 Schema 缓存"""
        if db_name:
            await self.load_schema(db_name)
        else:
            await self.load_all()
```

### 4.3 SQL 验证器

```python
# pg_mcp/sql/validator.py

import sqlglot
from sqlglot import exp
from typing import List, Optional
from ..models.config import SecurityConfig
from ..database.schema import SchemaManager, DatabaseSchema
from ..utils.error import MCPError, ErrorCode
from ..constants import ALLOWED_QUERY_TYPES

class SQLValidator:
    """SQL 验证器 - 使用 SQLGlot 进行语法和安全验证"""

    def __init__(self, security_config: SecurityConfig, schema_mgr: SchemaManager):
        self.config = security_config
        self.schema_mgr = schema_mgr

    def validate_read_only(self, sql: str):
        """验证 SQL 是否为只读操作"""
        try:
            parsed = sqlglot.parse(sql, read="mssql")
            if not parsed:
                raise MCPError(ErrorCode.SQL_SYNTAX_ERROR, "Empty SQL statement")

            # 获取第一个语句的类型
            first_stmt = parsed[0]
            stmt_type = type(first_stmt).__name__.upper()

            # 检查是否为只读操作
            if not isinstance(first_stmt, (exp.Select, exp.Explain)):
                raise MCPError(
                    ErrorCode.READ_ONLY_VIOLATION,
                    f"Only SELECT and EXPLAIN statements are allowed. Got: {stmt_type}"
                )

        except sqlglot.errors.ParseError as e:
            raise MCPError(ErrorCode.SQL_SYNTAX_ERROR,
                          f"SQL parse error: {str(e)}")
        except MCPError:
            raise

    def validate_syntax_and_objects(self, sql: str, db_name: str):
        """验证 SQL 语法和表/列存在性"""
        try:
            parsed = sqlglot.parse(sql, read="mssql")
        except sqlglot.errors.ParseError as e:
            raise MCPError(ErrorCode.SQL_SYNTAX_ERROR,
                          f"SQL parse error: {str(e)}")

        schema = self.schema_mgr.get_schema(db_name)
        referenced_tables = set()

        # walk() 返回 (node, parent, key) 元组
        for node, parent, key in parsed[0].walk():
            if isinstance(node, exp.Table):
                table_name = node.name
                referenced_tables.add(table_name)

                if table_name not in schema.tables:
                    raise MCPError(
                        ErrorCode.SQL_OBJECT_NOT_FOUND,
                        f"Table '{table_name}' does not exist"
                    )

        # 单独遍历查找列引用
        for node, parent, key in parsed[0].walk():
            if isinstance(node, exp.Column):
                col_name = node.name
                # 查找列所属的表
                parent_table = self._find_parent_table(node, referenced_tables)
                if parent_table and parent_table in schema.tables:
                    table = schema.tables[parent_table]
                    col_exists = any(c.name == col_name for c in table.columns)
                    if not col_exists:
                        raise MCPError(
                            ErrorCode.SQL_OBJECT_NOT_FOUND,
                            f"Column '{col_name}' does not exist in table '{parent_table}'"
                        )

    def _find_parent_table(self, col_node: exp.Column, referenced_tables: set) -> Optional[str]:
        """查找列所属的表"""
        # 检查是否有明确的表前缀
        if col_node.table:
            return col_node.table.name
        # 如果只有一个表，则默认是该表
        if len(referenced_tables) == 1:
            return next(iter(referenced_tables))
        return None

    def has_dangerous_functions(self, sql: str) -> Optional[str]:
        """检测危险函数"""
        dangerous_patterns = [
            "xp_cmdshell", "xp_delete_file", "xp_regread", "xp_regwrite",
            "xp_regdeletevalue", "xp_regdeletekey", "xp_grantlogin",
            "xp_enumgroups", "xp_loginconfig", "xp_logininfo",
            "xp_servicecontrol", "xp_terminate_process",
            "sp_configure", "sp_recompile", "sp_refreshsqlmodule",
            "sp_executesql", "openrowset", "opendatasource", "openquery",
            "bulk_insert", "fn_virtualfilestats", "fn_physloc",
        ]
        sql_lower = sql.lower()
        for func in dangerous_patterns:
            if f"{func}(" in sql_lower:
                return func
        return None

    def explain_for_validation(self, sql: str) -> dict:
        """使用 EXPLAIN 验证 SQL 可执行性"""
        explain_sql = f"EXPLAIN {sql}"
        try:
            parsed = sqlglot.parse(explain_sql, read="mssql")
            return {"executable": True, "plan": parsed[0].sql(dialect="mssql")}
        except Exception as e:
            return {"executable": False, "error": str(e)}
```

### 4.4 SQL 生成器

```python
# pg_mcp/sql/generator.py

import re
import asyncio
from openai import AsyncOpenAI
from typing import Optional, List
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from ..models.config import LLMConfig
from ..models.schema import DatabaseSchema
from ..utils.logger import get_logger

logger = get_logger(__name__)

class SQLGenerator:
    """SQL 生成器 - 调用 LLM (DeepSeek-v4-flash) 生成 T-SQL"""

    # Schema 格式化模板
    SCHEMA_TEMPLATE = """
Database: {db_name}

Tables:
{tables_info}
"""

    def __init__(self, config: LLMConfig):
        self.config = config
        self.client = AsyncOpenAI(
            api_key=config.api_key,
            base_url=config.api_base,
            timeout=config.timeout
        )

    def _format_schema(self, schema: DatabaseSchema, limit_tables: Optional[List[str]] = None) -> str:
        """格式化 Schema 为 LLM 可理解的文本"""
        tables_info = []

        for table_name, table in schema.tables.items():
            if limit_tables and table_name not in limit_tables:
                continue

            cols = [f"  - {c.name}: {c.type}" +
                   (" (PK)" if c.is_primary_key else "") +
                   (" NOT NULL" if not c.nullable else "")
                   for c in table.columns]

            tables_info.append(f"- {table_name}:\n" + "\n".join(cols))

        return self.SCHEMA_TEMPLATE.format(
            db_name=schema.name,
            tables_info="\n".join(tables_info)
        )

    async def _call_llm(
        self,
        user_query: str,
        schema: DatabaseSchema,
        db_name: str
    ) -> str:
        """调用 LLM 生成 SQL（内部方法，支持重试）"""
        schema_text = self._format_schema(schema)

        prompt = f"""你是一个 SQL Server (T-SQL) 专家。根据以下数据库 Schema，将用户的自然语言查询转换为标准的 T-SQL 查询语句。

{schema_text}

用户查询: {user_query}

要求:
1. 只生成 SELECT 查询，不要生成 INSERT/UPDATE/DELETE
2. 使用标准 T-SQL 语法
3. 对于聚合查询，使用清晰的列别名
4. 不要添加任何解释文字，只返回 SQL 语句

SQL:"""

        response = await self.client.chat.completions.create(
            model=self.config.model,
            messages=[
                {"role": "system", "content": "你是一个专业的 SQL Server (T-SQL) SQL 生成助手。根据用户描述和提供的数据库 Schema，生成正确的 SQL Server 查询语句（T-SQL）。"},
                {"role": "user", "content": prompt}
            ],
            temperature=self.config.temperature,
            max_tokens=self.config.max_tokens
        )

        sql = response.choices[0].message.content.strip()
        # 清理 Markdown 代码块包裹（LLM 常见返回格式）
        sql = re.sub(r'^```(?:sql)?\s*', '', sql, flags=re.MULTILINE)
        sql = re.sub(r'\s*```$', '', sql, flags=re.MULTILINE)
        sql = sql.strip()
        # 移除末尾分号
        sql = sql.rstrip(";").strip()
        logger.info(f"Generated SQL for '{user_query[:50]}...'")
        return sql

    async def generate(
        self,
        user_query: str,
        schema: DatabaseSchema,
        db_name: str,
        max_retries: int = 3
    ) -> str:
        """生成 SQL（带重试机制）"""
        last_exception = None
        for attempt in range(max_retries):
            try:
                return await self._call_llm(user_query, schema, db_name)
            except Exception as e:
                last_exception = e
                wait_time = min(2 ** attempt, 10)  # 指数退避：1s, 2s, 4s...
                logger.warning(f"LLM API call failed (attempt {attempt + 1}/{max_retries}): {e}. Retrying in {wait_time}s...")
                await asyncio.sleep(wait_time)

        raise MCPError(
            ErrorCode.LLM_API_ERROR,
            f"Failed to generate SQL after {max_retries} retries: {last_exception}"
        )

    async def verify_result(
        self,
        user_query: str,
        sql: str,
        sample_rows: List[dict],
        db_name: str
    ) -> float:
        """验证结果与用户意图的一致性（0-1 分数）"""
        sample_text = "\n".join(str(row) for row in sample_rows[:5])

        prompt = f"""请评估以下查询结果是否符合用户的原始意图。

用户查询: {user_query}
生成的 SQL: {sql}

结果样本（前5行）:
{sample_text}

请输出一个 0-1 之间的分数，表示结果与用户意图的一致性。
- 1.0: 完全一致
- 0.5: 部分一致
- 0.0: 完全不一致

只需输出分数，格式: "0.XX"或"1.0" """

        response = await self.client.chat.completions.create(
            model=self.config.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=50
        )

        score_text = response.choices[0].message.content.strip()
        # 使用正则提取第一个浮点数，避免 LLM 返回非数字内容
        match = re.search(r'(\d+\.?\d*)', score_text)
        if match:
            score = float(match.group(1))
            score = max(0.0, min(1.0, score))  # 限制在 0-1 之间
            logger.info(f"Verification score: {score}")
            return score
        logger.warning(f"Invalid score format: {score_text}")
        return 0.5  # 默认中等分数
```

### 4.5 SQL 执行器

```python
# pg_mcp/sql/executor.py

from typing import Dict, List, Any
from ..database.pool import ConnectionPoolManager
from ..models.config import SecurityConfig
from ..utils.error import MCPError, ErrorCode
from ..utils.logger import get_logger
import sqlglot

logger = get_logger(__name__)

class SQLExecutor:
    """SQL 执行器 - 使用 aioodbc/pyodbc 执行 T-SQL"""

    def __init__(self, pool_mgr: ConnectionPoolManager, security_config: SecurityConfig):
        self.pool_mgr = pool_mgr
        self.config = security_config

    async def execute(
        self,
        sql: str,
        db_name: str,
        page: int = 1,
        page_size: int = 100
    ) -> Dict[str, Any]:
        """执行 SQL 并返回分页结果"""
        clean_sql = sql.rstrip().rstrip(";").strip()
        if not clean_sql.upper().startswith(("SELECT", "WITH", "EXPLAIN")):
            raise MCPError(
                ErrorCode.READ_ONLY_VIOLATION,
                "Only SELECT statements are allowed for execution"
            )

        offset = (page - 1) * page_size
        limit = min(page_size, self.config.max_result_rows)

        try:
            # 使用 SQLGlot 检测是否已有 LIMIT 子句（避免注释误判）
            has_limit = self._has_limit_clause(clean_sql)
            if not has_limit:
                paginated_sql = (
                    f"SELECT * FROM ({clean_sql}) AS _subq "
                    f"ORDER BY (SELECT NULL) "
                    f"OFFSET {offset} ROWS FETCH NEXT {limit} ROWS ONLY"
                )
            else:
                paginated_sql = clean_sql

            async with self.pool_mgr.acquire(db_name) as conn:
                cursor = await conn.cursor()
                await cursor.execute(paginated_sql)
                rows = await cursor.fetchall()
                columns = [col[0] for col in cursor.description] if cursor.description else []

                count_sql = f"SELECT COUNT(*) AS _total FROM ({clean_sql}) AS _countq"
                await cursor.execute(count_sql)
                total_count = (await cursor.fetchone())[0]

                result_rows = []
                for row in rows:
                    result_rows.append(dict(zip(columns, row)))

                return {
                    "rows": result_rows,
                    "total_count": total_count,
                    "page": page,
                    "page_size": page_size,
                    "total_pages": (total_count + page_size - 1) // page_size
                }
        except Exception as e:
            raise MCPError(
                ErrorCode.QUERY_EXECUTION_ERROR,
                f"Query execution failed: {str(e)}"
            )

    def _has_limit_clause(self, sql: str) -> bool:
        """使用 SQLGlot AST 检测 SQL 是否已包含 LIMIT/TOP/OFFSET"""
        try:
            parsed = sqlglot.parse(sql, read="mssql")
            if parsed:
                for node in parsed[0].walk():
                    if node.key in ("limit", "top"):
                        return True
            return False
        except Exception:
            return " LIMIT " in sql.upper() or " TOP " in sql.upper()
```

---

## 4.4 历史管理模块

### 4.4.1 存储设计

使用 JSON Lines 格式存储，每行一个 JSON 对象。支持并发写入（asyncio.Lock）和自动清理。

```python
# pg_mcp/history/manager.py

import asyncio
import json
import os
from datetime import datetime
from pathlib import Path
from typing import List, Optional
from ..models.query import QueryHistory, QueryStatus
from ..utils.logger import get_logger

logger = get_logger(__name__)

class HistoryManager:
    """查询历史管理器 - 使用 JSON Lines 文件存储"""

    def __init__(self, history_dir: str = "data/history"):
        self._history_dir = Path(history_dir)
        self._history_dir.mkdir(parents=True, exist_ok=True)
        self._file_path = self._history_dir / "queries.jsonl"
        self._lock = asyncio.Lock()  # 并发写入保护
        self._max_retention_days = 30  # 保留 30 天
        self._max_records_per_user = 1000  # 每用户最多保留 1000 条

    def record(
        self,
        user_query: str,
        generated_sql: str,
        database: str,
        status: QueryStatus,
        row_count: int = 0,
        error_message: Optional[str] = None,
        verification_score: Optional[float] = None,
    ):
        """记录查询历史（异步安全）"""
        record = QueryHistory(
            query=user_query,
            generated_sql=generated_sql,
            database=database,
            status=status,
            row_count=row_count,
            error_message=error_message,
            verification_score=verification_score,
        )
        # 使用同步方式写入（record 在同步上下文中调用）
        with open(self._file_path, "a", encoding="utf-8") as f:
            f.write(record.model_dump_json() + "\n")

    async def get_by_user(self, user_id: str = "default", limit: int = 100) -> List[QueryHistory]:
        """获取指定用户的查询历史"""
        if not self._file_path.exists():
            return []

        # 异步读取文件
        def _read():
            records = []
            with open(self._file_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line:
                        try:
                            records.append(QueryHistory.model_validate_json(line))
                        except Exception:
                            continue  # 跳过损坏的行
            # 按时间倒序，返回最近 N 条
            records.sort(key=lambda r: r.created_at, reverse=True)
            return records[:min(limit, self._max_records_per_user)]

        return await asyncio.to_thread(_read)

    async def get_recent(self, limit: int = 50) -> List[QueryHistory]:
        """获取最近的查询记录"""
        return await self.get_by_user("all", limit=limit)

    async def cleanup(self):
        """清理过期历史记录"""
        import time
        cutoff = time.time() - (self._max_retention_days * 86400)

        async with self._lock:
            if not self._file_path.exists():
                return

            records = []
            with open(self._file_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line:
                        try:
                            r = QueryHistory.model_validate_json(line)
                            if r.created_at.timestamp() > cutoff:
                                records.append(r)
                        except Exception:
                            continue

            # 写回有效记录
            with open(self._file_path, "w", encoding="utf-8") as f:
                for r in records:
                    f.write(r.model_dump_json() + "\n")

            logger.info(f"Cleaned up history: {len(records)} records retained")
```

---

## 5. 工作流程

### 5.1 查询处理流程

```
用户查询 → query_database()
    │
    ├─→ 1. 确定目标数据库
    │
    ├─→ 2. SQL 生成 (SQLGenerator.generate)
    │       ├─ 获取 Schema
    │       ├─ 构建 Prompt
    │       └─ 调用 LLM API (DeepSeek-v4-flash)
    │
    ├─→ 3. SQL 验证
    │       ├─ 只读检查 (SQLValidator.validate_read_only)
    │       ├─ 语法验证 (SQLGlot parse)
    │       └─ 表/列存在性检查
    │
    ├─→ 4. SQL 执行 (SQLExecutor.execute)
    │       ├─ 获取连接池连接
    │       ├─ 执行查询（带 LIMIT/OFFSET）
    │       └─ 格式化结果
    │
    ├─→ 5. 结果验证（可选）
    │       └─ SQLGenerator.verify_result
    │
    └─→ 6. 记录历史 → 返回结果
```

### 5.2 Schema 加载流程

```
服务启动 → ConnectionPoolManager.initialize()
    │
    └─→ SchemaManager.load_all()
        │
        ├─ 对每个数据库:
        │   │
        │   ├─ 连接数据库
        │   ├─ _load_tables(): 查询 information_schema
        │   │       ├─ 加载表信息
        │   │       ├─ 加载列信息
        │   │       ├─ 加载主键信息
        │   │       └─ 构建 TableInfo 对象
        │   │
        │   ├─ _load_views(): 加载视图信息
        │   │
        │   └─ 构建 DatabaseSchema 对象
        │
        └─ 存储到内存缓存
```

### 5.3 错误处理流程

```
异常捕获 → MCPError (自定义错误类)
    │
    ├─→ 错误码分类
    │   ├─ DB_CONNECTION_ERROR
    │   ├─ SQL_SYNTAX_ERROR
    │   ├─ READ_ONLY_VIOLATION
    │   ├─ QUERY_TIMEOUT
    │   ├─ LLM_API_ERROR
    │   └─ QUERY_EXECUTION_ERROR
    │
    ├─→ 错误日志记录
    │
    ├─→ 格式化错误响应
    │   │
    │   └─ {
    │         "success": false,
    │         "error": {
    │           "code": "READ_ONLY_VIOLATION",
    │           "message": "...",
    │           "suggestion": "..."
    │         }
    │       }
    │
    └─→ 记录查询历史（失败状态）
```

---

## 6. 接口设计

### 6.1 MCP Tools

```python
# 完整的 MCP Tools 定义

@mcp.tool()
async def query_database(
    query: str,
    database: str | None = None,
    page: int = 1,
    page_size: int = 100,
    verify_result: bool = True
) -> dict:
    """
    根据自然语言查询数据库并返回结果

    Args:
        query: 自然语言查询描述
        database: 数据库名称（可选）
        page: 页码（从1开始）
        page_size: 每页结果数
        verify_result: 是否验证结果意义性
    """
    # 实现见上文

@mcp.tool()
async def generate_sql(query: str, database: str | None = None) -> dict:
    """生成 SQL 但不执行（包含安全验证）"""
    _ensure_initialized()
    if not config.databases:
        raise MCPError(ErrorCode.DB_CONNECTION_ERROR, "No databases configured")
    db_name = database or config.databases[0].name
    schema = schema_mgr.get_schema(db_name)
    sql = await sql_gen.generate(query, schema, db_name)

    # 安全验证
    dangerous_func = sql_validator.has_dangerous_functions(sql)
    is_safe = dangerous_func is None
    read_only_ok = True
    try:
        sql_validator.validate_read_only(sql)
    except MCPError:
        read_only_ok = False
        is_safe = False

    return {
        "sql": sql,
        "is_safe": is_safe,
        "read_only_check": "pass" if read_only_ok else "fail",
        "warning": dangerous_func,
    }

@mcp.tool()
async def list_databases() -> list[dict]:
    """列出所有可用数据库"""
    return [
        {
            "name": db.name,
            "database": db.database
        }
        for db in config.databases
    ]

@mcp.tool()
async def get_schema(database: str, table: str | None = None) -> dict:
    """获取指定数据库的 Schema 信息"""
    schema = await schema_mgr.get_schema(database)
    if table:
        return schema.tables.get(table, {}).model_dump()
    return {
        "database": schema.name,
        "tables": [t.model_dump() for t in schema.tables.values()],
        "views": [v.model_dump() for v in schema.views.values()]
    }

@mcp.tool()
async def refresh_schema(database: str | None = None) -> dict:
    """刷新 Schema 缓存"""
    await schema_mgr.refresh(database)
    return {"success": True, "message": "Schema refreshed"}
```

### 6.2 MCP Resources

```python
@mcp.resource("schema://{database_name}")
async def schema_resource(database_name: str) -> str:
    """数据库 Schema 资源"""
    schema = await schema_mgr.get_schema(database_name)
    return schema.model_dump_json(indent=2)

@mcp.resource("history://{user_id}")
async def history_resource(user_id: str = "default") -> str:
    """查询历史资源"""
    history = history_mgr.get_by_user(user_id)
    return "\n".join([h.model_dump_json() for h in history])
```

---

## 7. 配置管理

### 7.1 配置管理方式

使用 `pydantic-settings` 管理配置，自动处理环境变量，不再需要 YAML 配置文件。

支持 `.env` 文件和环境变量两种方式：

```bash
# .env 示例
DB_HOST=localhost
DB_PORT=1433
DB_USERNAME=readonly_user
DB_PASSWORD=your_password
DB_NAME=app_db

LLM_API_KEY=sk-your_deepseek_api_key
LLM_MODEL=deepseek-v4-flash
LLM_API_BASE=https://api.deepseek.com/v1

SECURITY_MAX_QUERY_TIMEOUT=60
SECURITY_MAX_RESULT_ROWS=10000
```

### 7.2 配置加载代码

```python
# pg_mcp/config.py

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import BaseModel, model_validator
from typing import List, Optional

class DatabaseConfig(BaseModel):
    """单个数据库配置（纯数据模型，非 Settings）"""
    name: str
    host: str = "localhost"
    port: int = 1433
    username: str
    password: str
    database: str = ""
    min_pool_size: int = 5
    max_pool_size: int = 20


class Settings(BaseSettings):
    """应用总配置 - 使用 pydantic-settings 自动处理环境变量"""

    # 数据库配置（平铺字段，避免嵌套 BaseSettings 的 env_prefix 冲突）
    db_name: str = "default"
    db_host: str = "localhost"
    db_port: int = 1433
    db_username: str = ""
    db_password: str = ""
    db_database: str = ""

    # LLM 配置
    llm_api_key: str = ""
    llm_model: str = "deepseek-v4-flash"
    llm_api_base: str = "https://api.deepseek.com/v1"
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
    schema_refresh_interval: Optional[int] = None

    # 运行时构建的复合配置
    databases: List[DatabaseConfig] = []
    llm_api_key_secret: str = ""  # 仅用于内部传递

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_nested_delimiter="__",
        extra="ignore",
    )

    @model_validator(mode="after")
    def build_databases(self) -> "Settings":
        """根据环境变量构建数据库配置列表"""
        if self.db_username and self.db_password:
            self.databases = [DatabaseConfig(
                name=self.db_name,
                host=self.db_host,
                port=self.db_port,
                username=self.db_username,
                password=self.db_password,
                database=self.db_database,
            )]
        return self


class LLMConfig:
    """运行时 LLM 配置（从 Settings 派生）"""
    def __init__(self, settings: Settings):
        self.provider = "zhipuai"
        self.api_key = settings.llm_api_key
        self.model = settings.llm_model
        self.api_base = settings.llm_api_base
        self.temperature = settings.llm_temperature
        self.max_tokens = settings.llm_max_tokens
        self.timeout = settings.llm_timeout


class SecurityConfig:
    """运行时安全配置（从 Settings 派生）"""
    def __init__(self, settings: Settings):
        self.max_query_timeout = settings.security_max_query_timeout
        self.max_result_rows = settings.security_max_result_rows
        self.allowed_query_types = ["SELECT", "EXPLAIN", "WITH"]
        self.enable_sql_verification = settings.security_enable_sql_verification
        self.enable_result_verification = settings.security_enable_result_verification
        self.verification_threshold = settings.security_verification_threshold


def load_config() -> Settings:
    """加载配置（优先读取 .env 文件，其次读取环境变量）"""
    return Settings()
```

---

## 8. 错误处理

### 8.1 错误码定义

```python
# pg_mcp/constants.py

from enum import Enum

class ErrorCode(str, Enum):
    """MCP 错误码"""

    # 数据库相关
    DB_CONNECTION_ERROR = "DB_CONNECTION_ERROR"
    DB_POOL_ERROR = "DB_POOL_ERROR"

    # SQL 相关
    SQL_SYNTAX_ERROR = "SQL_SYNTAX_ERROR"
    SQL_OBJECT_NOT_FOUND = "SQL_OBJECT_NOT_FOUND"
    READ_ONLY_VIOLATION = "READ_ONLY_VIOLATION"

    # 查询相关
    QUERY_TIMEOUT = "QUERY_TIMEOUT"
    QUERY_EXECUTION_ERROR = "QUERY_EXECUTION_ERROR"

    # LLM 相关
    LLM_API_ERROR = "LLM_API_ERROR"
    LLM_TIMEOUT = "LLM_TIMEOUT"

    # Schema 相关
    SCHEMA_LOAD_ERROR = "SCHEMA_LOAD_ERROR"
    SCHEMA_NOT_FOUND = "SCHEMA_NOT_FOUND"

    # 通用错误
    INTERNAL_ERROR = "INTERNAL_ERROR"
    INVALID_ARGUMENT = "INVALID_ARGUMENT"
```

### 8.2 错误类定义

```python
# pg_mcp/utils/error.py

from .constants import ErrorCode
from typing import Optional, Any

class MCPError(Exception):
    """自定义 MCP 错误"""

    def __init__(
        self,
        code: ErrorCode,
        message: str,
        details: Optional[dict] = None,
        suggestion: Optional[str] = None
    ):
        self.code = code
        self.message = message
        self.details = details or {}
        self.suggestion = suggestion
        super().__init__(message)

    def to_dict(self) -> dict:
        return {
            "success": False,
            "error": {
                "code": self.code.value,
                "message": self.message,
                "details": self.details,
                "suggestion": self.suggestion
            }
        }
```

---

## 9. 性能与安全

### 9.1 性能优化策略

| 策略 | 实现方式 | 效果 |
|------|---------|------|
| 连接池 | aioodbc 连接池 | 避免频繁创建 ODBC 连接 |
| Schema 缓存 | 内存缓存 + 启动时加载 | 避免重复查询 information_schema |
| 批量查询 | 单次查询获取表+列+外键信息 | 减少数据库往返 |
| 分页限制 | 参数化 LIMIT + OFFSET | 控制返回数据量，防止 SQL 注入 |
| 超时控制 | 查询超时 + LLM 超时 | 防止长时间阻塞 |
| 异步 I/O | 全程 async/await | 高并发支持 |

### 9.2 安全措施

1. **只读限制**
   - 白名单模式：只允许 SELECT、EXPLAIN
   - SQLGlot AST 分析验证
   - 三层防护：关键字过滤 → 语法解析验证 → 子句白名单

2. **危险函数检测**
   - 检测 `xp_cmdshell`、`sp_configure`、`openrowset` 等危险函数
   - 在 SQL 验证阶段拦截包含危险函数的查询

3. **SQL 注入防护**
   - 使用参数化查询（`$1`, `$2`）而非字符串拼接
   - LIMIT/OFFSET 使用参数绑定
   - 避免 CTE 包装用户 SQL

4. **权限隔离**
   - 使用只读数据库用户
   - 不授予任何写入权限

5. **资源限制**
   - 最大查询超时：60s
   - 最大返回行数：10000
   - 连接池大小限制

6. **敏感信息保护**
   - 密码从环境变量读取（pydantic-settings 自动处理）
   - 不在日志中记录敏感信息

7. **审计日志**
   - 记录所有查询历史
   - 包含用户输入、生成 SQL、执行状态

---

## 10. 部署与运维

### 10.1 依赖管理

```toml
# pyproject.toml

[project]
name = "pg-mcp"
version = "0.1.0"
description = "PostgreSQL MCP Server"
requires-python = ">=3.11"
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
]
```

### 10.2 启动流程

```python
# pg_mcp/main.py (完整入口)

import asyncio
from contextlib import asynccontextmanager

from fastmcp import FastMCP
from .config import load_config, LLMConfig, SecurityConfig
from .database.pool import ConnectionPoolManager
from .database.schema import SchemaManager

# 创建 MCP Server
mcp = FastMCP(name="pg-mcp", version="0.1.0")

# 组件变量（全局作用域，在 lifespan 中初始化）
config = None
pool_mgr = None
schema_mgr = None
sql_gen = None
sql_validator = None
sql_executor = None
history_mgr = None

@asynccontextmanager
async def lifespan():
    """应用生命周期管理"""
    global config, pool_mgr, schema_mgr, sql_gen, sql_validator, sql_executor, history_mgr

    config = load_config()
    if not config.databases:
        raise RuntimeError("No databases configured")

    pool_mgr = ConnectionPoolManager(config.databases)
    await pool_mgr.initialize()

    schema_mgr = SchemaManager(pool_mgr)
    await schema_mgr.load_all()

    sql_gen = SQLGenerator(LLMConfig(config))
    sql_validator = SQLValidator(SecurityConfig(config), schema_mgr)
    sql_executor = SQLExecutor(pool_mgr, SecurityConfig(config))
    history_mgr = HistoryManager()

    yield

    await pool_mgr.close()

# 注册生命周期
mcp.set_lifespan(lifespan)

# 注册所有 Tools（代码见上文）

if __name__ == "__main__":
    import sys
    if sys.argv[1] == "dev":
        mcp.run(transport="stdio")
    else:
        mcp.run()
```

### 10.3 健康检查

```python
@mcp.tool()
async def health_check() -> dict:
    """健康检查接口"""
    status = {
        "status": "healthy",
        "databases": {},
        "schema_loaded": len(schema_mgr._cache)
    }

    for db_name in pool_mgr.pools.keys():
        try:
            async with pool_mgr.acquire(db_name) as conn:
                await conn.fetchval("SELECT 1")
                status["databases"][db_name] = "connected"
        except Exception as e:
            status["databases"][db_name] = f"error: {str(e)}"
            status["status"] = "degraded"

    return status
```

---

## 11. 待确认项

| 问题 | 说明 | 建议 |
|-----|------|------|
| Q1 | Schema 自动刷新间隔 | 建议配置为 3600s（1小时）或禁用 |
| Q2 | 查询历史存储方式 | 当前设计为文件存储，可改为数据库 |
| Q3 | 结果验证降级策略 | 当前设计为失败时返回错误，可考虑警告模式 |
| Q4 | 是否支持跨库查询 | 当前不支持，需要时可在 Schema 合并层面支持 |
| Q5 | LLM Prompt 优化 | 可根据实际使用情况迭代优化 |

---

## 12. 附录

### 12.1 依赖版本说明

| 依赖 | 版本要求 | 用途 |
|------|---------|------|
| Python | 3.11+ | 运行环境 |
| fastmcp | >=0.2.0 | MCP 框架 |
| aioodbc | >=0.5.0 | 异步 ODBC 连接驱动 |
| pyodbc | >=5.0.0 | 同步 ODBC 驱动（aioodbc 依赖） |
| sqlglot | >=25.0.0 | SQL 解析和验证 |
| pydantic | >=2.0.0 | 数据验证 |
| openai | >=1.0.0 | LLM API 客户端 |

### 12.2 测试策略

#### 12.2.1 单元测试

| 模块 | Mock 对象 | 覆盖目标 |
|------|-----------|----------|
| `config.py` | 无 | 环境变量加载、默认值、validator |
| `schema.py` | aioodbc connection | 表/列加载、视图加载、缓存操作 |
| `validator.py` | schema_mgr | 只读检查、危险函数检测、对象存在性 |
| `generator.py` | AsyncOpenAI client | SQL 生成重试、Markdown 清理、结果验证 |
| `executor.py` | aioodbc connection | 分页查询、超时处理、SQL 清理 |
| `history/manager.py` | 文件系统 | 写入/读取/清理 |

#### 12.2.2 集成测试

- 使用 `pytest-postgresql` 启动临时 PostgreSQL 实例
- LLM Mock：使用固定响应文件或录制/回放模式
- 测试完整查询流程：自然语言 → SQL 生成 → 验证 → 执行 → 返回

#### 12.2.3 LLM Mock 策略

```python
# tests/conftest.py
import pytest
from unittest.mock import AsyncMock, patch

@pytest.fixture
def mock_llm_response():
    """Mock LLM 返回固定 SQL"""
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

### 12.3 速率限制设计（S-06）

| 限制项 | 默认值 | 实现方式 |
|--------|--------|----------|
| LLM API 调用频率 | 10 次/分钟 | `aiolimiter` 或自定义 Token Bucket |
| 数据库查询并发 | 20 并发 | 连接池 max_size 自然限制 |
| 单用户查询频率 | 30 次/分钟 | 基于 `user_id` 的滑动窗口计数器 |
| 慢查询限制 | 超过 30s 告警 | 记录执行时间，异步上报 |

### 12.4 参考资料

- [FastMCP 文档](https://github.com/jlowin/fastmcp)
- [aioodbc 文档](https://github.com/aio-libs/aioodbc)
- [pyodbc 文档](https://github.com/mkleehammer/pyodbc)
- [SQLGlot 文档](https://sqlglot.com/)
- [Pydantic V2 文档](https://docs.pydantic.dev/)
- [MCP 规范 v1.0.0](https://spec.modelcontextprotocol.io/)
- [DeepSeek API 文档](https://api-docs.deepseek.com/)
- [智谱AI API 文档](https://open.bigmodel.cn/dev/api)（代码默认 LLM provider）

---

**变更记录**

| 版本 | 日期 | 变更内容 | 作者 |
|-----|------|---------|------|
| v1.0 | 2026-05-14 | 初始设计文档 | Claude |
| v1.1 | 2026-05-14 | Codex review 修复：SQL注入修复、SQLGlot API更新、Schema SQL修复、配置改用pydantic-settings、危险函数检测、GLM-4.6→4.7 | AI Assistant |