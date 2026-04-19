package com.projectalpha.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.projectalpha.entity.Connection;
import com.projectalpha.repository.ConnectionRepository;
import org.springframework.stereotype.Service;

import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class QueryExecutorService {
    private final ConnectionRepository connectionRepository;
    private final SqlValidatorService sqlValidatorService;
    private final ObjectMapper objectMapper;
    
    public QueryExecutorService(ConnectionRepository connectionRepository, SqlValidatorService sqlValidatorService, ObjectMapper objectMapper) {
        this.connectionRepository = connectionRepository;
        this.sqlValidatorService = sqlValidatorService;
        this.objectMapper = objectMapper;
    }
    
    public String executeQuery(long connectionId, String sql, int page, int pageSize) {
        System.out.println("Executing query for connectionId: " + connectionId);
        System.out.println("SQL: " + sql);
        System.out.println("Page: " + page + ", PageSize: " + pageSize);
        
        Connection connection = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new RuntimeException("Connection not found"));
        
        System.out.println("Found connection: " + connection.getConnectionName());
        
        // 验证并增强SQL
        String validatedSql = sqlValidatorService.validateAndEnhanceSql(sql);
        System.out.println("Validated SQL: " + validatedSql);
        
        // 执行查询
        try (java.sql.Connection conn = getConnection(connection);
             Statement stmt = conn.createStatement()) {
            
            // 检查是否是SELECT语句
            if (validatedSql.toLowerCase().startsWith("select")) {
                // 计算总条数
                int totalCount = getTotalCount(conn, sql);
                System.out.println("Total count: " + totalCount);
                
                // 执行分页查询
                String paginatedSql = getPaginatedSql(validatedSql, page, pageSize, connection.getDatabaseType());
                System.out.println("Paginated SQL: " + paginatedSql);
                
                try (ResultSet rs = stmt.executeQuery(paginatedSql)) {
                    System.out.println("Query executed successfully");
                    // 转换结果为JSON
                    List<Map<String, Object>> results = convertResultSetToList(rs);
                    
                    // 构建分页响应
                    Map<String, Object> response = new java.util.LinkedHashMap<>();
                    response.put("total", totalCount);
                    response.put("page", page);
                    response.put("pageSize", pageSize);
                    response.put("data", results);
                    
                    String jsonResponse = objectMapper.writeValueAsString(response);
                    System.out.println("Result converted to JSON: " + jsonResponse.substring(0, Math.min(100, jsonResponse.length())) + "...");
                    return jsonResponse;
                }
            } else {
                // 执行非SELECT语句
                int affectedRows = stmt.executeUpdate(validatedSql);
                System.out.println("Update executed successfully, affected rows: " + affectedRows);
                
                // 构建响应
                Map<String, Object> response = new java.util.LinkedHashMap<>();
                response.put("total", affectedRows);
                response.put("page", 1);
                response.put("pageSize", 1);
                response.put("data", new ArrayList<>());
                response.put("message", "执行成功，影响行数: " + affectedRows);
                
                String jsonResponse = objectMapper.writeValueAsString(response);
                System.out.println("Result converted to JSON: " + jsonResponse);
                return jsonResponse;
            }
        } catch (SQLException e) {
            System.err.println("SQLException: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to execute query: " + e.getMessage(), e);
        } catch (Exception e) {
            System.err.println("Exception: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to execute query: " + e.getMessage(), e);
        }
    }
    
    private int getTotalCount(java.sql.Connection conn, String originalSql) throws SQLException {
        // 对于简单的select 1查询，直接返回1
        if (originalSql.trim().equalsIgnoreCase("select 1")) {
            return 1;
        }
        
        // 构建计算总条数的SQL，为内部查询添加列名
        String countSql = "SELECT COUNT(*) FROM (" + originalSql + ") as t";
        System.out.println("Count SQL: " + countSql);
        
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(countSql)) {
            if (rs.next()) {
                return rs.getInt(1);
            }
            return 0;
        } catch (SQLException e) {
            // 如果出现列名错误，尝试使用更简单的方式
            System.err.println("Error in getTotalCount, trying alternative approach: " + e.getMessage());
            // 直接执行原始查询并计数
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery(originalSql)) {
                int count = 0;
                while (rs.next()) {
                    count++;
                }
                return count;
            } catch (SQLException ex) {
                // 如果仍然失败，返回1作为默认值
                System.err.println("Alternative approach also failed, returning default count of 1: " + ex.getMessage());
                return 1;
            }
        }
    }
    
    private String getPaginatedSql(String sql, int page, int pageSize, String databaseType) {
        int offset = (page - 1) * pageSize;
        
        switch (databaseType.toLowerCase()) {
            case "mysql":
                return sql + " LIMIT " + pageSize + " OFFSET " + offset;
            case "postgresql":
                return sql + " LIMIT " + pageSize + " OFFSET " + offset;
            case "sqlserver":
                // SQL Server 2012+ 使用 OFFSET FETCH，需要确保有ORDER BY
                // 并且移除TOP子句，因为SQL Server不允许同时使用TOP和OFFSET
                String cleanedSql = sql.replaceAll("(?i)TOP \\d+", "");
                if (cleanedSql.toLowerCase().contains("order by")) {
                    return cleanedSql + " OFFSET " + offset + " ROWS FETCH NEXT " + pageSize + " ROWS ONLY";
                } else {
                    // 如果没有ORDER BY，添加一个默认的ORDER BY以确保OFFSET FETCH语法正确
                    return cleanedSql + " ORDER BY (SELECT 1) OFFSET " + offset + " ROWS FETCH NEXT " + pageSize + " ROWS ONLY";
                }
            default:
                throw new IllegalArgumentException("Unsupported database type: " + databaseType);
        }
    }
    
    private List<Map<String, Object>> convertResultSetToList(ResultSet rs) throws SQLException {
        ResultSetMetaData metaData = rs.getMetaData();
        int columnCount = metaData.getColumnCount();
        
        List<Map<String, Object>> results = new ArrayList<>();
        
        while (rs.next()) {
            Map<String, Object> row = new java.util.LinkedHashMap<>();
            for (int i = 1; i <= columnCount; i++) {
                String columnName = metaData.getColumnName(i);
                Object value = rs.getObject(i);
                row.put(columnName, value);
            }
            results.add(row);
        }
        
        return results;
    }
    
    private java.sql.Connection getConnection(Connection connection) throws SQLException {
        String url = getConnectionUrl(connection);
        return DriverManager.getConnection(url, connection.getUsername(), connection.getPassword());
    }
    
    private String getConnectionUrl(Connection connection) {
        switch (connection.getDatabaseType().toLowerCase()) {
            case "mysql":
                return "jdbc:mysql://" + connection.getHost() + ":" + connection.getPort() + "/" + connection.getDatabaseName() + "?useSSL=false&serverTimezone=UTC";
            case "postgresql":
                return "jdbc:postgresql://" + connection.getHost() + ":" + connection.getPort() + "/" + connection.getDatabaseName() + "?sslmode=disable";
            case "sqlserver":
                return "jdbc:sqlserver://" + connection.getHost() + ":" + connection.getPort() + ";databaseName=" + connection.getDatabaseName() + ";encrypt=false;trustServerCertificate=true";
            default:
                throw new IllegalArgumentException("Unsupported database type: " + connection.getDatabaseType());
        }
    }
    

}