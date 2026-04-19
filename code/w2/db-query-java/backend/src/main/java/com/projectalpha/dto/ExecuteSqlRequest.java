package com.projectalpha.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ExecuteSqlRequest {
    @NotBlank(message = "SQL is required")
    private String sql;

    @NotNull(message = "Connection ID is required")
    private Long connectionId;

    public ExecuteSqlRequest() {
    }

    public ExecuteSqlRequest(String sql, Long connectionId) {
        this.sql = sql;
        this.connectionId = connectionId;
    }

    public String getSql() {
        return sql;
    }

    public void setSql(String sql) {
        this.sql = sql;
    }

    public Long getConnectionId() {
        return connectionId;
    }

    public void setConnectionId(Long connectionId) {
        this.connectionId = connectionId;
    }
}