# 数据库查询 JSON 接口工具 (view-to-api)

> 通用、轻量、安全的数据库查询 JSON 接口工具，提供管理端前端页面用于日志监控与审计。

---

## 项目概述

企业内部多个异构系统之间存在数据查询需求：一个系统需要读取另一个系统所依赖的数据库中的数据，但两者之间没有直连通道或适配的 API。本工具提供了一个**通用、轻量、安全的数据库查询接口**，并附带一个**管理端前端页面**，用于查询请求日志与错误信息。

### 核心能力

- **第三方查询接口** `POST /api/v1/query` — 接收 JSON 格式的查询请求，返回 JSON 格式的查询结果
- **多数据库支持** — MySQL、SQL Server、Oracle 三种数据库
- **分页查询** — 支持分页，减少单次查询数据量
- **SQL 安全校验** — 三层防御（正则 + AST 解析 + 危险关键字检查），仅允许 SELECT 语句
- **管理端 API** `GET /api/v1/admin/*` — 日志查询、错误查询、统计概览
- **日志审计** — 所有查询请求自动记录到 H2 内嵌数据库，支持自动清理
- **JDK 8 兼容** — 所有依赖严格限定 JDK 8 兼容版本

---

## 项目架构

### 整体架构

```
Spring Boot 应用（同一 JAR）
├── 前端 React SPA (static/)
│   ├── 概览页 /
│   ├── 日志查询 /logs
│   └── 错误查询 /errors
├── 后端 Java 8
│   ├── Controller — QueryController, AdminController
│   ├── Service — QueryService, LogService, PageService, ConnectionManager, LogCleanupTask
│   ├── Security — SqlValidator, SqlParserWrapper (JSqlParser)
│   ├── Config — AppConfig, CorsConfig, HikariCpConfig, GlobalExceptionHandler
│   ├── Model — QueryRequest/Response, ApiResponse, PageResult, ErrorCode, QueryLog
│   └── Runner — DataInitializer
└── 日志存储 — H2 文件数据库 (./data/query_log)
```

### API 端点一览

| 路径 | 方法 | 说明 | 认证 |
|------|------|------|------|
| /api/v1/query | POST | 第三方数据库查询 | 无（依赖 HTTPS + SQL 校验） |
| /api/v1/admin/logs | GET | 日志列表（分页+筛选） | 内网 IP 白名单（部署层） |
| /api/v1/admin/errors | GET | 错误日志列表 | 内网 IP 白名单（部署层） |
| /api/v1/admin/logs/{id} | GET | 日志详情（含完整 SQL） | 内网 IP 白名单（部署层） |
| /api/v1/admin/stats | GET | 请求统计概览 | 内网 IP 白名单（部署层） |

---

## API 文档

### POST /api/v1/query — 第三方数据库查询

第三方系统通过此接口向目标数据库发起 SELECT 查询。

#### 请求

**请求体参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| databaseIp | string | 是 | 数据库服务器 IP 或域名 |
| databasePort | integer | 是 | 数据库服务端口号 |
| databaseType | string | 是 | `mysql` / `sqlserver` / `oracle` |
| databaseUsername | string | 是 | 数据库登录用户名 |
| databasePassword | string | 是 | 数据库登录密码（HTTPS 传输，日志脱敏） |
| databaseName | string | 是 | 数据库名 / Schema 名 |
| sql | string | 是 | 待执行的 SELECT 查询语句 |
| page | object | 否 | 分页配置 |

**page 对象**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| pageNumber | integer | 是 | 当前页码（从 1 开始） |
| pageSize | integer | 是 | 每页记录数 [1, 5000] |

**请求示例**

```json
{
    "databaseIp": "172.19.61.11",
    "databasePort": 3306,
    "databaseType": "mysql",
    "databaseUsername": "etyy_hrp",
    "databasePassword": "Lk9m48kq!",
    "databaseName": "tender",
    "sql": "select * from account order by id",
    "page": {
        "pageNumber": 1,
        "pageSize": 10
    }
}
```

#### 响应

| 字段 | 类型 | 说明 |
|------|------|------|
| status | string | `"success"` 或 `"fail"` |
| execution_time | string | 服务端完成查询的时间（服务端本地时区） |
| message | string | 状态描述信息 |
| duration_ms | integer | 执行耗时（毫秒） |
| data | array | 查询到的记录列表，失败时为空数组 |
| metadata | object | 分页信息，无分页或失败时返回空对象 |

**成功响应** (HTTP 200)

```json
{
    "status": "success",
    "execution_time": "2026-05-20 14:30:00",
    "message": "操作成功",
    "duration_ms": 100,
    "data": [
        {"field1": "value1", "field2": "value2"}
    ],
    "metadata": {
        "total_count": 42,
        "page_number": 1,
        "page_size": 10
    }
}
```

**失败响应** (HTTP 400 / 502 / 504)

```json
{
    "status": "fail",
    "execution_time": "2026-05-20 14:30:01",
    "message": "数据库连接失败：无法连接到 172.19.61.11:3306，超时",
    "duration_ms": 5000,
    "data": [],
    "metadata": {}
}
```

#### 错误码

| HTTP | status | 说明 |
|------|--------|------|
| 200 | success | 查询成功 |
| 400 | fail | 参数缺失 / JSON 解析失败 / 不支持的数据库类型 / 非 SELECT / 缺 ORDER BY / SQL 解析失败 / 危险关键字 |
| 422 | fail | 查询结果超过上限 (>10MB) |
| 502 | fail | 数据库连接失败 / 连接池已满 |
| 504 | fail | 查询执行超时 |

#### 分页规则

| 数据库 | 语法 |
|--------|------|
| MySQL | `LIMIT size OFFSET offset` |
| SQL Server | `OFFSET offset ROWS FETCH NEXT size ROWS ONLY` |
| Oracle 12c+ | `OFFSET offset ROWS FETCH NEXT size ROWS ONLY` |

- offset = (page_number - 1) x page_size
- 分页查询**必须包含 ORDER BY**，否则返回 400 错误
- 无分页时上限 10000 条，建议始终携带 page 参数
- 页码越界时 data 返回空数组，total_count 保持实际值

---

### GET /api/v1/admin/logs — 日志查询

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startTime | string | 否 | 起始时间 `yyyy-MM-dd HH:mm:ss` |
| endTime | string | 否 | 结束时间 |
| clientIp | string | 否 | 调用方 IP（模糊匹配） |
| status | string | 否 | `success` / `fail` |
| databaseType | string | 否 | `mysql` / `sqlserver` / `oracle` |
| pageNumber | integer | 否 | 默认 1 |
| pageSize | integer | 否 | 默认 20，最大 200 |

#### 响应

```json
{
    "status": "success",
    "message": "操作成功",
    "data": {
        "items": [{
            "id": 1,
            "requestTime": "2026-05-20T14:30:00",
            "clientIp": "192.168.1.100",
            "databaseIp": "172.19.61.11",
            "databasePort": 3306,
            "databaseType": "mysql",
            "databaseName": "tender",
            "sqlHash": "a1b2c3d4e5f6...",
            "sqlPreview": "select * from account ...",
            "status": "success",
            "durationMs": 100
        }],
        "totalCount": 156,
        "pageNumber": 1,
        "pageSize": 20
    }
}
```

---

### GET /api/v1/admin/errors — 错误查询

参数同 `/admin/logs`。始终筛选 `status=fail`。接口自动设置，请求中的 status 参数会被忽略。

---

### GET /api/v1/admin/logs/{id} — 日志详情

返回包含 `sqlFull`（完整 SQL）的单条日志。仅管理端可查看。

**成功** (HTTP 200)：响应 data 包含完整 QueryLog 对象（含 sqlFull）。

**失败** (HTTP 404)：
```json
{ "status": "fail", "message": "日志记录不存在", "data": null }
```

---

### GET /api/v1/admin/stats — 统计概览

**响应示例**

```json
{
    "status": "success",
    "message": "操作成功",
    "data": {
        "totalRequests": 1024,
        "successCount": 1000,
        "failCount": 24,
        "todayRequests": 56,
        "avgDurationMs": 85.0
    }
}
```

---

### 数据模型

#### QueryLog

| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer | 主键 |
| requestTime | datetime | 请求时间 |
| clientIp | string | 客户端 IP |
| databaseIp | string | 目标数据库 IP |
| databasePort | integer | 目标数据库端口 |
| databaseType | string | 数据库类型 |
| databaseName | string | 数据库名称 |
| sqlHash | string | SQL 哈希（SHA-256 前 16 位） |
| sqlPreview | string | SQL 前 200 字符 |
| sqlFull | text | 完整 SQL（仅日志详情返回） |
| status | string | success / fail |
| message | string | 执行消息 |
| durationMs | integer | 执行耗时（毫秒） |

#### ApiResponse（管理端统一响应）

| 字段 | 类型 | 说明 |
|------|------|------|
| status | string | `"success"` 或 `"fail"` |
| message | string | 描述信息 |
| data | T | 数据载体（类型取决于具体接口） |

---

## 编译与运行

### 环境要求

| 组件 | 版本 | 说明 |
|------|------|------|
| JDK | 1.8+ | 项目目录下已包含 jre/（JDK 1.8.0_271 Windows x64） |
| Maven | 3.6+ | 构建工具 |

### 使用本地 JRE 编译（Windows）

```batch
set JAVA_HOME=%CD%\jre
set PATH=%JAVA_HOME%\bin;%PATH%
java -version
cd query-tool
mvn clean package -DskipTests
java -Xms512m -Xmx1024m -jar target/query-tool-1.0.0.jar
```

### 快速启动（系统 JDK）

```bash
cd query-tool
mvn clean package -DskipTests
java -Xms512m -Xmx1024m -jar target/query-tool-1.0.0.jar
```

### 运行测试

```bash
cd query-tool
mvn test                    # 全部测试
mvn test -Dtest=SqlValidatorTest  # 单类测试
mvn test jacoco:report      # 覆盖率报告
```

### 启动验证

```bash
curl http://localhost:8080/api/v1/admin/stats

curl -X POST http://localhost:8080/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{
    "databaseIp": "172.19.61.11",
    "databasePort": 3306,
    "databaseType": "mysql",
    "databaseUsername": "user",
    "databasePassword": "pass",
    "databaseName": "dbname",
    "sql": "select * from account order by id",
    "page": {"pageNumber": 1, "pageSize": 10}
  }'
```

### 配置项

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| server.port | 8080 | 服务端口 |
| log.cleanup.threshold | 400000 | 日志清理触发阈值 |
| log.cleanup.target | 300000 | 日志清理目标值 |
| log.cleanup.batch-size | 5000 | 每批删除条数 |
| connection-pool.max-pool-size | 20 | 单池最大连接数 |
| connection-pool.max-pool-count | 10 | 最大连接池数量 |
| connection-pool.max-total-connections | 200 | 全局最大总连接数 |
| connection-pool.idle-timeout-minutes | 10 | 空闲池回收时间 |

---

## 文档索引

| 文档 | 路径 |
|------|------|
| 产品需求文档 (PRD) | docs/0001-view-to-api-prd.md |
| 技术设计方案 | docs/0001-view-to-api-design.md |
| 实现计划 | docs/0001-view-to-api-plan.md |
| PRD 审查报告 | docs/0001-view-to-api-review.md |
| 设计审查报告 | docs/0001-view-to-api-design-review.md |
| 计划审查报告 | docs/0001-view-to-api-plan-review.md |
| 代码审查报告 | docs/1000-view-to-api-code-review.md |
| 实现说明 | docs/Instructions.md |

---

## 技术栈

| 层 | 技术 | 版本 |
|----|------|------|
| 后端 | Java 8 + Spring Boot | 2.7.18 |
| 构建 | Maven | 3.6+ |
| 连接池 | HikariCP | 4.x |
| SQL 解析 | JSqlParser | 4.9 |
| 日志库 | H2 | 2.1.214 |
| 前端 | React 18 + Ant Design 5 + Vite 5 | |