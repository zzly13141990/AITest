# DB Query Java - Product Requirement Document

## Overview
- **Summary**: 一个基于Java/Spring Boot的数据库查询工具，支持多种数据库连接管理、元数据提取、SQL验证执行以及LLM辅助SQL生成功能。
- **Purpose**: 简化数据库查询操作，提高开发和数据分析效率，通过LLM技术降低SQL编写门槛。
- **Target Users**: 开发人员、数据分析师、数据库管理员等需要频繁执行SQL查询的用户。

## Goals
- 提供直观的数据库连接管理界面
- 支持从数据库提取和存储元数据信息
- 验证SQL语句语法并确保仅执行SELECT语句
- 集成LLM技术辅助生成SQL查询
- 提供美观的SQL编辑器和查询结果展示

## Non-Goals (Out of Scope)
- 不支持修改数据库结构的操作（如CREATE、ALTER、DROP等）
- 不支持存储过程和触发器的执行
- 不提供用户认证和权限管理
- 不支持NoSQL数据库

## Background & Context
- 基于用户需求，需要一个轻量级的数据库查询工具，能够方便地管理数据库连接、执行查询并利用LLM技术辅助SQL编写。
- 项目采用Java/Spring Boot后端和React前端的技术栈，确保良好的性能和用户体验。

## Functional Requirements
- **FR-1**: 数据库连接管理 - 支持创建、编辑、删除和测试数据库连接
- **FR-2**: 元数据提取 - 从数据库中提取表和视图信息，存储为JSON格式
- **FR-3**: SQL验证 - 确保SQL语句语法正确且仅包含SELECT语句
- **FR-4**: 自动添加LIMIT - 为没有LIMIT子句的查询添加默认LIMIT 1000
- **FR-5**: LLM辅助SQL生成 - 使用数据库元数据作为上下文，生成SQL查询
- **FR-6**: 查询结果展示 - 将查询结果转换为JSON格式，前端以表格形式展示

## Non-Functional Requirements
- **NFR-1**: 性能 - 查询执行响应时间不超过3秒（对于常规查询）
- **NFR-2**: 安全性 - 保护数据库连接信息，避免SQL注入攻击
- **NFR-3**: 可用性 - 提供清晰的错误提示和用户友好的界面
- **NFR-4**: 可扩展性 - 支持添加新的数据库类型和功能

## Constraints
- **Technical**: Java 17+, Spring Boot 3.2.0, React 18+, TypeScript
- **Business**: 无特定时间和预算限制
- **Dependencies**: SQL Server, OpenAI API, JSqlParser

## Assumptions
- 用户具备基本的SQL知识
- 系统环境已配置Java和Node.js运行环境
- 有可用的SQL Server数据库用于存储连接和元数据信息
- 有有效的OpenAI API密钥用于LLM功能

## Acceptance Criteria

### AC-1: 数据库连接管理
- **Given**: 用户访问连接管理页面
- **When**: 用户创建新的数据库连接
- **Then**: 系统应验证连接参数并测试连接，成功后存储连接信息
- **Verification**: `programmatic`

### AC-2: 元数据提取
- **Given**: 用户选择一个已配置的数据库连接
- **When**: 用户请求提取元数据
- **Then**: 系统应提取数据库中的表和视图信息，并以JSON格式存储
- **Verification**: `programmatic`

### AC-3: SQL验证
- **Given**: 用户在SQL编辑器中输入SQL语句
- **When**: 用户执行查询
- **Then**: 系统应验证SQL语法是否正确，且仅包含SELECT语句
- **Verification**: `programmatic`

### AC-4: 自动添加LIMIT
- **Given**: 用户输入不包含LIMIT子句的SELECT语句
- **When**: 用户执行查询
- **Then**: 系统应自动添加LIMIT 1000子句
- **Verification**: `programmatic`

### AC-5: LLM辅助SQL生成
- **Given**: 用户输入自然语言描述的查询需求
- **When**: 用户请求LLM生成SQL
- **Then**: 系统应使用数据库元数据作为上下文，生成对应的SQL查询
- **Verification**: `human-judgment`

### AC-6: 查询结果展示
- **Given**: 用户执行有效的SELECT查询
- **When**: 查询执行完成
- **Then**: 系统应将结果转换为JSON格式，并在前端以表格形式展示
- **Verification**: `human-judgment`

## Open Questions
- [ ] 具体支持哪些类型的数据库？
- [ ] LLM生成SQL的质量如何评估？
- [ ] 如何处理大型查询结果的性能问题？