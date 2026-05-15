package com.projectalpha.util;

import com.projectalpha.entity.Connection;
import org.springframework.stereotype.Component;

/**
 * 数据库连接工具类，负责构建不同数据库类型的JDBC连接URL
 */
@Component
public class DatabaseConnectionUtil {

    /**
     * MySQL数据库类型标识
     */
    public static final String DATABASE_TYPE_MYSQL = "mysql";

    /**
     * PostgreSQL数据库类型标识
     */
    public static final String DATABASE_TYPE_POSTGRESQL = "postgresql";

    /**
     * SQL Server数据库类型标识
     */
    public static final String DATABASE_TYPE_SQLSERVER = "sqlserver";

    /**
     * 默认连接参数
     */
    private static final String MYSQL_DEFAULT_PARAMS = "?useSSL=false&serverTimezone=UTC";
    private static final String POSTGRESQL_DEFAULT_PARAMS = "?sslmode=disable";
    private static final String SQLSERVER_DEFAULT_PARAMS = ";encrypt=false;trustServerCertificate=true";

    /**
     * 构建JDBC连接URL
     *
     * @param connection 数据库连接信息
     * @return JDBC连接URL
     * @throws IllegalArgumentException 不支持的数据库类型
     */
    public static String buildJdbcUrl(Connection connection) {
        if (connection == null) {
            throw new IllegalArgumentException("Connection cannot be null");
        }

        String databaseType = connection.getDatabaseType();
        if (databaseType == null || databaseType.trim().isEmpty()) {
            throw new IllegalArgumentException("Database type cannot be null or empty");
        }

        String host = connection.getHost();
        String port = String.valueOf(connection.getPort());
        String databaseName = connection.getDatabaseName();

        switch (databaseType.toLowerCase()) {
            case DATABASE_TYPE_MYSQL:
                return buildMySqlUrl(host, port, databaseName);
            case DATABASE_TYPE_POSTGRESQL:
                return buildPostgreSqlUrl(host, port, databaseName);
            case DATABASE_TYPE_SQLSERVER:
                return buildSqlServerUrl(host, port, databaseName);
            default:
                throw new IllegalArgumentException(
                    String.format("Unsupported database type: %s. Supported types are: %s, %s, %s",
                            databaseType, DATABASE_TYPE_MYSQL, DATABASE_TYPE_POSTGRESQL, DATABASE_TYPE_SQLSERVER));
        }
    }

    /**
     * 构建MySQL JDBC URL
     */
    private static String buildMySqlUrl(String host, String port, String databaseName) {
        return String.format("jdbc:mysql://%s:%s/%s%s", host, port, databaseName, MYSQL_DEFAULT_PARAMS);
    }

    /**
     * 构建PostgreSQL JDBC URL
     */
    private static String buildPostgreSqlUrl(String host, String port, String databaseName) {
        return String.format("jdbc:postgresql://%s:%s/%s%s", host, port, databaseName, POSTGRESQL_DEFAULT_PARAMS);
    }

    /**
     * 构建SQL Server JDBC URL
     */
    private static String buildSqlServerUrl(String host, String port, String databaseName) {
        return String.format("jdbc:sqlserver://%s:%s;databaseName=%s%s",
                            host, port, databaseName, SQLSERVER_DEFAULT_PARAMS);
    }

    /**
     * 验证数据库类型是否支持
     *
     * @param databaseType 数据库类型
     * @return true如果支持，否则false
     */
    public static boolean isSupportedDatabaseType(String databaseType) {
        if (databaseType == null) {
            return false;
        }
        String normalizedType = databaseType.toLowerCase();
        return DATABASE_TYPE_MYSQL.equals(normalizedType)
                || DATABASE_TYPE_POSTGRESQL.equals(normalizedType)
                || DATABASE_TYPE_SQLSERVER.equals(normalizedType);
    }

    /**
     * 获取数据库类型的显示名称
     *
     * @param databaseType 数据库类型
     * @return 显示名称
     */
    public static String getDatabaseTypeDisplayName(String databaseType) {
        if (databaseType == null) {
            return "Unknown";
        }
        switch (databaseType.toLowerCase()) {
            case DATABASE_TYPE_MYSQL:
                return "MySQL";
            case DATABASE_TYPE_POSTGRESQL:
                return "PostgreSQL";
            case DATABASE_TYPE_SQLSERVER:
                return "SQL Server";
            default:
                return "Unknown";
        }
    }
}
