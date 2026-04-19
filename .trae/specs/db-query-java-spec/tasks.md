# Tasks

## 第一阶段：项目初始化与基础架构
- [ ] Task 1: 初始化后端项目结构（Spring Boot/Maven）
  - [ ] SubTask 1.1: 创建Maven项目结构和pom.xml
  - [ ] SubTask 1.2: 配置Spring Boot主应用入口
  - [ ] SubTask 1.3: 配置CORS和基本中间件
  - [ ] SubTask 1.4: 配置application.yml和数据库连接

- [ ] Task 2: 初始化前端项目结构（React）
  - [ ] SubTask 2.1: 创建React项目骨架
  - [ ] SubTask 2.2: 配置CSS和jQuery
  - [ ] SubTask 2.3: 配置Monaco Editor
  - [ ] SubTask 2.4: 配置TypeScript严格模式

## 第二阶段：数据模型与数据库层
- [ ] Task 3: 创建Hibernate实体模型
  - [ ] SubTask 3.1: 定义Connection实体类
  - [ ] SubTask 3.2: 定义Metadata实体类
  - [ ] SubTask 3.3: 定义DTO类（ConnectionDTO, MetadataDTO等）
  - [ ] SubTask 3.4: 配置JPA Repository

- [ ] Task 4: 实现数据库访问层
  - [ ] SubTask 4.1: 创建ConnectionRepository接口
  - [ ] SubTask 4.2: 创建MetadataRepository接口
  - [ ] SubTask 4.3: 配置application.yml中的SQL Server连接

## 第三阶段：核心后端功能
- [ ] Task 5: 实现数据库连接管理API
  - [ ] SubTask 5.1: POST /api/connections - 创建连接
  - [ ] SubTask 5.2: GET /api/connections - 获取连接列表
  - [ ] SubTask 5.3: GET /api/connections/{id} - 获取连接详情
  - [ ] SubTask 5.4: DELETE /api/connections/{id} - 删除连接
  - [ ] SubTask 5.5: POST /api/connections/{id}/test - 测试连接

- [ ] Task 6: 实现元数据提取功能
  - [ ] SubTask 6.1: 创建SQL Server连接工具类
  - [ ] SubTask 6.2: 实现查询表和视图信息的SQL
  - [ ] SubTask 6.3: 实现元数据转换为JSON格式
  - [ ] SubTask 6.4: POST /api/connections/{id}/metadata - 触发元数据提取

- [ ] Task 7: 实现SQL验证与执行
  - [ ] SubTask 7.1: 集成JSqlParser进行SQL解析
  - [ ] SubTask 7.2: 实现SELECT语句验证
  - [ ] SubTask 7.3: 实现自动添加TOP子句
  - [ ] SubTask 7.4: POST /api/execute - 执行SQL查询

## 第四阶段：LLM集成
- [ ] Task 8: 实现LLM辅助SQL生成
  - [ ] SubTask 8.1: 集成OpenAI SDK
  - [ ] SubTask 8.2: 构建包含元数据的Prompt模板
  - [ ] SubTask 8.3: POST /api/generate-sql - 生成SQL
  - [ ] SubTask 8.4: 实现LLM调用的错误处理

## 第五阶段：前端实现
- [ ] Task 9: 实现数据库连接管理页面
  - [ ] SubTask 9.1: 创建连接列表页面
  - [ ] SubTask 9.2: 创建连接表单（新增/编辑）
  - [ ] SubTask 9.3: 实现连接测试功能

- [ ] Task 10: 实现SQL编辑器页面
  - [ ] SubTask 10.1: 集成Monaco Editor
  - [ ] SubTask 10.2: 实现SQL语法高亮
  - [ ] SubTask 10.3: 实现查询执行按钮
  - [ ] SubTask 10.4: 实现结果表格展示

- [ ] Task 11: 实现LLM辅助查询功能
  - [ ] SubTask 11.1: 创建自然语言输入框
  - [ ] SubTask 11.2: 实现生成SQL按钮
  - [ ] SubTask 11.3: 实现生成的SQL自动填充到编辑器
  - [ ] SubTask 11.4: 实现元数据侧边栏展示

## 第六阶段：测试与优化
- [ ] Task 12: 编写后端单元测试
  - [ ] SubTask 12.1: 测试数据模型验证
  - [ ] SubTask 12.2: 测试SQL验证逻辑
  - [ ] SubTask 12.3: 测试API端点

- [ ] Task 13: 集成测试与部署准备
  - [ ] SubTask 13.1: 端到端测试连接和查询流程
  - [ ] SubTask 13.2: 创建Docker配置文件
  - [ ] SubTask 13.3: 编写README文档

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 1]
- [Task 4] depends on [Task 3]
- [Task 5] depends on [Task 4]
- [Task 6] depends on [Task 5]
- [Task 7] depends on [Task 6]
- [Task 8] depends on [Task 6]
- [Task 9] depends on [Task 5]
- [Task 10] depends on [Task 7]
- [Task 11] depends on [Task 8]
- [Task 12] depends on [Task 7]
- [Task 13] depends on [Task 12]