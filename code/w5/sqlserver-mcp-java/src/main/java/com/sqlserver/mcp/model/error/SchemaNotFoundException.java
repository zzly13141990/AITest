package com.sqlserver.mcp.model.error;

import java.util.Map;

public final class SchemaNotFoundException extends McpException {
    public SchemaNotFoundException(String database) {
        super("SCHEMA_NOT_FOUND",
            "Schema 未找到: " + database,
            "请检查数据库名称是否正确",
            Map.of("database", database));
    }
}
