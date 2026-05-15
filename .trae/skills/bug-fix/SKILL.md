---
name: "bug-fix"
description: "Bug极速定位排查，提供问题分析、排查步骤、调试技巧等。Invoke when fixing bugs, troubleshooting issues, or debugging complex problems."
---

# Bug Fix - Bug极速定位排查

## Description

此技能用于Bug定位和排查，提供问题分析、排查步骤、调试技巧，帮助快速定位和解决问题。

## Usage Scenario

- 发现Bug时
- 排查生产问题
- 调试复杂问题
- 性能问题分析
- 系统故障排查

## Instructions

### 1. Bug排查流程

#### 第一步: 收集信息

```markdown
## Bug报告

### 问题描述
[详细描述问题现象]

### 复现步骤
1. [步骤1]
2. [步骤2]
3. [步骤3]

### 预期结果
[描述预期的正确结果]

### 实际结果
[描述实际的错误结果]

### 环境信息
- 操作系统: [Windows/Mac/Linux]
- 浏览器: [Chrome/Firefox/Safari]
- 浏览器版本: [版本号]
- Node.js版本: [版本号]
- Java版本: [版本号]

### 错误信息
[粘贴错误信息、堆栈跟踪]

### 截图
[添加截图]

### 相关日志
```
[粘贴相关日志]
```
```

#### 第二步: 复现问题

1. 在开发环境复现
2. 确认问题稳定复现
3. 记录复现的最小步骤
4. 简化问题场景

#### 第三步: 定位根因

1. 检查错误日志
2. 审查相关代码
3. 使用调试工具
4. 添加日志输出
5. 二分法定位

#### 第四步: 修复问题

1. 分析根本原因
2. 制定修复方案
3. 实施修复
4. 验证修复
5. 回归测试

#### 第五步: 总结预防

1. 记录问题和解决方案
2. 分析问题引入原因
3. 制定预防措施
4. 更新文档和测试

### 2. 调试工具和技巧

#### 前端调试

```javascript
// Console 调试
console.log('变量值:', variable);
console.warn('警告信息');
console.error('错误信息');
console.table(data); // 表格输出
console.time('计时'); // 性能计时
console.timeEnd('计时');

// Debugger 断点
debugger; // 在代码中添加断点

// 使用DevTools
// 1. Elements - 检查DOM
// 2. Console - 查看日志
// 3. Sources - 设置断点
// 4. Network - 检查网络请求
// 5. Performance - 性能分析
// 6. Memory - 内存分析
```

#### 后端调试

```java
// 日志输出
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

private static final Logger logger = LoggerFactory.getLogger(Class.class);

logger.debug("调试信息: {}", variable);
logger.info("普通信息");
logger.warn("警告信息");
logger.error("错误信息", exception);

// 使用IDE调试
// 1. 设置断点
// 2. 启动Debug模式
// 3. 逐步执行
// 4. 查看变量值
// 5. 评估表达式
```

#### 数据库调试

```sql
-- 查看执行计划
EXPLAIN ANALYZE SELECT * FROM users WHERE id = 1;

-- 查看慢查询
SHOW PROCESSLIST;

-- 查看锁信息
SHOW OPEN TABLES WHERE In_use > 0;

-- 查看表状态
SHOW TABLE STATUS LIKE 'users';
```

### 3. 常见问题排查

#### 前端常见问题

##### 问题1: 页面白屏

**排查步骤:**
1. 检查Console错误
2. 检查Network请求
3. 检查资源加载
4. 检查路由配置
5. 检查入口文件

**常见原因:**
- JavaScript错误
- 资源加载失败
- 路由配置错误
- 构建错误

##### 问题2: 样式不生效

**排查步骤:**
1. 检查元素样式
2. 检查CSS选择器优先级
3. 检查样式是否被覆盖
4. 检查CSS文件是否加载
5. 检查浏览器缓存

**常见原因:**
- CSS优先级问题
- 样式被其他样式覆盖
- 选择器错误
- 缓存问题

##### 问题3: 接口请求失败

**排查步骤:**
1. 检查Network面板
2. 检查请求URL
3. 检查请求参数
4. 检查响应状态码
5. 检查CORS配置

**常见原因:**
- 接口地址错误
- 参数错误
- 认证失败
- CORS问题
- 网络问题

#### 后端常见问题

##### 问题1: 500错误

**排查步骤:**
1. 查看应用日志
2. 检查异常堆栈
3. 查看数据库日志
4. 检查依赖服务

**常见原因:**
- 空指针异常(NPE)
- 数据库连接失败
- 配置错误
- 依赖服务不可用

##### 问题2: 接口响应慢

**排查步骤:**
1. 查看接口日志
2. 分析SQL执行计划
3. 检查索引使用
4. 查看数据库性能
5. 检查网络延迟

**常见原因:**
- 慢SQL查询
- 缺少索引
- 数据库锁等待
- 网络延迟
- 外部服务调用慢

##### 问题3: 内存泄漏

**排查步骤:**
1. 监控内存使用
2. 分析堆内存dump
3. 检查对象创建
4. 检查连接释放
5. 检查缓存使用

**常见原因:**
- 连接未关闭
- 缓存无限增长
- 监听器未移除
- 线程池配置问题

### 4. 日志分析技巧

#### 日志级别使用

```java
// ERROR - 错误，需要立即关注
logger.error("严重错误", exception);

// WARN - 警告，可能有问题
logger.warn("警告信息: {}", message);

// INFO - 重要流程信息
logger.info("用户登录: userId={}", userId);

// DEBUG - 调试信息
logger.debug("处理参数: {}", params);

// TRACE - 详细追踪
logger.trace("详细执行步骤");
```

#### 日志格式建议

```java
// 包含关键信息
logger.info("操作: {}, 用户: {}, 结果: {}, 耗时: {}ms",
    operation, userId, result, duration);
```

### 5. 二分法定位技巧

```java
/**
 * 二分法定位问题
 * 1. 注释一半代码
 * 2. 测试问题是否还存在
 * 3. 缩小范围继续定位
 * 4. 找到有问题的代码
 */
public void debugBinarySearch() {
    // 先注释一半代码
    // step1();
    step2(); // 测试这部分是否有问题
    // step3();
    // step4();

    // 根据结果继续缩小范围
}
```

### 6. 性能问题排查

#### 使用性能分析工具

```javascript
// 浏览器Performance API
performance.mark('start');
// ...执行代码
performance.mark('end');
performance.measure('执行时间', 'start', 'end');

// 打印性能指标
console.log(performance.getEntriesByType('measure'));
```

#### 数据库性能分析

```sql
-- 查看慢查询
SELECT * FROM slow_log ORDER BY start_time DESC LIMIT 10;

-- 查看表大小
SELECT table_name,
       ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM information_schema.tables
WHERE table_schema = 'your_database'
ORDER BY size_mb DESC;
```

### 7. 修复验证清单

- [ ] 问题已复现
- [ ] 根本原因已找到
- [ ] 修复方案已验证
- [ ] 相关测试已通过
- [ ] 回归测试已完成
- [ ] 文档已更新
- [ ] 预防措施已添加

### 8. Bug预防措施

#### 代码层面
- [ ] 添加单元测试
- [ ] 添加集成测试
- [ ] 代码审查流程
- [ ] 使用类型安全

#### 流程层面
- [ ] CI/CD自动化测试
- [ ] 预发布环境验证
- [ ] 监控告警配置
- [ ] 日志完善

## Examples

### Bug修复完整示例

#### 问题现象
用户反馈深色模式切换后，某些组件样式没有正确更新。

#### 排查过程
1. 检查Console，无JavaScript错误
2. 检查Network，资源加载正常
3. 检查相关组件代码
4. 发现组件中使用了硬编码颜色

#### 根本原因
SqlEditorPage.tsx和Layout.tsx中存在硬编码的颜色值：
- `#666` → 应该使用`var(--text-secondary)`
- `#999` → 应该使用`var(--text-muted)`
- `#f5f5f5` → 应该使用`var(--bg-primary)`

#### 修复方案
将所有硬编码颜色替换为CSS变量。

#### 修复代码
```tsx
// 修复前
color: '#666',

// 修复后
color: 'var(--text-secondary)',
```

#### 验证
1. 切换深色模式，检查所有组件样式
2. 切换浅色模式，确认样式正常
3. 系统模式下，跟随系统主题
4. 主题切换平滑过渡

#### 预防措施
1. 在代码审查中检查硬编码颜色
2. 提供CSS变量使用指南
3. 使用ESLint规则检测硬编码颜色
4. 添加主题切换的E2E测试
