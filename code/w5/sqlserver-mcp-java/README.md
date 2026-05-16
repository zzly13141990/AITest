# sqlserver-mcp-java

基于 **MCP Java SDK** 的 SQL Server 自然语言查询服务。接收自然语言描述，利用 LLM (DeepSeek-v4-flash) 生成 T-SQL，经四层校验后返回 SQL 或查询结果。

**技术栈**: OpenJDK 26, MCP Java SDK v1.0.0, Maven, mssql-jdbc, HikariCP, JSqlParser, OkHttp, Jackson, SLF4J + Logback, Micrometer, OpenTelemetry

---

## 功能特性

| 特性 | 说明 |
|------|------|
| 自然语言 → SQL | 通过 LLM 将中文/英文自然语言转为 T-SQL 语句 |
| 四层校验 | L1 正则安全过滤 → L2 AST 语法校验 → L3 Parse-Only 验证 → L4 语义验证 |
| 两种模式 | `sql_only` 仅返回 SQL，`execute` 执行查询返回结果 |
| 自动分页 | OFFSET...FETCH 分页，支持 COUNT 总数查询 |
| 多数据源 | 同时管理多个 SQL Server 数据库连接池 |
| Schema 缓存 | 自动加载并缓存数据库表结构、列、索引、外键等元数据 |
| 可观测性 | 结构化 JSON 日志、审计日志（90 天轮转）、Micrometer 指标、OpenTelemetry 追踪 |
| 熔断保护 | LLM 调用自实现 CircuitBreaker，滑动窗口 50% 失败率触发熔断 |

## 快速开始

### 前置要求

- **JDK 26**（`--enable-preview`，需 Virtual Threads / Records / Sealed Classes 支持）
- **Maven 3.6+**（3.5.x 不支持 jmh-maven-plugin）
- **SQL Server** 实例（开发/测试用）
- **Docker**（可选，用于 Integration Test / E2E Test）

### 配置

创建 `application.yml`：

```yaml
database:
  sources:
    - name: mydb
      host: localhost
      port: 1433
      database: mydb
      username: readonly_user
      # 密码通过环境变量 DB_MYDB_PASSWORD 设置，不要写在 YAML 中

llm:
  api-base-url: https://api.deepseek.com/v1
  model: deepseek-v4-flash
  # API Key 通过环境变量 LLM_API_KEY 设置
```

### 环境变量

| 变量 | 说明 | 必需 |
|------|------|------|
| `LLM_API_KEY` | LLM API 密钥 | 是 |
| `DB_{NAME}_PASSWORD` | 数据库密码，`{NAME}` 为 sources 中声明的数据库名大写 | 按需 |
| `CONFIG_PATH` | 配置文件路径，默认 `./application.yml` | 否 |
| `LOG_LEVEL` | 日志级别，默认 `INFO` | 否 |
| `AUDIT_LOG_PATH` | 审计日志路径，默认 `./logs/audit` | 否 |

### 构建

```bash
# 编译
mvn compile

# 单元测试（208+ 测试用例）
mvn test

# 全部检查（单元测试 + PMD + Checkstyle）
mvn verify

# 集成测试（需 Docker）
mvn verify -P integration

# 静态分析
mvn verify -P lint

# OWASP 依赖漏洞扫描
mvn dependency-check:aggregate
```

### 运行

```bash
# 通过 Maven
mvn exec:java -Dexec.mainClass="com.sqlserver.mcp.SqlServerMcpApplication"

# 或使用 fat JAR
mvn package -DskipTests
java --enable-preview -jar target/sqlserver-mcp-1.0.0.jar

# 指定配置文件
java --enable-preview -jar target/sqlserver-mcp-1.0.0.jar --config /path/to/application.yml
```

服务启动后通过 **STDIO 传输** 与 MCP Client 通信（JSON-RPC 协议）。

---

## 架构总览

```
┌─ User (自然语言) ─────────────────────────────────────────────┐
│  "查询本月订单数量"                                            │
└───────────────────────────────────────────────────────────────┘
                            │
                    MCP Protocol (STDIO JSON-RPC)
                            │
                    ┌───────▼────────┐
                    │   QueryTool    │  ← MCP Tool 定义
                    └───────┬────────┘
                            │
                    ┌───────▼──────────────────┐
                    │  QueryPipelineService    │  ← 编排层
                    └───────┬──────────────────┘
                            │
          ┌─────────────────┬──────────────────────┐
          ▼                 ▼                      ▼
  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
  │ SchemaCache  │  │  LlmClient   │  │ Validation Chain │
  │ +Loader      │  │  +Retry      │  │ L1: Security     │
  │ +Context     │  │  +SqlExtract │  │ L2: SqlAst       │
  └──────────────┘  └──────────────┘  │ L3: ParseOnly    │
                                      │ L4: Meaning (opt)│
                                      └──────────────────┘
                                               │
                                      ┌────────▼────────┐
                                      │  QueryExecutor   │
                                      │  +Pagination     │
                                      │  +Collect        │
                                      │  +Format         │
                                      └─────────────────┘
```

### Pipeline 执行流程

```
Schema 加载 → Context 构建 → LLM 生成 SQL → SQL 提取
    → L1+L2 校验 → [Execute 模式] L3 校验 → 执行 → L4 语义验证 → 格式化
    → [SQL-Only 模式] 直接返回 SQL
```

---

## MCP Tool: `query`

### Tool 定义

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
        "description": "数据库名称，不指定则使用默认数据库"
      },
      "mode": {
        "type": "string",
        "enum": ["sql_only", "execute"],
        "description": "执行模式：sql_only 仅生成 SQL，execute 执行查询"
      },
      "page": {
        "type": "integer",
        "description": "页码，从 1 开始"
      },
      "pageSize": {
        "type": "integer",
        "description": "每页行数"
      },
      "outputFormat": {
        "type": "string",
        "enum": ["text", "json"],
        "description": "输出格式：text 或 json"
      }
    },
    "required": ["query"]
  }
}
```

### JSON-RPC 请求/响应示例

**Execute 模式（默认）**：

```json
// → 请求
{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"query","arguments":{"query":"查询所有用户的邮箱和注册时间","mode":"execute","page":1,"pageSize":10}}}

// ← 响应（Success，text 格式）
{"jsonrpc":"2.0","id":1,"result":{"content":[{"type":"text","text":"| email | registered_at |\n|-------|---------------|\n| user@example.com | 2024-01-15 |\n..."}]}}
```

**SQL-Only 模式**：

```json
// → 请求
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"query","arguments":{"query":"统计每个分类的商品数量","mode":"sql_only"}}}

// ← 响应
{"jsonrpc":"2.0","id":2,"result":{"content":[{"type":"text","text":"SELECT category, COUNT(*) AS cnt FROM products GROUP BY category ORDER BY cnt DESC"}]}}
```

**错误响应**：

```json
// → 请求（含危险操作）
{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"query","arguments":{"query":"删除users表"}}}

// ← 响应（L1 安全校验拦截）
{"jsonrpc":"2.0","id":3,"isError":true,"content":[{"type":"text","text":"{\"errorCode\":\"INVALID_INPUT\",\"message\":\"SQL contains forbidden keyword: DROP\",\"suggestion\":\"仅允许 SELECT 查询\",\"details\":{}}"}]}
```

**Tool 发现**：

```json
// → 请求
{"jsonrpc":"2.0","id":1,"method":"tools/list"}

// ← 响应
{"jsonrpc":"2.0","id":1,"result":{"tools":[{"name":"query","description":"根据自然语言查询 SQL Server 数据库...","inputSchema":{...}}]}}
```

---

## 项目结构

```
src/
├── main/java/com/sqlserver/mcp/
│   ├── SqlServerMcpApplication.java   # 入口 + 组合根（手动 DI）
│   ├── config/                         # 配置加载（YAML + 环境变量）
│   │   ├── AppConfig.java              #   全部配置 Record
│   │   ├── ConfigLoader.java           #   配置入口
│   │   └── YamlConfigLoader.java       #   YAML 解析
│   ├── model/
│   │   ├── schema/                     #   Schema Record（6 个）
│   │   ├── query/                      #   查询请求/响应 Record
│   │   └── error/                      #   sealed 异常层级（10 个子类）
│   ├── datasource/                     #   连接池管理
│   │   ├── ConnectionPoolManager.java
│   │   └── DataSourceFactory.java
│   ├── schema/                         #   元数据加载与缓存
│   │   ├── SchemaProvider.java         #     接口
│   │   ├── SchemaLoader.java           #     JDBC 并行加载
│   │   ├── SchemaCache.java            #     缓存 + single-flight
│   │   └── SchemaContextBuilder.java   #     LLM Context 构建
│   ├── llm/                            #   LLM 交互
│   │   ├── LlmClient.java              #     OpenAI 兼容 API
│   │   ├── LlmRetryHandler.java        #     重试 + 退避
│   │   ├── CircuitBreaker.java         #     轻量熔断器
│   │   ├── SqlExtractor.java           #     SQL 提取
│   │   ├── LlmResult.java              #     结果 Record
│   │   └── PromptBuilder.java          #     模板构建
│   ├── validation/                     #   四层校验
│   │   ├── SqlValidationRule.java      #     校验接口
│   │   ├── ValidationResult.java       #     Result Record
│   │   ├── SecurityValidator.java      #     L1 正则过滤
│   │   ├── SqlAstValidator.java        #     L2 JSqlParser
│   │   ├── ParseOnlyValidator.java     #     L3 SET PARSEONLY
│   │   ├── ResultMeaningValidator.java #     L4 语义（特征开关）
│   │   └── ValidationChainBuilder.java #     工厂
│   ├── execution/                      #   SQL 执行
│   │   ├── PaginationRewriter.java     #     分页重写
│   │   ├── QueryExecutor.java          #     执行器
│   │   ├── ResultCollector.java        #     结果收集（双上限保护）
│   │   ├── ResultFormatter.java        #     格式化接口
│   │   ├── TextFormatter.java          #     Markdown 表格
│   │   ├── JsonFormatter.java          #     JSON 格式
│   │   └── CollectResult.java          #     结果 Record
│   ├── pipeline/                       #   编排层
│   │   ├── QueryPipelineService.java   #     Pipeline
│   │   └── StageMetrics.java           #     阶段耗时
│   ├── tool/
│   │   └── QueryTool.java              #   MCP Tool 适配层
│   ├── observability/                  #   可观测性
│   │   ├── MetricsRegistry.java        #     Micrometer
│   │   └── OpenTelemetryConfig.java    #     OTel 配置
│   └── util/                           #   工具类
│       ├── JsonUtils.java              #     Jackson 单例
│       └── LogUtils.java              #     MDC 追踪
│
├── test/java/com/sqlserver/mcp/        # 60 个单测 + 4 JMH 基准
│   ├── config/  model/  datasource/
│   ├── schema/  llm/    validation/
│   ├── execution/       pipeline/
│   ├── tool/            observability/
│   ├── e2e/             benchmark/
│
└── resources/
    ├── application.yml                  # 默认配置模板
    └── logback.xml                     # 日志配置
```

---

## 配置参考

### application.yml 完整配置

```yaml
mcp:
  server-name: sqlserver-mcp          # MCP 服务名
  server-version: 1.0.0              # 版本号
  transport: stdio                    # 传输方式（当前仅 stdio）

database:
  schema-load-timeout: 3s             # Schema 加载超时
  schema-cache-max-tables: 500        # 缓存最大表数
  sources:                            # 数据源列表
    - name: mydb                      #   数据源名称
      host: localhost                 #   主机
      port: 1433                      #   端口（默认 1433）
      database: mydb                  #   数据库名
      username: readonly_user         #   用户名
      # password: 从环境变量读取       #   密码不写在 YAML
      min-pool-size: 2                #   最小连接数
      max-pool-size: 10               #   最大连接数
      connection-timeout: 5s          #   连接超时
      max-lifetime: 30m               #   连接最大存活
      leak-detection-threshold: 60s   #   连接泄漏检测

llm:
  api-base-url: https://api.deepseek.com/v1   # API 地址
  model: deepseek-v4-flash                    # 模型名
  # api-key: 从环境变量 LLM_API_KEY 读取
  temperature: 0.1                             # 生成温度
  max-tokens: 2000                             # 最大 Token
  timeout: 30s                                 # HTTP 超时
  max-retries: 3                               # 重试次数
  retry-delays: [1s, 3s, 9s]                   # 退避策略

query:
  default-page-size: 100             # 默认每页行数
  max-page-size: 10000               # 最大每页行数
  max-rows-total: 100000             # 最大总行数
  max-result-bytes: 52428800          # 最大结果字节数（50MB）
  features:
    result-meaning-validation: true   # L4 语义验证开关

observability:
  metrics:
    enabled: true                     # 启用指标
    jmx-enabled: false                # JMX 注册
  tracing:
    enabled: false                    # 链路追踪
    endpoint: ""                      # OTLP 端点
  logging:
    level: INFO                       # 日志级别
    audit-log-path: ./logs/audit      # 审计日志路径
```

---

## 测试

| 层级 | 运行方式 | 覆盖范围 | 前提 |
|------|---------|----------|------|
| 单元测试 | `mvn test` | 60 测试类, 208+ 用例, ≥ 95% 行覆盖 | 无 |
| 集成测试 | `mvn verify -P integration` | Schema 加载、SQL 执行 | Docker |
| E2E 测试 | `mvn verify -P integration`（需设 `e2e.enabled=true`） | 完整链路 | Docker |
| JMH 基准 | `mvn verify -P jmh`（需 Maven 3.6+） | 分页重写、结果格式化吞吐 | 无 |
| 静态分析 | `mvn verify -P lint` | Checkstyle + PMD + SpotBugs | 无 |
| 依赖扫描 | `mvn dependency-check:aggregate` | OWASP 漏洞（CVSS ≥7 阻断） | 无 |

### 测试层次详解

| 层级 | 框架 | 说明 |
|------|------|------|
| Unit | JUnit 5 + Mockito 5.14 | 每个 public 方法 ≥ 95% 行覆盖 |
| Integration | Testcontainers (MSSQL 2022) | Repository/Loader 集成验证 |
| E2E | MCP Java SDK Client | Golden path + 全部错误分支 |
| Benchmark | JMH 1.37 | Schema 加载、SQL 执行吞吐量 |

---

## 安全

### 四层校验体系

| 层级 | 名称 | 技术 | 拒绝策略 |
|------|------|------|---------|
| L1 | SecurityValidator | 正则 + Unicode NFC + 零宽字符剥离 | INVALID_INPUT |
| L2 | SqlAstValidator | JSqlParser AST | INVALID_INPUT |
| L3 | ParseOnlyValidator | `SET PARSEONLY ON` + 对象存在性检查 | SYNTAX_ERROR |
| L4 | ResultMeaningValidator | LLM 语义评分（特征开关） | 警告不拒绝 |

### 安全注意事项

- **密码管理**：数据库密码和 LLM API Key 必须通过环境变量注入，不允许硬编码在 YAML 中
- **只读保证**：L1 + L2 确保仅 SELECT/WITH 语句可通过，DML/DDL 被拦截
- **审计日志**：所有 SQL 执行写入独立审计文件，支持 90 天轮转保留
- **日志过滤**：日志中不打印 SQL 参数值或敏感数据

---

## 开发

### CLAUDE.md

项目根目录的 `CLAUDE.md` 定义了完整的编码规范，包括：

- Java 编码规范（OpenJDK 26 特性使用规则）
- SOLID 设计原则要求
- 测试规范与覆盖率红线
- 性能约束指标
- 提交前检查流程

详见 [CLAUDE.md](CLAUDE.md)（在 specs 目录的同名文档定义了初始规范）。

---

## 许可

本项目基于 MIT 许可证开源。
