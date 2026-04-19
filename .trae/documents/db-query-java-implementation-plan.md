# DB Query Java 实现计划

## 项目概述
基于用户需求，我们需要实现一个数据库查询工具，使用 Java/Spring Boot 后端和 React 前端，支持数据库连接管理、元数据提取、SQL 验证执行以及 LLM 辅助 SQL 生成功能。

## 项目结构
- **后端**：Spring Boot 3.2.0 + Hibernate + SQL Server
- **前端**：React + TypeScript + Monaco Editor

## 实现步骤

### 1. 后端实现

#### 1.1 数据模型设计
- 创建 `Connection` 实体，存储数据库连接信息
- 创建 `Metadata` 实体，存储数据库元数据信息
- 配置 Hibernate 实体映射和数据库连接

#### 1.2 数据库访问层
- 实现 `ConnectionRepository` 接口
- 实现 `MetadataRepository` 接口
- 配置 JPA 事务管理

#### 1.3 业务逻辑层
- 实现 `ConnectionService`：管理数据库连接的创建、更新、删除和测试
- 实现 `MetadataService`：提取和存储数据库元数据
- 实现 `SqlValidatorService`：使用 JSqlParser 验证 SQL 语句
- 实现 `QueryExecutorService`：执行 SQL 查询并返回结果
- 实现 `LlmService`：使用 OpenAI API 生成 SQL 查询

#### 1.4 API 接口
- 实现 `ConnectionController`：提供数据库连接管理的 REST 接口
- 实现 `MetadataController`：提供元数据提取和查询的 REST 接口
- 实现 `QueryController`：提供 SQL 执行和 LLM 辅助功能的 REST 接口
- 配置 CORS 跨域支持

#### 1.5 配置管理
- 配置 SQL Server 连接信息
- 配置 OpenAI API 密钥
- 配置应用服务器端口和其他参数

### 2. 前端实现

#### 2.1 组件设计
- `ConnectionForm`：创建和编辑数据库连接
- `ConnectionList`：展示和管理数据库连接
- `SqlEditor`：使用 Monaco Editor 编辑 SQL 语句
- `QueryResult`：展示 SQL 查询结果
- `MetadataSidebar`：展示数据库元数据信息
- `Layout`：应用布局组件

#### 2.2 页面设计
- `ConnectionsPage`：数据库连接管理页面
- `SqlEditorPage`：SQL 编辑器页面

#### 2.3 状态管理
- 使用 React hooks 管理组件状态
- 实现 API 调用服务
- 处理错误和加载状态

#### 2.4 功能实现
- 数据库连接的创建、编辑、删除和测试
- SQL 语句的编辑和验证
- LLM 辅助 SQL 生成
- 查询结果的表格展示
- 元数据信息的展示和使用

### 3. 测试和部署

#### 3.1 单元测试
- 编写后端服务的单元测试
- 测试 SQL 验证功能
- 测试 LLM 集成功能

#### 3.2 集成测试
- 测试前后端集成
- 测试数据库连接和查询功能
- 测试 LLM 辅助功能

#### 3.3 部署准备
- 配置生产环境参数
- 准备部署脚本
- 文档编写

## 技术要点

### 后端技术
- Spring Boot 3.2.0：提供 RESTful API 框架
- Hibernate：ORM 框架，用于数据库操作
- JSqlParser：用于 SQL 语句解析和验证
- OpenAI SDK：用于 LLM 集成
- SQL Server JDBC：用于数据库连接

### 前端技术
- React 18+：前端框架
- TypeScript：类型安全
- Monaco Editor：SQL 编辑器
- CSS：样式设计
- jQuery：DOM 操作

### 核心功能
1. **数据库连接管理**：创建、编辑、删除和测试数据库连接
2. **元数据提取**：从数据库中提取表和视图信息，存储为 JSON 格式
3. **SQL 验证**：确保 SQL 语句语法正确且仅包含 SELECT 语句
4. **自动添加 LIMIT**：为没有 LIMIT 子句的查询添加默认 LIMIT 1000
5. **LLM 辅助 SQL 生成**：使用数据库元数据作为上下文，生成 SQL 查询
6. **查询结果展示**：将查询结果转换为 JSON 格式，前端以表格形式展示

## 实现计划时间线

1. **数据模型和数据库访问层**：1-2 天
2. **业务逻辑层**：2-3 天
3. **API 接口**：1-2 天
4. **前端组件**：2-3 天
5. **前端页面**：1-2 天
6. **测试和部署**：1-2 天

## 风险和挑战

1. **数据库连接管理**：不同数据库的连接参数和验证方式可能不同
2. **元数据提取**：不同数据库的元数据结构可能不同
3. **SQL 验证**：需要处理不同数据库的 SQL 语法差异
4. **LLM 集成**：需要确保 API 密钥安全，处理 API 调用失败的情况
5. **性能优化**：需要优化大量数据的查询和展示

## 解决方案

1. **数据库连接管理**：使用工厂模式创建不同数据库的连接
2. **元数据提取**：使用适配器模式处理不同数据库的元数据结构
3. **SQL 验证**：使用 JSqlParser 处理 SQL 语法，添加数据库特定的验证规则
4. **LLM 集成**：使用环境变量存储 API 密钥，添加重试机制
5. **性能优化**：实现分页查询，使用流式处理大型结果集

## 预期成果

- 一个功能完整的数据库查询工具
- 支持多种数据库连接
- 提供 LLM 辅助 SQL 生成功能
- 响应式前端界面
- 良好的错误处理和用户体验
