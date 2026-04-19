package com.projectalpha.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public class QueryResultDTO {
    private List<String> columns;
    private List<Map<String, Object>> rows;
    private Integer rowCount;
    private Long executionTimeMs;

    public QueryResultDTO() {
    }

    public QueryResultDTO(List<String> columns, List<Map<String, Object>> rows, Integer rowCount, Long executionTimeMs) {
        this.columns = columns;
        this.rows = rows;
        this.rowCount = rowCount;
        this.executionTimeMs = executionTimeMs;
    }

    public List<String> getColumns() {
        return columns;
    }

    public void setColumns(List<String> columns) {
        this.columns = columns;
    }

    public List<Map<String, Object>> getRows() {
        return rows;
    }

    public void setRows(List<Map<String, Object>> rows) {
        this.rows = rows;
    }

    public Integer getRowCount() {
        return rowCount;
    }

    public void setRowCount(Integer rowCount) {
        this.rowCount = rowCount;
    }

    @JsonProperty("executionTimeMs")
    public Long getExecutionTimeMs() {
        return executionTimeMs;
    }

    public void setExecutionTimeMs(Long executionTimeMs) {
        this.executionTimeMs = executionTimeMs;
    }
}