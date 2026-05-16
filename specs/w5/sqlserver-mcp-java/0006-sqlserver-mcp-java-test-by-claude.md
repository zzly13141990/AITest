# sqlserver-mcp-java 测试文档

**文档编号**: 0006-sqlserver-mcp-java-test-by-claude.md
**版本**: v1.0
**日期**: 2026-05-17
**状态**: Draft
**前置文档**: 0002-pg-mcp-design-by-claude.md (设计文档), 0003-sqlserver-mcp-plan-by-claude.md (实现计划), CLAUDE.md (项目规范)

---

## 1. 测试总览

### 1.1 测试策略

项目采用四层测试策略, 遵循测试金字塔原则:

| 层级 | 工具 | 数量 | 运行方式 | 目标 |
|------|------|------|----------|------|
| **单元测试 (Unit)** | JUnit 5 + Mockito | 35 类 ~208 方法 | `mvn test` (Surefire) | 每个 public 方法 ≥ 95% 行覆盖 |
| **集成测试 (Integration)** | Testcontainers (MSSQL) | 0 (已规划) | `mvn verify -P integration` (Failsafe) | SchemaLoader, QueryExecutor 真实数据库验证 |
| **端到端测试 (E2E)** | Testcontainers + MCP SDK | 1 类 2 方法 | `mvn verify -P integration -De2e.enabled=true` | 完整黄金路径 + 错误分支 |
| **基准测试 (Benchmark)** | JMH | 2 类 10 基准 | `mvn verify -P jmh` | 性能基线, 防止回归 |

### 1.2 当前状态

- **`mvn test` (单元测试)**: 208 通过, 0 失败, 0 错误 — BUILD SUCCESS
- **`mvn verify -P integration` (集成/E2E 测试)**: 需要 Docker 环境
- **`mvn verify -P jmh` (JMH 基准)**: 需要 Maven 3.6+ (当前 3.5.3 不支持 jmh-maven-plugin)

### 1.3 测试隔离原则

| 关注点 | 做法 |
|--------|------|
| **外部依赖** | DB 连接池 → Mock `ConnectionPoolManager`; LLM API → `HttpServer` 模拟或 Mock |
| **文件 I/O** | YAML 配置 → `Files.createTempFile()` 临时文件 |
| **时间依赖** | `Instant.now()` → Record 默认值, 不 mock 时间 |
| **线程/并发** | `StructuredTaskScope` 异步测试 → `awaitCache` 轮询 + 超时 |
| **异常路径** | Mock Throw → 验证错误码和 retryable 标记 |

### 1.4 Mockito 使用规范

- 所有 Mock 测试类使用 `@ExtendWith(MockitoExtension.class)`
- Mock 对象用 `@Mock` 注解声明 (无手动 `Mockito.mock()`)
- `@Mock` 字段由 MockitoExtension 自动初始化, 无需 `@BeforeEach`
- `when().thenReturn()` / `when().thenThrow()` 模式
- 方法引用 mock 使用 `any(SqlFunction.class)` 匹配泛型参数
- 链式 mock: `mock(Connection.class)` → `mock(PreparedStatement.class)` → `mock(ResultSet.class)`

---

## 2. 按 Phase 测试文件清单

### 2.1 Phase 0: 项目脚手架

#### YamlConfigLoaderTest

| 测试方法 | 测试内容 | 断言 |
|----------|----------|------|
| `load_shouldReturnDefaults_whenConfigFileNotFound` | 不存在文件返回默认配置 | 检查 mcp.serverName, sources 空, llm.model |
| `load_shouldReadFromCustomPath` | 从临时 YAML 文件加载自定义配置 | 检查 serverName 覆盖 |
| `load_shouldParseDatabaseSources` | 解析数据源配置 (名称/端口/池大小) | 检查 DataSourceConfig 字段 |
| `load_shouldParseLlmConfig` | 解析 LLM 配置 (URL/model/temperature/tokens) | 检查 LlmConfig 字段 |
| `load_shouldParseQueryConfig` | 解析查询配置 (分页/行数/特征开关) | 检查 QueryConfig + Features 字段 |
| `load_shouldHandleInvalidPathGracefully` | 无效路径不抛异常 | `assertDoesNotThrow` |
| `load_shouldUseEnvVarForApiKey` | API Key 从环境变量读取 | 检查 apiKey 为空字符串 (无 env) |

**测试技术**: 使用 `Files.createTempFile()` 创建临时 YAML 文件, 测试后 `Files.deleteIfExists()` 清理。无 Mockito, 纯集成测试风格。

**测试数量**: 7

### 2.2 Phase 1: 基础层 (model + datasource + util)

#### 2.2.1 QueryRequestTest

| 测试方法 | 测试内容 | 断言 |
|----------|----------|------|
| `constructor_shouldRejectBlankQuery` | 空/null/空白 query 拒绝 | `assertThrows(IllegalArgumentException.class)` |
| `constructor_shouldAcceptValidQuery` | 有效 query 通过 | `assertEquals("SELECT 1", req.query())` |
| `isExecuteMode_shouldDefaultToTrue` | 默认模式为 execute | `assertTrue(req.isExecuteMode())` |
| `isExecuteMode_shouldRespectExplicitMode` | sql_only 模式 | `assertFalse(sqlOnly.isExecuteMode())` |
| `effectivePage_shouldDefaultToOne` | 默认页码 1 | `assertEquals(1, ...)` |
| `effectivePage_shouldReturnSetValue` | 指定页码 | `assertEquals(3, ...)` |
| `effectivePage_shouldClampToMinimum` | 页码 < 1 拉回 1 | `assertEquals(1, ...)` |
| `effectivePageSize_shouldRespectMax` | 超过 max 截断 | `assertEquals(10000, ...)` |
| `effectivePageSize_shouldClampToMinimum` | pageSize < 1 拉回 1 | `assertEquals(1, ...)` |
| `effectiveOutputFormat_shouldDefaultToText` | 默认输出 text | `assertEquals(OutputFormat.text, ...)` |
| `effectiveOutputFormat_shouldReturnSetValue` | 指定输出 json | `assertEquals(OutputFormat.json, ...)` |

**测试数量**: 11 (含嵌套断言)

#### 2.2.2 QueryResponseTest

| 测试方法 | 测试内容 | 断言 |
|----------|----------|------|
| `success_shouldBuildCallToolResult` | Success 响应可转为 MCP CallToolResult | `isError()=false`, content 非空 |
| `sqlOnly_shouldBuildCallToolResult` | SqlOnly 响应可转为 MCP CallToolResult | `isError()=false` |
| `error_shouldBuildCallToolResult` | Error 响应可转为 MCP CallToolResult | `isError()=true` |
| `error_fromMcpException_shouldMapFields` | McpException → QueryResponse.Error 映射 | errorCode = "INVALID_INPUT" |
| `meta_shouldStoreAllFields` | Meta 存储数据库/SQL/验证分数等信息 | 逐一检查字段值 |

**测试数量**: 5

#### 2.2.3 ExecutionResultTest

| 测试方法 | 测试内容 | 断言 |
|----------|----------|------|
| `constructor_shouldDefaultVerification` | 默认 verificationScore=null, verificationPassed=true | `assertNull/assertTrue` |
| `withVerification_shouldCreateNewInstance` | withVerification 创建新实例, 原实例不变 | `assertEquals(0.5, ...)/assertNull(...)` |

**测试数量**: 2

#### 2.2.4 ModelRecordTest

| 测试方法 | 测试内容 | 断言 |
|----------|----------|------|
| `databaseSchema_shouldDefaultCachedAt` | DatabaseSchema.cachedAt 默认非空 | `assertNotNull` |
| `databaseSchema_shouldProvideUnmodifiableMaps` | tables/views Map 不可变 | `assertThrows(UnsupportedOperationException.class)` |
| `tableInfo_shouldDefaultSchema` | TableInfo.schema 默认 "dbo" | `assertEquals("dbo", ...)` |
| `tableInfo_shouldProvideUnmodifiableLists` | columns/primaryKeys List 不可变 | `assertThrows(UnsupportedOperationException.class)` |
| `columnInfo_shouldStoreAllFields` | ColumnInfo 所有字段存储 | 逐一检查 9 个字段 |
| `viewInfo_shouldDefaultSchema` | ViewInfo.schema 默认 "dbo", columns 空 | `assertEquals("dbo", ...)/assertTrue(...isEmpty())` |
| `indexInfo_shouldDefaultColumns` | IndexInfo.columns 默认空 | `assertTrue(...isEmpty())` |
| `foreignKeyInfo_shouldDefaultSchema` | ForeignKeyInfo.referencedSchema 默认 "dbo" | `assertEquals("dbo", ...)` |

**测试数量**: 8

#### 2.2.5 LlmApiExceptionTest

| 测试方法 | 测试内容 | 断言 |
|----------|----------|------|
| `constructor_withCause_shouldWrapMessage` | 带 cause 构造器包装消息 | 消息含 cause 信息, retryable=true |
| `constructor_withMessageOnly` | 仅消息构造器 | errorCode = "LLM_API_ERROR" |

**测试数量**: 2

#### 2.2.6 McpExceptionTest

| 测试方法 | 测试内容 | 断言 |
|----------|----------|------|
| `invalidInputException_shouldSetCorrectErrorCode` | InvalidInputException | errorCode=INVALID_INPUT, retryable=false |
| `invalidInputException_shouldAcceptDetails` | 接受 Map details | 检查 details.get("field") |
| `readOnlyViolationException_shouldSetCorrectCode` | ReadOnlyViolationException | errorCode=READ_ONLY_VIOLATION, retryable=false |
| `sqlSyntaxException_shouldNotBeRetryable` | SqlSyntaxException | retryable=false |
| `sqlObjectNotFoundException_shouldNotBeRetryable` | SqlObjectNotFoundException | retryable=false |
| `queryTimeoutException_shouldBeRetryable` | QueryTimeoutException | retryable=true |
| `dbConnectionException_shouldBeRetryable` | DbConnectionException | retryable=true |
| `llmApiException_shouldBeRetryable` | LlmApiException | retryable=true |
| `llmOutputParseException_shouldNotBeRetryable` | LlmOutputParseException | retryable=false |
| `schemaNotFoundException_shouldNotBeRetryable` | SchemaNotFoundException | retryable=false |
| `internalException_shouldNotBeRetryable` | InternalException | retryable=false |
| `mcpException_shouldProvideSuggestion` | 所有异常提供 suggestion | `assertNotNull(ex.suggestion())` |
| `mcpException_shouldProvideEmptyDetailsByDefault` | 默认 details 空 | `assertTrue(ex.details().isEmpty())` |
| `mcpException_details_areUnmodifiable` | details 不可变 | `assertThrows(UnsupportedOperationException.class)` |

**测试数量**: 14

#### 2.2.7 ConnectionPoolManagerTest

| 测试方法 | 测试内容 | 断言 |
|----------|----------|------|
| `constructor_shouldHandleEmptyConfigs` | 空配置列表 | `assertDoesNotThrow(() -> manager.close())` |
| `isAvailable_shouldReturnFalseForUnknown` | 未知数据库不可用 | `assertFalse(manager.isAvailable("unknown"))` |
| `withConnection_shouldThrowOnUnknownDatabase` | 未知数据库抛 SchemaNotFoundException | `assertThrows(SchemaNotFoundException.class, ...)` |
| `withConnection_overload_shouldThrowOnUnknownDatabase` | 重载方法同样抛异常 | `assertThrows(SchemaNotFoundException.class, ...)` |
| `close_shouldBeIdempotent` | close 幂等 | `assertDoesNotThrow(() -> { manager.close(); manager.close(); })` |
| `withConnection_shouldHandleNullActionGracefully` | action 内部异常包装为 SchemaNotFoundException (DB 不存在) | `assertThrows(SchemaNotFoundException.class, ...)` |

**Mockito**: `@ExtendWith(MockitoExtension.class)` — 实际构造 ConnectionPoolManager (无 Mock), 测试空连接池场景。

**测试数量**: 6

#### 2.2.8 DataSourceFactoryTest

| 测试方法 | 测试内容 | 断言 |
|----------|----------|------|
| `createDataSource_shouldBuildHikariConfig` | 从配置创建 HikariDataSource | 检查 poolName, JDBC URL 含 host:port/database |
| `createDataSource_shouldHandleDifferentPort` | 不同端口 | 检查 JDBC URL 含 server2:14330 |

**测试技术**: 无 Mock, 构造真实 DataSourceFactory 并验证 HikariCP 配置, 测试后 `ds.close()` 释放。

**测试数量**: 2

#### 2.2.9 JsonUtilsTest

| 测试方法 | 测试内容 | 断言 |
|----------|----------|------|
| `toJson_shouldSerializeMap` | Map 序列化为 JSON | 检查 key/value 出现在输出 |
| `toJson_shouldSerializeList` | List 序列化 | 检查 "[1,2,3]" |
| `fromJson_shouldDeserializeMap` | JSON → Map | 检查 restored Map 值 |
| `fromJson_shouldDeserializeString` | JSON → String | "hello" |
| `mapper_shouldReturnSingleton` | ObjectMapper 单例 | `assertSame(mapper(), mapper())` |
| `toBytes_shouldReturnByteArray` | toBytes 往返 | 检查 bytes 长度 > 0 |
| `toJson_shouldHandleNull` | 不可序列化对象抛异常 | `assertThrows(RuntimeException.class, ...)` |
| `fromJson_shouldThrowOnInvalid` | 非法 JSON 抛异常 | `assertThrows(RuntimeException.class, ...)` |

**测试技术**: Jackson ObjectMapper 行为验证, 无 Mock。其中 `toJson_shouldSerializeList` 验证 compact JSON 格式 (无空格: `[1,2,3]`)。

**测试数量**: 8

#### 2.2.10 LogUtilsTest

| 测试方法 | 测试内容 | 断言 |
|----------|----------|------|
| `generateRequestId_shouldReturnNonEmptyString` | UUID 格式 ID | 非空不 blank |
| `generateRequestId_shouldReturnUniqueIds` | 两次调用不同 | `assertNotEquals` |
| `clear_shouldNotThrow` | MDC put + clear | `assertDoesNotThrow` |
| `putAndClear_shouldNotThrow_whenCalledRepeatedly` | 多次 put + clear | `assertDoesNotThrow` |

**测试技术**: 验证 MDC (ThreadLocal) 工具类, 无 Mock。注意 Virtual Thread 环境 MDC 继承限制。

**测试数量**: 4

### 2.3 Phase 2: Schema 模块

#### 2.3.1 SchemaLoaderTest

| 测试方法 | 测试内容 | 断言 |
|----------|----------|------|
| `loadSchema_shouldBuildDatabaseSchema` | 完整加载流程 | 检查 schema 非空, databaseName="testdb" |

**Mockito 链式 mock**:
```
@Mock ConnectionPoolManager poolManager
when(poolManager.withConnection(eq("testdb"), any()))
  .thenAnswer(invocation -> {
      SqlFunction<Connection, ?> fn = invocation.getArgument(1);
      Connection conn = mock(Connection.class);
      PreparedStatement stmt = mock(PreparedStatement.class);
      ResultSet rs = mock(ResultSet.class);
      when(conn.prepareStatement(anyString())).thenReturn(stmt);
      when(stmt.executeQuery()).thenReturn(rs);
      when(rs.next()).thenReturn(false); // 空结果集
      return fn.apply(conn);
  });
```

**注意**: 使用 `@ExtendWith(MockitoExtension.class)` 自动初始化 Mock, Connection → PreparedStatement → ResultSet 三级 mock 链, 模拟空数据库 Schema 加载。

**测试数量**: 1

#### 2.3.2 SchemaCacheTest

| 测试方法 | 测试内容 | 断言 |
|----------|----------|------|
| `getSchema_shouldThrow_whenSchemaNotLoaded` | 未初始化时获取抛异常 | `assertThrows(RuntimeException.class, ...)` |
| `getSchema_shouldReturnCachedSchema` | 初始化后获取缓存 | 检查 databaseName 匹配 |
| `initialize_shouldHandleEmptyNames` | 空名称列表不抛异常 | `assertDoesNotThrow(...)` |
| `refresh_shouldClearCache` | refresh 触发重新加载 | `verify(loader, timeout(5000).atLeast(2)).loadSchema(...)` |
| `getSchema_shouldReturn_whenAlreadyCached` | 已缓存直接返回 | `assertNotNull(result)` |

**工具方法**: `awaitCache(SchemaCache, String)` — 轮询 5 秒等待异步初始化完成, 模拟 `CompletableFuture` 异步加载完成。

**Mockito**: `@Mock SchemaLoader`, 测试 SchemaCache 的缓存行为而非加载逻辑。

**测试数量**: 5

#### 2.3.3 SchemaContextBuilderTest

| 测试方法 | 测试内容 | 断言 |
|----------|----------|------|
| `buildContext_shouldIncludeDatabaseName` | 上下文含数据库名 | `context.contains("testdb")` |
| `buildContext_shouldIncludeTableInfo` | 上下文含表/列/类型信息 | 检查 users, id, INT |
| `buildContext_shouldHandleEmptyQuery` | 空 query | `assertNotNull(context)` |
| `buildContext_shouldHandleEmptySchema` | 空 Schema | `context.contains("empty")` |
| `buildContext_shouldRankRelevantTables` | 相关表排序优先 | `context.contains("users")` |
| `buildContext_shouldHandleTokenBudget` | 小 Token 预算 | `assertNotNull(context)` |
| `buildContext_shouldIncludeViews` | 上下文含视图信息 | `context.contains("v_users")` |

**测试技术**: 无 Mock, 直接构造 SchemaContextBuilder + DatabaseSchema, 验证上下文构建逻辑。
使用实际 `LlmConfig` 配置。

**测试数量**: 7

### 2.4 Phase 3: LLM 模块

#### 2.4.1 LlmClientTest

| 测试方法 | 测试内容 | 断言 |
|----------|----------|------|
| `generateSql_shouldReturnContent` | 正常返回 SQL | `assertEquals("SELECT * FROM users", result)` |
| `generateSql_shouldHandleEmptyContent` | content=null 返回空串 | `assertEquals("", result)` |
| `generateSql_shouldHandleMissingChoices` | 缺少 choices | `assertThrows(Exception.class, ...)` |
| `generateSql_shouldHandleServerError` | HTTP 500 | `assertThrows(Exception.class, ...)` |
| `validateMeaning_shouldParseScore` | 验证评分解析 | `assertEquals(0.85, score, 0.001)` |

**测试技术**: 使用 `com.sun.net.httpserver.HttpServer` 启动本地 HTTP Server 模拟 LLM API, 避免 Mock OkHttp 的复杂调用链。
- `@BeforeEach` 创建随机端口 HttpServer
- `@AfterEach` 调用 `server.stop(0)` 关闭
- `registerHandler(path, handler)` 注册自定义请求处理
- `readRequestBody(exchange)` 消耗请求体
- `respond(exchange, code, body)` 返回响应

**测试数量**: 5

#### 2.4.2 LlmRetryHandlerTest

| 测试方法 | 测试内容 | 断言 |
|----------|----------|------|
| `shouldSucceedOnFirstAttempt` | 首次成功 | `assertEquals("ok", result)` |
| `shouldSucceedAfterRetries` | 前 2 次失败第 3 次成功 | `assertEquals("success after 3 attempts", result)` |
| `shouldThrowAfterAllRetriesExhausted` | 重试耗尽抛异常 | `assertThrows(LlmApiException.class, ...)` |
| `runtimeException_shouldBeWrappedAndRejected` | RuntimeException 包装 | `assertThrows(LlmApiException.class, ...)` |
| `ioException_shouldBeWrappedAndRetried` | IOException 重试 | `assertEquals("ok", result)` |
| `interruptException_shouldThrowImmediately` | InterruptedException 不重试 | `assertThrows(Exception.class, ...)` |
| `shouldHandleZeroRetries` | 0 次重试 | `assertEquals("ok", result)` |

**测试技术**: 使用 `AtomicInteger` 追踪失败次数, `Duration.ofMillis(10)` 快退配置。构造器: `new LlmRetryHandler(3, List.of(Duration.ofMillis(10), Duration.ofMillis(10), Duration.ofMillis(10)))`

**测试数量**: 7

#### 2.4.3 CircuitBreakerTest

| 测试方法 | 测试内容 | 断言 |
|----------|----------|------|
| `defaultConstructor_shouldUseDefaults` | 默认构造 | `assertDoesNotThrow(...)` |
| `closedState_shouldAllowCalls` | CLOSED 状态允许调用 | `assertEquals("success", result)` |
| `shouldTransitionToOpenAfterFailures` | 失败后转为 OPEN | `assertThrows(LlmApiException.class, ...)` |
| `openState_shouldRejectCalls` | OPEN 状态拒绝调用 | `assertThrows(LlmApiException.class, ...)` |
| `halfOpenState_shouldAllowLimitedCallsAfterWait` | HALF_OPEN 允许有限调用 | `assertEquals("recovered", result)` |
| `halfOpenSuccess_shouldTransitionToClosed` | HALF_OPEN 成功 → CLOSED | `assertEquals("closed again", result)` |
| `halfOpenFailure_shouldTransitionBackToOpen` | HALF_OPEN 失败 → OPEN | `assertEquals(CircuitBreaker.State.OPEN, cb.getState())` |
| `nonLlmException_shouldBeWrapped` | 非 LLM 异常包装 | `assertThrows(LlmApiException.class, ...)` |
| `success_shouldNotCountInFailureRate` | 成功不计入失败率 | `assertDoesNotThrow(...)` 连续 4 次成功 |

**状态机覆盖**: CLOSED → OPEN → HALF_OPEN → CLOSED (恢复) / OPEN (恢复失败)

**测试技术**: 使用极短等待时间 (`Duration.ofNanos(1)` / `Thread.sleep(5)`) 加速状态转换。通过 `cb.getState()` 包级访问方法验证内部状态。

**测试数量**: 9

#### 2.4.4 SqlExtractorTest

| 测试方法 | 测试内容 | 断言 |
|----------|----------|------|
| `shouldExtractFromSqlBlock` | `\`\`\`sql ... \`\`\`` 提取 | `assertEquals("SELECT * FROM users", ...)` |
| `shouldExtractFromSqlBlockWithLanguageTag` | `\`\`\`sql` 标签 | `assertEquals("SELECT COUNT(*) FROM orders", ...)` |
| `shouldExtractFromGenericCodeBlockWhenLooksLikeSql` | `\`\`\`` 无标签, 检测 SQL 关键字 | `assertEquals("SELECT name, email FROM users", ...)` |
| `shouldExtractSqlWithoutCodeBlocks` | 无代码块, 直接 SELECT | `assertEquals("SELECT TOP 10 * FROM products", ...)` |
| `shouldExtractWithStatement` | WITH 语句 | `assertTrue(result.contains("WITH cte AS"))` |
| `shouldExtractSqlStartingWithComment` | -- 注释开头 | `assertTrue(result.contains("-- this is a comment"))` |
| `shouldStripMarkdownWhenNeeded` | 去除 ** 加粗标记 | `assertEquals("SELECT * FROM users", ...)` |
| `shouldThrowOnNullInput` | null 输入 | `assertThrows(LlmOutputParseException.class, ...)` |
| `shouldThrowOnBlankInput` | 空白输入 | `assertThrows(LlmOutputParseException.class, ...)` |
| `shouldThrowOnNonSqlContent` | 非 SQL 内容 | `assertThrows(LlmOutputParseException.class, ...)` |
| `shouldExtractSqlBlockEvenWithExtraContent` | 提取含前后文本的 SQL 块 | `assertEquals("SELECT id, name ...", ...)` |

**提取优先级**: 4 级降级 (代码块 → 无标签代码块 → SELECT/WITH 开头 → Markdown 剥离)

**测试数量**: 11

#### 2.4.5 PromptBuilderTest

| 测试方法 | 测试内容 | 断言 |
|----------|----------|------|
| `buildSqlPrompt_shouldIncludeSchemaContext` | Schema 上下文嵌入 | 检查 TABLE/query/T-SQL expert |
| `buildSqlPrompt_shouldIncludeRules` | T-SQL 规则提示 | 检查 schema-qualified/TOP/GETDATE |
| `buildValidationPrompt_shouldIncludeAllParts` | 验证 prompt 含所有部分 | 检查 query/sql/sample data/评分范围 |
| `buildValidationPrompt_shouldHandleNullParts` | null 输入不抛 | `assertNotNull(prompt)` |

**测试技术**: 使用静态方法 `PromptBuilder.buildSqlPrompt()`, 验证模板渲染。无 Mock。

**测试数量**: 4

### 2.5 Phase 4: Validation 模块

#### 2.5.1 SecurityValidatorTest (L1)

| 测试方法 | 测试内容 | 断言 |
|----------|----------|------|
| `selectStatement_shouldPass` | SELECT 通过 | `result.isEmpty()` |
| `withStatement_shouldPass` | WITH 通过 | `result.isEmpty()` |
| `insertStatement_shouldBeRejected` | INSERT 拒绝 | errorCode = READ_ONLY_VIOLATION |
| `updateStatement_shouldBeRejected` | UPDATE 拒绝 | `result.isPresent()`, `!result.get().passed()` |
| `deleteStatement_shouldBeRejected` | DELETE 拒绝 | `result.isPresent()` |
| `dropStatement_shouldBeRejected` | DROP 拒绝 | `result.isPresent()` |
| `createStatement_shouldBeRejected` | CREATE 拒绝 | `result.isPresent()` |
| `alterStatement_shouldBeRejected` | ALTER 拒绝 | `result.isPresent()` |
| `truncateStatement_shouldBeRejected` | TRUNCATE 拒绝 | `result.isPresent()` |
| `execStatement_shouldBeRejected` | EXEC 拒绝 | `result.isPresent()` |
| `dangerousFunction_shouldBeRejected` | xp_cmdshell 拒绝 | `result.isPresent()`, `!result.get().passed()` |
| `dangerousObject_shouldBeRejected` | OPENROWSET 拒绝 | `result.isPresent()`, `!result.get().passed()` |
| `unknownStatementType_shouldBeRejected` | MERGE 拒绝 | `result.isPresent()` |
| `nullInput_shouldReturnEmptyForPreprocess` | `preProcess(null)` → "" | `assertEquals("", ...)` |
| `preProcess_shouldStripComments` | 去除行注释 | `assertEquals("SELECT * FROM USERS", ...)` |
| `preProcess_shouldStripMultiLineComments` | 去除块注释 | `assertEquals("SELECT *  FROM USERS", ...)` |
| `preProcess_shouldStripZeroWidthChars` | 去除零宽字符 | `assertEquals("SELECT* FROM USERS", ...)` |
| `grantStatement_shouldBeRejected` | GRANT 拒绝 | `result.isPresent()` |
| `revokeStatement_shouldBeRejected` | REVOKE 拒绝 | `result.isPresent()` |

**预处理管线**: NFC 归一化 → 零宽字符剥离 → 注释去除 → 大写转换

**测试数量**: 19

#### 2.5.2 SqlAstValidatorTest (L2)

| 测试方法 | 测试内容 | 断言 |
|----------|----------|------|
| `selectStatement_shouldPass` | SELECT 正常 | `result.isEmpty()` |
| `insertStatement_shouldBeRejected` | INSERT 拒绝 | errorCode = READ_ONLY_VIOLATION |
| `updateStatement_shouldBeRejected` | UPDATE 拒绝 | `result.isPresent()` |
| `deleteStatement_shouldBeRejected` | DELETE 拒绝 | `result.isPresent()` |
| `dropStatement_shouldBeRejected` | DROP 拒绝 | `result.isPresent()` |
| `createTableStatement_shouldBeRejected` | CREATE 拒绝 | `result.isPresent()` |
| `alterStatement_shouldBeRejected` | ALTER 拒绝 | `result.isPresent()` |
| `truncateStatement_shouldBeRejected` | TRUNCATE 拒绝 | `result.isPresent()` |
| `mergeStatement_shouldBeRejected` | MERGE (JSqlParser 可能降级) | 条件断言 |
| `executeStatement_shouldBeRejected` | EXECUTE 拒绝 | `result.isPresent()` |
| `grantStatement_shouldBeRejected` | GRANT (可能降级) | 条件断言 |
| `nonexistentTable_shouldBeRejected` | 引用不存在表 | errorCode = SCHEMA_ERROR |
| `emptySchemaWithSelect_shouldPass` | 空 Schema 下 SELECT | `result.isEmpty()` |
| `unparseableSql_shouldDowngrade` | T-SQL 方言降级 | `assertNotNull` |

**宽松模式**: JSqlParser 5.0 对 T-SQL (TOP/MERGE/GRANT) 兼容性有限, 解析失败降级到 L3

**测试数量**: 14

#### 2.5.3 ParseOnlyValidatorTest (L3)

| 测试方法 | 测试内容 | 断言 |
|----------|----------|------|
| `validSql_shouldPass` | 有效 SQL 通过 | `result.isEmpty()` |
| `invalidSql_shouldReturnSyntaxError` | 语法错误 | `assertNotNull(result)` |
| `unexpectedException_shouldReturnValidationError` | 异常返回 VALIDATION_ERROR | `assertEquals("VALIDATION_ERROR", ...)` |
| `extractTableNames_shouldReturnTableReferences` | 表名提取 | 检查 users, orders 出现在结果 |
| `extractTableNames_shouldIncludeSchemaPrefix` | Schema 前缀表名 | 检查 "dbo.users" |
| `extractTableNames_shouldHandleNoFromClause` | 无 FROM 场景 | `assertTrue(tables.isEmpty())` |

**Mockito 链式 mock**:
```java
@Mock ConnectionPoolManager poolManager
when(poolManager.withConnection(eq("testdb"), any(SqlFunction.class)))
  .thenAnswer(invocation -> {
      SqlFunction<Connection, Void> fn = invocation.getArgument(1);
      Connection conn = mock(Connection.class);
      Statement stmt = mock(Statement.class);
      when(conn.createStatement()).thenReturn(stmt);
      // SET PARSEONLY ON success → execute failure → SET PARSEONLY OFF
      doReturn(false).doThrow(new RuntimeException("Incorrect syntax near 'x'")).doReturn(false)
          .when(stmt).execute(anyString());
      fn.apply(conn);
      return null;
  });
```

**测试数量**: 6

#### 2.5.4 ResultMeaningValidatorTest (L4)

| 测试方法 | 测试内容 | 断言 |
|----------|----------|------|
| `check_shouldAlwaysReturnEmpty` | 永远返回 pass | `result.isEmpty()` |
| `check_shouldPassForAnySql` | 对任意 SQL 返回空 | 对 DROP/空/null SQL 均通过 |

**注意**: ResultMeaningValidator 当前为 no-op 桩模块 (特征开关控制, 默认关闭), 后续集成 LLM 后实现真实语义验证。

**测试数量**: 2

#### 2.5.5 ValidationChainBuilderTest

| 测试方法 | 测试内容 | 断言 |
|----------|----------|------|
| `build_shouldIncludeL1AndL2` | 基础链含 SecurityValidator + SqlAstValidator | `assertEquals(2, chain.rules().size())` |
| `build_shouldIncludeL3_whenPoolManagerPresent` | 有 ConnectionPoolManager 时含 L3 | `assertTrue(chain.parseOnlyValidator().isPresent())` |
| `build_shouldExcludeL3_whenPoolManagerNull` | 无 ConnectionPoolManager 时排除 L3 | `assertTrue(chain.parseOnlyValidator().isEmpty())` |
| `build_shouldIncludeL4_whenFeatureEnabled` | resultMeaningValidation=true 含 L4 | `assertTrue(chain.meaningValidator().isPresent())` |
| `build_shouldExcludeL4_whenFeatureDisabled` | resultMeaningValidation=false 排除 L4 | `assertTrue(chain.meaningValidator().isEmpty())` |

**Mockito**: `@Mock ConnectionPoolManager, LlmClient, SchemaProvider` — 验证工厂条件组装逻辑。

**测试数量**: 5

### 2.6 Phase 5: Execution 模块

#### 2.6.1 PaginationRewriterTest

| 测试方法 | 测试内容 | 断言 |
|----------|----------|------|
| `rewrite_shouldProduceCountAndPageSql` | COUNT + 分页 SQL 生成 | COUNT(*)/OFFSET 0/FETCH NEXT 10 |
| `rewrite_shouldHandleSecondPage` | 第 3 页 offset=40 | `contains("OFFSET 40 ROWS")` |
| `rewrite_shouldHandleInvalidPageNumbers` | 非法页码 (0, 0) | `contains("OFFSET 0 ROWS")` + FETCH NEXT 10 |
| `rewrite_shouldPreserveOrderBy` | 保留已有 ORDER BY | `contains("ORDER BY name")` |
| `rewrite_shouldAddOrderByWhenMissing` | 无 ORDER BY 自动添加 | `contains("ORDER BY (SELECT NULL)")` |
| `rewrite_shouldHandleCte` | CTE 包裹 | COUNT(*) + OFFSET |
| `rewrite_shouldHandleGroupBy` | GROUP BY | `assertNotNull` |
| `rewrite_shouldHandleTopClause` | TOP 处理 | `assertNotNull` |

**分页逻辑**: `OFFSET (page-1)*pageSize ROWS FETCH NEXT pageSize ROWS ONLY`
SQL Server 强制要求 ORDER BY, 无时自动加 `ORDER BY (SELECT NULL)`

**测试数量**: 8

#### 2.6.2 ResultCollectorTest

| 测试方法 | 测试内容 | 断言 |
|----------|----------|------|
| `collect_shouldReturnAllRows` | 正常收集 | 3 行, truncated=false |
| `collect_shouldTruncateByMaxRows` | maxRows=3 截断 | 3 行, truncated=true |
| `collect_shouldTruncateByMaxBytes` | maxBytes=10 截断 | truncated=true 或行数 < 2 |
| `collect_shouldHandleEmptyResult` | 空结果 | 0 行, 不截断 |
| `collect_shouldConvertNullValues` | NULL 值 | row.getFirst() = null |
| `collect_shouldHandleSqlDateTypes` | SQL 日期类型转换 | LocalDate/LocalTime/LocalDateTime |

**Mockito**: 手写 `mockResultSet(int columnCount, Object[][] data)` 辅助方法, 创建 ResultSet mock:
```java
var rs = mock(ResultSet.class);
var meta = mock(ResultSetMetaData.class);
when(rs.getMetaData()).thenReturn(meta);
when(meta.getColumnCount()).thenReturn(columnCount);
when(meta.getColumnLabel(i)).thenReturn("col" + i);
// 使用 rowIndex 数组 + thenAnswer 模拟迭代
when(rs.next()).thenAnswer(invocation -> { ... });
when(rs.getObject(anyInt())).thenAnswer(invocation -> { ... });
```

**测试数量**: 7

#### 2.6.3 TextFormatterTest

| 测试方法 | 测试内容 | 断言 |
|----------|----------|------|
| `format_shouldProduceMarkdownTable` | Markdown 表格格式 | 检查表头/分隔线/数据行 |
| `format_shouldHandleEmptyResult` | 空结果 | 含"空结果" |
| `format_shouldDisplayNullAsNull` | NULL 显示 | 含"NULL" |
| `format_shouldShowTruncationWarning` | 截断警告 | 含"截断" |
| `format_shouldFormatNumbers` | 数字格式化 | 含 "42" |

**格式样例**: `| id | name |\n| --- | --- |\n| 1 | Alice |\n| 2 | Bob |`

**测试数量**: 5

#### 2.6.4 JsonFormatterTest

| 测试方法 | 测试内容 | 断言 |
|----------|----------|------|
| `format_shouldProduceJson` | JSON 格式 | 含 columns/rows/total_rows/truncated |
| `format_shouldHandleEmptyResult` | 空结果 | `"total_rows":0` |

**格式样例**: `{"columns":["id","name"],"rows":[[1,"Alice"],[2,"Bob"]],"total_rows":2,"truncated":false,"byteSize":100}`

**测试数量**: 2

#### 2.6.5 QueryExecutorTest

| 测试方法 | 测试内容 | 断言 |
|----------|----------|------|
| `execute_shouldReturnResult` | 完整执行流程 | totalRows=42, data/executedSql 非空 |
| `execute_shouldHandleDefaultPage` | 默认分页参数 | `assertTrue(result.totalRows() >= 0)` |

**Mockito**: `@Mock ConnectionPoolManager`, 两次 `withConnection` 调用分别对应 COUNT 查询和数据查询:
```java
when(poolManager.withConnection(eq("testdb"), anyString(), any()))
  .thenAnswer(invocation -> {
      String sql = invocation.getArgument(1);
      if (sql.contains("COUNT(*)")) { return 42; }
      SqlFunction<ResultSet, CollectResult> mapper = invocation.getArgument(2);
      // mock ResultSet...
      return mapper.apply(rs);
  });
```

**测试数量**: 2

### 2.7 Phase 6: Pipeline 编排层

#### 2.7.1 QueryPipelineServiceTest

| 测试方法 | 测试内容 | 断言 |
|----------|----------|------|
| `sqlOnlyMode_shouldReturnSqlOnly` | SQL-only 模式 | SqlOnly 响应, SQL 正确 |
| `executeMode_shouldReturnSuccess` | Execute 模式完整流程 | Success 响应, Meta 含 database/SQL/totalRows |
| `validationFailure_shouldReturnError` | L1/L2 校验失败 → Error 响应 | Error, errorCode=INVALID_INPUT |
| `parseOnlyValidationFailure_shouldReturnSyntaxError` | L3 校验失败 → Error 响应 | Error |
| `exceptionInPipeline_shouldReturnError` | Pipeline 内部异常 → Error 响应 | Error |
| `emptyDatabase_shouldUseDefault` | 未指定 database 使用默认 | 调用 `schemaProvider.getSchema("default")` |

**Mockito**: 7 个 `@Mock` 对象:
```java
@Mock SchemaProvider schemaProvider;
@Mock SchemaContextBuilder contextBuilder;
@Mock LlmClient llmClient;
@Mock SqlValidationRule validationRule;
@Mock ParseOnlyValidator parseOnlyValidator;
@Mock QueryExecutor queryExecutor;
@Mock ResultFormatter textFormatter;
@Mock ResultFormatter jsonFormatter;
```
通过 `createService(Optional<L3>, Optional<L4>)` 工厂方法构造服务实例。

**测试数量**: 7

#### 2.7.2 StageMetricsTest

| 测试方法 | 测试内容 | 断言 |
|----------|----------|------|
| `shouldCreateRecord` | 成功指标 Record | 检查 stageName/durationMs/success |
| `shouldHandleFailedMetrics` | 失败指标 Record | 检查 stageName/durationMs/success=false |

**测试技术**: 简单 Record 构造 + 字段验证, 无 Mock。

**测试数量**: 2

### 2.8 Phase 7: Tool 模块

#### QueryToolTest

| 测试方法 | 测试内容 | 断言 |
|----------|----------|------|
| `getToolDefinition_shouldReturnTool` | Tool 定义 | name="query", description+inputSchema 非空 |
| `handleCall_shouldReturnResult` | 正常调用 | `isError()=false`, content 非空 |
| `handleCall_withMissingArguments_shouldReturnError` | 缺失 query 参数 | `isError()=true` |
| `handleCall_withNullArguments_shouldReturnError` | null 参数 | `isError()=true` |

**Mockito**: `@Mock QueryPipelineService`, 验证 Tool 层参数映射和错误处理。

**测试数量**: 4

### 2.9 Phase 8: 可观测性

#### 2.9.1 MetricsRegistryTest

| 测试方法 | 测试内容 | 断言 |
|----------|----------|------|
| `incrementQueryCount_shouldWork` | 查询计数 | `assertDoesNotThrow` |
| `disabledMetrics_shouldNotThrow` | 禁用指标不抛 | 4 种操作均通过 |
| `recordQueryDuration_shouldWork` | 查询耗时 | `assertDoesNotThrow` |
| `recordLlmDuration_shouldWork` | LLM 耗时 | `assertDoesNotThrow` |
| `incrementValidationResult_shouldWork` | 校验结果计数 | `assertDoesNotThrow` |
| `getMeterRegistry_shouldReturnRegistry` | Registry 获取 | `assertNotNull(registry.getMeterRegistry())` |

**测试数量**: 6

#### 2.9.2 OpenTelemetryConfigTest

| 测试方法 | 测试内容 | 断言 |
|----------|----------|------|
| `disabled_shouldReturnNoop` | 禁用 → Noop | TracerProvider 非空 |
| `enabled_shouldCreateSdkInstance` | 启用 → SDK 实例 | TracerProvider 非空 |
| `enabledWithInvalidConfig_shouldFallbackToNoop` | 无效配置 → Noop 降级 | Tracer 非空 |

**测试数量**: 3

### 2.10 E2E 测试

#### SqlServerMcpE2ETest

| 测试方法 | 测试内容 | 断言 |
|----------|----------|------|
| `sqlOnlyMode_shouldReturnSql` | SQL-only 模式不崩溃 | `assertNotNull(response)` |
| `schemaShouldLoadSuccessfully` | Schema 加载不崩溃 | `assertNotNull(response)` |

**运行条件**:
- `@EnabledIfSystemProperty(named = "e2e.enabled", matches = "true")`
- `@Container MSSQLServerContainer` (需要 Docker)
- Surefire 通过 `**/*E2ETest.java` 排除, Failsafe 处理

**依赖**: Testcontainers MSSQL 2022 + init-testdb.sql (3 表 + 视图 + 索引 + 示例数据)

**测试数量**: 2 (gated)

### 2.11 JMH 基准测试

#### 2.11.1 PaginationRewriterBenchmark

| 基准方法 | SQL 风格 | 参数 |
|----------|----------|------|
| `simpleSelect` | `SELECT * FROM products WHERE price > 100` | page=1, pageSize=20 |
| `complexJoin` | JOIN + GROUP BY + HAVING + ORDER BY | page=2, pageSize=50 |
| `cteWithWindow` | WITH + ROW_NUMBER() OVER | page=1, pageSize=10 |
| `nestedSubquery` | WHERE IN (SELECT ... HAVING ...) | page=1, pageSize=100 |

**配置**: Mode.Throughput, 2 轮预热 × 1s, 3 轮测量 × 1s, 1 fork

**基准数量**: 4

#### 2.11.2 ResultFormatterBenchmark

| 基准方法 | 格式器 | 数据规模 |
|----------|--------|----------|
| `textSmall` | TextFormatter | 5 列 × 10 行 |
| `textLarge` | TextFormatter | 5 列 × 1000 行 |
| `textSingleColumn` | TextFormatter | 1 列 × 100 行 |
| `jsonSmall` | JsonFormatter | 5 列 × 10 行 |
| `jsonLarge` | JsonFormatter | 5 列 × 1000 行 |
| `jsonSingleColumn` | JsonFormatter | 1 列 × 100 行 |

**配置**: Mode.Throughput, 2 轮预热 × 1s, 3 轮测量 × 1s, 1 fork

**基准数量**: 6

**运行方式**: `mvn verify -P jmh` (注意: 当前 Maven 3.5.3 不支持 jmh-maven-plugin, 需 Maven 3.6+)

---

## 3. 测试资源配置

### 3.1 集成测试初始化 SQL

`src/test/resources/init-testdb.sql`:

```sql
-- Schema
CREATE SCHEMA inventory;

-- Tables
CREATE TABLE inventory.products (...);
CREATE TABLE inventory.orders (...);
CREATE TABLE dbo.audit_log (...);

-- Indexes
CREATE NONCLUSTERED INDEX IX_products_category ON inventory.products(category);
CREATE NONCLUSTERED INDEX IX_orders_order_date ON inventory.orders(order_date);
CREATE NONCLUSTERED INDEX IX_orders_customer ON inventory.orders(customer_name);

-- Sample Data: 5 products + 5 orders
INSERT INTO inventory.products (...) VALUES ('Laptop', 'Electronics', 999.99, 10), ...;
INSERT INTO inventory.orders (...) VALUES (1, 2, 1999.98, 'Alice'), ...;

-- Views
CREATE VIEW inventory.product_summary AS SELECT ...;
```

### 3.2 测试配置文件

`src/test/resources/application-test.yml`:
- Testcontainers 动态端口通过环境变量传递 (TESTCONTAINERS_HOST, TESTCONTAINERS_PORT)
- 最小连接池 (min=1, max=2)
- 禁用可观测性避免干扰测试

### 3.3 Maven 测试配置

pom.xml 中的 surefire 和 failsafe 配置:

| 插件 | 包含模式 | 排除模式 | 用途 |
|------|----------|----------|------|
| surefire | `**/*Test.java` | `**/*IntegrationTest.java`, `**/*E2ETest.java` | `mvn test` 单元测试 |
| failsafe | `**/*IntegrationTest.java`, `**/*E2ETest.java` | — | `mvn verify -P integration` |

---

## 4. 覆盖分析

### 4.1 按 Phase 统计

| Phase | 测试类数 | 测试方法数 | 主要 Mock 对象 |
|-------|----------|-----------|---------------|
| Phase 0 脚手架 | 1 | 7 | 无 |
| Phase 1 基础层 | 9 | 57 | ConnectionPoolManager (部分) |
| Phase 2 Schema | 3 | 13 | ConnectionPoolManager, SchemaLoader |
| Phase 3 LLM | 5 | 36 | HttpServer (模拟 LLM API) |
| Phase 4 Validation | 5 | 46 | ConnectionPoolManager (L3) |
| Phase 5 Execution | 5 | 24 | ConnectionPoolManager (QueryExecutor) |
| Phase 6 Pipeline | 2 | 9 | 全部依赖 (7 个 Mock) |
| Phase 7 Tool | 1 | 4 | QueryPipelineService |
| Phase 8 Observability | 2 | 9 | 无 |
| E2E | 1 | 2 | 无 (真实 DB + MCP) |
| **合计** | **35** | **208** | |

### 4.2 场景覆盖矩阵

| 场景 | 覆盖 | 说明 |
|------|------|------|
| **SQL-only 模式** | ✅ PipelineTest | 跳过 L3/L4/Execution |
| **Execute 模式** | ✅ PipelineTest | 全流程 |
| **L1 校验拒绝** | ✅ SecurityValidatorTest | INSERT/UPDATE/DELETE/DROP/ALTER/CREATE/TRUNCATE/EXEC/MERGE/GRANT/REVOKE |
| **L1 反绕过** | ✅ SecurityValidatorTest | 零宽字符/注释/编码绕过 |
| **L2 校验拒绝** | ✅ SqlAstValidatorTest | 同 L1 + 不存在表 |
| **L2 降级** | ✅ SqlAstValidatorTest | JSqlParser 无法解析时降级 L3 |
| **L3 语法错误** | ✅ ParseOnlyValidatorTest | SET PARSEONLY ON 失败 |
| **L3 表名提取** | ✅ ParseOnlyValidatorTest | 正则提取表名 |
| **L4 (no-op)** | ✅ ResultMeaningValidatorTest | 始终返回 pass |
| **链装配** | ✅ ValidationChainBuilderTest | 条件组装 L1-L4 |
| **分页重写** | ✅ PaginationRewriterTest | 正常/边界/CTE/TOP/GROUP BY |
| **结果截断** | ✅ ResultCollectorTest | 行数截断/字节截断 |
| **空结果** | ✅ ResultCollectorTest | 空结果集 |
| **NULL 值** | ✅ ResultCollectorTest | ResultSet.wasNull() |
| **SQL 日期类型** | ✅ ResultCollectorTest | Date → LocalDate 等 |
| **Text 格式化** | ✅ TextFormatterTest | Markdown 表格 |
| **JSON 格式化** | ✅ JsonFormatterTest | JSON 结构 |
| **LLM 正常返回** | ✅ LlmClientTest | 200 + choices |
| **LLM 错误返回** | ✅ LlmClientTest | 500/null choices |
| **LLM 空返回** | ✅ LlmClientTest | content=null |
| **重试成功** | ✅ LlmRetryHandlerTest | 前 2 次失败第 3 次成功 |
| **重试耗尽** | ✅ LlmRetryHandlerTest | 全部重试耗尽 |
| **熔断 CLOSED** | ✅ CircuitBreakerTest | 正常调用 |
| **熔断 OPEN** | ✅ CircuitBreakerTest | 失败超阈值 → 拒绝 |
| **熔断 HALF_OPEN** | ✅ CircuitBreakerTest | 超时后允许有限调用 |
| **熔断恢复** | ✅ CircuitBreakerTest | HALF_OPEN 成功 → CLOSED |
| **熔断再打开** | ✅ CircuitBreakerTest | HALF_OPEN 失败 → OPEN |
| **SQL 提取 4 级降级** | ✅ SqlExtractorTest | 全部 4 种优先级 + Markdown Stripping |
| **Pipeline 编排** | ✅ QueryPipelineServiceTest | 全部 6 个场景 |
| **Tool 参数验证** | ✅ QueryToolTest | 缺失参数/null |
| **Schema 加载** | ✅ SchemaLoaderTest | Mock 连接池 |
| **Schema 缓存** | ✅ SchemaCacheTest | 初始化/刷新/未命中 |
| **Schema 上下文** | ✅ SchemaContextBuilderTest | 关键词匹配/Token 预算 |
| **配置加载** | ✅ YamlConfigLoaderTest | 合法/非法/缺失/环境变量 |
| **数据模型** | ✅ ModelRecordTest | 不可变/默认值/字段存储 |
| **异常层级** | ✅ McpExceptionTest | 全部 10 个子类 + retryable |
| **JSON 工具** | ✅ JsonUtilsTest | 序列化/反序列化/单例 |
| **日志工具** | ✅ LogUtilsTest | ID 生成/MDC put/clear |
| **指标注册** | ✅ MetricsRegistryTest | 启用/禁用 |
| **OTel 配置** | ✅ OpenTelemetryConfigTest | 启用/禁用/降级 |

### 4.3 待补充测试场景

| 场景 | 优先级 | 阻塞原因 |
|------|--------|----------|
| SchemaLoader 真实数据库集成 (Testcontainers) | P1 | 需要 Docker |
| SchemaCache 单飞并发测试 (多个线程同时 getSchema) | P1 | 需精心设计并发控制 |
| QueryExecutor 真实数据库执行 | P1 | 需要 Docker |
| 连接池并发获取 (多虚拟线程) | P1 | 需 Testcontainers |
| 故障注入: LLM 连续 5 次 500 → 熔断 | P0 | (已有, CircuitBreakerTest 覆盖) |
| 故障注入: DB 连接断开 + 按需重连 | P1 | 需要 Docker |
| 大结果集 (10K+ 行) 压力测试 | P2 | 需要 Docker + 大批数据 |
| E2E 完整黄金路径 | P1 | 需要 Docker + 真实 LLM API Key |
| 横向越权: 跨数据库查询 | P2 | 需多数据源配置 |
| Schema 上下文 Token 估算精度验证 | P2 | 需集成 LLM 实际请求 |

---

## 5. 测试执行指南

### 5.1 常用命令

```bash
# 单元测试 (全部 Phase)
mvn test

# 指定单个测试类
mvn test -Dtest=SecurityValidatorTest

# 指定多个测试类 (逗号分隔)
mvn test -Dtest=SecurityValidatorTest,SqlAstValidatorTest

# 跳过测试 (快速编译)
mvn compile -DskipTests

# 集成测试 (需要 Docker)
mvn verify -P integration

# E2E 测试 (需要 Docker + LLM API Key)
mvn verify -P integration -De2e.enabled=true

# JMH 基准测试 (需要 Maven 3.6+)
mvn verify -P jmh

# 全量检查 (单元 + 集成 + 静态分析)
mvn verify -P lint

# 查看测试报告 (JaCoCo)
# target/site/jacoco/index.html
```

### 5.2 测试编写规范

```java
// 命名: {method}_{expected}_{condition} — Given-When-Then 三要素
@Test
void validate_shouldReject_whenContainsInsertKeyword() { ... }

// 约束:
// - 只 mock 外部依赖 (DB, LLM), 不 mock 内部逻辑
// - 断言用 assertThrows 验证异常, 不测异常消息字符串
// - 每个测试只测一个行为, 不超过 15 行
// - @DisplayName 可选, 方法名需自描述
```

---

## 6. Mockito 使用模式汇总

### 6.1 模式 1: 链式 JDBC Mock

用于 SchemaLoader, ParseOnlyValidator, QueryExecutor 测试:

```java
@Mock ConnectionPoolManager poolManager;

when(poolManager.withConnection(eq("testdb"), any(SqlFunction.class)))
    .thenAnswer(invocation -> {
        SqlFunction<Connection, Void> fn = invocation.getArgument(1);
        Connection conn = mock(Connection.class);
        PreparedStatement stmt = mock(PreparedStatement.class);
        ResultSet rs = mock(ResultSet.class);
        when(conn.prepareStatement(anyString())).thenReturn(stmt);
        when(stmt.executeQuery()).thenReturn(rs);
        when(rs.next()).thenReturn(false); // 空结果
        return fn.apply(conn);
    });
```

### 6.2 模式 2: 条件 Mock (QueryExecutor)

两次 `withConnection` 调用, 根据 SQL 内容返回不同结果:

```java
when(poolManager.withConnection(eq("testdb"), anyString(), any()))
    .thenAnswer(invocation -> {
        String sql = invocation.getArgument(1);
        if (sql.contains("COUNT(*)")) return 42;
        // 否则是数据查询
        SqlFunction<ResultSet, CollectResult> mapper = invocation.getArgument(2);
        return mapper.apply(mockResultSet(...));
    });
```

### 6.3 模式 3: 完整 Pipeline Mock (QueryPipelineServiceTest)

7 个 `@Mock` 对象, 通过 `createService()` 工厂方法组合:

```
schemaProvider.getSchema() → DatabaseSchema
contextBuilder.buildContext() → String
llmClient.generateSql() → String
validationRule.check() → Optional.empty()
parseOnlyValidator.check() → Optional.empty()
queryExecutor.execute() → ExecutionResult
textFormatter.format() → String
```

### 6.4 模式 4: 状态追踪 (LlmRetryHandlerTest)

使用 `AtomicInteger` 追踪失败次数:

```java
var attempts = new AtomicInteger(0);
var result = handler.executeWithRetry(() -> {
    if (attempts.incrementAndGet() <= 2) {
        throw new LlmApiException("retryable error");
    }
    return "success after " + attempts.get() + " attempts";
});
```

### 6.5 模式 5: 内部状态验证 (CircuitBreakerTest)

使用包级可见的 `getState()` 方法验证熔断器内部状态:

```java
assertEquals(CircuitBreaker.State.OPEN, cb.getState());
```

---

## 7. 故障注入测试设计

项目已覆盖的故障注入场景:

| 故障 | 模拟方式 | 测试类 | 验证 |
|------|----------|--------|------|
| LLM API 超时 | Mock HttpServer 延迟 | LlmClientTest | `assertThrows(Exception.class)` |
| LLM API 返回 500 | Mock HttpServer 500 | LlmClientTest | `assertThrows(Exception.class)` |
| LLM API 连续失败 | Mockito `thenThrow` | CircuitBreakerTest | 状态 → OPEN |
| DB 连接失败 | Mockito `thenThrow` | ConnectionPoolManagerTest | SchemaNotFoundException |
| SQL 语法错误 | Mockito `doThrow` | ParseOnlyValidatorTest | SyntaxError |
| Pipeline 内部异常 | Mockito `thenThrow` | QueryPipelineServiceTest | QueryResponse.Error |
| L1 校验拒绝 | 真实 SecurityValidator | SecurityValidatorTest | READ_ONLY_VIOLATION |
| L2 AST 解析降级 | 真实 JSqlParser | SqlAstValidatorTest | 条件降级 |

---

## 8. 持续集成建议

### 8.1 GitHub Actions 矩阵

```yaml
test:
  strategy:
    matrix:
      test-type: [unit, integration, lint, jmh]
  steps:
    - unit:   mvn test
    - integration: mvn verify -P integration
    - lint:   mvn verify -P lint
    - jmh:    mvn verify -P jmh
```

### 8.2 质量门禁

| 关卡 | 检查项 | 阻断 |
|------|--------|------|
| **编译** | `mvn compile` | 0 error |
| **单元测试** | `mvn test` | 100% 通过 |
| **代码覆盖** | JaCoCo | ≥ 95% 行覆盖 |
| **静态分析** | Checkstyle + PMD + SpotBugs | 全部通过 |
| **依赖漏洞** | OWASP Dependency-Check | CVSS ≥ 7 阻断 |

---

## 9. 测试文件清单总表

| # | 文件 | Phase | 测试方法 | 行数 |
|---|------|-------|---------|------|
| 1 | `config/YamlConfigLoaderTest.java` | 0 | 7 | 133 |
| 2 | `model/query/QueryRequestTest.java` | 1 | 11 | 77 |
| 3 | `model/query/QueryResponseTest.java` | 1 | 5 | 49 |
| 4 | `model/query/ExecutionResultTest.java` | 1 | 2 | 28 |
| 5 | `model/schema/ModelRecordTest.java` | 1 | 8 | 70 |
| 6 | `model/error/LlmApiExceptionTest.java` | 1 | 2 | 22 |
| 7 | `model/error/McpExceptionTest.java` | 1 | 14 | 94 |
| 8 | `datasource/ConnectionPoolManagerTest.java` | 1 | 6 | 68 |
| 9 | `datasource/DataSourceFactoryTest.java` | 1 | 2 | 37 |
| 10 | `util/JsonUtilsTest.java` | 1 | 8 | 57 |
| 11 | `util/LogUtilsTest.java` | 1 | 4 | 42 |
| 12 | `schema/SchemaLoaderTest.java` | 2 | 1 | 47 |
| 13 | `schema/SchemaCacheTest.java` | 2 | 5 | 97 |
| 14 | `schema/SchemaContextBuilderTest.java` | 2 | 7 | 87 |
| 15 | `llm/LlmClientTest.java` | 3 | 5 | 129 |
| 16 | `llm/LlmRetryHandlerTest.java` | 3 | 7 | 76 |
| 17 | `llm/CircuitBreakerTest.java` | 3 | 9 | 82 |
| 18 | `llm/SqlExtractorTest.java` | 3 | 11 | 71 |
| 19 | `llm/PromptBuilderTest.java` | 3 | 4 | 38 |
| 20 | `validation/SecurityValidatorTest.java` | 4 | 19 | 134 |
| 21 | `validation/SqlAstValidatorTest.java` | 4 | 14 | 125 |
| 22 | `validation/ParseOnlyValidatorTest.java` | 4 | 6 | 108 |
| 23 | `validation/ResultMeaningValidatorTest.java` | 4 | 2 | 28 |
| 24 | `validation/ValidationChainBuilderTest.java` | 4 | 5 | 72 |
| 25 | `execution/PaginationRewriterTest.java` | 5 | 8 | 69 |
| 26 | `execution/ResultCollectorTest.java` | 5 | 7 | 137 |
| 27 | `execution/TextFormatterTest.java` | 5 | 5 | 70 |
| 28 | `execution/JsonFormatterTest.java` | 5 | 2 | 42 |
| 29 | `execution/QueryExecutorTest.java` | 5 | 2 | 86 |
| 30 | `pipeline/QueryPipelineServiceTest.java` | 6 | 7 | 170 |
| 31 | `pipeline/StageMetricsTest.java` | 6 | 2 | 23 |
| 32 | `tool/QueryToolTest.java` | 7 | 4 | 70 |
| 33 | `observability/MetricsRegistryTest.java` | 8 | 6 | 56 |
| 34 | `observability/OpenTelemetryConfigTest.java` | 8 | 3 | 35 |
| 35 | `e2e/SqlServerMcpE2ETest.java` | E2E | 2 (gated) | 127 |
| — | `benchmark/PaginationRewriterBenchmark.java` | 9 | 4 (JMH) | 64 |
| — | `benchmark/ResultFormatterBenchmark.java` | 9 | 6 (JMH) | 86 |
| — | `resources/application-test.yml` | 9 | — | — |
| — | `resources/init-testdb.sql` | 9 | — | 77 |

**总计**: 35 测试类, 208 单元测试方法, 2 E2E 测试, 10 JMH 基准, 2 资源配置文件

---

## 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.0 | 2026-05-17 | 初始版本, 基于全部测试源码逐类分析 | Claude |
