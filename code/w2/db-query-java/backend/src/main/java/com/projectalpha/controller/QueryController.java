package com.projectalpha.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.projectalpha.constants.ApplicationConstants.Pagination;
import com.projectalpha.service.ExcelExportService;
import com.projectalpha.service.LlmService;
import com.projectalpha.service.QueryExecutorService;
import com.projectalpha.util.ResponseBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/query")
@CrossOrigin(origins = "*")
public class QueryController {
    private static final Logger logger = LoggerFactory.getLogger(QueryController.class);

    private final QueryExecutorService queryExecutorService;
    private final LlmService llmService;
    private final ExcelExportService excelExportService;
    private final ObjectMapper objectMapper;

    public QueryController(QueryExecutorService queryExecutorService, LlmService llmService,
                         ExcelExportService excelExportService, ObjectMapper objectMapper) {
        this.queryExecutorService = queryExecutorService;
        this.llmService = llmService;
        this.excelExportService = excelExportService;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/execute/{connectionId}")
    public ResponseEntity<?> executeQuery(@PathVariable long connectionId, @RequestBody QueryRequest request) {
        try {
            int page = request.getPage() != null ? request.getPage() : Pagination.DEFAULT_PAGE;
            int pageSize = request.getPageSize() != null ? request.getPageSize() : Pagination.DEFAULT_PAGE_SIZE;

            logger.info("Executing query for connection ID: {}", connectionId);
            String result = queryExecutorService.executeQuery(connectionId, request.getSql(), page, pageSize);

            return ResponseEntity.ok()
                    .header("Content-Type", "application/json")
                    .body(result);
        } catch (Exception e) {
            logger.error("Error executing query", e);
            return buildErrorResponse(e);
        }
    }

    @PostMapping("/generate/{connectionId}")
    public ResponseEntity<?> generateSql(@PathVariable long connectionId, @RequestBody GenerateRequest request) {
        try {
            logger.info("Generating SQL for connection ID: {}", connectionId);
            String sql = llmService.generateSql(connectionId, request.getNaturalLanguageQuery());
            return ResponseEntity.ok(sql);
        } catch (Exception e) {
            logger.error("Error generating SQL", e);
            return buildErrorResponse(e);
        }
    }

    @PostMapping("/export/{connectionId}")
    public ResponseEntity<?> exportQueryToExcel(@PathVariable long connectionId, @RequestBody ExportRequest request) {
        try {
            logger.info("Exporting query results to Excel for connection ID: {}", connectionId);
            byte[] excelData = excelExportService.exportToExcel(connectionId, request.getSql());
            String fileName = excelExportService.generateFileName(request.getSql());

            return buildExcelResponse(excelData, fileName);
        } catch (Exception e) {
            logger.error("Error exporting to Excel", e);
            return buildErrorResponse(e);
        }
    }

    @PostMapping("/export/paginated/{connectionId}")
    public ResponseEntity<?> exportPaginatedQueryToExcel(@PathVariable long connectionId,
                                                        @RequestBody ExportPaginatedRequest request) {
        try {
            logger.info("Exporting paginated query results to Excel for connection ID: {}", connectionId);

            int page = request.getPage() != null ? request.getPage() : Pagination.DEFAULT_PAGE;
            int pageSize = request.getPageSize() != null ? request.getPageSize() : Pagination.EXPORT_DEFAULT_PAGE_SIZE;

            // Note: This executes the query first to validate, then exports all data
            queryExecutorService.executeQuery(connectionId, request.getSql(), page, pageSize);

            byte[] excelData = excelExportService.exportToExcel(connectionId, request.getSql());
            String fileName = excelExportService.generateFileName(request.getSql());

            return buildExcelResponse(excelData, fileName);
        } catch (Exception e) {
            logger.error("Error exporting paginated query to Excel", e);
            return buildErrorResponse(e);
        }
    }

    private ResponseEntity<?> buildErrorResponse(Exception e) {
        Map<String, Object> errorResponse = ResponseBuilder.error(e.getMessage(), e);
        return ResponseEntity.badRequest()
                .header("Content-Type", "application/json")
                .body(errorResponse);
    }

    private ResponseEntity<?> buildExcelResponse(byte[] excelData, String fileName) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", fileName);
        headers.setContentLength(excelData.length);

        return ResponseEntity.ok()
                .headers(headers)
                .body(excelData);
    }

    public static class QueryRequest {
        private String sql;
        private Integer page;
        private Integer pageSize;

        public String getSql() {
            return sql;
        }

        public void setSql(String sql) {
            this.sql = sql;
        }

        public Integer getPage() {
            return page;
        }

        public void setPage(Integer page) {
            this.page = page;
        }

        public Integer getPageSize() {
            return pageSize;
        }

        public void setPageSize(Integer pageSize) {
            this.pageSize = pageSize;
        }
    }

    public static class GenerateRequest {
        private String naturalLanguageQuery;

        public String getNaturalLanguageQuery() {
            return naturalLanguageQuery;
        }

        public void setNaturalLanguageQuery(String naturalLanguageQuery) {
            this.naturalLanguageQuery = naturalLanguageQuery;
        }
    }

    public static class ExportRequest {
        private String sql;

        public String getSql() {
            return sql;
        }

        public void setSql(String sql) {
            this.sql = sql;
        }
    }

    public static class ExportPaginatedRequest {
        private String sql;
        private Integer page;
        private Integer pageSize;

        public String getSql() {
            return sql;
        }

        public void setSql(String sql) {
            this.sql = sql;
        }

        public Integer getPage() {
            return page;
        }

        public void setPage(Integer page) {
            this.page = page;
        }

        public Integer getPageSize() {
            return pageSize;
        }

        public void setPageSize(Integer pageSize) {
            this.pageSize = pageSize;
        }
    }
}
