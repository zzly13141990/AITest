package com.sqlserver.mcp.model.schema;

import java.util.List;

public record IndexInfo(
    String name,
    String type,
    List<String> columns,
    boolean unique
) {
    public IndexInfo {
        columns = columns != null ? List.copyOf(columns) : List.of();
    }
}
