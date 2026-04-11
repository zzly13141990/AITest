# Project Alpha — 实现工程

本目录为 **Project Alpha**（标签化 Ticket 管理）的代码根目录（`./code/w1/project_alpha`）。

- 需求与设计：`specs/w1/0001-spec.md`
- 实现计划：`specs/w1/0002-implementation-plan.md`
- OpenAPI 契约：`specs/w1/openapi.yaml`
- 种子数据（约 500 ticket / 50 tag）：`default/default-data.md`（内嵌 SQL）；同内容见 `specs/w1/0003-seed-data.sql`

## 已实现范围（阶段 1～5）

| 阶段 | 内容 |
|------|------|
| 1 | 实体 `Ticket` / `Tag`，`ticket_tag` 多对多，`TicketRepository` / `TagRepository`（含列表 JOIN FETCH 查询） |
| 2 | `TicketService`、`TagService`；列表多标签 **AND** 与标题 `q` 组合 |
| 3 | REST `/api/tickets`、`/api/tags`；DTO 与校验；`GlobalExceptionHandler`（404/409/400）；删除 Ticket **204** |
| 4 | **SpringDoc**：`/swagger-ui/index.html`，`/v3/api-docs`；`OpenApiConfig` + Controller `@Tag` / `@Operation` |
| 5 | `static/index.html` + **Bootstrap 5.3 CDN** + `js/api.js` + `js/app.js`（列表、筛选、CRUD、完成/标签） |

## 环境与运行

- **JDK 21**、**Maven 3.9+**。
- 在 SQL Server 执行 `specs/w1/0001-spec.md` **5.3** DDL，库名默认 `project_alpha`。
- 环境变量 **`SQLSERVER_PASSWORD`**，或修改 `application.yml` 中的数据源密码。
- `spring.jpa.hibernate.ddl-auto: validate`（表需已存在）。

```bash
D:\software\apache-maven-3.5.3-bin\bin\mvn test
D:\software\apache-maven-3.5.3-bin\bin\mvn spring-boot:run
```

- 前端：<http://localhost:8080/>  
- Swagger UI：<http://localhost:8080/swagger-ui/index.html>  
- OpenAPI JSON：<http://localhost:8080/v3/api-docs>

## 行为说明

- **多标签筛选**：勾选多个标签时，列表仅显示 **同时具备** 这些标签的 Ticket（AND，与 `0001-spec` 4.2 推荐一致）；页面上有简短提示。
- **OpenAPI 文件**：以运行时的 `/v3/api-docs` 为准；仓库内 `specs/w1/openapi.yaml` 供对照，若有差异以代码为准。

## 包结构（摘要）

```
com.projectalpha
├── ProjectAlphaApplication
├── config          ← OpenApiConfig
├── domain
├── repository
├── service
└── web             ← dto, error, TicketController, TagController
```
