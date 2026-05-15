# pg-mcp MCP Server 需求文档 (PRD)

**文档编号**: 0001-mcp-req-prd-by-claude.md
**版本**: v1.3
**日期**: 2026-05-15
**状态**: Draft
**MCP 协议版本**: v1.0.0

---

## 1. 项目概述

### 1.1 项目背景

用户需要一个基于 MCP (Model Context Protocol) 的 SQL Server 数据库查询服务。该服务允许用户通过自然语言描述查询需求，服务端自动生成对应的 T-SQL 语句，并可选择返回 SQL 本身或执行后的查询结果。

### 1.2 核心价值

- 降低数据库查询门槛：无需掌握 SQL 语法
- 提高查询效率：自然语言转 SQL 自动化
- 安全可控：限制查询权限，防止误操作
- 结果验证：通过大模型验证 SQL 和结果的有意义性

### 1.3 目标用户

- 数据分析师、产品经理等非技术背景用户
- 需要快速查询数据库的开发人员
- 数据库管理员

---

## 2. 功能需求

### 2.1 核心功能

#### FR-1: 数据库发现与连接

| 需求描述 | MCP Server 启动时自动发现并连接配置的 SQL Server 数据库 |
|---------|---------------------------------------------------------|
| 优先级   | P0                                                      |
| 输入     | 数据库连接配置（host, port, username, password, database）|
| 输出     | 成功/失败的连接状态                                     |
| 验收标准 | - 支持连接多个数据库<br>- 使用 aioodbc 创建异步 ODBC 连接池<br>- 连接失败时记录日志并标记该数据库不可用<br>- min_pool_size=1, max_pool_size=10<br>- 后台健康检查每 300s 检测连接存活 |

#### FR-2: Schema 缓存

| 需求描述 | 启动时读取并缓存数据库的完整 Schema 信息 |
|---------|-------------------------------------------|
| 优先级   | P0                                        |
| 缓存内容 | - 表（Tables）<br>- 视图（Views）<br>- 列信息（Columns）<br>- 外键关系（Foreign Keys）<br>- 主键信息（Primary Keys）<br>- 注释（Comments，来自 sys.extended_properties） |
| 加载机制 | - 从 INFORMATION_SCHEMA 查询列、约束、视图<br>- 从 sys.extended_properties 查询注释<br>- 默认加载 dbo schema |
| 更新策略 | - 启动时全量加载<br>- 支持手动刷新<br>- 缓存 TTL 默认 300s，可通过 SCHEMA_REFRESH_INTERVAL 配置 |
| 验收标准 | - Schema 信息完整准确<br>- 缓存性能满足要求（< 2s 加载中等规模数据库） |

#### FR-3: 自然语言转 SQL

| 需求描述 | 根据用户自然语言描述和缓存的 Schema 信息，调用大模型生成 SQL |
|---------|-------------------------------------------------------------|
| 优先级   | P0                                                          |
| 输入     | 用户自然语言查询描述 + 可选的数据库名称                    |
| 输出     | 生成的 SQL 语句                                             |
| 验收标准 | - 生成的 SQL 语法正确<br>- SQL 语义符合用户意图<br>- 支持复杂的查询场景（JOIN、聚合、子查询等） |

**查询示例**：
- "统计上个月每个用户的订单数量" → SELECT user_id, COUNT(*) FROM orders WHERE created_at >= NOW() - INTERVAL '1 month' GROUP BY user_id
- "找出余额大于1000且最近30天有交易的用户" → SELECT * FROM users WHERE balance > 1000 AND id IN (SELECT user_id FROM transactions WHERE created_at >= NOW() - INTERVAL '30 days')
- "获取所有部门的平均薪资，按降序排列" → SELECT department_id, AVG(salary) as avg_salary FROM employees GROUP BY department_id ORDER BY avg_salary DESC

#### FR-4: SQL 执行

| 需求描述 | 执行生成的 SQL 并返回结果 |
|---------|---------------------------|
| 优先级   | P0                        |
| 输入     | SQL 语句 + 数据库名称    |
| 输出     | 查询结果集（JSON 格式）  |
| 验收标准 | - 正确返回查询结果<br>- 处理空结果集<br>- 处理各种数据类型 |

#### FR-5: SQL 校验（只读限制）

| 需求描述 | 校验 SQL 是否为只读查询，拒绝写入/删除操作 |
|---------|-------------------------------------------|
| 优先级   | P0                                        |
| 校验规则 | 白名单模式：仅允许 SELECT、EXPLAIN、WITH 开头的语句<br>禁止：所有写入操作、权限变更、事务控制等 |
| 输出     | 校验通过/拒绝 + 原因                       |
| 验收标准 | - 所有写入操作被拦截<br>- 错误信息清晰明确<br>- 拦截包括但不限于：INSERT, UPDATE, DELETE, DROP, CREATE, ALTER, TRUNCATE, GRANT, REVOKE, COMMENT, BEGIN, COMMIT, ROLLBACK |

#### FR-6: SQL 可执行性验证

| 需求描述 | 在执行前验证 SQL 的语法和可执行性 |
|---------|-----------------------------------|
| 优先级   | P1                                |
| 验证方式 | - 语法检查（EXPLAIN 或 PostgreSQL 解析器）<br>- 列/表存在性检查 |
| 输出     | 验证通过/失败 + 修复建议          |
| 验收标准 | - 无效 SQL 被拦截<br>- 提供友好的错误提示 |

#### FR-7: 结果意义性验证

| 需求描述 | 调用大模型验证生成的 SQL 和查询结果是否与用户意图一致 |
|---------|--------------------------------------------------------|
| 优先级   | P1                                                     |
| 验证方式 | - 输入：用户自然语言描述 + SQL + 查询结果样本<br>- 输出：一致性评分（0-1）+ 理由 |
| 验收标准 | - 一致性评分低于阈值时提示用户<br>- 提供反馈和建议 |

#### FR-8: 双模式返回

| 需求描述 | 支持两种返回模式：返回 SQL 或返回查询结果 |
|---------|--------------------------------------------|
| 优先级   | P0                                         |
| 模式     | - SQL-only: 仅返回生成的 SQL<br>- Execute: 执行并返回结果 |
| 选择方式 | 用户参数指定                              |
| 验收标准 | - 两种模式正确响应<br>- 模式切换无异常    |

#### FR-9: 结果分页

| 需求描述 | 对大量查询结果支持分页返回 |
|---------|---------------------------|
| 优先级   | P1                        |
| 参数     | page, page_size           |
| 验收标准 | - 分页逻辑正确<br>- 支持总结果数返回 |

#### FR-10: 查询历史

| 需求描述 | 记录用户的查询历史，便于复用和审计 |
|---------|-----------------------------------|
| 优先级   | P2                                |
| 内容     | 查询时间、用户输入、生成的 SQL、执行状态 |
| 验收标准 | - 历史记录可查询<br>- 数据持久化 |

---

### 2.2 MCP 协议支持

#### FR-11: MCP Tools 定义

| 工具名称 | 描述 |
|---------|------|
| `query_database` | 执行自然语言查询并返回结果 |
| `generate_sql` | 生成 SQL 但不执行 |
| `list_databases` | 列出所有可用数据库 |
| `get_schema` | 获取指定数据库的 Schema 信息 |
| `refresh_schema` | 手动刷新 Schema 缓存 |

#### FR-12: MCP Resources 定义

| 资源名称 | 描述 |
|---------|------|
| `schema://<database_name>` | 数据库 Schema 资源 |
| `history://<user_id>` | 查询历史资源 |

---

## 3. 数据库需求

### 3.1 数据库类型

| 项目 | 说明 |
|------|------|
| 数据库类型 | SQL Server |
| 默认端口 | 1433 |
| 默认 Schema | dbo |
| 驱动 | aioodbc + pyodbc (异步/同步 ODBC 驱动) |
| ODBC 驱动 | ODBC Driver 17 for SQL Server |
| SQL 方言 | T-SQL / SQL Server (通过 SQLGlot `read="mssql"` 解析) |
| 连接字符串格式 | `Driver={ODBC Driver 17 for SQL Server};Server=host,port;Database=db;UID=user;PWD=pass;Encrypt=no;TrustServerCertificate=yes;` |

### 3.2 连接配置

**连接池配置**:
- 连接池管理器: `ConnectionPoolManager`，基于 `aioodbc` 异步 ODBC 连接池
- 最小连接数 (`min_pool_size`): 默认 1
- 最大连接数 (`max_pool_size`): 默认 10
- 支持多数据库配置，按 `name` 索引管理独立连接池
- 连接超时: 通过安全配置 `SECURITY_MAX_QUERY_TIMEOUT` 控制（默认 60s）
- 健康检查间隔: 默认 300s（5分钟），SQL: `SELECT 1`

**环境变量配置**:

| 变量名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `DB_HOST` | string | `localhost` | 数据库主机地址 |
| `DB_PORT` | int | 1433 | 数据库端口 |
| `DB_USERNAME` | string | `""` | 数据库用户名（默认空，需配置） |
| `DB_PASSWORD` | SecretStr | `""` | 数据库密码（使用 Pydantic SecretStr 保护） |
| `DB_DATABASE` | string | `""` | 目标数据库名（默认空，需配置） |
| `DB_NAME` | string | `default` | 数据库配置标识名 |

> **注意**: `db_username` 和 `db_password` 默认均为空，仅当两者都非空时才会自动构建数据库配置。

### 3.3 Schema 数据模型

**ColumnInfo（列信息）**:

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `name` | str | - | 列名 |
| `data_type` | str | - | 数据类型 |
| `is_nullable` | bool | `True` | 是否可空 |
| `column_default` | str\|None | `None` | 默认值 |
| `ordinal_position` | int | `1` | 列序号 |
| `character_maximum_length` | int\|None | `None` | 字符最大长度 |
| `is_primary_key` | bool | `False` | 是否为主键 |
| `comment` | str\|None | `None` | 列注释（来自 pg_attribute） |

**TableInfo（表信息）**:

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `name` | str | - | 表名 |
| `table_schema` | str | `dbo` | Schema 名（alias="schema"） |
| `columns` | list[ColumnInfo] | `[]` | 列信息列表 |
| `primary_key` | list[str] | `[]` | 主键列名列表 |
| `foreign_keys` | list[dict] | `[]` | 外键信息列表 |
| `comment` | str\|None | `None` | 表注释 |
| `row_estimate` | int\|None | `None` | 行数估算 |

**ViewInfo（视图信息）**:

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `name` | str | - | 视图名 |
| `view_schema` | str | `dbo` | Schema 名（alias="schema"） |
| `definition` | str | `""` | 视图定义 SQL |
| `comment` | str\|None | `None` | 视图注释 |

**DatabaseSchema（完整 Schema）**:

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `database` | str | - | 数据库名（通过 `SELECT DB_NAME()` 获取） |
| `tables` | dict[str, TableInfo] | `{}` | 表名到 TableInfo 映射 |
| `views` | dict[str, ViewInfo] | `{}` | 视图名到 ViewInfo 映射 |

### 3.4 Schema 加载机制

- 从 SQL Server `INFORMATION_SCHEMA` 系统视图加载：`TABLES`, `COLUMNS`, `TABLE_CONSTRAINTS`, `KEY_COLUMN_USAGE`, `CONSTRAINT_COLUMN_USAGE`, `VIEWS`
- 从 SQL Server `sys.extended_properties` 加载注释（使用 `MS_Description` 扩展属性）
- 默认加载 `dbo` schema 下的用户表和视图
- 支持缓存机制，默认 TTL 为 300 秒（可通过 `SCHEMA_REFRESH_INTERVAL` 配置）
- 缓存使用 `SchemaCache` 类管理，基于时间戳 + TTL 过期策略

### 3.5 安全配置

| 配置项 | 环境变量 | 默认值 | 说明 |
|--------|----------|--------|------|
| 最大查询超时 | `SECURITY_MAX_QUERY_TIMEOUT` | 60s | 查询执行超时时间 |
| 最大结果行数 | `SECURITY_MAX_RESULT_ROWS` | 10000 | 单次查询最大返回行数 |
| SQL 验证开关 | `SECURITY_ENABLE_SQL_VERIFICATION` | `true` | 启用 SQL 语法和对象存在性验证 |
| 结果验证开关 | `SECURITY_ENABLE_RESULT_VERIFICATION` | `true` | 启用结果意义性验证 |
| 验证阈值 | `SECURITY_VERIFICATION_THRESHOLD` | 0.8 | 一致性评分阈值（0-1） |
| 只读模式 | 内置 | 强制 | 仅允许 SELECT、EXPLAIN、WITH 语句 |

**危险函数列表**（SQL Server 特有，禁止使用）:
`xp_cmdshell`, `xp_delete_file`, `xp_regread`, `xp_regwrite`, `xp_regdeletevalue`, `xp_regdeletekey`, `xp_grantlogin`, `xp_enumgroups`, `xp_loginconfig`, `xp_logininfo`, `xp_servicecontrol`, `xp_terminate_process`, `sp_configure`, `sp_recompile`, `sp_refreshsqlmodule`, `sp_executesql`, `openrowset`, `opendatasource`, `openquery`, `bulk_insert`, `fn_virtualfilestats`, `fn_physloc`

### 3.6 连接池健康检查

- 健康检查间隔: 默认 300 秒（5 分钟）
- 健康检查 SQL: `SELECT 1`
- 后台异步任务: `pool_health_check`，定期检查所有连接池存活状态
- 支持手动启停: `start_health_check()` / `stop_health_check()`
- 健康检查结果以 `dict[name -> bool]` 返回
- 关闭连接池时自动停止健康检查任务

### 3.7 分页机制

- 使用 SQL Server `OFFSET ? ROWS FETCH NEXT ? ROWS ONLY` 参数化语法进行分页
- 分页 SQL 模板（当原 SQL 不含 LIMIT/OFFSET 时）: `SELECT * FROM ({sql}) AS _subq ORDER BY (SELECT NULL) OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`
- 使用 SQLGlot AST 检测 SQL 是否已包含 LIMIT 子句，避免重复分页和注释误判
- 总行数查询: `SELECT COUNT(*) AS _total FROM ({sql}) AS _countq`
- pyodbc 参数化查询使用 `?` 占位符

---

## 4. 非功能需求

### 3.1 性能需求

| 需求项 | 要求 |
|-------|------|
| Schema 加载时间 | 中等规模数据库（< 100表，每表<50列，总数据量<10GB）加载时间 < 2s |
| SQL 生成时间 | 简单查询（单表、无子查询、基础聚合）< 5s，复杂查询（多表JOIN、窗口函数、CTE）< 15s |
| SQL 执行时间 | 超时时间可配置，默认 60s |
| 并发支持 | 支持 10+ 并发查询 |

### 3.2 安全需求

| 需求项 | 要求 |
|-------|------|
| 只读限制 | 严格执行，禁止任何写入操作 |
| 权限隔离 | MCP Server 使用只读数据库用户 |
| 敏感数据 | 密码等敏感信息加密存储 |
| 审计日志 | 记录所有查询操作 |

### 3.3 可靠性需求

| 需求项 | 要求 |
|-------|------|
| 连接池 | 数据库连接池管理 |
| 错误处理 | 完善的错误处理和用户提示 |
| 降级策略 | 大模型不可用时降级为基础 SQL 生成 |

### 3.4 可维护性需求

| 需求项 | 要求 |
|-------|------|
| 日志 | 结构化日志，便于调试 |
| 配置 | 外部化配置，支持环境变量 |
| 健康检查 | 提供健康检查接口 |

---

## 4. 技术约束

### 4.1 技术栈

| 组件 | 技术选择 |
|-----|---------|
| 编程语言 | Python 3.11+ |
| MCP 框架 | FastMCP (v0.2.0+) |
| 数据库 | SQL Server |
| 驱动 | aioodbc + pyodbc (异步/同步 ODBC 驱动) |
| SQL 解析 | SQLGlot (dialect=mssql，read="mssql") |
| 大模型 | DeepSeek-v4-flash (通过 DeepSeek API)，兼容 OpenAI API |
| 数据验证 | Pydantic V2 + pydantic-settings |
| 日志 | structlog |

### 4.2 依赖约束

- MCP Server 必须兼容 MCP 协议 v1.0.0
- 大模型 API 调用需要异步支持
- 数据库连接必须支持异步操作

---

## 5. 接口规范

### 5.1 `query_database` Tool

```json
{
  "name": "query_database",
  "description": "根据自然语言查询数据库并返回结果",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "自然语言查询描述"
      },
      "database": {
        "type": "string",
        "description": "数据库名称（可选，默认为第一个可用数据库）"
      },
      "page": {
        "type": "integer",
        "description": "页码（从1开始）",
        "default": 1
      },
      "page_size": {
        "type": "integer",
        "description": "每页结果数",
        "default": 100
      },
      "verify_result": {
        "type": "boolean",
        "description": "是否验证结果意义性",
        "default": true
      }
    },
    "required": ["query"]
  }
}
```

### 5.2 `generate_sql` Tool

```json
{
  "name": "generate_sql",
  "description": "根据自然语言生成 SQL 但不执行",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "自然语言查询描述"
      },
      "database": {
        "type": "string",
        "description": "数据库名称（可选）"
      }
    },
    "required": ["query"]
  }
}
```

### 5.3 `list_databases` Tool

```json
{
  "name": "list_databases",
  "description": "列出所有可用的数据库",
  "inputSchema": {
    "type": "object",
    "properties": {}
  }
}
```

### 5.4 `get_schema` Tool

```json
{
  "name": "get_schema",
  "description": "获取指定数据库的 Schema 信息",
  "inputSchema": {
    "type": "object",
    "properties": {
      "database": {
        "type": "string",
        "description": "数据库名称"
      },
      "table": {
        "type": "string",
        "description": "特定表名（可选，用于获取单个表的详细信息）"
      }
    },
    "required": ["database"]
  }
}
```

### 5.5 `refresh_schema` Tool

```json
{
  "name": "refresh_schema",
  "description": "手动刷新指定数据库的 Schema 缓存",
  "inputSchema": {
    "type": "object",
    "properties": {
      "database": {
        "type": "string",
        "description": "数据库名称（可选，未指定则刷新所有数据库）"
      }
    }
  }
}
```

---

## 6. 配置规范

### 6.1 数据库配置

```bash
# .env 环境变量配置
DB_HOST=127.0.0.1
DB_PORT=1433
DB_USERNAME=sa
DB_PASSWORD=your_password
DB_DATABASE=sup
DB_NAME=default
```

**DatabaseConfig 配置模型**（基于 Pydantic BaseModel）:

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| name | str | "default" | 数据库配置标识 |
| host | str | "localhost" | 主机地址 |
| port | int | 1433 | 端口号 |
| username | str | "sa" | 用户名（默认 sa，需配置） |
| password | SecretStr | "" | 密码（加密存储） |
| database | str | "app_db" | 数据库名（默认 app_db，需配置） |
| min_pool_size | int | 1 | 最小连接数 |
| max_pool_size | int | 10 | 最大连接数 |

> **注意**: 仅当 `username` 和 `password` 都非空时，才会自动构建数据库配置。

### 6.2 大模型配置

```bash
# .env 环境变量配置
LLM_API_KEY=sk-your_deepseek_api_key
LLM_MODEL=deepseek-v4-flash
LLM_API_BASE=https://api.deepseek.com/v1
LLM_TEMPERATURE=0.1
LLM_MAX_TOKENS=1000
LLM_TIMEOUT=30
```

**LLMConfig 运行时配置**:

| 字段 | 默认值 | 说明 |
|------|--------|------|
| api_key | 环境变量 | API 密钥 |
| model | "deepseek-v4-flash" | 模型名称（代码默认 "glm-4.7"，.env 实际配置 "deepseek-v4-flash"） |
| base_url | "https://api.deepseek.com/v1" | API 基础 URL（代码默认 "https://open.bigmodel.cn/api/paas/v4/"） |
| temperature | 0.1 | 温度参数 |
| max_tokens | 1000 | 最大生成 token 数 |
| timeout | 30 | 请求超时（秒） |

### 6.3 安全配置

```yaml
security:
  max_query_timeout: 60  # 秒
  max_result_rows: 10000  # 单次查询最大返回行数
  allowed_query_types: ["SELECT", "EXPLAIN", "WITH"]
  enable_sql_verification: true  # 启用 SQL 语法和可执行性验证
  enable_result_verification: true  # 启用结果意义性验证
  verification_threshold: 0.8  # 一致性评分阈值（0-1）

# 验证机制说明：
# - SQL 验证: 使用 SQLGlot 解析 T-SQL 语法（read="mssql"），验证表/列存在性（严格模式）
# - 结果验证: 调用 LLM 模型对比用户意图、SQL 和结果样本，输出一致性评分（0-1）
# - 降级策略: 验证失败时返回详细错误，不强制降级执行
```

---

## 7. 错误处理

### 7.1 错误分类

| 错误类型 | MCP 错误码 | 处理方式 |
|---------|------------|---------|
| 数据库连接失败 | DB_CONNECTION_ERROR | 返回详细错误，标记数据库不可用 |
| SQL 语法错误 | SQL_SYNTAX_ERROR | 返回语法错误位置和修复建议 |
| 只读限制违反 | READ_ONLY_VIOLATION | 明确拒绝并提示 |
| 查询超时 | QUERY_TIMEOUT | 返回超时提示，建议简化查询 |
| 大模型调用失败 | LLM_API_ERROR | 返回详细错误信息 |
| Schema 加载失败 | SCHEMA_LOAD_ERROR | 记录日志，禁用相关数据库 |

### 7.2 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "READ_ONLY_VIOLATION",
    "message": "检测到写入操作，当前仅支持 SELECT 查询",
    "details": {
      "detected_operations": ["INSERT"]
    },
    "suggestion": "请修改查询为只读查询"
  }
}
```

---

## 8. 验收标准

### 8.1 功能验收

- [ ] 成功连接多个 SQL Server 数据库（通过 aioodbc 连接池）
- [ ] 正确加载并缓存 dbo schema 下的所有表、视图信息
- [ ] 从 INFORMATION_SCHEMA 和 sys.extended_properties 正确获取列、约束、注释
- [ ] 根据自然语言生成语法正确的 T-SQL
- [ ] 成功拦截所有非 SELECT 语句和 SQL Server 危险函数
- [ ] 正确执行有效的 SELECT 查询，使用 OFFSET...FETCH NEXT 分页
- [ ] 支持 SQL-only 和 Execute 两种模式
- [ ] 大模型验证功能正常工作
- [ ] 连接池健康检查正常运行（每 300s 检查一次）

### 8.2 性能验收

- [ ] Schema 加载时间符合要求
- [ ] SQL 生成时间符合要求
- [ ] 支持 10+ 并发查询无性能问题

### 8.3 安全验收

- [ ] 所有写入操作被拦截
- [ ] 敏感信息加密存储
- [ ] 审计日志完整记录

---

## 9. 待确认问题

| 问题 | 描述 | 优先级 |
|-----|------|-------|
| Q1 | Schema 缓存是否需要定时自动刷新？| 已实现：后台不自动刷新，需手动调用 refresh_schema |
| Q2 | 大模型 API 调用是否需要支持多个 provider？| 已支持：通过 OpenAI 兼容 API，可切换 DeepSeek/GLM 等 |
| Q3 | 是否需要支持跨数据库 JOIN？| 当前每个查询只针对单个数据库 |
| Q4 | 查询历史存储方式（本地文件/数据库）？| 已实现：JSON Lines 文件存储，每个用户独立文件 |
| Q5 | 是否需要支持查询模板/常用查询快捷方式？ | 未实现 |

---

## 10. 附录

### 10.1 术语表

| 术语 | 定义 |
|-----|------|
| MCP | Model Context Protocol，模型上下文协议 |
| Schema | 数据库结构信息，包括表、视图、列等 |
| 只读查询 | 仅读取数据，不修改数据的查询（SELECT） |
| 大模型验证 | 使用 AI 模型验证 SQL 和结果的正确性 |
| ODBC | Open Database Connection，开放数据库连接标准 |
| T-SQL | Transact-SQL，Microsoft SQL Server 的 SQL 方言 |
| INFORMATION_SCHEMA | SQL Server 标准系统视图，提供元数据查询接口 |

### 10.2 参考资料

- [MCP 规范 v1.0.0](https://spec.modelcontextprotocol.io/)
- [Microsoft SQL Server 文档](https://learn.microsoft.com/sql/)
- [SQL Server INFORMATION_SCHEMA 文档](https://learn.microsoft.com/sql/relational-databases/system-information-schema-views/)
- [aioodbc 文档](https://github.com/aio-libs/aioodbc)
- [DeepSeek API 文档](https://api-docs.deepseek.com/)
- [智谱AI API 文档](https://open.bigmodel.cn/dev/api)（代码默认 LLM）

---

**变更记录**

| 版本 | 日期 | 变更内容 | 作者 |
|-----|------|---------|------|
| v1.3 | 2026-05-15 | 根据实际代码更新：1) 数据库从 PostgreSQL 修正为 SQL Server（aioodbc+pyodbc） 2) LLM 从 glm-4.7 修正为 deepseek-v4-flash（.env 实际配置） 3) 更新危险函数列表为 SQL Server 版本 4) 分页语法从 LIMIT/OFFSET 改为 OFFSET/FETCH NEXT 5) 更新默认端口 1433 和 schema dbo 6) 更新待确认问题反映实际实现状态 | Claude |
| v1.2 | 2026-05-15 | 根据实际代码更新：1) 数据库从 PostgreSQL 更正为 SQL Server 2) 驱动从 asyncpg 更正为 aioodbc/pyodbc 3) 补充完整数据库需求章节（Schema模型、连接池、健康检查、安全配置） 4) 更新环境变量配置和端口号(1433) 5) 补充 SQL Server 危险函数列表 6) 补充 ODBC 连接字符串格式 | Claude |
| v1.1 | 2026-05-14 | 根据 code review 更新：1) 修正 LLM 为 GLM-4.6 2) 指定 MCP 协议版本 v1.0.0 3) 补充性能指标边界条件 4) 完善只读校验规则 5) 修正错误码为 MCP 标准 6) 补充 refresh_schema 工具定义 7) 补充验证机制说明 8) 添加查询示例 | Claude |
| v1.0 | 2026-05-14 | 初始版本 | Claude |