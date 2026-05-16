package com.sqlserver.mcp.model.schema;

import java.util.List;

public record ViewInfo(
    String name,
    String schema,
    String definition,
    List<ColumnInfo> columns
) {
    public ViewInfo {
        if (schema == null || schema.isBlank()) schema = "dbo";
        columns = columns != null ? List.copyOf(columns) : List.of();
    }
}
