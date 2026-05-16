package com.sqlserver.mcp.model.query;

import com.sqlserver.mcp.config.AppConfig;
import com.sqlserver.mcp.execution.CollectResult;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class QueryResponseTest {

    @Test
    void success_shouldBuildCallToolResult() {
        var meta = new QueryResponse.Meta("db", "execute", "SELECT 1", 1, 1, 1, 100, 1.0, true, 10);
        var success = new QueryResponse.Success("result", meta);
        var toolResult = success.toCallToolResult();
        assertFalse(toolResult.isError());
        assertNotNull(toolResult.content());
    }

    @Test
    void sqlOnly_shouldBuildCallToolResult() {
        var sqlOnly = new QueryResponse.SqlOnly("SELECT 1");
        var toolResult = sqlOnly.toCallToolResult();
        assertFalse(toolResult.isError());
    }

    @Test
    void error_shouldBuildCallToolResult() {
        var error = new QueryResponse.Error("ERR", "msg", "suggestion", java.util.Map.of());
        var toolResult = error.toCallToolResult();
        assertTrue(toolResult.isError());
    }

    @Test
    void error_fromMcpException_shouldMapFields() {
        var ex = new com.sqlserver.mcp.model.error.InvalidInputException("bad input");
        var error = QueryResponse.error(ex);
        assertEquals("INVALID_INPUT", error.errorCode());
    }

    @Test
    void meta_shouldStoreAllFields() {
        var meta = new QueryResponse.Meta("db", "sql_only", "SELECT 1", 0, 0, 1, 100, 1.0, true, 5);
        assertEquals("db", meta.database());
        assertEquals("SELECT 1", meta.sql());
        assertEquals(1.0, meta.verificationScore());
        assertTrue(meta.verificationPassed());
    }
}
