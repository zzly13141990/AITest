package com.sqlserver.mcp.model.schema;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;

public record DatabaseSchema(
    String databaseName,
    Map<String, TableInfo> tables,
    Map<String, ViewInfo> views,
    List<String> userDefinedTypes,
    Instant cachedAt
) {
    public DatabaseSchema {
        tables = tables != null ? Collections.unmodifiableMap(tables) : Map.of();
        views = views != null ? Collections.unmodifiableMap(views) : Map.of();
        userDefinedTypes = userDefinedTypes != null ? List.copyOf(userDefinedTypes) : List.of();
        if (cachedAt == null) cachedAt = Instant.now();
    }
}
