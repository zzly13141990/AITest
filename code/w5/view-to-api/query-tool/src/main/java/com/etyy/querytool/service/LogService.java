package com.etyy.querytool.service;

import com.etyy.querytool.config.AppConfig;
import com.etyy.querytool.model.dto.LogQueryRequest;
import com.etyy.querytool.model.dto.PageResult;
import com.etyy.querytool.model.dto.StatsResponse;
import com.etyy.querytool.model.entity.QueryLog;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.annotation.PreDestroy;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;

@Component
public class LogService {

    private static final Logger log = LoggerFactory.getLogger(LogService.class);
    private static final int QUEUE_CAPACITY = 5000;

    private static final String LOG_COLUMNS =
            "id, request_time AS requestTime, client_ip AS clientIp, " +
            "database_ip AS databaseIp, database_port AS databasePort, " +
            "database_type AS databaseType, database_name AS databaseName, " +
            "sql_hash AS sqlHash, sql_preview AS sqlPreview, sql_full AS sqlFull, " +
            "result_data AS resultData, " +
            "status, message, duration_ms AS durationMs, created_at AS createdAt";

    private static final DateTimeFormatter DT_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final ThreadPoolExecutor executor = new ThreadPoolExecutor(
            1, 5, 60L, TimeUnit.SECONDS,
            new LinkedBlockingQueue<>(QUEUE_CAPACITY),
            new ThreadPoolExecutor.CallerRunsPolicy()
    );

    private final JdbcTemplate jdbcTemplate;
    private final AppConfig config;

    public LogService(JdbcTemplate jdbcTemplate, AppConfig config) {
        this.jdbcTemplate = jdbcTemplate;
        this.config = config;
    }

    public void writeLogAsync(QueryLog logEntry) {
        int queueSize = executor.getQueue().size();
        if (queueSize > QUEUE_CAPACITY * 0.8) {
            log.warn("日志写入队列使用率超过 80%: {}/{}", queueSize, QUEUE_CAPACITY);
        }
        executor.submit(() -> {
            try {
                jdbcTemplate.update(
                        "INSERT INTO query_log (request_time, client_ip, database_ip, database_port, " +
                                "database_type, database_name, sql_hash, sql_preview, sql_full, " +
                                "result_data, status, message, duration_ms, created_at) " +
                                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                        logEntry.getRequestTime(),
                        logEntry.getClientIp(),
                        logEntry.getDatabaseIp(),
                        logEntry.getDatabasePort(),
                        logEntry.getDatabaseType(),
                        logEntry.getDatabaseName(),
                        logEntry.getSqlHash(),
                        logEntry.getSqlPreview(),
                        logEntry.getSqlFull(),
                        logEntry.getResultData(),
                        logEntry.getStatus(),
                        logEntry.getMessage(),
                        logEntry.getDurationMs(),
                        LocalDateTime.now()
                );
            } catch (Exception e) {
                log.error("日志写入失败", e);
            }
        });
    }

    public PageResult<QueryLog> queryLogs(LogQueryRequest request) {
        StringBuilder whereClause = new StringBuilder();
        List<Object> params = new ArrayList<>();

        if (request.getStartTime() != null && !request.getStartTime().isEmpty()) {
            try {
                LocalDateTime startDt = LocalDateTime.parse(request.getStartTime(), DT_FMT);
                whereClause.append(" AND request_time >= ?");
                params.add(startDt);
            } catch (DateTimeParseException e) {
                log.warn("Invalid start_time format: {}", request.getStartTime());
            }
        }
        if (request.getEndTime() != null && !request.getEndTime().isEmpty()) {
            try {
                LocalDateTime endDt = LocalDateTime.parse(request.getEndTime(), DT_FMT);
                whereClause.append(" AND request_time <= ?");
                params.add(endDt);
            } catch (DateTimeParseException e) {
                log.warn("Invalid end_time format: {}", request.getEndTime());
            }
        }
        if (request.getClientIp() != null && !request.getClientIp().isEmpty()) {
            whereClause.append(" AND client_ip LIKE ?");
            params.add("%" + request.getClientIp() + "%");
        }
        if (request.getStatus() != null && !request.getStatus().isEmpty()) {
            whereClause.append(" AND status = ?");
            params.add(request.getStatus());
        }
        if (request.getDatabaseType() != null && !request.getDatabaseType().isEmpty()) {
            whereClause.append(" AND database_type = ?");
            params.add(request.getDatabaseType());
        }

        String condition = whereClause.toString();

        Long totalCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM query_log WHERE 1=1" + condition,
                Long.class, params.toArray());

        StringBuilder sql = new StringBuilder("SELECT " + LOG_COLUMNS + " FROM query_log WHERE 1=1")
                .append(condition);
        sql.append(" ORDER BY request_time DESC LIMIT ? OFFSET ?");
        int offset = (request.getPageNumber() - 1) * request.getPageSize();
        params.add(request.getPageSize());
        params.add(offset);

        List<QueryLog> items = jdbcTemplate.query(
                sql.toString(),
                new BeanPropertyRowMapper<>(QueryLog.class),
                params.toArray()
        );

        return new PageResult<>(items, totalCount != null ? totalCount : 0,
                request.getPageNumber(), request.getPageSize());
    }

    public QueryLog getLogDetail(Long id) {
        List<QueryLog> logs = jdbcTemplate.query(
                "SELECT " + LOG_COLUMNS + " FROM query_log WHERE id = ?",
                new BeanPropertyRowMapper<>(QueryLog.class),
                id
        );
        return logs.isEmpty() ? null : logs.get(0);
    }

    public StatsResponse getStats() {
        Long totalRequests = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM query_log", Long.class);

        Long successCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM query_log WHERE status = 'success'", Long.class);

        Long failCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM query_log WHERE status = 'fail'", Long.class);

        Long todayRequests = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM query_log WHERE request_time >= ?",
                Long.class, LocalDate.now().atStartOfDay());

        Double avgDuration = jdbcTemplate.queryForObject(
                "SELECT COALESCE(AVG(duration_ms), 0) FROM query_log", Double.class);

        return new StatsResponse(
                totalRequests != null ? totalRequests : 0,
                successCount != null ? successCount : 0,
                failCount != null ? failCount : 0,
                todayRequests != null ? todayRequests : 0,
                avgDuration != null ? avgDuration : 0.0
        );
    }

    @PreDestroy
    public void shutdown() {
        executor.shutdown();
        try {
            if (!executor.awaitTermination(5, TimeUnit.SECONDS)) {
                executor.shutdownNow();
            }
        } catch (InterruptedException e) {
            executor.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
}
