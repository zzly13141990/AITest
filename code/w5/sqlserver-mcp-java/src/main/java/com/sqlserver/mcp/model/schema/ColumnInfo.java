package com.sqlserver.mcp.model.schema;

public record ColumnInfo(
    String name,
    String dataType,
    boolean nullable,
    String defaultValue,
    int ordinalPosition,
    Integer maxLength,
    boolean primaryKey,
    boolean foreignKey,
    String foreignKeyRef,
    String comment
) {}
