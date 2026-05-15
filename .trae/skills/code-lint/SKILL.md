---
name: "code-lint"
description: "代码规范严格审查，包括代码风格、最佳实践、性能问题、安全隐患等。Invoke when reviewing code, before merging PR, or when refactoring code."
---

# Code Lint - 代码规范严格审查

## Description

此技能用于代码审查，检查代码风格、最佳实践、性能问题、安全隐患，确保代码质量符合项目标准。

## Usage Scenario

- 代码审查前
- 合并PR前
- 重构代码时
- 新功能开发完成后
- 定期代码质量检查

## Instructions

### 1. JavaScript/TypeScript 检查清单

#### 代码风格
- [ ] 使用一致的缩进（2空格或4空格）
- [ ] 使用分号（或项目配置的无分号风格）
- [ ] 使用一致的引号（单引号或双引号）
- [ ] 遵循ESLint配置的规则
- [ ] 使用Prettier格式化代码

#### 最佳实践
- [ ] 避免使用`var`，使用`let/const`
- [ ] 避免全局变量污染
- [ ] 使用箭头函数避免`this`问题
- [ ] 使用模板字符串代替字符串拼接
- [ ] 使用解构赋值简化代码
- [ ] 避免嵌套过深的代码
- [ ] 函数保持单一职责
- [ ] 避免重复代码（DRY原则）

#### 类型安全（TypeScript）
- [ ] 使用严格的TypeScript配置
- [ ] 避免使用`any`类型
- [ ] 正确定义接口和类型
- [ ] 使用可选链`?.`和空值合并`??`
- [ ] 避免类型断言（as）的滥用

#### 性能优化
- [ ] 避免在循环中创建函数
- [ ] 使用防抖/节流处理频繁触发的事件
- [ ] 避免不必要的重渲染（React）
- [ ] 使用`useMemo`和`useCallback`适当优化
- [ ] 避免在`render`中执行复杂计算

#### 安全隐患
- [ ] 避免直接使用用户输入拼接SQL
- [ ] 避免`innerHTML`带来的XSS风险
- [ ] 正确处理敏感数据（不日志输出密码等）
- [ ] 验证和清理用户输入
- [ ] 使用安全的第三方库

### 2. Java/Spring Boot 检查清单

#### 代码风格
- [ ] 遵循Java编码规范
- [ ] 使用有意义的变量和方法名
- [ ] 类名使用大驼峰，变量使用小驼峰
- [ ] 常量使用全大写下划线分隔
- [ ] 合理使用空格和空行提高可读性

#### 最佳实践
- [ ] 使用依赖注入而非手动创建对象
- [ ] 合理分层（Controller → Service → Repository）
- [ ] 使用DTO而非直接暴露实体
- [ ] 异常处理规范统一
- [ ] 日志记录完整且必要
- [ ] 避免NPE（使用Optional或空值检查）
- [ ] 资源正确关闭（使用try-with-resources）

#### 性能优化
- [ ] 避免N+1查询问题
- [ ] 使用合适的缓存策略
- [ ] 合理使用索引
- [ ] 避免在事务中进行长时间操作
- [ ] 使用连接池配置合理

#### 安全隐患
- [ ] SQL注入防护（使用参数化查询）
- [ ] XSS防护（输入验证和输出编码）
- [ ] CSRF防护（使用Spring Security）
- [ ] 敏感数据加密存储
- [ ] 权限控制正确实现
- [ ] 避免信息泄露（错误信息不过分详细）

### 3. React 组件检查清单

#### 组件设计
- [ ] 组件保持单一职责
- [ ] Props定义清晰且有类型
- [ ] 合理使用state和props
- [ ] 避免不必要的props drilling
- [ ] 正确使用Hooks（遵循Hooks规则）

#### 性能优化
- [ ] 使用React.memo优化纯组件
- [ ] 合理使用useMemo和useCallback
- [ ] 避免在effect中过度依赖
- [ ] 使用虚拟化长列表
- [ ] 图片懒加载

#### 可访问性
- [ ] 使用语义化HTML
- [ ] 添加必要的ARIA属性
- [ ] 键盘导航支持
- [ ] 颜色对比度符合标准
- [ ] 表单标签正确关联

### 4. SQL/数据库检查清单

#### 性能
- [ ] 查询是否使用了合适的索引
- [ ] 是否存在全表扫描
- [ ] JOIN操作是否合理
- [ ] 是否可以通过添加索引优化
- [ ] 查询结果是否过大，考虑分页

#### 安全
- [ ] 使用参数化查询而非字符串拼接
- [ ] 避免SELECT *，只查询需要的列
- [ ] 权限控制是否合理
- [ ] 敏感数据是否加密

#### 可维护性
- [ ] SQL格式是否规范易读
- [ ] 复杂查询是否有注释
- [ ] 是否可以通过视图或存储过程简化
- [ ] 事务边界是否合理

### 5. 自动化检查工具

#### 前端推荐配置
```json
{
  "eslintConfig": {
    "extends": [
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:react/recommended",
      "prettier"
    ]
  }
}
```

#### 后端推荐配置
```xml
<!-- Checkstyle -->
<!-- SpotBugs -->
<!-- PMD -->
```

### 6. 代码审查报告模板

```markdown
## 代码审查报告 - [文件/PR名称]

### 严重问题（必须修复）
- [ ] 问题描述
- [ ] 问题描述

### 重要问题（建议修复）
- [ ] 问题描述
- [ ] 问题描述

### 轻微问题（可选优化）
- [ ] 问题描述
- [ ] 问题描述

### 代码质量评分
- 功能性：X/10
- 可读性：X/10
- 可维护性：X/10
- 性能：X/10
- 安全性：X/10
- 总体：X/10

### 建议
[改进建议]
```

## Examples

### 发现的常见问题示例

#### 问题1: 硬编码颜色
```tsx
// ❌ 不好
color: '#666',

// ✅ 好
color: 'var(--text-secondary)',
```

#### 问题2: 不安全的SQL
```java
// ❌ 不好 - SQL注入风险
String sql = "SELECT * FROM users WHERE id = " + userId;

// ✅ 好 - 使用参数化查询
String sql = "SELECT * FROM users WHERE id = ?";
```

#### 问题3: 不使用类型
```tsx
// ❌ 不好
function processData(data: any) {
  // ...
}

// ✅ 好
interface Data {
  id: number;
  name: string;
}
function processData(data: Data) {
  // ...
}
```
