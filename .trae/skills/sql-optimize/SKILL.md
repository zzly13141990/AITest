---
name: "sql-optimize"
description: "SQL性能深度优化，提供索引优化、查询重构、执行计划分析等。Invoke when dealing with slow queries, optimizing database performance, or designing database schemas."
---

# SQL Optimize - SQL性能深度优化

## Description

此技能用于SQL性能优化，包括索引优化、查询重构、执行计划分析、数据库设计优化等，提升数据库查询性能。

## Usage Scenario

- 遇到慢查询时
- 优化数据库性能
- 设计数据库表结构
- 进行压力测试前
- 数据库迁移前

## Instructions

### 1. 性能诊断步骤

#### 第一步：识别慢查询

```sql
-- MySQL: 查看慢查询日志
SHOW VARIABLES LIKE 'slow_query%';

-- PostgreSQL: 查看长时间运行的查询
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '5 seconds';

-- SQL Server: 查看慢查询
SELECT TOP 10
    total_worker_time/execution_count AS avg_cpu_time,
    SUBSTRING(qt.text, (qs.statement_start_offset/2)+1, 
    ((CASE qs.statement_end_offset WHEN -1 THEN DATALENGTH(qt.text) ELSE qs.statement_end_offset END - qs.statement_start_offset)/2)+1) AS query_text
FROM sys.dm_exec_query_stats AS qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) AS qt
ORDER BY avg_cpu_time DESC;
```

#### 第二步：分析执行计划

```sql
-- MySQL
EXPLAIN ANALYZE
SELECT * FROM users WHERE email = 'test@example.com';

-- PostgreSQL
EXPLAIN ANALYZE
SELECT * FROM users WHERE email = 'test@example.com';

-- SQL Server
SET SHOWPLAN_XML ON;
GO
SELECT * FROM users WHERE email = 'test@example.com';
GO
```

#### 第三步：检查表和索引状态

```sql
-- 检查表大小
SELECT 
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM information_schema.tables
WHERE table_schema = 'your_database';

-- 检查索引使用情况 (MySQL)
SELECT * FROM sys.schema_unused_indexes;
```

### 2. 常见优化策略

#### 优化策略1: 添加合适的索引

```sql
-- ❌ 慢查询 - 全表扫描
SELECT * FROM users WHERE email = 'test@example.com';

-- ✅ 添加索引
CREATE INDEX idx_users_email ON users(email);

-- ✅ 复合索引
CREATE INDEX idx_users_status_created ON users(status, created_at);
```

#### 优化策略2: 避免SELECT *

```sql
-- ❌ 不好
SELECT * FROM users;

-- ✅ 好 - 只查询需要的列
SELECT id, name, email FROM users;
```

#### 优化策略3: 使用LIMIT分页

```sql
-- ❌ 可能返回大量数据
SELECT * FROM orders;

-- ✅ 好 - 分页查询
SELECT * FROM orders ORDER BY created_at DESC LIMIT 20 OFFSET 0;
```

#### 优化策略4: 避免在WHERE子句中使用函数

```sql
-- ❌ 不好 - 索引失效
SELECT * FROM users WHERE YEAR(created_at) = 2024;

-- ✅ 好
SELECT * FROM users WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01';
```

#### 优化策略5: 使用JOIN替代子查询

```sql
-- ❌ 子查询可能性能较差
SELECT * FROM orders 
WHERE user_id IN (SELECT id FROM users WHERE status = 'active');

-- ✅ JOIN通常性能更好
SELECT o.* FROM orders o
INNER JOIN users u ON o.user_id = u.id
WHERE u.status = 'active';
```

### 3. 索引最佳实践

#### 索引设计原则

1. **选择性高的列优先** - 区分度高的列（如email、id）
2. **复合索引顺序重要** - 将区分度高的列放在前面
3. **覆盖索引** - 包含查询所需的所有列
4. **避免过度索引** - 索引会增加写入开销
5. **定期维护索引** - 重建/优化索引

#### 索引类型

```sql
-- 普通索引
CREATE INDEX idx_column ON table(column);

-- 唯一索引
CREATE UNIQUE INDEX idx_unique_column ON table(column);

-- 复合索引
CREATE INDEX idx_col1_col2 ON table(col1, col2);

-- 全文索引 (MySQL)
CREATE FULLTEXT INDEX idx_ft_content ON articles(content);

-- 部分索引 (PostgreSQL)
CREATE INDEX idx_active_users ON users(email) WHERE status = 'active';
```

#### 索引使用判断

```sql
-- 检查索引是否被使用 (MySQL)
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';
-- 检查type列: ALL=全表扫描, ref=使用索引, range=范围扫描
-- 检查key列: 显示使用的索引
```

### 4. 数据库设计优化

#### 表设计原则

1. **规范化** - 避免数据冗余，遵循三范式
2. **适当反规范化** - 为了性能可以适当冗余
3. **选择合适的数据类型**
   - 避免使用过大的数据类型
   - 使用TINYINT代替BOOLEAN
   - 使用DECIMAL处理金额
   - 使用DATETIME/TIMESTAMP处理时间

#### 示例: 优化数据类型

```sql
-- ❌ 不好
CREATE TABLE users (
    id BIGINT,
    age INT,
    is_active VARCHAR(10),
    amount VARCHAR(50)
);

-- ✅ 好
CREATE TABLE users (
    id INT,
    age TINYINT,
    is_active BOOLEAN,
    amount DECIMAL(10, 2)
);
```

### 5. 查询重构技巧

#### 技巧1: 使用EXISTS代替IN

```sql
-- ❌ IN在大数据量时性能可能较差
SELECT * FROM users u
WHERE u.id IN (SELECT user_id FROM orders);

-- ✅ EXISTS通常性能更好
SELECT * FROM users u
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id);
```

#### 技巧2: 批量操作代替循环

```sql
-- ❌ 循环更新
FOR EACH user IN users DO
    UPDATE user SET status = 'inactive' WHERE last_login < '2024-01-01';
END FOR;

-- ✅ 批量更新
UPDATE users 
SET status = 'inactive' 
WHERE last_login < '2024-01-01';
```

#### 技巧3: 使用UNION ALL代替UNION

```sql
-- ❌ UNION会去重，额外开销
SELECT name FROM users_a
UNION
SELECT name FROM users_b;

-- ✅ UNION ALL性能更好（如果确定没有重复）
SELECT name FROM users_a
UNION ALL
SELECT name FROM users_b;
```

### 6. 分区表策略

```sql
-- MySQL 分区表示例
CREATE TABLE orders (
    id INT,
    order_date DATE,
    amount DECIMAL(10,2)
)
PARTITION BY RANGE (YEAR(order_date)) (
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION pmax VALUES LESS THAN MAXVALUE
);
```

### 7. 缓存策略

#### 应用层缓存

```java
// 使用Redis缓存热点数据
@Cacheable(value = "users", key = "#userId")
public User getUserById(Long userId) {
    return userRepository.findById(userId).orElse(null);
}
```

#### 数据库层缓存

```sql
-- MySQL 查询缓存配置
SET GLOBAL query_cache_size = 67108864;
SET GLOBAL query_cache_type = 1;
```

### 8. 性能监控指标

- **查询响应时间** - 目标: P95 < 100ms
- **QPS (Queries Per Second)** - 每秒查询数
- **慢查询率** - 慢查询占比 < 1%
- **连接数** - 监控数据库连接数
- **锁等待时间** - 避免长时间锁等待
- **缓存命中率** - 目标: > 90%

## Examples

### 优化前后对比示例

#### 场景: 用户订单查询

**优化前**
```sql
-- 执行时间: 2.5秒
SELECT * FROM orders o
INNER JOIN users u ON o.user_id = u.id
WHERE u.status = 'active'
AND o.created_at > '2024-01-01'
ORDER BY o.created_at DESC;
```

**问题分析**
- 没有合适的索引
- 使用了SELECT *
- 没有分页

**优化后**
```sql
-- 执行时间: 0.05秒 (50倍提升)
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at);
CREATE INDEX idx_users_status ON users(status);

SELECT o.id, o.order_no, o.amount, u.name 
FROM orders o
INNER JOIN users u ON o.user_id = u.id
WHERE u.status = 'active'
AND o.created_at > '2024-01-01'
ORDER BY o.created_at DESC
LIMIT 20;
```
