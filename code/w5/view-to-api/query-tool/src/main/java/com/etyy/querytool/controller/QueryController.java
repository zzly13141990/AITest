package com.etyy.querytool.controller;

import com.etyy.querytool.model.dto.QueryRequest;
import com.etyy.querytool.model.dto.QueryResponse;
import com.etyy.querytool.model.entity.QueryLog;
import com.etyy.querytool.service.LogService;
import com.etyy.querytool.service.QueryService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class QueryController {

    private static final Logger log = LoggerFactory.getLogger(QueryController.class);
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final int MAX_RESULT_ROWS = 20;

    private final QueryService queryService;
    private final LogService logService;

    public QueryController(QueryService queryService, LogService logService) {
        this.queryService = queryService;
        this.logService = logService;
    }

    @PostMapping("/query")
    public ResponseEntity<QueryResponse> query(@Valid @RequestBody QueryRequest request,
                                                HttpServletRequest httpRequest) {
        long startTime = System.currentTimeMillis();

        String clientIp = getClientIp(httpRequest);
        QueryResponse response = queryService.executeQuery(request);

        // Build and write audit log asynchronously
        try {
            QueryLog logEntry = new QueryLog();
            logEntry.setRequestTime(LocalDateTime.now());
            logEntry.setClientIp(clientIp);
            logEntry.setDatabaseIp(request.getDatabaseIp());
            logEntry.setDatabasePort(request.getDatabasePort());
            logEntry.setDatabaseType(request.getDatabaseType());
            logEntry.setDatabaseName(request.getDatabaseName());
            logEntry.setSqlHash(hashSql(request.getSql()));
            logEntry.setSqlPreview(truncate(request.getSql(), 200));
            logEntry.setSqlFull(request.getSql());

            // Save result data (first N rows) as JSON for admin viewing
            if ("success".equals(response.getStatus()) && response.getData() != null) {
                try {
                    List<Map<String, Object>> preview = response.getData().size() > MAX_RESULT_ROWS
                            ? response.getData().subList(0, MAX_RESULT_ROWS)
                            : response.getData();
                    logEntry.setResultData(OBJECT_MAPPER.writeValueAsString(preview));
                } catch (Exception e) {
                    log.warn("Failed to serialize result data", e);
                }
            }

            logEntry.setStatus(response.getStatus());
            logEntry.setMessage(response.getMessage());
            logEntry.setDurationMs((int) (System.currentTimeMillis() - startTime));

            logService.writeLogAsync(logEntry);
        } catch (Exception e) {
            log.warn("Failed to build audit log entry", e);
        }

        if ("success".equals(response.getStatus())) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isEmpty() && !"unknown".equalsIgnoreCase(xff)) {
            return xff.split(",")[0].trim();
        }
        String ri = request.getHeader("X-Real-IP");
        if (ri != null && !ri.isEmpty() && !"unknown".equalsIgnoreCase(ri)) {
            return ri;
        }
        return request.getRemoteAddr();
    }

    private String hashSql(String sql) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(sql.getBytes());
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString().substring(0, 16);
        } catch (NoSuchAlgorithmException e) {
            return String.valueOf(sql.hashCode());
        }
    }

    private String truncate(String str, int maxLength) {
        if (str == null) return null;
        return str.length() <= maxLength ? str : str.substring(0, maxLength);
    }
}
