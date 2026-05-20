package com.etyy.querytool.service;

import com.etyy.querytool.model.dto.PageParam;
import com.etyy.querytool.model.dto.QueryRequest;
import com.etyy.querytool.model.dto.QueryResponse;
import com.etyy.querytool.security.SqlValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.sql.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class QueryService {

    private static final Logger log = LoggerFactory.getLogger(QueryService.class);
    private static final DateTimeFormatter DTF = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final int MAX_UNPAGED_ROWS = 50000;
    private static final String UNPAGED_OVERFLOW_MSG =
            "查询结果超过" + MAX_UNPAGED_ROWS + "条，已限制显示前" + MAX_UNPAGED_ROWS + "条，建议使用分页查询";

    private final SqlValidator sqlValidator;
    private final PageService pageService;
    private final ConnectionManager connectionManager;
    private final LogService logService;

    public QueryService(SqlValidator sqlValidator, PageService pageService,
                        ConnectionManager connectionManager, LogService logService) {
        this.sqlValidator = sqlValidator;
        this.pageService = pageService;
        this.connectionManager = connectionManager;
        this.logService = logService;
    }

    public QueryResponse executeQuery(QueryRequest request) {
        long startTime = System.currentTimeMillis();
        String executionTime = LocalDateTime.now().format(DTF);
        String clientIp = "unknown"; // Will be set by controller

        try {
            // 1. Validate SQL
            String validationError = sqlValidator.validate(request.getSql(), request.getPage());
            if (validationError != null) {
                return buildErrorResponse(executionError(validationError, startTime));
            }

            // Build dbKey
            String dbKey = request.getDatabaseIp() + ":" + request.getDatabasePort() + ":" + request.getDatabaseName();

            // 2. Get connection
            Connection conn = connectionManager.getConnection(
                    dbKey, request.getDatabaseType(),
                    request.getDatabaseIp(), request.getDatabasePort(),
                    request.getDatabaseName(),
                    request.getDatabaseUsername(), request.getDatabasePassword());

            try {
                List<Map<String, Object>> data;
                Map<String, Object> metadata = new HashMap<>();
                long totalCount = 0;
                int pageNumber = 0;
                int pageSize = 0;

                if (request.getPage() != null) {
                    // Paginated query
                    PageParam page = request.getPage();
                    pageNumber = page.getPageNumber();
                    pageSize = page.getPageSize();

                    // Execute COUNT query
                    String countSql = pageService.buildCountSql(request.getSql());
                    totalCount = executeCountQuery(conn, countSql);

                    // Execute paginated query
                    String pageSql = pageService.buildPageSql(
                            request.getSql(), pageNumber, pageSize, request.getDatabaseType());
                    data = executeDataQuery(conn, pageSql);

                    metadata.put("total_count", totalCount);
                    metadata.put("page_number", pageNumber);
                    metadata.put("page_size", pageSize);
                } else {
                    // Non-paginated query — execute full SQL, guard against overflow
                    data = executeDataQuery(conn, request.getSql());
                    if (data.size() > MAX_UNPAGED_ROWS) {
                        data = new ArrayList<>(data.subList(0, MAX_UNPAGED_ROWS));
                    }
                }

                long duration = System.currentTimeMillis() - startTime;
                boolean overflow = data.size() >= MAX_UNPAGED_ROWS;
                String responseMessage = overflow ? UNPAGED_OVERFLOW_MSG : "操作成功";
                QueryResponse response = new QueryResponse("success", executionTime, responseMessage,
                        duration, data, metadata.isEmpty() ? null : metadata);

                return response;

            } finally {
                conn.close();
            }

        } catch (SQLException e) {
            return buildErrorResponse(executionError("数据库连接失败：" + e.getMessage(), startTime));
        } catch (Exception e) {
            log.error("Query execution failed", e);
            return buildErrorResponse(executionError("查询执行失败：" + e.getMessage(), startTime));
        }
    }

    private long executeCountQuery(Connection conn, String countSql) throws SQLException {
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(countSql)) {
            if (rs.next()) {
                return rs.getLong(1);
            }
        }
        return 0;
    }

    private List<Map<String, Object>> executeDataQuery(Connection conn, String sql) throws SQLException {
        List<Map<String, Object>> result = new ArrayList<>();
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            ResultSetMetaData meta = rs.getMetaData();
            int columnCount = meta.getColumnCount();
            while (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                for (int i = 1; i <= columnCount; i++) {
                    String columnName = meta.getColumnLabel(i);
                    Object value = rs.getObject(i);
                    row.put(columnName, value);
                }
                result.add(row);
            }
        }
        return result;
    }

    private QueryResponse executionError(String message, long startTime) {
        long duration = System.currentTimeMillis() - startTime;
        return new QueryResponse("fail", LocalDateTime.now().format(DTF), message,
                duration, new ArrayList<>(), new HashMap<>());
    }

    private QueryResponse buildErrorResponse(QueryResponse response) {
        return response;
    }
}
