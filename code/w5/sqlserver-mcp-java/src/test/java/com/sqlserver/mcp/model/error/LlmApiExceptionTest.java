package com.sqlserver.mcp.model.error;

import org.junit.jupiter.api.Test;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

class LlmApiExceptionTest {

    @Test
    void constructor_withCause_shouldWrapMessage() {
        var cause = new RuntimeException("connection timeout");
        var ex = new LlmApiException("API call failed", cause);
        assertTrue(ex.getMessage().contains("connection timeout"));
        assertTrue(ex.isRetryable());
    }

    @Test
    void constructor_withMessageOnly() {
        var ex = new LlmApiException("rate limited");
        assertEquals("LLM_API_ERROR", ex.errorCode());
    }
}
