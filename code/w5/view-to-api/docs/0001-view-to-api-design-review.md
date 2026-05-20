# 数据库查询 JSON 接口工具 — 技术设计方案审查报告

**文档**: docs/0001-view-to-api-design.md (v1.4)  
**审查日期**: 2026-05-20  
**审查工具**: Codex Review  
**审查结论**: **有条件通过** — 架构设计扎实，前端视觉设计规范详尽。前次审查问题已全部修复。本次发现 1 个跨文档一致性问题需修复，另有实现可行性方面的建议。

---

## 审查摘要

| 严重级别 | 数量 |
|---------|------|
| [E] Error | 1 |
| [W] Warning | 2 |
| [I] Info | 2 |

---

## [E] Error（必须修复）

### E1. 管理端 API 响应结构未明确定义统一封装

**文件位置**: 第 2.2.2 节（AdminController）与第 5 节（前后端通信）  
**严重性**: [E] Error  
**问题描述**:

第 2.2.2 节中 AdminController 的管理端接口直接返回 `ResponseEntity<PageResult<QueryLog>>` 和 `ResponseEntity<StatsResponse>`，但第 5.2 节中前端 API 封装通过 Axios 拦截器做了 `response => response.data` 解包。设计文档未明确定义管理端接口的统一响应外壳（如 `ApiResponse<T>` 的 status/message/data 三层结构），导致前后端对响应格式的理解不一致。

同时，PRD 第 8.2 节展示的管理端响应中包含了 `status` / `data` / `metadata` 三层封装，但设计方案中的 Controller 签名未体现此封装层次。

**建议修复**:

1. 在第 2.2.2 节中明确管理端接口也使用统一响应包装（如 `ApiResponse<PageResult<QueryLog>>`）。
2. 或新增统一响应拦截说明，确保后端返回格式与 PRD 一致。

---

## [W] Warning（建议修复）

### W1. 设计字体均为非系统字体，缺少加载策略

**文件位置**: 第 4.2 节（字体体系）  
**严重性**: [W] Warning  
**问题描述**:

设计文档使用了 `Plus Jakarta Sans`、`DM Sans`、`JetBrains Mono` 三种字体，这些均非操作系统默认字体。当前文档未说明字体的加载方式（Google Fonts CDN、npm 包引入、或自托管）。

前端实现时若未正确加载字体，将全部回退到 `sans-serif`，整个视觉设计效果将大打折扣。

**建议修复**:

在 4.2 节或 4.3 节中补充字体加载方案：
- 通过 npm 安装：`@fontsource/plus-jakarta-sans`、`@fontsource/dm-sans`、`@fontsource/jetbrains-mono`
- 或在 index.html 中通过 Google Fonts CDN 引入
- 添加字体 preload 和 font-display: swap 策略避免 FOIT

### W2. 暗色主题实现复杂度可能被低估

**文件位置**: 第 4 节（前端设计）  
**严重性**: [W] Warning  
**问题描述**:

设计文档定义了极为详尽的暗色视觉体系（30+ CSS 变量、毛玻璃效果、灯笼式辉光、渐变色装饰线、进场动画等）。这些效果需要通过 Ant Design 5.x 的 ConfigProvider + theme.darkAlgorithm + 大量自定义 CSS 叠加实现。

尤其是毛玻璃（backdrop-filter: blur）、表格行左侧渐变光晕线、统计卡片动画数字等，超出了 Ant Design 内置能力，需要大量手写样式和 DOM 结构调整。

**建议建议**:

1. 在实现计划中为此前端工作分配更充裕的工时。
2. 明确哪些视觉效果是"必须实现"、哪些是"锦上添花"，划分 MVP 边界。
3. 暗色主题建议放在 Ant Design ConfigProvider 全局配置中，配合 CSS Variables 覆盖。

---

## [I] Info（建议考虑）

### I1. 连接池清理任务的 SQL 兼容性

**文件位置**: 第 3.2 节（自动清理策略）  
**严重性**: [I] Info  
**问题描述**:

自动清理 SQL 中使用 `DELETE ... WHERE id IN (SELECT id FROM ... ORDER BY request_time ASC LIMIT ?)`。H2 2.1.x 支持此语法，但如果将来日志存储迁移到 MySQL，MySQL 对 `LIMIT` 在子查询中的支持有限制（MySQL 5.7 以下版本不支持子查询中的 LIMIT）。

**建议**: 在注释中说明该 SQL 针对 H2 语法实现，迁移时需适配。

### I2. 响应体超 10MB 截断策略未定义

**文件位置**: 第 6.2 节（分页实现策略，引用 PRD）  
**严重性**: [I] Info  
**问题描述**:

PRD 和设计文档都提到"响应体超 10MB：返回错误，提示缩小范围"，但未定义具体实现方式（是在写入响应体前检查？还是通过 Spring Boot 的拦截器？）。

**建议**: 补充说明可通过 Spring Boot 的 `spring.servlet.multipart.max-request-size` 或 Filter 拦截响应体长度来实现。

---

## 总体评价

### 前次审查问题追踪（设计 v1.0 -> v1.4）

| 问题 | 严重级别 | 当前状态 |
|------|---------|---------|
| E1. 413 错误码使用不当 | Error | 已修复 — 改为 422 |
| W1. 缺少危险关键字列表 | Warning | 已修复 — 2.4 节补充完整表格 |
| W2. 连接池资源耗尽风险 | Warning | 已修复 — 2.5 节补充资源管控策略 |
| W3. 异步日志拒绝风险 | Warning | 已修复 — 2.6 节改为 CallerRunsPolicy + 5000 队列 |
| W4. 缺乏测试策略 | Warning | 已修复 — 新增第 6 节测试策略 |
| I1. Ant Design 内部类名 | Info | 已修复 — 使用 sticky + scroll.y 方案 |

### 优点

- 架构分层清晰，包结构组织规范，贴近实际开发。
- 前端视觉设计非常详尽（色板、字体、间距、动效全覆盖）。
- 测试策略覆盖了单元测试、集成测试、安全测试和性能测试。
- 前后端一体化方案降低了部署复杂度。

### 主要改进方向

1. **管理端 API 响应结构**需统一封装定义，与 PRD 保持一致。
2. **字体加载策略**需补充，否则视觉设计无法落地。
3. **暗色主题实现复杂度**需在计划中体现。

---
## 修订历史

| 版本 | 日期 | 修订内容 | 作者 |
|------|------|---------|------|
| v1.0 | 2026-05-20 | 初版审查报告（设计 v1.0） | AI |
| v2.0 | 2026-05-20 | 更新至设计 v1.4 审查：前次问题已全部修复；新增管理端 API 响应结构统一问题；字体加载策略建议；暗色主题复杂度评估 | AI |
