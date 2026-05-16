# sqlserver-mcp-java — CLAUDE.md

## 项目本质

基于 MCP Java SDK 的 SQL Server 自然语言查询服务。接收自然语言描述，利用 LLM (DeepSeek-v4-flash) 生成 T-SQL，经四层校验后返回 SQL 或查询结果。

**技术栈**: OpenJDK 26, MCP Java SDK v0.7+, Maven 3.9.6+, mssql-jdbc, HikariCP, JSqlParser, OkHttp, Jackson, SLF4J + Logback, JUnit 5 + Mockito 5.11+ + Testcontainers, JMH, JSpecify, Micrometer, OpenTelemetry

---

## 1. Java 编码规范

### 1.1 语言等级与特性 (OpenJDK 26)

| 特性 | 使用场景 | 禁止替代 |
|------|----------|----------|
| **Virtual Threads** (`Executors.newVirtualThreadPerTaskExecutor()`) | 所有 JDBC 阻塞调用、LLM HTTP 调用 | 平台线程池、CompletableFuture 默认池 |
| **StructuredTaskScope** (`new StructuredTaskScope.ShutdownOnFailure()`) | Schema 多维度并行加载 | `ExecutorService.invokeAll`、手动 `CountDownLatch` |
| **Record** | 所有不可变数据载体 (ColumnInfo, TableInfo, QueryRequest, 等) | 手写 POJO + getter/setter/equals/hashCode |
| ** sealed class/interface** | 错误类型层级 (`McpException` → 具体子类) | 枚举错误码 + 通用异常 |
| **TextBlock** (`"""..."""`) | 所有多行字符串 (Prompt 模板、SQL 模板) | 字符串拼接、`StringBuilder` |
| **Pattern Matching for switch** (`switch (obj) { case X x -> ... }`) | 类型分支判断、Result 模式匹配 | `instanceof` + 强制转型 |
| **SequencedCollection / SequencedMap** | 需要有序集合操作的场景 | 旧版 `SortedSet` 接口 |
| **Optional** | 可能无返回值的 public API | `null` 返回值 |
| ** java.time.* (Instant, LocalDate, etc.)** | 所有日期时间操作 | `java.util.Date` / `Calendar` |
| **@NullMarked / @Nullable (JSpecify)** | 包级别空值标记 | 靠文档约定 |

**JSpecify 集成**: 在 `pom.xml` 添加 `org.jspecify:jspecify:1.0.0` 依赖，在根包 `package-info.java` 标记 `@NullMarked`。配合 IDE 和 ErrorProne 静态检查，确保空值安全。

### 1.2 包结构

```
com.sqlserver.mcp/
├── SqlServerMcpApplication.java       # 入口 + 组合根 (手动 DI)
├── config/                            # 配置 POJO + YAML 加载
├── model/
│   ├── schema/                        # ColumnInfo, TableInfo, DatabaseSchema 等 Record
│   ├── query/                         # QueryRequest, QueryResponse, ResultSetData 等 Record
│   └── error/                         # McpException 层级 (sealed) + 错误码枚举
├── datasource/                        # ConnectionPoolManager, DataSourceFactory
├── schema/                            # SchemaLoader, SchemaCache, SchemaContextBuilder
├── llm/                               # LlmClient, LlmRetryHandler, PromptBuilder, SqlExtractor
├── validation/                        # SecurityValidator (L1), SqlAstValidator (L2), ParseOnlyValidator (L3), ResultMeaningValidator (L4)
├── execution/                         # PaginationRewriter, ResultFormatter, ResultSetDataCollector
├── pipeline/                          # QueryPipelineService (编排层)
├── tool/                              # QueryTool (MCP 参数映射, 薄层)
└── util/                              # JsonUtils, LogUtils (无业务逻辑)
```

### 1.3 命名规范

| 元素 | 规范 | 反例 |
|------|------|------|
| 类/接口 | PascalCase | `sql_validator` |
| 方法 | camelCase, 动词开头 | `Validation()` |
| 常量 | UPPER_SNAKE | `maxRetryCount` |
| 局部变量 | camelCase, 不缩写 | `connPool` → `connectionPool` |
| Record | 名词单数 | `ColumnInfo` |
| 布尔方法 | `is...`, `has...`, `should...` | `checkValid()` → `isValid()` |
| 工厂方法 | `of(...)`, `from(...)`, `create(...)` | `newInstance(...)` |
| 包名 | 全小写单数 | `com.sqlserver.mcp.validation` |
| 测试类 | `{TargetClass}Test` | `test_{target}` |
| 测试方法 | `{methodName}_{expectedBehavior}_{condition}` | `test1` |

### 1.4 代码风格

- 缩进: 4 空格, 行宽: 120 字符
- 大括号: K&R 风格 (左大括号不换行)
- `@Override` 必须写 (即使是 Record 自动生成的方法)
- **禁止**: `System.out.println`, `printStackTrace`, 原始类型, `@SuppressWarnings("unchecked")`
- 日志: 仅 SLF4J, 参数化占位符 `{}`, 异常传最后一个参数
- Lambda 参数类型可省略时省略；超过 3 步的 Stream 拆为中间变量
- 方法签名参数 >= 5 个 → Record 或 Builder
- `import` 禁止 `*` 通配符

---

## 2. SOLID — 代码即设计

### S — 单一职责

- **一个类 = 一个变化原因**. SchemaLoader 只做 JDBC → DatabaseSchema; SchemaCache 只做存储 + 过期
- 方法超过 200 行必须拆分；类超过 500 行必须有注释说明理由（且 combo root 除外）
- 工具类 (util/) 禁止包含业务逻辑

### O — 开闭原则

- 校验链用策略/责任链模式，新增校验规则只需实现 `SqlValidationRule` 接口

```java
@FunctionalInterface
interface SqlValidationRule {
    ValidationResult check(String sql, SchemaContext context);
}
```

- 结果格式化用策略模式：`TextFormatter`, `JsonFormatter` 实现 `ResultFormatter`
- QueryPipelineService 对其他阶段无知，只编排顺序

### L — 里氏替换

- `interface` 优先于 `abstract class`；只在有共享状态/模板方法时才用 abstract class
- **禁止** `instanceof` + 强制转型做类型分支 —— 用多态 + Pattern Matching switch

### I — 接口隔离

- `SchemaProvider` (查询) 与 `SchemaCache` (管理缓存) 分开
- `LlmClient` (调用 API) 与 `SqlExtractor` (解析输出) 分开

### D — 依赖倒置

- **组合根模式 (Composition Root)**: `SqlServerMcpApplication.main()` 手动 new 所有依赖，禁止任何类自己查找依赖
- 所有依赖通过构造器注入 (Record 式参数或 final field + constructor)
- 禁止: 服务定位器、静态工厂、`@Autowired`
- 禁止: `new ServiceXxx()` 在业务代码中出现

---

## 3. DRY 与复用

- 相似代码出现 **2 次** 考虑提取，**3 次必须提取**
- JDBC 操作封装模板方法 / try-with-resources 包装器

```java
public <T> T withConnection(String database, Function<Connection, T> action) {
    try (Connection conn = poolManager.getConnection(database)) {
        return action.apply(conn);
    } catch (SQLException e) {
        throw new DbConnectionException("DB operation failed", e);
    }
}
```

- LLM 调用 (SQL 生成 + 结果验证) 共用重试/超时逻辑，子类/策略只提供 Prompt 内容
- Schema 加载中各维度查询 (表、列、索引...) 共享连接和错误处理逻辑
- **JSqlParser T-SQL 方言**: 对 `TOP` / `OFFSET FETCH` / `MERGE` 等 SQL Server 特有语法，Layer 2 宽松模式下解析失败可降级到 Layer 3 (SET PARSEONLY ON) 验证，不阻塞正确 SQL

---

## 4. 代码质量红线

### 4.1 必须做

| 规则 | 说明 |
|------|------|
| **编译时类型安全** | 禁止原始类型 `List` → `List<ColumnInfo>` |
| **不可变性** | 所有 Model Record + Collections.unmodifiableMap() |
| **资源管理** | `Connection`/`Statement`/`ResultSet` → try-with-resources |
| **安全异常处理** | 捕获具体异常, 禁止 `catch (Exception)`/`catch (Throwable)` |
| **Virtual Thread + JDBC** | 统一通过虚拟线程执行器, 禁止 `synchronized` / `ThreadLocal` |
| **配置外部化** | 所有敏感信息/连接参数来自环境变量或 config 文件 |
| **结构化日志** | 包含 requestId, databaseName, latencyMs |
| **请求追踪** | 每个请求自动生成 requestId (UUID), MDC 注入, 贯穿全链路 |

**Virtual Threads + HikariCP 适配**: HikariCP 默认配置下虚拟线程与连接池兼容良好，但需注意: (1) `maxLifetime` 建议设为略低于 JDBC 驱动/数据库的连接超时; (2) 虚拟线程是轻量级占位，连接获取等待仍会挂起虚拟线程，不影响 carrier 线程; (3) 避免在虚拟线程中嵌套 `synchronized` 或 `ThreadLocal` 调用; (4) 连接泄漏检测 `leakDetectionThreshold` 建议设为 60s。

### 4.2 禁止做

- 字段注入 / `@Autowired` / 服务定位器
- `synchronized` 块 → `ConcurrentHashMap` / `ReentrantLock`
- `ThreadLocal` (Virtual Thread 不兼容)
- JDBC 中使用 `Statement` → 必须 `PreparedStatement`
- SQL 字符串拼接 → 参数化查询 / `StringTemplate`
- 硬编码任何秘密 (API Key / 密码 / 连接串)
- `null` 返回值 → `Optional` 或 sealed Result 类型
- 捕获 `InterruptedException` 后不恢复中断标志

### 4.3 错误处理模式

```java
// 用 sealed 层级约束错误类型
public sealed abstract class McpException extends RuntimeException
    permits InvalidInputException, ReadOnlyViolationException, SqlSyntaxException,
            SqlObjectNotFoundException, QueryTimeoutException, DbConnectionException,
            LlmApiException, LlmOutputParseException, SchemaNotFoundException,
            InternalException {

    private final String errorCode;
    private final String suggestion;

    protected McpException(String errorCode, String message, String suggestion) {
        super(message);
        this.errorCode = errorCode;
        this.suggestion = suggestion;
    }
}

// Pipeline 层集中 catch → 统一响应
try {
    return pipeline.execute(request);
} catch (McpException e) {
    return QueryResponse.error(e.toMeta(), e.getMessage());
} catch (Exception e) {
    log.error("Unexpected error [requestId={}]", requestId, e);
    return QueryResponse.error(new InternalException("内部错误"), "...");
}
```

---

## 5. 测试规范

### 5.1 测试层次与覆盖

| 层级 | 工具 | 目标覆盖 | 运行时间 |
|------|------|----------|----------|
| **Unit** | JUnit 5 + Mockito | 每个 public 方法 ≥ 95% 行覆盖 | < 1s |
| **Integration** | Testcontainers (MSSQL) | 每个 Repository/Loader 一个 | < 30s |
| **E2E** | MCP Java SDK Client | golden path + 全部错误分支 | < 60s |
| **Benchmark** | JMH | Schema 加载, SQL 执行 | 独立执行 |

### 5.2 单元测试规范

```java
@DisplayName("SecurityValidator — Layer 1 正则预检")
class SecurityValidatorTest {

    @Test
    @DisplayName("validate_shouldReject_whenContainsInsertKeyword")
    void validate_shouldReject_whenContainsInsertKeyword() {
        var validator = new SecurityValidator();
        assertThrows(ReadOnlyViolationException.class,
            () -> validator.validate("INSERT INTO users VALUES (1)"));
    }

    @Test
    @DisplayName("validate_shouldPass_whenValidSelectStatement")
    void validate_shouldPass_whenValidSelectStatement() {
        var validator = new SecurityValidator();
        assertDoesNotThrow(() -> validator.validate("SELECT * FROM users"));
    }
}
```

- **命名**: `{method}_{expected}_{condition}` — Given-When-Then 三要素
- **约束**: 只 mock 外部依赖 (DB, LLM), 不 mock 内部逻辑
- **断言**: 用 `assertThrows` 验证异常, 不测异常消息字符串
- **每个测试只测一个行为**, 不超过 15 行

### 5.3 集成测试规范

- Testcontainers `MSSQLServerContainer` 初始化测试数据库
- Schema 加载覆盖: 空库、多表、视图、索引、外键
- 连接池覆盖: 连接失败恢复、多并发获取连接
- 使用测试特定配置 `application-test.yml`

### 5.4 边界与安全测试

| 场景 | 验证点 |
|------|--------|
| 注释注入 `SELECT 1; /**/ INSERT` | L2 AST 检测 |
| 编码绕过 `IN/**/SERT`, `INS​RT` (零宽字符) | L1 归一化反混淆 |
| 大小写绕过 `insert INTO users` | L1 预处理转大写 |
| 多层嵌套 `SELECT * FROM (SELECT ...)` | L2 正常通过 |
| 并发压力 (10+ 虚拟线程) | 无死锁, 无数据竞争 |
| LLM 超时/空返回/格式错误 | 各自返回明确错误码 |
| 大结果集截断 (超 10000 行 / 50MB) | `truncated=true`, 不 OOM |

---

## 6. 性能约束

| 指标 | 目标 | 验证 |
|------|------|------|
| Schema 加载 (< 100 表) | < 3s | JMH / Testcontainers |
| SQL 生成 (简单) | < 5s | Mock LLM + 集成测试 |
| SQL 生成 (复杂) | < 15s | Mock LLM + 集成测试 |
| SQL 执行超时 | 可配置, 默认 30s | 集成测试 |
| 并发支持 | >= 10 | `@RepeatedTest` + Virtual Threads |
| 连接池 | min=2, max=10/库 | 配置检查 + 集成测试 |
| 结果集内存上限 | < 50 MB | FetchSize + ResultSetDataCollector |

### 性能编码原则

- Virtual Threads 用于 IO 密集型阻塞 (JDBC, HTTP)，不用于 CPU 密集型计算
- Schema 各维度并行加载使用 `StructuredTaskScope.ShutdownOnFailure`，单库超时 3s
- 结果集使用 `PreparedStatement.setFetchSize(1000)` 避免一次加载全部
- 对象创建: Record 比手写 POJO 轻量，优先使用；热点路径注意装箱/拆箱
- **警惕过早优化**: 先正确 → 可读 → 可测, JMH 定位热点后再优化
- **连接池调优**: `maxPoolSize` 应与虚拟线程并发数匹配，建议 minIdle=2, maxPoolSize=10/库；连接泄漏检测 `leakDetectionThreshold=60000ms`

### 可观测性

| 维度 | 工具 | 要求 |
|------|------|------|
| **日志** | SLF4J + Logback | 结构化 JSON 格式, 含 requestId/database/latencyMs |
| **审计** | 独立 Logback Appender | 所有 SQL 执行写入独立审计文件, 使用 `TimeBasedRollingPolicy` (每日轮转, 保留 90 天) |
| **指标** | Micrometer | 暴露关键指标: query 调用量/延迟分位数/错误率/LLM 延迟/连接池状态 |
| **追踪** | OpenTelemetry | 请求级追踪: Schema 加载 → LLM 调用 → SQL 校验 → 执行 全链路 span |

### 安全扫描

| 工具 | 用途 | 集成方式 |
|------|------|----------|
| **OWASP Dependency-Check** | 依赖漏洞扫描 | Maven 插件 `dependency-check-maven`, 通过 `mvn dependency-check:aggregate` 执行 |
| **ErrorProne** | 编译时静态分析 | Maven 插件 `error-prone-maven-plugin`, 集成于 `mvn compile` |
| **SpotBugs** | 字节码级别缺陷检测 | Maven 插件 `spotbugs-maven-plugin`, 配合 `findsecbugs` 安全规则 |
| **Trivy / Grype** (CI 中) | 容器/文件系统扫描 | CI 流水线中集成, 扫描构建产物 |

---

## 7. 构建与运行

```bash
# 构建
mvn compile

# 测试
mvn test                          # 单元测试
mvn verify -P integration           # 集成测试 (Testcontainers)
mvn verify                        # 全部检查 = compile + test + integration + checkstyle + pmd + spotbugs

# 性能基准
mvn package                        # 先构建
# JMH 基准测试: mvn verify -P jmh (需配置 jmh-maven-plugin)

# 运行 (stdio mode)
export DB_CONFIG='[{"name":"mydb","host":"localhost","port":1433,"database":"mydb",...}]'
export LLM_API_KEY=sk-xxx
mvn exec:java -Dexec.mainClass="com.sqlserver.mcp.SqlServerMcpApplication"

# 静态分析 (提交前必须全过)
mvn checkstyle:check               # Checkstyle
mvn pmd:check                      # PMD
mvn spotbugs:check                 # SpotBugs
mvn dependency-check:aggregate     # OWASP 依赖漏洞扫描
```

**依赖版本集中管理** — 使用 `pom.xml` 的 `<dependencyManagement>` + `<properties>` 统一管理版本。

---

## 8. 工作流约束

1. **设计先于编码**: 修改前更新 `0002-pg-mcp-design-by-claude.md`
2. **测试先于实现**: 新增功能先写失败测试 → 实现 → 绿
3. **代码评审**: 合并前 `mvn verify` 全过, Review 关注: 线程安全、资源释放、异常处理、JSqlParser T-SQL 方言兼容性
4. **提交粒度**: 每个原子变更一个提交, 格式 `feat|fix|refactor|test|docs: 简短描述`
5. **警惕过早优化**: 正确性第一, JMH 验证后再优化
6. **依赖升级**: 升级 JDK/mssql-jdbc/HikariCP 等核心依赖前通过全套测试

### 特性开关 (Feature Toggles)

实验性功能 (如 Layer 4 语义验证、LLM query 改写) 通过配置开关控制：

```yaml
query:
  features:
    result-meaning-validation: true   # Layer 4，可单独关闭
    llm-query-rewrite: false          # 实验性功能，默认关闭
```

开关在 `QueryConfig` 中定义为 `boolean`，Pipeline 中检查后跳过对应阶段。功能稳定并经过性能评估后提升为默认启用。`@Deprecated` 标记的开关配置保留 2 个版本后移除。
