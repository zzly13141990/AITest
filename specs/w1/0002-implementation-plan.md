# Project Alpha — 详细实现计划

| 项目 | 说明 |
|------|------|
| 文档版本 | 1.0 |
| 依据 | `specs/w1/0001-spec.md`（文档版本以规格书为准） |
| 输出语言 | 中文 |

---

## 1. 计划目标与范围

### 1.1 目标

在约定技术栈与目录下，**可运行、可演示**地完成 Ticket + 标签管理全流程：REST API 与 Swagger 文档可用，浏览器端 Bootstrap 页面可完成规格第 3 节所列功能，并与 SQL Server 持久化一致。

### 1.2 范围边界（与规格对齐）

| 类型 | 内容 |
|------|------|
| 必须交付 | Ticket CRUD、完成/取消完成；标签列表与创建；Ticket–Tag 关联增删；列表支持 `tagIds` + `q`；SpringDoc；静态前端或同源托管 |
| 明确不做 | 用户登录、权限、多租户、附件/评论等（见 `0001-spec` 1.3） |

### 1.3 需求追溯（便于验收打勾）

| 规格需求 ID | 实现关注点 |
|-------------|------------|
| FR-T-01～05 | `TicketService` + `TicketController`；`updatedAt` 在变更时刷新 |
| FR-G-01～03 | 关联表唯一性；`tagName` 隐式创建（若实现）；`POST /api/tags` |
| FR-L-01～03 | 列表排序；`TicketRepository` 或 Service 层 Specification / 自定义查询实现标签 AND/OR + 标题 `LIKE` |
| NFR-01～04 | Bootstrap 反馈；异常统一 JSON；删除 Ticket 后 DB 无孤儿 `ticket_tag` |

---

## 2. 代码与文档位置

| 用途 | 路径（相对仓库根） |
|------|---------------------|
| **实现工程根目录** | `./code/w1/project_alpha/` |
| 需求与设计 | `specs/w1/0001-spec.md` |
| OpenAPI 契约（对照用） | `specs/w1/openapi.yaml` |
| 本实现计划 | `specs/w1/0002-implementation-plan.md` |

**说明**：`instructions.md` 中曾写作 `procject_alpha`，目录名以 **`project_alpha`**（正确拼写）为准。

---

## 3. 推荐工程结构（Spring Boot）

在 `code/w1/project_alpha/` 下初始化 Maven 或 Gradle 工程后，建议包结构示例：

```
code/w1/project_alpha/
├── pom.xml 或 build.gradle.kts
├── src/main/java/.../projectalpha/
│   ├── ProjectAlphaApplication.java
│   ├── config/          # OpenAPI、CORS、可选 Jackson
│   ├── domain/          # Ticket, Tag 实体（或 entity/）
│   ├── repository/
│   ├── service/
│   ├── web/             # Controller、DTO、异常处理
│   └── ...
├── src/main/resources/
│   ├── application.yml
│   ├── application-dev.yml（可选）
│   └── static/          # index.html、css、js（Bootstrap 页面）
└── src/test/java/...    # 可选：@WebMvcTest、@DataJpaTest
```

规格书要求静态资源可由 `static` 托管，本计划默认 **单工程同源**，避免首周 CORS 复杂度；若课程要求前后端分离端口，再在 `config` 中增加 CORS。

---

## 4. 阶段划分与任务明细

以下阶段可按 **1～2 人周** 压缩执行；多人可并行 4.3 与 4.4 的部分准备工作。

---

### 阶段 0：环境与仓库准备

| 序号 | 任务 | 产出 / 完成标准 |
|------|------|-----------------|
| 0.1 | 安装 JDK 21（或团队统一 17）、Maven/Gradle、本地 SQL Server 或可连通的实例 | 命令行 `java -version`、构建工具可用 |
| 0.2 | 在 `code/w1/project_alpha` 用 Spring Initializr 生成工程：依赖 **Spring Web、Spring Data JPA、Validation、SQL Server Driver** | 空应用可启动（可先 H2 冒烟，再换 SQL Server） |
| 0.3 | 在 SQL Server 执行 `0001-spec` 第 5.3 节 DDL（或 Flyway V1 脚本内容等同） | 库中存在 `ticket`、`tag`、`ticket_tag` |
| 0.4 | 配置 `application.yml`：数据源 URL、用户、密码、`spring.jpa.hibernate.ddl-auto`（开发 `validate` 或 `update`，与 DDL 策略一致） | 启动时 JPA 可连库且无致命映射错误 |

**依赖**：无。  
**风险**：SQL Server 认证模式、防火墙、驱动与 TLS；提前用 `sqlcmd` 或 SSMS 测通。

---

### 阶段 1：领域模型与持久层

| 序号 | 任务 | 产出 / 完成标准 |
|------|------|-----------------|
| 1.1 | 实现 `Ticket`、`Tag` 实体；`@ManyToMany` + `@JoinTable(name="ticket_tag")`；列名与 DDL 一致（`created_at` 等可用 `@Column`） | 与 5.2 表结构一致 |
| 1.2 | 配置 `GenerationType.IDENTITY` 适配 SQL Server IDENTITY | 插入后主键回填正确 |
| 1.3 | `TicketRepository`、`TagRepository` 继承 `JpaRepository` | 基础 CRUD 可用 |
| 1.4 | （可选）为列表查询预留：`JpaSpecificationExecutor` 或自定义 `@Query` | 便于阶段 3 组合筛选 |

**依赖**：阶段 0。  
**注意**：`cascade` 勿设为删除 Tag 时级联删所有 Ticket；与规格 5.2「避免误删全局 Tag」一致。

---

### 阶段 2：业务服务层

| 序号 | 任务 | 产出 / 完成标准 |
|------|------|-----------------|
| 2.1 | `TicketService`：创建（设默认 `completed=false`、时间戳）、按 id 查询、更新、删除 | 事务边界 `@Transactional` 合理 |
| 2.2 | `complete(id)` / `incomplete(id)` 或等价方法，更新 `updatedAt` | 与 PATCH 语义一致 |
| 2.3 | `TagService`：列表、`create`（唯一名冲突抛业务异常或返回 409） | 与 `POST /api/tags` 对齐 |
| 2.4 | `addTagToTicket(ticketId, tagId \| tagName)`：防重复关联；`removeTagFromTicket` | 满足 FR-G-01/02 |
| 2.5 | **确定并实现** 多标签筛选 **AND** 或 **OR**（与 `0001-spec` 4.2 一致），并与 `q` 组合 | 单元测试或手动用例记录预期 |

**依赖**：阶段 1。  
**建议**：列表方法签名如 `listTickets(List<Long> tagIds, String titleQuery)`，内部一次查询避免 N+1（`JOIN FETCH` 或 DTO 投影）。

---

### 阶段 3：REST API 与错误处理

| 序号 | 任务 | 产出 / 完成标准 |
|------|------|-----------------|
| 3.1 | `TicketController`：实现 6.1 节全部路径；`GET` 列表解析 `tagIds`（`@RequestParam List<Long> tagIds` 或重复参数）与 `q` | 与 `openapi.yaml` 一致 |
| 3.2 | DTO：`TicketCreateRequest`、`TicketUpdateRequest` 等 + `@Valid` | 400 时 body 可读（可与规格 6.4 示例对齐） |
| 3.3 | `TagController`、`TicketTagController`（或嵌套在 Ticket 资源下）实现 6.2 节 | `POST .../tags` 支持 `tagId` / `tagName` 二选一校验 |
| 3.4 | 全局异常处理：`@ControllerAdvice`，404/409/400 映射 | 不泄露堆栈到生产响应 |
| 3.5 | `DELETE` Ticket 返回 **204** 或 **200**（团队统一） | 与前端 `fetch` 判断一致 |

**依赖**：阶段 2。  
**联调**：用 curl 或 Swagger UI 走通 CRUD 主路径。

---

### 阶段 4：SpringDoc（Swagger）

| 序号 | 任务 | 产出 / 完成标准 |
|------|------|-----------------|
| 4.1 | 引入 `springdoc-openapi-starter-webmvc-ui`（版本见 `0001-spec` 1.2.1） | `/swagger-ui/index.html` 可访问 |
| 4.2 | `@OpenAPIDefinition`、`@Tag`、`@Operation`、`@Schema` 补齐主要接口与 DTO | UI 中描述清晰 |
| 4.3 | 对比 `specs/w1/openapi.yaml` 与 `/v3/api-docs`，差异记入 README 或本计划附录 | 满足规格 9 节 Swagger 验收项 |

**依赖**：阶段 3。

---

### 阶段 5：前端（Bootstrap + JavaScript）

| 序号 | 任务 | 产出 / 完成标准 |
|------|------|-----------------|
| 5.1 | `static/index.html`：引入 Bootstrap 5.3 CDN；顶栏、工具栏、列表容器、Modal 骨架 | 与 7.1 布局一致 |
| 5.2 | 封装 `api.js`：`fetch` 基址（相对路径 `/api`）、JSON headers、错误解析 | 减少重复代码 |
| 5.3 | 列表：加载 `GET /api/tickets`；搜索框绑定 `q`；标签多选绑定 `tagIds` | FR-L 系列 |
| 5.4 | 新建/编辑 Modal：`POST` / `PUT`；删除前 `confirm` + `DELETE` | FR-T 系列 |
| 5.5 | 完成/取消完成按钮：`PATCH` 对应路径 | FR-T-04/05 |
| 5.6 | 每行展示标签；提供添加/移除标签交互（可二级 Modal 或内联） | FR-G 系列 |
| 5.7 | 成功 Toast / `alert`；失败展示 `message` | NFR-01 |

**依赖**：阶段 3（API 稳定后最佳）。可与阶段 4 并行开发 UI 原型（mock 数据），再换真实 API。

---

### 阶段 6：联调、测试与收尾

| 序号 | 任务 | 产出 / 完成标准 |
|------|------|-----------------|
| 6.1 | 按 `0001-spec` 第 9 节验收清单逐项手动验证 | 清单全部勾选 |
| 6.2 | 删除 Ticket 后在 SSMS 查 `ticket_tag` 无残留 | NFR-03 |
| 6.3 | （可选）`@DataJpaTest` 测 Repository；（可选）`MockMvc` 测 Controller | 回归保障 |
| 6.4 | 更新 `code/w1/project_alpha/README.md`：如何配置库、如何启动、Swagger 地址 | 新人可独立跑通 |
| 6.5 | 若 API 与 `openapi.yaml` 不一致，二选一：改代码或改 YAML，并注明版本 | 文档一致 |

**依赖**：阶段 4、5。

---

## 5. 里程碑建议

| 里程碑 | 完成标志 | 建议阶段 |
|--------|----------|----------|
| M1：数据库与实体可写读 | 阶段 0～1 | 第 1 段截止 |
| M2：API 无 UI 可演示 | 阶段 2～3 + 部分 4 | 中段评审 |
| M3：端到端演示 | 阶段 5～6 | 交付 |

---

## 6. 风险与缓解

| 风险 | 缓解 |
|------|------|
| 多标签 AND 查询 JPQL 复杂 | 先用子查询或 `COUNT` 分组实现；数据量小可接受简单实现 |
| `tagIds` 多值与 Spring 参数绑定差异 | 统一文档约定 `tagIds=1&tagIds=2`，并在 Swagger `@Parameter` 说明 |
| 时区与 `DATETIME2` 序列化 | Jackson 统一 `ISO-8601`；前后端约定带不带 `Z` |
| 生产暴露 Swagger | 使用 `spring.profiles` 关闭 doc，或网关限制 |

---

## 7. 交付物检查表

- [ ] `code/w1/project_alpha` 内工程可 `mvn spring-boot:run`（或 Gradle 等价）启动  
- [ ] SQL Server 中表结构与规格 DDL 一致  
- [ ] 所有 `0001-spec` 6.1、6.2 路径已实现且状态码合理  
- [ ] 前端完成主要用户故事，UI 为 Bootstrap  
- [ ] Swagger UI 与 `/v3/api-docs` 可用  
- [ ] README 含配置说明与已知限制（如 AND/OR 策略）  

---

## 附录 A：与 `0001-spec` 章节映射

| 规格章节 | 本计划参考位置 |
|----------|----------------|
| 1.2.1 技术栈版本 | 阶段 0、4 |
| 1.2.2 代码路径 | 第 2、3 节 |
| 5 数据模型与 DDL | 阶段 0、1 |
| 6 API | 阶段 2、3、4 |
| 7 前端 | 阶段 5 |
| 8 配置与安全 | 阶段 0、4、6 |
| 9 验收清单 | 阶段 6 |

---

*执行过程中若变更 API 或路径，请同步更新 `0001-spec.md`、`openapi.yaml` 与本文件，并递增各自版本号。*
