# Tasks

## 第一阶段：项目初始化与基础架构
- [x] Task 1: 初始化后端项目结构（Python/FastAPI）
  - [x] SubTask 1.1: 创建项目目录结构和依赖配置（requirements.txt/pyproject.toml）
  - [x] SubTask 1.2: 创建FastAPI主应用入口（main.py）
  - [x] SubTask 1.3: 配置CORS和基本中间件

- [x] Task 2: 初始化前端项目结构（React/Refine）
  - [x] SubTask 2.1: 使用Refine CLI创建项目骨架
  - [x] SubTask 2.2: 配置Tailwind CSS和Ant Design
  - [x] SubTask 2.3: 配置TypeScript严格模式

## 第二阶段：数据模型与数据库层
- [x] Task 3: 创建Pydantic数据模型
  - [x] SubTask 3.1: 定义数据库连接模型（ConnectionCreate, ConnectionResponse）
  - [x] SubTask 3.2: 定义元数据模型（TableMetadata, ColumnMetadata, ViewMetadata）
  - [x] SubTask 3.3: 定义SQL查询请求/响应模型
  - [x] SubTask 3.4: 定义通用API响应模型（camelCase格式）

- [x] Task 4: 实现SQLite数据访问层
  - [x] SubTask 4.1: 创建数据库连接表结构
  - [x] SubTask 4.2: 创建元数据存储表结构
  - [x] SubTask 4.3: 实现连接CRUD操作
  - [x] SubTask 4.4: 实现元数据CRUD操作

## 第三阶段：核心后端功能
- [x] Task 5: 实现数据库连接管理API
  - [x] SubTask 5.1: POST /api/connections - 创建连接
  - [x] SubTask 5.2: GET /api/connections - 获取连接列表
  - [x] SubTask 5.3: GET /api/connections/{id} - 获取连接详情
  - [x] SubTask 5.4: DELETE /api/connections/{id} - 删除连接

- [x] Task 6: 实现元数据提取功能
  - [x] SubTask 6.1: 创建PostgreSQL连接工具类
  - [x] SubTask 6.2: 实现查询表和视图信息的SQL
  - [x] SubTask 6.3: 实现元数据转换为JSON格式
  - [x] SubTask 6.4: POST /api/connections/{id}/metadata - 触发元数据提取

- [x] Task 7: 实现SQL验证与执行
  - [x] SubTask 7.1: 集成sqlglot进行SQL解析
  - [x] SubTask 7.2: 实现SELECT语句验证
  - [x] SubTask 7.3: 实现自动添加LIMIT子句
  - [x] SubTask 7.4: POST /api/execute - 执行SQL查询

## 第四阶段：LLM集成
- [x] Task 8: 实现LLM辅助SQL生成
  - [x] SubTask 8.1: 集成OpenAI SDK
  - [x] SubTask 8.2: 构建包含元数据的Prompt模板
  - [x] SubTask 8.3: POST /api/generate-sql - 生成SQL
  - [x] SubTask 8.4: 实现LLM调用的错误处理

## 第五阶段：前端实现
- [x] Task 9: 实现数据库连接管理页面
  - [x] SubTask 9.1: 创建连接列表页面
  - [x] SubTask 9.2: 创建连接表单（新增/编辑）
  - [x] SubTask 9.3: 实现连接测试功能

- [x] Task 10: 实现SQL编辑器页面
  - [x] SubTask 10.1: 集成Monaco Editor
  - [x] SubTask 10.2: 实现SQL语法高亮
  - [x] SubTask 10.3: 实现查询执行按钮
  - [x] SubTask 10.4: 实现结果表格展示（Ant Design Table）

- [x] Task 11: 实现LLM辅助查询功能
  - [x] SubTask 11.1: 创建自然语言输入框
  - [x] SubTask 11.2: 实现生成SQL按钮
  - [x] SubTask 11.3: 实现生成的SQL自动填充到编辑器
  - [x] SubTask 11.4: 实现元数据侧边栏展示

## 第六阶段：测试与优化
- [x] Task 12: 编写后端单元测试
  - [x] SubTask 12.1: 测试数据模型验证
  - [x] SubTask 12.2: 测试SQL验证逻辑
  - [x] SubTask 12.3: 测试API端点

- [x] Task 13: 集成测试与部署准备
  - [x] SubTask 13.1: 端到端测试连接和查询流程
  - [x] SubTask 13.2: 创建Docker配置文件
  - [x] SubTask 13.3: 编写README文档

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
