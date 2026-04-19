# Database Query Tool (db-query) Specification

## Why

用户需要一个数据库管理工具，可以通过LLM辅助生成SQL查询，并安全地执行只读查询操作。系统需要从PostgreSQL数据库中提取元数据，存储在SQLite中供后续使用，同时确保只有SELECT语句可以被执行。

## What Changes

### Core Features

- 数据库连接管理（PostgreSQL连接字符串存储在SQLite）
- 自动提取并存储数据库表和视图的元数据
- 基于元数据的LLM辅助SQL生成
- SQL语法验证（仅允许SELECT语句）
- 自动添加LIMIT子句（默认1000）
- 查询结果以JSON格式返回并展示为表格

### Technical Stack

- **Backend**: Python (nv) / FastAPI / sqlglot / openai sdk
- **Frontend**: React / refine 5 / tailwind / ant design / monaco editor
- **Database**: SQLite (用于存储元数据和连接信息)

### Design Principles

- Ergonomic Python 风格
- 前后端严格类型标注
- 使用 Pydantic 定义数据模型
- JSON数据使用 camelCase 格式
- 无需 authentication

## Impact

- 新建项目：db-query
- 涉及文件：
  - Backend: main.py, models.py, database.py, schemas.py, routers/
  - Frontend: React components, refine resource configuration

## ADDED Requirements

### Requirement: Database Connection Management

系统 SHALL 提供数据库连接管理功能，允许用户配置PostgreSQL连接字符串。

#### Scenario: Save connection string

- **WHEN** 用户输入PostgreSQL连接字符串并保存
- **THEN** 系统将连接字符串加密存储到SQLite数据库

### Requirement: Metadata Extraction

系统 SHALL 从PostgreSQL数据库自动提取表和视图的元数据信息。

#### Scenario: Extract metadata

- **WHEN** 用户成功连接数据库
- **THEN** 系统自动提取所有表和视图信息，转换为JSON格式存储到SQLite

### Requirement: LLM-assisted SQL Generation

系统 SHALL 利用LLM根据用户需求生成SQL查询语句。

#### Scenario: Generate SQL

- **WHEN** 用户输入自然语言查询需求
- **THEN** 系统使用数据库元数据作为context，调用LLM生成SQL语句

### Requirement: SQL Validation

系统 SHALL 使用sqlglot验证SQL语法，确保仅包含SELECT语句。

#### Scenario: Validate SELECT query

- **WHEN** 用户提交SQL查询
- **THEN** 系统验证SQL语法，如果包含非SELECT语句返回错误

#### Scenario: Add LIMIT clause

- **WHEN** 验证通过的SQL查询不包含LIMIT子句
- **THEN** 系统自动添加 LIMIT 1000 子句

### Requirement: Query Execution & Result Display

系统 SHALL 执行验证后的SQL查询并以JSON格式返回结果。

#### Scenario: Execute query

- **WHEN** SQL验证通过
- **THEN** 系统执行查询并以camelCase JSON格式返回结果

#### Scenario: Display results

- **WHEN** 前端接收到JSON结果
- **THEN** 系统将结果以表格形式展示

## API Endpoints

### POST /api/connections

保存数据库连接信息

**Request Body:**

```json
{
  "name": "string",
  "host": "string",
  "port": 5432,
  "database": "string",
  "username": "string",
  "password": "string"
}
```

**Response:**

```json
{
  "code": 200,
  "data": {
    "id": 1,
    "name": "string"
  }
}
```

### GET /api/connections

获取所有连接列表

**Response:**

```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "name": "string",
      "host": "string",
      "port": 5432,
      "database": "string",
      "username": "string"
    }
  ]
}
```

### POST /api/connections/{id}/metadata

触发元数据提取

**Response:**

```json
{
  "code": 200,
  "message": "Metadata extracted successfully",
  "data": {
    "tablesCount": 10,
    "viewsCount": 5
  }
}
```

### GET /api/metadata/{connectionId}

获取指定连接的元数据

**Response:**

```json
{
  "code": 200,
  "data": {
    "tables": [
      {
        "name": "string",
        "columns": [
          {
            "name": "string",
            "type": "string",
            "nullable": true
          }
        ]
      }
    ],
    "views": [...]
  }
}
```

### POST /api/generate-sql

使用LLM生成SQL

**Request Body:**

```json
{
  "connectionId": 1,
  "prompt": "string"
}
```

**Response:**

```json
{
  "code": 200,
  "data": {
    "sql": "SELECT * FROM users WHERE id = 1"
  }
}
```

### POST /api/execute

执行SQL查询

**Request Body:**

```json
{
  "connectionId": 1,
  "sql": "string"
}
```

**Response:**

```json
{
  "code": 200,
  "data": {
    "columns": ["id", "name", "email"],
    "rows": [
      {"id": 1, "name": "John", "email": "john@example.com"}
    ],
    "rowCount": 1
  }
}
```

