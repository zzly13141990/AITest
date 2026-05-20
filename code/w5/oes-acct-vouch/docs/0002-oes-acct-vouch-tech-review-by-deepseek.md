# OES 会计凭证录入组件 — 技术选型与后端技术规格说明书 Codex Review

> **Review 编号**: REVIEW-0002-v1
> **Review 日期**: 2026-05-17
> **Reviewer**: DeepSeek (Codex Review)
> **被审文档**: `0002-oes-acct-vouch-tech-by-by-deepseek.md` v2.0
> **Review 方法**: 静态技术评审 (Codex Review)，基于文档一致性、技术可行性、安全实践、业界惯例逐项审查

---

## 评定总览

| 维度 | 评分 | 说明 |
| --- | --- | --- |
| **完整性** | ⭐⭐⭐⭐ | 覆盖了数据库验证、技术栈、项目结构、API设计、非功能需求 |
| **准确性** | ⭐⭐⭐ | 存在 3 处事实性错误（String Templates、sendStringParametersAsUnicode 误解、Java 26 LTS 定性），需修正 |
| **一致性** | ⭐⭐⭐ | 内部基本一致，但 API 路径存在重复前缀风险、Caffeine 依赖未在 pom.xml 中声明 |
| **可行性** | ⭐⭐⭐ | 整体可行，但 vouch_no 生成存在并发竞态，Java 26 兼容性风险较大 |
| **安全性** | ⭐⭐ | 连接字符串明文密码、vouch_no 无并发锁、缺少 SQL Server 异常重试策略 |

**总评**: 文档质量较高，数据库验证扎实，技术选型有据可依。但存在若干需修正的硬伤和风险项，建议逐项处理后可达生产级别。

---

## 一、严重问题 (🔴 Must Fix)

### 🔴 1. Java 26 的 "String Templates" 特性已被移除

**位置**: §5.1 Java 26 特性利用表，第 366 行

**原文**:
```
| **字符串模板 (String Templates)** | 动态 SQL 拼接（谨慎使用，仍需参数化防注入） |
```

**问题**: String Templates 是 JEP 430 (Java 21 Preview) / JEP 459 (Java 22 Preview)，在 Java 23 中被 **正式移除 (withdrawn)**。Java 26 中 **不存在** String Templates 特性。将其列为可用特性属于事实性错误，会误导开发者。

**修改建议**: 从 §5.1 表中删除该行，或者替换为 `String.formatted()` / `MessageFormat` 等稳定方案。动态 SQL 拼接应坚持使用 `StringBuilder` + 参数化占位符，这本身就是最安全的方式。

---

### 🔴 2. `sendStringParametersAsUnicode: false` 配置语义完全相反

**位置**: §5.4 SQL Server 特有配置，第 438 行

**原文**:
```yaml
data-source-properties:
    sendStringParametersAsUnicode: false  # nvarchar 字段默认 Unicode
```

**问题**: 
- `sendStringParametersAsUnicode` 的默认值是 `true`。设为 `false` 意味着 JDBC 驱动会将 `String` 参数以 **非 Unicode (VARCHAR)** 方式发送给 SQL Server，而不是作为 `NVARCHAR`。
- 对于中文字符为主的会计凭证系统，这会导致 `nvarchar` 列上的中文数据**乱码或数据截断**（VARCHAR 编码页依赖服务器排序规则）。
- 注释 "nvarchar 字段默认 Unicode" 与实际效果完全相反，属于严重误导。

**修改建议**: 
```yaml
data-source-properties:
    sendStringParametersAsUnicode: true   # 确保 String 参数以 NVARCHAR 发送，支持中文
```
或者在不需要强制 Unicode 的场景下，**直接删除该项**（因为默认值就是 `true`）。

---

### 🔴 3. Java 26 不是 LTS，且兼容性风险被低估

**位置**: §1 技术选型总览表 + §2.1 兼容性说明，第 33、82 行

**原文**:
```
| **JDK**    | OpenJDK | **26** | 最新 LTS 替代方案，使用虚拟线程、记录模式等新特性 |
```
```
> 如遇到兼容性问题，可降级至 Java 24/25。
```

**问题**:
1. **Java 26 不是 LTS**。OpenJDK 的 LTS 发布周期是每 2 年 (9月): 17 → 21 → 25 → 29。Java 26 是 2026 年 3 月的 **非 LTS 特性版本**，仅享 6 个月支持。最接近的 LTS 是 **Java 25** (2025年9月)。
2. 文档将非 LTS 版本定性为 "最新 LTS 替代方案" 属于误导。
3. Spring Boot 3.4.x 对 Java 26 的兼容性未经充分验证（Spring Boot 3.4 的目标 Java 版本是 17-23）。"如遇到兼容性问题可降级至 Java 24/25" 这种兜底策略意味着项目在初期就可能需要切换 JDK 版本，带来不必要的返工。

**修改建议**:
- 将 JDK 版本改为 **Java 21 LTS** 或 **Java 25 LTS**。考虑到 OES 是望海康信的生产系统：
  - **方案 A (推荐)**: Java 21 LTS — Spring Boot 3.4 官方支持，稳定可靠，虚拟线程自 Java 21 起正式可用
  - **方案 B**: Java 25 LTS — 如果团队明确需要 Java 25 新特性且已验证与 Spring Boot 3.4 的兼容性
- 不要将非 LTS 版本用于生产系统技术选型文档

---

## 二、中等问题 (🟡 Should Fix)

### 🟡 4. vouch_no 生成存在并发竞态 (Race Condition)

**位置**: §8.5 vouch_no 生成，第 617-625 行

**原文**:
```java
Integer maxNo = jdbcTemplate.queryForObject(
    "SELECT ISNULL(MAX(vouch_no), 0) FROM acct_vouch " +
    "WHERE comp_code = ? AND copy_code = ? AND acct_year = ?",
    Integer.class, compCode, copyCode, acctYear
);
return maxNo == null ? 1 : maxNo + 1;
```

**问题**: `SELECT MAX(vouch_no) + 1` 模式是经典的 **read-then-write 竞态条件**。在并发保存凭证时，两个事务可能读取到同一个 `maxNo`，导致主键冲突或凭证号重复。即使包裹在 `@Transactional` 中，默认的 `READ_COMMITTED` 隔离级别也不防止幻读。

**修改建议**:
```java
// 方案 A: SQL Server 使用 UPDLOCK + SERIALIZABLE 提示
String sql = """
    SELECT ISNULL(MAX(vouch_no), 0) + 1 
    FROM acct_vouch WITH (UPDLOCK, SERIALIZABLE)
    WHERE comp_code = ? AND copy_code = ? AND acct_year = ?
    """;

// 方案 B: 使用 SEQUENCE 对象 (SQL Server 2012+)
// CREATE SEQUENCE vouch_no_seq AS INT START WITH 1;
// SELECT NEXT VALUE FOR vouch_no_seq;

// 方案 C: 利用 IDENTITY 插入后回填（如果 vouch_no 改为自增列）
```

---

### 🟡 5. API 路径存在重复前缀风险

**位置**: §10 API 接口规范，第 686-694 行

**原文**:
```
http://localhost:83000/oes-acct-vouch
```
然后接口定义为:
```
| `GET`  | `/oes-acct-vouch`               | 加载凭证编辑页面全部数据    |
| `POST` | `/oes-acct-vouch/save`          | 保存凭证（三表联动入库）     |
```

**问题**: 如果 `server.servlet.context-path=/oes-acct-vouch`（从 §7 项目结构推断），那么实际 URL 会变成 `http://localhost:83000/oes-acct-vouch/oes-acct-vouch/save`，路径中存在重复的 `/oes-acct-vouch`。

**修改建议**: 
- 在 controller 中 `@RequestMapping` 使用相对路径（如 `""` 或 `"/"`），依赖 context-path
- 或者在文档中明确说明 base URL 和 controller path 的关系：
  ```
  context-path: 空（由反向代理处理） 或使用 server.servlet.context-path=/api
  controller: @RequestMapping("/oes-acct-vouch")
  ```

---

### 🟡 6. Caffeine Cache 依赖未在 pom.xml 中声明

**位置**: §11.1 性能优化表提到 "Caffeine Cache, TTL=300s" 但 §5.2 核心依赖清单中未包含 Caffeine

**修改建议**: 在 `pom.xml` 中添加:
```xml
<dependency>
    <groupId>com.github.ben-manes.caffeine</groupId>
    <artifactId>caffeine</artifactId>
</dependency>
```
如果使用 Spring Cache 抽象，还需添加:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-cache</artifactId>
</dependency>
```

---

### 🟡 7. `acct_vouch_detail` 表缺少冗余字段的完整验证

**位置**: §4.2 acct_vouch_detail 表结构，第 201-223 行

**问题**: §8.4 动态 checktype 构建代码中，`acct_check_items` 表的 INSERT 包含了 `vouch_no`, `vouch_date`, `vouch_row`, `vouch_source_code`, `acct_month` 等字段。这些字段在 §4.3 中列出来（标记为 Y*），但 **`acct_vouch_detail` 表（§4.2）并未列出这些冗余字段**。如果 INSERT 到 `acct_vouch_detail` 也需要这些字段，需要在 §4.2 中补充验证。

**修改建议**: 确认 `acct_vouch_detail` 和 `acct_check_items` 的冗余字段分布，统一在 §4 中完整列出。

---

### 🟡 8. 事务隔离级别与传播行为未定义

**位置**: §1 技术选型表 + §11.2 安全防护

**原文**:
```
| **事务管理** | Spring Transaction | 声明式事务，保证三表原子写入 |
```

**问题**: 仅标注 `@Transactional` 不足以描述三表原子写入的事务语义。缺少以下关键信息：
- 隔离级别 (Isolation): `READ_COMMITTED` / `REPEATABLE_READ` / `SERIALIZABLE`？
- 传播行为 (Propagation): `REQUIRED` / `REQUIRES_NEW`？
- 超时设置: 防止长事务锁表
- 回滚策略: 哪些异常触发回滚？

**修改建议**:
```java
@Transactional(
    isolation = Isolation.READ_COMMITTED,
    propagation = Propagation.REQUIRED,
    timeout = 30,
    rollbackFor = Exception.class
)
public void saveVouch(VouchDTO vouchDTO) { ... }
```

---

## 三、轻微问题 (🟢 Nice to Fix)

### 🟢 9. `@Primary` 注解冗余

**位置**: §5.3 DataSourceConfig，第 417 行

**原文**:
```java
@Bean
@Primary
public DataSource dataSource() { ... }
```

**问题**: 当只有一个 `DataSource` Bean 时，`@Primary` 是冗余的（虽然无害）。Spring Boot 的自动配置在没有其他 `DataSource` 时不会产生歧义。

**建议**: 移除 `@Primary` 或添加注释说明为未来多数据源预留。

---

### 🟢 10. `acct_check_items` 表中 `vouch_no`, `vouch_date`, `vouch_row` 标记为 "Y*" 但语义不清

**位置**: §4.3 辅助核算表，第 242-244 行

**原文**:
```
| `vouch_no` | int | Y* | 凭证号（数据库未定义在 PRD 中） |
```

**问题**: "Y*" 和 "数据库未定义在 PRD 中" 含义模糊。"Y*" 可能表示"可空且未在 PRD 中提及"。建议统一为标准的 `Y`/`N` 标记，并在备注中说明。

---

### 🟢 11. SQL Server `WITH (NOLOCK)` 使用需谨慎

**位置**: §9 SQL Server 适配要点 + §11.1 性能优化

**原文**:
```
| **WITH (NOLOCK)** | 高并发查询建议使用 `WITH (NOLOCK)` 避免死锁 |
```

**问题**: `WITH (NOLOCK)` (即 `READ UNCOMMITTED`) 会读取未提交数据（脏读），在财务凭证场景下可能导致数据不一致（读到未提交的凭证、金额不对等）。对于会计系统，数据准确性优先于并发性能。

**修改建议**: 
- 仅对查询类、允许脏读的场景（如辅助核算选项列表）使用 `NOLOCK`
- 对凭证主表、分录明细表的业务查询，使用 `READ COMMITTED SNAPSHOT` 隔离级别（通过数据库设置 `READ_COMMITTED_SNAPSHOT ON`），兼顾并发和一致性
- 在文档中明确说明 NOLOCK 的适用场景和风险

---

### 🟢 12. 缺少 SQL Server 死锁重试机制

**位置**: 缺失

**问题**: SQL Server 在高并发下可能出现死锁（错误码 1205）。三表联动写入应当包含自动重试逻辑。

**建议**: 添加 Spring Retry 或手动重试：
```java
@Retryable(retryFor = DeadlockLoserDataAccessException.class, 
           maxAttempts = 3, backoff = @Backoff(delay = 100))
@Transactional
public void saveVouch(VouchDTO vouchDTO) { ... }
```

---

### 🟢 13. 缺少 SQL Server 字符排序规则说明

**位置**: 缺失

**问题**: 数据库 `OESCQET-0408` 的排序规则 (Collation) 未说明。不同排序规则会影响：
- 中文字符比较 (`Chinese_PRC_CI_AS` vs `SQL_Latin1_General_CP1_CI_AS`)
- `VARCHAR` 列的代码页
- 临时表 (`tempdb`) 的默认排序规则

**建议**: 在 §3.1 数据库信息表中增加排序规则行，或在 §9 中补充说明。

---

### 🟢 14. React 18 版本选择需确认

**位置**: §6 前端技术架构，第 447 行

**原文**:
```
| 框架 | **React 18** | 18.3.x |
```

**问题**: 截至 2026 年 5 月，React 19 已稳定发布超过一年（2024年12月发布）。React 18.3.x 在 2026 年的新项目中使用，意味着需要使用 React 19 的向后兼容模式或放弃新特性（如 Server Components、Actions 等）。如果 OES 内部已有 React 18 项目，保持一致是合理的；如果是全新项目，建议评估 React 19。

**建议**: 在注释中明确选择 React 18 的原因（如 OES 整体技术栈要求），避免读者质疑版本选择过于保守。

---

### 🟢 15. 表名白名单建议从数据库动态加载

**位置**: §9.2 表名白名单校验

**原文**:
```java
private static final Set<String> ALLOWED_TABLES = Set.of(...);
```

**问题**: 硬编码白名单在 `sys_check_define` 新增辅助核算类型时需要重新发布应用。

**建议**: 
1. 在文档中明确说明启动时从 `sys_check_define.table_id` 动态加载白名单的实现方案
2. 同时保留静态白名单作为兜底（防御 `sys_check_define` 数据异常）

---

### 🟢 16. `DataSourceBuilder` 与 HikariCP 配置的兼容性

**位置**: §5.3 DataSourceConfig

**问题**: `DataSourceBuilder.create().build()` 配合 `@ConfigurationProperties("spring.datasource")` 是可行方案，但 `spring.datasource.hikari.*` 的属性绑定依赖于 Spring Boot 的 `DataSourceProperties`。使用 `DataSourceBuilder` 手动创建 Bean 可能绕过部分 HikariCP 自动配置。

**建议**: 添加验证说明（如启动后检查 HikariCP 连接池指标），或改用更标准的 `spring.datasource.hikari` 自动配置方式。

---

## 四、优点 (值得保留)

1. ✅ **数据库验证扎实**: §4 通过 `INFORMATION_SCHEMA` 实际验证了所有表结构，发现了 PRD 与实际的 6 处差异，这是文档最有价值的部分
2. ✅ **未选型说明**: §1.1 明确解释了为何不选 MyBatis/JPA/Spring Data JDBC，有助于后续维护者理解设计决策
3. ✅ **SQL Server 适配对照表**: §9 的 MySQL ↔ SQL Server 对照表，实用性强
4. ✅ **动态 checktype 设计**: §8.4 的动态 SQL 构建逻辑清晰，列名来自数据库而非用户输入，注入风险可控
5. ✅ **白名单 + 参数化双重防护**: §9.1-9.2 的 SQL 注入防护思路正确
6. ✅ **PRD 差异汇总表**: §12.2 将实际数据库与 PRD 的差异集中汇总，便于后续开发对齐

---

## 五、修改优先级建议

| 优先级 | 编号 | 问题 | 建议处理顺序 |
| --- | --- | --- | --- |
| 🔴 P0 | #1 | String Templates 已被移除 | 立即从文档中删除 |
| 🔴 P0 | #2 | sendStringParametersAsUnicode 配置反了 | 立即修正为 `true` |
| 🔴 P0 | #3 | Java 26 非 LTS + 兼容性风险 | 降级为 Java 21 LTS 或 Java 25 LTS |
| 🟡 P1 | #4 | vouch_no 并发竞态 | 添加 UPDLOCK 或 SEQUENCE |
| 🟡 P1 | #5 | API 路径重复前缀 | 明确 context-path 与 controller 路径关系 |
| 🟡 P1 | #6 | Caffeine 依赖缺失 | pom.xml 补充依赖 |
| 🟡 P1 | #7 | acct_vouch_detail 冗余字段验证 | 补充表结构验证 |
| 🟡 P1 | #8 | 事务隔离级别未定义 | 明确 @Transactional 参数 |
| 🟢 P2 | #9-16 | 轻微问题 | 择机优化 |

---

> **Review 结论**: 文档整体质量良好，但存在 3 个需立即修正的严重问题（#1-3）和 5 个中等问题（#4-8）。建议先修正 P0 问题后再进行下一步开发设计。
