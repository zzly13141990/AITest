package com.sqlserver.mcp.pipeline;

public record StageMetrics(
    String stageName,
    long durationMs,
    boolean success
) {}
