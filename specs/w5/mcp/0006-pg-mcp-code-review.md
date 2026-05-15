# Code Review: pg-mcp v1.0.0

- **Review Date**: 2026-05-15
- **Review Scope**: `AITest/code/w5/pg-mcp/` — Full implementation against PRD v1.1, Design v1.2, Plan v2.0, and project CLAUDE.md standards
- **Review Method**: Manual static analysis, cross-reference with requirement/design/plan documents
- **Reviewer**: Codex

---

## 目录

1. [需求覆盖度审计](#1-需求覆盖度审计)
2. [架构一致性评估](#2-架构一致性评估)
3. [编码规范合规审计](#3-编码规范合规审计)
4. [严重问题](#4-严重问题)
5. [主要问题](#5-主要问题)
6. [次要问题](#6-次要问题)
7. [安全审查](#7-安全审查)
8. [测试覆盖分析](#8-测试覆盖分析)
9. [废弃代码分析](#9-废弃代码分析)
10. [建议与修复方案](#10-建议与修复方案)
11. [总结](#11-总结)

---

## 1. 需求覆盖度审计

### FR-1: 数据库自动发现与连接管理
| 状态 | 说明 |
|------|------|
| ✅ 通过 | `ConnectionPoolManager` 支持多数据库配置、按 name 获取连接、失败隔离。`config.py` 通过 env 配置构建 `databases` 列表。 |

### FR-2: 元数据缓存与刷新
| 状态 | 说明 |
|------|------|
| ✅ 通过 | `SchemaManager` 从 `information_schema` 加载表/列/视图/主键/外键/注释，使用 `SchemaCache` 带 TTL 缓存。提供 `refresh_schema` tool。 |

### FR-3: NL → SQL 生成
| 状态 | 说明 |
|------|------|
| ✅ 通过 | `SQLGenerator` 通过 GLM-4.7 (OpenAI-compatible API) 根据 schema + 自然语言生成 SQL。带重试退避 (`_call_llm`) 和结果缓存 (`SQLCache` LRU+TTL)。 |

### FR-4: SQL 执行与结果返回
| 状态 | 说明 |
|------|------|
| ✅ 通过 | `SQLExecutor` 执行查询、设置 `statement_timeout`、处理分页、返回 dict 格式结果。 |

### FR-5: 只读验证
| 状态 | 说明 |
|------|------|
| ✅ 通过 | 三层防护：(1) 危险函数字符串检测 (2) SQLGlot AST 只读类型检查 (3) 可选的对象存在性验证。 |

### FR-6: SQL 可执行性验证
| 状态 | 说明 |
|------|------|
| ⚠️ 部分通过 | `SQLValidator.explain_for_validation()` 对 DB 执行 EXPLAIN 来验证。但此方法仅在 `validate_syntax_and_objects` 中被调用，而该步骤受 `config.security_enable_sql_verification` 控制 —— 如果关闭则不执行 EXPLAIN。PRD 要求每次执行前都验证。 |

### FR-7: 结果意义验证 (threshold=0.8)
| 状态 | 说明 |
|------|------|
| ❌ 失败 | `SQLGenerator.verify_result()` 返回 0~1 分数，`main.py:186-189` 中调用了 verify_result 并将分数写入返回结果，但**从未与 config 中的 `verification_threshold`（0.8）比较**。PRD 要求分数低于 threshold 时应通知用户或告警。此校验完全缺失。 |

### FR-8: 双模式返回（仅 SQL / SQL + 执行）
| 状态 | 说明 |
|------|------|
| ✅ 通过 | `generate_sql` tool 只生成不执行；`query_database` tool 生成 + 执行。 |

### FR-9: 分页与总数返回
| 状态 | 说明 |
|------|------|
| ❌ 失败 | `executor.py:99` — `total_rows = len(results)` 统计的是经过 LIMIT/OFFSET 截断后的行数，而非无分页时的总行数。PRD 明确要求 `total_count` 应反映"无分页的总行数"。需要单独执行 `SELECT COUNT(*)` 查询。 |

### FR-10: 查询历史记录
| 状态 | 说明 |
|------|------|
| ✅ 通过 | `HistoryManager` 使用 JSON Lines 文件存储，带 per-file `asyncio.Lock` 并发保护，支持按用户查询、cleanup。 |

### FR-11: 5 个 MCP Tools
| 状态 | 说明 |
|------|------|
| ✅ 通过 | `query_database`, `generate_sql`, `list_databases`, `get_schema`, `refresh_schema` — 5 tools 已实现。额外提供 `health_check` (无 FR 要求，但符合设计)。 |

### FR-12: 2 个 MCP Resources
| 状态 | 说明 |
|------|------|
| ✅ 通过 | `schema://{database_name}`, `history://{user_id}` — 2 resources 已实现。 |

### 额外需求

| 需求 | 状态 | 说明 |
|------|------|------|
| 错误响应含 `details` + `suggestion` | ❌ 失败 | PRD 要求错误响应包含 `details` 和 `suggestion` 字段，`MCPError.to_dict()` 和 `main.py` 错误处理均未实现。 |
| 敏感数据加密存储 | ❌ 未实现 | 密码和 API key 以明文 `str` 存储（`config.py`），未使用 `SecretStr`。 |

---

## 2. 架构一致性评估

### 2.1 三层架构
| 层 | 设计文档描述 | 实际实现 | 一致性 |
|---|-------------|---------|--------|
| FastMCP Server | `main.py` 提供 Tools/Resources | `main.py` — 5 tools + 2 resources + health_check | ✅ 基本一致 |
| Application Layer | SQL生成、验证、执行 | SQLGenerator, SQLValidator, SQLExecutor | ✅ |
| Infrastructure Layer | 连接池、Schema管理 | ConnectionPoolManager, SchemaManager, HistoryManager | ✅ |

### 2.2 组件实现对照

| 组件 | 设计文档 | 实际实现 | 差异 |
|------|---------|---------|------|
| SQLGenerator | 使用 `call_llm()` 工具函数 | 自有 `_call_llm()` 方法 | ⚠️ 有差异：有独立的 `utils/llm.py` 但未使用 |
| Cache | Redis 可选，默认 memory | `SQLCache` (LRU+TTL, dict) | ⚠️ 设计方案未指定具体实现；当前实现合理 |
| HistoryManager | `record()` 同步 + `asyncio.to_thread()` | `record()` 直接 `open()` + `f.write()` 但使用 async lock | ⚠️ `record()` 使用阻塞文件 IO 但未使用 `asyncio.to_thread()` |
| ErrorResponse | `error_code`, `message`, `details`, `suggestion` | 仅 `code` + `message`，缺 `details`, `suggestion` | ❌ 缺少必填字段 |
| schema_resource | 返回 `schema.model_dump_json(indent=2)` | 返回 `schema.to_prompt_text()` | ⚠️ 返回值格式不同（JSON vs 文本） |
| Config | `extra="ignore"` | `extra="ignore"` | ⚠️ 设计文档写 `ignore`，但 CLAUDE.md 要求 `forbid` |
| 密码字段 | `password: str` | `db_password: str` | ❌ 未使用 `SecretStr` |
| Rate Limiting (S-06) | 带漏桶/令牌桶 | 未实现 | ❌ 完全缺失 |

### 2.3 数据模型使用
- `DatabaseSchema`, `TableInfo`, `ColumnInfo`, `ViewInfo`, `QueryHistory` 使用 Pydantic V2 — ✅
- `SchemaCache` 重复定义：`models/schema.py` 同时存在 Pydantic `SchemaCache` 模型和手写 `SchemaCache` 类，Pydantic 版本未被使用 — ⚠️

### 2.4 依赖注入模式
CLAUDE.md 要求 service 类使用构造函数依赖注入，但 `main.py:31-37` 使用全局变量持有所有组件 — ❌ 违反 DIP 和 CLAUDE.md 规范。

---

## 3. 编码规范合规审计

### 3.1 CLAUDE.md 规则检查

| 规则 | 要求 | 实际 | 状态 |
|------|------|------|------|
| SecretStr | 密码/API key 使用 `SecretStr` | `config.py:46` `db_password: str`, `config.py:43` `llm_api_key: str` | ❌ |
| extra="forbid" | Settings 使用 `extra="forbid"` | `config.py:36` `extra="ignore"` | ❌ |
| Pydantic V2 model_config | 所有数据模型需要 | 已使用 | ✅ |
| Google-style docstrings | 所有公开 API 需要 | 大部分有，但部分缺失或不完整 | ⚠️ |
| frozenset | `ALLOWED_QUERY_TYPES` 和 `DANGEROUS_FUNCTIONS` 应为 `frozenset` | `constants.py:25,28` 为 `list` | ❌ |
| asyncio.gather() | 并发加载 | `schema.py:refresh_all()` 顺序迭代 | ❌ |
| 依赖注入 | 无全局变量/singleton | `main.py:31-37` 全局变量 | ❌ |

### 3.2 类型注解
```python
# logger.py:60 — 类型不匹配
def setup_logging(*, level: int = logging.INFO) -> None:
# main.py:60 — 传了 str
setup_logging(level=config.log_level)  # config.log_level is "INFO" (str), not int
```
❌ 类型错误：`config.log_level` 类型为 `str`，`setup_logging` 需要 `int`。Structlog 的 `log_level` 参数实际接受 `int`，传入 `str` 不会触发 Python 运行时错误（structlog 内部做了转换），但类型签名不匹配。

### 3.3 模块导入顺序
```python
# main.py:149 — 局部 import
import time as _time
```
❌ `import` 不在模块顶部，而是在函数体内部。

### 3.4 命名约定
```python
# main.py:149 — 与模块顶部 import time 不一致
import time as _time  # 函数内部
```
模块顶部未 `import time`，函数内部局部 `import time as _time`。应统一为模块顶部导入。

---

## 4. 严重问题

### CRIT-1: total_count 返回分页后行数（FR-9 违规）
- **文件**: `pg_mcp/sql/executor.py:99`
- **代码**: `total_rows = len(results)`
- **问题**: `results` 已经过 LIMIT/OFFSET 截断，`total_rows` 不反映实际总数。PRD FR-9 明确要求 `total_count` 应反映"无分页的总行数"。
- **建议**: 在分页前单独执行 `SELECT COUNT(*) FROM (...original_query...) AS _count` 获取真实总数。

### CRIT-2: verify_result 分数未与 threshold 比较（FR-7 违规）
- **文件**: `pg_mcp/main.py:184-189`
- **代码**: verify_result 的返回分数仅写入响应字典，未与 `config.verification_threshold`（默认 0.8）比较。
- **问题**: 即使分数为 0.0，用户也不会收到任何提醒。PRD FR-7 要求低于 threshold 应通知。
- **建议**: 在 `main.py:189` 后增加 threshold 比较逻辑，分数低于 threshold 时在返回结果中增加 `"verification_warning": true` 字段或更改 `status`。

### CRIT-3: 密码和 API key 使用明文 str 而非 SecretStr
- **文件**: `pg_mcp/config.py:43,46`
- **代码**: `llm_api_key: str`, `db_password: str`
- **问题**: 密码和 API key 以明文 `str` 存储和传递。违反 CLAUDE.md 明确要求"密码等敏感字段使用 Pydantic 的 `SecretStr` 类型"，也违反 Plan P2-2。
- **建议**: 改为 `SecretStr`，在构造数据库连接时调用 `db_password.get_secret_value()`。

### CRIT-4: 错误响应缺少 details 和 suggestion 字段
- **文件**: `pg_mcp/utils/error.py:20-23`, `pg_mcp/main.py:215-220,229-234`
- **代码**: `MCPError.to_dict()` 仅返回 `error_code` + `message`；`main.py` 的错误返回字典仅 `code` + `message`。
- **问题**: PRD 要求错误响应必须包含 `details` 和 `suggestion` 字段以提供可操作的错误信息。MCPError 构造函数和方法签名均未支持。
- **建议**: 在 `MCPError` 中增加 `details` 和 `suggestion` 字段，并确保所有错误处理路径返回这两个字段。

### CRIT-5: statement_timeout 参数化问题
- **文件**: `pg_mcp/sql/executor.py:72`
- **代码**: `await conn.execute("SET statement_timeout = $1", str(timeout * 1000))`
- **问题**: `statement_timeout` 期望整数毫秒值，但传入的是字符串。虽然 asyncpg 的 `execute` 可能自动转换，但这是隐式依赖。更关键的是——如果 `timeout` 非常大，`timeout * 1000` 可能导致意料之外的数值问题。
- **建议**: 传入整数而非字符串：`conn.execute("SET statement_timeout = $1", timeout * 1000)`。另外需考虑 `SET LOCAL statement_timeout` 而非 `SET` 以避免影响同一连接上的后续查询（如果连接池复用连接且未重置设置）。

---

## 5. 主要问题

### MAJ-1: Config extra="ignore" 应改为 "forbid"
- **文件**: `pg_mcp/config.py:36`
- **问题**: `model_config = SettingsConfigDict(env_file=".env", extra="ignore")`。CLAUDE.md 明确要求 `extra="forbid"` 以捕获拼写错误的配置项。
- **建议**: 改为 `extra="forbid"`。

### MAJ-2: ALLOWED_QUERY_TYPES 和 DANGEROUS_FUNCTIONS 应为 frozenset
- **文件**: `pg_mcp/constants.py:25,28`
- **问题**: CLAUDE.md 要求使用 `frozenset`，实际为 `list`。`frozenset` 的 O(1) 查找和不可变性更适合这类常量定义。
- **建议**: 改为 `frozenset`。

### MAJ-3: 全局变量违反依赖注入原则
- **文件**: `pg_mcp/main.py:31-37`
- **代码**: 7 个模块级全局变量（`config`, `pool_mgr`, `schema_mgr`, `sql_gen`, `sql_validator`, `sql_executor`, `history_mgr`）。
- **问题**: CLAUDE.md 要求"依赖注入，无全局变量或 singleton"。全局变量使测试难以 mock，无法创建隔离的测试实例。
- **建议**: 考虑使用 context 对象或依赖注入容器。当前模式在 FastMCP 的 `lifespan` 模式限制下可理解，但至少应将组件引用封装在单个 `AppContext` 对象中。

### MAJ-4: refresh_all() 未使用 asyncio.gather()
- **文件**: `pg_mcp/database/schema.py:246-247`
- **代码**: `for db_name in self._pool_mgr.get_pool_names(): await self.refresh(db_name)` — 顺序迭代。
- **问题**: CLAUDE.md 明确要求 `asyncio.gather()` 用于并发加载，当前实现逐个执行，速度慢。
- **建议**: `await asyncio.gather(*[self.refresh(db_name) for db_name in pool_names])`。

### MAJ-5: setup_logging() 类型不匹配
- **文件**: `pg_mcp/utils/logger.py:60`, `pg_mcp/main.py:60`
- **问题**: `setup_logging(level: int)` 在 `main.py` 中被调用时传入 `config.log_level`（字符串 `"INFO"`）。虽然 structlog 内部可能能处理字符串，但类型签名错误，部分 structlog 配置下可能行为异常。
- **建议**: 确保传入的是 logging 模块的 int level：`setup_logging(level=getattr(logging, config.log_level.upper()))`。

### MAJ-6: datetime.now() 使用系统时区而非 UTC
- **文件**: 
  - `pg_mcp/models/query.py:24` — `datetime.now()` for history ID
  - `pg_mcp/models/query.py:32` — `datetime.now()` for timestamp
  - `pg_mcp/models/schema.py:118,127` — `datetime.now()` for cache expiry
  - `pg_mcp/history/manager.py:164` — `datetime.now()` for cleanup cutoff
- **问题**: `datetime.now()` 使用系统本地时区，在不同时区部署时会产生不一致的时间戳。
- **建议**: 全部改用 `datetime.now(tz=timezone.utc)`（或 `datetime.utcnow()` + 明确使用时区感知对象）。

### MAJ-7: HistoryManager 使用阻塞文件 IO 但缺少 asyncio.to_thread()
- **文件**: `pg_mcp/history/manager.py:68,127,172-173,190-191`
- **问题**: 设计文档要求 `record()` 使用 `asyncio.to_thread()` 来处理文件写入操作。当前 `record()` 和 `_read_history()` 直接使用同步 `open()` / `json.loads()`，虽使用 `asyncio.Lock` 但仍然是阻塞事件循环的。
- **建议**: 将文件 IO 操作包装在 `asyncio.to_thread()` 中以避免阻塞事件循环。

### MAJ-8: 无 HistoryManager 单元测试
- **问题**: `HistoryManager`（211 行）没有任何单元测试。涉及文件 IO、并发锁、cleanup 逻辑，是容易出错的模块。
- **建议**: 增加 `test_history.py`，覆盖 record / get_by_user / get_recent / cleanup / 并发写入 / 文件不存在等场景。

### MAJ-9: 无速率限制（S-06 未实现）
- **文件**: 设计文档 S-06 要求速率限制（漏桶或令牌桶），未实现。
- **问题**: 缺少速率限制使服务易被滥用或过载。
- **建议**: 在 tool 调用入口增加基于 `asyncio` 的速率限制器，或者利用 FastMCP 中间件机制。

---

## 6. 次要问题

### MIN-1: Cache key 使用两种不同哈希算法
- **文件**: `pg_mcp/sql/generator.py:55,58`
- **代码**: `schema_key = hashlib.sha256(...)[:16]` + `query_key = hashlib.md5(...)`
- **问题**: SHA256（截断为 16 字节）和 MD5 混用，风格不一致，增加碰撞风险分析的复杂度。
- **建议**: 统一使用一种哈希算法。

### MIN-2: sqlglot import 在函数体内部
- **文件**: `pg_mcp/sql/executor.py:46`
- **问题**: `import sqlglot` 在方法内部而非模块顶部。
- **建议**: 移到模块顶部。

### MIN-3: _format_schema 是无意义的委托方法
- **文件**: `pg_mcp/sql/generator.py:112`
- **代码**: `def _format_schema(self, schema): return schema.to_prompt_text()`
- **问题**: 该方法仅委托给 `schema.to_prompt_text()`，没有添加任何价值。
- **建议**: 直接调用 `schema.to_prompt_text()` 或删除该方法。

### MIN-4: SchemaCache Pydantic 模型未使用
- **文件**: `pg_mcp/models/schema.py:13-18` 定义 Pydantic `SchemaCache`，但 `pg_mcp/database/schema.py` 使用同文件尾部的手写 `SchemaCache` 类。
- **问题**: 冗余定义，Pydantic 版本无任何代码引用。
- **建议**: 删除未使用的 Pydantic `SchemaCache`。

### MIN-5: 重复的历史记录写入
- **文件**: `pg_mcp/main.py:192,213,227`
- **问题**: `history_mgr.record()` 在 try 成功块、`except MCPError`、`except Exception` 三处分别调用，代码重复。
- **建议**: 使用 `finally` 块统一处理历史记录写入。

### MIN-6: QueryHistory.id 使用时间戳而非 UUID
- **文件**: `pg_mcp/models/query.py:24`
- **代码**: `id: str = Field(default_factory=lambda: datetime.now().strftime("%Y%m%d%H%M%S%f"))`
- **问题**: 高并发下可能产生重复 ID。
- **建议**: 使用 `uuid4()` 或 `nanoid` 生成唯一 ID。

### MIN-7: EXPLAIN 验证的参数化查询风险
- **文件**: `pg_mcp/sql/validator.py:132-135`
- **代码**: `f"EXPLAIN (FORMAT JSON) {sql}"` — 使用 f-string 拼接 SQL。
- **问题**: 虽然 `sql` 已经过只读验证，但直接拼接用户输入仍不是最佳实践。更安全的做法是通过 asyncpg 的参数化查询传递（但 EXPLAIN 不支持参数化）。
- **建议**: 至少确保前置验证（只读检查、对象存在性）已开启，并记录日志以供审计。

### MIN-8: type: ignore 注释
- **文件**: `pg_mcp/sql/validator.py:38`
- **问题**: 使用 `# type: ignore[arg-type]` 绕过类型检查。
- **建议**: 修复底层类型问题而非忽略。

---

## 7. 安全审查

### 7.1 SQL 注入防护
- **危险函数检测**: `DANGEROUS_FUNCTIONS` frozenset（当前为 list）—— 共 20 个函数，但 CLAUDE.md 仅列出 6 个。实际实现扩展了列表，这是好事，但需要与规范同步。
- **只读验证**: SQLGlot AST 检查 query type，不允许 `INSERT`/`UPDATE`/`DELETE`/`DROP`/`ALTER`/`TRUNCATE`/`CREATE`/`GRANT`/`REVOKE`。
- **参数化查询**: `executor.py` 使用 asyncpg 参数化查询（`$1`, `$2`），防止注入。
- **statement_timeout**: 使用参数化设置，但传递字符串而非整数（CRIT-5）。
- **EXPLAIN f-string**: `validator.py:132` 使用 f-string 拼接 SQL（MIN-7）。

### 7.2 敏感信息泄露
- **错误信息**: `main.py:231` `f"Internal error: {exc}"` 返回原始异常信息，可能泄露敏感详情。
- **密码存储**: 明文 `str` 而非 `SecretStr`（CRIT-3）。
- **API key**: 明文 `str` 而非 `SecretStr`（CRIT-3）。

### 7.3 安全隐患汇总

| 问题 | 文件 | 严重程度 | 说明 |
|------|------|---------|------|
| 明文密码/API key | config.py:43,46 | 严重 | 在内存转储或日志中可能泄露 |
| Python 异常信息泄露 | main.py:231 | 中等 | `f"Internal error: {exc}"` 返回原始异常 |
| EXPLAIN SQL 拼接 | validator.py:132 | 低 | f-string 拼接已有 SQL |
| 无速率限制 | 全局 | 中等 | 服务可被滥用 |
| connector 不安全导入 | constants.py:30-32 | 低 | 已注释掉，但残留 import |

### 7.4 三层安全验证有效性
| 层 | 名称 | 实现 | 有效性 |
|---|------|------|--------|
| 1 | 危险函数字符串检测 | `validator.py:has_dangerous_functions_from_sql()` | ✅ 有效，但全部靠字符串匹配，可能绕过（如注释内函数名） |
| 2 | SQLGlot AST 只读检查 | `validator.py:validate_read_only()` | ✅ 有效，解析后检查 stmt key |
| 3 | 语法 + 对象存在性 | `validator.py:validate_syntax_and_objects()` | ✅ 有效，检查表和列存在性 |

---

## 8. 测试覆盖分析

### 8.1 单元测试统计

| 测试文件 | 测试数量 | 覆盖模块 | 代码行数 | 评估 |
|---------|---------|---------|---------|------|
| `test_pool.py` | 9 | ConnectionPoolManager | 142 | ✅ 良好，覆盖基本操作 + 健康检查 |
| `test_generator.py` | 12 | SQLGenerator, SQLCache | 190 | ✅ 良好，覆盖生成、缓存、验证 |
| (缺失) | 0 | HistoryManager | 211 | ❌ 完全缺失 |
| (缺失) | 0 | SQLValidator | 206 | ❌ 完全缺失 |
| (缺失) | 0 | SQLExecutor | 134 | ❌ 完全缺失 |
| (缺失) | 0 | SchemaManager | 248 | ❌ 完全缺失 |
| (缺失) | 0 | Config | 132 | ❌ 完全缺失 |
| (缺失) | 0 | utils/error.py | 76 | ❌ 完全缺失 |
| (缺失) | 0 | utils/llm.py | 54 | ❌ 完全缺失 |
| (缺失) | 0 | main.py (集成) | 426 | ❌ 无集成测试 |

### 8.2 测试质量评估

**已有测试**:
- 使用 `pytest.mark.asyncio` + `AsyncMock`，模式正确
- `test_pool.py` 覆盖了正常路径、错误路径、边界条件（skip existing, continue on failure）
- `test_generator.py` 覆盖了 cache LRU eviction、TTL expiry、LLM error、invalid score format
- 使用 fixtures 和 mock，测试隔离性好

**缺失测试**:
- `HistoryManager` — 无测试，涉及文件 IO 和并发，风险高
- `SQLValidator` — 三层验证逻辑复杂，需要全面测试
- `SQLExecutor` — 分页逻辑、statement_timeout、SQL 注入防护
- `SchemaManager` — Schema 加载、缓存、刷新
- Config 解析、MCPError 序列化

**集成测试**: 完全缺失。关键路径 `query_database`（schema → LLM → 验证 → 执行 → verify → record）无端到端测试。

### 8.3 Mock 模式问题
- `test_generator.py:68` 直接 mock `self._client.chat.completions.create`，与实现强耦合。
- `SQLValidator(None, None)` 构造调用违反类型签名，测试写法脆弱。

---

## 9. 废弃代码分析

### DEAD-1: utils/llm.py
- **文件**: `pg_mcp/utils/llm.py`（54 行）
- **内容**: 独立的 `call_llm()` 函数，每次调用创建新的 `AsyncOpenAI` 客户端实例。
- **问题**: `SQLGenerator` 使用自己内部的 `_call_llm()` 方法而非此函数。该模块在代码库中无任何引用。
- **建议**: 删除该文件，或重构使 `SQLGenerator` 使用此公共函数。

---

## 10. 建议与修复方案

### 优先级矩阵

| 优先级 | 问题 ID | 文件 | 建议修复 |
|--------|---------|------|---------|
| **P0** | CRIT-1 | executor.py:99 | 分页前执行 `SELECT COUNT(*)` 获取真实总数 |
| **P0** | CRIT-3 | config.py:43,46 | `llm_api_key` 和 `db_password` 改为 `SecretStr` |
| **P0** | CRIT-4 | error.py / main.py | 增加 `details` 和 `suggestion` 字段 |
| **P1** | CRIT-2 | main.py:184-189 | 增加 threshold 比较和告警逻辑 |
| **P1** | CRIT-5 | executor.py:72 | 传整数而非字符串，使用 `SET LOCAL` |
| **P1** | MAJ-1 | config.py:36 | `extra="ignore"` → `extra="forbid"` |
| **P1** | MAJ-2 | constants.py:25,28 | `list` → `frozenset` |
| **P1** | MAJ-5 | logger.py:60 | 修复类型签名或传参 |
| **P1** | MAJ-6 | 多处 | 统一使用 UTC |
| **P1** | MAJ-8 | — | 增加 HistoryManager 单元测试 |
| **P1** | MAJ-9 | — | 实现速率限制 |
| **P2** | MAJ-3 | main.py:31-37 | 封装为 `AppContext` 对象 |
| **P2** | MAJ-4 | schema.py:246-247 | 使用 `asyncio.gather()` 并发刷新 |
| **P2** | MAJ-7 | history/manager.py | 文件 IO 使用 `asyncio.to_thread()` |
| **P2** | DEAD-1 | utils/llm.py | 删除或重构以复用 |
| **P3** | MIN-1~8 | 各处 | 按需修复 |

### 建议修复时间估算

| 类别 | 数量 | 估算时间 |
|------|------|---------|
| P0（严重） | 3 | 4-6 小时 |
| P1（主要） | 7 | 12-16 小时 |
| P2（中等） | 4 | 6-8 小时 |
| P3（次要） | 8 | 4-6 小时 |
| **总计** | **22** | **26-36 小时** |

---

## 11. 总结

### 评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 需求覆盖 | 7/12 FR 通过，2 FR 部分，2 FR 失败，1 附加失败 | FR-7 和 FR-9 完全失败 |
| 架构一致性 | 6/10 | 核心架构匹配，但细节偏离较多 |
| 编码规范 | 4/10 | 多项 CLAUDE.md 规则未被遵守 |
| 代码质量 | 6/10 | 整体结构清晰，但存在死代码和冗余 |
| 安全性 | 5/10 | 核心安全机制好，但密码泄露和异常信息泄露严重 |
| 测试覆盖 | 3/10 | 仅 2 个模块有测试，8 个模块零覆盖 |
| **综合** | **5.2/10** | **需重大改进后方可投入生产** |

### 主要发现

1. **功能性缺陷**: FR-7 和 FR-9 是两个核心功能需求，但均未正确实现。`total_count` 返回分页后行数而非真实总数；verify 分数从未与 threshold 比较。
2. **安全合规**: 密码和 API key 使用明文 `str` 而非 `SecretStr` 是最严重的安全缺陷。错误信息可能泄露内部细节。
3. **规范遵从度低**: 项目自己的 CLAUDE.md 编码规范在 SecretStr、`extra="forbid"`、`frozenset`、`asyncio.gather()`、依赖注入等多项关键要求上未被遵守。
4. **测试严重不足**: 10 个模块中仅 2 个有单元测试，覆盖率极低。无集成测试。
5. **死代码**: `utils/llm.py` 完全未被使用。

### 亮点

1. **架构清晰**: 三层架构分离合理，组件职责明确。
2. **核心安全机制完整**: 三层 SQL 验证体系有效，危险函数检测 + AST 只读检查 + 对象存在性验证。
3. **代码可读性好**: 命名规范、结构清晰、中文注释可帮助理解业务逻辑。
4. **异步模式正确**: 正确使用 `asyncio` / `AsyncMock` / `@pytest.mark.asyncio`。
5. **错误码体系完整**: ErrorCode 枚举覆盖了所有关键错误场景。

---

*Review generated by Codex. All severity assessments are based on cross-referencing implementation against PRD v1.1 (`0001`), Design v1.2 (`0002`), Plan v2.0 (`0003`), and project CLAUDE.md coding standards.*
