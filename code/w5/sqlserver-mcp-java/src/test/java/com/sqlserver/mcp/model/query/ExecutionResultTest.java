package com.sqlserver.mcp.model.query;

import com.sqlserver.mcp.execution.CollectResult;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class ExecutionResultTest {

    @Test
    void constructor_shouldDefaultVerification() {
        var data = new CollectResult(List.of("id"), List.of(List.of(1)), 1, false, 10);
        var result = new ExecutionResult(data, 1, "SELECT 1");
        assertNull(result.verificationScore());
        assertTrue(result.verificationPassed());
    }

    @Test
    void withVerification_shouldCreateNewInstance() {
        var data = new CollectResult(List.of("id"), List.of(List.of(1)), 1, false, 10);
        var result = new ExecutionResult(data, 1, "SELECT 1");
        var updated = result.withVerification(0.5);
        assertEquals(0.5, updated.verificationScore());
        assertFalse(updated.verificationPassed());
        // original unchanged
        assertNull(result.verificationScore());
    }
}
