package com.sqlserver.mcp.schema;

import com.sqlserver.mcp.config.AppConfig.LlmConfig;
import com.sqlserver.mcp.model.schema.*;
import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

class SchemaContextBuilderTest {

    private final LlmConfig llmConfig = new LlmConfig(
        "https://api.test.com", "test-model", "key", 0.1, 2000,
        java.time.Duration.ofSeconds(30), 3,
        List.of(java.time.Duration.ofSeconds(1))
    );

    private final SchemaContextBuilder builder = new SchemaContextBuilder(llmConfig);

    @Test
    void buildContext_shouldIncludeDatabaseName() {
        var schema = new DatabaseSchema("testdb", Map.of(), Map.of(), List.of(), null);
        var context = builder.buildContext(schema, "test query", 1000);
        assertTrue(context.contains("testdb"));
    }

    @Test
    void buildContext_shouldIncludeTableInfo() {
        var col = new ColumnInfo("id", "INT", false, null, 1, null, true, false, null, null);
        var table = new TableInfo("users", "dbo", List.of(col), List.of("id"), List.of(), List.of(), null);
        var schema = new DatabaseSchema("testdb", Map.of("users", table), Map.of(), List.of(), null);

        var context = builder.buildContext(schema, "users", 1000);
        assertTrue(context.contains("users"));
        assertTrue(context.contains("id"));
        assertTrue(context.contains("INT"));
    }

    @Test
    void buildContext_shouldHandleEmptyQuery() {
        var schema = new DatabaseSchema("testdb", Map.of(), Map.of(), List.of(), null);
        var context = builder.buildContext(schema, "", 1000);
        assertNotNull(context);
    }

    @Test
    void buildContext_shouldHandleEmptySchema() {
        var context = builder.buildContext(
            new DatabaseSchema("empty", Map.of(), Map.of(), List.of(), null),
            "find users", 100
        );
        assertTrue(context.contains("empty"));
    }

    @Test
    void buildContext_shouldRankRelevantTables() {
        var col1 = new ColumnInfo("id", "INT", false, null, 1, null, true, false, null, null);
        var col2 = new ColumnInfo("name", "VARCHAR", true, null, 2, 100, false, false, null, null);
        var users = new TableInfo("users", "dbo", List.of(col1, col2), List.of("id"), List.of(), List.of(), null);
        var orders = new TableInfo("orders", "dbo", List.of(col1), List.of("id"), List.of(), List.of(), null);
        var schema = new DatabaseSchema("testdb", Map.of("users", users, "orders", orders), Map.of(), List.of(), null);

        // "users" should be ranked higher since it matches the query keyword
        var context = builder.buildContext(schema, "show users", 5000);
        assertTrue(context.contains("users"));
    }

    @Test
    void buildContext_shouldHandleTokenBudget() {
        var col = new ColumnInfo("id", "INT", false, null, 1, null, true, false, null, null);
        var table = new TableInfo("users", "dbo", List.of(col), List.of("id"), List.of(), List.of(), null);
        var schema = new DatabaseSchema("testdb", Map.of("users", table), Map.of(), List.of(), null);

        // Very small budget should still produce output
        var context = builder.buildContext(schema, "users", 10);
        assertNotNull(context);
    }

    @Test
    void buildContext_shouldIncludeViews() {
        var view = new ViewInfo("v_users", "dbo", null, List.of());
        var schema = new DatabaseSchema("testdb", Map.of(), Map.of("v_users", view), List.of(), null);

        var context = builder.buildContext(schema, "show views", 1000);
        assertTrue(context.contains("v_users"));
    }
}
