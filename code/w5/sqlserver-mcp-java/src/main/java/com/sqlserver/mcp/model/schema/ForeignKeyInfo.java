package com.sqlserver.mcp.model.schema;

public record ForeignKeyInfo(
    String columnName,
    String referencedSchema,
    String referencedTable,
    String referencedColumn
) {
    public ForeignKeyInfo {
        if (referencedSchema == null || referencedSchema.isBlank()) referencedSchema = "dbo";
    }
}
