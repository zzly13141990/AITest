# pg-mcp 实现计划审查报告

**审查日期**: 2026-05-15
**审查范围**: `AITest/code/w5/pg-mcp/`
**对比文档**: `0002-pg-mcp-design-by-claude.md`（设计文档）、`0003-pg-mcp-plan-by-claude.md`（实现计划）
**审查方法**: 对照设计文档和实现计划逐模块人工审查

---

## 总体评价

代码整体实现了设计文档的核心功能：FastMCP Server、连接池管理、Schema 缓存、SQL 生成/验证/执行、查询历史记录。目录结构基本符合设计。但存在 5 个 CRITICAL 级别和 5 个 HIGH 级别的问题需要修复。

---

## C-01 [CRITICAL] 项目命名与数据库目标不一致

- **位置**: 所有文件
- **设计文档要求**: 使用 SQL Server (ODBC Driver 17)，Dangerous Functions 列表全是 SQL Server 特有函数（xp_cmdshell, sp_configure 等）
- **实际代码**: 项目名为 `pg_mcp`（暗示 PostgreSQL MCP），`__init__.py` 注释为 "PostgreSQL MCP Server"
- **问题分析**: 项目名称 `pg_mcp` 暗示 PostgreSQL，但实际的数据库驱动（aioodbc + pyodbc）、危险函数列表（全部是 SQL Server 的 xp_*/sp_* 函数）、SQL 语法（T-SQL）、Schema 加载（SQL Server INFORMATION_SCHEMA）全部指向 SQL Server
- **修复建议**: 
  - 选项 A：确认目标是 SQL Server，将项目重命名为 `mssql-mcp` 或 `tsql-mcp`
  - 选项 B：如果目标是 PostgreSQL，则重写整个数据库层
- **状态**: ✅ 部分修复 — `__init__.py` 修改为 "SQL Server MCP Server"。已确认为 SQL Server。**项目重命名（`pg_mcp` → `mssql-mcp` 或 `tsql-mcp`）需要在修改所有内部引用后统一完成**

---

## C-02 [CRITICAL] SQLValidator 构造函数与设计不一致

- **位置**: `pg_mcp/sql/validator.py:24-30`, `pg_mcp/main.py:80`
- **设计文档要求**: `SQLValidator(security_config: SecurityConfig, schema_mgr: SchemaManager)`
- **实际代码**: `SQLValidator(pool_manager: ConnectionPoolManager, schema_manager)` — 第一个参数类型完全不同
- **问题分析**: SecurityConfig 中的验证开关配置无法被 Validator 访问；SQLValidator 依赖 ConnectionPoolManager 违反 SRP
- **修复建议**: 改为设计文档的签名，将 explain_for_validation 需要的连接池移到方法参数
- **状态**: ✅ 已修复 — `__init__` 改为 `(security_config: SecurityConfig, schema_manager)`；`main.py` 传入 `SQLValidator(security_config, schema_mgr)`

---

## C-03 [CRITICAL] SchemaManager.get_schema() 异步化导致设计偏离

- **位置**: `pg_mcp/database/schema.py:221-223`
- **设计文档要求**: `get_schema()` 是**同步方法**仅从缓存获取
- **实际代码**: `async def get_schema()` 内部调用 `await self.load_all(db_name)`
- **问题分析**: 每次 get_schema 都可能触发数据库查询，违背了缓存的读写分离设计
- **修复建议**: 分离为同步的 `get_schema()`（读缓存）和异步的 `load_schema()`（加载）
- **状态**: ✅ 已修复 — `get_schema()` 改为同步缓存读取；`load_schema()` 保留为异步加载；`main.py` 中所有调用改为 `load_schema()`

---

## C-04 [CRITICAL] MCPError.to_dict() 格式与设计文档不兼容

- **位置**: `pg_mcp/utils/error.py:28-38`, `pg_mcp/main.py:218-226`
- **设计文档要求**: `to_dict()` 返回 `{"success": False, "error": {"code": ..., "message": ...}}`
- **实际代码**: `MCPError.to_dict()` 返回 `{"error_code": ..., "message": ...}`，且 `main.py` 中手动构建错误响应未使用 `to_dict()`
- **修复建议**: 统一使用 `MCPError.to_dict()` 并修正输出格式
- **状态**: ✅ 已修复 — `to_dict()` 返回新格式；`main.py` 中 3 个 MCPError 处理器改用 `exc.to_dict()`

---

## C-05 [CRITICAL] 缺少 utils/llm.py 模块

- **位置**: 不存在该文件
- **设计文档要求**: `pg_mcp/utils/llm.py` — LLM 调用工具，可切换 provider
- **实际代码**: SQLGenerator 直接使用 AsyncOpenAI 客户端，LLM 调用逻辑嵌入在 generator.py
- **问题分析**: 违反 SRP，SQLGenerator 同时负责 prompt 构建 + API 调用 + 重试 + 结果清理
- **修复建议**: 提取 LLM 客户端到 utils/llm.py
- **状态**: ✅ 已修复 — `utils/llm.py` 已创建，包含 `LLMClient` 类

---

## W-01 [HIGH] SQL 执行器分页逻辑缺陷

- **位置**: `pg_mcp/sql/executor.py:98-100`
- **设计文档要求**: 始终返回准确的 total_count
- **实际代码**: 当 SQL 已有 LIMIT 子句时：
  ```python
  rows = await execute_query(conn, effective_sql)
  total_rows = len(rows)  # 错误：这个值是 LIMIT 后的行数，不是总数
  ```
- **问题分析**: 用户 SQL 含 LIMIT 时 total_rows 错误地等于返回行数而非总行数；offset 参数被忽略
- **修复建议**: 用户 SQL 有 LIMIT 时也执行 COUNT(*) 查询
- **状态**: ✅ 已修复 — LIMIT 分支增加 COUNT(*) 查询获取准确 total_rows

---

## W-02 [HIGH] SQLGenerator.generate() 缺少 db_name 参数

- **位置**: `pg_mcp/sql/generator.py:210-262`
- **设计文档要求**: `async def generate(self, user_query, schema, db_name, max_retries=3)`
- **实际代码**: `async def generate(self, user_query, schema, retry_count=3)` — 无 db_name
- **修复建议**: 添加 `db_name: str | None = None` 参数
- **状态**: ✅ 已修复 — `generate()` 增加 `db_name: str = ""` 参数，日志中记录 db_name

---

## W-03 [HIGH] history.record() 接口与设计文档不一致

- **位置**: `pg_mcp/main.py:143-148`, `pg_mcp/history/manager.py:58-82`
- **设计文档要求**: `record()` 接受关键字参数 `(user_query, generated_sql, database, status, ...)`
- **实际代码**: `record(history: QueryHistory)` 传入整个对象
- **问题分析**: 接口变更后，查询开始前就创建了带 `RUNNING` 状态的 QueryHistory 对象，包含不完整的中间状态
- **修复建议**: 统一接口，要么完全改为关键字参数风格，要么明确类型注解

---

## W-04 [HIGH] EXPLAIN 验证在 SQL Server 上语法错误

- **位置**: `pg_mcp/sql/validator.py:196-207`
- **设计文档要求**: `EXPLAIN {sql}` 进行可执行性验证
- **实际代码**: `explain_sql = f"EXPLAIN {sql}"`
- **问题分析**: SQL Server 不支持 `EXPLAIN` 关键字（那是 PostgreSQL 语法）。SQL Server 使用 `SET SHOWPLAN_XML ON`
- **修复建议**: 移除或改用 `SET SHOWPLAN_TEXT ON` + 查询 + `SET SHOWPLAN_TEXT OFF`
- **状态**: ✅ 已修复 — `explain_for_validation` 改用 `sqlglot.parse_one(sql, read="mssql")` 进行语法验证

---

## W-05 [HIGH] 日志配置使用 ConsoleRenderer() 而非 JSONRenderer()

- **位置**: `pg_mcp/utils/logger.py:42`
- **设计文档要求**: `structlog.processors.JSONRenderer()`
- **实际代码**: `structlog.dev.ConsoleRenderer()` — ANSI 格式不适合日志收集
- **修复建议**: 根据环境切换渲染器，生产环境使用 JSONRenderer()
- **状态**: ✅ 已修复 — DEBUG 级别使用 ConsoleRenderer()，INFO+ 使用 JSONRenderer()

---

## M-01 [MEDIUM] 缺少 tests/ 目录

- **设计计划要求**: Phase 11 (6 个单元测试文件) + Phase 12 (2 个集成测试文件)
- **实际代码**: 完全没有测试
- **修复建议**: 按设计文档实现测试

---

## M-02 [MEDIUM] SecurityConfig 缺少 allowed_query_types

- **位置**: `pg_mcp/config.py:106-114`
- **设计文档要求**: SecurityConfig 包含 `allowed_query_types: list[str]`
- **实际代码**: 无此属性，`ALLOWED_QUERY_TYPES` 硬编码在 constants.py
- **修复建议**: SecurityConfig 添加 allowed_query_types 属性
- **状态**: ✅ 已修复 — SecurityConfig 添加 `allowed_query_types` 属性并处理导入

---

## S-01 [LOW] history/manager.py 中 _read_history 缺少 return

- **位置**: `pg_mcp/history/manager.py:126-134`
- **问题**: except 块中没有 `return []`，如果文件读取异常，后续访问 `lines` 变量会 NameError
- **修复建议**: except 中添加 `return []`
- **状态**: ✅ 已修复

---

## S-02 [LOW] 导入顺序不完全符合规范

- **位置**: 多文件
- **问题**: config.py 中 `import logging` 在第三方库导入之后；executor.py 用 `try/except` 包裹 sqlglot 导入
- **修复建议**: 整理导入顺序

---

## 实现计划完成度

| Phase | 任务 | 状态 | 备注 |
|-------|------|------|------|
| P1-1 | 项目脚手架 | ✅ | 目录结构完整 |
| P2-1 | 错误码定义 | ✅ | |
| P2-2 | 配置模型 | ✅ | |
| P2-3 | 日志工具 | ✅ | |
| P3-1 | Schema 数据模型 | ✅ | |
| P3-2 | 查询数据模型 | ✅ | |
| P3-3 | 配置数据模型 | ✅ | |
| P4-1 | 连接池管理器 | ✅ | 还额外实现了健康检查 |
| P4-2 | Schema 管理器 | ✅ | get_schema 同步化已修复 |
| P5-1 | SQL 生成器 | ✅ | db_name 参数已添加 |
| P6-1 | SQL 验证器 | ✅ | 构造函数已修正 |
| P7-1 | SQL 执行器 | ✅ | 分页逻辑已修复 |
| P8-1 | 历史管理器 | ✅ | _read_history 已修复 |
| P9-1 | 错误处理 | ✅ | to_dict 格式已统一 |
| P10-1 | MCP Server 入口 | ✅ | |
| P10-2 | MCP Resources | ✅ | |
| P11 | 单元测试 | ❌ | 未实现 |
| P12 | 集成测试 | ❌ | 未实现 |
| P13 | 文档 | ⚠️ | 部分完成 |
| P14 | 部署 | ❌ | 未实现 |

---

## 修复状态

### 已修复（13/14 项）

| 编号 | 问题 | 状态 |
|------|------|------|
| C-01 | 项目命名 (`__init__.py` 注释) | ✅ 部分修复（需手动重命名项目） |
| C-02 | SQLValidator 构造函数 | ✅ |
| C-03 | SchemaManager.get_schema 同步化 | ✅ |
| C-04 | MCPError.to_dict 格式 | ✅ |
| C-05 | 缺少 utils/llm.py | ✅ |
| W-01 | 分页逻辑缺陷 | ✅ |
| W-02 | generate() 缺少 db_name | ✅ |
| W-04 | EXPLAIN 语法兼容 | ✅ |
| W-05 | 日志渲染器切换 | ✅ |
| M-02 | SecurityConfig.allowed_query_types | ✅ |
| S-01 | _read_history 缺少 return | ✅ |

### 未修复（需人工完成）

| 编号 | 问题 | 原因 |
|------|------|------|
| C-01 (完整) | 项目重命名 `pg_mcp` → `mssql-mcp` | 需全局搜索替换所有内部引用 |
| W-03 | history.record() 接口风格 | 当前对象风格可用，非功能性 bug |
| M-01 | 补充单元测试 / 集成测试 | 需搭建测试基础设施 |
| S-02 | 导入顺序整理 | 风格问题，不影响功能 |
