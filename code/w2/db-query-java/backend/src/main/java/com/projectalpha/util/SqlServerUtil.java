package com.projectalpha.util;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

public class SqlServerUtil {

    private SqlServerUtil() {
    }

    public static Connection createConnection(String host, int port, String database, String username, String password) throws SQLException {
        String url = String.format("jdbc:sqlserver://%s:%d;databaseName=%s;encrypt=false;trustServerCertificate=true",
                host, port, database);
        return DriverManager.getConnection(url, username, password);
    }

    public static Map<String, String> getTableMetadata(Connection connection, String database, String tableName) throws SQLException {
        Map<String, String> metadata = new HashMap<>();
        DatabaseMetaData metaData = connection.getMetaData();

        try (ResultSet rs = metaData.getColumns(database, null, tableName, null)) {
            while (rs.next()) {
                String columnName = rs.getString("COLUMN_NAME");
                String dataType = rs.getString("TYPE_NAME");
                metadata.put(columnName, dataType);
            }
        }

        return metadata;
    }

    public static boolean testConnection(String host, int port, String database, String username, String password) {
        String url = String.format("jdbc:sqlserver://%s:%d;databaseName=%s;encrypt=false;trustServerCertificate=true",
                host, port, database);
        try (Connection conn = DriverManager.getConnection(url, username, password)) {
            return conn.isValid(5);
        } catch (SQLException e) {
            return false;
        }
    }
}