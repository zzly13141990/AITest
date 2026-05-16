package com.sqlserver.mcp.execution;

import com.sqlserver.mcp.util.JsonUtils;
import org.junit.jupiter.api.Test;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class JsonFormatterTest {

    private final JsonFormatter formatter = new JsonFormatter();

    @Test
    void format_shouldProduceJson() {
        var data = new CollectResult(
            List.of("id", "name"),
            List.of(List.of(1, "Alice"), List.of(2, "Bob")),
            2, false, 100
        );
        var json = formatter.format(data);
        assertNotNull(json);
        assertTrue(json.contains("columns"));
        assertTrue(json.contains("rows"));
        assertTrue(json.contains("total_rows"));
        assertTrue(json.contains("truncated"));

        // Verify valid JSON
        var parsed = JsonUtils.fromJson(json, java.util.Map.class);
        assertNotNull(parsed);
    }

    @Test
    void format_shouldHandleEmptyResult() {
        var data = new CollectResult(
            List.of("id"), List.of(),
            0, false, 0
        );
        var json = formatter.format(data);
        assertNotNull(json);
        assertTrue(json.contains("\"total_rows\":0"));
    }
}
