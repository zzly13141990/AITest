package com.projectalpha.controller;

import com.projectalpha.service.LlmService;
import com.projectalpha.service.QueryExecutorService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/query")
@CrossOrigin(origins = "*")
public class QueryController {
    private final QueryExecutorService queryExecutorService;
    private final LlmService llmService;
    
    public QueryController(QueryExecutorService queryExecutorService, LlmService llmService) {
        this.queryExecutorService = queryExecutorService;
        this.llmService = llmService;
    }
    
    @PostMapping("/execute/{connectionId}")
    public ResponseEntity<String> executeQuery(@PathVariable long connectionId, @RequestBody QueryRequest request) {
        int page = request.getPage() != null ? request.getPage() : 1;
        int pageSize = request.getPageSize() != null ? request.getPageSize() : 20;
        String result = queryExecutorService.executeQuery(connectionId, request.getSql(), page, pageSize);
        return ResponseEntity.ok()
                .header("Content-Type", "application/json")
                .body(result);
    }
    
    @PostMapping("/generate/{connectionId}")
    public ResponseEntity<String> generateSql(@PathVariable long connectionId, @RequestBody GenerateRequest request) {
        String sql = llmService.generateSql(connectionId, request.getNaturalLanguageQuery());
        return ResponseEntity.ok(sql);
    }
    
    // 内部类，用于接收前端发送的查询请求
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
    
    // 内部类，用于接收前端发送的生成请求
    public static class GenerateRequest {
        private String naturalLanguageQuery;
        
        public String getNaturalLanguageQuery() {
            return naturalLanguageQuery;
        }
        
        public void setNaturalLanguageQuery(String naturalLanguageQuery) {
            this.naturalLanguageQuery = naturalLanguageQuery;
        }
    }
}