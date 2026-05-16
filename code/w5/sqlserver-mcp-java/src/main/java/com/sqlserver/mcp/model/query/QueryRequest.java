package com.sqlserver.mcp.model.query;

import org.jspecify.annotations.Nullable;

public record QueryRequest(
    String query,
    @Nullable String database,
    @Nullable Mode mode,
    @Nullable Integer page,
    @Nullable Integer pageSize,
    @Nullable OutputFormat outputFormat
) {
    public enum Mode { sql_only, execute }
    public enum OutputFormat { text, json }

    public QueryRequest {
        if (query == null || query.isBlank()) throw new IllegalArgumentException("query must not be blank");
    }

    public boolean isExecuteMode() {
        return mode == null || mode == Mode.execute;
    }

    public int effectivePage() {
        return page != null && page >= 1 ? page : 1;
    }

    public int effectivePageSize(int defaultPageSize, int maxPageSize) {
        var ps = pageSize != null ? pageSize : defaultPageSize;
        return Math.min(Math.max(ps, 1), maxPageSize);
    }

    public OutputFormat effectiveOutputFormat() {
        return outputFormat != null ? outputFormat : OutputFormat.text;
    }
}
