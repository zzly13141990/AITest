package com.sqlserver.mcp.execution;

import java.util.List;

public record CollectResult(
    List<String> columns,
    List<List<Object>> rows,
    int totalRows,
    boolean truncated,
    long byteSize
) {}
