package com.sqlserver.mcp.model.error;

import java.util.Map;

public final class SqlSyntaxException extends McpException {
    public SqlSyntaxException(String sql, String detail) {
        super("SQL_SYNTAX_ERROR",
            "SQL 语法错误: " + detail,
            "请检查 SQL 语句语法",
            Map.of("sqlSnippet", sql.length() > 200 ? sql.substring(0, 200) : sql));
    }
}
