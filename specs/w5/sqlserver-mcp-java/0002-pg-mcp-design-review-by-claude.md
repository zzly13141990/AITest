# sqlserver-mcp-java 架构评审报告

**评审对象**: `0002-pg-mcp-design-by-claude.md` + `CLAUDE.md`  
**评审日期**: 2026-05-17  
**评审人**: Senior Software Architect  

---

## 📋 评审摘要

| 维度 | 评分 | 状态 |
|------|------|------|
| 架构合理性 | ⭐⭐⭐⭐☆ | ✅ 良好 |
| 安全性充分性 | ⭐⭐⭐⭐☆ | ✅ 良好 |
| 设计模式适用性 | ⭐⭐⭐⭐⭐ | ✅ 优秀 |
| 文档完整性 | ⭐⭐⭐⭐☆ | ✅ 良好 |
| Java 特性使用 | ⭐⭐⭐☆☆ | ⚠️ 需修正 |
| 与 CLAUDE.md 一致性 | ⭐⭐⭐⭐⭐ | ✅ 优秀 |
| 风险管控 | ⭐⭐⭐⭐☆ | ✅ 良好 |
| 依赖版本管理 | ⭐⭐⭐☆☆ | ⚠️ 需细化 |

---

## 🔍 详细问题清单

### 一、架构合理性 (Architecture Soundness)

| 严重性 | 类别 | 章节引用 | 问题描述 | 建议 |
|--------|------|----------|----------|------|
| **Medium** | 依赖注入 | §1.1 整体架构 | 采用手动组合根 (Composition Root) 无 DI 框架，随模块增长可能导致依赖装配复杂、测试困难 | 建议保持当前方案但明确模块边界；若模块超 10 个，评估引入轻量级 DI (如 Dagger) 或保持组合根但添加装配测试 |
| **Low** | 错误处理 | §1.1 Pipeline Layer | 未明确定义跨阶段错误传播策略，如 L2 校验失败是否触发降级到 L3 | 在 `McpException` sealed 层级中定义 `ValidationFailure` 子类型，明确 `recoverable` 标志位，由 Pipeline 统一决策降级逻辑 |
| **Info** | 可维护性 | §1.2 包结构 | `util/` 包定义为"无业务逻辑"，但未禁止循环依赖或工具类膨胀风险 | 在 CLAUDE.md 补充规则：`util/` 类不得依赖业务包，单文件 ≤150 行，否则拆分子包 |

### 二、安全性充分性 (Security Adequacy)

| 严重性 | 类别 | 章节引用 | 问题描述 | 建议 |
|--------|------|----------|----------|------|
| **High** | SQL 注入防护 | §4.2 四层校验链 | L1 正则预检存在绕过风险 (如编码混淆、零宽字符变体)，依赖 L2 AST 但 JSqlParser 对 T-SQL 方言支持有限 | 1) L1 增加 Unicode 归一化 + 零宽字符过滤白名单；2) L2 失败时强制降级到 L3 `SET PARSEONLY ON` 执行计划验证；3) 添加 JSqlParser 兼容性测试矩阵 |
| **Medium** | 凭证管理 | 全文 | 未说明数据库密码、LLM API Key 的存储与传输加密方案 | 1) 运行时通过环境变量或 Vault 注入敏感配置；2) 内存中敏感字段使用 `char[]` 并手动清零；3) 审计日志脱敏处理 |
| **Medium** | 审计日志 | §6 可观测性 | 审计日志写入独立文件但未说明防篡改、防丢失机制 | 1) 启用 Logback `AsyncAppender` + `TimeBasedRollingPolicy`；2) 关键审计事件同步写入 + 异步备份；3) 文件权限设置为仅 root 可写 |
| **Low** | LLM 安全 | §4.2 Layer 4 | LLM 语义验证可能受提示词注入攻击，返回恶意评分 | 1) LLM 请求添加 system prompt 固定校验规则；2) 对 LLM 输出做二次正则校验；3) Layer 4 默认关闭，仅高敏感场景启用 |

### 三、设计模式适用性 (Design Pattern Appropriateness)

| 严重性 | 类别 | 章节引用 | 问题描述 | 建议 |
|--------|------|----------|----------|------|
| **Info** | 策略模式 | §4.2 校验链 | `SqlValidationRule` 接口设计合理，但未说明规则执行顺序与短路策略 | 在接口添加 `priority()` 方法，Pipeline 按优先级排序执行；定义 `StopOnFailure` 与 `ContinueOnError` 两种执行策略配置项 |
| **Info** | 缓存模式 | §3.3 SchemaCache | 使用 `ConcurrentHashMap` + 时间过期，未处理缓存击穿/雪崩 | 添加 `loading` 标志位实现单飞请求 (single-flight)；过期时间添加随机抖动 (±10%)；监控 cache.miss.rate 指标 |

### 四、完整性 (Completeness)

| 严重性 | 类别 | 章节引用 | 问题描述 | 建议 |
|--------|------|----------|----------|------|
| **Medium** | 异常恢复 | §11 风险表 | 提及"连接失败恢复"但未定义重试策略 (指数退避? 最大次数?) | 在 `LlmRetryHandler` 和 `ConnectionPoolManager` 中统一实现：`maxRetries=3`, `initialBackoff=100ms`, `maxBackoff=5s`, `jitter=0.2` |
| **Low** | 数据一致性 | 全文 | 多数据库配置下，各库 Schema 加载并行但未说明加载失败时的整体状态 | `StructuredTaskScope.ShutdownOnFailure` 已处理单库失败，建议补充：任一库加载失败时记录 `WARN` 日志但服务继续启动，查询时动态加载该库 Schema |
| **Info** | 版本管理 | §1 变更记录 | 仅记录初始版本，未定义后续版本演进规则 | 补充：版本号遵循 `MAJOR.MINOR.PATCH`，破坏性变更需更新 `0001-PRD.md` 并通知所有 Client |

### 五、Java 26 特性使用 (Java 26 Feature Usage) ⚠️

| 严重性 | 类别 | 章节引用 | 问题描述 | 建议 |
|--------|------|----------|----------|------|
| **Critical** | 版本准确性 | CLAUDE.md §1.1 | **"OpenJDK 26" 非真实 Java 版本** (当前最新为 Java 21 LTS，Java 22-25 为非 LTS)，可能导致构建失败或特性不可用 | **立即修正**：确认目标 JDK 版本 (建议 `OpenJDK 21 LTS`)，更新所有文档及 `pom.xml` `<maven.compiler.release>`；若确需预览特性，明确标注 `--enable-preview` 编译参数 |
| **High** | 预览特性 | CLAUDE.md §1.1 | `StructuredTaskScope` 在 Java 21 仍为 Preview 特性，需 `--enable-preview` 启动 | 1) 在 `pom.xml` 配置 `maven-compiler-plugin` 添加 `<compilerArgs><arg>--enable-preview</arg></compilerArgs>`；2) 在 `README` 明确运行时参数要求；3) 评估是否可改用 `ExecutorService + CompletableFuture` 临时替代 |
| **Medium** | 空值安全 | CLAUDE.md §1.1 | JSpecify `@NullMarked` 需 IDE + ErrorProne 配合，但未说明 CI 集成方式 | 在 `pom.xml` 配置 `error-prone-maven-plugin` 启用 `NullAway` 检查；在 `.github/workflows/ci.yml` 添加编译时空值检查步骤 |

### 六、与 CLAUDE.md 一致性 (Consistency with CLAUDE.md)

| 严重性 | 类别 | 章节引用 | 问题描述 | 建议 |
|--------|------|----------|----------|------|
| **Medium** | 文档命名 | 0002 文档标题 | 文件名为 `0002-**pg**-mcp-design...` 但内容为 **sqlserver**-mcp，存在命名混淆风险 | 重命名文件为 `0002-sqlserver-mcp-design-by-claude.md`，并在文档头部添加 `适用数据库: Microsoft SQL Server` 明确标识 |
| **Low** | 章节引用 | 0002 §9.3 | 引用"与 CLAUDE.md 一致"但未标注具体章节号，不利于交叉验证 | 补充引用格式：`参见 CLAUDE.md §5.2 测试策略`，便于追踪 |

### 七、风险 (Risks) - 补充评审

| 严重性 | 类别 | 章节引用 | 问题描述 | 建议 |
|--------|------|----------|----------|------|
| **High** | 外部依赖 | §11 风险表 | 未评估 LLM 服务 (DeepSeek) 不可用/限流/响应异常时的降级方案 | 1) 实现 `CircuitBreaker` (Resilience4j) 保护 LLM 调用；2) 配置 `fallbackPrompt` 返回预定义错误提示；3) 监控 `llm.error.rate` 触发告警 |
| **Medium** | 内存安全 | §11 R4 | `maxResultBytes` 未定义具体阈值，大结果集仍可能触发 OOM | 1) 默认 `maxResultBytes=52428800` (50MB)；2) `ResultSetDataCollector` 实现流式累加 + 超限截断；3) 截断时返回 `truncated: true` + 警告信息 |
| **Low** | 并发安全 | §11 R3 | HikariCP `maxPoolSize=10/库` 与虚拟线程并发数匹配策略未量化 | 1) 监控 `hikaricp.pending.connections` 指标；2) 提供配置项 `virtualThread.concurrency.limit` 默认 50；3) 压测报告验证 100 并发下无连接饥饿 |

### 八、依赖版本验证 (Dependency Version Verification)

| 严重性 | 类别 | 章节引用 | 问题描述 | 建议 |
|--------|------|----------|----------|------|
| **Medium** | 版本精确性 | 0002 §10.1 | 依赖版本使用 `0.7.0+` 等模糊范围，可能导致构建不一致或兼容问题 | 1) 在 `pom.xml` `<properties>` 定义精确版本 (如 `<mcp-sdk.version>0.7.0</mcp-sdk.version>`)；2) 使用 `versions-maven-plugin` 定期检查更新；3) 关键依赖 (mssql-jdbc, HikariCP) 标注最小兼容版本 |
| **Medium** | 漏洞管理 | CLAUDE.md §6 安全扫描 | 提及 OWASP Dependency-Check 但未定义阻断阈值 | 在 `dependency-check-maven-plugin` 配置 `<failBuildOnCVSS>7.0</failBuildOnCVSS>` (高危阻断)，中低危仅告警；每周自动执行扫描 |
| **Low** | 传递依赖冲突 | 0002 §10.1 | 未说明如何处理 `jackson-databind` 等常见传递依赖冲突 | 在 `pom.xml` 使用 `<dependencyManagement>` 统一声明关键库版本；添加 `mvn dependency:tree -Dverbose` 到预提交检查脚本 |

---

## 🎯 优先行动项 (按严重性排序)

1. **[Critical]** 修正 "Java 26" 为真实可用版本 (建议 `OpenJDK 21 LTS`)，同步更新所有文档与构建配置
2. **[High]** 补充 L1 正则校验的 Unicode 归一化与零宽字符过滤逻辑，降低绕过风险
3. **[High]** 实现 LLM 调用的 CircuitBreaker 降级策略，保障服务可用性
4. **[Medium]** 重命名设计文档 `0002-pg-mcp-...` → `0002-sqlserver-mcp-...` 消除歧义
5. **[Medium]** 在 `pom.xml` 精确锁定依赖版本，配置 OWASP 扫描阻断阈值

---

## ✅ 设计亮点 (值得保持)

- **四层校验链**：正则→AST→执行计划→语义，纵深防御思路清晰
- **虚拟线程贯穿**：统一使用 `newVirtualThreadPerTaskExecutor()` 简化 IO 并发模型
- **Record + Sealed + Pattern Matching**：充分利用现代 Java 特性提升类型安全与代码简洁性
- **特征开关设计**：实验性功能 (Layer 4) 通过配置动态启停，便于灰度与回滚
- **可观测性三位一体**：日志 (结构化) + 指标 (Micrometer) + 追踪 (OTel) 覆盖完整可观测需求

---

> 📌 **评审结论**: 整体架构设计合理、安全考虑周全、与现代 Java 实践对齐。**关键阻塞项**为 Java 版本标注错误需立即修正，其余问题可在迭代中逐步优化。建议在编码前优先完成 [优先行动项] 中 Critical/High 级别问题的方案细化。