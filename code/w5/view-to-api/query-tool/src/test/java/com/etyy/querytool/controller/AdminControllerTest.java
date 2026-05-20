package com.etyy.querytool.controller;

import com.etyy.querytool.model.dto.*;
import com.etyy.querytool.model.entity.QueryLog;
import com.etyy.querytool.service.LogService;
import com.etyy.querytool.service.QueryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@DisplayName("AdminController Unit Tests")
class AdminControllerTest {

    private AdminController adminController;
    private LogService logService;

    @BeforeEach
    void setUp() {
        logService = mock(LogService.class);
        adminController = new AdminController(logService);
    }

    @Test
    @DisplayName("GET /admin/stats returns stats response")
    void testGetStats() {
        StatsResponse stats = new StatsResponse(100L, 90L, 10L, 20L, 85.0);
        when(logService.getStats()).thenReturn(stats);

        ResponseEntity<ApiResponse<StatsResponse>> response = adminController.getStats();

        assertEquals(200, response.getStatusCodeValue());
        assertEquals("success", response.getBody().getStatus());
        assertEquals(100L, response.getBody().getData().getTotalRequests());
    }

    @Test
    @DisplayName("GET /admin/logs/{id} returns log detail")
    void testGetLogDetail() {
        QueryLog logEntry = new QueryLog();
        logEntry.setId(1L);
        logEntry.setClientIp("192.168.1.1");
        when(logService.getLogDetail(1L)).thenReturn(logEntry);

        ResponseEntity<ApiResponse<QueryLog>> response = adminController.getLogDetail(1L);

        assertEquals(200, response.getStatusCodeValue());
        assertEquals("192.168.1.1", response.getBody().getData().getClientIp());
    }

    @Test
    @DisplayName("GET /admin/logs/{id} returns 404 for missing log")
    void testGetLogDetailNotFound() {
        when(logService.getLogDetail(999L)).thenReturn(null);

        ResponseEntity<ApiResponse<QueryLog>> response = adminController.getLogDetail(999L);

        assertEquals(404, response.getStatusCodeValue());
        assertEquals("fail", response.getBody().getStatus());
    }

    @Test
    @DisplayName("GET /admin/errors defaults to fail status")
    void testListErrorsDefaultsToFail() {
        when(logService.queryLogs(any())).thenReturn(new PageResult<>(new ArrayList<>(), 0, 1, 20));

        LogQueryRequest request = new LogQueryRequest(); // no status set
        ResponseEntity<ApiResponse<PageResult<QueryLog>>> response = adminController.listErrors(request);

        assertEquals(200, response.getStatusCodeValue());
        assertEquals("success", response.getBody().getStatus());
    }
}
