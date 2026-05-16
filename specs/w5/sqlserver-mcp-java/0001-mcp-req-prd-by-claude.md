# sqlserver-mcp MCP Server 需求文档 (PRD)

**文档编号**: 0001-mcp-req-prd-by-claude.md
**版本**: v1.1
**日期**: 2026-05-16
**状态**: Draft
**MCP 协议版本**: v1.0.0

***

## 1. 项目概述

### 1.1 项目背景

用户需要一个基于 MCP (Model Context Protocol) 的 SQL Server 数据库查询服务，使用 **Java** 技术栈构建。该服务允许用户通过自然语言描述查询需求，服务端自动生成对应的 T-SQL 语句，并可选择返回 SQL 本身或执行后的查询结果。

### 1.2 核心价值

- **降低查询门槛**：非技术用户无需掌握 SQL 语法即可查询数据库
- **提高效率**：自然语言 → SQL 自动化，减少重复沟通成本
- **安全可控**：严格的只读校验，杜绝数据篡改风险
- **结果可信**：通过大模型双重验证 SQL 和结果的正确性与意义性

### 1.3 目标用户

- 数据分析师、产品经理等非技术背景用户
- AI Agent / LLM 应用开发者（如 Claude、Cursor 通过 MCP 协议调用）
- 需要快速查询 SQL Server 的开发人员
- 数据库管理员

***

## 2. 功能需求

### 2.1 核心功能

#### FR-1: 数据库发现与连接管理

| 需求描述 | MCP Server 启动时自动发现并连接配置的 SQL Server 数据库                                          |
| ---- | -------------------------------------------------------------------------------- |
| 优先级  | P0                                                                               |
| 输入   | 数据库连接配置列表（host, port, username, password, database, name）                        |
| 输出   | 各数据库的连接状态                                                                        |
| 验收标准 | - 支持连接多个数据库 - 使用 HikariCP 或同类 JDBC 连接池 - 连接失败时记录日志并标记该数据库不可用，不影响其他数据库 - 连接池参数可配置 |

#### FR-2: Schema 缓存

| 需求描述        | 启动时读取并缓存数据库的完整 Schema 信息                                                                                                                                                                                                                                       |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 优先级         | P0                                                                                                                                                                                                                                                             |
| 缓存内容        | - 表（Tables）- 视图（Views）- 列信息（Columns：名称、类型、可空、默认值、主键、外键、注释）- 索引（Indexes）- 用户定义类型（User-Defined Types）                                                                                                                                                            |
| 数据来源        | - `INFORMATION_SCHEMA.TABLES` / `INFORMATION_SCHEMA.COLUMNS`- `INFORMATION_SCHEMA.VIEWS`- `INFORMATION_SCHEMA.TABLE_CONSTRAINTS` / `KEY_COLUMN_USAGE`- `sys.indexes` / `sys.index_columns`- `sys.types`（用户定义类型）- `sys.extended_properties`（MS\_Description 注释） |
| 更新策略        | - 启动时全量加载- 支持通过重启 Server 触发刷新                                                                                                                                                                                                                                  |
| Schema 精简策略 | - 默认仅加载表名 + 列名 + 数据类型 + 主键/外键，省略默认值、注释、索引详情等非关键信息- 构建 Prompt 时按需筛选：仅包含与用户查询语义相关的表（基于表名和列名关键词匹配）- 当 Schema 序列化后的 Token 数超过模型上下文窗口的 50% 时，仅发送表名列表和关联表完整信息                                                                                                        |
| 验收标准        | - Schema 信息完整准确，涵盖表、视图、列、索引、类型- 中等规模数据库（< 100 表）加载时间 < 3s- Schema Token 总数不超过 4000 tokens（超出时按策略自动精简）                                                                                                                                                          |

#### FR-3: 自然语言转 SQL

| 需求描述     | 根据用户自然语言描述和缓存的 Schema 信息，调用大模型生成 T-SQL                                                                                                    |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 优先级      | P0                                                                                                                                        |
| 输入       | - 用户自然语言查询描述- 目标数据库名称-（可选）返回模式：SQL-only / Execute                                                                                         |
| 输出       | 生成的 T-SQL 语句                                                                                                                              |
| SQL 提取规则 | - 优先从 LLM 返回内容中提取 `sql ... `  代码块内的 SQL- 若无代码块，取返回内容中第一个以 SELECT/WITH 开头的语句- 去除 Markdown 标记、解释性文字前后缀- 提取失败时返回错误码 `LLM_OUTPUT_PARSE_ERROR` |
| 超时控制     | LLM API 调用独立超时：默认 30s，可配置                                                                                                                 |
| 验收标准     | - 生成的 SQL 语法正确（T-SQL 方言）- SQL 语义合理，符合用户意图- 支持 JOIN、聚合、子查询、窗口函数等复杂场景- Prompt 中注入 Schema 上下文                                                |

**Prompt 模板设计**（伪代码）：

```
System Prompt:
  你是 SQL Server (T-SQL) 数据库专家。
  你只生成 SELECT 查询语句，绝不生成 INSERT/UPDATE/DELETE/DDL 等任何修改数据的语句。
  数据库 Schema信息如下：
  {schema_context}

  约束：
  - 只返回 SQL 语句，不需要任何解释
  - 使用清晰的列别名
  - 默认 LIMIT 100

User Prompt:
  {user_query}
```

**查询示例**：

| 自然语言                     | 预期 T-SQL                                                                                                                                                       |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "统计上个月每个用户的订单数量"         | `SELECT user_id, COUNT(*) AS order_count FROM orders WHERE order_date >= DATEADD(MONTH, -1, GETDATE()) GROUP BY user_id`                                       |
| "找出余额大于1000且最近30天有交易的用户" | `SELECT DISTINCT u.* FROM users u INNER JOIN transactions t ON u.id = t.user_id WHERE u.balance > 1000 AND t.transaction_date >= DATEADD(DAY, -30, GETDATE())` |
| "所有部门的平均薪资，降序排列"         | `SELECT department_id, AVG(salary) AS avg_salary FROM employees GROUP BY department_id ORDER BY avg_salary DESC`                                               |

#### FR-4: SQL 只读校验

| 需求描述 | 校验 SQL 是否为只读查询，拒绝任何写入/修改操作                                                                                                                                                                                               |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 优先级  | P0                                                                                                                                                                                                                       |
| 校验规则 | 白名单模式：仅允许 `SELECT`、`WITH` 开头的语句**禁止**：INSERT、UPDATE、DELETE、MERGE、CREATE、ALTER、DROP、TRUNCATE、GRANT、REVOKE、EXEC、EXECUTE**禁止的危险对象**：`xp_cmdshell`、`sp_executesql`、`OPENROWSET`、`OPENDATASOURCE`、`OPENQUERY`、`BULK INSERT` 等 |
| 实现方式 | SQL 语法解析 + 正则前置过滤，双层防御                                                                                                                                                                                                   |
| 输出   | 校验通过 / 拒绝 + 原因                                                                                                                                                                                                           |
| 验收标准 | - 所有写操作被拦截- 错误信息清晰明确- 支持检测注释中的恶意 SQL 尝试                                                                                                                                                                                  |

#### FR-5: SQL 可执行性验证

| 需求描述 | 在执行前验证 SQL 的语法正确性和对象存在性                                                                                            |
| ---- | ------------------------------------------------------------------------------------------------------------------ |
| 优先级  | P1                                                                                                                 |
| 验证方式 | - 使用 SQL Server `SET PARSEONLY ON` 验证语法- 或使用 `sys.dm_exec_describe_first_result_set` 验证输出结构- 对照缓存 Schema 验证表和列是否存在 |
| 输出   | 验证通过 / 失败 + 具体错误位置与修复建议                                                                                            |
| 验收标准 | - 无效 SQL 被拦截- 引用了不存在的表/列时给出明确提示                                                                                    |

#### FR-6: 结果意义性验证

| 需求描述 | 调用大模型验证生成的 SQL 和查询结果是否与用户意图一致                        |
| ---- | ---------------------------------------------------- |
| 优先级  | P1                                                   |
| 验证流程 | 用户自然语言描述 + 生成的 SQL + 结果样本 → 大模型打分                    |
| 输出   | 一致性评分（如 0-1）+ 理由                                     |
| 阈值行为 | - 评分 >= 0.8：视为有意义，正常返回- 评分 < 0.8：警告用户结果可能不符合预期，但仍可返回 |
| 验收标准 | - 有意义的结果不会被误判为无意义- 明显错误的结果（如查用户却返回了表结构）被识别           |

#### FR-7: 双模式返回

| 需求描述 | 支持两种返回模式：返回 SQL 或返回查询结果                              |
| ---- | ---------------------------------------------------- |
| 优先级  | P0                                                   |
| 模式   | - `sql_only`：仅返回生成的 SQL，不执行- `execute`：执行 SQL 并返回结果集 |
| 选择方式 | 通过 `query` 工具参数的 `mode` 字段指定，默认 `execute`            |
| 验收标准 | - 两种模式正确响应- `sql_only` 模式不产生任何数据库查询                  |

#### FR-8: 结果分页

| 需求描述 | 对查询结果支持分页返回                                  |
| ---- | -------------------------------------------- |
| 优先级  | P1                                           |
| 参数   | page（从 1 开始）, page\_size                     |
| 分页方式 | 使用 `OFFSET ? ROWS FETCH NEXT ? ROWS ONLY` 语法 |
| 验收标准 | - 分页逻辑正确- 返回总结果数                             |

***

### 2.2 MCP 接口定义

> **说明**：本期仅实现 `query` 工具，其他工具根据后续需求扩展。

#### FR-9: `query` Tool

```json
{
  "name": "query",
  "description": "根据自然语言查询 SQL Server 数据库，返回 SQL 或查询结果",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "自然语言查询描述"
      },
      "database": {
        "type": "string",
        "description": "目标数据库名称（可选，默认使用第一个可用数据库）"
      },
      "mode": {
        "type": "string",
        "enum": ["sql_only", "execute"],
        "description": "返回模式：仅返回 SQL 或执行并返回结果",
        "default": "execute"
      },
      "page": {
        "type": "integer",
        "description": "页码（从 1 开始），仅 execute 模式有效",
        "default": 1,
        "minimum": 1
      },
      "page_size": {
        "type": "integer",
        "description": "每页结果数，仅 execute 模式有效",
        "default": 100,
        "minimum": 1,
        "maximum": 10000
      },
      "output_format": {
        "type": "string",
        "enum": ["text", "json"],
        "description": "结果输出格式：text（Markdown 表格）或 json（结构化数据）",
        "default": "text"
      }
    },
    "required": ["query"]
  }
}
```

**结果集 JSON 格式**：

```json
{
  "columns": ["column_name1", "column_name2", ...],
  "rows": [
    ["value1", "value2", ...],
    ["value1", "value2", ...]
  ],
  "total_rows": 100
}
```

> 注：`text` 字段根据 `output_format` 参数渲染。`json` 格式输出上述 JSON 结构；`text`（默认）格式化为 Markdown 表格。

**输出格式**（成功响应）：

```json
{
  "content": [
    {
      "type": "text",
      "text": "查询结果（Markdown 表格或 JSON）..."
    }
  ],
  "meta": {
    "database": "database_name",
    "mode": "execute",
    "sql": "SELECT ...",
    "row_count": 42,
    "total_rows": 100,
    "page": 1,
    "page_size": 100,
    "verification_score": 0.95,
    "verification_passed": true,
    "execution_time_ms": 150
  }
}
```

**输出格式**（失败响应）：

```json
{
  "content": [
    {
      "type": "text",
      "text": "查询被拒绝：检测到写入操作（INSERT），当前仅允许 SELECT 查询。"
    }
  ],
  "isError": true,
  "meta": {
    "errorCode": "READ_ONLY_VIOLATION",
    "details": {
      "detectedKeyword": "INSERT"
    },
    "suggestion": "请修改为 SELECT 查询"
  }
}
```

***

## 3. 数据库需求

### 3.1 数据库类型

| 项目          | 说明                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| 数据库类型       | SQL Server                                                                                             |
| 默认端口        | 1433                                                                                                   |
| 默认 Schema   | dbo                                                                                                    |
| 驱动          | Microsoft JDBC Driver for SQL Server                                                                   |
| SQL 方言      | T-SQL (Transact-SQL)                                                                                   |
| JDBC URL 格式 | `jdbc:sqlserver://host:port;databaseName=db;encrypt=false;trustServerCertificate=true;loginTimeout=30` |

### 3.2 Schema 数据模型

**ColumnInfo**：

| 字段              | 类型      | 说明              |
| --------------- | ------- | --------------- |
| name            | String  | 列名              |
| dataType        | String  | SQL Server 数据类型 |
| isNullable      | boolean | 是否可空            |
| defaultValue    | String  | 默认值             |
| ordinalPosition | int     | 列序号             |
| maxLength       | Integer | 字符最大长度          |
| isPrimaryKey    | boolean | 是否为主键           |
| isForeignKey    | boolean | 是否为外键           |
| foreignKeyRef   | String  | 外键引用信息          |
| comment         | String  | 列注释             |

**TableInfo**：

| 字段               | 类型                    | 说明               |
| ---------------- | --------------------- | ---------------- |
| name             | String                | 表名               |
| schema           | String                | Schema 名（默认 dbo） |
| columns          | List\[ColumnInfo]     | 列信息列表            |
| primaryKeys      | List\[String]         | 主键列名列表           |
| foreignKeys      | List\[ForeignKeyInfo] | 外键信息列表           |
| indexes          | List\[IndexInfo]      | 索引信息列表           |
| comment          | String                | 表注释              |
| rowCountEstimate | Long                  | 行数估算             |

**ViewInfo**：

| 字段         | 类型                | 说明       |
| ---------- | ----------------- | -------- |
| name       | String            | 视图名      |
| schema     | String            | Schema 名 |
| definition | String            | 视图定义 SQL |
| columns    | List\[ColumnInfo] | 列信息      |

**IndexInfo**：

| 字段       | 类型            | 说明                             |
| -------- | ------------- | ------------------------------ |
| name     | String        | 索引名                            |
| type     | String        | 索引类型（CLUSTERED / NONCLUSTERED） |
| columns  | List\[String] | 索引列                            |
| isUnique | boolean       | 是否唯一索引                         |

**DatabaseSchema**：

| 字段               | 类型                      | 说明         |
| ---------------- | ----------------------- | ---------- |
| databaseName     | String                  | 数据库名       |
| tables           | Map\<String, TableInfo> | 表名 → 表信息   |
| views            | Map\<String, ViewInfo>  | 视图名 → 视图信息 |
| userDefinedTypes | List<String>            | 用户定义类型列表   |
| cachedAt         | Instant                 | 缓存时间戳      |

### 3.3 Schema 加载 SQL

```sql
-- 表清单
SELECT TABLE_SCHEMA, TABLE_NAME, TABLE_TYPE
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_SCHEMA = 'dbo';

-- 列信息
SELECT
    c.TABLE_SCHEMA, c.TABLE_NAME, c.COLUMN_NAME, c.DATA_TYPE,
    c.IS_NULLABLE, c.COLUMN_DEFAULT, c.ORDINAL_POSITION,
    c.CHARACTER_MAXIMUM_LENGTH,
    ep.value AS COMMENT
FROM INFORMATION_SCHEMA.COLUMNS c
LEFT JOIN sys.extended_properties ep
    ON ep.major_id = OBJECT_ID(c.TABLE_SCHEMA + '.' + c.TABLE_NAME)
    AND ep.minor_id = COLUMNPROPERTY(OBJECT_ID(c.TABLE_SCHEMA + '.' + c.TABLE_NAME), c.COLUMN_NAME, 'ColumnId')
    AND ep.name = 'MS_Description'
WHERE c.TABLE_SCHEMA = 'dbo';

-- 主键
SELECT
    tc.TABLE_SCHEMA, tc.TABLE_NAME, kcu.COLUMN_NAME
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
    ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY' AND tc.TABLE_SCHEMA = 'dbo';

-- 外键
SELECT
    tc.TABLE_SCHEMA, tc.TABLE_NAME, kcu.COLUMN_NAME,
    ccu.TABLE_SCHEMA AS REFERENCED_SCHEMA,
    ccu.TABLE_NAME AS REFERENCED_TABLE,
    ccu.COLUMN_NAME AS REFERENCED_COLUMN
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE ccu ON tc.CONSTRAINT_NAME = ccu.CONSTRAINT_NAME
WHERE tc.CONSTRAINT_TYPE = 'FOREIGN KEY' AND tc.TABLE_SCHEMA = 'dbo';

-- 索引
SELECT
    t.name AS TABLE_NAME, i.name AS INDEX_NAME,
    i.type_desc AS INDEX_TYPE, i.is_unique,
    c.name AS COLUMN_NAME, ic.key_ordinal
FROM sys.tables t
JOIN sys.indexes i ON t.object_id = i.object_id
JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.type > 0 AND t.schema_id = SCHEMA_ID('dbo');

-- 视图
SELECT TABLE_SCHEMA, TABLE_NAME, VIEW_DEFINITION
FROM INFORMATION_SCHEMA.VIEWS
WHERE TABLE_SCHEMA = 'dbo';

-- 用户定义类型
SELECT name, schema_id
FROM sys.types
WHERE is_user_defined = 1;
```

***

## 4. 非功能需求

### 4.1 性能需求

| 需求项         | 要求                                 |
| ----------- | ---------------------------------- |
| Schema 加载时间 | 中等规模数据库（< 100 表）< 3s               |
| SQL 生成时间    | 简单查询 < 5s，复杂查询 < 15s（取决于 LLM 响应速度） |
| SQL 执行超时    | 可配置，默认 30s                         |
| 并发支持        | >= 10 并发查询                         |
| 连接池大小       | 默认每库 min=2, max=10                 |

### 4.2 安全需求

| 需求项      | 要求                     |
| -------- | ---------------------- |
| 只读限制     | 严格执行，禁止任何写入操作（详见 FR-4） |
| 权限隔离     | MCP Server 使用只读数据库账号   |
| 敏感信息保护   | 密码、API Key 等使用安全存储方式   |
| SQL 注入防御 | 参数化查询 + 多层校验           |

### 4.3 可靠性需求

| 需求项   | 要求                   |
| ----- | -------------------- |
| 连接池管理 | 健康检查、自动重连            |
| 错误处理  | 完善的错误分类和用户友好提示       |
| 降级策略  | LLM 不可用时给出明确错误，不静默失败 |

### 4.4 可维护性需求

| 需求项    | 要求                               |
| ------ | -------------------------------- |
| 日志     | 结构化日志（SLF4J + Logback），包含请求追踪 ID |
| 配置     | 外部化配置，支持环境变量 / 配置文件              |
| 应用健康检查 | 提供 MCP Server 资源或 Ping 端点        |

***

## 5. 技术约束

### 5.1 技术栈

| 组件            | 技术选择                                              |
| ------------- | ------------------------------------------------- |
| 编程语言          | openJdk 26（利用 Virtual Threads 处理 JDBC 阻塞调用）       |
| MCP SDK       | MCP Java SDK (官方 Java 实现，v0.7.0+)                 |
| MCP Transport | stdio（标准输入输出），后续可扩展 SSE                           |
| 构建工具          | Maven 3.9.6+                                       |
| 数据库驱动         | Microsoft JDBC Driver for SQL Server (mssql-jdbc) |
| 连接池           | HikariCP（每数据库一个独立连接池实例）                           |
| LLM 客户端       | OpenAI Java SDK 或 OkHttp / Spring WebClient       |
| 大模型           | DeepSeek-v4-flash（OpenAI 兼容 API）                  |
| JSON 处理       | Jackson                                           |
| 日志            | SLF4J + Logback                                   |
| 测试            | JUnit 5 + Mockito + Testcontainers                |

**MCP Java SDK 说明**：

MCP Java SDK 提供 `McpServer` 和 `McpClient` 两个核心入口。服务端实现需：

- 继承或使用 `McpServer` 工厂创建服务端实例
- 通过 `McpServer.ToolSpecification` 或注解定义 Tool
- 使用 **stdio** 传输（标准输入输出），与 MCP 客户端通过标准 I/O 进行 JSON-RPC 通信
- Java 17+ Virtual Threads 用于处理 JDBC 阻塞操作：利用 `Executors.newVirtualThreadPerTaskExecutor()` 隔离连接池中的阻塞调用

### 5.2 LLM 配置

| 配置项          | 默认值                           | 说明               |
| ------------ | ----------------------------- | ---------------- |
| API Base URL | `https://api.deepseek.com/v1` | OpenAI 兼容 API 端点 |
| Model        | `deepseek-v4-flash`           | 模型名称             |
| Temperature  | 0.1                           | 低温度确保 SQL 生成的确定性 |
| Max Tokens   | 2000                          | 最大生成 token 数     |
| Timeout      | 30s                           | HTTP 请求超时        |

### 5.3 架构约束

- **单一工具**：本期仅暴露 `query` 一个 MCP Tool
- **无状态**：MCP Server 不存储用户状态，查询历史等非本期需求
- **Schema 缓存生命周期**：缓存随 Server 生命周期，启动加载，运行期可触发刷新

***

## 6. 安全设计

### 6.1 SQL 校验流程（四层防御）

```
Layer 1 - 正则预检
    ↓   危险关键字 / 危险函数匹配（辅助防御，可能被编码绕过）
    ↓   命中则直接拒绝
Layer 2 - 语法解析校验
    ↓   解析 SQL AST，验证语句类型
    ↓   仅允许 SELECT / WITH，拒绝其他所有类型
Layer 3 - 执行前验证
    ↓   SET PARSEONLY ON / sys.dm_exec_describe_first_result_set
    ↓   对照 Schema 验证表和列存在性
Layer 4 - 结果意义性验证
    ↓   调用 LLM 对比用户意图、SQL 和结果样本
    ↓   评分 >= 阈值（默认 0.8）视为有意义
```

> **防御补充说明**：
>
> - Layer 1 正则预检是快速过滤层，不能作为唯一防御手段。恶意输入可通过注释、编码等方式绕过正则匹配，后续 Layer 2/3 才是核心防御。
> - Layer 3 失败时返回 `SQL_SYNTAX_ERROR` 或 `SQL_OBJECT_NOT_FOUND`，不自动修正。
> - Layer 4 失败（评分低于阈值）时仍返回结果但附带警告信息，由调用方决定是否使用。

### 6.2 危险对象列表

```sql
-- 系统存储过程（禁止调用）
xp_cmdshell, xp_delete_file, xp_regread, xp_regwrite,
xp_regdeletevalue, xp_regdeletekey, xp_grantlogin,
xp_enumgroups, xp_loginconfig, xp_logininfo,
xp_servicecontrol, xp_terminate_process,
sp_configure, sp_executesql

-- 危险函数/关键字
OPENROWSET, OPENDATASOURCE, OPENQUERY,
BULK INSERT, INSERT, UPDATE, DELETE, MERGE,
CREATE, ALTER, DROP, TRUNCATE,
GRANT, REVOKE, DENY,
EXEC, EXECUTE
```

***

## 7. 错误处理

### 7.1 错误码

| 错误码                       | HTTP类比 | 说明                             |
| ------------------------- | ------ | ------------------------------ |
| INVALID\_INPUT            | 400    | 输入参数校验失败                       |
| READ\_ONLY\_VIOLATION     | 403    | SQL 包含非只读操作                    |
| SQL\_SYNTAX\_ERROR        | 400    | SQL 语法错误                       |
| SQL\_OBJECT\_NOT\_FOUND   | 404    | 引用的表或列不存在                      |
| QUERY\_TIMEOUT            | 504    | 查询执行超时                         |
| DB\_CONNECTION\_ERROR     | 503    | 数据库连接失败                        |
| LLM\_API\_ERROR           | 502    | LLM API 调用失败（网络超时、API Key 失效等） |
| LLM\_OUTPUT\_PARSE\_ERROR | 500    | LLM 返回内容无法提取出有效的 SQL 语句        |
| SCHEMA\_NOT\_FOUND        | 404    | 未找到指定数据库的 Schema               |
| INTERNAL\_ERROR           | 500    | 内部错误                           |

### 7.2 错误响应格式

```json
{
  "isError": true,
  "content": [
    {
      "type": "text",
      "text": "查询被拒绝：检测到写入操作（INSERT），当前仅允许 SELECT 查询。"
    }
  ],
  "meta": {
    "errorCode": "READ_ONLY_VIOLATION",
    "details": {
      "detectedKeyword": "INSERT"
    },
    "suggestion": "请修改为 SELECT 查询"
  }
}
```

***

## 8. 处理流程

### 8.1 SQL-only 模式

```
用户输入 (query + database)
    → 获取数据库 Schema 缓存
    → 构建 Prompt（System Prompt + Schema Context + User Query）
    → 调用 LLM 生成 T-SQL
    → 提取/解析 SQL（处理代码块、Markdown 等）
    → 校验通过？ → Layer 1: 正则预检
                 → Layer 2: 语法解析校验（AST）
    → 返回生成的 SQL / 或错误信息
```

### 8.2 Execute 模式

```
用户输入 (query + database + page + page_size)
    → 获取数据库 Schema 缓存
    → 构建 Prompt → 调用 LLM 生成 T-SQL
    → 提取/解析 SQL
    → Layer 1: 正则预检
    → Layer 2: 语法解析校验（AST）
    → Layer 3: SET PARSEONLY ON + 对象存在性验证
    → 执行 SQL（含 OFFSET...FETCH NEXT 分页）
    → Layer 4: 结果意义性验证（LLM 采样评估前 N 行）
    → 格式化结果并返回
```

***

## 9. 验收标准

### 9.1 功能验收

- [ ] MCP Server 启动成功，自动加载所有配置的数据库 Schema 缓存
- [ ] Schema 缓存正确包含表、视图、列、索引、类型信息
- [ ] 自然语言输入能正确生成 T-SQL（测试 5+ 不同场景）
- [ ] 生成的 SQL 通过只读校验（测试 5+ 写操作被拦截）
- [ ] Execute 模式下正确返回分页查询结果
- [ ] SQL-only 模式仅返回 SQL 不执行查询
- [ ] 结果意义性验证正常工作

### 9.2 安全验收

- [ ] INSERT / UPDATE / DELETE / DROP 等写操作全部被拦截
- [ ] `xp_cmdshell` 等危险函数被拦截
- [ ] 通过 SQL 注释注入的恶意语句被检测
- [ ] 非 SELECT / WITH 开头的语句被拒绝

### 9.3 性能验收

- [ ] Schema 加载满足时间要求
- [ ] 10 并发查询稳定运行

***

## 10. 待确认问题

| 编号     | 问题                                       | 建议方案                                                        | 优先级   |
| ------ | ---------------------------------------- | ----------------------------------------------------------- | ----- |
| Q1     | MCP Java SDK 是否使用 Spring Boot 集成还是裸 SDK？ | 建议裸 MCP Java SDK + 手动依赖管理，减少 Spring 依赖体积                    | 高     |
| Q2     | 是否要支持 Windows 集成认证（Integrated Security）？ | 初期仅支持 SQL Server 账号密码认证                                     | 中     |
| Q3     | Schema 中 RowCount 估算是否必要？LLM 是否需要此信息？    | 可省略，对 SQL 生成质量无显著影响                                         | 低     |
| Q4     | 缓存刷新机制：定时刷新 vs 手动触发？                     | 建议手动触发，减少启动后不必要的 DB 查询                                      | 中     |
| Q5     | 是否需要支持跨数据库查询？                            | 初期限于单数据库查询                                                  | 低     |
| **Q6** | **MCP Transport 选择：stdio 还是 SSE？**       | **建议 stdio（本期），后续可扩展 SSE。stdio 适合本地 CLI/AI Agent 集成，部署最简单** | **高** |
| **Q7** | **LLM 调用失败的重试策略？**                       | **建议最多 3 次，指数退避（1s, 3s, 9s），超过则返回** **`LLM_API_ERROR`**     | **中** |

***

## 11. 附录

### 11.1 术语表

| 术语       | 定义                                         |
| -------- | ------------------------------------------ |
| MCP      | Model Context Protocol，模型上下文协议             |
| Schema   | 数据库结构信息，包括表、视图、列、索引等                       |
| T-SQL    | Transact-SQL，Microsoft SQL Server 的 SQL 方言 |
| HikariCP | 高性能 JDBC 连接池                               |
| JDBC     | Java Database Connectivity，Java 数据库连接标准    |
| LLM      | Large Language Model，大语言模型                 |
| Prompt   | 发送给大模型的指令文本，包含上下文和任务描述                     |

### 11.2 参考资料

- [MCP 规范 v1.0.0](https://spec.modelcontextprotocol.io/)
- [MCP Java SDK](https://github.com/modelcontextprotocol/java-sdk)
- [Microsoft JDBC Driver for SQL Server](https://learn.microsoft.com/sql/connect/jdbc/)
- [HikariCP](https://github.com/brettwooldridge/HikariCP)
- [DeepSeek API 文档](https://api-docs.deepseek.com/)
- [SQL Server INFORMATION\_SCHEMA](https://learn.microsoft.com/sql/relational-databases/system-information-schema-views/)

***

## 12. 审查摘要

**审查日期**: 2026-05-16 | **审查结论**: 有条件通过 | **审查文件**: `0001-mcp-req-prd-review-claude.md`

### 关键发现

| 严重程度 | 数量 | 核心问题 |
|----------|------|----------|
| Critical | 2 | Schema Token 预算矛盾（4000 tokens 不足以描述 100 表 Schema）；"无状态"表述不严谨（Schema 缓存也是一种状态） |
| High | 5 | 结果验证缺少采样行数定义；巨量结果集截断策略缺失；并发下缓存一致性；只读账号权限粒度；API Key 安全存储方式 |
| Medium | 5 | 危险对象列表分层标注；Schema 关键词匹配精度；重试策略未体现在流程图中；分页 OFFSET 公式；注释查询性能 |
| Low/Info | 10 | 参数冗余、数据模型清理、SQL 排序、Temperature 调优建议等 |

### 待处理事项

- **v1.2 前修复**: 修正 Schema Token 预算定义、补充缓存并发策略、细化只读账号权限
- **建议修复**: 定义采样行数、增加结果集上限、明确 API Key 存储方案、同步重试策略到流程图
- **可优化**: 分层标注危险对象、增加分页公式说明、补充 ORDER BY、移除未实现的 rowCountEstimate

> 详细审查报告见 `0001-mcp-req-prd-review-claude.md`。

***

**变更记录**

| 版本   | 日期         | 变更内容                                                                                                                                                                                                                                                                                                                                                                          | 作者     |
| ---- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| v1.1 | 2026-05-16 | 根据审查结果更新：1) MCP 响应字段 `metadata` → `meta`，统一命名规范2) 增加结果集 JSON 格式定义（columns + rows）3) FR-3 补充 Prompt 模板设计和 LLM 输出 SQL 提取规则4) FR-2 补充 Schema 过大时的精简策略5) §5.1 指定 Transport（stdio）、Virtual Threads、Maven 3.9.6+6) §6.1 三层防御 → 四层防御（L1-L4），补充防御说明7) §7.1 新增错误码 `LLM_OUTPUT_PARSE_ERROR`8) §8 流程对齐四层防御，补充 SQL 提取步骤9) §1.3 增加 AI Agent / LLM 应用开发者作为目标用户10) §10 新增 Q6 Transport 选择和 Q7 重试策略 | Claude |
| v1.0 | 2026-05-16 | 初始版本，基于 pg-mcp PRD 改编为 Java + SQL Server 版本。核心变更：1) 技术栈从 Python/FastMCP 改为 Java/MCP Java SDK2) 数据库驱动从 aioodbc 改为 JDBC + HikariCP3) 删除非本期需要的工具（仅保留 query）4) SQL Server 特有 Schema 查询 SQL5) 适配 T-SQL 分页语法（OFFSET...FETCH NEXT）                                                                                                                                                   | Claude |

