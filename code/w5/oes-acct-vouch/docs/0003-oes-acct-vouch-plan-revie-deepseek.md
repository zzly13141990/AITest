# OES 会计凭证录入组件 — Codex Review 审查报告（实现计划）

> **审查对象**: `0003-oes-acct-vouch-plan-by-deepseek.md` (v1.0)  
> **审查日期**: 2026-05-17  
> **审查人**: Codex Reviewer (DeepSeek)  
> **审查标准**: 设计说明书 v2.1 (0003-oes-acct-vouch-req-design-by-deepseek)  
> **审查结论**: ⚠️ **有条件通过**（3 个 Error + 4 个 Warning 需修复）

---

## 审查摘要

| 级别 | 数量 | 说明 |
|------|------|------|
| 🔴 Error | 3 | 乐观锁降级方案设计缺陷、凭证号唯一约束缺失、乐观锁方法定义与实际不匹配 |
| 🟡 Warning | 4 | DynamicSQLBuilder 潜在 SQL 注入风险、VouchController 多余注入、Redis锁释放时序说明不足、缺少认证机制说明 |
| 🟢 Suggestion | 2 | 前端性能优化建议、日志监控完善建议 |
| ✅ 通过项 | 8 | 架构覆盖、阶段划分、接口契约、数据库索引、Entity 设计、依赖关系图、风险识别、工时估算 |

---

## 一、🔴 Error 问题列表

### E-1：乐观锁降级方案设计缺陷

| 项目 | 内容 |
|------|------|
| **位置** | §7.3 凭证号生成双方案流程图（原文第 656~658 行） |
| **问题描述** | 乐观锁降级方案使用 `UPDATE acct_vouch SET vouch_no += 1 WHERE vouch_id = (SELECT MAX(vouch_id) FROM ...)`，这是一个**严重逻辑错误**：<br/>1. 子查询 `SELECT MAX(vouch_id)` 返回的是最大 ID 行，但该行可能已有凭证号，对其 +1 会错误修改已有数据<br/>2. 没有利用 `version` 列进行乐观锁控制，`vouch_no += 1` 在高并发下无法保证唯一性<br/>3. 此方案在多实例部署时完全不可靠 |
| **严重性** | 🔴 **Critical** — 直接导致高并发场景下凭证号重复或错误覆盖 |
| **修复要求** | 必须重写乐观锁方案 |

**修复方案**（需更新到计划中）：

```sql
-- 方案 A：基于 version 列的乐观锁（推荐）
-- Step 1: 读取当前最大号 + 版本号
SELECT ISNULL(MAX(vouch_no), 0) AS max_no, 
       MIN(version) AS cur_version
FROM acct_vouch 
WHERE comp_code = :compCode AND copy_code = :copyCode 
  AND acct_year = :acctYear AND acct_month = :acctMonth;

-- Step 2: Insert 新凭证，version 从 0 开始
INSERT INTO acct_vouch (...) VALUES (..., :newNo, 0);

-- 方案 B：独立序列号表（更可靠的降级方案）
-- 专用序列号表 acct_vouch_no_seq
CREATE TABLE acct_vouch_no_seq (
    comp_code  VARCHAR(10) NOT NULL,
    copy_code  VARCHAR(10) NOT NULL,
    acct_year  VARCHAR(4) NOT NULL,
    acct_month VARCHAR(2) NOT NULL,
    next_no    INT NOT NULL DEFAULT 1,
    version    INT NOT NULL DEFAULT 0,
    PRIMARY KEY (comp_code, copy_code, acct_year, acct_month)
);

-- 乐观锁更新
UPDATE acct_vouch_no_seq 
SET next_no = next_no + 1, version = version + 1
WHERE comp_code = :compCode AND copy_code = :copyCode 
  AND acct_year = :acctYear AND acct_month = :acctMonth
  AND version = :expectedVersion;
```

---

### E-2：凭证号唯一约束缺失

| 项目 | 内容 |
|------|------|
| **位置** | §4.4 数据库优化注意事项（原文第 445~451 行） |
| **问题描述** | 计划仅在 acct_vouch 表上创建了普通覆盖索引 `IX_acct_vouch_comp_copy_year_month`，但**缺少唯一约束**：`UNIQUE (comp_code, copy_code, acct_year, acct_month, vouch_no)`。即使有 Redis 锁和乐观锁双重保障，唯一约束是**最后一道防线**，缺少它将导致极端并发条件下凭证号重复无法被捕获。 |
| **严重性** | 🔴 **Critical** — 缺少数据完整性兜底机制 |
| **修复要求** | 在索引定义中增加唯一约束 |

**修复方案**：

```sql
-- 将普通索引改为唯一索引/约束
CREATE UNIQUE INDEX UQ_acct_vouch_no 
    ON acct_vouch (comp_code, copy_code, acct_year, acct_month, vouch_no)
    INCLUDE (vouch_id, vouch_date, operator, is_check, is_acc, is_cancel);
```

---

### E-3：乐观锁方法定义与实际方案不匹配

| 项目 | 内容 |
|------|------|
| **位置** | §4.3 Repository 接口设计（原文第 414 行）与 §7.3 流程图（第 656~660 行） |
| **问题描述** | VouchRepository 接口中定义了 `updateVouchNoByOptimisticLock(Long vouchId, int newNo, int expectedVersion)` 方法，但§7.3 流程图中描述的乐观锁实现并未使用该方法，而是使用了完全不同的 `UPDATE vouch_no += 1 WHERE vouch_id = (SELECT MAX(vouch_id) ...)` 方式。接口设计与实际实现方案不一致。 |
| **严重性** | 🔴 **High** — 导致代码实现混乱，开发人员无法确定应遵循哪个方案 |
| **修复要求** | 统一方案，确保接口定义与流程图描述一致 |

---

## 二、🟡 Warning 问题列表

### W-1：DynamicSQLBuilder 潜在 SQL 注入风险

| 项目 | 内容 |
|------|------|
| **位置** | §6.3 DynamicSQLBuilder 设计要点（原文第 568~582 行） |
| **问题描述** | `buildQuerySQL(String tableId, String whereSql)` 方法中的 `whereSql` 参数虽然做了占位符替换，但如果 `whereSql` 来自前端用户输入（如高级筛选条件），仅做 `:compCode → ?` 替换不足以防注入。恶意用户仍可在 `whereSql` 中注入 SQL 片段。 |
| **修复要求** | 明确约束 whereSql 的来源必须是预定义模板，不能直接使用用户输入 |

**修复方案**：

```java
// 强化约束：whereSql 只能从预定义的模板集合中选取
public enum WhereSqlTemplate {
    BY_COMP_COPY_YEAR("... WHERE comp_code = :compCode AND copy_code = :copyCode AND acct_year = :acctYear"),
    BY_KEYWORD("... WHERE name LIKE ?");
    // ...
}

public String buildQuerySQL(String tableId, WhereSqlTemplate template, Object... params) {
    // tableId 白名单校验
    // 使用 template.getSql() 而非任意字符串
    // 所有参数通过 JdbcTemplate 参数化绑定
}
```

---

### W-2：VouchController 多余依赖注入

| 项目 | 内容 |
|------|------|
| **位置** | §10.2 Controller 层设计原则（原文第 897~902 行） |
| **问题描述** | VouchController 构造函数注入了 `NavigationService` 和 `CheckService`，但后续展示的 `loadVouch()` 和 `saveVouch()` 方法中并未使用它们。这将导致不必要的 bean 创建或混淆。 |
| **修复要求** | 移除未使用的依赖，或将导航/辅助核算接口拆分到各自 Controller 中（实际上已有 NavigationController 和 CheckController） |

---

### W-3：Redis 锁释放时序说明不足

| 项目 | 内容 |
|------|------|
| **位置** | §7.2 凭证保存核心流程 时序图（原文第 622~631 行） |
| **问题描述** | 时序图显示 Redis 锁在 `SELECT MAX(vouch_no)` 之后就立即释放（DEL），然后才执行 INSERT。这会在锁释放到 INSERT 提交之间产生一个**竞态窗口**：另一个请求可获取锁，读到同样的 MAX+1 值，导致凭证号重复。 |
| **修复要求** | 必须将 INSERT 操作纳入锁保护范围内，或提供设计决策说明 |

---

### W-4：缺少认证与授权机制说明

| 项目 | 内容 |
|------|------|
| **位置** | 全文 |
| **问题描述** | 计划中提到了"无登录访问"设计（§10 Controller 层、§14 风险 R-06），但整个计划未描述：1) 具体如何验证 account 参数的合法性（仅提了格式校验）；2) 不同角色（制单人/审核人/管理员）的权限边界；3) 审核后凭证如何禁止修改的机制。 |
| **修复要求** | 补充凭证权限控制的安全设计说明 |

---

## 三、🟢 Suggestion 建议列表

### S-1：前端辅助核算加载性能优化

建议在 §11 前端实现中增加虚拟滚动（react-window）或分页加载方案，当档案表数据量超过 5000 条时，Select 下拉框应支持远程搜索（Ant Design Select 的 `showSearch` + `fetchOptions`），避免一次性加载所有选项导致页面卡顿。

### S-2：日志与监控补充建议

建议在 §3 工具层或 §10 Controller 层中补充：
1. 关键操作的业务日志（凭证创建/修改/删除）写入独立的审计日志表
2. 性能监控指标（P99 响应时间、凭证号生成成功率）对接 Prometheus + Grafana
3. 慢 SQL 日志配置（`spring.jpa.properties.hibernate.generate_statistics` 或 MyBatis 慢查询拦截器）

---

## 四、✅ 审查通过项

| 审查维度 | 评价 |
|---------|------|
| 架构覆盖度（10 个 Phase） | ✅ 完整覆盖从项目搭建到部署上线的全链路 |
| 阶段划分合理性 | ✅ 自底向上 + 前后端并行，依赖关系清晰 |
| 接口契约定义 | ✅ 5 个 REST API 的输入/输出/调用链明确 |
| 数据库索引设计 | ✅ 核心索引覆盖查询路径，v2.1 新增表索引完整 |
| Entity 关系模型 | ✅ 与设计文档的 ER 图、一对多模型一致 |
| 依赖关系图（mermaid） | ✅ 阶段依赖图、模块调用链图清晰易懂 |
| 风险识别 | ✅ R-01 ~ R-07 覆盖了关键风险 |
| 工时估算 | ✅ 按后/前/测试三维度分解，总工期合理 |

---

## 五、总体评价

实现计划整体质量**较高**，结构完整、阶段划分清晰、mermaid 图辅助描述到位。但存在**3 个 Error** 问题，其中乐观锁降级方案的设计缺陷属于严重逻辑错误，必须在进入编码阶段前修复：

1. **E-1（Critical）**：乐观锁方案必须重写，采用 version 乐观锁或独立序列号表
2. **E-2（Critical）**：必须增加 `(comp_code, copy_code, acct_year, acct_month, vouch_no)` 唯一索引兜底
3. **E-3（High）**：Repository 接口定义与流程描述需统一

4 个 Warning 问题建议在实施前一并修复，以提升代码质量和安全性。

---

> **审查结束**
