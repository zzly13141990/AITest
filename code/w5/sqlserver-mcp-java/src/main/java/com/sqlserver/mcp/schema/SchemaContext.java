package com.sqlserver.mcp.schema;

import com.sqlserver.mcp.model.schema.DatabaseSchema;

public record SchemaContext(
    DatabaseSchema schema,
    String originalQuery,
    int tokenBudget
) {}
