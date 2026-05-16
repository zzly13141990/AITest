# Code Review: sqlserver-mcp-java Implementation

## Overview

- **Project**: sqlserver-mcp-java — SQL Server MCP Server, natural language to T-SQL via LLM
- **Language**: Java 26 (preview features enabled)
- **Files**: 59 source files across 13 packages
- **Build**: Maven, `mvn clean compile -P!viewhigh-profile` ✓ BUILD SUCCESS

---

## 1. Architecture & Design

### Layered Architecture (Score: 9/10)

```
config/ → datasource/ → schema/ → llm/ → validation/ → execution/ → pipeline/ → tool/
```

Clear hexagonal structure with Composition Root in `SqlServerMcpApplication.main()`. Good separation of concerns. Pipeline stages follow a linear chain: Schema → Context → LLM → Extract → Validate (L1/L2) → Execute/Validate (L3/L4) → Format.

**Issues:**
- `MetricsRegistry` and `OpenTelemetry` are instantiated in `SqlServerMcpApplication` but **never wired into the pipeline**. Observability is effectively disconnected from actual usage. The pipeline has no metrics instrumentation.
- `ResultMeaningValidator` is a pass-through stub (feature-gated but not functional).

---

## 2. MCP SDK API Usage (Score: 8/10)

### Correct usage:
- `McpServer.sync(transportProvider)` with `SyncSpecification` builder pattern
- `.toolCall(Tool, BiFunction<McpSyncServerExchange, CallToolRequest, CallToolResult>)` — correct method name
- `McpSchema.JsonSchema` record for input schema definition
- `McpSchema.CallToolResult` for response construction

### Issues:
- **`QueryResponse.toCallToolResult()`** is declared on the sealed interface but the interface is in the `model/query` package, which creates an undesirable dependency from the model layer to `McpSchema` (an MCP SDK class). A cleaner design would map `QueryResponse` → `CallToolResult` in the `QueryTool` adapter layer instead.

---

## 3. JDK 26 Compatibility (Score: 9/10)

### Used effectively:
- `StructuredTaskScope.open(Joiner.awaitAllSuccessfulOrThrow())` with new JDK 26 interface-based API
- Virtual threads via `Executors.newVirtualThreadPerTaskExecutor()` in ConnectionPoolManager
- Sealed interfaces/classes for error hierarchy (`McpException`) and query response (`QueryResponse`)
- Records throughout for data carriers
- Pattern matching switch in `SqlAstValidator.validateStatement()`, `CircuitBreaker.isCallPermitted()`
- Text blocks for SQL strings and prompt templates

---

## 4. Error Handling (Score: 8/10)

### Good:
- Sealed exception hierarchy with 10 permitted subclasses
- `McpException` has `errorCode()`, `suggestion()`, `details()` — well-structured error context
- `isRetryable()` returns proper classification for LLM, DB, timeout errors
- `QueryResponse.Error` record maps exceptions to `CallToolResult.isError(true)` correctly

### Issues:
- **`InternalException` wraps unchecked exceptions but uses generic `"查询处理失败: "` prefix**, losing error code specificity
- **`ParseOnlyValidator` catches `Exception` broadly** near the end (line 78), wrapping all unexpected errors as validation failures rather than pipeline errors
- Some error messages mix Chinese and English — inconsistent user-facing language

---

## 5. Concurrency & Thread Safety (Score: 7/10)

### Good:
- `ConcurrentHashMap` for connection pools and schema cache
- `CircuitBreaker` with `AtomicReference<State>`, `AtomicInteger` counters, `ReentrantLock` for state transitions
- Schema cache single-flight pattern using `ConcurrentHashMap.computeIfAbsent` + `CompletableFuture`

### Issues:
- **`ConnectionPoolManager.withConnection()`** wraps every DB call in `virtualExecutor.submit()` + `Future.get()`. This adds a virtual thread context switch for every operation. Since HikariCP already handles async connection acquisition, this indirection provides no benefit and adds overhead.
- **`CircuitBreaker.onSuccess()`** increments `callCount` in CLOSED state but the count is only used to trigger `resetCounters()` when it exceeds `slidingWindowSize * 2`. The `failureCount` tracking for failure-rate calculation is not bounded (could overflow after ~2B calls, though practically unlikely). Also, the call count is incremented on EVERY call but the sliding window only resets at `> 2 * slidingWindowSize` — the failure rate uses `failureCount / max(1, callCount)` across the ENTIRE lifetime, not a true sliding window.
- **`SchemaCache.initialize()`** stores `CompletableFuture` in `pendingLoads` but the initial load in the `for` loop creates a new `CompletableFuture.supplyAsync` for each database. If `getSchema()` is called concurrently for the same database, `computeIfAbsent` correctly deduplicates. However, the `initialize()` method does NOT wait for all loading to complete — it returns immediately. This means `schemaCache.initialize()` in `SqlServerMcpApplication.main()` may kick off preloading but the main thread continues without waiting.

---

## 6. Code Quality (Score: 8/10)

### Good:
- Consistent use of `var` for local type inference
- Well-named methods and classes
- Compact records with compact constructors for validation
- Static factory methods (`ValidationResult.reject()`, `QueryResponse.error()`)
- `@FunctionalInterface` on `SqlValidationRule`
- `@Nullable` annotations from JSpecify

### Issues:
- **Regex pattern recompilation**: `SecurityValidator.wordBoundaryContains()` compiles `Pattern.compile("\\b" + Pattern.quote(word) + "\\b")` on every call. `LlmClient.parseValidationScore()` compiles pattern on every call. Both should use `static final Pattern` fields.
- **`SecurityValidator.preProcess()` uppercases the whole string** then uses `Pattern.compile(...).matcher(text)` — the `wordBoundaryContains()` method also compiles a new Pattern instance each time.
- **`SqlExtractor.looksLikeSql()`** checks only the start of the string for SELECT/WITH — it doesn't handle `WITH` clauses that start with comments, though `extract()` does handle this in Priority 3.
- **`PaginationRewriter.rewrite()`** wraps SQL in `SELECT * FROM (originalSQL) AS _p ORDER BY (SELECT NULL) OFFSET...` — using `SELECT NULL` in ORDER BY for pagination is a T-SQL idiom, but the inner query's original ORDER BY is discarded. This is correct for pagination but should be documented.
- **`ConnectionPoolManager`** imports `java.sql.Connection` and `java.sql.ResultSet` but uses `SqlFunction<java.sql.ResultSet, T>` fully qualified in the overloaded `withConnection`. Inconsistent.

---

## 7. Security (Score: 8/10)

### Validation layers:
1. **L1 (SecurityValidator)**: Regex-based keyword blocking for DDL/DML/DCL + dangerous functions/objects
2. **L2 (SqlAstValidator)**: JSqlParser AST validation — rejects all non-SELECT statements
3. **L3 (ParseOnlyValidator)**: `SET PARSEONLY ON` in SQL Server — validates syntax against real database
4. **L4 (ResultMeaningValidator)**: Pass-through stub (not yet implemented)

### Issues:
- L1's `DANGEROUS_KEYWORDS` includes `REPLACE` which could match in table/column names (not just `REPLACE()` function calls). Though the `wordBoundaryContains()` with `\b` word boundary reduces false positives, `\b` before `REPLACE` is sensitive to preceding characters.
- `ParseOnlyValidator` uses SQL string concatenation for the describe query: `"EXEC sys.dm_exec_describe_first_result_set N'" + escapedSql + "'"`. While `escapeSql` replaces `'` with `''`, this is not as robust as parameterized queries — though `sys.dm_exec_describe_first_result_set` doesn't support parameterization for the SQL text argument.

---

## 8. Test Coverage

- No test files found in `src/test/java` — the project structure exists but tests are not yet implemented.
- JUnit 5, Mockito, Testcontainers, and JMH dependencies are configured in `pom.xml`.

---

## 9. Configuration

- YAML-based config loading with env-var override for secrets (`LLM_API_KEY`, `DB_*_PASSWORD`)
- Sensible defaults in record compact constructors and `ConfigLoader/YamlConfigLoader`
- Warning logged when secrets are in YAML instead of env vars — good security practice

---

## Summary

| Aspect | Score | Key Issues |
|--------|-------|------------|
| Architecture | 9/10 | Clean layering, but observability disconnected |
| MCP SDK API | 8/10 | Correct API usage, slight coupling concern |
| JDK 26 | 9/10 | Proper use of preview features |
| Error Handling | 8/10 | Good hierarchy, some overly broad catches |
| Concurrency | 7/10 | Virtual thread overhead, circuit breaker not true sliding window |
| Code Quality | 8/10 | Clean code, regex compilation inefficiencies |
| Security | 8/10 | Good multi-layer defense, minor false-positive risk |
| Test Coverage | 0/10 | No tests implemented yet |
| **Overall** | **7/10** | Solid implementation, needs tests + observability wiring |

### Prioritized Action Items

1. **[High] Implement tests** — Zero test coverage for 59 source files. Unit tests for validation rules, schema loading, pipeline stages are critical.
2. **[Medium] Wire MetricsRegistry into QueryPipelineService** — Metrics are created but never called. Pipeline stages should record timing and counts.
3. **[Medium] Fix regex pattern recompilation** — `SecurityValidator.wordBoundaryContains()` and `LlmClient.parseValidationScore()` compile patterns per-call. Extract to `static final`.
4. **[Low] Remove unnecessary virtual executor** — `ConnectionPoolManager.virtualExecutor` adds overhead. Direct connection acquisition from HikariCP is sufficient.
5. **[Low] Add `PipelineMetrics` stage tracking** — `StageMetrics` record exists but is never used. The pipeline should emit per-stage metrics.
6. **[Low] Implement L4 validation** — `ResultMeaningValidator` is a stub. Real LLM-based validation would strengthen the pipeline.
