package com.sqlserver.mcp.schema;

import com.sqlserver.mcp.model.schema.DatabaseSchema;

@FunctionalInterface
public interface SchemaProvider {
    DatabaseSchema getSchema(String databaseName);
}
