# pg-mcp 设计文档审查报告

**审查文件**: specs/w5/mcp/0002-pg-mcp-design-by-claude.md
**审查类型**: Markdown Design Document Review
**审查日期**: 2026-05-15
**审查方法**: Codex-Quality Document + Code Review
**审查版本**: v1.1

---

## 1. 审查概览

本文档是一份完整且详细的 pg-mcp 系统设计文档，涵盖架构设计、数据模型、核心模块、接口设计、配置管理、错误处理、性能安全等多个方面。整体质量较高，但经审查发现若干 **Critical（关键）**、**Warning（警告）** 和 **Suggestion（建议）** 级别的问题。

### 总体评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 结构完整性 | Excellent | 章节划分合理，逻辑清晰 |
| 技术准确性 | Good | 大部分设计合理，部分实现细节有偏差 |
| 安全性 | Good | 有多层防护设计，但仍有可加强之处 |
| 性能考量 | Good | 连接池、缓存、异步设计到位 |
| 可维护性 | Good | 模块化设计良好，但耦合度略高 |
| 测试覆盖描述 | Needs Improvement | 缺乏详细测试策略描述 |

---

## 2. Critical Issues（必须修复）

### C-01: `execute()` 方法中 `count_sql` 使用原始 `sql` 而非 `clean_sql`

**位置**: L947

**问题描述**:
```python
# L938: limited_sql 使用了 clean_sql（正确的）
limited_sql = f"{clean_sql} LIMIT $1 OFFSET $2"

# L947: count_sql 却使用了原始 sql（错误的）
count_sql = f"SELECT COUNT(*) FROM ({sql}) AS subquery"
```

如果 LLM 生成的 SQL 以分号结尾（如 `SELECT * FROM users;`），`limited_sql` 已安全处理，但 `count_sql` 直接使用原始 `sql` 变量，导致潜在的 SQL 语法错误。

**风险**: 高 — 会导致执行失败，且可能引入注入风险。

**建议方案**:
```python
# 统一使用 clean_sql
count_sql = f"SELECT COUNT(*) FROM ({clean_sql}) AS subquery"
```

---

### C-02: `main.py` 全局变量初始化时机不当

**位置**: L321-L327, L1433-L1436

**问题描述**:
```python
# 在模块加载时（import 时）就创建实例
config = load_config()
pool_mgr = ConnectionPoolManager(config.databases)
schema_mgr = SchemaManager(pool_mgr)
sql_gen = SQLGenerator(config.llm)
...
```

在 `lifespan()` 中才调用 `initialize()` 和 `load_all()`，但组件实例在模块加载时就已创建。这会导致：
1. `ConnectionPoolManager` 实例创建时 `pools` 为空字典
2. `SchemaManager` 实例创建时依赖的 `pool_mgr.pools` 也为空
3. 组件生命周期与 FastMCP 生命周期解耦，可能导致状态不一致

**风险**: 高 — 可能导致启动时组件状态异常，测试困难。

**建议方案**: 将所有组件初始化移至 `lifespan()` 内部：
```python
mcp = FastMCP(name="pg-mcp", version="0.1.0")

@asynccontextmanager
async def lifespan():
    global config, pool_mgr, schema_mgr, sql_gen, sql_validator, sql_executor, history_mgr
    config = load_config()
    pool_mgr = ConnectionPoolManager(config.databases)
    await pool_mgr.initialize()
    schema_mgr = SchemaManager(pool_mgr)
    await schema_mgr.load_all()
    sql_gen = SQLGenerator(config.llm)
    sql_validator = SQLValidator(config.security, schema_mgr)
    sql_executor = SQLExecutor(pool_mgr, config.security)
    history_mgr = HistoryManager()
    yield
    await pool_mgr.close()

mcp.set_lifespan(lifespan)
```

---

### C-03: SQL 生成器返回内容未清理（Markdown 代码块包裹）

**位置**: L835-L848

**问题描述**:
```python
sql = response.choices[0].message.content.strip()
```

LLM 经常返回 Markdown 代码块包裹的 SQL：
````
```sql
SELECT * FROM users;
```
````

直接使用 `strip()` 无法去除代码块标记，后续 `sqlglot.parse()` 和 SQL 执行都会失败。

**风险**: 高 — LLM 输出格式不可控，导致整个查询流程失败。

**建议方案**:
```python
import re

sql = response.choices[0].message.content.strip()
# 移除 Markdown 代码块包裹
sql = re.sub(r'^```(?:sql)?\s*', '', sql, flags=re.MULTILINE)
sql = re.sub(r'\s*```$', '', sql, flags=re.MULTILINE)
sql = sql.strip()
# 移除可能的末尾分号（execute 中也会处理，但在此处提前清理更安全）
sql = sql.rstrip(";").strip()
```

---

### C-04: `config.py` 中 `DatabaseSettings` 与 `Settings` 的组合模式不兼容

**位置**: L1179-L1257

**问题描述**:
```python
class DatabaseSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="DB_")

class Settings(BaseSettings):
    databases: List[DatabaseSettings] = []
    model_config = SettingsConfigDict(env_nested_delimiter="__")
```

问题：
1. `DatabaseSettings` 自己设置了 `env_prefix="DB_"`，但当它作为 `Settings.databases` 的嵌套模型时，`pydantic-settings` 会忽略嵌套 `BaseSettings` 的 `env_prefix`，导致环境变量无法正确映射。
2. `Settings.databases` 默认值为 `[]`，但 `DatabaseSettings` 的所有字段都是必填的，空列表校验通过但在运行时使用 `config.databases[0]` 会触发 `IndexError`。

**风险**: 高 — 配置加载可能静默失败，或运行时崩溃。

**建议方案**:
```python
class DatabaseSettings(BaseModel):  # 改为 BaseModel，去掉 BaseSettings
    name: str
    host: str = "localhost"
    port: int = 5432
    username: str
    password: str
    database: str = ""
    min_pool_size: int = 5
    max_pool_size: int = 20

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_nested_delimiter="__",
        extra="ignore",
    )

    db_name: str = "default"
    db_host: str = "localhost"
    db_port: int = 5432
    db_username: str = ""
    db_password: str = ""
    db_database: str = ""

    llm_api_key: str = ""
    llm_model: str = "glm-4.7"
    llm_api_base: str = "https://open.bigmodel.cn/api/paas/v4/"
    llm_temperature: float = 0.1
    llm_max_tokens: int = 1000
    llm_timeout: int = 30

    security_max_query_timeout: int = 60
    security_max_result_rows: int = 10000
    security_enable_sql_verification: bool = True
    security_enable_result_verification: bool = True
    security_verification_threshold: float = 0.8

    log_level: str = "INFO"
    schema_refresh_interval: Optional[int] = None

    @model_validator(mode="after")
    def build_databases(self) -> "Settings":
        if self.db_username and self.db_password:
            self.databases = [DatabaseSettings(
                name=self.db_name,
                host=self.db_host,
                port=self.db_port,
                username=self.db_username,
                password=self.db_password,
                database=self.db_database,
            )]
        return self
```

---

### C-05: `health_check()` 中 `async with await` 嵌套使用

**位置**: L1475

**问题描述**:
```python
async with await pool_mgr.acquire(db_name) as conn:
```

`acquire()` 返回的是 `AsyncContextManager`，`await` 一个异步上下文管理器是合法的但会导致不必要的等待。`async with` 已经处理了 `__aenter__`/`__aexit__` 的等待。

**风险**: 中 — 可能导致连接被提前释放或异常。

**建议方案**:
```python
async with pool_mgr.acquire(db_name) as conn:
    await conn.fetchval("SELECT 1")
```

---

## 3. Warnings（需要关注）

### W-01: `query_database()` 中 `config.databases[0]` 无空列表检查

**位置**: L344

**问题描述**:
```python
db_name = database or config.databases[0].name
```

如果 `config.databases` 为空列表，触发 `IndexError`。

**建议方案**:
```python
if not config.databases:
    raise MCPError(ErrorCode.DB_CONNECTION_ERROR, "No databases configured")
db_name = database or config.databases[0].name
```

---

### W-02: `_load_tables()` SQL 中 `col_description()` 的 `ordinal_position` 可能不匹配

**位置**: L516

**问题描述**:
`col_description()` 的第二个参数需要的是 `pg_attribute.attnum`（从 1 开始的物理列序号），而非 `information_schema.columns.ordinal_position`。虽然两者通常一致，但在有 dropped columns 的情况下会不一致。

**建议方案**: 使用 `pg_attribute` 替代 `information_schema.columns` 来获取列注释：
```sql
col_description(
    (t.table_schema || '.' || t.table_name)::regclass::oid,
    (SELECT a.attnum FROM pg_attribute a
     JOIN pg_class c ON c.oid = a.attrelid
     WHERE c.relname = t.table_name
     AND a.attname = c.column_name
     AND a.attnum > 0)
) as column_comment
```

或使用简化方式 — 不依赖 ordinal_position：
```sql
-- 在 Python 中通过 column_name 匹配注释
```

---

### W-03: SQLGlot `walk()` 递归遍历可能包含子查询中的嵌套表

**位置**: L697-L706

**问题描述**:
`walk()` 会递归遍历整个 AST，包括子查询中的表引用。对于 `SELECT * FROM (SELECT * FROM secret_table) t` 这样的查询，`secret_table` 会被检测为引用表，如果该表不在 Schema 中才会报错。但如果 `secret_table` 恰好存在于 Schema 中（但用户不应该访问），则无法通过表存在性检查来拦截。

**建议方案**: 此问题主要通过数据库级别的权限控制解决。设计文档应补充说明："所有数据库连接使用只读用户，且仅授予必要表的 SELECT 权限"。

---

### W-04: `generate_sql()` Tool 缺少 SQL 验证步骤

**位置**: L1086-L1095

**问题描述**:
`generate_sql` Tool 只生成 SQL 但不验证，用户可以生成并查看危险的 SQL（包含危险函数）。

**建议方案**:
```python
@mcp.tool()
async def generate_sql(query: str, database: str | None = None) -> dict:
    db_name = database or config.databases[0].name
    schema = await schema_mgr.get_schema(db_name)
    sql = await sql_gen.generate(query, schema, db_name)

    # 至少进行危险函数检测和只读检查
    dangerous_func = sql_validator.has_dangerous_functions(sql)
    is_safe = dangerous_func is None
    try:
        sql_validator.validate_read_only(sql)
    except MCPError:
        is_safe = False

    return {"sql": sql, "is_safe": is_safe, "warning": dangerous_func}
```

---

### W-05: 历史管理模块实现缺失

**位置**: L1139-L1140

**问题描述**:
`history_resource` 引用了 `history_mgr.get_by_user(user_id)`，但设计文档中未给出 `HistoryManager.get_by_user()` 的实现，也未给出历史记录的文件存储格式和并发处理策略。

**建议方案**: 补充 `HistoryManager` 完整设计，包括：
- 文件存储格式（JSON Lines）
- 并发写入处理（asyncio.Lock 或队列）
- 历史记录清理策略（保留最近 N 天或 M 条）

---

### W-06: `config/` 目录和 `default.yaml` 在目录结构中出现但设计使用 pydantic-settings

**位置**: L133-L134

**问题描述**:
目录结构中包含 `config/default.yaml`，但第 7 节明确说明 "不再需要 YAML 配置文件"。

**建议方案**: 删除 `config/` 目录和 `default.yaml` 的描述，或在 7.1 中补充说明 `default.yaml` 的用途（如作为环境变量默认值的补充）。

---

### W-07: `verify_result()` 中 `import re` 在方法内部

**位置**: L884

**问题描述**:
```python
async def verify_result(...):
    ...
    import re
    match = re.search(...)
```

import 语句应在文件顶部，不应在方法内部。

**建议方案**: 将 `import re` 移到文件顶部。

---

## 4. Suggestions（改进建议）

### S-01: SQL Generator Prompt 缺少示例（Few-Shot）

当前 Prompt 为 Zero-Shot，对于复杂查询可能效果不稳定。建议添加 1-2 个示例（Few-Shot Prompt），特别是 JOIN 和聚合查询的示例。

### S-02: 缺少 LLM 调用重试机制

GLM-4.7 API 可能偶发超时或限流。建议为 `SQLGenerator.generate()` 和 `SQLGenerator.verify_result()` 添加重试逻辑（如使用 `tenacity` 库）。

### S-03: Schema 缓存缺少并发安全

`_cache` 是普通 `dict`，在高并发下可能出现竞态条件。建议使用 `asyncio.Lock` 保护缓存读写，或使用 `aiocache` 等异步缓存库。

### S-04: 缺少分页参数验证

`page` 和 `page_size` 应在入口处验证：
```python
if page < 1:
    raise MCPError(ErrorCode.INVALID_ARGUMENT, "page must be >= 1")
if page_size < 1 or page_size > 1000:
    raise MCPError(ErrorCode.INVALID_ARGUMENT, "page_size must be between 1 and 1000")
```

### S-05: 架构图中对齐问题

**位置**: L41-L93

架构图中的 ASCII 框图存在对齐不一致的问题，部分行的缩进不匹配。建议重新生成对齐的架构图。

### S-06: 缺少 API 速率限制设计

当前设计未提及 LLM API 和数据库 API 的速率限制。建议补充：
- LLM API 调用限流（如每分钟 N 次）
- 数据库查询限流（防慢查询堆积）

### S-07: 缺少日志脱敏设计

**位置**: L846
```python
logger.info(f"Generated SQL for '{user_query}': {sql}")
```

`user_query` 可能包含敏感信息（如查询特定用户的数据）。建议对日志中的查询内容进行脱敏或截断。

### S-08: 测试策略补充

文档缺少测试策略章节。建议补充：
- 单元测试范围（哪些模块需要 Mock）
- 集成测试环境搭建（如何启动临时 PostgreSQL 实例）
- LLM Mock 策略（录制/回放或固定响应）

---

## 5. 风险评估矩阵

| 风险 ID | 风险描述 | 严重性 | 可能性 | 影响 | 建议措施 |
|---------|----------|--------|--------|------|----------|
| R-01 | `count_sql` 使用原始 `sql` 导致执行失败 | High | High | 查询失败 | 改用 `clean_sql`（C-01） |
| R-02 | 全局变量初始化时机不当导致状态异常 | High | Medium | 启动失败 | 移至 lifespan 内初始化（C-02） |
| R-03 | LLM 返回 Markdown 代码块导致解析失败 | High | High | 查询失败 | 添加代码块清理（C-03） |
| R-04 | 配置模型组合不兼容导致配置加载失败 | High | Medium | 启动失败 | 重构配置模型（C-04） |
| R-05 | `async with await` 嵌套使用导致连接异常 | Medium | Low | 连接泄漏 | 移除多余 await（C-05） |
| R-06 | 空数据库列表导致 IndexError | Medium | Medium | 查询失败 | 添加空列表检查（W-01） |
| R-07 | `col_description` ordinal_position 不匹配 | Low | Low | 注释缺失 | 使用 pg_attribute 查询（W-02） |
| R-08 | 只读模式生成 SQL 暴露危险 SQL | Medium | Medium | 安全隐患 | 生成时也进行验证（W-04） |
| R-09 | 历史记录并发写入导致数据丢失 | Medium | Low | 数据丢失 | 添加异步锁或队列（W-05） |
| R-10 | LLM API 超时导致服务不可用 | Medium | Medium | 查询失败 | 添加重试机制（S-02） |

---

## 6. 建议修复优先级

### Phase 1: 必须立即修复（阻塞实现）
1. **C-01**: `count_sql` 使用 `clean_sql`
2. **C-03**: LLM 返回内容清理（Markdown 代码块）
3. **C-04**: 配置模型重构
4. **C-02**: 全局变量初始化移至 lifespan

### Phase 2: 实现前修复
5. **C-05**: `health_check` 中 `async with await` 修复
6. **W-01**: 空数据库列表检查
7. **W-04**: `generate_sql` 添加验证
8. **W-06**: 删除多余的 `config/default.yaml` 描述

### Phase 3: 实现过程中修复
9. **W-02**: 列注释查询优化
10. **W-05**: 历史管理模块完整设计
11. **W-07**: `import re` 位置调整

### Phase 4: 后续优化
12. **S-01 ~ S-08**: 各类改进建议

---

## 7. 审查总结

本文档是一份质量较高的设计文档，架构清晰、技术选型合理、安全措施较为完善。审查共发现：

- **5 个 Critical 问题**：涉及 SQL 注入风险、配置模型不兼容、初始化时机不当、LLM 输出处理缺失等，必须在实现前修复。
- **7 个 Warning 问题**：涉及边界条件处理、模块设计缺失、代码规范等，建议在实现过程中修复。
- **8 个 Suggestion 改进**：涉及性能、可维护性、测试等，可在后续迭代中优化。

修复 Critical 问题后，本文档可作为可靠的实现依据。

---

**审查人**: AI Assistant (Codex-Quality Review)
**审查日期**: 2026-05-15
**文档版本**: v1.1
