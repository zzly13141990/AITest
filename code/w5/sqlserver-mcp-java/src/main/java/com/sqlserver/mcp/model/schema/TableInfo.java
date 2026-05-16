package com.sqlserver.mcp.model.schema;

import java.util.Collections;
import java.util.List;

public record TableInfo(
    String name,
    String schema,
    List<ColumnInfo> columns,
    List<String> primaryKeys,
    List<ForeignKeyInfo> foreignKeys,
    List<IndexInfo> indexes,
    String comment
) {
    public TableInfo {
        if (schema == null || schema.isBlank()) schema = "dbo";
        columns = columns != null ? List.copyOf(columns) : List.of();
        primaryKeys = primaryKeys != null ? List.copyOf(primaryKeys) : List.of();
        foreignKeys = foreignKeys != null ? List.copyOf(foreignKeys) : List.of();
        indexes = indexes != null ? List.copyOf(indexes) : List.of();
    }
}
