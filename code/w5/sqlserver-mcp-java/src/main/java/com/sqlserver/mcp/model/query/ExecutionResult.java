package com.sqlserver.mcp.model.query;

import com.sqlserver.mcp.execution.CollectResult;
import org.jspecify.annotations.Nullable;

public record ExecutionResult(
    CollectResult data,
    int totalRows,
    String executedSql,
    @Nullable Double verificationScore,
    boolean verificationPassed
) {
    public ExecutionResult(CollectResult data, int totalRows, String executedSql) {
        this(data, totalRows, executedSql, null, true);
    }

    public ExecutionResult withVerification(double score) {
        return new ExecutionResult(data, totalRows, executedSql, score, score >= 0.8);
    }
}
