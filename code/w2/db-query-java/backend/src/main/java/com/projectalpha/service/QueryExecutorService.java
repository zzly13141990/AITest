package com.projectalpha.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.projectalpha.constants.ApplicationConstants;
import com.projectalpha.constants.ApplicationConstants.Sql;
import com.projectalpha.constants.DatabaseErrorMessages;
import com.projectalpha.exception.DatabaseException;
import com.projectalpha.repository.ConnectionRepository;
import com.projectalpha.util.DatabaseConnectionUtil;
import com.projectalpha.util.DatabaseErrorUtil;
import com.projectalpha.util.ResultSetMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.sql.*;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for executing SQL queries with pagination and result conversion
 */
@Service
public class QueryExecutorService {
    private static final Logger logger = LoggerFactory.getLogger(QueryExecutorService.class);

    private final ConnectionRepository connectionRepository;
    private final SqlValidatorService sqlValidatorService;
    private final ObjectMapper objectMapper;

    public QueryExecutorService(ConnectionRepository connectionRepository,
                            SqlValidatorService sqlValidatorService,
                            ObjectMapper objectMapper) {
        this.connectionRepository = connectionRepository;
        this.sqlValidatorService = sqlValidatorService;
        this.objectMapper = objectMapper;
    }

    public SqlValidatorService getSqlValidatorService() {
        return sqlValidatorService;
    }

    /**
     * Execute SQL query with pagination support
     * Supports multiple SQL statements separated by semicolon
     *
     * @param connectionId database connection ID
     * @param sql SQL statement(s) to execute
     * @param page page number (1-based)
     * @param pageSize number of rows per page
     * @return JSON formatted query result
     * @throws DatabaseException if query execution fails
     */
    public String executeQuery(long connectionId, String sql, int page, int pageSize) {
        logger.info("Executing query for connection ID: {}, page: {}, pageSize: {}", connectionId, page, pageSize);
        logger.debug("SQL: {}", sql);

        com.projectalpha.entity.Connection connectionEntity = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new RuntimeException("Connection not found with ID: " + connectionId));

        try (java.sql.Connection connection = getConnection(connectionEntity)) {
            String[] statements = splitSqlStatements(sql);
            
            if (statements.length > 1) {
                return executeMultipleStatements(connection, connectionEntity.getDatabaseType(), statements, page, pageSize);
            } else {
                String validatedSql = sqlValidatorService.validateAndEnhanceSql(sql);
                logger.debug("Validated SQL: {}", validatedSql);

                if (isSelectStatement(validatedSql)) {
                    return executeSelectQuery(connection, connectionEntity.getDatabaseType(), validatedSql, page, pageSize);
                } else {
                    return executeUpdateQuery(connection, validatedSql);
                }
            }
        } catch (SQLException e) {
            throw DatabaseErrorUtil.convertToDatabaseException(e, "Query execution failed");
        }
    }

    /**
     * Split SQL statements by semicolon, respecting string literals
     *
     * @param sql SQL containing multiple statements
     * @return array of individual SQL statements
     */
    private String[] splitSqlStatements(String sql) {
        if (sql == null || sql.trim().isEmpty()) {
            return new String[0];
        }

        java.util.List<String> statements = new java.util.ArrayList<>();
        StringBuilder currentStatement = new StringBuilder();
        boolean inSingleQuote = false;
        boolean inDoubleQuote = false;

        for (int i = 0; i < sql.length(); i++) {
            char c = sql.charAt(i);
            char prevChar = i > 0 ? sql.charAt(i - 1) : '\0';

            if (c == '\'' && prevChar != '\\' && !inDoubleQuote) {
                inSingleQuote = !inSingleQuote;
            } else if (c == '"' && prevChar != '\\' && !inSingleQuote) {
                inDoubleQuote = !inDoubleQuote;
            } else if (c == ';' && !inSingleQuote && !inDoubleQuote) {
                String statement = currentStatement.toString().trim();
                if (!statement.isEmpty()) {
                    statements.add(statement);
                }
                currentStatement = new StringBuilder();
                continue;
            }

            currentStatement.append(c);
        }

        String lastStatement = currentStatement.toString().trim();
        if (!lastStatement.isEmpty()) {
            statements.add(lastStatement);
        }

        return statements.toArray(new String[0]);
    }

    /**
     * Execute multiple SQL statements and return combined results
     *
     * @param connection database connection
     * @param databaseType database type
     * @param statements array of SQL statements
     * @param page page number
     * @param pageSize page size
     * @return JSON formatted combined results
     */
    private String executeMultipleStatements(java.sql.Connection connection, String databaseType, 
                                            String[] statements, int page, int pageSize) {
        logger.info("Executing {} SQL statements", statements.length);
        
        java.util.List<java.util.Map<String, Object>> results = new java.util.ArrayList<>();
        
        for (int i = 0; i < statements.length; i++) {
            String statement = statements[i];
            logger.debug("Executing statement {}: {}", i + 1, statement);
            
            try {
                String validatedSql = sqlValidatorService.validateAndEnhanceSql(statement);
                
                java.util.Map<String, Object> result = new LinkedHashMap<>();
                result.put("statementIndex", i);
                result.put("sql", statement);
                
                if (isSelectStatement(validatedSql)) {
                    String jsonResult = executeSelectQuery(connection, databaseType, validatedSql, page, pageSize);
                    com.fasterxml.jackson.databind.JsonNode node = objectMapper.readTree(jsonResult);
                    
                    result.put("type", "SELECT");
                    result.put("total", node.get("total").asInt());
                    result.put("page", node.get("page").asInt());
                    result.put("pageSize", node.get("pageSize").asInt());
                    result.put("data", objectMapper.convertValue(node.get("data"), List.class));
                } else {
                    String jsonResult = executeUpdateQuery(connection, validatedSql);
                    com.fasterxml.jackson.databind.JsonNode node = objectMapper.readTree(jsonResult);
                    
                    result.put("type", "UPDATE");
                    result.put("affectedRows", node.get("total").asInt());
                    result.put("message", node.has("message") ? node.get("message").asText() : null);
                }
                
                result.put("success", true);
                results.add(result);
            } catch (Exception e) {
                logger.error("Error executing statement {}: {}", i + 1, e.getMessage());
                
                java.util.Map<String, Object> errorResult = new LinkedHashMap<>();
                errorResult.put("statementIndex", i);
                errorResult.put("sql", statement);
                errorResult.put("success", false);
                errorResult.put("error", e.getMessage());
                results.add(errorResult);
            }
        }
        
        java.util.Map<String, Object> response = new LinkedHashMap<>();
        response.put("multiStatement", true);
        response.put("count", results.size());
        response.put("results", results);
        
        try {
            return objectMapper.writeValueAsString(response);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new DatabaseException("Failed to process multiple query results", e);
        }
    }

    private String executeSelectQuery(java.sql.Connection connection, String databaseType, String sql, int page, int pageSize) throws SQLException {
        int totalCount = getTotalCount(connection, sql);
        logger.debug("Total count: {}", totalCount);

        String paginatedSql = QueryPaginator.buildPaginatedSql(
                sql, page, pageSize, databaseType);
        logger.debug("Paginated SQL: {}", paginatedSql);

        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(paginatedSql)) {

            List<Map<String, Object>> results = ResultSetMapper.toList(rs);
            Map<String, Object> response = buildPaginationResponse(
                    totalCount, page, pageSize, results);

            String jsonResponse = objectMapper.writeValueAsString(response);
            logger.debug("Query executed successfully, result size: {}", results.size());
            return jsonResponse;
        } catch (SQLException e) {
            throw DatabaseErrorUtil.convertToDatabaseException(e, "Query execution failed");
        } catch (Exception e) {
            throw new DatabaseException("Failed to process query results", e);
        }
    }

    private String executeUpdateQuery(java.sql.Connection connection, String sql) {
        long startTime = System.currentTimeMillis();
        try (Statement stmt = connection.createStatement()) {
            long executeStartTime = System.currentTimeMillis();
            int affectedRows = stmt.executeUpdate(sql);
            long executeEndTime = System.currentTimeMillis();
            long executeTime = executeEndTime - executeStartTime;
            long totalTime = executeEndTime - startTime;
            
            logger.debug("Update executed successfully, affected rows: {}, executeTime: {}ms, totalTime: {}ms", 
                    affectedRows, executeTime, totalTime);

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("total", affectedRows);
            response.put("page", 1);
            response.put("pageSize", 1);
            response.put("data", new ArrayList<>());
            response.put("executeTime", executeTime);
            response.put("totalTime", totalTime);
            response.put("message", String.format("执行成功，影响行数: %d", affectedRows));

            return objectMapper.writeValueAsString(response);
        } catch (SQLException e) {
            throw DatabaseErrorUtil.convertToDatabaseException(e, "Update execution failed");
        } catch (Exception e) {
            throw new DatabaseException("Failed to process update result", e);
        }
    }

    /**
     * Get total count of records for a query
     *
     * @param conn database connection
     * @param sql SQL statement
     * @return total count
     * @throws SQLException if database access error occurs
     */
    private int getTotalCount(java.sql.Connection conn, String sql) throws SQLException {
        if (isSimpleSelectOne(sql)) {
            return 1;
        }

        String countSql = buildCountQuery(sql);
        logger.debug("Count SQL: {}", countSql);

        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(countSql)) {
            if (rs.next()) {
                return rs.getInt(1);
            }
            return 0;
        } catch (SQLException e) {
            logger.warn("Count query failed, falling back to alternative method: {}", e.getMessage());
            return countByIteration(conn, sql);
        }
    }

    private String buildCountQuery(String sql) {
        return String.format("SELECT COUNT(*) FROM (%s) as t", sql);
    }

    private int countByIteration(java.sql.Connection conn, String sql) throws SQLException {
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            int count = 0;
            while (rs.next()) {
                count++;
            }
            return count;
        }
    }

    private boolean isSimpleSelectOne(String sql) {
        return sql.trim().equalsIgnoreCase(Sql.SELECT_ONE);
    }

    private boolean isSelectStatement(String sql) {
        return sql != null && sql.trim().toLowerCase().startsWith(Sql.SELECT.toLowerCase());
    }

    private Map<String, Object> buildPaginationResponse(
            int total, int page, int pageSize, List<Map<String, Object>> data) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("total", total);
        response.put("page", page);
        response.put("pageSize", pageSize);
        response.put("data", data);
        return response;
    }

    /**
     * Get database connection for a given connection entity
     *
     * @param connection connection entity
     * @return database connection
     * @throws SQLException if database access error occurs
     */
    public java.sql.Connection getConnection(com.projectalpha.entity.Connection connection) throws SQLException {
        String url = DatabaseConnectionUtil.buildJdbcUrl(connection);
        return DriverManager.getConnection(url, connection.getUsername(), connection.getPassword());
    }
}

/**
 * Query pagination utility
 */
class QueryPaginator {
    private QueryPaginator() {}

    /**
     * Build paginated SQL for different database types
     *
     * @param originalSql original SQL query
     * @param page page number (1-based)
     * @param pageSize number of rows per page
     * @param databaseType database type (mysql, postgresql, sqlserver)
     * @return paginated SQL query
     */
    public static String buildPaginatedSql(String originalSql, int page, int pageSize, String databaseType) {
        if (originalSql == null || originalSql.trim().isEmpty()) {
            throw new IllegalArgumentException("SQL query cannot be empty");
        }

        int offset = (page - 1) * pageSize;

        switch (databaseType.toLowerCase()) {
            case DatabaseConnectionUtil.DATABASE_TYPE_MYSQL:
                return buildMySqlPaginatedSql(originalSql, offset, pageSize);
            case DatabaseConnectionUtil.DATABASE_TYPE_POSTGRESQL:
                return buildPostgresPaginatedSql(originalSql, offset, pageSize);
            case DatabaseConnectionUtil.DATABASE_TYPE_SQLSERVER:
                return buildSqlServerPaginatedSql(originalSql, offset, pageSize);
            default:
                throw new IllegalArgumentException(
                    String.format("Unsupported database type for pagination: %s", databaseType));
        }
    }

    private static String buildMySqlPaginatedSql(String sql, int offset, int pageSize) {
        return String.format("%s LIMIT %d OFFSET %d", sql, pageSize, offset);
    }

    private static String buildPostgresPaginatedSql(String sql, int offset, int pageSize) {
        return String.format("%s LIMIT %d OFFSET %d", sql, pageSize, offset);
    }

    private static String buildSqlServerPaginatedSql(String sql, int offset, int pageSize) {
        return String.format("SELECT * FROM (%s) as paging_subquery ORDER BY (SELECT NULL) OFFSET %d ROWS FETCH NEXT %d ROWS ONLY",
            sql, offset, pageSize);
    }
}
