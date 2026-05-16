# Code Review: sqlserver-mcp-java

**Project**: SQL Server MCP Server (Natural Language → T-SQL via LLM)  
**Reviewed By**: OpenAI Codex CLI  
**Date**: 2026-05-17

---

## 🔴 CRITICAL SEVERITY

### 1. SQL Injection via Pagination Rewriter
- **File**: `PaginationRewriter.java`
- **Issue**: Pagination SQL is constructed via string concatenation with user-provided SQL. While the SQL comes from LLM output, there's no parameterization for the OFFSET/FETCH values, and the original SQL is embedded directly without validation that it's truly read-only.
- **Risk**: If LLM output is manipulated (prompt injection), malicious SQL could be executed. The `ORDER BY (SELECT NULL)` is a SQL Server workaround but doesn't prevent injection in the embedded query.
- **Fix**: Validate original SQL is SELECT/WITH via AST before wrapping, use PreparedStatement for OFFSET/FETCH parameters.

### 2. API Key Exposure in Configuration
- **File**: `YamlConfigLoader.java`
- **Issue**: LLM API key can be loaded from YAML file with only a warning log. If `LLM_API_KEY` env var is not set, the YAML value is used directly.
- **Risk**: Hardcoded API keys in YAML files can be committed to repos, exposed in error logs, or leaked via config dumps.
- **Fix**: Make API key required from environment variable only; remove YAML fallback.

### 3. Missing Input Sanitization for LLM Prompts
- **File**: `PromptBuilder.java`
- **Issue**: User query is inserted directly into LLM prompts without escaping or length limiting.
- **Risk**: Prompt injection could cause the LLM to generate malicious SQL that bypasses validation.
- **Fix**: Sanitize and truncate user input before inserting into prompts.

### 4. No Rate Limiting at Application Level
- **File**: `QueryTool.java`
- **Issue**: The `handleCall` method processes every request without rate limiting.
- **Risk**: DoS attacks could exhaust connection pools, LLM API quotas, or server resources.
- **Fix**: Add token bucket rate limiter or similar throttling mechanism.

---

## 🟠 HIGH SEVERITY

### 5. Virtual Thread Executor Not Properly Shut Down
- **File**: `ConnectionPoolManager.java`
- **Issue**: `close()` calls `virtualExecutor.close()` but this may not gracefully drain tasks. No timeout or forced shutdown handling.
- **Risk**: Application shutdown may hang if tasks are in-flight, or resources may leak.
- **Fix**: Use `shutdown()`, `awaitTermination()`, `shutdownNow()` with proper timeout.

### 6. Future.get() Blocking Without Timeout
- **File**: `ConnectionPoolManager.java`
- **Issue**: `future.get()` blocks indefinitely waiting for database operations.
- **Risk**: Thread starvation, resource exhaustion, poor user experience.
- **Fix**: Add timeout: `future.get(30, TimeUnit.SECONDS)`.

### 7. LLM Response Parsing Is Fragile
- **File**: `LlmClient.java:78-95`
- **Issue**: `parseResponseBody` assumes a specific JSON structure from the LLM API. No handling for error responses from API.
- **Risk**: Debugging production issues becomes difficult; transient API errors may be misclassified.
- **Fix**: Check for error field first, improve exception wrapping.

### 8. Schema Cache Initialization Blocks Startup
- **File**: `SqlServerMcpApplication.java:52-57`
- **Issue**: Schema pre-loading happens synchronously during startup before MCP server is ready.
- **Risk**: Extended startup times, potential startup failure if database is temporarily unavailable.
- **Fix**: Make schema loading async with fallback to lazy loading.

---

## 🟡 MEDIUM SEVERITY

### 9. Security Validator Uses Regex for Keyword Detection
- **File**: `SecurityValidator.java:48-55`
- **Issue**: `wordBoundaryContains` compiles a new `Pattern` for every keyword check on every request. Inefficient and potential ReDoS risk.
- **Risk**: Performance degradation under load; potential DoS via crafted SQL.
- **Fix**: Pre-compile patterns as static final fields.

### 10. No Validation of LLM-Generated SQL Against Schema
- **File**: `SqlAstValidator.java:25-35`
- **Issue**: AST validator checks statement type but doesn't verify that referenced tables/columns exist in the provided schema.
- **Risk**: Runtime SQL errors, confusing user messages, potential information disclosure.
- **Fix**: Add schema-aware validation after AST parsing to check table existence.

### 11. Pagination Rewriter Breaks ORDER BY Clauses
- **File**: `PaginationRewriter.java`
- **Issue**: The rewriter wraps the original SQL in a subquery and adds `ORDER BY (SELECT NULL)`, which overrides original ORDER BY.
- **Risk**: Incorrect query results for paginated data where order matters.
- **Fix**: Preserve original ORDER BY if present using JSqlParser AST analysis.

### 12. Logging Sensitive Data
- **File**: `LlmClient.java`, `QueryTool.java`
- **Issue**: User queries and generated SQL are logged at INFO/DEBUG level without redaction.
- **Risk**: Privacy violations, information disclosure in log aggregation systems.
- **Fix**: Add redaction utility for sensitive patterns in logs.

---

## 🔵 LOW SEVERITY

### 13. Missing Null Checks in Configuration Helpers
- **File**: `YamlConfigLoader.java`
- **Issue**: Helper methods like `str()`, `intVal()` don't handle `null` map inputs consistently.
- **Fix**: Add explicit null checks at the start of each helper.

### 14. Hardcoded Query Timeout
- **File**: `ConnectionPoolManager.java:64`
- **Issue**: `stmt.setQueryTimeout(30)` is hardcoded to 30 seconds, not aligned with config.
- **Fix**: Pass timeout from `QueryConfig` to `QueryExecutor` and use it.

### 15. Missing JavaDoc on Public APIs
- **Files**: `QueryTool`, `QueryPipelineService`, `LlmClient`
- **Issue**: Public methods lack JavaDoc comments.
- **Fix**: Add JavaDoc to all public methods.

---

## ⚪ INFO / OBSERVATIONS

### 16. Layered Validation Architecture (Good)
- The 4-stage validation pipeline (L1-L4) is well-designed: keyword filtering → AST parsing → parse-only validation → result meaning validation.

### 17. Sealed Classes for Exceptions (Good)
- `McpException` uses Java sealed classes to restrict the exception hierarchy.

### 18. Virtual Threads for I/O (Good)
- Using `newVirtualThreadPerTaskExecutor()` for database operations is appropriate for Java 26.

### 19. No Test Coverage
- No test files found in `src/test/java`. For a security-sensitive application, comprehensive tests are critical.

### 20. Configuration Validation
- The YAML config loader silently falls back to defaults. Consider fail-fast validation.

---

## 🚨 BLOCKING ISSUES FOR PRODUCTION

1. **Critical SQL injection risk** in `PaginationRewriter` — must fix before any production deployment
2. **API key exposure** via YAML fallback — credentials must be environment-variable only
3. **No test coverage** — cannot verify security controls or correctness without tests
4. **Missing rate limiting** — application is vulnerable to resource exhaustion attacks

---

## ✅ RECOMMENDED NEXT STEPS

1. **Immediate (Blocker)**:
   - Fix `PaginationRewriter` to use parameterized queries/validate SQL
   - Remove YAML API key fallback; require `LLM_API_KEY` env var
   - Add integration tests for security validation layer

2. **Short-term (High Priority)**:
   - Add request timeouts to `Future.get()` calls
   - Implement application-level rate limiting
   - Add schema-aware SQL validation

3. **Medium-term**:
   - Pre-compile regex patterns in `SecurityValidator`
   - Add log redaction for sensitive data
   - Preserve ORDER BY clauses in pagination

4. **Long-term**:
   - Add comprehensive test suite
   - Implement circuit breaker metrics and alerting
   - Add audit logging for all executed queries

---

**Overall Assessment**: The architecture is well-structured with good separation of concerns and appropriate use of modern Java features. However, **critical security gaps** in SQL injection prevention and credential management make this **not production-ready**. Address the blocking issues before deployment.
