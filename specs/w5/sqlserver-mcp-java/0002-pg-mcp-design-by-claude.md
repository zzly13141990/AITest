# sqlserver-mcp-java 设计文档

**文档编号**: 0002-pg-mcp-design-by-claude.md
**版本**: v1.0
**日期**: 2026-05-17
**状态**: Draft
**前置文档**: 0001-mcp-req-prd-by-claude.md (PRD)

---

## 1. 架构设计

### 1.1 整体架构

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          MCP Client (Claude, Cursor...)                      │
│                              stdin/stdout JSON-RPC                           │
├──────────────────────────────────────────────────────────────────────────────┤
│  SqlServerMcpApplication  (组合根: 手动依赖构建 + 生命周期管理)                  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │  MCP Transport Layer        StdioServerTransport                     │    │
│  ├──────────────────────────────────────────────────────────────────────┤    │
│  │  Tool Layer (薄层)          QueryTool                                │    │
│  ├──────────────────────────────────────────────────────────────────────┤    │
│  │  Pipeline Layer             QueryPipelineService (编排+特征开关)       │    │
│  ├──────────┬──────────┬──────────┬──────────┬─────────────────────────┤    │
│  │ Schema    │   LLM    │ Valid-   │ Execution│   Observability         │    │
│  │ Module    │  Module  │ ation    │ Module   │   (Micrometer + OTel)   │    │
│  │           │          │ Chain    │          │                         │    │
│  ├──────────┴──────────┴──────────┴──────────┴─────────────────────────┤    │
│  │  DataSource Layer     HikariCP Connection Pools (每库独立)            │    │
│  │                      Microsoft JDBC Driver (mssql-jdbc)              │    │
│  ├──────────────────────────────────────────────────────────────────────┤    │
│  │  External              SQL Server · DeepSeek (OpenAI-compatible)     │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
```

**原则**:
- Pipeline-Driven: 所有请求经由单一 Pipeline 编排，每个阶段解耦
- 组合根(Composition Root): SqlServerMcpApplication.main() 手动 new 所有依赖，无 DI 框架
- 虚拟线程贯穿: JDBC 阻塞调用 + LLM HTTP 调用统一使用虚拟线程执行器
- 特征开关: Layer 4 等实验性功能通过配置开关控制，Pipeline 跳过对应阶段

### 1.2 包结构 (与 CLAUDE.md 一致)

```
com.sqlserver.mcp/
├── SqlServerMcpApplication.java       # 入口 + 组合根
├── config/                            # 配置 POJO + YAML 加载
├── model/
│   ├── schema/                        # ColumnInfo, TableInfo 等 Record
│   ├── query/                         # QueryRequest, QueryResponse 等 Record
│   └── error/                         # McpException 层级 (sealed) + 错误码
├── datasource/                        # ConnectionPoolManager, DataSourceFactory
├── schema/                            # SchemaLoader, SchemaCache, SchemaContextBuilder
├── llm/                               # LlmClient, PromptBuilder, SqlExtractor
├── validation/                        # L1-L4 校验规则
├── execution/                         # PaginationRewriter, ResultFormatter
├── pipeline/                          # QueryPipelineService (编排)
├── tool/                              # QueryTool (MCP 参数映射)
└── util/                              # JsonUtils, LogUtils
```

### 1.3 关键设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| DI 方式 | 组合根手动 new | 无 Spring 依赖体积，虚拟线程下无 Bean 代理问题 |
| MCP Tool 注册 | McpServer.ToolSpecification 函数式 | 优于注解方式，参数映射逻辑显式 |
| Schema 缓存 | ConcurrentHashMap + 不可变快照 + 单飞(single-flight) | 读写分离，读无锁；防缓存击穿 |
| LLM 客户端 | OkHttp + 手动 JSON 序列化 + CircuitBreaker | 轻量 HTTP，熔断保护防止级联失败 |
| SQL 解析 | JSqlParser (T-SQL 宽松模式) | Java 生态最成熟的 SQL 解析器 |
| 结果集收集 | 流式 Fetch + 行数/内存双重上限 | 防 OOM |
| 多库隔离 | 每库独立 HikariCP 实例 | 连接池故障隔离 |

---

## 2. 模块设计

### 2.1 config — 配置模块

加载顺序: 环境变量 > YAML 配置文件 > 默认值。

```java
// Config 顶层 Record
public record AppConfig(
    McpConfig mcp,
    DatabaseConfig database,
    LlmConfig llm,
    QueryConfig query,
    ObservabilityConfig observability
) {}

public record DatabaseConfig(
    List<DataSourceConfig> sources,    // 数据库连接列表
    Duration schemaLoadTimeout,        // Schema 加载超时, 默认 3s
    int schemaCacheMaxTables           // 缓存最大表数, 默认 500
) {}

public record DataSourceConfig(
    String name,                       // 业务标识名
    String host,
    int port,                          // 默认 1433
    String database,
    String username,
    String password,                    // 来自环境变量, 不在 YAML 明文存储
    int minPoolSize,                    // 默认 2
    int maxPoolSize,                    // 默认 10
    Duration connectionTimeout,         // 默认 5s
    Duration maxLifetime,               // 默认 30min
    Duration leakDetectionThreshold     // 默认 60s
) {}

public record LlmConfig(
    String apiBaseUrl,                  // 默认 https://api.deepseek.com/v1
    String model,                       // 默认 deepseek-v4-flash
    String apiKey,                      // 来自环境变量 LLM_API_KEY
    double temperature,                 // 默认 0.1
    int maxTokens,                      // 默认 2000
    Duration timeout,                   // 默认 30s
    int maxRetries,                     // 默认 3
    List<Duration> retryDelays          // 默认 [1s, 3s, 9s]
) {}

public record QueryConfig(
    int defaultPageSize,                // 默认 100
    int maxPageSize,                    // 默认 10000
    int maxRowsTotal,                   // 默认 100000
    int maxResultBytes,                 // 默认 50MB
    Features features
) {
    public record Features(
        boolean resultMeaningValidation // Layer 4, 默认 true
    ) {}
}
```

**密码安全**: `DataSourceConfig.password` 和 `LlmConfig.apiKey` 强制要求从环境变量读取，不在 YAML 中存储。命名规则: `DB_{name}_PASSWORD`, `LLM_API_KEY`。

### 2.2 datasource — 连接池管理

```java
/**
 * 连接池管理器：每库一个独立 HikariCP 实例。
 * Virtual Threads + HikariCP 适配：无 synchronized/ThreadLocal。
 */
public class ConnectionPoolManager implements AutoCloseable {
    private final ConcurrentHashMap<String, HikariDataSource> pools;
    private final ExecutorService virtualExecutor;  // VirtualThread-per-task

    public ConnectionPoolManager(List<DataSourceConfig> configs) {
        this.virtualExecutor = Executors.newVirtualThreadPerTaskExecutor();
        // 每个 DataSourceConfig → 创建 HikariCP 实例
    }

    /**
     * 模板方法: 获取连接 → 执行 → 自动关闭
     * 调用方通过 virtualExecutor.submit() 确保在虚拟线程中执行
     */
    public <T> T withConnection(String database, SqlFunction<Connection, T> action)
        throws DbConnectionException;

    public <T> T withConnection(String database, String sql, SqlFunction<ResultSet, T> mapper)
        throws DbConnectionException;
}

/**
 * JDBC 操作函数式接口，允许抛出 SQLException。
 */
@FunctionalInterface
interface SqlFunction<T, R> {
    R apply(T t) throws SQLException;
}
```

**关键行为**:
- `withConnection` 自动管理 `Connection` 生命周期 (try-with-resources)
- 所有 JDBC 操作通过 `virtualExecutor.submit()` 包裹，确保阻塞发生在虚拟线程上
- 连接失败: 标记该库不可用并记录 WARN 日志，不影响其他库；后续查询触发按需重连 (HikariCP 自动重试, 指数退避: initialBackoff=100ms, maxBackoff=5s, jitter=0.2)
- 健康检查: 通过 `HikariConfig.setConnectionTestQuery("SELECT 1")` 自动执行

### 2.3 schema — Schema 加载与缓存

```java
/**
 * Schema 加载器: JDBC → DatabaseSchema Record
 * 使用 StructuredTaskScope 并行加载各维度信息。
 */
public class SchemaLoader {
    private final ConnectionPoolManager poolManager;
    private final DatabaseConfig config;

    public DatabaseSchema loadSchema(String databaseName);
        // StructuredTaskScope.ShutdownOnFailure 并行加载:
        //   subtask1: loadTables()         → 表清单
        //   subtask2: loadColumns()        → 列信息 (含主键标记)
        //   subtask3: loadConstraints()    → 主键/外键关系
        //   subtask4: loadIndexes()        → 索引
        //   subtask5: loadViews()          → 视图
        //   subtask6: loadUserTypes()      → 用户定义类型
}

/**
 * Schema 缓存: 线程安全的读写分离缓存。
 * key = databaseName, value = 不可变 DatabaseSchema 快照。
 *
 * 防缓存击穿: 使用单飞 (single-flight) 模式，
 * 同一数据库的并发加载请求合并为一次，减少重复查询。
 */
public class SchemaCache implements SchemaProvider {
    private final ConcurrentHashMap<String, DatabaseSchema> cache;
    private final SchemaLoader loader;
    private final ConcurrentHashMap<String, CompletableFuture<DatabaseSchema>> pendingLoads;  // 单飞锁

    /** 启动时全量加载 */
    public void initialize(List<String> databaseNames);

    /** 按需获取 (线程安全, 无锁读) */
    public DatabaseSchema getSchema(String databaseName);

    /** 手动触发单库刷新 */
    public void refresh(String databaseName);
}

/**
 * Schema 上下文构建器: DatabaseSchema → Prompt 上下文字符串
 * 含 Token 预算感知的自动精简策略。
 */
public class SchemaContextBuilder {
    private final LlmConfig llmConfig;   // 用于 maxTokens 参考

    /**
     * @param userQuery 用于关键词匹配筛选相关表
     * @param tokenBudget 可用 Token 预算内 (默认 maxTokens * 50%)
     */
    public String buildContext(DatabaseSchema schema, String userQuery, int tokenBudget);

    // 内部步骤:
    // 1. 关键词匹配: 从 userQuery 提取名词 → 匹配表名列名 → 排序相关度
    // 2. 构建完整上下文: 表名+列+类型+主键+外键 (相关表全部信息)
    // 3. Token 估算: 超 50% 预算 → 仅列相关表完整 + 其他仅表名列表
    // 4. 超 90% 预算 → 仅包含表名列表
}
```

**Schema 数据模型** (均使用 Record):

```java
public record DatabaseSchema(
    String databaseName,
    Map<String, TableInfo> tables,         // 不可变 Map
    Map<String, ViewInfo> views,           // 不可变 Map
    List<String> userDefinedTypes,         // 不可变 List
    Instant cachedAt
) {}

public record TableInfo(
    String name,
    String schema,                         // 默认 "dbo"
    List<ColumnInfo> columns,
    List<String> primaryKeys,
    List<ForeignKeyInfo> foreignKeys,
    List<IndexInfo> indexes,
    String comment
) {}

public record ColumnInfo(
    String name,
    String dataType,
    boolean nullable,
    String defaultValue,
    int ordinalPosition,
    Integer maxLength,
    boolean primaryKey,
    boolean foreignKey,
    String foreignKeyRef,
    String comment
) {}

public record ViewInfo(
    String name,
    String schema,
    String definition,
    List<ColumnInfo> columns
) {}

public record IndexInfo(
    String name,
    String type,         // "CLUSTERED" / "NONCLUSTERED"
    List<String> columns,
    boolean unique
) {}

public record ForeignKeyInfo(
    String columnName,
    String referencedSchema,
    String referencedTable,
    String referencedColumn
) {}
```

### 2.4 llm — LLM 交互

```java
/**
 * LLM 客户端: OpenAI 兼容 API 封装。
 * 所有 HTTP 调用在虚拟线程中执行。
 */
public class LlmClient {
    private final OkHttpClient httpClient;
    private final LlmConfig config;
    private final LlmRetryHandler retryHandler;

    public LlmClient(LlmConfig config) {
        this.httpClient = new OkHttpClient.Builder()
            .connectTimeout(config.timeout())
            .readTimeout(config.timeout())
            .build();
        this.retryHandler = new LlmRetryHandler(config);
    }

    /** 调用 LLM 生成 SQL */
    public LlmResult generateSql(String systemPrompt, String userPrompt);

    /** 调用 LLM 验证结果意义性 */
    public double validateMeaning(String userQuery, String sql, String sampleResult);
}

/**
 * 重试处理器: 指数退避 (1s, 3s, 9s), 最多 3 次。
 * 上层由 CircuitBreaker 保护，连续失败超过阈值时熔断，
 * 避免 LLM 下游故障耗尽连接池。
 * 幂等保证: SQL 生成请求不可重试? 需要确认。
 * 设计: generateSql 重试 (因为LLM调用幂等),
 *       但 validateMeaning 重试无副作用。
 */
public class LlmRetryHandler {
    public <T> T executeWithRetry(RetryableSupplier<T> supplier)
        throws LlmApiException;

    // 仅对以下异常重试:
    // - IOException (网络错误)
    // - HTTP 5xx (服务端错误)
    // - HTTP 429 (限流)
    // 不重试: HTTP 4xx (除 429), JSON 解析错误
    //
    // CircuitBreaker 配置:
    //   slidingWindowSize = 10, failureRateThreshold = 50%,
    //   waitDurationInOpenState = 30s, permittedCallsInHalfOpen = 3
}

/**
 * Prompt 构建器: 拼接 System/User Prompt。
 * 使用 TextBlock 避免字符串拼接。
 */
public class PromptBuilder {
    public static final String SYSTEM_PROMPT_TEMPLATE = """
        你是 SQL Server (T-SQL) 数据库专家。
        你只生成 SELECT 查询语句，绝不生成 INSERT/UPDATE/DELETE/DDL 等修改数据的语句。
        数据库 Schema 信息如下：
        {schema_context}

        约束：
        - 只返回 SQL 语句，不需要任何解释
        - 使用清晰的列别名
        - 默认 LIMIT 100
        """;

    public static final String MEANING_VALIDATION_PROMPT = """
        验证以下 SQL 查询和结果是否符合用户意图。
        用户查询: {user_query}
        生成的 SQL: {sql}
        结果样本 (前 5 行): {sample}
        请返回 0-1 之间的一致性评分，仅返回数字。
        """;

    public String buildSqlPrompt(String schemaContext, String userQuery);
    public String buildValidationPrompt(String userQuery, String sql, String sample);
}

/**
 * SQL 提取器: 从 LLM 返回内容中提取 T-SQL。
 */
public class SqlExtractor {
    /**
     * 提取优先级:
     * 1. ```sql ... ``` 代码块
     * 2. ``` ... ``` 通用代码块 (检测是否为 SQL)
     * 3. 第一个 SELECT/WITH 开头的语句 (去 Markdown)
     * 4. 失败 → LlmOutputParseException
     */
    public String extract(String llmOutput) throws LlmOutputParseException;
}
```

### 2.5 validation — 四层校验

校验规则接口:

```java
/**
 * SQL 校验规则: 策略/责任链模式。
 * 每个规则实现此接口，Pipeline 按序调用。
 */
@FunctionalInterface
public interface SqlValidationRule {
    /**
     * @param sql 待校验的 SQL
     * @param context Schema 上下文 (L3 对象存在性检查用)
     * @return 通过 → empty; 拒绝 → ValidationResult
     */
    Optional<ValidationResult> check(String sql, SchemaContext context);
}

public record ValidationResult(
    boolean passed,
    String errorCode,
    String message,
    String suggestion,
    Map<String, Object> details
) {}
```

**四层校验实现**:

```java
/**
 * L1 — 正则预检 (快速过滤层)
 * 预处理: Unicode NFC 归一化, 转大写, 去除注释, 剥离零宽字符
 * 检测: 危险关键字 (INSERT/UPDATE/DELETE/...)
 *       危险函数 (xp_cmdshell/sp_executesql/...)
 *       危险对象 (OPENROWSET/BULK INSERT/...)
 * 特性: 辅助防御层, 可被编码绕过, 不单独作为唯一防御
 *       与 L2 AST + L3 SET PARSEONLY ON 组成纵深防御
 */
public class SecurityValidator implements SqlValidationRule;

/**
 * L2 — 语法解析校验 (核心防御层)
 * 使用 JSqlParser 解析 SQL AST
 * 仅允许 Statement 类型: SELECT, WITH (CTE)
 * 拒绝: INSERT, UPDATE, DELETE, MERGE, CREATE, ALTER, DROP, TRUNCATE, EXEC
 * T-SQL 方言适配: TOP, OFFSET FETCH, 等
 * 宽松模式: 解析失败 → 降级到 L3 (SET PARSEONLY ON)
 */
public class SqlAstValidator implements SqlValidationRule;

/**
 * L3 — 执行前验证
 * 语法验证: SET PARSEONLY ON
 * 结构验证: sys.dm_exec_describe_first_result_set
 * 对象存在性: 对照 Schema 缓存验证表和列是否存在
 */
public class ParseOnlyValidator implements SqlValidationRule;

/**
 * L4 — 结果意义性验证 (可选, 受特征开关控制)
 * LLM 对比: 用户意图 + 生成 SQL + 结果样本(前5行)
 * 阈值: 0.8 → ≥ 0.8 有意义; < 0.8 警告但不拒绝
 * 采样: 取结果集前 5 行作为验证样本
 */
public class ResultMeaningValidator implements SqlValidationRule;
```

### 2.6 execution — SQL 执行与结果格式化

```java
/**
 * 分页重写器: 在原 SQL 上包裹 OFFSET...FETCH NEXT。
 * 不支持 OFFSET 的语句 (如 SELECT TOP) 特殊处理。
 */
public class PaginationRewriter {
    /**
     * @param originalSql 用户原始 SQL
     * @param page 页码 (1-based)
     * @param pageSize 每页行数
     * @return 重写后的 SQL (SELECT COUNT 子句 + 分页 SQL)
     */
    public RewrittenSql rewrite(String originalSql, int page, int pageSize);

    public record RewrittenSql(
        String countSql,    // SELECT COUNT(*) FROM (...原始SQL...) AS cnt
        String pageSql      // 原始SQL + OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
    ) {}
}

/**
 * 结果收集器: 流式读取 ResultSet → 行列表。
 * 受内存上限保护: maxRowsTotal + maxResultBytes。
 */
public class ResultCollector {
    /**
     * @param rs ResultSet
     * @param maxRows 最大行数上限
     * @param maxBytes 最大字节数上限
     * @return 收集结果 (含 truncated 标记)
     */
    public CollectResult collect(ResultSet rs, int maxRows, int maxBytes);

    public record CollectResult(
        List<String> columns,
        List<List<Object>> rows,
        int totalRows,
        boolean truncated,
        long byteSize
    ) {}
}

/**
 * 结果格式化器: 策略模式
 */
public interface ResultFormatter {
    String format(CollectResult data);
}

/** Text 格式: Markdown 表格 */
public class TextFormatter implements ResultFormatter;

/** JSON 格式: { columns: [...], rows: [...], total_rows: N } */
public class JsonFormatter implements ResultFormatter;
```

### 2.7 tool — MCP Tool 层

```java
/**
 * Query 工具: MCP Tool 定义 + 参数映射。
 * 薄层: 只做请求参数验证 + 调用 Pipeline, 不含业务逻辑。
 */
public class QueryTool implements Tool {
    private final QueryPipelineService pipeline;
    private final ObjectMapper mapper;  // Jackson

    /**
     * MCP ToolSpecification 定义 (用于 McpServer 注册)
     */
    public ToolSpecification specification() {
        return new ToolSpecification(
            "query",
            "根据自然语言查询 SQL Server 数据库，返回 SQL 或查询结果",
            inputSchema()    // JSON Schema (见 PRD FR-9)
        );
    }

    /**
     * MCP Tool 调用入口
     * 参数映射: JSON Object → QueryRequest Record
     * 异常处理: 所有 McpException → 统一错误响应
     */
    public CallToolResult execute(ToolCall call) {
        try {
            var request = mapper.convertValue(call.arguments(), QueryRequest.class);
            var response = pipeline.execute(request);
            return response.toCallToolResult();
        } catch (McpException e) {
            return errorResponse(e);
        }
    }
}
```

### 2.8 pipeline — Pipeline 编排层

```java
/**
 * 查询 Pipeline: 编排完整处理流程。
 */
public class QueryPipelineService {
    private final SchemaProvider schemaProvider;
    private final SchemaContextBuilder contextBuilder;
    private final LlmClient llmClient;
    private final SqlExtractor sqlExtractor;
    private final List<SqlValidationRule> validationChain;  // L1, L2
    private final Optional<ParseOnlyValidator> parseOnlyValidator;  // L3
    private final Optional<ResultMeaningValidator> meaningValidator;  // L4 (特征开关)
    private final QueryExecutor queryExecutor;
    private final ResultFormatter formatter;
    private final QueryConfig config;

    public QueryPipelineService(
        SchemaProvider schemaProvider,
        SchemaContextBuilder contextBuilder,
        LlmClient llmClient,
        SqlExtractor sqlExtractor,
        List<SqlValidationRule> validationChain,   // L1 + L2
        Optional<ParseOnlyValidator> parseOnlyValidator,  // L3
        Optional<ResultMeaningValidator> meaningValidator, // L4
        QueryExecutor queryExecutor,
        ResultFormatter formatter,
        QueryConfig config
    ) {
        this.schemaProvider = schemaProvider;
        // ...
    }

    /**
     * 完整处理流程
     */
    public QueryResponse execute(QueryRequest request) {
        var requestId = requestContext(request);  // 请求追踪 ID

        // 1. Schema 获取
        var schema = schemaProvider.getSchema(request.database());

        // 2. LLM 调用 + SQL 提取
        var context = contextBuilder.buildContext(schema, request.query(), tokenBudget);
        var llmResult = llmClient.generateSql(PROMPT_TEMPLATE, context, request.query());
        var sql = sqlExtractor.extract(llmResult.content());

        // 3. 预校验 (L1 + L2) — SQL-only 和 Execute 模式都执行
        validateL1L2(sql, schema);

        // 4. Execute 模式: L3 → 执行 → L4
        if (request.isExecuteMode()) {
            validateL3(sql, schema);                     // SET PARSEONLY ON
            var result = queryExecutor.execute(sql, request);   // 含分页 + 收集
            validateL4(request.query(), sql, result);     // LLM 意义验证 (可选)
            return QueryResponse.success(
                formatter.format(result.data()),
                sql,
                result.metadata()
            );
        }

        // 5. SQL-only 模式: 仅返回 SQL
        return QueryResponse.sqlOnly(sql);
    }

    private void validateL1L2(String sql, DatabaseSchema schema);
    private void validateL3(String sql, DatabaseSchema schema);
    private void validateL4(String userQuery, String sql, ExecutionResult result);
}
```

**SQL-only vs Execute 模式差异**:

| 阶段 | SQL-only | Execute |
|------|----------|---------|
| Schema 获取 | 是 | 是 |
| LLM 生成 SQL | 是 | 是 |
| L1 正则预检 | 是 | 是 |
| L2 AST 校验 | 是 | 是 |
| L3 语法+对象存在性 | 否 | 是 |
| 执行 SQL | 否 | 是 |
| 分页 | 否 | 是 |
| L4 意义性验证 | 否 | 是 (特征开关) |
| 格式化 | 否 | 是 |

---

## 3. 核心数据模型

### 3.1 请求/响应 Record

```java
public record QueryRequest(
    @NotBlank String query,           // 自然语言查询
    @Nullable String database,        // 目标数据库, null → 默认第一个
    @Nullable Mode mode,              // sql_only / execute, 默认 execute
    @Min(1) @Nullable Integer page,   // 页码, 默认 1
    @Min(1) @Max(10000) @Nullable Integer pageSize,  // 每页行数, 默认 100
    @Nullable OutputFormat outputFormat  // text / json, 默认 text
) {
    public enum Mode { sql_only, execute }
    public enum OutputFormat { text, json }

    public boolean isExecuteMode() { return mode == null || mode == Mode.execute; }
}

/**
 * 统一响应: 成功和失败共享同一类型。
 */
public sealed interface QueryResponse
    permits QueryResponse.Success, QueryResponse.SqlOnly, QueryResponse.Error {

    record Success(
        String text,              // 格式化后的结果 (Markdown / JSON)
        Meta meta
    ) implements QueryResponse {
        public CallToolResult toCallToolResult() { /* MCP 响应格式 */ }
    }

    record SqlOnly(
        String sql
    ) implements QueryResponse {
        public CallToolResult toCallToolResult() { /* MCP 响应格式 */ }
    }

    record Error(
        String errorCode,
        String message,
        @Nullable String suggestion,
        Map<String, Object> details
    ) implements QueryResponse {
        public CallToolResult toCallToolResult() { /* MCP 错误响应格式 */ }
    }

    record Meta(
        String database,
        String mode,
        String sql,
        int rowCount,
        int totalRows,
        int page,
        int pageSize,
        double verificationScore,
        boolean verificationPassed,
        long executionTimeMs
    ) {}
}
```

### 3.2 错误模型

```java
/**
 * 密封错误层级: 每个具体错误一个类, errorCode 作为唯一标识。
 */
public sealed abstract class McpException extends RuntimeException
    permits InvalidInputException,
            ReadOnlyViolationException,
            SqlSyntaxException,
            SqlObjectNotFoundException,
            QueryTimeoutException,
            DbConnectionException,
            LlmApiException,
            LlmOutputParseException,
            SchemaNotFoundException,
            InternalException {

    private final String errorCode;
    private final String suggestion;
    private final Map<String, Object> details;

    // toCallToolResult() 生成 MCP 错误响应
    public abstract CallToolResult toCallToolResult();
}

// 各子类构造器固化 errorCode 和 suggest, 例如:
public final class ReadOnlyViolationException extends McpException {
    public ReadOnlyViolationException(String detectedKeyword) {
        super("READ_ONLY_VIOLATION",
              "检测到写入操作 (" + detectedKeyword + ")，当前仅允许 SELECT 查询",
              "请修改为 SELECT 查询",
              Map.of("detectedKeyword", detectedKeyword));
    }
}

public final class LlmOutputParseException extends McpException {
    public LlmOutputParseException(String rawOutput) {
        super("LLM_OUTPUT_PARSE_ERROR",
              "无法从 LLM 返回内容中提取有效 SQL 语句",
              "请尝试重新描述查询",
              Map.of("rawOutputSnippet", rawOutput.substring(0, Math.min(200, rawOutput.length()))));
    }
}
```

---

## 4. 核心流程

### 4.1 Execute 模式完整流程

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ QueryTool │   │Pipeline  │   │ Schema   │   │   LLM    │   │Validation│   │Execution │
│  (薄层)   │   │  Service │   │ Provider │   │  Client  │   │  Chain   │   │          │
└─────┬────┘   └─────┬────┘   └─────┬────┘   └─────┬────┘   └─────┬────┘   └─────┬────┘
      │  1.请求     │              │              │              │              │
      │────────────>│              │              │              │              │
      │              │  2.获取Schema│              │              │              │
      │              │────────────>│              │              │              │
      │              │<────────────│              │              │              │
      │              │  3.构建Context            │              │              │
      │              │──────────────────────────>│              │              │
      │              │  4.LLM生成SQL             │              │              │
      │              │──────────────────────────>│              │              │
      │              │<──────────────────────────│              │              │
      │              │  5.提取SQL                │              │              │
      │              │              │              │              │              │
      │              │  6.L1正则+L2 AST(必过)     │              │              │
      │              │─────────────────────────────────────────>│              │
      │              │<──────────────────────────────────────────│              │
      │              │  7.L3 SET PARSEONLY ON    │              │              │
      │              │─────────────────────────────────────────>│              │
      │              │<──────────────────────────────────────────│              │
      │              │  8.分页重写+执行           │              │              │
      │              │────────────────────────────────────────────────────────>│
      │              │<────────────────────────────────────────────────────────│
      │              │  9.L4 意义验证(可选)       │              │              │
      │              │──────────>│              │              │              │
      │              │  10.格式化结果              │              │              │
      │              │                                            │              │
      │  11.响应    │              │              │              │              │
      │<────────────│              │              │              │              │
```

### 4.2 Schema 加载并行流程

```
SchemaLoader.loadSchema(databaseName)
    │
    ├── StructuredTaskScope.ShutdownOnFailure 创建
    │
    ├── fork → loadTables()         ───→ INFORMATION_SCHEMA.TABLES
    ├── fork → loadColumns()        ───→ INFORMATION_SCHEMA.COLUMNS + sys.extended_properties
    ├── fork → loadPrimaryKeys()    ───→ TABLE_CONSTRAINTS + KEY_COLUMN_USAGE
    ├── fork → loadForeignKeys()    ───→ TABLE_CONSTRAINTS + CONSTRAINT_COLUMN_USAGE
    ├── fork → loadIndexes()        ───→ sys.indexes + sys.index_columns + sys.columns
    ├── fork → loadViews()          ───→ INFORMATION_SCHEMA.VIEWS
    └── fork → loadUserTypes()       ───→ sys.types
    │
    ├── scope.join()                ← 所有 fork 并行完成或任一失败
    ├── 组装 DatabaseSchema Record
    └── 返回 (不可变 Map)
```

### 4.3 SQL-only 模式简化流程

```
SQL-only 模式跳过 L3, Execution, L4:

Schema获取 → 构建Context → LLM生成SQL → 提取SQL → L1 → L2 → 返回SQL
```

---

## 5. 组合根设计

`SqlServerMcpApplication.main()` 是组合根，手动 new 所有依赖：

```java
public class SqlServerMcpApplication {
    public static void main(String[] args) {
        // 1. 加载配置
        var appConfig = ConfigLoader.load(args);

        // 2. 初始化可观测性
        var meterRegistry = new CompositeMeterRegistry();
        var openTelemetry = OpenTelemetryConfig.create();

        // 3. 初始化连接池
        var poolManager = new ConnectionPoolManager(appConfig.database());

        // 4. 初始化 Schema 模块
        var schemaLoader = new SchemaLoader(poolManager, appConfig.database());
        var schemaCache = new SchemaCache(schemaLoader, appConfig.database());
        schemaCache.initialize(appConfig.database().sources().stream()
            .map(DataSourceConfig::name).toList());

        // 5. 初始化 LLM 模块
        var llmClient = new LlmClient(appConfig.llm());
        var sqlExtractor = new SqlExtractor();
        var contextBuilder = new SchemaContextBuilder(appConfig.llm());

        // 6. 初始化校验链
        List<SqlValidationRule> validationRules = List.of(
            new SecurityValidator(),
            new SqlAstValidator()
        );
        var parseOnlyValidator = appConfig.database().sources().isEmpty()
            ? Optional.<ParseOnlyValidator>empty()
            : Optional.of(new ParseOnlyValidator(poolManager));
        var meaningValidator = appConfig.query().features().resultMeaningValidation()
            ? Optional.of(new ResultMeaningValidator(llmClient))
            : Optional.<ResultMeaningValidator>empty();

        // 7. 初始化执行模块
        var paginationRewriter = new PaginationRewriter();
        var resultCollector = new ResultCollector(
            appConfig.query().maxRowsTotal(),
            appConfig.query().maxResultBytes()
        );
        var queryExecutor = new QueryExecutor(poolManager, paginationRewriter, resultCollector);

        // 8. 初始化 Pipeline
        var pipeline = new QueryPipelineService(
            schemaCache, contextBuilder, llmClient, sqlExtractor,
            validationRules, parseOnlyValidator, meaningValidator,
            queryExecutor, appConfig.query()
        );

        // 9. 初始化 Tool
        var queryTool = new QueryTool(pipeline);

        // 10. 启动 MCP Server
        var transport = new StdioServerTransport();
        var capabilities = ServerCapabilities.builder()
            .tools(true)
            .build();

        var server = McpServer.sync(transport)
            .serverInfo("sqlserver-mcp", "1.0.0")
            .capabilities(capabilities)
            .tool(queryTool.specification())
            .build();

        // 11. 注册优雅关闭
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            server.close();
            poolManager.close();
        }));

        // 12. 阻塞等待 stdin (MCP stdio 模式)
        server.start();
    }
}
```

---

## 6. 配置设计

### 6.1 YAML 配置结构 (`application.yml`)

```yaml
mcp:
  server-name: sqlserver-mcp
  server-version: 1.0.0
  transport: stdio     # stdio / sse (本期仅 stdio)

database:
  schema-load-timeout: 3s
  schema-cache-max-tables: 500
  sources:
    - name: mydb
      host: localhost
      port: 1433
      database: mydb
      username: readonly_user
      # password: 从环境变量 DB_MYDB_PASSWORD 读取
      min-pool-size: 2
      max-pool-size: 10
      connection-timeout: 5s
      max-lifetime: 30m
      leak-detection-threshold: 60s

llm:
  api-base-url: https://api.deepseek.com/v1
  model: deepseek-v4-flash
  temperature: 0.1
  max-tokens: 2000
  timeout: 30s
  max-retries: 3
  retry-delays:
    - 1s
    - 3s
    - 9s
  # api-key: 从环境变量 LLM_API_KEY 读取

query:
  default-page-size: 100
  max-page-size: 10000
  max-rows-total: 100000
  max-result-bytes: 52428800   # 50MB
  features:
    result-meaning-validation: true

observability:
  metrics:
    enabled: true
    jmx-enabled: false
  tracing:
    enabled: false
    endpoint: ""
  logging:
    level: INFO
    audit-log-path: ./logs/audit
```

### 6.2 环境变量

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `LLM_API_KEY` | 是 | DeepSeek API Key |
| `DB_{NAME}_PASSWORD` | 是 | 每个数据库的密码 (NAME 大写) |
| `LOG_LEVEL` | 否 | 日志级别, 默认 INFO |
| `CONFIG_PATH` | 否 | 配置文件路径, 默认 ./application.yml |

---

## 7. 可观测性设计

### 7.1 结构化日志

```
// 格式: JSON (Logback + net.logstash.logback.encoder)
{
  "@timestamp": "2026-05-17T10:30:00.123+08:00",
  "level": "INFO",
  "logger": "com.sqlserver.mcp.pipeline.QueryPipelineService",
  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "database": "mydb",
  "mode": "execute",
  "latencyMs": 1250,
  "stage": "llm_generate",
  "rows": 42,
  "message": "Query executed successfully"
}
```

### 7.2 Micrometer 指标

| 指标名 | 类型 | Tag | 说明 |
|--------|------|-----|------|
| `mcp.query.total` | Counter | database, mode, status | 查询总次数 |
| `mcp.query.duration` | Timer | database, mode | 查询耗时分布 |
| `mcp.llm.duration` | Timer | operation (generate/validate) | LLM 调用耗时 |
| `mcp.validation.result` | Counter | layer (L1-L4), result (pass/reject) | 各层校验结果 |
| `mcp.schema.cache.size` | Gauge | database | Schema 缓存表数 |
| `mcp.pool.active` | Gauge | database | 活跃连接数 |
| `mcp.pool.idle` | Gauge | database | 空闲连接数 |
| `mcp.pool.pending` | Gauge | database | 等待获取连接的线程数 |

### 7.3 OpenTelemetry Tracing

每条查询请求创建 Trace，包含 Span:

| Span | 父 Span | 说明 |
|------|---------|------|
| `query` | — | 根 Span, 含 requestId |
| `schema.load` | `query` | Schema 缓存加载 (缓存命中则极短) |
| `llm.generate` | `query` | LLM SQL 生成 |
| `llm.validate` | `query` | LLM 意义验证 (L4) |
| `sql.validate` | `query` | L1-L3 校验 |
| `sql.execute` | `query` | SQL 执行 |

### 7.4 审计日志

独立 Logback Appender，记录所有执行的 SQL：

```
2026-05-17T10:30:00 [a1b2c3d4] DB=mydb SQL="SELECT * FROM orders" ROWS=42 LATENCY=150ms
```

轮转策略: 每日轮转, 保留 90 天。

---

## 8. 安全设计

### 8.1 SQL 校验协作流程

```
                ┌─────────────────────────────┐
                │     QueryPipelineService     │
                │                              │
                │  1. SQL 文本                  │
                │     ↓                        │
                │  2. SecurityValidator (L1)   │
                │     → 正则预检                │
                │     → 拒绝: readOnlyViolation │
                │     ↓ passed                 │
                │  3. SqlAstValidator (L2)     │
                │     → JSqlParser 解析 AST    │
                │     → 拒绝: readOnlyViolation │
                │     → 降级: if parse fail    │
                │     ↓ passed                 │
                │  4. ParseOnlyValidator (L3)  │
                │     → SET PARSEONLY ON       │
                │     → 对象存在性检查           │
                │     → 拒绝: sqlSyntaxError /  │
                │       sqlObjectNotFound      │
                │     ↓ passed                 │
                │  5. 执行 SQL                 │
                │     ↓                        │
                │  6. ResultMeaningValidator    │
                │     (L4, 可选)                │
                │     → LLM 采样验证            │
                │     → 警告但不拒绝             │
                └─────────────────────────────┘
```

### 8.2 危险对象分层

根据 CLAUDE.md `危险对象列表` 分层实现:

| 层级 | 检测位置 | 对象 | 拦截行为 |
|------|----------|------|----------|
| L0 预处理 | SecurityValidator (前处理) | Unicode NFC 归一化, 零宽字符剥离, 注释去除, 大写转换 | 反混淆: `SEL​ECT` → `SELECT`, `IN/**/SERT` → `INSERT` |
| L1 关键字 | SecurityValidator | INSERT, UPDATE, DELETE, DROP, CREATE, ALTER, TRUNCATE, MERGE, GRANT, REVOKE, DENY, EXEC, EXECUTE | 直接拒绝 |
| L1 危险函数 | SecurityValidator | xp_cmdshell, xp_delete_file, xp_regread, sp_configure, sp_executesql 等 | 直接拒绝 |
| L1 危险对象 | SecurityValidator | OPENROWSET, OPENDATASOURCE, OPENQUERY, BULK INSERT | 直接拒绝 |
| L2 语法类型 | SqlAstValidator | 非 SELECT/WITH 的 Statement 类型 | AST 层级拒绝 |

### 8.3 LLM API Key 安全

- `LlmConfig.apiKey` 从环境变量 `LLM_API_KEY` 读取，不在 YAML/代码中硬编码
- 日志输出过滤: Logback Pattern 中屏蔽 `Authorization` Header 内容
- 错误消息中不透露 API Key 信息 (如 "401 Unauthorized" 不输出原始请求详情)

---

## 9. 测试设计

### 9.1 测试层次

```
┌────────────────────────────────────────────┐
│  E2E 测试 (MCP Java SDK Client)            │
│  启动完整 Server → 发送 JSON-RPC → 验证响应  │
│  golden path + 全部错误分支                 │
├────────────────────────────────────────────┤
│  集成测试 (Testcontainers MSSQL)           │
│  SchemaLoader: 空库/多表/视图/外键/索引      │
│  ConnectionPoolManager: 连接失败恢复/并发   │
│  QueryExecutor: SQL 执行/分页               │
├────────────────────────────────────────────┤
│  单元测试 (JUnit 5 + Mockito)              │
│  SecurityValidator: 全部危险关键字组合      │
│  SqlAstValidator: 各种 SQL 类型 / 降级路径   │
│  SqlExtractor: 代码块/无代码块/异常输出      │
│  SchemaContextBuilder: Token 精简策略       │
│  PaginationRewriter: 各种 SQL 分页改写      │
│  ResultFormatter: Text/JSON 格式            │
│  LlmRetryHandler: 重试/不重试场景           │
├────────────────────────────────────────────┤
│  Bench (JMH, 独立执行)                     │
│  Schema 加载, SQL 执行, LLM JSON 序列化     │
└────────────────────────────────────────────┘
```

### 9.2 关键测试场景矩阵

| 场景 | 层级 | 输入 | 预期 |
|------|------|------|------|
| 合法 SELECT | L1+L2 | `SELECT * FROM users` | 通过 |
| 合法 WITH CTE | L1+L2 | `WITH cte AS (...) SELECT * FROM cte` | 通过 |
| INSERT 注入 | L1+L2 | `SELECT 1; INSERT INTO users VALUES(1)` | L2 拒绝 (AST 检测到多语句) |
| 注释绕过 | L1+L2 | `SELECT 1 /*! INSERT INTO users */` | L1 归一化后检测注释, L2 AST 仅解析 SELECT |
| 零宽字符 | L1 | `SEL​ECT` | L1 预处理检测并拒绝 |
| 大小写绕过 | L1 | `insert INTO users` | L1 转大写后检测 |
| 危险函数 | L1 | `SELECT * FROM OPENROWSET(...)` | L1 拒绝 |
| LLM SQL 代码块 | SqlExtractor | `` ```sql SELECT 1 ``` `` | 正确提取 `SELECT 1` |
| LLM 无代码块 | SqlExtractor | `"Here is the SQL: SELECT 1 FROM dual"` | 提取 `SELECT 1 FROM dual` |
| LLM 无 SQL | SqlExtractor | `"I cannot answer that"` | `LlmOutputParseException` |
| 分页空结果第1页 | PaginationRewriter | page=1, 空表 | 返回空行列表, totalRows=0 |
| 分页超出范围 | PaginationRewriter | page=999, page_size=100 | 返回空行列表 |
| Schema 精简触发 | SchemaContextBuilder | 100 表 Schema + Token 超预算 | 仅返回表名列名 |
| Layer 4 低分 | ResultMeaningValidator | 评分 0.3 | 结果 + 警告, 不拒绝 |

### 9.3 测试规范 (与 CLAUDE.md 一致)

```java
@DisplayName("SecurityValidator — Layer 1 正则预检")
class SecurityValidatorTest {

    @Test
    @DisplayName("validate_shouldReject_whenContainsInsertKeyword")
    void validate_shouldReject_whenContainsInsertKeyword() {
        var validator = new SecurityValidator();
        assertThrows(ReadOnlyViolationException.class,
            () -> validator.check("INSERT INTO users VALUES (1)", null));
    }

    @Test
    @DisplayName("validate_shouldPass_whenValidSelectStatement")
    void validate_shouldPass_whenValidSelectStatement() {
        var validator = new SecurityValidator();
        assertDoesNotThrow(() -> validator.check("SELECT * FROM users WHERE id = 1", null));
    }
}
```

---

## 10. 构建与运行

参见 CLAUDE.md §7 构建与运行，增加如下设计阶段确认:

### 10.1 Maven 依赖关键版本

| 依赖 | GroupId:ArtifactId | 版本 (建议) | 说明 |
|------|--------------------|-------------|------|
| MCP Java SDK | io.modelcontextprotocol:mcp | 0.7.0+ | 官方 MCP SDK |
| MSSQL JDBC | com.microsoft.sqlserver:mssql-jdbc | 12.8.0+ | SQL Server 驱动 |
| HikariCP | com.zaxxer:HikariCP | 6.0.0+ | 连接池 |
| JSqlParser | com.github.jsqlparser:jsqlparser | 5.0+ | SQL 解析 |
| OkHttp | com.squareup.okhttp3:okhttp | 4.12+ | HTTP 客户端 |
| Jackson | com.fasterxml.jackson.core:jackson-databind | 2.17+ | JSON 处理 |
| SLF4J | org.slf4j:slf4j-api | 2.0+ | 日志门面 |
| Logback | ch.qos.logback:logback-classic | 1.5+ | 日志实现 |
| JSpecify | org.jspecify:jspecify | 1.0+ | 空值注解 |
| Micrometer | io.micrometer:micrometer-core | 1.13+ | 指标 |
| OpenTelemetry | io.opentelemetry:opentelemetry-api | 1.40+ | 追踪 |
| JUnit 5 | org.junit.jupiter:junit-jupiter | 5.11+ | 测试 |
| Mockito | org.mockito:mockito-core | 5.11+ | Mock |
| Testcontainers | org.testcontainers:mssqlserver | 1.20+ | 集成测试 |
| JMH | org.openjdk.jmh:jmh-core | 1.37+ | 基准测试 |

**版本管理策略**: 设计文档标注最低兼容版本(`+`后缀)。`pom.xml` 使用 `<dependencyManagement>` 锁定精确版本，通过 `versions-maven-plugin` 定期检查更新。OWASP Dependency-Check 配置 `failBuildOnCVSS >= 7` 阻断高危漏洞。

### 10.2 Maven Profile 设计

| Profile | 激活条件 | 执行的插件 |
|---------|----------|-----------|
| `default` | 默认 | compiler, surefire (单元测试) |
| `integration` | `-P integration` | failsafe (集成测试, Testcontainers) |
| `lint` | `-P lint` | checkstyle, pmd, spotbugs, error-prone |
| `jmh` | `-P jmh` | jmh-maven-plugin (基准) |

---

## 11. 待优化与风险

| 编号 | 风险/优化 | 影响 | 缓解方案 |
|------|-----------|------|----------|
| R1 | Layer 4 LLM 验证增加查询延迟 (每次多一次 LLM 调用) | 中 | 特征开关控制默认关闭, 按需开启 |
| R2 | JSqlParser T-SQL 方言兼容性不足 (TOP, OUTPUT, MERGE 等) | 中 | L2 宽松模式 → 降级到 L3 SET PARSEONLY ON |
| R3 | Virtual Threads + HikariCP 在极高并发下连接池耗尽 | 低 | 监控 pool.pending 指标, 调优 maxPoolSize; 提供 virtualThread.concurrency.limit 配置项 |
| R4 | 大结果集 (10k+ 行) 内存占用 | 中 | FetchSize=1000, maxRowsTotal(100000) + maxResultBytes(50MB) 双重保护; 超限时返回 truncated=true + 警告 |
| R5 | 多数据库配置下 Schema 启动加载时间随库数量线性增长 | 低 | 各库 Schema 加载在虚拟线程中并行, 互不阻塞; 任一库加载失败记录 WARN, 查询时按需加载 |
| R6 | LLM API 不可用/限流/异常响应导致查询不可用 | 高 | CircuitBreaker 熔断保护 (滑动窗口 10 请求, 50% 失败率触发, 30s 后半开重试); fallback 返回清晰错误提示 |

---

**变更记录**

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.0 | 2026-05-17 | 初始版本, 基于 PRD 0001 和项目 CLAUDE.md 构建设计 | Claude |
| v1.1 | 2026-05-17 | Codex 架构评审反馈: 新增 R6 CircuitBreaker, L0 预处理层, 缓存单飞保护, 细化 R3/R4/R5 缓解方案 | Claude |
