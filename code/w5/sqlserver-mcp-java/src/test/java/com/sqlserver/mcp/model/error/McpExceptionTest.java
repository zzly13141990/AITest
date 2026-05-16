package com.sqlserver.mcp.model.error;

import org.junit.jupiter.api.Test;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

class McpExceptionTest {

    @Test
    void invalidInputException_shouldSetCorrectErrorCode() {
        var ex = new InvalidInputException("bad input");
        assertEquals("INVALID_INPUT", ex.errorCode());
        assertFalse(ex.isRetryable());
    }

    @Test
    void invalidInputException_shouldAcceptDetails() {
        var ex = new InvalidInputException("bad", Map.of("field", "name"));
        assertEquals("name", ex.details().get("field"));
    }

    @Test
    void readOnlyViolationException_shouldSetCorrectCode() {
        var ex = new ReadOnlyViolationException("INSERT");
        assertEquals("READ_ONLY_VIOLATION", ex.errorCode());
        assertFalse(ex.isRetryable());
    }

    @Test
    void sqlSyntaxException_shouldNotBeRetryable() {
        var ex = new SqlSyntaxException("SELECT * FROM", "syntax error");
        assertFalse(ex.isRetryable());
    }

    @Test
    void sqlObjectNotFoundException_shouldNotBeRetryable() {
        var ex = new SqlObjectNotFoundException("my_table");
        assertFalse(ex.isRetryable());
    }

    @Test
    void queryTimeoutException_shouldBeRetryable() {
        var ex = new QueryTimeoutException(30L);
        assertTrue(ex.isRetryable());
    }

    @Test
    void dbConnectionException_shouldBeRetryable() {
        var ex = new DbConnectionException("mydb", "connection refused");
        assertTrue(ex.isRetryable());
    }

    @Test
    void llmApiException_shouldBeRetryable() {
        var ex = new LlmApiException("rate limited");
        assertTrue(ex.isRetryable());
    }

    @Test
    void llmOutputParseException_shouldNotBeRetryable() {
        var ex = new LlmOutputParseException("invalid output");
        assertFalse(ex.isRetryable());
    }

    @Test
    void schemaNotFoundException_shouldNotBeRetryable() {
        var ex = new SchemaNotFoundException("unknown_db");
        assertFalse(ex.isRetryable());
    }

    @Test
    void internalException_shouldNotBeRetryable() {
        var ex = new InternalException("internal failure");
        assertFalse(ex.isRetryable());
    }

    @Test
    void mcpException_shouldProvideSuggestion() {
        var ex = new InvalidInputException("bad");
        assertNotNull(ex.suggestion());
    }

    @Test
    void mcpException_shouldProvideEmptyDetailsByDefault() {
        var ex = new InvalidInputException("bad");
        assertTrue(ex.details().isEmpty());
    }

    @Test
    void mcpException_details_areUnmodifiable() {
        var ex = new InvalidInputException("bad", Map.of("key", "value"));
        assertThrows(UnsupportedOperationException.class, () -> ex.details().put("x", "y"));
    }
}
