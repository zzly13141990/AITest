# Checklist

## 后端实现检查点
- [ ] Java项目使用标准Java编码风格
- [ ] 所有后端代码有严格的类型标注（Java泛型、注解）
- [ ] 使用Hibernate/JPA定义所有实体模型
- [ ] 所有API响应使用camelCase格式的JSON
- [ ] Spring Boot应用正确配置CORS
- [ ] 数据库连接信息安全存储在SQL Server
- [ ] SQL Server连接功能正常工作
- [ ] 元数据提取正确获取表和视图信息
- [ ] JSqlParser正确验证SQL语法
- [ ] 非SELECT语句被正确拒绝
- [ ] 缺少TOP的查询自动添加TOP 1000
- [ ] OpenAI SDK正确集成
- [ ] LLM生成的SQL包含元数据context

## 前端实现检查点
- [ ] 前端使用React + TypeScript编写
- [ ] 前端代码有严格的类型标注
- [ ] CSS样式正常
- [ ] jQuery正确集成
- [ ] Monaco Editor正确集成
- [ ] SQL语法高亮工作正常
- [ ] 查询结果以表格形式正确展示
- [ ] 连接管理页面功能完整
- [ ] SQL编辑器页面功能完整
- [ ] LLM辅助查询功能工作正常
- [ ] 元数据侧边栏正确显示

## API检查点
- [ ] POST /api/connections 创建连接并返回camelCase响应
- [ ] GET /api/connections 返回连接列表
- [ ] POST /api/connections/{id}/test 测试连接
- [ ] POST /api/connections/{id}/metadata 正确提取元数据
- [ ] GET /api/metadata/{connectionId} 返回正确元数据
- [ ] POST /api/generate-sql 返回生成的SQL
- [ ] POST /api/execute 执行查询并返回结果
- [ ] 所有API响应格式统一（code, message, data）

## 测试检查点
- [ ] 单元测试覆盖数据模型验证
- [ ] 单元测试覆盖SQL验证逻辑
- [ ] 集成测试覆盖完整查询流程
- [ ] 所有测试通过