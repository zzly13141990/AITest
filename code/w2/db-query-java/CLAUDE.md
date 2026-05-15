# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**db-query-java** — 一个支持多数据库（MySQL/PostgreSQL/SQL Server）的 SQL 查询工具，带有 LLM 辅助生成 SQL 功能。前后端分离架构。

```
backend/    — Spring Boot 3.2.0 (Java 17, Maven)
frontend/   — React 18 + TypeScript (Vite 5)
```

## 常用命令

### 后端

```bash
# 编译 (从 backend 目录执行)
mvn clean package -DskipTests

# 运行
mvn spring-boot:run

# 运行全部测试
mvn test

# 运行单个测试类
mvn test -Dtest=ConnectionServiceTest

# 运行单个测试方法
mvn test -Dtest=SqlValidatorServiceTest#testIsValidSelectStatement
```

后端启动在 `http://localhost:8080`

### 前端

```bash
cd frontend && npm install

# 开发服务器
npm run dev

# 运行 Playwright E2E 测试
npx playwright test
```

前端开发服务器在 `http://localhost:3000`，已配置 `/api` 代理到后端 8080。

### 后端数据库

后端自身使用 SQL Server 存储连接配置和元数据，Hibernate `ddl-auto: update` 自动建表。连接信息在 `application.yml` 中配置。

## 架构概览

### 数据流

1. 用户通过 UI 创建目标数据库连接 → `ConnectionController` → `ConnectionService` → 存入后端 SQL Server
2. 提取元数据 → `MetadataController` → `MetadataService` → 通过 JDBC `DatabaseMetaData` 从目标库读取表/视图/字段信息
3. 执行 SQL → `QueryController` → `QueryExecutorService` → 动态建立 JDBC 连接到目标库执行，支持分页（MySQL LIMIT / PostgreSQL LIMIT / SQL Server OFFSET-FETCH）
4. 生成 SQL → `QueryController` → `LlmService` → GLM-4.7 (Anthropic 兼容 API)
5. 导出 Excel → `QueryController` → `ExcelExportService`（Apache POI，大数据量用 SXSSFWorkbook 流式写入）

### 关键服务

| Service | 职责 |
|---------|------|
| `ConnectionService` | 连接配置 CRUD + `testConnection()` 实测 JDBC 连通性 |
| `MetadataService` | 提取数据库元数据，批量处理（2000条/批），支持多类型对象查询和搜索 |
| `QueryExecutorService` | 执行用户 SQL，区分 SELECT/非SELECT，自动分页 |
| `SqlValidatorService` | 使用 JSqlParser 验证 SELECT 语句（TOP/LIMIT 自动添加逻辑已禁用） |
| `LlmService` | LLM SQL 生成，使用 GLM-4.7 (Java HttpClient 直调 Anthropic 兼容 API) |
| `ExcelExportService` | 查询结果导出为 .xlsx |

### 前端路由

- `/` — `SqlEditorPage`（主界面：Monaco 编辑器 + 多 Tab + 查询结果表格）
- `/connections` — `ConnectionsPage`（连接管理列表）

`Layout.tsx` 是核心布局组件，包含左侧可伸缩数据库导航树、右键菜单、弹窗管理等。通过 `ConnectionContext` 共享选中连接和元数据。

### 已知问题

- **`SqlValidatorServiceTest` 可能失败**：测试期望自动添加 TOP 1000，但实际逻辑已禁用
- **表结构展示使用 Mock 数据**：`Layout.tsx` 中表字段信息为硬编码，无后端 API 支持
- **无连接池**：目标数据库连接通过 `DriverManager` 按需创建，用完即关，高并发场景可能有问题
- **后端硬编码 SQL Server**：`application.yml` 中后端自身数据库固定为 SQL Server，不支持切换
