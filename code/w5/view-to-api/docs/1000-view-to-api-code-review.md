# 数据库查询 JSON 接口工具 — 代码审查报告

**文档编号**: 1000  
**审查日期**: 2026-05-20  
**审查范围**: `query-tool/` 全部后端 Java 代码（含单元测试）  
**审查工具**: Codex Review  
**审查结论**: **有条件通过** — 整体架构合理，发现 3 个需修复的缺陷（含 1 个运行时错误）和若干改进建议。

---

## 审查摘要

| 严重级别 | 数量 |
|---------|------|
| [E] Error | 2 |
| [W] Warning | 2 |
| [I] Info | 3 |

---

## [E] Error（必须修复）

### E1. BeanPropertyRowMapper 无法映射下划线字段名

**文件位置**: `LogService.java:111,122`  
**严重性**: [E] Error  
**问题描述**:

`BeanPropertyRowMapper<QueryLog>` 期望 Java 字段名与 SQL 列名精确匹配。但 H2 查询返回的列名是 `request_time`（下划线命名），而 `QueryLog` 的 Java 字段是 `requestTime`（驼峰命名）。`BeanPropertyRowMapper` **不执行** 下划线到驼峰的自动转换，导致所有字段映射失败，运行时抛出异常或返回全是 null 的对象。

**建议修复**:

方案一（推荐）：在 SQL 中为下划线列添加驼峰别名：

```sql
SELECT id, request_time AS requestTime, client_ip AS clientIp, 
       database_ip AS databaseIp, database_port AS databasePort, ...
```

方案二：在 `BeanPropertyRowMapper` 上设置下划线映射：需额外配置 `UnderscoreNameMapper`。

**优先级**: 高 — 运行时导致日志查询全部失败。

---

### E2. 非分页查询直接拼接 LIMIT 不兼容 SQL Server / Oracle

**文件位置**: `QueryService.java:86`  
**严重性**: [E] Error  
**问题描述**:

非分页场景下，代码直接在原始 SQL 后拼接 `" LIMIT " + MAX_NO_PAGE_ROWS`。这只对 MySQL 有效。对于 SQL Server 和 Oracle，正确的行数限制语法是 `FETCH NEXT n ROWS ONLY`，且需要 `ORDER BY` 配合。

**建议修复**:

1. 使用 `PageService.buildPageSql()` 处理非分页限制（复用分页实现），构造 `OFFSET 0 ROWS FETCH NEXT n ROWS ONLY`。
2. 或针对非分页场景，在文档中说明仅 MySQL 支持无分页查询，SQL Server/Oracle 必须传分页参数。

---

## [W] Warning（建议修复）

### W1. `stripOuterOrderBy` 直接强转 PlainSelect 可能抛 ClassCastException

**文件位置**: `SqlParserWrapper.java:44,63`  
**严重性**: [W] Warning  
**问题描述**:

`stripOuterOrderBy()` 和 `hasOuterOrderBy()` 直接将 `select.getSelectBody()` 强转为 `PlainSelect`。但 SELECT 语句的 body 也可能是 `SetOperationList`（UNION / INTERSECT / EXCEPT 查询）。虽然当前 `SqlValidator` 的 try-catch 会将 ClassCastException 转为"SQL 语句无法解析"错误，但在 `stripOuterOrderBy` 中抛出的异常会导致 COUNT 查询回退到不剥离 ORDER BY 的模式。

**建议修复**:

在 `stripOuterOrderBy` 中添加 `instanceof` 检查：

```java
if (!(select.getSelectBody() instanceof PlainSelect)) {
    return sql; // Can't strip ORDER BY from SET operations
}
```

### W2. 日志写入队列未做优雅关闭

**文件位置**: `LogService.java`  
**严重性**: [W] Warning  
**问题描述**:

`LogService.executor` 是一个 `ThreadPoolExecutor`，`@PreDestroy shutdown()` 方法只调用了 `executor.shutdown()` 但未调用 `awaitTermination()`。在应用关闭时，队列中积压的日志写入任务可能被丢弃。

**建议修复**: 

在 `shutdown()` 中添加等待：

```java
public void shutdown() {
    executor.shutdown();
    try {
        if (!executor.awaitTermination(5, TimeUnit.SECONDS)) {
            executor.shutdownNow();
        }
    } catch (InterruptedException e) {
        executor.shutdownNow();
        Thread.currentThread().interrupt();
    }
}
```

---

## [I] Info（建议考虑）

### I1. 密码未在日志中记录（正确），但 SQL 原文可能包含敏感信息

**文件位置**: `QueryController.java`  
**严重性**: [I] Info  
**问题描述**:

密码字段 `databasePassword` 未存入日志（正确行为），但 `sqlFull` 字段存储了完整 SQL。如果 SQL 中包含 `PASSWORD('xxx')` 或 `IDENTIFIED BY 'xxx'` 等含有密码的字面量，这些敏感信息将以明文形式存储在日志中。

**建议**: 在存储前对 SQL 进行密码/敏感字面量的正则脱敏。

### I2. 日期解析未做 try-catch

**文件位置**: `LogService.java:78-84`  
**严重性**: [I] Info  
**问题描述**:

`LocalDateTime.parse(request.getStartTime(), ...)` 没有 try-catch 包裹。如果前端传入了格式错误的日期字符串，将抛出 `DateTimeParseException`，导致整个日志查询请求失败。

**建议**: 在日期解析处添加 try-catch，解析失败时忽略该筛选条件（或返回参数格式错误提示）。

### I3. 日志查询未做完整的字段映射

**文件位置**: `LogService.java:111`  
**严重性**: [I] Info  
**问题描述**:

除了 E1 中的下划线映射问题外，日志查询的 `SELECT *` 会返回 `created_at` 字段，但 `QueryLog` 没有 `createdAt` 的对应的 setter 映射。这是次要问题，但建议统一处理所有字段的列名映射。

---

## 总体评价

### 优点

- **架构清晰**：Controller - Service - Security 三层分离明确，职责单一。
- **连接池管理完善**：ConcurrentHashMap + 资源上限控制 + 空闲回收机制。
- **异步日志实现正确**：有界队列 + CallerRunsPolicy + 队列使用率监控。
- **SQL 校验完整**：三层防御（正则 + AST + 危险关键字）。
- **错误码枚举完整**：覆盖主要异常场景。
- **测试覆盖较好**：SqlValidator 参数化测试覆盖 13 个场景，PageService 覆盖三库分页。

### 主要问题

1. **BeanPropertyRowMapper 需要列别名**（E1）— 运行时阻塞。
2. **非分页 LIMIT 不跨库**（E2）— 功能完整性问题。
3. **PlainSelect 强转风险**（W1）— 对 UNION 查询的保护不足。

---
## 修订历史

| 版本 | 日期 | 修订内容 | 作者 |
|------|------|---------|------|
| v1.0 | 2026-05-20 | 初版代码审查报告 | AI |
