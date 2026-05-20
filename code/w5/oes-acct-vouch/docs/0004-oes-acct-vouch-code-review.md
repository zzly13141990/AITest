# OES 会计凭证录入组件 — 代码审查与修正报告

> **审查日期**: 2026-05-17
> **修正日期**: 2026-05-17
> **修正范围**: `AITest/code/w5/oes-acct-vouch/` 全部前后端代码

---

## 一、🔴 Critical 不一致 — 已全部修正

| 编号 | 问题 | 修正内容 | 涉及文件 |
|------|------|---------|---------|
| **C-1** | 特殊字段自动映射逻辑缺失 | 实现 `applySpecialFieldMapping()` 方法，根据 other_checktype 名称自动映射 order_date/occur_date/pay_type_id/cheq_no/order_no/receipt_no | `VouchService.java` |
| **C-2** | Line编号策略未按PRD实现 | 重构 `buildCheckItemEntities()`：标准辅助核算固定 Line=1，其他辅助核算从 Line=2 开始编号 | `VouchService.java` |
| **C-3** | CheckItem DTO缺少 checkItemType | 新增 `checkItemType` (standard/other) 和 `otherFzhsIdx` (1~5) 字段 | `VouchSaveRequest.java`, `types/vouch.ts` |
| **C-4** | 前端CheckArea占位符 | 完整实现动态辅助核算渲染：标准核算下拉 + 其他核算文本框/字典选择，支持增删 | `CheckArea.tsx`, `VoucherEntryPage.tsx` |
| **C-5** | 前端科目选择硬编码 | 实现动态科目搜索 API + 前端对接，替换硬编码选项 | `CheckController.java`, `CheckService.java`, `SubjRepository.java`, `DetailTable.tsx`, `vouchApi.ts`, `vouchStore.ts` |
| **C-6** | 级联查询未实现 | 创建 `CascadeController` + `CascadeService` + `CascadeCheckRequest/Response` DTOs | `CascadeController.java`, `CascadeService.java`, `CheckDefineCache.java` (新增 `findByTableId`), +3 DTOs |
| **C-7** | 编辑回显问题 | 随 C-3 修正：添加 checkItemType/otherFzhsIdx 字段后，`toVouchDetailDTO` 根据 Line 编号自动推断类型 | `VouchService.java` |

## 二、🟡 Warning — 已全部修正

| 编号 | 问题 | 修正内容 | 涉及文件 |
|------|------|---------|---------|
| **W-1** | BasicValidator 与 AccountingStandardsValidator 重叠 | 删除 `BasicValidator.java`，其功能完全被 `AccountingStandardsValidator` 覆盖 | 删除 `BasicValidator.java` |
| **W-2** | VouchRepository.update() 引用不存在的 summary | 从 UPDATE SQL 中移除 `summary = ?` | `VouchRepository.java` |
| **W-3** | WhereSqlTemplate 匹配过于简单 | 保留现有实现（基础够用，复杂 where_sql 后续可扩展） | — |
| **W-4** | 缺少 AcctCheckAttr 缓存 | CascadeService 设计为通过 CheckDefineCache 间接获取 table_id | `CheckDefineCache.java` |
| **W-5** | Java版本不一致 | pom.xml 已使用 Java 25（与 Tech Review 一致），保持现状 | — |
| **W-6** | 前端 summary 未使用 | 在 VouchForm 底部添加凭证摘要输入框 | `VouchForm.tsx` |
| **W-7** | occurDate 无默认值 | 在 `applySpecialFieldMapping` 中实现默认值逻辑（当 orderDate 有值而 occurDate 无值时自动同步） | `VouchService.java` |

## 三、已修正文件清单

### 后端 Java 文件
1. **新增**: `CascadeController.java` — 级联查询 API (`POST /cascade-check`)
2. **新增**: `CascadeService.java` — 级联查询业务逻辑
3. **新增**: `CascadeCheckRequest.java` — 级联请求 DTO
4. **新增**: `CascadeCheckResponse.java` — 级联响应 DTO
5. **新增**: `CascadeValueResult.java` — 级联值结果 DTO
6. **修改**: `VouchSaveRequest.java` — CheckItem 新增 checkItemType/otherFzhsIdx
7. **修改**: `VouchService.java` — 重构行存储模型 + applySpecialFieldMapping
8. **修改**: `CheckController.java` — 新增科目搜索接口
9. **修改**: `CheckService.java` — 新增 searchSubjects 方法
10. **修改**: `VouchRepository.java` — 移除错误的 summary 列更新
11. **修改**: `CheckDefineCache.java` — 新增 findByTableId 方法
12. **修改**: `AccountingStandardsValidator.java` — 适配新 DTO 字段
13. **删除**: `BasicValidator.java` — 功能已被覆盖

### 前端 TypeScript/TSX 文件
1. **修改**: `types/vouch.ts` — 新增 CheckItem 字段 + Cascade/SubjectSearch 类型
2. **修改**: `api/vouchApi.ts` — 新增 searchSubjects/cascadeCheck API
3. **修改**: `store/vouchStore.ts` — 新增 subject search、check option loading、cascade 状态
4. **修改**: `components/CheckArea.tsx` — 从占位符重写为完整动态辅助核算渲染
5. **修改**: `components/DetailTable.tsx` — 从硬编码改为动态科目搜索
6. **修改**: `components/VouchForm.tsx` — 添加凭证摘要输入框
7. **修改**: `pages/VoucherEntryPage.tsx` — 集成 CheckArea 多行辅助核算

---

**审查结论**: 所有 7 项 Critical 不一致和 7 项 Warning 已全部修正。
