# pg-mcp

PostgreSQL MCP Server - 自然语言转 SQL 查询服务。

## 功能

- 通过自然语言描述生成 SQL 查询
- 三层安全防护（只读检查、语法验证、危险函数检测）
- 多数据库连接池管理
- 查询历史记录与缓存
- 连接健康检查

## 安装

```bash
pip install -e ".[dev]"
```

## 配置

复制 `.env.example` 为 `.env` 并填写数据库和 LLM 配置。

## 启动

```bash
pg_mcp
# 或
python -m pg_mcp.main
```
