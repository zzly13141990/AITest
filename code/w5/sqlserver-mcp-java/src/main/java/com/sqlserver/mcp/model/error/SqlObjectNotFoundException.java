package com.sqlserver.mcp.model.error;

import java.util.Map;

public final class SqlObjectNotFoundException extends McpException {
    public SqlObjectNotFoundException(String objectName) {
        super("SQL_OBJECT_NOT_FOUND",
            "数据库对象不存在: " + objectName,
            "请检查表名或列名是否正确",
            Map.of("objectName", objectName));
    }
}
