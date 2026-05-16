package com.sqlserver.mcp.model.error;

import java.util.Map;

public final class DbConnectionException extends McpException {
    public DbConnectionException(String database, String detail) {
        super("DB_CONNECTION_ERROR",
            "数据库连接失败 [" + database + "]: " + detail,
            "请检查数据库连接配置和网络连通性",
            Map.of("database", database));
    }

    public DbConnectionException(String database, Throwable cause) {
        super("DB_CONNECTION_ERROR",
            "数据库连接失败 [" + database + "]: " + cause.getMessage(),
            "请检查数据库连接配置和网络连通性",
            Map.of("database", database));
    }
}
