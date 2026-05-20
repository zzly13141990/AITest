package com.etyy.querytool.controller;

import com.etyy.querytool.model.dto.ApiResponse;
import com.etyy.querytool.model.dto.LogQueryRequest;
import com.etyy.querytool.model.dto.PageResult;
import com.etyy.querytool.model.dto.StatsResponse;
import com.etyy.querytool.model.entity.QueryLog;
import com.etyy.querytool.service.LogService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final LogService logService;

    public AdminController(LogService logService) {
        this.logService = logService;
    }

    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<PageResult<QueryLog>>> listLogs(LogQueryRequest request) {
        PageResult<QueryLog> result = logService.queryLogs(request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/errors")
    public ResponseEntity<ApiResponse<PageResult<QueryLog>>> listErrors(LogQueryRequest request) {
        if (request.getStatus() == null || request.getStatus().isEmpty()) {
            request.setStatus("fail");
        }
        PageResult<QueryLog> result = logService.queryLogs(request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/logs/{id}")
    public ResponseEntity<ApiResponse<QueryLog>> getLogDetail(@PathVariable Long id) {
        QueryLog logEntry = logService.getLogDetail(id);
        if (logEntry == null) {
            return ResponseEntity.status(404)
                    .body(ApiResponse.fail("日志记录不存在"));
        }
        return ResponseEntity.ok(ApiResponse.success(logEntry));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<StatsResponse>> getStats() {
        StatsResponse stats = logService.getStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}
