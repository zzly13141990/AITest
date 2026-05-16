# sqlserver-mcp-java 实现计划

**文档编号**: 0003-sqlserver-mcp-plan-by-claude.md
**版本**: v1.1
**日期**: 2026-05-17
**状态**: Draft
**前置文档**: 0002-pg-mcp-design-by-claude.md (设计文档), CLAUDE.md (项目规范)

---

## 1. 总体策略

### 1.1 构建原则

- **自底向上, 模块独立**: 每层不依赖上层模块，可在编译期独立验证
- **可测试优先**: 每个模块交付时附带对应层次测试 (单元/集成)
- **纯 Maven, 零框架**: 组合根手动 new 所有依赖，无 Spring/Guice
- **增量可运行**: Phase 0 即可 `mvn compile` 成功; Phase 6 即可 `mvn exec:java` 启动 MCP Server

### 1.2 依赖关系图

```
Phase 0 脚手架 (含基础日志配置)
   │
   ▼
Phase 1 基础层 (config → model → datasource → util + logging)
   │
   ├──────────────────────────────────┐
   │                                  │
   ▼                                  ▼
Phase 2 Schema 模块           Phase 4a Validation L1-L3
   │                                  │
   ▼                                  │
Phase 3 LLM 模块 ──────┐            │
   │                   │            │
   ▼                   ▼            ▼
Phase 5 Execution  ← Phase 4b Validation L4 (依赖 LlmClient)
   │
   ▼
Phase 6 Pipeline 编排
   │
   ▼
Phase 7 Tool + 组合根 (入口可运行)
   │
   ▼
Phase 8 可观测性指标 & 追踪 (延续 Phase 0/1 的日志基础)
   │
   ▼
Phase 9 测试全覆盖 (JMH 基准, 故障注入)
   │
   ▼
Phase 10 文档 & 收尾
```

**依赖澄清**:
- Phase 2 (Schema) 和 Phase 3 (LLM) 无相互依赖, 可并行开发
- Phase 4a (L1-L3) 不依赖 Phase 3, 可提前开始
- Phase 4b (L4 ResultMeaningValidator) 依赖 Phase 3 LlmClient, 安排在 Phase 3 之后
- Phase 8 指标/追踪延续 Phase 0/1 已就位的日志基础设施, 本身只管 Registry 配置和埋点注册
- Phase 9 贯穿全部 Phase, 但集中补充 JMH 基准和故障注入场景

### 1.3 交付里程碑

| 里程碑 | 产出 | 判断标准 |
|--------|------|----------|
| M0 项目骨架 | pom.xml, 空包结构, ConfigLoader | `mvn compile` 通过 |
| M1 基础层完成 | model, datasource, util | 单元测试通过 |
| M2 Schema 可用 | SchemaLoader + SchemaCache | 集成测试 (Testcontainers) 通过 |
| M3 LLM 可用 | LlmClient + SqlExtractor | Mock 测试通过 |
| M4 安全 + 执行 | 全四层校验 + SQL 执行 | 集成测试全过 |
| M5 Pipeline 完成 | QueryPipelineService 编排 | 单测全过 + E2E (Mock LLM) |
| M6 MCP Server 可运行 | 组合根 + StdioServerTransport | `mvn exec` 启动 + MCP Client 联调 |
| M7 可观测 | Micrometer + OTel + Audit | 启动后指标暴露 |
| M8 交付 | 全部测试 + 文档 | `mvn verify` 全过 |

### 1.4 风险驱动的实现顺序决策

设计文档 R1-R6 风险中:
- **R2 (JSqlParser T-SQL 兼容性)** 影响 Phase 4 L2 校验 → **Phase 4 中** 先验证 JSqlParser 对 SQL Server 方言的解析能力，若兼容性不足则调整 L2 降级策略
- **R6 (LLM 不可用)** 影响 Phase 3 + Phase 4 → CircuitBreaker **随 LlmClient 一起实现**, 不走回头路
- **R4 (大结果集内存)** 影响 Phase 5 → ResultCollector **从第一天** 就实现双上限保护, 不后续补丁
- **R1 (L4 延迟)** 特征开关控制 → Pipeline 层 Optional 包装, 默认配置关闭

---

## 2. Phase 0: 项目脚手架

**目标**: Maven 项目可编译, 包目录结构就位, 配置加载可用。

### 2.1 任务清单

```
Task 0.1: 创建 pom.xml
  → 声明所有依赖 (MCP SDK, mssql-jdbc, HikariCP, JSqlParser, OkHttp, Jackson,
    SLF4J+Logback, JSpecify, Micrometer, OpenTelemetry, JUnit5, Mockito,
    Testcontainers, JMH)
  → 配置 maven-compiler-plugin source/target=26, --enable-preview
  → 配置 maven-surefire-plugin (单元测试)
  → 配置 maven-failsafe-plugin (集成测试, -P integration)
  → 配置 checkstyle, pmd, spotbugs, error-prone 插件 (-P lint)
  → 配置文件 3 层 profile (default/integration/lint)

Task 0.2: 创建包目录结构
  → com/sqlserver/mcp/
  → com/sqlserver/mcp/config/
  → com/sqlserver/mcp/model/schema/
  → com/sqlserver/mcp/model/query/
  → com/sqlserver/mcp/model/error/
  → com/sqlserver/mcp/datasource/
  → com/sqlserver/mcp/schema/
  → com/sqlserver/mcp/llm/
  → com/sqlserver/mcp/validation/
  → com/sqlserver/mcp/execution/
  → com/sqlserver/mcp/pipeline/
  → com/sqlserver/mcp/tool/
  → com/sqlserver/mcp/util/
  → test 镜像目录

Task 0.3: 实现 ConfigLoader
  → YamlConfigLoader(Jackson YAML) + EnvVarOverride + 默认值合并
  → 支持 CONFIG_PATH 环境变量指定 YAML 路径
  → 密码/Key 强制从环境变量读取，YAML 中读到的做 WARN 日志

Task 0.4: 实现 AppConfig 全部 Record POJO
  → 按设计文档 §2.1 全部 Record 定义
  → 实现默认值工厂方法 AppConfig.defaults()
  → 实现测试用 AppConfig.testConfig() (内嵌 Testcontainers 端口)

Task 0.5: 配置基础日志设施
  → logback.xml: 控制台 Appender + JSON 格式 (LogstashEncoder)
  → 基础 MDC 配置 (requestId, database, stage)
  → LogUtils 工具类 (MDC put/get/clear, 请求追踪 ID 生成)
  → 注: 审计日志 Appender 和 OTel 延后到 Phase 8

Task 0.6: 验证: `mvn compile` 通过
```

### 2.2 输出文件

```
pom.xml
src/main/java/com/sqlserver/mcp/package-info.java          (@NullMarked)
src/main/java/com/sqlserver/mcp/config/ConfigLoader.java
src/main/java/com/sqlserver/mcp/config/AppConfig.java       (含全部子 Record)
src/main/java/com/sqlserver/mcp/config/YamlConfigLoader.java
src/main/java/com/sqlserver/mcp/util/LogUtils.java           (MDC 工具, 先于大多数模块)
src/main/resources/logback.xml                               (基础日志配置)
src/main/resources/application.yml                          (默认配置模板)
src/test/java/com/sqlserver/mcp/config/YamlConfigLoaderTest.java
```

### 2.3 风险点

- `maven-compiler-plugin` `--enable-preview` 在 JDK 26 参数: 确认 `--release 26 --enable-preview` 兼容性
- MCP Java SDK v0.7+ 在 Maven Central 坐标确认: `io.modelcontextprotocol:mcp:0.7.0`

---

## 3. Phase 1: 基础层 (model + datasource + util)

**目标**: 核心数据模型、连接池管理、工具类就位。

### 3.1 任务清单

```
Task 1.1: 实现 model/schema/ 全部 Record
  → DatabaseSchema, TableInfo, ColumnInfo, ViewInfo, IndexInfo, ForeignKeyInfo
  → 所有 Map/List 字段返回不可变副本 (防御性复制)
  → SchemaContext: Schema 上下文中使用的轻量包装

Task 1.2: 实现 model/query/ 全部 Record
  → QueryRequest (含 Validation 注解校验或手动校验)
  → QueryResponse sealed interface: Success, SqlOnly, Error
  → QueryResponse.Meta, ExecutionResult

Task 1.3: 实现 model/error/ 全部 sealed 异常层级
  → McpException (sealed abstract)
  → 10 个具体子类 (InvalidInputException, ReadOnlyViolationException,
    SqlSyntaxException, SqlObjectNotFoundException, QueryTimeoutException,
    DbConnectionException, LlmApiException, LlmOutputParseException,
    SchemaNotFoundException, InternalException)
  → 每个子类构造器固化 errorCode 和 suggestion
  → toCallToolResult() 方法 (MCP 错误响应格式)
  → **retryable 标记**: McpException 增加 `boolean isRetryable()` 方法
    - 网络/限流类异常 (LlmApiException, DbConnectionException, QueryTimeoutException) → true
    - 输入/校验类异常 (InvalidInputException, ReadOnlyViolationException, SqlSyntaxException, ...) → false
    - Pipeline 层可根据此标记决定是否重试请求

Task 1.4: 实现 ConnectionPoolManager
  → ConcurrentHashMap<String, HikariDataSource> pools
  → withConnection 模板方法 (2 个重载)
  → virtualExecutor = Executors.newVirtualThreadPerTaskExecutor()
  → SQLException → DbConnectionException 转换
  → 连接失败标记 + 按需重连 (HikariCP 自带)
  → close() 关闭所有池 + 虚拟线程执行器

Task 1.5: 实现 DataSourceFactory
  → DataSourceConfig → HikariConfig 映射
  → 连接测试: setConnectionTestQuery("SELECT 1")
  → 虚拟线程适配: 关键参数配置

Task 1.6: 实现 util/
  → JsonUtils (Jackson ObjectMapper 单例, 配置好 Java 8+ 时间模块)
  → 注: LogUtils 已在 Phase 0 创建

Task 1.7: 单元测试
  → ConnectionPoolManagerTest (Mock DataSource)
  → 异常序列化/反序列化测试
```

### 3.2 关键设计细节

**ConnectionPoolManager 虚拟线程设计**:
```java
// 所有 JDBC 操作在虚拟线程中执行
// 但 HikariCP 的连接获取 (pool.getConnection()) 本身是阻塞的
// 方案: withConnection 内部通过虚拟线程执行器提交任务
public <T> T withConnection(String database, SqlFunction<Connection, T> action) {
    var future = virtualExecutor.submit(() -> {
        var ds = pools.get(database);
        if (ds == null) throw new SchemaNotFoundException(database);
        try (var conn = ds.getConnection()) {
            return action.apply(conn);
        }
    });
    try {
        return future.get();  // 等待虚拟线程完成
    } catch (ExecutionException e) {
        throw asDbException(e.getCause());
    }
}
```
注意: `future.get()` 本身也会阻塞调用方线程。如果调用方在虚拟线程中, 此阻塞会释放 carrier 线程。

### 3.3 输出文件

```
src/main/java/com/sqlserver/mcp/model/schema/DatabaseSchema.java
src/main/java/com/sqlserver/mcp/model/schema/TableInfo.java
src/main/java/com/sqlserver/mcp/model/schema/ColumnInfo.java
src/main/java/com/sqlserver/mcp/model/schema/ViewInfo.java
src/main/java/com/sqlserver/mcp/model/schema/IndexInfo.java
src/main/java/com/sqlserver/mcp/model/schema/ForeignKeyInfo.java
src/main/java/com/sqlserver/mcp/model/query/QueryRequest.java
src/main/java/com/sqlserver/mcp/model/query/QueryResponse.java
src/main/java/com/sqlserver/mcp/model/query/ExecutionResult.java
src/main/java/com/sqlserver/mcp/model/error/McpException.java
src/main/java/com/sqlserver/mcp/model/error/*.java (10 个子类)
src/main/java/com/sqlserver/mcp/datasource/ConnectionPoolManager.java
src/main/java/com/sqlserver/mcp/datasource/DataSourceFactory.java
src/main/java/com/sqlserver/mcp/util/JsonUtils.java
src/main/java/com/sqlserver/mcp/util/LogUtils.java
src/test/java/... (对应测试类)
```

---

## 4. Phase 2: Schema 模块

**目标**: 从 SQL Server JDBC 元数据并行加载 Schema, 缓存 + 上下文构建。

### 4.1 任务清单

```
Task 2.1: 实现 SchemaLoader
  → loadSchema(databaseName): 使用 StructuredTaskScope.ShutdownOnFailure 并行
  → 6 个 fork:
    1. loadTables()     — INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE'
    2. loadColumns()    — INFORMATION_SCHEMA.COLUMNS 左连 sys.extended_properties
    3. loadPrimaryKeys()— INFORMATION_SCHEMA.TABLE_CONSTRAINTS + KEY_COLUMN_USAGE
    4. loadForeignKeys()— sys.foreign_keys + sys.foreign_key_columns
       (SQL Server 外键元数据在 INFORMATION_SCHEMA 中不完整, 使用 sys schema)
    5. loadIndexes()    — sys.indexes + sys.index_columns + sys.columns
    6. loadViews()      — INFORMATION_SCHEMA.VIEWS
  → 3s 超时控制 (StructuredTaskScope 级别)

Task 2.2: 实现 SchemaCache
  → ConcurrentHashMap<String, DatabaseSchema> cache (读无锁)
  → single-flight: ConcurrentHashMap<String, CompletableFuture<DatabaseSchema>> pendingLoads
  → initialize(): 启动时全量加载所有配置的数据库
  → getSchema(): 缓存命中直接返回, 未命中触发按需加载
  → refresh(): 手动刷新单库
  → **refresh 触发条件**:
    - 启动时: initialize() 全量加载
    - 按需: getSchema() 未命中时自动触发
    - 手动: refresh(databaseName) 外部调用
    - 定时: 暂不做自动过期 (Schema 是静态元数据, 变化频率低)
    - 后续可扩展: 监听 DDL 通知或定期刷新 (v2)
  → 实现 SchemaProvider 接口

Task 2.3: 实现 SchemaContextBuilder
  → buildContext(schema, userQuery, tokenBudget)
  → 关键词匹配: userQuery 提取名词 → 匹配表名/列名 → 相关度排序
  → Token 精简策略:
    - <50% 预算: 相关表完整信息 + 其他表名列表
    - 50%-90% 预算: 相关表完整信息, 其他仅表名
    - >90% 预算: 仅表名列表
  → Token 估算: 使用字符数 * 0.25 作为近似 (或简单 tiktoken Java 移植)

Task 2.4: 集成测试 (Testcontainers)
  → 空库 Schema 加载
  → 多表 + 索引 + 外键 Schema 加载
  → 视图加载
  → Schema 缓存命中/未命中/单飞并发
  → Token 精简策略验证
```

### 4.2 SQL 查询设计

**loadTables SQL**:
```sql
SELECT TABLE_SCHEMA, TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
  AND TABLE_CATALOG = ?
ORDER BY TABLE_SCHEMA, TABLE_NAME
```

**loadColumns SQL** (含扩展属性):
```sql
SELECT
    c.TABLE_SCHEMA, c.TABLE_NAME, c.COLUMN_NAME,
    c.DATA_TYPE, c.IS_NULLABLE, c.COLUMN_DEFAULT,
    c.ORDINAL_POSITION, c.CHARACTER_MAXIMUM_LENGTH,
    ep.value AS COMMENT
FROM INFORMATION_SCHEMA.COLUMNS c
LEFT JOIN sys.extended_properties ep
    ON ep.major_id = OBJECT_ID(c.TABLE_SCHEMA + '.' + c.TABLE_NAME)
    AND ep.minor_id = c.ORDINAL_POSITION
    AND ep.class = 1
WHERE c.TABLE_CATALOG = ?
ORDER BY c.TABLE_SCHEMA, c.TABLE_NAME, c.ORDINAL_POSITION
```

**loadForeignKeys SQL** (使用 sys schema):
```sql
SELECT
    OBJECT_NAME(fk.parent_object_id) AS TABLE_NAME,
    c.name AS COLUMN_NAME,
    OBJECT_SCHEMA_NAME(fk.referenced_object_id) AS REFERENCED_SCHEMA,
    OBJECT_NAME(fk.referenced_object_id) AS REFERENCED_TABLE,
    rc.name AS REFERENCED_COLUMN
FROM sys.foreign_keys fk
JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
JOIN sys.columns c ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id
JOIN sys.columns rc ON fkc.referenced_object_id = rc.object_id AND fkc.referenced_column_id = rc.column_id
WHERE OBJECT_SCHEMA_NAME(fk.parent_object_id) = ?
```

### 4.3 输出文件

```
src/main/java/com/sqlserver/mcp/schema/SchemaProvider.java        (接口)
src/main/java/com/sqlserver/mcp/schema/SchemaLoader.java
src/main/java/com/sqlserver/mcp/schema/SchemaCache.java
src/main/java/com/sqlserver/mcp/schema/SchemaContextBuilder.java
src/test/java/com/sqlserver/mcp/schema/SchemaLoaderTest.java      (单元)
src/test/java/com/sqlserver/mcp/schema/SchemaCacheTest.java        (单元)
src/test/java/com/sqlserver/mcp/schema/SchemaContextBuilderTest.java
src/test/java/com/sqlserver/mcp/schema/SchemaLoaderIntegrationTest.java  (集成)
```

---

## 5. Phase 3: LLM 模块

**目标**: 与 DeepSeek (OpenAI 兼容 API) 交互, 生成 SQL + 验证意义。

### 5.1 任务清单

```
Task 3.1: 实现 LlmClient
  → OkHttpClient 单例 (connectTimeout/readTimeout 通过 LlmConfig 配置)
  → OpenAI 兼容 Chat Completions API (POST /v1/chat/completions)
  → 请求体: {"model": "deepseek-v4-flash", "messages": [...], "temperature": 0.1}
  → 响应解析: choices[0].message.content
  → 所有 HTTP 调用在虚拟线程中执行 (OkHttp 异步调用 + 阻塞等待)
  → 两个方法: generateSql(systemPrompt, userPrompt), validateMeaning(...)

Task 3.2: 实现 LlmRetryHandler
  → 指数退避: 1s, 3s, 9s (最多 3 次)
  → 可重试异常: IOException, HTTP 5xx, HTTP 429
  → 不重试: HTTP 4xx(除429), JSON 解析错误
  → CircuitBreaker 实现 (非 Resilience4j, 自实现轻量版):
    - 滑动窗口 10 请求
    - failureRateThreshold = 50%
    - waitDurationInOpenState = 30s
    - permittedCallsInHalfOpen = 3
  → 熔断状态变化输出 WARN 日志

Task 3.3: 实现 PromptBuilder
  → SYSTEM_PROMPT_TEMPLATE (TextBlock)
  → MEANING_VALIDATION_PROMPT (TextBlock)
  → buildSqlPrompt(schemaContext, userQuery)
  → buildValidationPrompt(userQuery, sql, sampleResult)

Task 3.4: 实现 SqlExtractor
  → extract(llmOutput): 4 级降级提取
  → 正则: ```sql ... ``` → 内容
  → 回退: ``` ... ``` → 检测是否为 SQL
  → 回退: 第一个 SELECT/WITH 开头语句
  → 失败: LlmOutputParseException

Task 3.5: 单元测试
  → LlmClientTest (Mock OkHttp MockWebServer)
  → LlmRetryHandlerTest (模拟失败/成功/熔断)
  → SqlExtractorTest (全部提取场景)
  → PromptBuilderTest (模板渲染验证)
```

### 5.2 LLM API 交互格式

```json
// Request
POST /v1/chat/completions
{
    "model": "deepseek-v4-flash",
    "messages": [
        {"role": "system", "content": "你是 SQL Server 数据库专家..."},
        {"role": "user", "content": "查询本月订单数量"}
    ],
    "temperature": 0.1,
    "max_tokens": 2000
}

// Response
{
    "choices": [{"message": {"content": "```sql\nSELECT COUNT(*) FROM orders\n```"}}]
}
```

### 5.3 自实现 CircuitBreaker 设计

```java
public class CircuitBreaker {
    enum State { CLOSED, OPEN, HALF_OPEN }

    private final int slidingWindowSize;         // 默认 10
    private final double failureRateThreshold;   // 默认 0.5
    private final Duration waitDurationInOpenState; // 默认 30s
    private final int permittedCallsInHalfOpen;  // 默认 3

    private final AtomicReference<State> state = new AtomicReference<>(State.CLOSED);
    private final ConcurrentLinkedDeque<Boolean> callResults = new ConcurrentLinkedDeque<>();
    private final AtomicInteger halfOpenPermits = new AtomicInteger(0);
    private volatile Instant openedAt;

    public <T> T execute(Supplier<T> operation, Supplier<T> fallback) {
        if (state.get() == State.OPEN) {
            if (Duration.between(openedAt, Instant.now()).compareTo(waitDurationInOpenState) > 0) {
                state.compareAndSet(State.OPEN, State.HALF_OPEN);
                halfOpenPermits.set(permittedCallsInHalfOpen);
            } else {
                return fallback.get();  // 快速失败
            }
        }
        // 执行调用, 记录结果, 状态迁移...
    }
}
```

**不引入 Resilience4j 的理由**: 项目零 Spring 依赖, 为单一 CircuitBreaker 引入 Resilience4j (含多个子模块) 增加 ~1MB 依赖体积和维护负担。自实现 ~80 行代码, 测试覆盖后足够可靠。

### 5.4 输出文件

```
src/main/java/com/sqlserver/mcp/llm/LlmClient.java
src/main/java/com/sqlserver/mcp/llm/LlmRetryHandler.java
src/main/java/com/sqlserver/mcp/llm/CircuitBreaker.java
src/main/java/com/sqlserver/mcp/llm/PromptBuilder.java
src/main/java/com/sqlserver/mcp/llm/SqlExtractor.java
src/main/java/com/sqlserver/mcp/llm/LlmResult.java                (Record)
src/test/java/com/sqlserver/mcp/llm/LlmClientTest.java
src/test/java/com/sqlserver/mcp/llm/LlmRetryHandlerTest.java
src/test/java/com/sqlserver/mcp/llm/CircuitBreakerTest.java
src/test/java/com/sqlserver/mcp/llm/SqlExtractorTest.java
src/test/java/com/sqlserver/mcp/llm/PromptBuilderTest.java
```

---

## 6. Phase 4: Validation 模块

**目标**: 四层 SQL 校验体系, 从正则到 AST 到执行前验证到语义验证。

### 6.1 任务清单

```
Task 4.0: JSqlParser T-SQL 兼容性验证 (前置探索)
  → 编写快速验证程序: JSqlParser 解析 TOP/OFFSET FETCH/OUTPUT/MERGE
  → 若解析失败 → 调整 L2 降级策略: parse error → 自动转 L3
  → 若关键语法不可解析 → 升级 JSqlParser 版本或寻找替代方案

Task 4.1: 定义 SqlValidationRule 接口 + ValidationResult Record
  → @FunctionalInterface, check(sql, context) → Optional<ValidationResult>
  → ValidationResult: passed, errorCode, message, suggestion, details

Task 4.2: 实现 SecurityValidator (L1)
  → 预处理: Unicode NFC 归一化, 零宽字符剥离, 注释去除, 大写转换
  → 危险关键字检测: INSERT/UPDATE/DELETE/DROP/CREATE/ALTER/TRUNCATE/MERGE/...
  → 危险函数检测: xp_cmdshell, sp_executesql, OPENROWSET, OPENDATASOURCE, ...
  → 危险对象检测: BULK INSERT, OPENQUERY, ...
  → 全部使用正则匹配, 可配置关键字列表

Task 4.3: 实现 SqlAstValidator (L2)
  → JSqlParser CCJSqlParserUtil.parse(sql) 解析
  → 仅允许 SELECT, WITH 语句类型
  → T-SQL 方言宽松模式: 解析失败 → 降级到 L3 (记录 WARN)
  → 拒绝非 SELECT/WITH 类型 (INSERT, UPDATE, DELETE, MERGE, CREATE, ...)

Task 4.4: 实现 ParseOnlyValidator (L3)
  → 连接目标数据库, 执行 SET PARSEONLY ON + 目标 SQL
  → 使用 sys.dm_exec_describe_first_result_set 获取结果集元数据
  → 对象存在性: 对照 Schema 缓存验证所有表和列引用
  → 宽严模式: 对于不支持 SET PARSEONLY 的 DDL 语句回复清晰错误

Task 4.5: 实现 ResultMeaningValidator (L4, 特征开关)
  → 取结果集前 5 行作为样本
  → 调用 LlmClient.validateMeaning()
  → 阈值 0.8: ≥0.8 通过; <0.8 警告但不拒绝
  → 评分和警告写入 Meta

Task 4.6: 创建验证模块入口 ValidationChainBuilder
  → 工厂方法: buildChain(config, poolManager, llmClient, schemaProvider)
  → 根据配置和特征开关组装 List<SqlValidationRule>

Task 4.7: 单元测试
  → SecurityValidatorTest (全部危险关键字/函数/绕过方式)
  → SqlAstValidatorTest (SQL 类型覆盖 + 降级路径)
  → ParseOnlyValidatorTest (Mock JDBC)
  → ResultMeaningValidatorTest (Mock LlmClient)
```

### 6.2 L1 预处理关键实现

```java
public class SecurityValidator implements SqlValidationRule {
    private static final Pattern ZERO_WIDTH_CHARS = Pattern.compile("[\\u200B-\\u200D\\uFEFF]");
    private static final Pattern SQL_COMMENT = Pattern.compile("--.*$|/\\*.*?\\*/", Pattern.MULTILINE | Pattern.DOTALL);

    String preprocess(String sql) {
        // 1. Unicode NFC 归一化
        var normalized = Normalizer.normalize(sql, Normalizer.Form.NFC);
        // 2. 剥离零宽字符
        var noZeroWidth = ZERO_WIDTH_CHARS.matcher(normalized).replaceAll("");
        // 3. 去除注释 (先去除, 防止注释内嵌危险关键字)
        var noComments = SQL_COMMENT.matcher(noZeroWidth).replaceAll("");
        // 4. 转大写用于关键字匹配
        return noComments.toUpperCase(Locale.ROOT);
    }
}
```

### 6.3 L2 JSqlParser 使用注意事项

```java
// JSqlParser 5.0+ 支持 T-SQL TOP, OFFSET FETCH
// 但已知不支持: MERGE, OUTPUT, TRUNCATE 的部分变体
// 宽松模式: 解析失败 → WARN 日志 → 降级到 L3

try {
    var stmt = CCJSqlParserUtil.parse(sql);
    if (stmt instanceof Select || stmt instanceof WithItem) {
        return ValidationResult.passed();  // 通过
    }
    return ValidationResult.rejected("READ_ONLY_VIOLATION", "只允许 SELECT/WITH 查询");
} catch (JSQLParserException e) {
    log.warn("JSqlParser parse failed, degrading to L3: {}", e.getMessage());
    return ValidationResult.degraded("PARSER_DEGRADED", "语法解析降级到 L3");
}
```

### 6.4 输出文件

```
src/main/java/com/sqlserver/mcp/validation/SqlValidationRule.java
src/main/java/com/sqlserver/mcp/validation/ValidationResult.java
src/main/java/com/sqlserver/mcp/validation/SecurityValidator.java
src/main/java/com/sqlserver/mcp/validation/SqlAstValidator.java
src/main/java/com/sqlserver/mcp/validation/ParseOnlyValidator.java
src/main/java/com/sqlserver/mcp/validation/ResultMeaningValidator.java
src/main/java/com/sqlserver/mcp/validation/ValidationChainBuilder.java
src/test/java/com/sqlserver/mcp/validation/SecurityValidatorTest.java
src/test/java/com/sqlserver/mcp/validation/SqlAstValidatorTest.java
src/test/java/com/sqlserver/mcp/validation/ParseOnlyValidatorTest.java
src/test/java/com/sqlserver/mcp/validation/ResultMeaningValidatorTest.java
```

---

## 7. Phase 5: Execution 模块

**目标**: SQL 分页重写、执行、结果收集与格式化。

### 7.1 任务清单

```
Task 5.1: 实现 PaginationRewriter
  → rewrite(originalSql, page, pageSize)
  → countSql: SELECT COUNT(*) FROM (...原始SQL...) AS cnt
  → pageSql: 原始SQL + OFFSET (page-1)*pageSize ROWS FETCH NEXT pageSize ROWS ONLY
  → 特殊处理: 若原始 SQL 含 TOP, 不包裹 OFFSET 而是嵌套 SELECT
  → 检测: 已含 ORDER BY → 直接追加 OFFSET FETCH
  → 检测: 无 ORDER BY → 第一列 ORDER BY (SQL Server OFFSET 强制 ORDER BY)

Task 5.2: 实现 QueryExecutor
  → execute(sql, request): 分页重写 → 执行 COUNT → 执行分页 SQL
  → 使用 try-with-resources 管理 Statement + ResultSet
  → setFetchSize(1000) 流式读取
  → 超时控制: Statement.setQueryTimeout()

Task 5.3: 实现 ResultCollector (ResultSetDataCollector)
  → collect(rs, maxRows, maxBytes):
    - 读取列元数据 → columns 列表
    - 流式读取行 → rows 列表
    - 内存+行数双重检查: 超 maxRows 或 maxBytes → truncated=true 停止
  → byteSize 实时计算 (列名 + 行数据字符数)

Task 5.4: 实现 ResultFormatter 策略
  → TextFormatter: Markdown 表格 (| col1 | col2 | ... |)
  → JsonFormatter: {"columns": [...], "rows": [...], "total_rows": N}
  → 接口: ResultFormatter.format(CollectResult) → String

Task 5.5: 单元测试
  → PaginationRewriterTest (各种 SQL 风格: SELECT *, GROUP BY, TOP, CTE, DISTINCT)
  → ResultCollectorTest (正常/截断/空结果集)
  → TextFormatterTest, JsonFormatterTest

Task 5.6: JMH 基准测试 (独立执行, -P jmh)
  → PaginationRewriter: 各种 SQL 风格的分页重写吞吐量
  → ResultCollector: 行收集吞吐量 (含截断)
  → ResultFormatter: Text/JSON 格式化吞吐量
  → 设计目标: 单次分页重写 < 1ms, 格式化 1000 行 < 10ms
```

### 7.2 分页重写细节

```java
// 无 ORDER BY 时的处理
// SQL Server OFFSET...FETCH 要求必须有 ORDER BY
// 策略: 添加 ORDER BY (SELECT NULL) 是 SQL Server 的支持语法

if (!hasOrderBy(sql)) {
    pageSql = sql + " ORDER BY (SELECT NULL) OFFSET ? ROWS FETCH NEXT ? ROWS ONLY";
} else {
    pageSql = sql + " OFFSET ? ROWS FETCH NEXT ? ROWS ONLY";
}
```

### 7.3 QueryExecutor 完整流程

```java
public ExecutionResult execute(String sql, QueryRequest request) {
    // 1. 分页重写
    var rewritten = paginationRewriter.rewrite(sql, request.page(), request.pageSize());

    // 2. 执行 COUNT (分页信息)
    int totalRows;
    try (var stmt = connection.prepareStatement(rewritten.countSql())) {
        stmt.setQueryTimeout(queryTimeoutSeconds);
        try (var rs = stmt.executeQuery()) {
            rs.next();
            totalRows = rs.getInt(1);
        }
    }

    // 3. 执行分页 SQL
    try (var stmt = connection.prepareStatement(rewritten.pageSql())) {
        stmt.setQueryTimeout(queryTimeoutSeconds);
        stmt.setFetchSize(1000);
        try (var rs = stmt.executeQuery()) {
            var collected = resultCollector.collect(rs, maxRows, maxBytes);
            return new ExecutionResult(collected, totalRows, rewritten.pageSql());
        }
    }
}
```

### 7.4 输出文件

```
src/main/java/com/sqlserver/mcp/execution/PaginationRewriter.java
src/main/java/com/sqlserver/mcp/execution/QueryExecutor.java
src/main/java/com/sqlserver/mcp/execution/ResultCollector.java
src/main/java/com/sqlserver/mcp/execution/ResultFormatter.java             (接口)
src/main/java/com/sqlserver/mcp/execution/TextFormatter.java
src/main/java/com/sqlserver/mcp/execution/JsonFormatter.java
src/main/java/com/sqlserver/mcp/execution/CollectResult.java              (Record)
src/test/java/com/sqlserver/mcp/execution/PaginationRewriterTest.java
src/test/java/com/sqlserver/mcp/execution/ResultCollectorTest.java
src/test/java/com/sqlserver/mcp/execution/TextFormatterTest.java
src/test/java/com/sqlserver/mcp/execution/JsonFormatterTest.java
```

---

## 8. Phase 6: Pipeline 编排层

**目标**: QueryPipelineService 编排完整流程, 封装 SQL-only/Execute 模式差异。

### 8.1 任务清单

```
Task 6.1: 实现 QueryPipelineService
  → 构造器注入全部依赖 (SchemaProvider, LlmClient, SqlExtractor,
    List<SqlValidationRule>, Optional<ParseOnlyValidator>,
    Optional<ResultMeaningValidator>, QueryExecutor, ResultFormatter, QueryConfig)
  → execute(QueryRequest): 按设计文档 §2.8 流程图实现
  → SQL-only vs Execute 模式分支
  → 请求追踪: 生成 requestId (UUID), MDC 注入, 全链路传递
  → 性能指标: 记录每个阶段耗时 (System.nanoTime 或 SimpleStopwatch)
  → 异常处理: 所有异常统一转换为 QueryResponse.Error

Task 6.2: 实现 Pipeline 阶段的 Metrics 埋点
  → 每个阶段开始/结束记录
  → 最终组装 QueryResponse.Meta (含 executionTimeMs, verificationScore 等)

Task 6.3: 单元测试
  → Mock 所有依赖, 验证:
    - SQL-only 模式: 跳过 L3/L4/Execution
    - Execute 模式: 全流程
    - 异常场景: LLM 失败 → 清晰错误, L1 拒绝 → ReadOnlyViolationException
```

### 8.2 Pipeline 执行时序

```java
public QueryResponse execute(QueryRequest request) {
    var requestId = UUID.randomUUID().toString();
    LogUtils.putRequestId(requestId);
    var startTime = System.nanoTime();

    try {
        // Step 1: Schema 获取
        var schema = schemaProvider.getSchema(determineDatabase(request));

        // Step 2: LLM 生成 SQL
        var context = contextBuilder.buildContext(schema, request.query(), tokenBudget);
        var llmResult = llmClient.generateSql(PROMPT_TEMPLATE, context, request.query());
        var sql = sqlExtractor.extract(llmResult.content());

        // Step 3: L1 + L2 预校验 (两种模式都执行)
        validateL1L2(sql, schema);

        // Step 4: Execute 模式专属路径
        if (request.isExecuteMode()) {
            validateL3(sql, schema);
            var execResult = queryExecutor.execute(sql, request);
            validateL4(request.query(), sql, execResult);
            // ... 格式化 + 组装响应
        }

        // Step 5: SQL-only 模式
        return QueryResponse.sqlOnly(sql);

    } catch (McpException e) {
        return QueryResponse.error(e);
    } finally {
        LogUtils.clear();
    }
}
```

### 8.3 输出文件

```
src/main/java/com/sqlserver/mcp/pipeline/QueryPipelineService.java
src/main/java/com/sqlserver/mcp/pipeline/StageMetrics.java        (阶段耗时记录)
src/test/java/com/sqlserver/mcp/pipeline/QueryPipelineServiceTest.java
```

---

## 9. Phase 7: Tool + 组合根 + MCP Server

**目标**: MCP Tool 定义、组合根装配、Server 启动、端到端可运行。

### 9.1 任务清单

```
Task 7.1: 实现 QueryTool
  → ToolSpecification: name="query", description, inputSchema (JSON Schema)
  → execute(ToolCall): Jackson 反序列化参数 → QueryRequest → pipeline.execute
  → 异常 → 统一 QueryResponse.Error → CallToolResult
  → 参数验证: @NotBlank query, @Nullable database/mode/page/pageSize

Task 7.2: 实现 SqlServerMcpApplication (组合根)
  → main(): 按设计文档 §5 逐一手动 new 依赖
  → ConfigLoader.load(args) → AppConfig
  → ConnectionPoolManager → SchemaLoader → SchemaCache
  → LlmClient → SqlExtractor → SchemaContextBuilder
  → ValidationChainBuilder → List<SqlValidationRule>
  → PaginationRewriter → ResultCollector → QueryExecutor
  → QueryPipelineService → QueryTool
  → McpServer.sync(transport).serverInfo("sqlserver-mcp", "1.0.0")...
  → Runtime.getRuntime().addShutdownHook → server.close, poolManager.close
  → server.start() (阻塞等待 stdin)

Task 7.3: MCP Server 配置
  → StdioServerTransport (stdin/stdout JSON-RPC)
  → ServerCapabilities: tools(true)
  → tool(queryTool.specification()) 注册
  → **协议版本协商**: McpServer.sync() 默认处理 MCP 协议版本握手
    - 确认 Client-Server 协议版本兼容
    - 版本不匹配时记录 WARN 日志 (MCP SDK 内置兼容性处理)

Task 7.4: E2E 验证
  → 启动 Server 进程
  → MCP Java SDK Client 连接, 发送 query 请求
  → 验证 SQL-only 模式返回正确 SQL
  → 验证 Execute 模式返回正确结果
  → 验证错误输入返回清晰错误
```

### 9.2 MCP Tool JSON Schema

```json
{
    "type": "object",
    "properties": {
        "query": {
            "type": "string",
            "description": "自然语言查询描述"
        },
        "database": {
            "type": "string",
            "description": "目标数据库名, 默认使用第一个配置的数据库"
        },
        "mode": {
            "type": "string",
            "enum": ["sql_only", "execute"],
            "description": "sql_only 仅返回 SQL; execute 返回执行结果, 默认 execute"
        },
        "page": {
            "type": "integer",
            "minimum": 1,
            "description": "页码, 默认 1"
        },
        "page_size": {
            "type": "integer",
            "minimum": 1,
            "maximum": 10000,
            "description": "每页行数, 默认 100"
        },
        "output_format": {
            "type": "string",
            "enum": ["text", "json"],
            "description": "输出格式, 默认 text"
        }
    },
    "required": ["query"]
}
```

### 9.3 输出文件

```
src/main/java/com/sqlserver/mcp/tool/QueryTool.java
src/main/java/com/sqlserver/mcp/SqlServerMcpApplication.java
src/test/java/.../E2E/SqlServerMcpE2ETest.java  (E2E)
```

---

## 10. Phase 8: 可观测性

**目标**: Micrometer 指标、OpenTelemetry 追踪、审计日志。

> **注意**: 基础日志 (logback.xml, MDC, LogUtils) 已在 Phase 0 就位。Phase 8 在其之上叠加指标、追踪和审计功能。

### 10.1 任务清单

```
Task 8.1: 审计日志 Appender
  → 独立 Logback Appender (审计日志专用文件)
  → TimeBasedRollingPolicy (每日轮转, 保留 90 天)
  → 审计事件格式: timestamp requestId database sql rows latency

Task 8.2: Micrometer 指标实现
  → MetricsRegistry 单例 (CompositeMeterRegistry)
  → 注册 JmxMeterRegistry (若启用)
  → query.total Counter, query.duration Timer, llm.duration Timer
  → validation.result Counter, schema.cache.size Gauge
  → pool.active/idle/pending Gauge (通过 HikariCP MetricsTracker 或手动曝光)
  → StageMetrics: 阶段耗时记录工具

Task 8.3: OpenTelemetry 追踪
  → OpenTelemetryConfig: SdkTracerProvider, BatchSpanProcessor
  → QueryTracing: query → schema.load → llm.generate → sql.validate → sql.execute
  → 每个 Span 设置属性 (requestId, database, sql 等)
  → 当前 Phase 使用 ConsoleSpanExporter (调试), 后续可切换 OTLP
```

### 10.2 输出文件

```
src/main/java/com/sqlserver/mcp/observability/MetricsRegistry.java
src/main/java/com/sqlserver/mcp/observability/OpenTelemetryConfig.java
src/main/java/com/sqlserver/mcp/observability/StageMetrics.java
src/test/java/com/sqlserver/mcp/observability/MetricsRegistryTest.java
src/test/java/com/sqlserver/mcp/observability/OpenTelemetryConfigTest.java
```

---

## 11. Phase 9: 测试全覆盖

**目标**: 达到设计文档 §9 定义的覆盖标准 (Unit 95%+, 全部 Golden Path E2E)。

### 11.1 需要补充的测试

| 模块 | 已有测试 | 需补充 |
|------|----------|--------|
| Phase 1 datasource | ConnectionPoolManagerTest | 连接失败重连测试, 并发获取测试 |
| Phase 2 schema | SchemaLoaderTest, SchemaCacheTest | SchemaCache 单飞并发测试 |
| Phase 3 llm | LlmClientTest, RetryTest | CircuitBreaker 状态迁移测试 |
| Phase 4 validation | 各 Validator 测试 | 纵深防御组合测试 (L1+L2+L3) |
| Phase 5 execution | PaginationRewriterTest | 大结果集截断测试, 边缘 SQL 风格 |
| Phase 6 pipeline | QueryPipelineServiceTest | 全部模式组合测试 |
| Phase 8 observability | MetricsTest | MDC 跨线程传递测试 |

### 11.5 故障注入测试

验证系统在外部依赖故障时的行为:

| 故障场景 | 模拟方式 | 预期行为 |
|---------|----------|----------|
| LLM API 超时 | Mock HttpClient 延迟 > 30s | LlmApiException, 错误码返回, Pipeline 不崩溃 |
| LLM API 返回 429 | Mock HttpClient 返回 429 | LlmRetryHandler 重试 (最多 3 次); CircuitBreaker 计数失败 |
| LLM API 连续 5 次 500 | Mock HttpClient 返回 500 | CircuitBreaker 触发 OPEN, 后续请求快速失败 (fallback) |
| DB 连接断开 | Testcontainers 容器停止 | ConnectionPoolManager 标记不可用, 后续查询触发按需重连 |
| DB 连接池耗尽 | 设置 maxPoolSize=1, 并发 5 请求 | 连接等待超时, DbConnectionException, 不阻塞其他数据库 |

### 11.2 集成测试配置

```yaml
# src/test/resources/application-test.yml
database:
  sources:
    - name: testdb
      host: ${TESTCONTAINERS_HOST}
      port: ${TESTCONTAINERS_PORT}
      database: testdb
      username: SA
      password: "your_test_password"
      min-pool-size: 1
      max-pool-size: 2
```

### 11.3 Testcontainers 初始化

```java
@Testcontainers
class SchemaLoaderIntegrationTest {
    @Container
    static MSSQLServerContainer<?> sqlServer = new MSSQLServerContainer<>("mcr.microsoft.com/mssql/server:2022-latest")
        .withInitScript("init-testdb.sql");
}
```

### 11.4 输出文件

```
src/test/resources/application-test.yml
src/test/resources/init-testdb.sql
src/test/java/.../E2E/SqlServerMcpE2ETest.java
(各模块测试文件分散在各 Phase)
```

---

## 12. Phase 10: 文档 & 收尾

### 12.1 任务清单

```
Task 10.1: 更新 README / CLAUDE.md (若需要)
  → 更新构建命令、运行方式、配置说明
  → 确认所有配置项文档化
  → 包含 **MCP JSON-RPC 请求/响应示例**:
    - SQL-only 模式示例: 请求 + 响应
    - Execute 模式示例: 请求 + 结果 + Meta
    - 错误响应示例: 各类错误码及对应响应
    - MCP Tool 发现 (tools/list) 示例

Task 10.2: 安全检查
  → 确认密码/Key 全部从环境变量读取, 无 YAML 泄漏
  → 确认日志输出过滤 (Authorization header)
  → 确认 error 消息中不透露敏感信息

Task 10.3: 最终验证
  → `mvn verify -P lint` 全过 (checkstyle + pmd + spotbugs + error-prone)
  → OWASP Dependency-Check (高危阻断 ≥ CVSS 7)
  → 手工 E2E 验证 (MCP Client 调用)
```

---

## 13. 文件清单总表

| Phase | 文件 | 估算行数 | 优先级 |
|-------|------|----------|--------|
| 0 | pom.xml | 200 | P0 |
| 0 | ConfigLoader, AppConfig, YamlConfigLoader | 300 | P0 |
| 0 | LogUtils, logback.xml | 80 | P0 |
| 1 | 6 个 Schema Record | 180 | P0 |
| 1 | 2 个 Query Record + QueryResponse sealed | 150 | P0 |
| 1 | McpException + 10 子类 (含 retryable) | 280 | P0 |
| 1 | ConnectionPoolManager, DataSourceFactory | 150 | P0 |
| 1 | JsonUtils | 60 | P1 |
| 2 | SchemaProvider, SchemaLoader | 250 | P0 |
| 2 | SchemaCache | 160 | P0 |
| 2 | SchemaContextBuilder | 180 | P0 |
| 3 | LlmClient | 200 | P0 |
| 3 | LlmRetryHandler, CircuitBreaker | 150 | P0 |
| 3 | PromptBuilder, SqlExtractor, LlmResult | 120 | P0 |
| 4 | SqlValidationRule, ValidationResult | 50 | P0 |
| 4 | SecurityValidator | 150 | P0 |
| 4 | SqlAstValidator | 100 | P0 |
| 4 | ParseOnlyValidator | 120 | P0 |
| 4 | ResultMeaningValidator, ValidationChainBuilder | 100 | P0 |
| 5 | PaginationRewriter | 100 | P0 |
| 5 | QueryExecutor | 120 | P0 |
| 5 | ResultCollector | 180 | P0 |
| 5 | ResultFormatter + 2 实现 | 120 | P0 |
| 5 | JMH 基准类 | 150 | P2 |
| 6 | QueryPipelineService | 200 | P0 |
| 6 | StageMetrics | 60 | P1 |
| 7 | QueryTool | 100 | P0 |
| 7 | SqlServerMcpApplication | 150 | P0 |
| 8 | MetricsRegistry, OpenTelemetryConfig, StageMetrics | 200 | P1 |
| T | ~35 个测试类 | 2800 | P0 |
| | **总计** | **~5400 行** | |

---

## 14. 关键风险与缓解

| 编号 | 风险 | Phase | 概率 | 影响 | 缓解 |
|------|------|-------|------|------|------|
| P-R1 | JDK 26 --enable-preview 在 CI 环境不可用 | 0 | 低 | 高 | 在 pom.xml 配置 compiler release=26; 准备 JDK 25 作为降级方案 |
| P-R2 | JSqlParser 不支持关键 T-SQL 语法 | 4 | 中 | 中 | 事前验证脚本; L2 宽松模式降级到 L3; 评估 antlr TSqlParser 作为备选 |
| P-R3 | MCP Java SDK v0.7+ API 不兼容 | 7 | 中 | 高 | Phase 0 构建验证脚本确认 API 可用; 锁定精确版本 |
| P-R4 | HikariCP + 虚拟线程在并发下连接泄漏 | 1 | 低 | 高 | leakDetectionThreshold=60s; 并发测试; 线程转储验证 |
| P-R5 | OkHttp + 虚拟线程存在线程固定问题 | 3 | 低 | 中 | OkHttp 使用异步调用 + CompletableFuture; 避免在虚拟线程中同步阻塞 OkHttp 内部 |
| P-R6 | LLM API 调用无 Token 预算控制, 成本超支 | 3 | 中 | 中 | SchemaContextBuilder 的 tokenBudget 参数限制上下文长度; LlmConfig.maxTokens 约束 LLM 输出; 后续增加月度用量告警 |
| P-R7 | MCP 协议版本不匹配导致 Client-Server 握手失败 | 7 | 低 | 高 | 使用 MCP SDK 内置版本协商; E2E 测试覆盖协议握手 |

---

## 15. 实施顺序建议

### 推荐实施顺序 (按依赖拓扑)

```
Week 1:   Phase 0 (1d) → Phase 1 (2d) → Phase 2 (2d)
Week 2:   Phase 3 (2d) → Phase 4 (2d) → Phase 5 (1d)
Week 3:   Phase 6 (1d) → Phase 7 (1d) → E2E 联调 (2d)
Week 4:   Phase 8 (1d) → Phase 9 (1d) → Phase 10 (1d) → Buffer (2d)
```

**关键路径**: Phase 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → E2E

**可并行路径**:
- Phase 8 (可观测性) 可与 Phase 6-7 并行
- Phase 2/3 的测试编写可与 Phase 4 并行

---

## 16. 验收标准

| 检查项 | 标准 | 验证方式 |
|--------|------|----------|
| 编译 | `mvn compile` 0 error | CI |
| 单元测试 | 通过率 100%, 覆盖率 ≥ 95% | JaCoCo |
| 集成测试 | 全部通过 | `mvn verify -P integration` |
| 静态分析 | checkstyle + pmd + spotbugs + error-prone 全过 | `mvn verify -P lint` |
| 依赖漏洞 | CVSS ≥ 7 阻断 | `mvn dependency-check:aggregate` |
| MCP 协议 | JSON-RPC 格式正确 | E2E 测试 + 手工验证 |
| SQL 安全 | 全部注入场景拦截 | 安全测试矩阵 |
| 配置安全 | 敏感信息无硬编码 | 代码审查 |

---

**变更记录**

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.0 | 2026-05-17 | 初始版本, 基于设计文档 0002 和 CLAUDE.md 构建实现计划 | Claude |
| v1.1 | 2026-05-17 | Codex 评审反馈: 可观测性左移到 Phase 0; 新增 P-R6/P-R7 风险; 异常 retryable 标记; SchemaCache 触发条件; LOC 上调至 ~5400; 新增故障注入测试; Phase 4 依赖澄清 (L4 依赖 LLM) | Claude |
